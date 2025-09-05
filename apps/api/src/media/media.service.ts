import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaService {
  async getMedia() {
    return { message: 'Media files' };
  }
}
