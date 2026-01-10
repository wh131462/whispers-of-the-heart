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
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { MediaService } from './media.service';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user?: { id: string; isAdmin?: boolean };
}
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

// 根据 MIME 类型获取子目录名称
const getSubdirByMimeType = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audios';
  return 'files';
};

// 使用绝对路径确保上传目录一致
const uploadsDir = join(process.cwd(), 'uploads');

// 确保基础上传目录存在
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration - 动态生成目录
const storage = diskStorage({
  destination: (req: AuthenticatedRequest, file, callback) => {
    const userId = req.user?.id || 'anonymous';
    const subdir = getSubdirByMimeType(file.mimetype);
    const destDir = join(uploadsDir, userId, subdir);

    // 确保用户目录存在
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    callback(null, destDir);
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = generateFilename();
    const ext = extname(file.originalname);
    callback(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter for allowed types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fileFilter = (_req: any, file: Express.Multer.File, callback: any) => {
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
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取媒体列表' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('uploaderId') uploaderId?: string,
    @Query('all') all?: string, // 管理员专用：查询所有文件
    @Request() req?: AuthenticatedRequest,
  ) {
    const userId = req?.user?.id;
    const isAdmin = req?.user?.isAdmin || false;

    // 权限控制：
    // - 未登录用户：无法查询
    // - 普通用户：只能查询自己的文件
    // - 管理员：可以查询所有文件（需传 all=true），否则默认查询自己的
    let effectiveUploaderId = uploaderId;

    if (!userId) {
      // 未登录用户返回空列表
      return {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          totalPages: 0,
          canDelete: false,
          canForceDelete: false,
        },
      };
    }

    if (!isAdmin) {
      // 普通用户强制只能查询自己的文件
      effectiveUploaderId = userId;
    } else if (all !== 'true' && !uploaderId) {
      // 管理员未指定 all=true 且未指定 uploaderId，默认查询自己的
      effectiveUploaderId = userId;
    }

    const skip = (page - 1) * limit;
    const result = await this.mediaService.findAll({
      skip,
      take: limit,
      mimeType: type,
      search,
      uploaderId: effectiveUploaderId,
    });

    return {
      success: true,
      data: {
        ...result,
        canDelete: true, // 登录用户可以删除自己的文件
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
        duration: {
          type: 'number',
          description: '音视频时长（秒）',
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
    @Request() req: AuthenticatedRequest,
    @Body('tags') tagsString?: string,
    @Body('duration') durationString?: string,
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
    const duration = durationString ? parseFloat(durationString) : undefined;
    const media = await this.mediaService.create(
      file,
      req.user.id,
      tags,
      duration,
    );

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
    @Request() req: AuthenticatedRequest,
    @Body('tags') tagsString?: string,
  ) {
    if (!req.user?.id) {
      throw new HttpException(
        { success: false, message: '用户未认证' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const tags = tagsString ? tagsString.split(',').map((t) => t.trim()) : [];
    const results = await Promise.all(
      files.map((file) => this.mediaService.create(file, req.user!.id, tags)),
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
    @Request() req: AuthenticatedRequest,
    @Query('force') force?: string,
  ) {
    if (!req.user?.id) {
      throw new HttpException(
        { success: false, message: '用户未认证' },
        HttpStatus.UNAUTHORIZED,
      );
    }
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
    @Request() req: AuthenticatedRequest,
  ) {
    if (!req.user?.id) {
      throw new HttpException(
        { success: false, message: '用户未认证' },
        HttpStatus.UNAUTHORIZED,
      );
    }
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
