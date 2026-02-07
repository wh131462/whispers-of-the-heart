import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

const DEFAULT_ALLOWED_HOSTS = [
  'api.openai.com',
  'api.deepseek.com',
  'api.anthropic.com',
];

@Injectable()
export class AiProxyService {
  private readonly logger = new Logger(AiProxyService.name);
  private readonly allowedHosts: string[];

  constructor(private readonly configService: ConfigService) {
    const extraHosts = this.configService.get<string>('AI_PROXY_ALLOWED_HOSTS');
    this.allowedHosts = [
      ...DEFAULT_ALLOWED_HOSTS,
      ...(extraHosts ? extraHosts.split(',').map((h) => h.trim()) : []),
    ];
  }

  /**
   * 验证目标 URL 是否在白名单中
   */
  validateTargetUrl(targetUrl: string): URL {
    let url: URL;
    try {
      url = new URL(targetUrl);
    } catch {
      throw new BadRequestException('Invalid target URL');
    }

    if (!this.allowedHosts.includes(url.hostname)) {
      this.logger.warn(`Blocked proxy request to: ${url.hostname}`);
      throw new BadRequestException(`Host not allowed: ${url.hostname}`);
    }

    return url;
  }

  /**
   * 转发请求到 AI 提供商
   */
  async proxyRequest(
    targetUrl: string,
    body: unknown,
    contentType?: string,
  ): Promise<{
    status: number;
    headers: Record<string, string>;
    stream: Readable;
  }> {
    const url = this.validateTargetUrl(targetUrl);
    const apiKey = this.configService.get<string>('AI_API_KEY');

    if (!apiKey) {
      throw new BadRequestException('AI API key not configured on server');
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': contentType || 'application/json',
    };

    this.logger.debug(`Proxying AI request to: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    // 收集需要转发的响应头
    const responseHeaders: Record<string, string> = {};
    const forwardHeaders = [
      'content-type',
      'x-request-id',
      'x-ratelimit-limit-requests',
      'x-ratelimit-remaining-requests',
    ];
    for (const key of forwardHeaders) {
      const value = response.headers.get(key);
      if (value) {
        responseHeaders[key] = value;
      }
    }

    // 将 Web ReadableStream 转换为 Node Readable
    const stream = response.body
      ? Readable.fromWeb(response.body as import('stream/web').ReadableStream)
      : Readable.from([]);

    return {
      status: response.status,
      headers: responseHeaders,
      stream,
    };
  }
}
