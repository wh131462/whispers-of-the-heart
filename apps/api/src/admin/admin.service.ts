import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    try {
      // 获取基础统计数据
      const [
        totalUsers,
        totalPosts,
        totalComments,
        totalMedia,
        recentPosts,
        recentComments,
        monthlyStats,
        categoryStats,
        userGrowth,
        postGrowth
      ] = await Promise.all([
        // 总用户数
        this.prisma.user.count(),
        
        // 总文章数
        this.prisma.post.count(),
        
        // 总评论数
        this.prisma.comment.count(),
        
        // 总媒体数（假设有媒体表，这里先用文章数代替）
        this.prisma.post.count({ where: { coverImage: { not: null } } }),
        
        // 最近文章（按创建时间排序，限制5条）
        this.prisma.post.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            views: true,
            likes: true,
            createdAt: true,
            _count: {
              select: {
                postComments: true
              }
            }
          }
        }),
        
        // 最近评论（按创建时间排序，限制5条）
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
        
        // 月度统计（最近6个月）
        this.getMonthlyStats(),
        
        // 分类统计
        this.getCategoryStats(),
        
        // 用户增长趋势（最近30天）
        this.getUserGrowthStats(),
        
        // 文章增长趋势（最近30天）
        this.getPostGrowthStats()
      ]);

      return {
        // 基础统计
        totalUsers,
        totalPosts,
        totalComments,
        totalMedia,
        
        // 增长趋势
        userGrowth: userGrowth > 0 ? `+${userGrowth}%` : `${userGrowth}%`,
        postGrowth: postGrowth > 0 ? `+${postGrowth}%` : `${postGrowth}%`,
        
        // 最近数据
        recentPosts: recentPosts.map(post => ({
          id: post.id,
          title: post.title,
          views: post.views,
          likes: post.likes,
          comments: post._count.postComments,
          createdAt: post.createdAt.toISOString().split('T')[0]
        })),
        
        recentComments: recentComments.map(comment => ({
          id: comment.id,
          content: comment.content,
          author: comment.author.username,
          postTitle: comment.post.title,
          createdAt: comment.createdAt.toISOString()
        })),
        
        // 图表数据
        monthlyStats,
        categoryStats,
        
        // 时间戳
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
    
    const monthlyData = await this.prisma.post.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      _count: {
        id: true
      }
    });

    // 处理月度数据，确保每个月都有数据
    const months: Array<{ month: string; posts: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthData = monthlyData.find(d => 
        d.createdAt.getFullYear() === date.getFullYear() && 
        d.createdAt.getMonth() === date.getMonth()
      );
      
      months.push({
        month: monthKey,
        posts: monthData?._count.id || 0
      });
    }
    
    return months;
  }

  private async getCategoryStats() {
    const categories = await this.prisma.post.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      where: {
        category: {
          not: null
        }
      }
    });

    return categories.map(cat => ({
      name: cat.category || '未分类',
      count: cat._count.id
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
