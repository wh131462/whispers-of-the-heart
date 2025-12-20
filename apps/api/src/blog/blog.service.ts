import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePostDto, UpdatePostDto, CreateTagDto, UpdateTagDto } from './dto/blog.dto';
import { MediaUsageService } from '../media/media-usage.service';

@Injectable()
export class BlogService {
  constructor(
    private prisma: PrismaService,
    private mediaUsageService: MediaUsageService,
  ) {}

  // 文章相关方法
  async createPost(createPostDto: CreatePostDto, authorId: string) {
    const { tags, published, ...postData } = createPostDto;

    // 验证作者是否存在
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true, username: true, isAdmin: true }
    });

    if (!author) {
      throw new NotFoundException(`作者不存在，用户ID: ${authorId}`);
    }

    // 生成唯一的 slug
    const slug = await this.generateUniqueSlug(postData.title);

    // 创建文章
    const post = await this.prisma.post.create({
      data: {
        ...postData,
        slug,
        authorId,
        published: published || false,
        publishedAt: published ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        postTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 处理标签
    if (tags && tags.length > 0) {
      await this.handlePostTags(post.id, tags);
    }

    // 同步媒体使用记录
    if (postData.coverImage) {
      await this.mediaUsageService.syncDirectUsage('post', post.id, 'coverImage', postData.coverImage);
    }
    if (postData.content) {
      await this.mediaUsageService.syncContentUsage('post', post.id, 'content', postData.content);
    }

    return this.findOnePost(post.id);
  }

  async findAllPosts(page = 1, limit = 10, search?: string, published?: boolean) {
    try {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (published !== undefined) {
        where.published = published;
      }

      const [posts, total] = await Promise.all([
        this.prisma.post.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            postTags: {
              include: {
                tag: true,
              },
            },
            _count: {
              select: {
                postComments: true,
                postLikes: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.post.count({ where }),
      ]);

      return {
        items: posts,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      };
    } catch (error) {
      console.error('Error in findAllPosts:', error);
      throw error;
    }
  }

  // 高级搜索方法
  async searchPosts(options: {
    query?: string;
    page?: number;
    limit?: number;
    tag?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const {
        query,
        page = 1,
        limit = 20,
        tag,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 20;
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        published: true, // 只搜索已发布的文章
      };

      // 搜索关键词
      if (query) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
        ];
      }

      // 标签筛选
      if (tag) {
        where.postTags = {
          some: {
            tag: {
              OR: [
                { id: tag },
                { slug: tag },
                { name: tag }
              ]
            }
          }
        };
      }

      // 排序选项
      const orderBy: any = {};
      if (sortBy === 'views') {
        orderBy.views = sortOrder;
      } else if (sortBy === 'publishedAt') {
        orderBy.publishedAt = sortOrder;
      } else {
        orderBy.createdAt = sortOrder;
      }

      const [posts, total] = await Promise.all([
        this.prisma.post.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            postTags: {
              include: {
                tag: true,
              },
            },
            _count: {
              select: {
                postComments: true,
                postLikes: true,
              },
            },
          },
          orderBy,
        }),
        this.prisma.post.count({ where }),
      ]);

      return {
        items: posts,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      };
    } catch (error) {
      console.error('Error in searchPosts:', error);
      throw error;
    }
  }

  async findOnePost(id: string, incrementViews: boolean = true) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        postTags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            postComments: true,
            postLikes: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 只有在需要时才增加浏览量
    if (incrementViews) {
      await this.prisma.post.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    }

    return post;
  }

  async findOnePostForEdit(id: string) {
    return this.findOnePost(id, false);
  }

  async findPostBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        postTags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            postComments: true,
            postLikes: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 增加浏览量
    await this.prisma.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    return post;
  }

  async updatePost(id: string, updatePostDto: UpdatePostDto, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 获取当前用户信息
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!currentUser) {
      throw new NotFoundException('用户不存在');
    }

    // 检查权限：只有文章作者或管理员可以修改文章
    const isAuthor = post.authorId === userId;
    const isAdmin = currentUser.isAdmin;

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('无权限修改此文章');
    }

    const { tags, published, ...updateData } = updatePostDto;
    const dataToUpdate: any = { ...updateData };

    // 如果更新标题，需要重新生成 slug
    if (updateData.title && updateData.title !== post.title) {
      const newSlug = this.generateSlug(updateData.title);

      // 检查新 slug 是否已存在
      const existingPost = await this.prisma.post.findUnique({
        where: { slug: newSlug },
      });

      if (existingPost && existingPost.id !== id) {
        throw new ConflictException('文章标题已存在');
      }

      dataToUpdate.slug = newSlug;
    }

    // 处理发布状态
    if (published !== undefined) {
      dataToUpdate.published = published;
      if (published && !post.published) {
        dataToUpdate.publishedAt = new Date();
      }
    }

    // 更新文章
    await this.prisma.post.update({
      where: { id },
      data: dataToUpdate,
    });

    // 处理标签
    if (tags) {
      await this.handlePostTags(id, tags);
    }

    // 同步媒体使用记录
    if ('coverImage' in updateData) {
      await this.mediaUsageService.syncDirectUsage('post', id, 'coverImage', updateData.coverImage);
    }
    if ('content' in updateData) {
      await this.mediaUsageService.syncContentUsage('post', id, 'content', updateData.content);
    }

    return this.findOnePost(id, false);
  }

  async removePost(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 获取当前用户信息
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!currentUser) {
      throw new NotFoundException('用户不存在');
    }

    // 检查权限：只有文章作者或管理员可以删除文章
    const isAuthor = post.authorId === userId;
    const isAdmin = currentUser.isAdmin;

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('无权限删除此文章');
    }

    // 删除文章的媒体使用记录
    await this.mediaUsageService.deleteEntityUsages('post', id);

    // 直接删除文章（级联删除相关的标签关联、评论、点赞等）
    await this.prisma.post.delete({
      where: { id },
    });

    return { message: '文章删除成功' };
  }

  // 标签相关方法
  async createTag(createTagDto: CreateTagDto) {
    const { name, color } = createTagDto;

    const existingTag = await this.prisma.tag.findUnique({
      where: { name },
    });

    if (existingTag) {
      throw new ConflictException('标签已存在');
    }

    const uniqueSlug = await this.generateUniqueTagSlug(name);

    const tag = await this.prisma.tag.create({
      data: {
        name,
        slug: uniqueSlug,
        color,
      },
    });

    return tag;
  }

  async findAllTags() {
    const tags = await this.prisma.tag.findMany({
      include: {
        _count: {
          select: {
            postTags: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      postCount: tag._count.postTags,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    }));
  }

  async getTagById(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            postTags: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      postCount: tag._count.postTags,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    };
  }

  async getTagPosts(id: string, page: number = 1, limit: number = 10) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    const posts = await this.prisma.post.findMany({
      where: {
        published: true,
        postTags: {
          some: {
            tagId: id,
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        postTags: {
          include: {
            tag: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.post.count({
      where: {
        published: true,
        postTags: {
          some: {
            tagId: id,
          },
        },
      },
    });

    const processedPosts = posts.map(post => ({
      ...post,
      tags: post.postTags.map(pt => pt.tag.name),
    }));

    return {
      items: processedPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateTag(id: string, updateTagDto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    const { name, color } = updateTagDto;
    const updateData: any = {};

    if (color !== undefined) {
      updateData.color = color;
    }

    if (name && name !== tag.name) {
      const existingTag = await this.prisma.tag.findUnique({
        where: { name },
      });

      if (existingTag) {
        throw new ConflictException('标签名称已存在');
      }

      updateData.name = name;
      updateData.slug = await this.generateUniqueTagSlug(name);
    }

    const updatedTag = await this.prisma.tag.update({
      where: { id },
      data: updateData,
    });

    return updatedTag;
  }

  async removeTag(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    // 直接删除标签（会级联删除 PostTag 关联）
    await this.prisma.tag.delete({
      where: { id },
    });

    return { message: '标签删除成功' };
  }

  // 私有方法
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    let baseSlug = this.generateSlug(title);

    // 如果 baseSlug 为空，使用时间戳
    if (!baseSlug) {
      baseSlug = `post-${Date.now()}`;
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingPost = await this.prisma.post.findUnique({
        where: { slug },
      });

      if (!existingPost) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private async generateUniqueTagSlug(name: string): Promise<string> {
    let baseSlug = this.generateSlug(name);

    if (!baseSlug) {
      baseSlug = `tag-${Date.now()}`;
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingTag = await this.prisma.tag.findUnique({
        where: { slug },
      });

      if (!existingTag) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private async handlePostTags(postId: string, tagNames: string[]) {
    // 删除现有的标签关联
    await this.prisma.postTag.deleteMany({
      where: { postId },
    });

    // 创建或查找标签
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await this.prisma.tag.findUnique({
          where: { name },
        });

        if (!tag) {
          const uniqueSlug = await this.generateUniqueTagSlug(name);
          tag = await this.prisma.tag.create({
            data: {
              name,
              slug: uniqueSlug,
            },
          });
        }

        return tag;
      })
    );

    // 创建标签关联
    await Promise.all(
      tags.map((tag) =>
        this.prisma.postTag.create({
          data: {
            postId,
            tagId: tag.id,
          },
        })
      )
    );
  }

  // 点赞相关方法
  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    const likesCount = await this.prisma.like.count({
      where: { postId },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });

      return { liked: false, likesCount: likesCount - 1 };
    } else {
      await this.prisma.like.create({
        data: {
          postId,
          userId,
        },
      });

      return { liked: true, likesCount: likesCount + 1 };
    }
  }

  async getLikeStatus(postId: string, userId: string | null) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const likesCount = await this.prisma.like.count({
      where: { postId },
    });

    if (!userId) {
      return { liked: false, likesCount };
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return { liked: !!existingLike, likesCount };
  }

  // 收藏相关方法
  async toggleFavorite(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingFavorite) {
      await this.prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });

      return { favorited: false };
    } else {
      await this.prisma.favorite.create({
        data: {
          postId,
          userId,
        },
      });

      return { favorited: true };
    }
  }

  async getFavoriteStatus(postId: string, userId: string | null) {
    if (!userId) {
      return { favorited: false };
    }

    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return { favorited: !!existingFavorite };
  }

  async getUserFavorites(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
              postTags: {
                include: {
                  tag: true,
                },
              },
              _count: {
                select: {
                  postComments: true,
                  postLikes: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      items: favorites.map(fav => fav.post),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  // 站点统计方法
  async getSiteStats() {
    const [totalPosts, totalComments, totalLikes, viewsResult] = await Promise.all([
      this.prisma.post.count({ where: { published: true } }),
      this.prisma.comment.count({ where: { isApproved: true, deletedAt: null } }),
      this.prisma.like.count(),
      this.prisma.post.aggregate({
        _sum: { views: true },
        where: { published: true },
      }),
    ]);

    return {
      totalPosts,
      totalComments,
      totalViews: viewsResult._sum.views || 0,
      totalLikes,
    };
  }
}
