import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private adminClients: Map<string, Socket> = new Map();

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.adminClients.delete(client.id);
  }

  // 管理员加入房间
  @SubscribeMessage('joinAdmin')
  handleJoinAdmin(client: Socket) {
    this.adminClients.set(client.id, client);
    client.join('admin');
    this.logger.log(`Admin joined: ${client.id}`);
    return { success: true, message: 'Joined admin room' };
  }

  // 管理员离开房间
  @SubscribeMessage('leaveAdmin')
  handleLeaveAdmin(client: Socket) {
    this.adminClients.delete(client.id);
    client.leave('admin');
    this.logger.log(`Admin left: ${client.id}`);
    return { success: true, message: 'Left admin room' };
  }

  // 推送新评论通知给管理员
  notifyNewComment(comment: any) {
    this.server.to('admin').emit('newComment', {
      type: 'NEW_COMMENT',
      data: comment,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`New comment notification sent: ${comment.id}`);
  }

  // 推送评论状态更新
  notifyCommentStatusChange(comment: any, action: string) {
    this.server.to('admin').emit('commentStatusChange', {
      type: 'COMMENT_STATUS_CHANGE',
      action,
      data: comment,
      timestamp: new Date().toISOString(),
    });
  }

  // 推送评论统计更新
  notifyStatsUpdate(stats: any) {
    this.server.to('admin').emit('statsUpdate', {
      type: 'STATS_UPDATE',
      data: stats,
      timestamp: new Date().toISOString(),
    });
  }

  // 获取在线管理员数量
  getOnlineAdminCount(): number {
    return this.adminClients.size;
  }
}
