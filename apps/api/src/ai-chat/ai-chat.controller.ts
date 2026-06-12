import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { AiChatService } from './ai-chat.service';
import { CompletionsDto } from './dto/completions.dto';
import { KnowledgeSearchDto } from './dto/knowledge-search.dto';

@ApiTags('AI 对话')
@Controller('ai-chat')
export class AiChatController {
  private readonly logger = new Logger(AiChatController.name);

  constructor(private readonly aiChatService: AiChatService) {}

  @Post('knowledge/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '基于博客文章的关键词检索' })
  async searchKnowledge(@Body() dto: KnowledgeSearchDto) {
    const items = await this.aiChatService.searchKnowledge(
      dto.query,
      dto.limit,
    );
    return ApiResponseDto.success({ items });
  }

  @Post('completions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '使用服务器默认配置发起 AI 对话（流式 SSE，需登录）',
  })
  async completions(
    @Body() dto: CompletionsDto,
    @Req() req: Request & { user: { id: string } },
    @Res() res: Response,
  ): Promise<void> {
    const ip = (req.ip || req.socket.remoteAddress || 'unknown').toString();
    const userId = req.user?.id;

    if (!userId) {
      res.status(HttpStatus.UNAUTHORIZED).json(ApiResponseDto.error('未授权'));
      return;
    }

    try {
      this.aiChatService.checkIpRateLimit(ip);
    } catch (e: any) {
      res
        .status(HttpStatus.TOO_MANY_REQUESTS)
        .json(ApiResponseDto.error(e.message || '请求过于频繁'));
      return;
    }

    try {
      this.aiChatService.checkUserQuota(userId);
    } catch (e: any) {
      if (e?.status === 429) {
        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          ...ApiResponseDto.error(e.message),
          data: { resetAt: e.resetAt?.toISOString() },
        });
        return;
      }
      throw e;
    }

    let onClose: (() => void) | null = null;
    try {
      const result = await this.aiChatService.streamCompletions(dto, userId);
      onClose = result.onClose;

      res.status(HttpStatus.OK);
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // 先发送 sources 事件（如果有命中）
      if (result.sources.length > 0) {
        const sourcesPayload = JSON.stringify({
          sources: result.sources.map((s) => ({
            title: s.title,
            slug: s.slug,
          })),
        });
        res.write(`event: sources\ndata: ${sourcesPayload}\n\n`);
      }

      // 客户端中断
      req.on('close', () => {
        try {
          result.stream.destroy();
        } catch {
          /* ignore */
        }
        onClose?.();
        onClose = null;
      });

      result.stream.on('end', () => {
        onClose?.();
        onClose = null;
      });

      result.stream.pipe(res);
    } catch (error: any) {
      this.logger.error(`AI chat completions error: ${error.message}`);
      if (!res.headersSent) {
        const status = error?.status ?? error?.statusCode ?? 500;
        res
          .status(status)
          .json(ApiResponseDto.error(error.message || 'AI 对话请求失败'));
      }
      onClose?.();
    }
  }
}
