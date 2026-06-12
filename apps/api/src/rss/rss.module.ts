import { Module } from '@nestjs/common';
import { RssController } from './rss.controller';
import { RssService } from './rss.service';
import { BlogModule } from '../blog/blog.module';
import { SiteConfigModule } from '../site-config/site-config.module';

@Module({
  imports: [BlogModule, SiteConfigModule],
  controllers: [RssController],
  providers: [RssService],
})
export class RssModule {}
