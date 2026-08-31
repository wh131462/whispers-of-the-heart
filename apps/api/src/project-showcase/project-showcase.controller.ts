import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/roles.guard';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import {
  CreateShowcaseProjectDto,
  PublicShowcaseProjectQueryDto,
  UpdateShowcaseProjectDto,
} from './dto/project-showcase.dto';
import {
  ProjectShowcaseService,
  ShowcaseProjectResult,
} from './project-showcase.service';

@Controller('projects')
export class PublicProjectShowcaseController {
  constructor(
    private readonly projectShowcaseService: ProjectShowcaseService,
  ) {}

  @Get()
  async findAll(
    @Query() query: PublicShowcaseProjectQueryDto,
  ): Promise<ApiResponseDto<ShowcaseProjectResult[]>> {
    const projects = await this.projectShowcaseService.findPublic(query);
    return ApiResponseDto.success(projects, '获取作品列表成功');
  }
}

@Controller('admin/projects')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminProjectShowcaseController {
  constructor(
    private readonly projectShowcaseService: ProjectShowcaseService,
  ) {}

  @Get()
  async findAll(): Promise<ApiResponseDto<ShowcaseProjectResult[]>> {
    const projects = await this.projectShowcaseService.findAll();
    return ApiResponseDto.success(projects, '获取作品管理列表成功');
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<ShowcaseProjectResult>> {
    const project = await this.projectShowcaseService.findOne(id);
    return ApiResponseDto.success(project, '获取作品成功');
  }

  @Post()
  async create(
    @Body() dto: CreateShowcaseProjectDto,
  ): Promise<ApiResponseDto<ShowcaseProjectResult>> {
    const project = await this.projectShowcaseService.create(dto);
    return ApiResponseDto.success(project, '作品创建成功');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShowcaseProjectDto,
  ): Promise<ApiResponseDto<ShowcaseProjectResult>> {
    const project = await this.projectShowcaseService.update(id, dto);
    return ApiResponseDto.success(project, '作品更新成功');
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.projectShowcaseService.remove(id);
    return ApiResponseDto.success(result, '作品删除成功');
  }
}
