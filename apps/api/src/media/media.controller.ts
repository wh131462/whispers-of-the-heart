import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async getMedia() {
    return { message: 'Media files' };
  }
}
