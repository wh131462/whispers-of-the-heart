import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import * as path from 'path';
import * as fs from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BlogModule } from './blog/blog.module';
import { SiteConfigModule } from './site-config/site-config.module';
import { CommentModule } from './comment/comment.module';
import { MediaModule } from './media/media.module';
import { AdminModule } from './admin/admin.module';
import { HitokotoController } from './common/hitokoto.controller';
import { LoggerModule } from './common/logger/logger.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { MailModule } from './mail/mail.module';
import { NotificationModule } from './notification/notification.module';
import { FeedbackModule } from './feedback/feedback.module';

// 查找项目根目录的 configs 文件夹
function findConfigsDir(): string {
  let currentDir = process.cwd();

  // 从当前工作目录向上查找 configs 目录
  for (let i = 0; i < 5; i++) {
    const configsPath = path.join(currentDir, 'configs');
    if (fs.existsSync(configsPath)) {
      return configsPath;
    }
    currentDir = path.dirname(currentDir);
  }

  // 回退到相对于 __dirname 的路径（编译后的代码在 dist/src/ 下）
  return path.resolve(__dirname, '../../../../configs');
}

const configsDir = findConfigsDir();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(configsDir, `env.${process.env.NODE_ENV || 'development'}`),
        path.join(configsDir, 'env.development'),
      ],
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as StringValue,
      },
    }),
    PassportModule,
    PrismaModule,
    LoggerModule,
    MailModule,
    AuthModule,
    UserModule,
    BlogModule,
    SiteConfigModule,
    CommentModule,
    MediaModule,
    AdminModule,
    NotificationModule,
    FeedbackModule,
  ],
  controllers: [AppController, HitokotoController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
