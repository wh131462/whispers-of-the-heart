import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface SendMailOptions {
  to: string;
  subject: string;
  template?: string;
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
  ) {
    const mailHost = this.configService.get('MAIL_HOST');
    const mailUser = this.configService.get('MAIL_USERNAME');
    const mailPass = this.configService.get('MAIL_PASSWORD');
    this.isEnabled = !!(mailHost && mailUser && mailPass);
    this.webUrl = this.configService.get('WEB_URL') || 'https://131462.wang';
    this.appName = this.configService.get('APP_NAME') || 'Whispers of the Heart';

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
    } catch (error: any) {
      this.isConnected = false;
      this.logger.error('❌ SMTP 连接验证失败');
      this.logger.error(`错误信息: ${error.message}`);

      // 提供具体的排错建议
      if (error.code === 'ECONNREFUSED') {
        this.logger.error('💡 建议: 检查 MAIL_HOST 和 MAIL_PORT 是否正确');
      } else if (error.code === 'EAUTH' || error.responseCode === 535) {
        this.logger.error('💡 建议: 检查 MAIL_USERNAME 和 MAIL_PASSWORD（QQ邮箱需使用授权码）');
      } else if (error.code === 'ETIMEDOUT' || error.message?.includes('Greeting never received')) {
        this.logger.error('💡 建议: 网络超时，检查防火墙或网络连接');
      } else if (error.code === 'ESOCKET' || error.message?.includes('certificate')) {
        this.logger.error('💡 建议: SSL/TLS 问题，尝试设置 MAIL_TLS_REJECT_UNAUTHORIZED=false');
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

    // 如果邮件未配置，仅记录日志
    if (!this.isEnabled) {
      this.logger.log(`[模拟发送邮件] 收件人: ${to}, 主题: ${subject}`);
      if (context) {
        this.logger.debug(`[邮件内容] ${JSON.stringify(context, null, 2)}`);
      }
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
      return true;
    } catch (error: any) {
      // 详细的错误日志
      this.logger.error(`邮件发送失败: ${to} - ${subject}`);
      this.logger.error(`错误类型: ${error.name || 'Unknown'}`);
      this.logger.error(`错误信息: ${error.message || error}`);

      // 常见错误提示
      if (error.code === 'ECONNREFUSED') {
        this.logger.error('无法连接到 SMTP 服务器，请检查 MAIL_HOST 和 MAIL_PORT 配置');
      } else if (error.code === 'EAUTH' || error.responseCode === 535) {
        this.logger.error('SMTP 认证失败，请检查 MAIL_USERNAME 和 MAIL_PASSWORD 配置');
      } else if (error.code === 'ETIMEDOUT') {
        this.logger.error('连接 SMTP 服务器超时，请检查网络或防火墙设置');
      } else if (error.code === 'ESOCKET') {
        this.logger.error('Socket 错误，可能是 SSL/TLS 配置问题，尝试设置 MAIL_TLS_REJECT_UNAUTHORIZED=false');
      }

      if (error.stack) {
        this.logger.debug(`错误堆栈: ${error.stack}`);
      }

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
   * 截断文本
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
