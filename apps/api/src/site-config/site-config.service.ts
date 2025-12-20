import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSiteConfigDto, UpdateSiteConfigDto } from './dto/site-config.dto';
import { MediaUsageService } from '../media/media-usage.service';

@Injectable()
export class SiteConfigService {
  constructor(
    private prisma: PrismaService,
    private mediaUsageService: MediaUsageService,
  ) { }

  async create(createSiteConfigDto: CreateSiteConfigDto) {
    const config = await this.prisma.siteConfig.create({
      data: createSiteConfigDto,
    });

    // 同步媒体使用记录
    await this.syncSiteConfigMediaUsage(config.id, createSiteConfigDto);

    return config;
  }

  async findOne() {
    const config = await this.prisma.siteConfig.findFirst();

    if (!config) {
      // 返回默认配置
      return {
        id: 'default',
        siteName: 'Whispers of the Heart',
        siteDescription: '不知名独立开发的个人博客',
        siteLogo: null,
        siteIcon: null,
        aboutMe: '热爱技术，热爱生活，希望通过文字传递正能量。',
        contactEmail: null,
        socialLinks: {
          github: null,
          twitter: null,
          linkedin: null,
        },
        seoSettings: {
          title: 'Whispers of the Heart',
          description: '不知名独立开发的个人博客',
          keywords: '技术,博客,分享,知识',
        },
        ossConfig: {
          provider: 'local',
          endpoint: null,
          accessKey: null,
          secretKey: null,
          bucketName: null,
          cdnDomain: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return config;
  }

  async update(id: string, updateSiteConfigDto: UpdateSiteConfigDto) {
    const config = await this.prisma.siteConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('站点配置不存在');
    }

    // 深度合并配置
    const mergedData = this.deepMerge(config, updateSiteConfigDto);

    const updatedConfig = await this.prisma.siteConfig.update({
      where: { id },
      data: mergedData,
    });

    // 同步媒体使用记录
    await this.syncSiteConfigMediaUsage(id, updateSiteConfigDto);

    return updatedConfig;
  }

  async remove(id: string) {
    const config = await this.prisma.siteConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('站点配置不存在');
    }

    // 删除站点配置的媒体使用记录
    await this.mediaUsageService.deleteEntityUsages('site_config', id);

    await this.prisma.siteConfig.delete({
      where: { id },
    });

    return { message: '站点配置删除成功' };
  }

  // 私有方法：深度合并对象
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else if (source[key] !== undefined) {
        result[key] = source[key];
      }
    }

    return result;
  }

  // 私有方法：同步站点配置的媒体使用记录
  private async syncSiteConfigMediaUsage(configId: string, dto: Partial<CreateSiteConfigDto | UpdateSiteConfigDto>) {
    // 同步 siteLogo
    if ('siteLogo' in dto) {
      await this.mediaUsageService.syncDirectUsage('site_config', configId, 'avatar', dto.siteLogo);
    }

    // 同步 aboutMe（富文本内容，可能包含图片）
    if ('aboutMe' in dto) {
      await this.mediaUsageService.syncContentUsage('site_config', configId, 'aboutMe', dto.aboutMe);
    }
  }
}
