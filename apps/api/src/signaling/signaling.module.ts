import { Module } from '@nestjs/common';
import { SignalingController } from './signaling.controller';
import { SignalingGateway } from './signaling.gateway';
import { SignalingService } from './signaling.service';

@Module({
  controllers: [SignalingController],
  providers: [SignalingGateway, SignalingService],
})
export class SignalingModule {}
