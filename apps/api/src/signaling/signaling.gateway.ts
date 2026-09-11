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
  relayVersion?: number;
}

interface JoinPayload {
  roomCode: string;
  peerId: string;
  name: string;
  relayVersion?: number;
}

interface RelayPayload {
  roomCode: string;
  targetPeerId: string;
  targetSessionId: string;
  message: string;
}

const MAX_RELAY_BYTES = 32 * 1024;
const MAX_RELAY_IN_FLIGHT = 8;
const RELAY_BYTES_PER_SECOND = 2 * 1024 * 1024;

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
  private relayLimits = new Map<
    string,
    { inFlight: number; bytes: number; windowStart: number }
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
    this.relayLimits.delete(client.id);
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
    const relayVersion = payload.relayVersion === 1 ? 1 : undefined;
    room.set(peerId, { socketId: client.id, peerId, name, relayVersion });
    this.socketToRoom.set(client.id, { roomCode, peerId });

    // 通知现有成员有新人加入
    if (replaced?.socketId !== client.id)
      existingMembers.forEach((member) => {
        this.server.to(member.socketId).emit('peer-joined', {
          peerId,
          name,
          sessionId: client.id,
          relayVersion,
        });
      });

    // 返回现有成员列表给新加入者
    return {
      success: true,
      relayVersion: 1,
      members: existingMembers.map((m) => ({
        peerId: m.peerId,
        name: m.name,
        sessionId: m.socketId,
        relayVersion: m.relayVersion,
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

  @SubscribeMessage('relay')
  async handleRelay(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: RelayPayload,
  ): Promise<{ success: boolean; error?: string }> {
    if (
      !payload ||
      typeof payload.message !== 'string' ||
      Buffer.byteLength(payload.message, 'utf8') > MAX_RELAY_BYTES ||
      typeof payload.targetSessionId !== 'string'
    )
      return { success: false, error: 'Invalid relay packet' };

    const info = this.socketToRoom.get(client.id);
    const room = this.rooms.get(payload.roomCode);
    const source = info && room?.get(info.peerId);
    const target = room?.get(payload.targetPeerId);
    if (
      info?.roomCode !== payload.roomCode ||
      source?.socketId !== client.id ||
      source.relayVersion !== 1 ||
      target?.socketId !== payload.targetSessionId ||
      target.relayVersion !== 1
    )
      return { success: false, error: 'Unavailable relay session' };

    const receiver = this.server.sockets.sockets.get(target.socketId);
    if (!receiver?.connected || !receiver.conn.transport.writable) {
      return { success: false, error: 'Receiver unavailable' };
    }
    const now = Date.now();
    const limit = this.relayLimits.get(client.id) ?? {
      inFlight: 0,
      bytes: 0,
      windowStart: now,
    };
    this.relayLimits.set(client.id, limit);
    if (now - limit.windowStart >= 1000) {
      limit.windowStart = now;
      limit.bytes = 0;
    }
    const bytes = Buffer.byteLength(payload.message, 'utf8');
    if (
      limit.inFlight >= MAX_RELAY_IN_FLIGHT ||
      limit.bytes + bytes > RELAY_BYTES_PER_SECOND
    ) {
      return { success: false, error: 'Relay busy' };
    }
    limit.inFlight += 1;
    limit.bytes += bytes;
    try {
      const reply: { success?: boolean } = await receiver
        .timeout(5000)
        .emitWithAck('relay', {
          fromPeerId: info.peerId,
          fromSessionId: client.id,
          targetSessionId: target.socketId,
          message: payload.message,
        });
      // An ACK from a replaced member cannot confirm the current session.
      return {
        success:
          reply?.success === true &&
          room?.get(info.peerId) === source &&
          room?.get(target.peerId) === target,
      };
    } catch {
      return { success: false, error: 'Relay acknowledgement timed out' };
    } finally {
      limit.inFlight -= 1;
    }
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
