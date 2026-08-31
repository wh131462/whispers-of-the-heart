import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma/prisma.module';
import {
  AdminProjectShowcaseController,
  PublicProjectShowcaseController,
} from './project-showcase.controller';
import { ProjectShowcaseService } from './project-showcase.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    PublicProjectShowcaseController,
    AdminProjectShowcaseController,
  ],
  providers: [ProjectShowcaseService],
  exports: [ProjectShowcaseService],
})
export class ProjectShowcaseModule {}
