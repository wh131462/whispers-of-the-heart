import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SiteConfigService } from './site-config.service';
import { CreateSiteConfigDto, UpdateSiteConfigDto } from './dto/site-config.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('site-config')
export class SiteConfigController {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  @Get()
  async findOne() {
    const config = await this.siteConfigService.findOne();
    return ApiResponseDto.success(config, '获取站点配置成功');
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() createSiteConfigDto: CreateSiteConfigDto) {
    const config = await this.siteConfigService.create(createSiteConfigDto);
    return ApiResponseDto.success(config, '站点配置创建成功');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() updateSiteConfigDto: UpdateSiteConfigDto) {
    const config = await this.siteConfigService.update(id, updateSiteConfigDto);
    return ApiResponseDto.success(config, '站点配置更新成功');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const result = await this.siteConfigService.remove(id);
    return ApiResponseDto.success(result, '站点配置删除成功');
  }
}
