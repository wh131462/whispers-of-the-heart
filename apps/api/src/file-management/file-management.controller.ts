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
  Request,
  UsePipes
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileManagementService } from './file-management.service';
import {
  CreateFolderDto,
  UpdateFolderDto,
  UploadFileDto,
  UploadFileRawDto,
  UpdateFileDto,
} from './dto/file-management.dto';
import { SkipValidationPipe } from '../common/pipes/skip-validation.pipe';
import { fixFilenameEncoding, generateUniqueFilename } from '../common/utils/filename-encoding.util';

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
      const folder = await this.fileManagementService.createFolder(
        createFolderDto, 
        req.user.id, 
        req.user.role
      );
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
  async getFolders(@Request() req, @Query('parentId') parentId?: string) {
    try {
      const folders = await this.fileManagementService.getFolders(
        req.user.id, 
        req.user.role, 
        parentId
      );
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
  async getFolderTree(@Request() req) {
    try {
      const tree = await this.fileManagementService.getFolderTree(
        req.user.id, 
        req.user.role
      );
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

  @Get('folders/management-tree')
  async getManagementFolderTree(@Request() req) {
    try {
      // 只有管理员可以访问管理模式的文件夹树
      if (req.user.role !== 'ADMIN') {
        return {
          success: false,
          data: null,
          message: 'Access denied: Admin privileges required'
        };
      }

      const tree = await this.fileManagementService.getManagementFolderTree();
      return {
        success: true,
        data: tree,
        message: 'Management folder tree retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to retrieve management folder tree'
      };
    }
  }

  @Get('folders/management')
  async getManagementFolders(@Request() req, @Query('parentId') parentId?: string) {
    try {
      // 只有管理员可以访问管理模式的文件夹
      if (req.user.role !== 'ADMIN') {
        return {
          success: false,
          data: null,
          message: 'Access denied: Admin privileges required'
        };
      }

      const folders = await this.fileManagementService.getManagementFolders(parentId);
      return {
        success: true,
        data: folders,
        message: 'Management folders retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to retrieve management folders'
      };
    }
  }

  @Put('folders/:id')
  async updateFolder(@Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto, @Request() req) {
    try {
      const folder = await this.fileManagementService.updateFolder(
        id, 
        updateFolderDto, 
        req.user.id, 
        req.user.role
      );
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
  async deleteFolder(@Param('id') id: string, @Request() req) {
    try {
      await this.fileManagementService.deleteFolder(
        id, 
        req.user.id, 
        req.user.role
      );
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
    storage: diskStorage({
      destination: (req, file, cb) => {
        // 使用绝对路径确保目录正确
        const uploadsPath = path.join(process.cwd(), 'uploads');
        cb(null, uploadsPath);
      },
      filename: (req, file, cb) => {
        // 使用工具函数修复中文文件名编码问题
        const fixedName = fixFilenameEncoding(file.originalname);
        const uniqueFilename = generateUniqueFilename(fixedName);
        cb(null, uniqueFilename);
      },
    }),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, cb) => {
      // 修复中文文件名编码问题
      file.originalname = fixFilenameEncoding(file.originalname);
      cb(null, true);
    },
  }))
  @UsePipes(new SkipValidationPipe())
  async uploadFile(
    @UploadedFile() file: any,
    @Body() body: any, // 使用any类型避免DTO验证问题
    @Request() req
  ) {
    try {
      console.log('Upload request body:', body);
      console.log('Upload request body type:', typeof body);
      console.log('Upload request body keys:', Object.keys(body));
      console.log('Upload file object:', file);
      console.log('Upload file keys:', file ? Object.keys(file) : 'No file');
      
      if (!file) {
        return {
          success: false,
          data: null,
          message: 'No file uploaded'
        };
      }

      // 处理FormData中的字段，特别是tags字段需要手动解析
      let tags: string[] = [];
      console.log('body.tags:', body.tags);
      console.log('body.tags type:', typeof body.tags);
      
      if (body.tags) {
        try {
          // tags字段是从前端JSON.stringify()发送的，需要解析
          const parsedTags: any = JSON.parse(body.tags as unknown as string);
          console.log('parsed tags:', parsedTags);
          // 确保tags是字符串数组
          if (!Array.isArray(parsedTags)) {
            tags = [];
          } else {
            tags = parsedTags.filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0);
          }
        } catch (error) {
          console.warn('Failed to parse tags, using empty array:', error);
          tags = [];
        }
      }
      console.log('final tags:', tags);

      // 处理isPublic字段
      let isPublic = false;
      if (body.isPublic !== undefined) {
        if (typeof body.isPublic === 'string') {
          isPublic = body.isPublic === 'true';
        } else if (typeof body.isPublic === 'boolean') {
          isPublic = body.isPublic;
        }
      }

      // 手动验证和构建DTO
      const uploadFileDto: UploadFileDto = {
        folderId: body.folderId || undefined,
        description: body.description || undefined,
        tags: tags,
        isPublic: isPublic
      };

      // 手动验证DTO
      const validationErrors: string[] = [];
      if (uploadFileDto.folderId && typeof uploadFileDto.folderId !== 'string') {
        validationErrors.push('folderId must be a string');
      }
      if (uploadFileDto.description && typeof uploadFileDto.description !== 'string') {
        validationErrors.push('description must be a string');
      }
      if (uploadFileDto.tags && !Array.isArray(uploadFileDto.tags)) {
        validationErrors.push('tags must be an array');
      }
      if (uploadFileDto.isPublic !== undefined && typeof uploadFileDto.isPublic !== 'boolean') {
        validationErrors.push('isPublic must be a boolean');
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          data: null,
          message: validationErrors.join(', ')
        };
      }

      // 添加调试信息和用户验证
      console.log('User object:', req.user);
      console.log('User object keys:', req.user ? Object.keys(req.user) : 'No user object');
      console.log('req.user.id:', req.user?.id);
      console.log('req.user.sub:', req.user?.sub);
      console.log('User role:', req.user?.role);
      
      // 统一使用id字段，因为JWT策略现在返回id字段
      const userId = req.user?.id;
      console.log('Extracted userId:', userId);
      console.log('userId type:', typeof userId);
      console.log('userId value:', JSON.stringify(userId));
      
      if (!userId || userId === 'undefined' || userId === 'null') {
        return {
          success: false,
          data: null,
          message: 'User ID not found in request'
        };
      }

      const uploadedFile = await this.fileManagementService.uploadFile(
        uploadFileDto, 
        userId, 
        req.user.role, 
        file
      );
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

  @Get('directory/content')
  async getDirectoryContent(
    @Request() req,
    @Query('folderId') folderId?: string,
    @Query('search') search?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    try {
      console.log(`📂 获取目录内容请求 - folderId: ${folderId || 'root'}, 用户: ${req.user?.username}`);
      
      const result = await this.fileManagementService.getDirectoryContent(
        folderId, 
        req.user.id, 
        req.user.role, 
        search, 
        page, 
        limit
      );
      
      return {
        success: true,
        data: result,
        message: 'Directory content retrieved successfully'
      };
    } catch (error) {
      console.error('获取目录内容失败:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to retrieve directory content'
      };
    }
  }

  @Get('directory/management-content')
  async getManagementDirectoryContent(
    @Request() req,
    @Query('folderId') folderId?: string,
    @Query('search') search?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    try {
      if (req.user.role !== 'ADMIN') {
        return {
          success: false,
          data: null,
          message: 'Access denied. Admin role required.'
        };
      }

      console.log(`🔧 获取管理模式目录内容 - folderId: ${folderId || 'root'}`);
      
      const result = await this.fileManagementService.getManagementDirectoryContent(
        folderId, 
        search, 
        page, 
        limit
      );
      
      return {
        success: true,
        data: result,
        message: 'Management directory content retrieved successfully'
      };
    } catch (error) {
      console.error('获取管理模式目录内容失败:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to retrieve management directory content'
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
