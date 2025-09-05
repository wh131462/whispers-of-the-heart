import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { ContentModerationService } from '../common/services/content-moderation.service';

@Module({
  controllers: [CommentController],
  providers: [CommentService, ContentModerationService],
  exports: [CommentService],
})
export class CommentModule {}
