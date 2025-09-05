import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePostDto, UpdatePostDto, CreateTagDto, UpdateTagDto } from './dto/blog.dto';
import { PostStatus } from '@prisma/client';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // 文章相关方法
  async createPost(createPostDto: CreatePostDto, authorId: string) {
    const { tags, ...postData } = createPostDto;

    // 生成唯一的 slug
    const slug = await this.generateUniqueSlug(postData.title);

    // 创建文章
    const post = await this.prisma.post.create({
      data: {
        ...postData,
        slug,
        authorId,
        publishedAt: postData.status === PostStatus.PUBLISHED ? new Date() : null,
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

    return this.findOnePost(post.id);
  }

  async findAllPosts(page = 1, limit = 10, search?: string, status?: PostStatus, category?: string) {
    try {
      // 确保page和limit是数字类型
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { content: { contains: search } },
          { excerpt: { contains: search } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (category) {
        where.category = category;
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

  async findOnePost(id: string) {
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

    // 增加浏览量
    await this.prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return post;
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
      where: { slug },
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
      select: { role: true },
    });

    if (!currentUser) {
      throw new NotFoundException('用户不存在');
    }

    // 检查权限：只有文章作者、ADMIN或EDITOR可以修改文章
    const isAuthor = post.authorId === userId;
    const isAdmin = currentUser.role === 'ADMIN';
    const isEditor = currentUser.role === 'EDITOR';

    if (!isAuthor && !isAdmin && !isEditor) {
      throw new NotFoundException('无权限修改此文章');
    }

    const { tags, ...updateData } = updatePostDto;
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

    // 如果状态变为已发布，设置发布时间
    if (updateData.status === PostStatus.PUBLISHED && post.status !== PostStatus.PUBLISHED) {
      dataToUpdate.publishedAt = new Date();
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

    return this.findOnePost(id);
  }

  async removePost(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 获取当前用户信息
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      throw new NotFoundException('用户不存在');
    }

    // 检查权限：只有文章作者、ADMIN或EDITOR可以删除文章
    const isAuthor = post.authorId === userId;
    const isAdmin = currentUser.role === 'ADMIN';
    const isEditor = currentUser.role === 'EDITOR';

    if (!isAuthor && !isAdmin && !isEditor) {
      throw new NotFoundException('无权限删除此文章');
    }

    await this.prisma.post.delete({
      where: { id },
    });

    return { message: '文章删除成功' };
  }

  async getCategories() {
    const categories = await this.prisma.post.groupBy({
      by: ['category'],
      where: {
        category: { not: null },
        status: PostStatus.PUBLISHED,
      },
      _count: {
        category: true,
      },
    });

    return categories.map(cat => ({
      name: cat.category,
      count: cat._count.category,
    }));
  }

  // 标签相关方法
  async createTag(createTagDto: CreateTagDto) {
    const { name, color } = createTagDto;

    // 检查标签名称是否已存在
    const existingTag = await this.prisma.tag.findUnique({
      where: { name },
    });

    if (existingTag) {
      throw new ConflictException('标签已存在');
    }

    // 生成唯一的标签 slug
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

    return tags;
  }

  async updateTag(id: string, updateTagDto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    const { name, color } = updateTagDto;
    const updateData: any = { color };

    if (name && name !== tag.name) {
      // 检查新名称是否已存在
      const existingTag = await this.prisma.tag.findUnique({
        where: { name },
      });

      if (existingTag) {
        throw new ConflictException('标签名称已存在');
      }

      updateData.name = name;
      updateData.slug = this.generateSlug(name);
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
    let slug = baseSlug;
    let counter = 1;

    // 检查slug是否已存在，如果存在则添加数字后缀
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
    let slug = baseSlug;
    let counter = 1;

    // 检查标签slug是否已存在，如果存在则添加数字后缀
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
          // 生成唯一的标签 slug
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
    // 检查文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 检查是否已经点赞
    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // 取消点赞
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });

      // 更新文章点赞数
      await this.prisma.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } },
      });

      return { liked: false, likesCount: post.likes - 1 };
    } else {
      // 添加点赞
      await this.prisma.like.create({
        data: {
          postId,
          userId,
        },
      });

      // 更新文章点赞数
      await this.prisma.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } },
      });

      return { liked: true, likesCount: post.likes + 1 };
    }
  }

  async getLikeStatus(postId: string, userId: string | null) {
    // 获取文章点赞数
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { likes: true },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 如果用户未登录，只返回点赞数
    if (!userId) {
      return { 
        liked: false, 
        likesCount: post.likes 
      };
    }

    // 如果用户已登录，检查是否已点赞
    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return { 
      liked: !!existingLike, 
      likesCount: post.likes 
    };
  }

  // 收藏相关方法
  async toggleFavorite(postId: string, userId: string) {
    // 检查文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 检查是否已经收藏
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingFavorite) {
      // 取消收藏
      await this.prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });

      return { favorited: false };
    } else {
      // 添加收藏
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
    // 如果用户未登录，返回未收藏状态
    if (!userId) {
      return { favorited: false };
    }

    // 如果用户已登录，检查是否已收藏
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
}
