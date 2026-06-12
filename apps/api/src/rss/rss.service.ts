import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlogService } from '../blog/blog.service';
import { SiteConfigService } from '../site-config/site-config.service';

interface RssPostLike {
  id: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  author?: { username?: string | null } | null;
  postTags?: Array<{ tag?: { name?: string | null } | null }> | null;
}

@Injectable()
export class RssService {
  constructor(
    private readonly blogService: BlogService,
    private readonly siteConfigService: SiteConfigService,
    private readonly configService: ConfigService,
  ) {}

  private escapeXml(text: unknown): string {
    if (text === null || text === undefined) return '';
    const str = typeof text === 'string' ? text : JSON.stringify(text);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private wrapCdata(text: unknown): string {
    if (text === null || text === undefined) return '<![CDATA[]]>';
    const str = typeof text === 'string' ? text : JSON.stringify(text);
    const safe = str.split(']]>').join(']]]]><![CDATA[>');
    return `<![CDATA[${safe}]]>`;
  }

  private toRfc822(
    date: Date | string | null | undefined,
    fallback: Date,
  ): string {
    const candidate = date ? new Date(date) : null;
    const valid =
      candidate && !Number.isNaN(candidate.getTime()) ? candidate : fallback;
    return valid.toUTCString();
  }

  private stripContent(raw: string): string {
    let text = raw.trim();

    // 尝试剥离 BlockNote / JSON 文档结构
    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(text);
        const collected: string[] = [];
        const visit = (node: unknown): void => {
          if (typeof node === 'string') {
            collected.push(node);
            return;
          }
          if (Array.isArray(node)) {
            node.forEach(visit);
            return;
          }
          if (node && typeof node === 'object') {
            const obj = node as Record<string, unknown>;
            if (typeof obj.text === 'string') collected.push(obj.text);
            if ('content' in obj) visit(obj.content);
            if ('children' in obj) visit(obj.children);
          }
        };
        visit(parsed);
        if (collected.length > 0) {
          text = collected.join(' ');
        }
      } catch {
        // ignore 解析失败，按原始文本处理
      }
    }

    // 去除常见 Markdown / HTML 标记
    text = text
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#>*_`~-]+/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }

  private extractExcerpt(post: RssPostLike): string {
    const excerpt = (post.excerpt ?? '').trim();
    if (excerpt) return excerpt;
    const content = (post.content ?? '').trim();
    if (!content) return '';
    const plain = this.stripContent(content);
    if (plain.length <= 200) return plain;
    return `${plain.slice(0, 200)}…`;
  }

  private buildSiteUrl(): string {
    const fromEnv = this.configService.get<string>('VITE_WEB_URL');
    const url = (fromEnv && fromEnv.trim()) || 'https://131462.wang';
    return url.replace(/\/+$/, '');
  }

  private buildFeedUrl(): string {
    const fromEnv = this.configService.get<string>('VITE_API_URL');
    let base = (fromEnv && fromEnv.trim()) || 'https://api.131462.wang';
    base = base.replace(/\/+$/, '');
    base = base.replace(/\/api\/v1$/, '');
    return `${base}/rss.xml`;
  }

  async generateRss(): Promise<string> {
    const [siteConfig, postsResult] = await Promise.all([
      this.siteConfigService.findOne(),
      this.blogService.findAllPosts(1, 20, undefined, true),
    ]);

    const now = new Date();
    const siteUrl = this.buildSiteUrl();
    const feedUrl = this.buildFeedUrl();
    const siteName = siteConfig.siteName || 'Whispers of the Heart';
    const siteDescription =
      siteConfig.siteDescription || '不知名独立开发的个人博客';
    const siteLogo = siteConfig.siteLogo || null;

    const rawItems: RssPostLike[] = (postsResult.items ?? []) as RssPostLike[];
    const items = [...rawItems]
      .sort((a, b) => {
        const ta = new Date(a.publishedAt ?? a.createdAt).getTime();
        const tb = new Date(b.publishedAt ?? b.createdAt).getTime();
        return tb - ta;
      })
      .slice(0, 20);

    const channelParts: string[] = [
      `<title>${this.escapeXml(siteName)}</title>`,
      `<link>${this.escapeXml(siteUrl)}</link>`,
      `<description>${this.escapeXml(siteDescription)}</description>`,
      `<language>zh-CN</language>`,
      `<lastBuildDate>${now.toUTCString()}</lastBuildDate>`,
      `<atom:link href="${this.escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    ];

    if (siteLogo) {
      channelParts.push(
        [
          '<image>',
          `<url>${this.escapeXml(siteLogo)}</url>`,
          `<title>${this.escapeXml(siteName)}</title>`,
          `<link>${this.escapeXml(siteUrl)}</link>`,
          '</image>',
        ].join(''),
      );
    }

    const itemXml = items.map((post) => {
      const link = `${siteUrl}/blog/${post.id}`;
      const fallbackDate = new Date(post.createdAt);
      const pubDate = this.toRfc822(post.publishedAt, fallbackDate);
      const creator = post.author?.username || '';
      const excerpt = this.extractExcerpt(post);
      const descriptionBody = excerpt
        ? `${excerpt}\n\n[阅读全文](${link})`
        : `[阅读全文](${link})`;

      const categories = (post.postTags ?? [])
        .map((pt) => pt?.tag?.name)
        .filter((name): name is string => Boolean(name && name.trim()))
        .map((name) => `<category>${this.escapeXml(name)}</category>`)
        .join('');

      const parts: string[] = [
        `<title>${this.escapeXml(post.title)}</title>`,
        `<link>${this.escapeXml(link)}</link>`,
        `<guid isPermaLink="true">${this.escapeXml(link)}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        `<description>${this.wrapCdata(descriptionBody)}</description>`,
      ];

      if (creator) {
        parts.push(`<dc:creator>${this.escapeXml(creator)}</dc:creator>`);
      }

      if (categories) {
        parts.push(categories);
      }

      return `<item>${parts.join('')}</item>`;
    });

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
      '<channel>',
      ...channelParts,
      ...itemXml,
      '</channel>',
      '</rss>',
    ].join('');

    return xml;
  }
}
