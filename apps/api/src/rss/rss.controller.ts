import { Controller, Get, Header } from '@nestjs/common';
import { RssService } from './rss.service';

@Controller()
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Get('rss.xml')
  @Header('Content-Type', 'application/rss+xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600')
  async getRss(): Promise<string> {
    return this.rssService.generateRss();
  }
}
