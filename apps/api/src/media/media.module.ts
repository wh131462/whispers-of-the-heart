import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaUsageService } from './media-usage.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [MediaService, MediaUsageService],
  exports: [MediaService, MediaUsageService],
})
export class MediaModule {}
