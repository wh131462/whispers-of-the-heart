import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { ContentModerationService } from '../common/services/content-moderation.service';

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private contentModerationService: ContentModerationService
  ) {}

  async create(createCommentDto: CreateCommentDto) {
    // 检查文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: createCommentDto.postId },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 检查父评论是否存在
    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }
    }

    // 内容审核
    const moderationResult = await this.contentModerationService.moderateContent(createCommentDto.content);
    
    // 处理匿名用户
    let authorId = createCommentDto.authorId;
    if (authorId === 'anonymous') {
      // 查找或创建匿名用户
      let anonymousUser = await this.prisma.user.findFirst({
        where: { username: 'anonymous' },
      });

      if (!anonymousUser) {
        anonymousUser = await this.prisma.user.create({
          data: {
            username: 'anonymous',
            email: 'anonymous@example.com',
            password: 'anonymous', // 匿名用户不需要密码
            role: 'USER',
          },
        });
      }
      authorId = anonymousUser.id;
    }

    const comment = await this.prisma.comment.create({
      data: {
        ...createCommentDto,
        authorId,
        isApproved: moderationResult.isApproved, // 根据审核结果决定是否通过
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
            createdAt: true,
            isApproved: true,
          },
        },
      },
    });

    return comment;
  }

  async findAll(page = 1, limit = 10, search?: string, status?: string, postId?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { author: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      if (status === 'APPROVED') {
        where.isApproved = true;
      } else if (status === 'PENDING') {
        where.isApproved = false;
      }
    }

    if (postId) {
      where.postId = postId;
    }

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              author: {
                select: {
                  username: true,
                },
              },
            },
          },
          replies: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              isApproved: true,
              author: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    // 转换数据格式，将isApproved转换为status字段
    const formattedComments = comments.map(comment => ({
      ...comment,
      status: comment.isApproved ? 'APPROVED' : 'PENDING',
      // 添加IP地址字段（如果存在）
      ipAddress: comment.ipAddress || null,
    }));

    return {
      items: formattedComments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  async findByPostId(postId: string, page = 1, limit = 10, userId?: string) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          isApproved: true, // 只显示已审核通过的评论
          parentId: null, // 只显示顶级评论
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          replies: {
            where: { isApproved: true },
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              content: true,
              createdAt: true,
              likes: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
          commentLikes: userId ? {
            where: { userId },
            select: { id: true },
          } : false,
        },
      }),
      this.prisma.comment.count({
        where: {
          postId,
          isApproved: true,
          parentId: null,
        },
      }),
    ]);

    // 为每个评论添加点赞状态
    const commentsWithLikeStatus = comments.map(comment => ({
      ...comment,
      isLiked: userId ? comment.commentLikes.length > 0 : false,
      commentLikes: undefined, // 移除原始数据
      replies: comment.replies.map(reply => ({
        ...reply,
        isLiked: false, // 回复暂时不显示点赞状态，可以后续添加
      })),
    }));

    return {
      items: commentsWithLikeStatus,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
            createdAt: true,
            isApproved: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
            createdAt: true,
            isApproved: true,
          },
        },
      },
    });

    return updatedComment;
  }

  async remove(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 删除评论及其所有回复
    await this.prisma.comment.deleteMany({
      where: {
        OR: [
          { id },
          { parentId: id },
        ],
      },
    });

    return { message: '评论删除成功' };
  }

  async approve(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: { isApproved: true },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
            createdAt: true,
            isApproved: true,
          },
        },
      },
    });

    return updatedComment;
  }

  async reject(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: { isApproved: false },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
            createdAt: true,
            isApproved: true,
          },
        },
      },
    });

    return updatedComment;
  }

  // 评论点赞相关方法
  async toggleLike(commentId: string, userId: string) {
    // 检查评论是否存在
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 检查是否已经点赞
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      // 取消点赞
      await this.prisma.commentLike.delete({
        where: { id: existingLike.id },
      });

      // 更新评论点赞数
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { likes: { decrement: 1 } },
      });

      return { liked: false, likesCount: comment.likes - 1 };
    } else {
      // 添加点赞
      await this.prisma.commentLike.create({
        data: {
          commentId,
          userId,
        },
      });

      // 更新评论点赞数
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { likes: { increment: 1 } },
      });

      return { liked: true, likesCount: comment.likes + 1 };
    }
  }

  async getLikeStatus(commentId: string, userId: string | null) {
    // 获取评论点赞数
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { likes: true },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 如果用户未登录，只返回点赞数
    if (!userId) {
      return { 
        liked: false, 
        likesCount: comment.likes 
      };
    }

    // 如果用户已登录，检查是否已点赞
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    return {
      liked: !!existingLike,
      likesCount: comment.likes,
    };
  }

  // 批量审核方法
  async batchApprove(commentIds: string[]) {
    const result = await this.prisma.comment.updateMany({
      where: {
        id: { in: commentIds },
        isApproved: false, // 只更新未审核的评论
      },
      data: {
        isApproved: true,
        updatedAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
      message: `成功审核 ${result.count} 条评论`,
    };
  }

  async batchReject(commentIds: string[]) {
    const result = await this.prisma.comment.updateMany({
      where: {
        id: { in: commentIds },
        isApproved: false, // 只更新未审核的评论
      },
      data: {
        isApproved: false,
        updatedAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
      message: `成功拒绝 ${result.count} 条评论`,
    };
  }
}
