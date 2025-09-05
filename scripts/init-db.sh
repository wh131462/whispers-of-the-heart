#!/bin/bash

echo "🔧 初始化数据库..."

# 检查是否在开发环境
#if [ "$NODE_ENV" != "development" ]; then
#  echo "❌ 此脚本只能在开发环境中运行"
#  exit 1
#fi

# 进入 API 目录
cd apps/api

# 重置数据库
echo "🗑️  重置数据库..."
pnpm prisma migrate reset --force

# 创建迁移
echo "📝 创建数据库迁移..."
pnpm prisma migrate dev --name init

# 生成 Prisma 客户端
echo "🔨 生成 Prisma 客户端..."
pnpm prisma generate

# 创建初始数据
echo "📊 创建初始数据..."
node -e "
const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  try {
    // 创建管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@whispers.local',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    // 创建示例文章
    const post = await prisma.post.create({
      data: {
        title: '欢迎使用 Whispers of the Heart',
        content: '# 欢迎使用 Whispers of the Heart\n\n这是一个示例文章，展示了博客系统的功能。\n\n## 功能特性\n\n- 文章管理\n- 用户管理\n- 评论系统\n- 标签管理\n- 站点配置\n\n## 开始使用\n\n请登录管理后台开始创建您的内容！',
        excerpt: '欢迎使用 Whispers of the Heart 博客系统',
        slug: 'welcome-to-whispers',
        status: 'PUBLISHED',
        category: '系统',
        authorId: admin.id,
        publishedAt: new Date(),
      },
    });

    // 创建示例标签
    const tag1 = await prisma.tag.create({
      data: {
        name: '技术',
        slug: 'tech',
        color: '#3B82F6',
      },
    });

    const tag2 = await prisma.tag.create({
      data: {
        name: '生活',
        slug: 'life',
        color: '#10B981',
      },
    });

    // 关联文章和标签
    await prisma.postTag.createMany({
      data: [
        { postId: post.id, tagId: tag1.id },
        { postId: post.id, tagId: tag2.id },
      ],
    });

    // 创建站点配置
    await prisma.siteConfig.create({
      data: {
        siteName: 'Whispers of the Heart',
        siteDescription: '专注于分享知识和灵感的平台',
        aboutMe: '热爱技术，热爱生活，希望通过文字传递正能量。',
        contactEmail: 'contact@whispers.local',
        socialLinks: {
          github: 'https://github.com/yourusername',
          twitter: 'https://twitter.com/yourusername',
          linkedin: 'https://linkedin.com/in/yourusername',
        },
        seoSettings: {
          title: 'Whispers of the Heart',
          description: '专注于分享知识和灵感的平台',
          keywords: '技术,博客,分享,知识',
        },
        ossConfig: {
          provider: 'local',
          endpoint: null,
          accessKey: null,
          secretKey: null,
          bucketName: null,
          cdnDomain: null,
        },
      },
    });

    console.log('✅ 数据库初始化完成！');
    console.log('👤 管理员账户: admin@whispers.local / admin123');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

seed();
"

echo "✅ 数据库初始化完成！"
