import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { ContentModerationService } from '../common/services/content-moderation.service';
import { SiteConfigModule } from '../site-config/site-config.module';

@Module({
  imports: [SiteConfigModule],
  controllers: [CommentController],
  providers: [CommentService, ContentModerationService],
  exports: [CommentService],
})
export class CommentModule {}
