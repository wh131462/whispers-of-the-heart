import {
  Controller,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiProxyService } from './ai-proxy.service';

@ApiTags('AI 代理')
@ApiBearerAuth('JWT-auth')
@Controller('ai-proxy')
export class AiProxyController {
  private readonly logger = new Logger(AiProxyController.name);

  constructor(private readonly aiProxyService: AiProxyService) {}

  @Post('proxy')
  @UseGuards(JwtAuthGuard)
  async proxy(
    @Query('url') targetUrl: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const result = await this.aiProxyService.proxyRequest(
        targetUrl,
        req.body,
        req.headers['content-type'],
      );

      res.status(result.status);
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, value);
      }

      result.stream.pipe(res);
    } catch (error) {
      this.logger.error(`AI proxy error: ${error.message}`);

      if (!res.headersSent) {
        const status = error.status || error.statusCode || 500;
        res.status(status).json({
          success: false,
          message: error.message || 'AI proxy request failed',
        });
      }
    }
  }
}
