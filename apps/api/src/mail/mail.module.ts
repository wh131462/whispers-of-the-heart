import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mailHost = configService.get('MAIL_HOST');
        const mailUsername = configService.get('MAIL_USERNAME');
        const mailPassword = configService.get('MAIL_PASSWORD');
        const isConfigured = !!(mailHost && mailUsername);

        // 如果邮件未配置，使用一个虚拟的 transport 配置
        if (!isConfigured) {
          return {
            transport: {
              jsonTransport: true, // 使用 JSON transport，不会实际发送邮件
            },
            defaults: {
              from: `"${configService.get('APP_NAME') || 'Whispers'}" <${configService.get('MAIL_FROM') || 'noreply@whispers.local'}>`,
            },
            template: {
              dir: join(__dirname, 'templates'),
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
          };
        }

        return {
          transport: {
            host: mailHost,
            port: configService.get<number>('MAIL_PORT') || 587,
            secure: configService.get<number>('MAIL_PORT') === 465,
            auth: {
              user: mailUsername,
              pass: mailPassword,
            },
            // 开发环境跳过证书验证
            ...(configService.get('NODE_ENV') !== 'production' && {
              tls: {
                rejectUnauthorized: false,
              },
            }),
          },
          defaults: {
            from: `"${configService.get('APP_NAME') || 'Whispers'}" <${configService.get('MAIL_FROM') || 'noreply@whispers.local'}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
