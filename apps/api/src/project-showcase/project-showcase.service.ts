import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ShowcaseProject, ShowcaseProjectStatus } from '@prisma/client';

import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateShowcaseProjectDto,
  PublicShowcaseProjectQueryDto,
  UpdateShowcaseProjectDto,
} from './dto/project-showcase.dto';

const projectWithDistribution =
  Prisma.validator<Prisma.ShowcaseProjectDefaultArgs>()({
    include: {
      distributedApp: {
        include: {
          releases: { orderBy: { versionCode: 'desc' }, take: 1 },
        },
      },
    },
  });

type ProjectWithDistribution = Prisma.ShowcaseProjectGetPayload<
  typeof projectWithDistribution
>;

export interface ShowcaseLatestRelease {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  releaseNotes: string | null;
}

export interface ShowcaseProjectResult extends ShowcaseProject {
  distributedApp: {
    id: string;
    name: string;
    slug: string;
  } | null;
  latestRelease: ShowcaseLatestRelease | null;
  effectiveDownloadUrl: string | null;
}

@Injectable()
export class ProjectShowcaseService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(
    query: PublicShowcaseProjectQueryDto,
  ): Promise<ShowcaseProjectResult[]> {
    const projects = await this.prisma.showcaseProject.findMany({
      where: {
        status: ShowcaseProjectStatus.PUBLISHED,
        ...(query.featured !== undefined ? { featured: query.featured } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      ...projectWithDistribution,
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      ...(query.limit ? { take: query.limit } : {}),
    });

    return projects.map((project) => this.toResult(project));
  }

  async findAll(): Promise<ShowcaseProjectResult[]> {
    const projects = await this.prisma.showcaseProject.findMany({
      ...projectWithDistribution,
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });

    return projects.map((project) => this.toResult(project));
  }

  async findOne(id: string): Promise<ShowcaseProjectResult> {
    const project = await this.prisma.showcaseProject.findUnique({
      where: { id },
      ...projectWithDistribution,
    });

    if (!project) {
      throw new NotFoundException('作品不存在');
    }

    return this.toResult(project);
  }

  async create(dto: CreateShowcaseProjectDto): Promise<ShowcaseProjectResult> {
    await this.ensureDistributedAppExists(dto.distributedAppId);

    try {
      const project = await this.prisma.showcaseProject.create({
        data: this.toCreateData(dto),
        ...projectWithDistribution,
      });
      return this.toResult(project);
    } catch (error: unknown) {
      this.rethrowUniqueConstraint(error);
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateShowcaseProjectDto,
  ): Promise<ShowcaseProjectResult> {
    await this.findOne(id);
    await this.ensureDistributedAppExists(dto.distributedAppId);

    try {
      const project = await this.prisma.showcaseProject.update({
        where: { id },
        data: this.toUpdateData(dto),
        ...projectWithDistribution,
      });
      return this.toResult(project);
    } catch (error: unknown) {
      this.rethrowUniqueConstraint(error);
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.showcaseProject.delete({ where: { id } });
    return { message: '作品删除成功' };
  }

  private toCreateData(
    dto: CreateShowcaseProjectDto,
  ): Prisma.ShowcaseProjectUncheckedCreateInput {
    return {
      name: dto.name,
      slug: dto.slug,
      type: dto.type,
      summary: dto.summary,
      description: dto.description ?? null,
      icon: dto.icon ?? null,
      coverImage: dto.coverImage ?? null,
      tags: this.normalizeList(dto.tags),
      platforms: this.normalizeList(dto.platforms),
      repositoryUrl: dto.repositoryUrl ?? null,
      websiteUrl: dto.websiteUrl ?? null,
      downloadUrl: dto.downloadUrl ?? null,
      status: dto.status ?? ShowcaseProjectStatus.DRAFT,
      featured: dto.featured ?? false,
      sortOrder: dto.sortOrder ?? 0,
      distributedAppId: dto.distributedAppId ?? null,
    };
  }

  private toUpdateData(
    dto: UpdateShowcaseProjectDto,
  ): Prisma.ShowcaseProjectUncheckedUpdateInput {
    return {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
      ...(dto.coverImage !== undefined ? { coverImage: dto.coverImage } : {}),
      ...(dto.tags !== undefined ? { tags: this.normalizeList(dto.tags) } : {}),
      ...(dto.platforms !== undefined
        ? { platforms: this.normalizeList(dto.platforms) }
        : {}),
      ...(dto.repositoryUrl !== undefined
        ? { repositoryUrl: dto.repositoryUrl }
        : {}),
      ...(dto.websiteUrl !== undefined ? { websiteUrl: dto.websiteUrl } : {}),
      ...(dto.downloadUrl !== undefined
        ? { downloadUrl: dto.downloadUrl }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.featured !== undefined ? { featured: dto.featured } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.distributedAppId !== undefined
        ? { distributedAppId: dto.distributedAppId }
        : {}),
    };
  }

  private normalizeList(values?: string[]): string[] {
    if (!values) return [];
    return Array.from(
      new Set(values.map((value) => value.trim()).filter(Boolean)),
    );
  }

  private async ensureDistributedAppExists(
    distributedAppId?: string | null,
  ): Promise<void> {
    if (!distributedAppId) return;

    const app = await this.prisma.distributedApp.findUnique({
      where: { id: distributedAppId },
      select: { id: true },
    });
    if (!app) {
      throw new NotFoundException('关联的分发应用不存在');
    }
  }

  private toResult(project: ProjectWithDistribution): ShowcaseProjectResult {
    const { distributedApp, ...base } = project;
    const latestRelease = distributedApp?.releases[0] ?? null;

    return {
      ...base,
      distributedApp: distributedApp
        ? {
            id: distributedApp.id,
            name: distributedApp.name,
            slug: distributedApp.slug,
          }
        : null,
      latestRelease: latestRelease
        ? {
            versionCode: latestRelease.versionCode,
            versionName: latestRelease.versionName,
            apkUrl: latestRelease.apkUrl,
            releaseNotes: latestRelease.releaseNotes,
          }
        : null,
      effectiveDownloadUrl: latestRelease?.apkUrl ?? project.downloadUrl,
    };
  }

  private rethrowUniqueConstraint(error: unknown): void {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return;
    }

    const target = error.meta?.target;
    const targetFields = Array.isArray(target)
      ? target.filter((field): field is string => typeof field === 'string')
      : typeof target === 'string'
        ? [target]
        : [];
    if (targetFields.includes('distributedAppId')) {
      throw new ConflictException('该分发应用已关联其他作品');
    }
    throw new ConflictException('作品 slug 已被使用');
  }
}
