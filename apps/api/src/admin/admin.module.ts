import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BlogService } from '../blog/blog.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, BlogService],
  exports: [AdminService],
})
export class AdminModule {}
