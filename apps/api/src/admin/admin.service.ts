import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    try {
      const [
        totalUsers,
        totalPosts,
        publishedPosts,
        draftPosts,
        totalComments,
        pendingComments,
        totalMedia,
        totalViews,
        totalTags,
        recentPosts,
        recentComments,
        monthlyStats,
        tagStats,
        userGrowth,
        postGrowth
      ] = await Promise.all([
        // 总用户数
        this.prisma.user.count(),

        // 总文章数
        this.prisma.post.count(),

        // 已发布文章数
        this.prisma.post.count({ where: { published: true } }),

        // 草稿数
        this.prisma.post.count({ where: { published: false } }),

        // 总评论数
        this.prisma.comment.count({ where: { deletedAt: null } }),

        // 待审核评论数
        this.prisma.comment.count({ where: { isApproved: false, deletedAt: null } }),

        // 总媒体数
        this.prisma.media.count(),

        // 总浏览量
        this.prisma.post.aggregate({ _sum: { views: true } }).then(r => r._sum.views || 0),

        // 总标签数
        this.prisma.tag.count(),

        // 最近文章
        this.prisma.post.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            views: true,
            published: true,
            createdAt: true,
            _count: {
              select: {
                postComments: true,
                postLikes: true
              }
            }
          }
        }),

        // 最近评论
        this.prisma.comment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                username: true
              }
            },
            post: {
              select: {
                title: true
              }
            }
          }
        }),

        // 月度统计
        this.getMonthlyStats(),

        // 标签统计
        this.getTagStats(),

        // 用户增长趋势
        this.getUserGrowthStats(),

        // 文章增长趋势
        this.getPostGrowthStats()
      ]);

      return {
        totalUsers,
        totalPosts,
        publishedPosts,
        draftPosts,
        totalComments,
        pendingComments,
        totalMedia,
        totalViews,
        totalTags,

        userGrowth: userGrowth > 0 ? `+${userGrowth}%` : `${userGrowth}%`,
        postGrowth: postGrowth > 0 ? `+${postGrowth}%` : `${postGrowth}%`,

        recentPosts: recentPosts.map(post => ({
          id: post.id,
          title: post.title,
          views: post.views,
          likes: post._count.postLikes,
          comments: post._count.postComments,
          published: post.published,
          createdAt: post.createdAt.toISOString().split('T')[0]
        })),

        recentComments: recentComments.map(comment => ({
          id: comment.id,
          content: comment.content,
          author: comment.author.username,
          postTitle: comment.post.title,
          createdAt: comment.createdAt.toISOString()
        })),

        monthlyStats,
        tagStats,

        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  }

  private async getMonthlyStats() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const posts = await this.prisma.post.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true
      }
    });

    // 处理月度数据
    const months: Array<{ month: string; posts: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const count = posts.filter(p =>
        p.createdAt.getFullYear() === date.getFullYear() &&
        p.createdAt.getMonth() === date.getMonth()
      ).length;

      months.push({
        month: monthKey,
        posts: count
      });
    }

    return months;
  }

  private async getTagStats() {
    const tags = await this.prisma.tag.findMany({
      include: {
        _count: {
          select: {
            postTags: true
          }
        }
      },
      orderBy: {
        postTags: {
          _count: 'desc'
        }
      },
      take: 10
    });

    return tags.map(tag => ({
      name: tag.name,
      count: tag._count.postTags
    }));
  }

  private async getUserGrowthStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recentUsers, previousUsers] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      })
    ]);

    if (previousUsers === 0) return recentUsers > 0 ? 100 : 0;
    return Math.round(((recentUsers - previousUsers) / previousUsers) * 100);
  }

  private async getPostGrowthStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recentPosts, previousPosts] = await Promise.all([
      this.prisma.post.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      this.prisma.post.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      })
    ]);

    if (previousPosts === 0) return recentPosts > 0 ? 100 : 0;
    return Math.round(((recentPosts - previousPosts) / previousPosts) * 100);
  }
}
