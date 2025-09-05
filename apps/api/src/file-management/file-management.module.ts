import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { FileManagementController } from './file-management.controller';
import { FileManagementService } from './file-management.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        dest: './uploads', // 临时上传目录
        limits: {
          fileSize: parseInt(configService.get('MAX_FILE_SIZE', '52428800')), // 50MB 默认
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FileManagementController],
  providers: [FileManagementService],
  exports: [FileManagementService],
})
export class FileManagementModule {}
