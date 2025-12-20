import { Module } from '@nestjs/common';
import { SiteConfigService } from './site-config.service';
import { SiteConfigController } from './site-config.controller';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [SiteConfigController],
  providers: [SiteConfigService],
  exports: [SiteConfigService],
})
export class SiteConfigModule {}
