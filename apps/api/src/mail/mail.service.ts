import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { join } from 'path';
import { readFileSync, readdirSync, existsSync } from 'fs';
import * as Handlebars from 'handlebars';

export interface SendMailOptions {
  to: string;
  subject: string;
  template?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: Record<string, any>;
  html?: string;
  text?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly isEnabled: boolean;
  private readonly webUrl: string;
  private readonly appName: string;
  private isConnected: boolean = false;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const mailHost = this.configService.get('MAIL_HOST');
    const mailUser = this.configService.get('MAIL_USERNAME');
    const mailPass = this.configService.get('MAIL_PASSWORD');
    this.isEnabled = !!(mailHost && mailUser && mailPass);
    this.webUrl = this.configService.get('WEB_URL') || 'https://131462.wang';
    this.appName =
      this.configService.get('APP_NAME') || 'Whispers of the Heart';

    if (!this.isEnabled) {
      this.logger.warn('邮件服务未配置完整，将使用日志模式');
      this.logger.warn('需要配置: MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD');
    } else {
      this.logger.log(`邮件服务已启用: ${mailHost}`);
    }
  }

  /**
   * 模块初始化时验证 SMTP 连接
   */
  async onModuleInit() {
    if (!this.isEnabled) {
      this.logger.log('邮件服务未配置，跳过连接检测');
      return;
    }

    await this.verifyConnection();
  }

  /**
   * 验证 SMTP 连接
   */
  async verifyConnection(): Promise<boolean> {
    const mailHost = this.configService.get('MAIL_HOST');
    const mailPort = this.configService.get('MAIL_PORT');

    this.logger.log(`正在验证 SMTP 连接: ${mailHost}:${mailPort}...`);

    try {
      // 获取 nodemailer transporter 并验证连接
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transporter = (this.mailerService as any).transporter;
      if (transporter && typeof transporter.verify === 'function') {
        await transporter.verify();
        this.isConnected = true;
        this.logger.log('✅ SMTP 连接验证成功，邮件服务就绪');
        return true;
      } else {
        this.logger.warn('无法获取 transporter，跳过连接验证');
        return false;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.isConnected = false;
      this.logger.error('❌ SMTP 连接验证失败');
      this.logger.error(`错误信息: ${error.message}`);

      // 提供具体的排错建议
      if (error.code === 'ECONNREFUSED') {
        this.logger.error('💡 建议: 检查 MAIL_HOST 和 MAIL_PORT 是否正确');
      } else if (error.code === 'EAUTH' || error.responseCode === 535) {
        this.logger.error(
          '💡 建议: 检查 MAIL_USERNAME 和 MAIL_PASSWORD（QQ邮箱需使用授权码）',
        );
      } else if (
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('Greeting never received')
      ) {
        this.logger.error('💡 建议: 网络超时，检查防火墙或网络连接');
      } else if (
        error.code === 'ESOCKET' ||
        error.message?.includes('certificate')
      ) {
        this.logger.error(
          '💡 建议: SSL/TLS 问题，尝试设置 MAIL_TLS_REJECT_UNAUTHORIZED=false',
        );
      }

      this.logger.warn('邮件服务将继续运行，但发送邮件可能失败');
      return false;
    }
  }

  /**
   * 获取邮件服务状态
   */
  getStatus(): { enabled: boolean; connected: boolean } {
    return {
      enabled: this.isEnabled,
      connected: this.isConnected,
    };
  }

  /**
   * 发送邮件的通用方法
   */
  async sendMail(options: SendMailOptions): Promise<boolean> {
    const { to, subject, template, context, html, text } = options;

    // 创建邮件记录
    const mailLog = await this.prisma.mailLog.create({
      data: {
        to,
        subject,
        template,
        context: context || {},
        status: 'pending',
      },
    });

    // 如果邮件未配置，仅记录日志
    if (!this.isEnabled) {
      this.logger.log(`[模拟发送邮件] 收件人: ${to}, 主题: ${subject}`);
      if (context) {
        this.logger.debug(`[邮件内容] ${JSON.stringify(context, null, 2)}`);
      }
      // 更新记录为已发送（模拟模式）
      await this.prisma.mailLog.update({
        where: { id: mailLog.id },
        data: { status: 'sent', sentAt: new Date() },
      });
      return true;
    }

    try {
      this.logger.debug(`正在发送邮件: ${to} - ${subject}`);

      const result = await this.mailerService.sendMail({
        to,
        subject,
        template,
        context: {
          ...context,
          appName: this.appName,
          webUrl: this.webUrl,
          year: new Date().getFullYear(),
        },
        html,
        text,
      });

      this.logger.log(`邮件发送成功: ${to} - ${subject}`);
      this.logger.debug(`邮件响应: ${JSON.stringify(result)}`);

      // 更新记录为已发送
      await this.prisma.mailLog.update({
        where: { id: mailLog.id },
        data: { status: 'sent', sentAt: new Date() },
      });

      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // 详细的错误日志
      this.logger.error(`邮件发送失败: ${to} - ${subject}`);
      this.logger.error(`错误类型: ${error.name || 'Unknown'}`);
      this.logger.error(`错误信息: ${error.message || error}`);

      // 常见错误提示
      if (error.code === 'ECONNREFUSED') {
        this.logger.error(
          '无法连接到 SMTP 服务器，请检查 MAIL_HOST 和 MAIL_PORT 配置',
        );
      } else if (error.code === 'EAUTH' || error.responseCode === 535) {
        this.logger.error(
          'SMTP 认证失败，请检查 MAIL_USERNAME 和 MAIL_PASSWORD 配置',
        );
      } else if (error.code === 'ETIMEDOUT') {
        this.logger.error('连接 SMTP 服务器超时，请检查网络或防火墙设置');
      } else if (error.code === 'ESOCKET') {
        this.logger.error(
          'Socket 错误，可能是 SSL/TLS 配置问题，尝试设置 MAIL_TLS_REJECT_UNAUTHORIZED=false',
        );
      }

      if (error.stack) {
        this.logger.debug(`错误堆栈: ${error.stack}`);
      }

      // 更新记录为失败
      await this.prisma.mailLog.update({
        where: { id: mailLog.id },
        data: { status: 'failed', error: error.message || 'Unknown error' },
      });

      return false;
    }
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(
    to: string,
    username: string,
    resetToken: string,
  ): Promise<boolean> {
    const resetUrl = `${this.webUrl}/reset-password?token=${resetToken}`;

    return this.sendMail({
      to,
      subject: `重置您的密码 - ${this.appName}`,
      template: 'password-reset',
      context: {
        username,
        resetUrl,
        expiresIn: '1小时',
      },
    });
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject: `欢迎加入 ${this.appName}`,
      template: 'welcome',
      context: {
        username,
        loginUrl: `${this.webUrl}/login`,
      },
    });
  }

  /**
   * 发送评论通知邮件 - 新评论通知文章作者
   */
  async sendCommentNotification(
    to: string,
    authorName: string,
    commenterName: string,
    postTitle: string,
    postSlug: string,
    commentContent: string,
  ): Promise<boolean> {
    const postUrl = `${this.webUrl}/posts/${postSlug}`;

    return this.sendMail({
      to,
      subject: `${commenterName} 评论了您的文章「${postTitle}」`,
      template: 'comment-notification',
      context: {
        authorName,
        commenterName,
        postTitle,
        postUrl,
        commentContent: this.truncateText(commentContent, 200),
      },
    });
  }

  /**
   * 发送回复通知邮件 - 有人回复了你的评论
   */
  async sendReplyNotification(
    to: string,
    originalCommenterName: string,
    replierName: string,
    postTitle: string,
    postSlug: string,
    originalComment: string,
    replyContent: string,
  ): Promise<boolean> {
    const postUrl = `${this.webUrl}/posts/${postSlug}`;

    return this.sendMail({
      to,
      subject: `${replierName} 回复了您的评论`,
      template: 'reply-notification',
      context: {
        originalCommenterName,
        replierName,
        postTitle,
        postUrl,
        originalComment: this.truncateText(originalComment, 100),
        replyContent: this.truncateText(replyContent, 200),
      },
    });
  }

  /**
   * 发送注册验证码邮件
   */
  async sendRegistrationVerificationCode(
    to: string,
    code: string,
  ): Promise<boolean> {
    return this.sendMail({
      to,
      subject: `您的注册验证码 - ${this.appName}`,
      template: 'verification-code',
      context: {
        code,
        purpose: '注册账号',
        expiresIn: '10分钟',
      },
    });
  }

  /**
   * 发送邮箱更换验证码邮件
   */
  async sendEmailChangeVerificationCode(
    to: string,
    username: string,
    code: string,
  ): Promise<boolean> {
    return this.sendMail({
      to,
      subject: `您的邮箱更换验证码 - ${this.appName}`,
      template: 'verification-code',
      context: {
        username,
        code,
        purpose: '更换邮箱',
        expiresIn: '10分钟',
      },
    });
  }

  /**
   * 发送反馈回复邮件
   */
  async sendFeedbackReply(
    to: string,
    originalContent: string,
    replyContent: string,
  ): Promise<boolean> {
    return this.sendMail({
      to,
      subject: `您的反馈已处理 - ${this.appName}`,
      template: 'feedback-reply',
      context: {
        originalContent: this.truncateText(originalContent, 500),
        replyContent,
      },
    });
  }

  /**
   * 截断文本
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * 获取邮件发送记录列表
   */
  async getMailLogs(
    page: number = 1,
    limit: number = 20,
    status?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.MailLogWhereInput = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { to: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.mailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.mailLog.count({ where }),
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
   * 获取单个邮件记录详情
   */
  async getMailLogById(id: string) {
    return this.prisma.mailLog.findUnique({
      where: { id },
    });
  }

  /**
   * 获取邮件统计
   */
  async getMailStats() {
    const [total, sent, failed, pending] = await Promise.all([
      this.prisma.mailLog.count(),
      this.prisma.mailLog.count({ where: { status: 'sent' } }),
      this.prisma.mailLog.count({ where: { status: 'failed' } }),
      this.prisma.mailLog.count({ where: { status: 'pending' } }),
    ]);

    // 获取最近7天每天的发送量
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = await this.prisma.mailLog.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    });

    return {
      total,
      sent,
      failed,
      pending,
      recentStats: recentLogs,
    };
  }

  /**
   * 发送测试邮件
   */
  async sendTestMail(to: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject: `测试邮件 - ${this.appName}`,
      template: 'welcome',
      context: {
        username: '测试用户',
        loginUrl: `${this.webUrl}/login`,
      },
    });
  }

  /**
   * 获取模板目录路径
   */
  private getTemplateDir(): string {
    return join(__dirname, 'templates');
  }

  /**
   * 获取所有可用的邮件模板列表
   */
  getTemplates(): Array<{
    id: string;
    name: string;
    description: string;
    subject: string;
    mockData: Record<string, string>;
  }> {
    // 模板元信息配置
    const templateMeta: Record<
      string,
      {
        name: string;
        description: string;
        subject: string;
        mockData: Record<string, string>;
      }
    > = {
      welcome: {
        name: '欢迎邮件',
        description: '新用户注册成功后发送',
        subject: `欢迎加入 ${this.appName}`,
        mockData: {
          username: '张三',
          loginUrl: `${this.webUrl}/login`,
        },
      },
      'password-reset': {
        name: '密码重置',
        description: '用户请求重置密码时发送',
        subject: `重置您的密码 - ${this.appName}`,
        mockData: {
          username: '张三',
          resetUrl: `${this.webUrl}/reset-password?token=abc123`,
          expiresIn: '1小时',
        },
      },
      'comment-notification': {
        name: '评论通知',
        description: '当有人评论用户文章时发送',
        subject: '您的文章收到了新评论',
        mockData: {
          authorName: '张三',
          commenterName: '李四',
          postTitle: '如何使用 React 构建现代 Web 应用',
          postUrl: `${this.webUrl}/posts/how-to-build-modern-web-app`,
          commentContent: '这篇文章写得非常好！',
        },
      },
      'reply-notification': {
        name: '回复通知',
        description: '当有人回复用户评论时发送',
        subject: '有人回复了您的评论',
        mockData: {
          originalCommenterName: '张三',
          replierName: '李四',
          postTitle: '深入理解 JavaScript 异步编程',
          postUrl: `${this.webUrl}/posts/understanding-javascript-async`,
          originalComment: '请问这个例子中的 Promise 是如何工作的？',
          replyContent: 'Promise 是一个代表异步操作最终完成或失败的对象。',
        },
      },
      'verification-code': {
        name: '验证码',
        description: '用户注册或更换邮箱时发送',
        subject: `您的验证码 - ${this.appName}`,
        mockData: {
          username: '张三',
          purpose: '注册账号',
          code: '386942',
          expiresIn: '10分钟',
        },
      },
      'feedback-notification': {
        name: '反馈通知',
        description: '收到新用户反馈时通知管理员',
        subject: `[功能建议] 收到新的用户反馈`,
        mockData: {
          typeLabel: '功能建议',
          content: '希望能增加深色模式的支持，这样晚上看文章更舒适。',
          contact: 'user@example.com',
          createdAt: new Date().toLocaleString('zh-CN'),
          feedbackId: 'clx1234567890',
        },
      },
      'feedback-reply': {
        name: '反馈回复',
        description: '管理员回复用户反馈时发送',
        subject: `您的反馈已处理 - ${this.appName}`,
        mockData: {
          originalContent: '希望能增加深色模式的支持，这样晚上看文章更舒适。',
          replyContent:
            '感谢您的建议！我们已经在计划中添加深色模式功能，预计将在下个版本中上线，届时会通知您。',
        },
      },
    };

    const templateDir = this.getTemplateDir();
    const templates: Array<{
      id: string;
      name: string;
      description: string;
      subject: string;
      mockData: Record<string, string>;
    }> = [];

    // 检查模板目录是否存在
    if (!existsSync(templateDir)) {
      this.logger.warn(`模板目录不存在: ${templateDir}`);
      return templates;
    }

    // 读取模板目录中的 .hbs 文件
    const files = readdirSync(templateDir);
    for (const file of files) {
      if (file.endsWith('.hbs')) {
        const id = file.replace('.hbs', '');
        const meta = templateMeta[id];
        if (meta) {
          templates.push({
            id,
            ...meta,
          });
        }
      }
    }

    return templates;
  }

  /**
   * 渲染模板预览
   * @param templateName 模板名称（不含 .hbs 后缀）
   * @param context 模板上下文数据
   * @returns 渲染后的 HTML
   */
  renderTemplatePreview(
    templateName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: Record<string, any>,
  ): string {
    const templateDir = this.getTemplateDir();
    const templatePath = join(templateDir, `${templateName}.hbs`);

    if (!existsSync(templatePath)) {
      throw new Error(`模板不存在: ${templateName}`);
    }

    // 读取模板文件
    const templateSource = readFileSync(templatePath, 'utf-8');

    // 编译并渲染模板
    const template = Handlebars.compile(templateSource);
    const html = template({
      ...context,
      appName: this.appName,
      webUrl: this.webUrl,
      year: new Date().getFullYear(),
    });

    return html;
  }
}
