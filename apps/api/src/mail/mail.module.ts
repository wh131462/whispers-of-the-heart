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
        const mailUser = configService.get('MAIL_USERNAME');
        const mailPass = configService.get('MAIL_PASSWORD');
        const mailPort = configService.get<number>('MAIL_PORT') || 587;
        const mailFrom = configService.get('MAIL_FROM') || `noreply@${mailHost || 'whispers.local'}`;
        const appName = configService.get('APP_NAME') || 'Whispers of the Heart';

        const isConfigured = !!(mailHost && mailUser && mailPass);
        // 模板目录：nest-cli.json 配置了 assets，构建时自动复制 .hbs 到 dist
        const templateDir = join(__dirname, 'templates');

        if (!isConfigured) {
          console.log('[MailModule] 邮件服务未配置完整，使用模拟模式');
          console.log('[MailModule] 需要配置: MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD');
          return {
            transport: {
              jsonTransport: true, // 使用 JSON transport，不会实际发送邮件
            },
            defaults: {
              from: `"${appName}" <${mailFrom}>`,
            },
            template: {
              dir: templateDir,
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
          };
        }

        console.log(`[MailModule] 邮件服务已配置: ${mailHost}:${mailPort}`);

        return {
          transport: {
            host: mailHost,
            port: mailPort,
            secure: mailPort == 465, // 465端口使用SSL
            auth: {
              user: mailUser,
              pass: mailPass,
            },
            // 连接超时设置
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 30000,
            // 生产环境也可能需要跳过证书验证（自签名证书）
            tls: {
              rejectUnauthorized: configService.get('MAIL_TLS_REJECT_UNAUTHORIZED') !== 'false',
            },
          },
          defaults: {
            from: `"${appName}" <${mailFrom}>`,
          },
          template: {
            dir: templateDir,
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
export class MailModule { }
