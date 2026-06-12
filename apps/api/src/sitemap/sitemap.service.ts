import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlogService } from '../blog/blog.service';

interface SitemapPostLike {
  slug: string;
  updatedAt: Date | string;
  publishedAt?: Date | string | null;
}

interface StaticEntry {
  path: string;
  changefreq: string;
  priority: string;
  dynamicLastmod?: boolean;
}

const STATIC_ENTRIES: StaticEntry[] = [
  { path: '/', changefreq: 'daily', priority: '1.0', dynamicLastmod: true },
  {
    path: '/posts',
    changefreq: 'daily',
    priority: '0.9',
    dynamicLastmod: true,
  },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/apps', changefreq: 'monthly', priority: '0.6' },
  { path: '/favorites', changefreq: 'monthly', priority: '0.3' },
  { path: '/search', changefreq: 'monthly', priority: '0.3' },
];

@Injectable()
export class SitemapService {
  constructor(
    private readonly blogService: BlogService,
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

  private toW3cDatetime(
    date: Date | string | null | undefined,
    fallback: Date,
  ): string {
    const candidate = date ? new Date(date) : null;
    const valid =
      candidate && !Number.isNaN(candidate.getTime()) ? candidate : fallback;
    return valid.toISOString();
  }

  private buildSiteUrl(): string {
    const fromEnv = this.configService.get<string>('VITE_WEB_URL');
    const url = (fromEnv && fromEnv.trim()) || 'https://131462.wang';
    return url.replace(/\/+$/, '');
  }

  private buildUrlEntry(
    loc: string,
    lastmod: string,
    changefreq: string,
    priority: string,
  ): string {
    return [
      '<url>',
      `<loc>${this.escapeXml(loc)}</loc>`,
      `<lastmod>${this.escapeXml(lastmod)}</lastmod>`,
      `<changefreq>${this.escapeXml(changefreq)}</changefreq>`,
      `<priority>${this.escapeXml(priority)}</priority>`,
      '</url>',
    ].join('');
  }

  async generateSitemap(): Promise<string> {
    const postsResult = await this.blogService.findAllPosts(
      1,
      5000,
      undefined,
      true,
    );

    const now = new Date();
    const siteUrl = this.buildSiteUrl();
    const rawPosts: SitemapPostLike[] = (postsResult.items ??
      []) as SitemapPostLike[];

    const latestPostUpdate =
      rawPosts.length > 0
        ? rawPosts.reduce<Date>((acc, post) => {
            const candidate = new Date(post.updatedAt);
            return !Number.isNaN(candidate.getTime()) && candidate > acc
              ? candidate
              : acc;
          }, new Date(0))
        : now;

    const dynamicLastmod = this.toW3cDatetime(latestPostUpdate, now);
    const staticLastmod = this.toW3cDatetime(now, now);

    const staticUrls = STATIC_ENTRIES.map((entry) => {
      const lastmod = entry.dynamicLastmod ? dynamicLastmod : staticLastmod;
      return this.buildUrlEntry(
        `${siteUrl}${entry.path}`,
        lastmod,
        entry.changefreq,
        entry.priority,
      );
    });

    const postUrls = rawPosts.map((post) => {
      const lastmod = this.toW3cDatetime(post.updatedAt, now);
      return this.buildUrlEntry(
        `${siteUrl}/posts/${post.slug}`,
        lastmod,
        'weekly',
        '0.8',
      );
    });

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...staticUrls,
      ...postUrls,
      '</urlset>',
    ].join('');
  }
}
