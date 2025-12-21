import { Module, Global } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

@Global()
@Module({
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class NotificationModule {}
