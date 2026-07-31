import { Controller, Get, Header } from '@nestjs/common';
import {
  SignalingService,
  type IceServerConfigResponse,
} from './signaling.service';

@Controller('signaling')
export class SignalingController {
  constructor(private readonly signalingService: SignalingService) {}

  @Get('ice-servers')
  @Header('Cache-Control', 'no-store')
  getIceServers(): IceServerConfigResponse {
    return this.signalingService.getIceServers();
  }
}
