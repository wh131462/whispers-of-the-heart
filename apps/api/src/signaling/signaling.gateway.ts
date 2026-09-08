import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface RoomMember {
  socketId: string;
  peerId: string;
  name: string;
}

interface JoinPayload {
  roomCode: string;
  peerId: string;
  name: string;
}

interface SignalPayload {
  roomCode: string;
  targetPeerId: string;
  signal: unknown;
  targetSessionId?: string;
}

interface MessagePayload {
  roomCode: string;
  targetPeerId?: string;
  data: unknown;
}

@WebSocketGateway({
  path: '/signaling',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class SignalingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // 房间成员: roomCode -> Map<peerId, RoomMember>
  private rooms = new Map<string, Map<string, RoomMember>>();
  // socket 到房间的映射
  private socketToRoom = new Map<
    string,
    { roomCode: string; peerId: string }
  >();

  handleConnection(client: Socket) {
    console.log(`[Signaling] Client connected: ${client.id}`);

    // 监听断开原因
    client.on('disconnect', (reason) => {
      console.log(
        `[Signaling] Client ${client.id} disconnect reason: ${reason}`,
      );
    });

    // 监听错误
    client.on('error', (error) => {
      console.error(`[Signaling] Client ${client.id} error:`, error);
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`[Signaling] Client disconnected: ${client.id}`);
    const info = this.socketToRoom.get(client.id);
    if (info) {
      this.removeFromRoom(client, info.roomCode, info.peerId);
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    const { roomCode, peerId, name } = payload ?? {};
    if (
      ![roomCode, peerId, name].every(
        (value) =>
          typeof value === 'string' && value.length > 0 && value.length <= 256,
      )
    ) {
      return { success: false, error: 'Invalid room member' };
    }
    const previous = this.socketToRoom.get(client.id);
    if (
      previous &&
      (previous.roomCode !== roomCode || previous.peerId !== peerId)
    ) {
      this.removeFromRoom(client, previous.roomCode, previous.peerId);
    }
    console.log(`[Signaling] ${name} (${peerId}) joining room: ${roomCode}`);

    // 加入 socket.io 房间
    client.join(roomCode);

    // 获取或创建房间
    if (!this.rooms.has(roomCode)) {
      this.rooms.set(roomCode, new Map());
    }
    const room = this.rooms.get(roomCode)!;
    const replaced = room.get(peerId);
    if (replaced && replaced.socketId !== client.id) {
      // Revoke the old Socket before it can forward signals or remove its replacement.
      this.socketToRoom.delete(replaced.socketId);
      this.server.sockets.sockets.get(replaced.socketId)?.leave(roomCode);
      this.server.to(replaced.socketId).emit('session-replaced');
    }

    // 获取现有成员列表（排除自己）
    const existingMembers = Array.from(room.values()).filter(
      (m) => m.peerId !== peerId,
    );

    // 添加到房间
    room.set(peerId, { socketId: client.id, peerId, name });
    this.socketToRoom.set(client.id, { roomCode, peerId });

    // 通知现有成员有新人加入
    if (replaced?.socketId !== client.id)
      existingMembers.forEach((member) => {
        this.server.to(member.socketId).emit('peer-joined', {
          peerId,
          name,
          sessionId: client.id,
        });
      });

    // 返回现有成员列表给新加入者
    return {
      success: true,
      members: existingMembers.map((m) => ({
        peerId: m.peerId,
        name: m.name,
        sessionId: m.socketId,
      })),
    };
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomCode: string; peerId: string },
  ) {
    const { roomCode, peerId } = payload;
    const info = this.socketToRoom.get(client.id);
    if (info?.roomCode !== roomCode || info.peerId !== peerId) {
      return { success: false, error: 'Not in room' };
    }
    this.removeFromRoom(client, roomCode, peerId);
    return { success: true };
  }

  @SubscribeMessage('signal')
  handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SignalPayload,
  ) {
    const { roomCode, targetPeerId, signal, targetSessionId } = payload;
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    const info = this.socketToRoom.get(client.id);
    if (
      info?.roomCode !== roomCode ||
      room.get(info.peerId)?.socketId !== client.id
    )
      return { success: false, error: 'Not in room' };

    const target = room.get(targetPeerId);
    if (!target) return { success: false, error: 'Target not found' };
    if (targetSessionId && target.socketId !== targetSessionId)
      return { success: false, error: 'Stale target session' };

    // 转发信号给目标
    this.server.to(target.socketId).emit('signal', {
      fromPeerId: info.peerId,
      fromSessionId: client.id,
      signal,
    });

    return { success: true };
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessagePayload,
  ) {
    const { roomCode, targetPeerId, data } = payload;
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found' };

    const info = this.socketToRoom.get(client.id);
    if (
      info?.roomCode !== roomCode ||
      room.get(info.peerId)?.socketId !== client.id
    )
      return { success: false, error: 'Not in room' };

    if (targetPeerId) {
      // 发送给特定 peer
      const target = room.get(targetPeerId);
      if (target) {
        this.server.to(target.socketId).emit('message', {
          fromPeerId: info.peerId,
          data,
        });
      }
    } else {
      // 广播给房间所有人（除了自己）
      room.forEach((member, peerId) => {
        if (peerId !== info.peerId) {
          this.server.to(member.socketId).emit('message', {
            fromPeerId: info.peerId,
            data,
          });
        }
      });
    }

    return { success: true };
  }

  private removeFromRoom(client: Socket, roomCode: string, peerId: string) {
    const room = this.rooms.get(roomCode);
    const info = this.socketToRoom.get(client.id);
    if (info?.roomCode !== roomCode || info.peerId !== peerId) return;
    this.socketToRoom.delete(client.id);
    client.leave(roomCode);

    const member = room?.get(peerId);
    if (room && member?.socketId === client.id) {
      room.delete(peerId);

      // 通知其他成员
      room.forEach((m) => {
        this.server.to(m.socketId).emit('peer-left', {
          peerId,
          name: member.name,
          sessionId: member.socketId,
        });
      });

      // 如果房间空了，删除房间
      if (room.size === 0) {
        this.rooms.delete(roomCode);
      }
    }
  }
}
