import { Injectable, Logger } from '@nestjs/common';
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
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isEnabled: boolean;
  private readonly webUrl: string;
  private readonly appName: string;

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
