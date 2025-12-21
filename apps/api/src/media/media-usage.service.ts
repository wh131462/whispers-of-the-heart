import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export type EntityType = 'post' | 'user' | 'site_config';
export type FieldName = 'avatar' | 'siteLogo' | 'coverImage' | 'content' | 'aboutMe';

export interface MediaUsageInfo {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  fieldName: FieldName;
  fieldLabel: string;
}

// 字段标签映射
const FIELD_LABELS: Record<FieldName, string> = {
  avatar: '头像',
  siteLogo: '站点Logo',
  coverImage: '封面',
  content: '内容',
  aboutMe: '关于页面',
};

// 实体类型标签映射
const ENTITY_LABELS: Record<EntityType, string> = {
  post: '文章',
  user: '用户',
  site_config: '站点配置',
};

@Injectable()
export class MediaUsageService {
  constructor(private prisma: PrismaService) {}

  /**
   * 根据 URL 查找对应的媒体 ID
   */
  async findMediaByUrl(url: string) {
    return this.prisma.media.findFirst({
      where: { url },
      select: { id: true },
    });
  }

  /**
   * 同步单个字段的媒体使用记录（直接引用，如头像、封面）
   */
  async syncDirectUsage(
    entityType: EntityType,
    entityId: string,
    fieldName: FieldName,
    mediaUrl: string | null | undefined,
  ) {
    // 先删除该字段的旧记录
    await this.prisma.mediaUsage.deleteMany({
      where: {
        entityType,
        entityId,
        fieldName,
      },
    });

    // 如果有新的 URL，创建使用记录
    if (mediaUrl) {
      const media = await this.findMediaByUrl(mediaUrl);
      if (media) {
        await this.prisma.mediaUsage.create({
          data: {
            mediaId: media.id,
            entityType,
            entityId,
            fieldName,
          },
        });
      }
    }
  }

  /**
   * 同步内容字段的媒体使用记录（内嵌引用，如文章内容）
   * 从内容中提取所有媒体 URL 并创建使用记录
   */
  async syncContentUsage(
    entityType: EntityType,
    entityId: string,
    fieldName: FieldName,
    content: string | null | undefined,
  ) {
    // 先删除该字段的旧记录
    await this.prisma.mediaUsage.deleteMany({
      where: {
        entityType,
        entityId,
        fieldName,
      },
    });

    if (!content) return;

    // 获取所有媒体 URL
    const allMedia = await this.prisma.media.findMany({
      select: { id: true, url: true },
    });

    // 检查内容中引用了哪些媒体
    const usedMedia = allMedia.filter((m) => content.includes(m.url));

    // 批量创建使用记录
    if (usedMedia.length > 0) {
      await this.prisma.mediaUsage.createMany({
        data: usedMedia.map((m) => ({
          mediaId: m.id,
          entityType,
          entityId,
          fieldName,
        })),
        skipDuplicates: true,
      });
    }
  }

  /**
   * 删除实体的所有媒体使用记录
   */
  async deleteEntityUsages(entityType: EntityType, entityId: string) {
    await this.prisma.mediaUsage.deleteMany({
      where: {
        entityType,
        entityId,
      },
    });
  }

  /**
   * 获取媒体的所有使用记录（用于删除前检查）
   */
  async getMediaUsages(mediaId: string): Promise<MediaUsageInfo[]> {
    const usages = await this.prisma.mediaUsage.findMany({
      where: { mediaId },
    });

    const results: MediaUsageInfo[] = [];

    for (const usage of usages) {
      let entityName = '';

      // 根据实体类型获取名称
      switch (usage.entityType) {
        case 'post':
          const post = await this.prisma.post.findUnique({
            where: { id: usage.entityId },
            select: { title: true },
          });
          entityName = post?.title || '未知文章';
          break;

        case 'user':
          const user = await this.prisma.user.findUnique({
            where: { id: usage.entityId },
            select: { username: true },
          });
          entityName = user?.username || '未知用户';
          break;

        case 'site_config':
          entityName = '站点配置';
          break;
      }

      results.push({
        entityType: usage.entityType as EntityType,
        entityId: usage.entityId,
        entityName,
        fieldName: usage.fieldName as FieldName,
        fieldLabel: FIELD_LABELS[usage.fieldName as FieldName] || usage.fieldName,
      });
    }

    return results;
  }

  /**
   * 检查媒体是否被使用
   */
  async isMediaUsed(mediaId: string): Promise<boolean> {
    const count = await this.prisma.mediaUsage.count({
      where: { mediaId },
    });
    return count > 0;
  }

  /**
   * 获取实体类型的显示标签
   */
  getEntityLabel(entityType: EntityType): string {
    return ENTITY_LABELS[entityType] || entityType;
  }
}
