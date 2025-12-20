import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BlogModule } from '../blog/blog.module';
import { CommentModule } from '../comment/comment.module';
import { UserModule } from '../user/user.module';
import { SiteConfigModule } from '../site-config/site-config.module';
import { ContentModerationService } from '../common/services/content-moderation.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BlogModule,
    CommentModule,
    UserModule,
    SiteConfigModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    ContentModerationService,
  ],
  exports: [AdminService],
})
export class AdminModule {}
