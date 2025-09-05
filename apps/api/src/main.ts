import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 获取配置服务
  const configService = app.get(ConfigService);
  
  // 配置Express信任代理，以便正确获取客户端IP
  app.set('trust proxy', true);
  
  // 创建uploads目录
  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  
  // 启用 CORS
  app.enableCors({
    origin: ['http://localhost:8888', 'http://localhost:9999'],
    credentials: true,
  });

  // 设置请求体大小限制
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // 设置静态文件服务
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  // 设置全局前缀
  app.setGlobalPrefix('api/v1');

  // 全局验证管道 - 暂时禁用严格验证
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 启动应用
  const port = configService.get('PORT') || 7777;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/v1`);
}

bootstrap();
