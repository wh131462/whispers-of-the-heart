import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AppRelease } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/roles.guard';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import {
  AppDistributionService,
  type DistributedAppWithReleases,
  type LatestAppRelease,
} from './app-distribution.service';
import {
  CreateAppReleaseDto,
  CreateDistributedAppDto,
  UpdateAppReleaseDto,
  UpdateDistributedAppDto,
} from './dto/app-distribution.dto';

@Controller('admin/app-distributions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminAppDistributionController {
  constructor(
    private readonly appDistributionService: AppDistributionService,
  ) {}

  @Get()
  async findAll(): Promise<ApiResponseDto<DistributedAppWithReleases[]>> {
    const apps = await this.appDistributionService.findAll();
    return ApiResponseDto.success(apps, '获取分发应用列表成功');
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<DistributedAppWithReleases>> {
    const app = await this.appDistributionService.findOne(id);
    return ApiResponseDto.success(app, '获取分发应用成功');
  }

  @Post()
  async create(
    @Body() dto: CreateDistributedAppDto,
  ): Promise<ApiResponseDto<DistributedAppWithReleases>> {
    const app = await this.appDistributionService.create(dto);
    return ApiResponseDto.success(app, '分发应用注册成功');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDistributedAppDto,
  ): Promise<ApiResponseDto<DistributedAppWithReleases>> {
    const app = await this.appDistributionService.update(id, dto);
    return ApiResponseDto.success(app, '分发应用更新成功');
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.appDistributionService.remove(id);
    return ApiResponseDto.success(result, '分发应用删除成功');
  }

  @Post(':appId/releases')
  async createRelease(
    @Param('appId') appId: string,
    @Body() dto: CreateAppReleaseDto,
  ): Promise<ApiResponseDto<AppRelease>> {
    const release = await this.appDistributionService.createRelease(appId, dto);
    return ApiResponseDto.success(release, '应用版本创建成功');
  }

  @Patch(':appId/releases/:releaseId')
  async updateRelease(
    @Param('appId') appId: string,
    @Param('releaseId') releaseId: string,
    @Body() dto: UpdateAppReleaseDto,
  ): Promise<ApiResponseDto<AppRelease>> {
    const release = await this.appDistributionService.updateRelease(
      appId,
      releaseId,
      dto,
    );
    return ApiResponseDto.success(release, '应用版本更新成功');
  }

  @Delete(':appId/releases/:releaseId')
  async removeRelease(
    @Param('appId') appId: string,
    @Param('releaseId') releaseId: string,
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.appDistributionService.removeRelease(
      appId,
      releaseId,
    );
    return ApiResponseDto.success(result, '应用版本删除成功');
  }
}

@Controller('app-distributions')
export class PublicAppDistributionController {
  constructor(
    private readonly appDistributionService: AppDistributionService,
  ) {}

  @Get(':slug/latest.json')
  async findLatest(@Param('slug') slug: string): Promise<LatestAppRelease> {
    return this.appDistributionService.findLatestBySlug(slug);
  }
}
