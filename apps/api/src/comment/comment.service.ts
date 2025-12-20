import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { ContentModerationService } from '../common/services/content-moderation.service';
import { MailService } from '../mail/mail.service';

// 用户编辑评论的时间限制（分钟）
const EDIT_TIME_LIMIT_MINUTES = 15;

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private contentModerationService: ContentModerationService,
    private mailService: MailService,
  ) {}

  async create(createCommentDto: CreateCommentDto & { authorId?: string }) {
    // 验证 authorId
    if (!createCommentDto.authorId) {
      throw new BadRequestException('用户未登录');
    }

    // 检查文章是否存在，包含作者信息用于通知
    const post = await this.prisma.post.findUnique({
      where: { id: createCommentDto.postId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            emailNotifications: true,
            notifyOnComment: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 获取评论者信息
    const commenter = await this.prisma.user.findUnique({
      where: { id: createCommentDto.authorId },
      select: { username: true },
    });

    // 检查父评论是否存在
    let parentComment: any = null;
    if (createCommentDto.parentId) {
      parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentId },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              username: true,
              emailNotifications: true,
              notifyOnReply: true,
            },
          },
        },
      });

      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }
    }

    // 内容审核
    const moderationResult = await this.contentModerationService.moderateContent(createCommentDto.content);

    // 确保 authorId 是 string 类型
    const authorId: string = createCommentDto.authorId;

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        postId: createCommentDto.postId,
        parentId: createCommentDto.parentId,
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

    // 发送邮件通知（异步，不阻塞响应）
    this.sendCommentNotifications(
      post,
      parentComment,
      commenter?.username || '匿名用户',
      createCommentDto.content,
      createCommentDto.authorId,
    );

    return comment;
  }

  /**
   * 发送评论通知邮件（私有方法）
   */
  private async sendCommentNotifications(
    post: any,
    parentComment: any,
    commenterName: string,
    commentContent: string,
    commenterId: string,
  ) {
    try {
      if (parentComment) {
        // 这是一个回复，通知被回复者
        const parentAuthor = parentComment.author;
        if (
          parentAuthor &&
          parentAuthor.id !== commenterId && // 不通知自己
          parentAuthor.emailNotifications &&
          parentAuthor.notifyOnReply
        ) {
          await this.mailService.sendReplyNotification(
            parentAuthor.email,
            parentAuthor.username,
            commenterName,
            post.title,
            post.slug,
            parentComment.content,
            commentContent,
          );
        }
      } else {
        // 这是顶级评论，通知文章作者
        const postAuthor = post.author;
        if (
          postAuthor &&
          postAuthor.id !== commenterId && // 不通知自己
          postAuthor.emailNotifications &&
          postAuthor.notifyOnComment
        ) {
          await this.mailService.sendCommentNotification(
            postAuthor.email,
            postAuthor.username,
            commenterName,
            post.title,
            post.slug,
            commentContent,
          );
        }
      }
    } catch (error) {
      // 邮件发送失败不影响评论创建
      console.error('Failed to send comment notification:', error);
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    status?: string,
    postId?: string,
    includeDeleted = false,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    // 默认排除软删除的评论
    if (!includeDeleted) {
      where.deletedAt = null;
    }

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
      } else if (status === 'DELETED') {
        where.deletedAt = { not: null };
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
      status: comment.deletedAt ? 'DELETED' : comment.isApproved ? 'APPROVED' : 'PENDING',
      // 添加IP地址字段（如果存在）
      ipAddress: comment.ipAddress || null,
      // 新增字段
      isEdited: !!comment.editedAt,
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

  async findByPostId(postId: string, page = 1, limit = 10, userId?: string, sortBy: 'newest' | 'oldest' | 'popular' = 'newest') {
    const skip = (page - 1) * limit;

    // 根据排序方式设置排序规则
    let orderBy: any[] = [];
    // 置顶评论始终在最前面
    orderBy.push({ isPinned: 'desc' });

    switch (sortBy) {
      case 'oldest':
        orderBy.push({ createdAt: 'asc' });
        break;
      case 'popular':
        // 按点赞数排序需要在应用层处理，这里先按时间
        orderBy.push({ createdAt: 'desc' });
        break;
      case 'newest':
      default:
        orderBy.push({ createdAt: 'desc' });
    }

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          isApproved: true, // 只显示已审核通过的评论
          parentId: null, // 只显示顶级评论
          deletedAt: null, // 排除软删除的评论
        },
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          replies: {
            where: { isApproved: true, deletedAt: null },
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              content: true,
              createdAt: true,
              editedAt: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
              _count: {
                select: { commentLikes: true },
              },
            },
          },
          _count: {
            select: { commentLikes: true },
          },
        },
      }),
      this.prisma.comment.count({
        where: {
          postId,
          isApproved: true,
          parentId: null,
          deletedAt: null,
        },
      }),
    ]);

    // 检查用户是否已点赞
    let userLikedCommentIds: Set<string> = new Set();
    if (userId) {
      const userLikes = await this.prisma.commentLike.findMany({
        where: {
          userId,
          commentId: { in: comments.map(c => c.id) },
        },
        select: { commentId: true },
      });
      userLikedCommentIds = new Set(userLikes.map(l => l.commentId));
    }

    // 为每个评论添加点赞状态和其他信息
    const commentsWithLikeStatus = comments.map(comment => ({
      ...comment,
      likes: comment._count.commentLikes,
      isLiked: userId ? userLikedCommentIds.has(comment.id) : false,
      isEdited: !!(comment as any).editedAt,
      _count: undefined, // 移除原始数据
      replies: comment.replies.map(reply => ({
        ...reply,
        likes: (reply as any)._count?.commentLikes || 0,
        isLiked: false, // 回复暂时不显示点赞状态
        isEdited: !!(reply as any).editedAt,
        _count: undefined,
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

    // 获取当前点赞数
    const likesCount = await this.prisma.commentLike.count({
      where: { commentId },
    });

    if (existingLike) {
      // 取消点赞
      await this.prisma.commentLike.delete({
        where: { id: existingLike.id },
      });

      return { liked: false, likesCount: likesCount - 1 };
    } else {
      // 添加点赞
      await this.prisma.commentLike.create({
        data: {
          commentId,
          userId,
        },
      });

      return { liked: true, likesCount: likesCount + 1 };
    }
  }

  async getLikeStatus(commentId: string, userId: string | null) {
    // 检查评论是否存在
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 获取评论点赞数
    const likesCount = await this.prisma.commentLike.count({
      where: { commentId },
    });

    // 如果用户未登录，只返回点赞数
    if (!userId) {
      return {
        liked: false,
        likesCount
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
      likesCount,
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

  // ===== 新增功能：软删除 =====

  /**
   * 软删除评论（管理员）
   */
  async softDelete(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.deletedAt) {
      throw new BadRequestException('评论已被删除');
    }

    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: '评论已移至回收站' };
  }

  /**
   * 恢复软删除的评论（管理员）
   */
  async restore(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (!comment.deletedAt) {
      throw new BadRequestException('评论未被删除');
    }

    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: null },
    });

    return { message: '评论已恢复' };
  }

  /**
   * 永久删除评论（管理员）
   */
  async permanentDelete(id: string) {
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

    return { message: '评论已永久删除' };
  }

  /**
   * 获取回收站评论列表（管理员）
   */
  async getTrash(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { deletedAt: { not: null } },
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
        include: {
          post: {
            select: { id: true, title: true, slug: true },
          },
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
      }),
      this.prisma.comment.count({
        where: { deletedAt: { not: null } },
      }),
    ]);

    return {
      items: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===== 新增功能：用户编辑评论 =====

  /**
   * 用户编辑自己的评论（有时间限制）
   */
  async userEdit(id: string, userId: string, content: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('您只能编辑自己的评论');
    }

    if (comment.deletedAt) {
      throw new BadRequestException('评论已被删除');
    }

    // 检查时间限制
    const now = new Date();
    const createdAt = new Date(comment.createdAt);
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffMinutes > EDIT_TIME_LIMIT_MINUTES) {
      throw new BadRequestException(`评论发布超过 ${EDIT_TIME_LIMIT_MINUTES} 分钟后不能编辑`);
    }

    // 内容审核
    const moderationResult = await this.contentModerationService.moderateContent(content);

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: {
        content,
        editedAt: new Date(),
        isApproved: moderationResult.isApproved,
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return updatedComment;
  }

  // ===== 新增功能：置顶评论 =====

  /**
   * 置顶/取消置顶评论（管理员/文章作者）
   */
  async togglePin(id: string, userId: string, isAdmin: boolean) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        post: {
          select: { authorId: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 只有管理员或文章作者可以置顶评论
    if (!isAdmin && comment.post.authorId !== userId) {
      throw new ForbiddenException('您没有权限置顶此评论');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: { isPinned: !comment.isPinned },
    });

    return {
      isPinned: updatedComment.isPinned,
      message: updatedComment.isPinned ? '评论已置顶' : '已取消置顶',
    };
  }

  // ===== 新增功能：举报评论 =====

  /**
   * 举报评论
   */
  async reportComment(
    commentId: string,
    reporterId: string,
    reason: string,
    details?: string,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.authorId === reporterId) {
      throw new BadRequestException('您不能举报自己的评论');
    }

    // 检查是否已经举报过
    const existingReport = await this.prisma.commentReport.findUnique({
      where: {
        commentId_reporterId: {
          commentId,
          reporterId,
        },
      },
    });

    if (existingReport) {
      throw new BadRequestException('您已经举报过此评论');
    }

    const report = await this.prisma.commentReport.create({
      data: {
        commentId,
        reporterId,
        reason,
        details,
      },
    });

    return { message: '举报已提交', reportId: report.id };
  }

  /**
   * 获取举报列表（管理员）
   */
  async getReports(page = 1, limit = 10, status = 'pending') {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.commentReport.findMany({
        where: { status },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          comment: {
            select: {
              id: true,
              content: true,
              author: {
                select: { id: true, username: true },
              },
              post: {
                select: { id: true, title: true, slug: true },
              },
            },
          },
          reporter: {
            select: { id: true, username: true },
          },
        },
      }),
      this.prisma.commentReport.count({ where: { status } }),
    ]);

    return {
      items: reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 处理举报（管理员）
   */
  async resolveReport(
    reportId: string,
    action: 'resolve' | 'dismiss',
    deleteComment = false,
  ) {
    const report = await this.prisma.commentReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('举报不存在');
    }

    if (report.status !== 'pending') {
      throw new BadRequestException('举报已被处理');
    }

    // 更新举报状态
    await this.prisma.commentReport.update({
      where: { id: reportId },
      data: { status: action === 'resolve' ? 'resolved' : 'dismissed' },
    });

    // 如果选择删除评论
    if (action === 'resolve' && deleteComment) {
      await this.softDelete(report.commentId);
    }

    return {
      message: action === 'resolve' ? '举报已处理' : '举报已驳回',
    };
  }

  /**
   * 获取评论统计数据（管理员）
   */
  async getStats() {
    const [
      totalComments,
      pendingComments,
      approvedComments,
      deletedComments,
      pendingReports,
    ] = await Promise.all([
      this.prisma.comment.count({ where: { deletedAt: null } }),
      this.prisma.comment.count({ where: { isApproved: false, deletedAt: null } }),
      this.prisma.comment.count({ where: { isApproved: true, deletedAt: null } }),
      this.prisma.comment.count({ where: { deletedAt: { not: null } } }),
      this.prisma.commentReport.count({ where: { status: 'pending' } }),
    ]);

    return {
      totalComments,
      pendingComments,
      approvedComments,
      deletedComments,
      pendingReports,
    };
  }
}
