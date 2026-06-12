import { Module } from '@nestjs/common';
import { FriendLinkService } from './friend-link.service';
import { FriendLinkController } from './friend-link.controller';

@Module({
  controllers: [FriendLinkController],
  providers: [FriendLinkService],
  exports: [FriendLinkService],
})
export class FriendLinkModule {}
