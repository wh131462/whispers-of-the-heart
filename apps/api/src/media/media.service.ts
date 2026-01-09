import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { MediaUsageService, MediaUsageInfo } from './media-usage.service';

export interface MediaReference {
  postId: string;
  postTitle: string;
  type: 'cover' | 'content';
}

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private mediaUsageService: MediaUsageService,
  ) {}

  // 计算文件的 SHA256 哈希值
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }

  // 根据哈希值查找已存在的媒体
  async findByHash(hash: string) {
    return this.prisma.media.findUnique({
      where: { hash },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    mimeType?: string;
    search?: string;
    uploaderId?: string;
  }) {
    const { skip = 0, take = 20, mimeType, search, uploaderId } = params;

    const where: Prisma.MediaWhereInput = {};

    if (mimeType) {
      where.mimeType = { startsWith: mimeType };
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (uploaderId) {
      where.uploaderId = uploaderId;
    }

    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(total / take),
    };
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    return media;
  }

  async create(
    file: Express.Multer.File,
    uploaderId: string,
    tags: string[] = [],
    duration?: number,
  ) {
    // 验证用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: uploaderId },
    });
    if (!user) {
      // 删除已上传的文件
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new UnauthorizedException('用户不存在或会话已过期，请重新登录');
    }

    const filePath = file.path;

    // 计算文件哈希值
    const fileHash = await this.calculateFileHash(filePath);

    // 检查是否已存在相同内容的文件
    const existingMedia = await this.findByHash(fileHash);
    if (existingMedia) {
      // 如果旧文件物理上不存在，使用新上传的文件更新记录
      const oldFilePath = path.join(
        process.cwd(),
        'uploads',
        existingMedia.filename,
      );
      if (!fs.existsSync(oldFilePath)) {
        // 旧文件不存在，更新记录使用新文件
        const url = `/uploads/${file.filename}`;
        return this.prisma.media.update({
          where: { id: existingMedia.id },
          data: {
            filename: file.filename,
            url,
            thumbnail: file.mimetype.startsWith('image/')
              ? url
              : existingMedia.thumbnail,
          },
          include: {
            uploader: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        });
      }
      // 旧文件存在，删除新上传的重复文件
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // 返回已存在的媒体记录
      return existingMedia;
    }

    // 使用相对路径，让前端/nginx 自动拼接域名
    const url = `/uploads/${file.filename}`;

    // 修复中文文件名编码问题：Multer 使用 Latin1 编码，需要转换为 UTF-8
    let originalName = file.originalname;
    try {
      // 尝试将 Latin1 编码的字符串转换为 UTF-8
      originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch {
      // 如果转换失败，保持原始值
      originalName = file.originalname;
    }

    // Generate thumbnail URL for images
    let thumbnail: string | undefined;
    if (file.mimetype.startsWith('image/')) {
      thumbnail = url; // For now, use the same URL for thumbnail
    }

    return this.prisma.media.create({
      data: {
        filename: file.filename,
        originalName,
        mimeType: file.mimetype,
        size: file.size,
        url,
        thumbnail,
        hash: fileHash,
        tags,
        uploaderId,
        duration,
      },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async update(id: string, data: { tags?: string[] }) {
    const media = await this.prisma.media.findUnique({ where: { id } });

    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    return this.prisma.media.update({
      where: { id },
      data: {
        tags: data.tags,
      },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  // 检查媒体是否被文章引用
  async checkReferences(mediaUrl: string): Promise<MediaReference[]> {
    const references: MediaReference[] = [];

    // 检查是否被用作封面图片
    const postsWithCover = await this.prisma.post.findMany({
      where: { coverImage: mediaUrl },
      select: { id: true, title: true },
    });

    for (const post of postsWithCover) {
      references.push({
        postId: post.id,
        postTitle: post.title,
        type: 'cover',
      });
    }

    // 检查是否在文章内容中被引用
    const postsWithContent = await this.prisma.post.findMany({
      where: { content: { contains: mediaUrl } },
      select: { id: true, title: true },
    });

    for (const post of postsWithContent) {
      // 避免重复添加（如果同时是封面和内容引用）
      if (
        !references.find((r) => r.postId === post.id && r.type === 'content')
      ) {
        references.push({
          postId: post.id,
          postTitle: post.title,
          type: 'content',
        });
      }
    }

    return references;
  }

  async delete(
    id: string,
    force: boolean = false,
    userId?: string,
    isAdmin: boolean = false,
  ) {
    const media = await this.prisma.media.findUnique({ where: { id } });

    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }

    // 权限检查：只有文件所有者或管理员可以删除
    if (!isAdmin && media.uploaderId !== userId) {
      throw new ForbiddenException('您没有权限删除此文件');
    }

    // 强制删除只有管理员可以执行
    if (force && !isAdmin) {
      throw new ForbiddenException('只有管理员可以强制删除文件');
    }

    // 检查是否被引用（优先使用关联表，如果没有记录则降级到 URL 检查）
    if (!force) {
      const usages = await this.mediaUsageService.getMediaUsages(id);
      if (usages.length > 0) {
        // 生成更友好的提示信息
        const usageDetails = usages
          .map((u) => {
            if (u.entityType === 'post') {
              return `文章《${u.entityName}》中的${u.fieldLabel || '内容'}`;
            }
            return `${u.entityType}中的${u.fieldLabel || '内容'}`;
          })
          .join('、');

        throw new ConflictException({
          message: `该文件正在被使用，无法删除。被引用位置：${usageDetails}`,
          usages,
        });
      }

      // 降级检查：URL 搜索（兼容旧数据）
      const references = await this.checkReferences(media.url);
      if (references.length > 0) {
        const refDetails = references
          .map(
            (r) =>
              `文章《${r.postTitle}》的${r.type === 'cover' ? '封面' : '内容'}`,
          )
          .join('、');

        throw new ConflictException({
          message: `该文件正在被使用，无法删除。被引用位置：${refDetails}`,
          references,
        });
      }
    }

    // Delete the physical file
    const filePath = path.join(process.cwd(), 'uploads', media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return this.prisma.media.delete({ where: { id } });
  }

  async deleteMany(
    ids: string[],
    force: boolean = false,
    userId?: string,
    isAdmin: boolean = false,
  ) {
    const mediaFiles = await this.prisma.media.findMany({
      where: { id: { in: ids } },
    });

    // 权限检查：验证所有文件的所有权
    if (!isAdmin) {
      const unauthorizedFiles = mediaFiles.filter(
        (m) => m.uploaderId !== userId,
      );
      if (unauthorizedFiles.length > 0) {
        throw new ForbiddenException(
          `您没有权限删除${unauthorizedFiles.length}个文件，只能删除自己上传的文件`,
        );
      }
    }

    // 强制删除只有管理员可以执行
    if (force && !isAdmin) {
      throw new ForbiddenException('只有管理员可以强制删除文件');
    }

    // 检查是否有被引用的媒体
    if (!force) {
      const referencedMedia: {
        id: string;
        url: string;
        usages?: MediaUsageInfo[];
        references?: MediaReference[];
      }[] = [];

      for (const media of mediaFiles) {
        // 优先检查关联表
        const usages = await this.mediaUsageService.getMediaUsages(media.id);
        if (usages.length > 0) {
          referencedMedia.push({
            id: media.id,
            url: media.url,
            usages,
          });
          continue;
        }

        // 降级检查：URL 搜索（兼容旧数据）
        const references = await this.checkReferences(media.url);
        if (references.length > 0) {
          referencedMedia.push({
            id: media.id,
            url: media.url,
            references,
          });
        }
      }

      if (referencedMedia.length > 0) {
        throw new ConflictException({
          message: `${referencedMedia.length}个文件正在被使用，无法删除`,
          referencedMedia,
        });
      }
    }

    // Delete physical files
    for (const media of mediaFiles) {
      const filePath = path.join(process.cwd(), 'uploads', media.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return this.prisma.media.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async getStats() {
    const [total, images, videos, audios, documents] = await Promise.all([
      this.prisma.media.count(),
      this.prisma.media.count({
        where: { mimeType: { startsWith: 'image/' } },
      }),
      this.prisma.media.count({
        where: { mimeType: { startsWith: 'video/' } },
      }),
      this.prisma.media.count({
        where: { mimeType: { startsWith: 'audio/' } },
      }),
      this.prisma.media.count({
        where: {
          mimeType: {
            in: [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/plain',
            ],
          },
        },
      }),
    ]);

    const totalSize = await this.prisma.media.aggregate({
      _sum: { size: true },
    });

    return {
      total,
      images,
      videos,
      audios,
      documents,
      totalSize: totalSize._sum.size || 0,
    };
  }
}
