import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateFriendLinkDto,
  UpdateFriendLinkDto,
} from './dto/friend-link.dto';
import { FriendLinkStatus } from '@prisma/client';

@Injectable()
export class FriendLinkService {
  constructor(private prisma: PrismaService) {}

  async findAllPublic(limit?: number) {
    return this.prisma.friendLink.findMany({
      where: { status: FriendLinkStatus.ACTIVE },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      ...(limit ? { take: limit } : {}),
    });
  }

  async findAll() {
    return this.prisma.friendLink.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(dto: CreateFriendLinkDto) {
    return this.prisma.friendLink.create({ data: dto });
  }

  async update(id: string, dto: UpdateFriendLinkDto) {
    const existing = await this.prisma.friendLink.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('友链不存在');
    }
    return this.prisma.friendLink.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const existing = await this.prisma.friendLink.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('友链不存在');
    }
    await this.prisma.friendLink.delete({ where: { id } });
    return { message: '友链删除成功' };
  }

  /**
   * 探测目标站点 head 中声明的图标
   * 解析 <link rel="icon|shortcut icon|apple-touch-icon|mask-icon|fluid-icon">
   * 以及 <meta property="og:image|twitter:image"> 作为兜底
   */
  async probeIcons(targetUrl: string): Promise<string[]> {
    let base: URL;
    try {
      base = new URL(targetUrl);
    } catch {
      throw new BadRequestException('URL 格式不合法');
    }
    if (!['http:', 'https:'].includes(base.protocol)) {
      throw new BadRequestException('仅支持 http/https 协议');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let html: string;
    try {
      const res = await fetch(base.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; WhispersBot/1.0; +https://131462.wang)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      if (!res.ok) {
        return this.fallbackCandidates(base);
      }
      // 只读前 128KB，足够拿到 <head>
      const buffer = await res.arrayBuffer();
      const limited =
        buffer.byteLength > 128 * 1024 ? buffer.slice(0, 128 * 1024) : buffer;
      html = new TextDecoder('utf-8', { fatal: false }).decode(limited);
    } catch {
      // 网络失败时仍返回常见 favicon 路径作为兜底
      return this.fallbackCandidates(base);
    } finally {
      clearTimeout(timer);
    }

    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headHtml = headMatch ? headMatch[1] : html;

    const candidates = new Set<string>();

    // 解析 <link rel="..." href="...">
    const linkRe = /<link\b[^>]*>/gi;
    const linkMatches = headHtml.match(linkRe) || [];
    for (const tag of linkMatches) {
      const rel = this.extractAttr(tag, 'rel')?.toLowerCase() || '';
      if (
        !/(^|\s)(icon|shortcut icon|apple-touch-icon|apple-touch-icon-precomposed|mask-icon|fluid-icon)(\s|$)/.test(
          rel,
        )
      ) {
        continue;
      }
      const href = this.extractAttr(tag, 'href');
      if (href) {
        const resolved = this.resolveUrl(href, base);
        if (resolved) candidates.add(resolved);
      }
    }

    // 兜底：og:image / twitter:image
    if (candidates.size === 0) {
      const metaRe = /<meta\b[^>]*>/gi;
      const metaMatches = headHtml.match(metaRe) || [];
      for (const tag of metaMatches) {
        const prop =
          this.extractAttr(tag, 'property')?.toLowerCase() ||
          this.extractAttr(tag, 'name')?.toLowerCase() ||
          '';
        if (prop === 'og:image' || prop === 'twitter:image') {
          const content = this.extractAttr(tag, 'content');
          if (content) {
            const resolved = this.resolveUrl(content, base);
            if (resolved) candidates.add(resolved);
          }
        }
      }
    }

    // 最后兜底：常见路径
    if (candidates.size === 0) {
      this.fallbackCandidates(base).forEach((c) => candidates.add(c));
    }

    return Array.from(candidates);
  }

  private extractAttr(tag: string, name: string): string | null {
    const re = new RegExp(
      `\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`,
      'i',
    );
    const m = tag.match(re);
    if (!m) return null;
    return (m[2] ?? m[3] ?? m[4] ?? '').trim() || null;
  }

  private resolveUrl(href: string, base: URL): string | null {
    try {
      // 处理 //example.com/x.png 这种省略协议的情况
      if (href.startsWith('//')) {
        return `${base.protocol}${href}`;
      }
      return new URL(href, base).toString();
    } catch {
      return null;
    }
  }

  private fallbackCandidates(base: URL): string[] {
    return [
      `${base.origin}/favicon.ico`,
      `${base.origin}/favicon.png`,
      `${base.origin}/favicon.svg`,
      `${base.origin}/apple-touch-icon.png`,
    ];
  }
}
