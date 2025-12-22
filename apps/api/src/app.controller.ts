import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from './mail/mail.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AdminGuard } from './auth/guards/roles.guard';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * 检查邮件服务配置状态
   */
  @Get('mail/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMailStatus() {
    const mailHost = this.configService.get('MAIL_HOST');
    const mailUser = this.configService.get('MAIL_USERNAME');
    const mailPass = this.configService.get('MAIL_PASSWORD');
    const mailPort = this.configService.get('MAIL_PORT');
    const mailFrom = this.configService.get('MAIL_FROM');

    return {
      configured: !!(mailHost && mailUser && mailPass),
      host: mailHost || 'not set',
      port: mailPort || 587,
      user: mailUser ? `${mailUser.substring(0, 3)}***` : 'not set',
      from: mailFrom || 'not set',
    };
  }

  /**
   * 发送测试邮件（仅管理员）
   */
  @Post('mail/test')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async sendTestMail(@Body() body: { to: string }) {
    const { to } = body;

    if (!to) {
      return { success: false, message: '请提供收件人邮箱地址' };
    }

    const result = await this.mailService.sendMail({
      to,
      subject: '邮件服务测试 - Whispers of the Heart',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>邮件服务测试成功!</h2>
          <p>如果您收到此邮件，说明邮件服务已正确配置。</p>
          <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `,
    });

    return {
      success: result,
      message: result ? '测试邮件发送成功，请检查收件箱' : '邮件发送失败，请检查日志',
    };
  }
}
