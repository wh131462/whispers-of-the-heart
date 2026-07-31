import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppRelease, Prisma } from '@prisma/client';

import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateAppReleaseDto,
  CreateDistributedAppDto,
  UpdateAppReleaseDto,
  UpdateDistributedAppDto,
} from './dto/app-distribution.dto';

export type DistributedAppWithReleases = Prisma.DistributedAppGetPayload<{
  include: { releases: true };
}>;

export interface LatestAppRelease {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  releaseNotes?: string;
}

@Injectable()
export class AppDistributionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DistributedAppWithReleases[]> {
    return this.prisma.distributedApp.findMany({
      include: {
        releases: { orderBy: { versionCode: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<DistributedAppWithReleases> {
    const app = await this.prisma.distributedApp.findUnique({
      where: { id },
      include: {
        releases: { orderBy: { versionCode: 'desc' } },
      },
    });

    if (!app) {
      throw new NotFoundException('分发应用不存在');
    }

    return app;
  }

  async create(
    dto: CreateDistributedAppDto,
  ): Promise<DistributedAppWithReleases> {
    try {
      return await this.prisma.distributedApp.create({
        data: {
          name: dto.name.trim(),
          slug: dto.slug,
        },
        include: { releases: true },
      });
    } catch (error: unknown) {
      this.rethrowUniqueConstraint(error, '接口标识已被使用');
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateDistributedAppDto,
  ): Promise<DistributedAppWithReleases> {
    await this.findOne(id);

    try {
      return await this.prisma.distributedApp.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        },
        include: {
          releases: { orderBy: { versionCode: 'desc' } },
        },
      });
    } catch (error: unknown) {
      this.rethrowUniqueConstraint(error, '接口标识已被使用');
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.distributedApp.delete({ where: { id } });
    return { message: '分发应用删除成功' };
  }

  async createRelease(
    appId: string,
    dto: CreateAppReleaseDto,
  ): Promise<AppRelease> {
    await this.findOne(appId);

    try {
      return await this.prisma.appRelease.create({
        data: {
          appId,
          versionCode: dto.versionCode,
          versionName: dto.versionName.trim(),
          apkUrl: dto.apkUrl,
          releaseNotes: dto.releaseNotes?.trim() || null,
        },
      });
    } catch (error: unknown) {
      this.rethrowUniqueConstraint(error, '该应用已存在相同的 versionCode');
      throw error;
    }
  }

  async updateRelease(
    appId: string,
    releaseId: string,
    dto: UpdateAppReleaseDto,
  ): Promise<AppRelease> {
    await this.ensureReleaseExists(appId, releaseId);

    try {
      return await this.prisma.appRelease.update({
        where: { id: releaseId },
        data: {
          ...(dto.versionCode !== undefined
            ? { versionCode: dto.versionCode }
            : {}),
          ...(dto.versionName !== undefined
            ? { versionName: dto.versionName.trim() }
            : {}),
          ...(dto.apkUrl !== undefined ? { apkUrl: dto.apkUrl } : {}),
          ...(dto.releaseNotes !== undefined
            ? { releaseNotes: dto.releaseNotes?.trim() || null }
            : {}),
        },
      });
    } catch (error: unknown) {
      this.rethrowUniqueConstraint(error, '该应用已存在相同的 versionCode');
      throw error;
    }
  }

  async removeRelease(
    appId: string,
    releaseId: string,
  ): Promise<{ message: string }> {
    await this.ensureReleaseExists(appId, releaseId);
    await this.prisma.appRelease.delete({ where: { id: releaseId } });
    return { message: '应用版本删除成功' };
  }

  async findLatestBySlug(slug: string): Promise<LatestAppRelease> {
    const app = await this.prisma.distributedApp.findUnique({
      where: { slug },
      select: {
        releases: {
          orderBy: { versionCode: 'desc' },
          take: 1,
          select: {
            versionCode: true,
            versionName: true,
            apkUrl: true,
            releaseNotes: true,
          },
        },
      },
    });
    const latest = app?.releases[0];

    if (!latest) {
      throw new NotFoundException('应用或可用版本不存在');
    }

    return {
      versionCode: latest.versionCode,
      versionName: latest.versionName,
      apkUrl: latest.apkUrl,
      ...(latest.releaseNotes ? { releaseNotes: latest.releaseNotes } : {}),
    };
  }

  private async ensureReleaseExists(
    appId: string,
    releaseId: string,
  ): Promise<AppRelease> {
    const release = await this.prisma.appRelease.findFirst({
      where: { id: releaseId, appId },
    });

    if (!release) {
      throw new NotFoundException('应用版本不存在');
    }

    return release;
  }

  private rethrowUniqueConstraint(error: unknown, message: string): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(message);
    }
  }
}
