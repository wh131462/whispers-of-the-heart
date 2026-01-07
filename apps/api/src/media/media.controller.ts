import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from './media.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

// Generate unique filename
const generateFilename = () => {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString('hex');
  return `${timestamp}-${random}`;
};

// 使用绝对路径确保上传目录一致
const uploadsDir = join(process.cwd(), 'uploads');

// 确保上传目录存在
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = diskStorage({
  destination: uploadsDir,
  filename: (req, file, callback) => {
    const uniqueSuffix = generateFilename();
    const ext = extname(file.originalname);
    callback(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter for allowed types
const fileFilter = (req: any, file: Express.Multer.File, callback: any) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('不支持的文件类型'), false);
  }
};

@ApiTags('媒体')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: '获取媒体列表' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('uploaderId') uploaderId?: string,
    @Request() req?: any,
  ) {
    const skip = (page - 1) * limit;
    const result = await this.mediaService.findAll({
      skip,
      take: limit,
      mimeType: type,
      search,
      uploaderId,
    });

    // 添加权限标识
    const userId = req?.user?.id;
    const isAdmin = req?.user?.isAdmin || false;

    return {
      success: true,
      data: {
        ...result,
        canDelete: !!userId, // 登录用户可以删除自己的文件
        canForceDelete: isAdmin, // 只有管理员可以强制删除
      },
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取媒体统计' })
  async getStats() {
    const stats = await this.mediaService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个媒体' })
  async findOne(@Param('id') id: string) {
    const media = await this.mediaService.findOne(id);
    return {
      success: true,
      data: media,
    };
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '上传单个文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        tags: {
          type: 'string',
          description: '标签，逗号分隔',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Body('tags') tagsString?: string,
  ) {
    if (!file) {
      throw new HttpException(
        { success: false, message: '请选择要上传的文件' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!req.user?.id) {
      throw new HttpException(
        { success: false, message: '用户未认证' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tags = tagsString ? tagsString.split(',').map((t) => t.trim()) : [];
    const media = await this.mediaService.create(file, req.user.id, tags);

    return {
      success: true,
      data: media,
      message: '文件上传成功',
    };
  }

  @Post('upload/multiple')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '批量上传文件' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage,
      fileFilter,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
    }),
  )
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
    @Body('tags') tagsString?: string,
  ) {
    const tags = tagsString ? tagsString.split(',').map((t) => t.trim()) : [];
    const results = await Promise.all(
      files.map((file) => this.mediaService.create(file, req.user.id, tags)),
    );

    return {
      success: true,
      data: results,
      message: `成功上传 ${results.length} 个文件`,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新媒体信息' })
  async update(
    @Param('id') id: string,
    @Body() updateData: { tags?: string[] },
  ) {
    const media = await this.mediaService.update(id, updateData);
    return {
      success: true,
      data: media,
      message: '更新成功',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除媒体' })
  async delete(
    @Param('id') id: string,
    @Request() req: any,
    @Query('force') force?: string,
  ) {
    try {
      await this.mediaService.delete(
        id,
        force === 'true',
        req.user.id,
        req.user.isAdmin,
      );
      return {
        success: true,
        message: '删除成功',
      };
    } catch (error: any) {
      // 处理文件被引用的情况，返回详细的引用信息
      if (error.status === HttpStatus.CONFLICT) {
        const response = error.getResponse();
        const responseData =
          typeof response === 'object' ? response : { message: response };
        throw new HttpException(
          {
            success: false,
            message: responseData.message || '该媒体文件正在被使用，无法删除',
            references: responseData.references || [],
            usages: responseData.usages || [],
          },
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  @Post('batch/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '批量删除媒体' })
  async deleteMany(
    @Body() body: { ids: string[]; force?: boolean },
    @Request() req: any,
  ) {
    const ids = body.ids || [];
    if (ids.length === 0) {
      return {
        success: false,
        message: '请选择要删除的文件',
      };
    }
    try {
      await this.mediaService.deleteMany(
        ids,
        body.force === true,
        req.user.id,
        req.user.isAdmin,
      );
      return {
        success: true,
        message: `成功删除 ${ids.length} 个文件`,
      };
    } catch (error: any) {
      // 处理文件被引用的情况，返回详细的引用信息
      if (error.status === HttpStatus.CONFLICT) {
        const response = error.getResponse();
        const responseData =
          typeof response === 'object' ? response : { message: response };
        throw new HttpException(
          {
            success: false,
            message: responseData.message || '部分媒体文件正在被使用，无法删除',
            referencedMedia: responseData.referencedMedia || [],
          },
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  @Get(':id/references')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '检查媒体引用' })
  async checkReferences(@Param('id') id: string) {
    const media = await this.mediaService.findOne(id);
    const references = await this.mediaService.checkReferences(media.url);
    return {
      success: true,
      data: {
        hasReferences: references.length > 0,
        references,
      },
    };
  }
}
