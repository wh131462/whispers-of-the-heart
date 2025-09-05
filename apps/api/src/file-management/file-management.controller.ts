import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UploadedFile, 
  UseInterceptors,
  ParseIntPipe,
  UseGuards,
  Request
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileManagementService } from './file-management.service';
import { 
  CreateFolderDto, 
  UpdateFolderDto, 
  UploadFileDto, 
  UpdateFileDto,
} from './dto/file-management.dto';

@Controller('file-management')
@UseGuards(JwtAuthGuard)
export class FileManagementController {
  constructor(
    private readonly fileManagementService: FileManagementService,
    private readonly configService: ConfigService
  ) {}

  // 文件夹管理
  @Post('folders')
  async createFolder(@Body() createFolderDto: CreateFolderDto, @Request() req) {
    try {
      const folder = await this.fileManagementService.createFolder(createFolderDto, req.user.id);
      return {
        success: true,
        data: folder,
        message: 'Folder created successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to create folder'
      };
    }
  }

  @Get('folders')
  async getFolders(@Query('parentId') parentId?: string) {
    try {
      const folders = await this.fileManagementService.getFolders(parentId);
      return {
        success: true,
        data: folders,
        message: 'Folders retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to retrieve folders'
      };
    }
  }

  @Get('folders/tree')
  async getFolderTree() {
    try {
      const tree = await this.fileManagementService.getFolderTree();
      return {
        success: true,
        data: tree,
        message: 'Folder tree retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to retrieve folder tree'
      };
    }
  }

  @Put('folders/:id')
  async updateFolder(@Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto) {
    try {
      const folder = await this.fileManagementService.updateFolder(id, updateFolderDto);
      return {
        success: true,
        data: folder,
        message: 'Folder updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to update folder'
      };
    }
  }

  @Delete('folders/:id')
  async deleteFolder(@Param('id') id: string) {
    try {
      await this.fileManagementService.deleteFolder(id);
      return {
        success: true,
        data: null,
        message: 'Folder deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to delete folder'
      };
    }
  }

  // 文件管理
  @Post('files/upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  }))
  async uploadFile(
    @Body() body: any,
    @UploadedFile() file: any,
    @Request() req
  ) {
    try {
      if (!file) {
        return {
          success: false,
          data: null,
          message: 'No file uploaded'
        };
      }

      // 处理 tags 字段
      let tags: string[] = [];
      if (body.tags) {
        try {
          tags = JSON.parse(body.tags);
        } catch {
          // 如果不是 JSON 格式，按逗号分割
          tags = body.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
        }
      }

      const uploadFileDto: UploadFileDto = {
        folderId: body.folderId,
        description: body.description,
        tags: tags,
        isPublic: body.isPublic === 'true'
      };

      const userId = req.user?.id || req.user?.sub;

      const uploadedFile = await this.fileManagementService.uploadFile(uploadFileDto, userId, file);
      return {
        success: true,
        data: uploadedFile,
        message: 'File uploaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to upload file'
      };
    }
  }

  @Get('files')
  async getFiles(
    @Query('folderId') folderId?: string,
    @Query('search') search?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    try {
      const result = await this.fileManagementService.getFiles(folderId, page, limit, search);
      return {
        success: true,
        data: result,
        message: 'Files retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to retrieve files'
      };
    }
  }

  @Get('files/:id')
  async getFileById(@Param('id') id: string) {
    try {
      const file = await this.fileManagementService.getFileById(id);
      return {
        success: true,
        data: file,
        message: 'File retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to retrieve file'
      };
    }
  }

  @Put('files/:id')
  async updateFile(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    try {
      const file = await this.fileManagementService.updateFile(id, updateFileDto);
      return {
        success: true,
        data: file,
        message: 'File updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to update file'
      };
    }
  }

  @Delete('files/:id')
  async deleteFile(@Param('id') id: string) {
    try {
      await this.fileManagementService.deleteFile(id);
      return {
        success: true,
        data: null,
        message: 'File deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to delete file'
      };
    }
  }

  @Post('files/:id/download')
  async downloadFile(@Param('id') id: string) {
    try {
      const file = await this.fileManagementService.getFileById(id);
      await this.fileManagementService.incrementDownloadCount(id);
      return {
        success: true,
        data: file,
        message: 'File download initiated'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to download file'
      };
    }
  }

  // 修复文件URL
  @Post('fix-urls')
  async fixFileUrls() {
    try {
      const result = await this.fileManagementService.fixFileUrls();
      return {
        success: true,
        data: result,
        message: 'File URLs fixed successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fix file URLs'
      };
    }
  }

  // 修复文件存储结构
  @Post('fix-storage')
  async fixFileStorage() {
    try {
      const result = await this.fileManagementService.fixFileStorage();
      return {
        success: true,
        data: result,
        message: 'File storage structure fixed successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fix file storage structure'
      };
    }
  }

  // 统计信息
  @Get('stats')
  async getFileStats() {
    try {
      const stats = await this.fileManagementService.getFileStats();
      return {
        success: true,
        data: stats,
        message: 'File statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to retrieve file statistics'
      };
    }
  }
}
