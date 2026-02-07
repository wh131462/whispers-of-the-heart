import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // 创建日志目录
  const logsDir = join(process.cwd(), 'logs');
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // 获取配置服务
  const configService = app.get(ConfigService);

  // 配置Express信任代理，以便正确获取客户端IP
  app.set('trust proxy', true);

  // 创建uploads目录 - 使用process.cwd()确保路径正确
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  // CORS 配置
  const isProduction = configService.get('NODE_ENV') === 'production';

  if (isProduction) {
    // 生产环境：nginx 已处理 CORS，后端不添加 header（避免重复）
    // 只需要响应 OPTIONS 预检请求
    app.use((req, res, next) => {
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
      next();
    });
  } else {
    // 开发环境：后端处理 CORS（无 nginx）
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
  }

  // 设置请求体大小限制和编码
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // 设置 API 路由默认响应头为 UTF-8（仅对 /api/v1 路由生效，避免覆盖静态资源的 MIME 类型）
  app.use((req, res, next) => {
    if (
      req.url.startsWith('/api/v1') &&
      !req.url.startsWith('/api/v1/ai-proxy')
    ) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    next();
  });

  // 设置静态文件服务 - 必须在全局前缀之前设置
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  // 设置全局前缀 - 静态文件服务不受此影响
  app.setGlobalPrefix('api/v1');

  // 全局验证管道 - 启用严格验证
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger API 文档配置
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Whispers of the Heart API')
    .setDescription('博客平台后端 API 文档')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入 JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('博客', '博客文章、分类、标签管理')
    .addTag('认证', '用户认证相关接口')
    .addTag('用户', '用户管理接口')
    .addTag('评论', '评论管理接口')
    .addTag('文件', '文件管理接口')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // 启动应用
  const port = configService.get('PORT') || 7777;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
