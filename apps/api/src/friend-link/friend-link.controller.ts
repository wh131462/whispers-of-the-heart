import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FriendLinkService } from './friend-link.service';
import {
  CreateFriendLinkDto,
  UpdateFriendLinkDto,
} from './dto/friend-link.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('friend-links')
export class FriendLinkController {
  constructor(private readonly friendLinkService: FriendLinkService) {}

  @Get('probe-icons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async probeIcons(@Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('url 参数必填');
    }
    const icons = await this.friendLinkService.probeIcons(url);
    return ApiResponseDto.success(icons, '图标探测完成');
  }

  @Get()
  async findAll(
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    if (includeInactive === 'true') {
      const list = await this.friendLinkService.findAll();
      return ApiResponseDto.success(list, '获取友链列表成功');
    }
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const list = await this.friendLinkService.findAllPublic(
      parsedLimit && !isNaN(parsedLimit) ? parsedLimit : undefined,
    );
    return ApiResponseDto.success(list, '获取友链列表成功');
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateFriendLinkDto) {
    const link = await this.friendLinkService.create(dto);
    return ApiResponseDto.success(link, '友链创建成功');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateFriendLinkDto) {
    const link = await this.friendLinkService.update(id, dto);
    return ApiResponseDto.success(link, '友链更新成功');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const result = await this.friendLinkService.remove(id);
    return ApiResponseDto.success(result, '友链删除成功');
  }
}
