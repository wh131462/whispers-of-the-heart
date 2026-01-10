import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * 提交反馈（公开接口）
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateFeedbackDto, @Req() req: Request) {
    const ipAddress =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket?.remoteAddress;
    const userAgent = req.headers?.['user-agent'];

    const feedback = await this.feedbackService.create(
      dto,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: '反馈提交成功，感谢您的意见！',
      data: { id: feedback.id },
    };
  }

  /**
   * 获取反馈列表（管理员）
   */
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    const result = await this.feedbackService.findAll(
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
      status,
      type,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 获取反馈统计（管理员）
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStats() {
    const stats = await this.feedbackService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * 获取单个反馈详情（管理员）
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findOne(@Param('id') id: string) {
    const feedback = await this.feedbackService.findOne(id);

    if (!feedback) {
      return {
        success: false,
        message: '反馈不存在',
      };
    }

    // 自动标记为已读
    if (feedback.status === 'pending') {
      await this.feedbackService.updateStatus(id, 'read');
    }

    return {
      success: true,
      data: feedback,
    };
  }

  /**
   * 更新反馈状态（管理员）
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    if (!['pending', 'read', 'resolved'].includes(status)) {
      return {
        success: false,
        message: '无效的状态值',
      };
    }

    const feedback = await this.feedbackService.updateStatus(id, status);

    return {
      success: true,
      message: '状态已更新',
      data: feedback,
    };
  }

  /**
   * 回复反馈（管理员）
   */
  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async reply(@Param('id') id: string, @Body('content') content: string) {
    if (!content?.trim()) {
      return {
        success: false,
        message: '回复内容不能为空',
      };
    }

    try {
      const feedback = await this.feedbackService.reply(id, content.trim());
      return {
        success: true,
        message: '回复已发送',
        data: feedback,
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '发送回复失败',
      };
    }
  }

  /**
   * 删除反馈（管理员）
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id') id: string) {
    await this.feedbackService.remove(id);

    return {
      success: true,
      message: '反馈已删除',
    };
  }
}
