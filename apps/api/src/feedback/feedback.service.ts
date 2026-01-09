import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  suggestion: '功能建议',
  bug: '问题反馈',
  question: '使用咨询',
  other: '其他',
};

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * 创建反馈
   */
  async create(dto: CreateFeedbackDto, ipAddress?: string, userAgent?: string) {
    const feedback = await this.prisma.feedback.create({
      data: {
        type: dto.type,
        content: dto.content,
        contact: dto.contact,
        ipAddress,
        userAgent,
      },
    });

    this.logger.log(`新反馈已创建: ${feedback.id}, 类型: ${dto.type}`);

    // 通过 WebSocket 实时通知管理员
    this.notificationGateway.notifyNewFeedback(feedback);

    // 更新统计并通知
    this.getStats().then((stats) => {
      this.notificationGateway.notifyFeedbackStatsUpdate(stats);
    });

    // 异步发送邮件通知给管理员
    this.notifyAdmin(feedback).catch((err) => {
      this.logger.error(`发送反馈通知邮件失败: ${err.message}`);
    });

    return feedback;
  }

  /**
   * 通知管理员有新反馈
   */
  private async notifyAdmin(feedback: {
    id: string;
    type: string;
    content: string;
    contact?: string | null;
    createdAt: Date;
  }) {
    // 获取站点配置中的联系邮箱
    const siteConfig = await this.prisma.siteConfig.findUnique({
      where: { id: 'default' },
    });

    const adminEmail = siteConfig?.contactEmail;
    if (!adminEmail) {
      this.logger.warn('未配置站点联系邮箱，跳过反馈通知');
      return;
    }

    const typeLabel = FEEDBACK_TYPE_LABELS[feedback.type] || feedback.type;

    await this.mailService.sendMail({
      to: adminEmail,
      subject: `[${typeLabel}] 收到新的用户反馈`,
      template: 'feedback-notification',
      context: {
        typeLabel,
        content: feedback.content,
        contact: feedback.contact || '未提供',
        createdAt: feedback.createdAt.toLocaleString('zh-CN'),
        feedbackId: feedback.id,
      },
    });
  }

  /**
   * 获取反馈列表（管理员）
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: string,
    type?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.FeedbackWhereInput = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (type && type !== 'all') {
      where.type = type;
    }

    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取单个反馈详情
   */
  async findOne(id: string) {
    return this.prisma.feedback.findUnique({
      where: { id },
    });
  }

  /**
   * 更新反馈状态
   */
  async updateStatus(id: string, status: string) {
    return this.prisma.feedback.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * 删除反馈
   */
  async remove(id: string) {
    return this.prisma.feedback.delete({
      where: { id },
    });
  }

  /**
   * 获取反馈统计
   */
  async getStats() {
    const [total, pending, read, resolved] = await Promise.all([
      this.prisma.feedback.count(),
      this.prisma.feedback.count({ where: { status: 'pending' } }),
      this.prisma.feedback.count({ where: { status: 'read' } }),
      this.prisma.feedback.count({ where: { status: 'resolved' } }),
    ]);

    const byType = await this.prisma.feedback.groupBy({
      by: ['type'],
      _count: true,
    });

    return {
      total,
      pending,
      read,
      resolved,
      byType: byType.reduce(
        (acc, item) => {
          acc[item.type] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * 回复反馈并发送邮件
   */
  async reply(id: string, replyContent: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new Error('反馈不存在');
    }

    if (!feedback.contact) {
      throw new Error('该反馈未提供联系方式，无法发送回复');
    }

    // 验证联系方式是否为邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(feedback.contact)) {
      throw new Error('联系方式不是有效的邮箱地址');
    }

    // 发送回复邮件
    const sent = await this.mailService.sendFeedbackReply(
      feedback.contact,
      feedback.content,
      replyContent,
    );

    if (!sent) {
      throw new Error('邮件发送失败');
    }

    // 更新状态为已处理
    const updatedFeedback = await this.prisma.feedback.update({
      where: { id },
      data: { status: 'resolved' },
    });

    this.logger.log(`反馈已回复: ${id}, 邮件发送至: ${feedback.contact}`);

    return updatedFeedback;
  }
}
