import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSiteConfigDto, UpdateSiteConfigDto } from './dto/site-config.dto';

@Injectable()
export class SiteConfigService {
  constructor(private prisma: PrismaService) {}

  async create(createSiteConfigDto: CreateSiteConfigDto) {
    const config = await this.prisma.siteConfig.create({
      data: createSiteConfigDto,
    });

    return config;
  }

  async findOne() {
    const config = await this.prisma.siteConfig.findFirst();

    if (!config) {
      // 返回默认配置
      return {
        id: 'default',
        siteName: 'Whispers of the Heart',
        siteDescription: '专注于分享知识和灵感的平台',
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
          description: '专注于分享知识和灵感的平台',
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

    return updatedConfig;
  }

  async remove(id: string) {
    const config = await this.prisma.siteConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('站点配置不存在');
    }

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
}
