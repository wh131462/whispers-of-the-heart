import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BlogModule } from './blog/blog.module';
import { SiteConfigModule } from './site-config/site-config.module';
import { CommentModule } from './comment/comment.module';
import { MediaModule } from './media/media.module';
import { FileManagementModule } from './file-management/file-management.module';
import { AdminModule } from './admin/admin.module';
import { HitokotoController } from './common/hitokoto.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
    PassportModule,
    PrismaModule,
    AuthModule,
    UserModule,
    BlogModule,
    SiteConfigModule,
    CommentModule,
    MediaModule,
    FileManagementModule,
    AdminModule,
  ],
  controllers: [AppController, HitokotoController],
  providers: [AppService],
})
export class AppModule {}
