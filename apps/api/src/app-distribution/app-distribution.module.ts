import { Module } from '@nestjs/common';

import { PrismaModule } from '../common/prisma/prisma.module';
import {
  AdminAppDistributionController,
  PublicAppDistributionController,
} from './app-distribution.controller';
import { AppDistributionService } from './app-distribution.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminAppDistributionController,
    PublicAppDistributionController,
  ],
  providers: [AppDistributionService],
  exports: [AppDistributionService],
})
export class AppDistributionModule {}
