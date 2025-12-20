import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 从环境变量读取管理员配置
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@whispers.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

async function main() {
  console.log('开始生成种子数据...');

  // 创建管理员用户
  const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { isAdmin: true },
    create: {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: adminPassword,
      isAdmin: true,
      bio: '系统管理员',
    },
  });

  // 创建测试用户
  const testPassword = await bcrypt.hash('test123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@whispers.local' },
    update: {},
    create: {
      username: 'testuser',
      email: 'test@whispers.local',
      password: testPassword,
      isAdmin: false,
      bio: '测试用户',
    },
  });

  // 创建匿名用户
  const anonymousUser = await prisma.user.upsert({
    where: { username: 'anonymous' },
    update: {},
    create: {
      username: 'anonymous',
      email: 'anonymous@example.com',
      password: 'anonymous',
      isAdmin: false,
    },
  });

  // 创建测试文章
  const testPost = await prisma.post.upsert({
    where: { slug: 'test-post' },
    update: {},
    create: {
      title: '测试文章',
      content: '这是一篇测试文章，用于演示博客系统功能。',
      excerpt: '测试文章摘要',
      slug: 'test-post',
      published: true,
      authorId: admin.id,
      publishedAt: new Date(),
    },
  });

  // 创建第二篇测试文章
  const secondPost = await prisma.post.upsert({
    where: { slug: 'another-test-post' },
    update: {},
    create: {
      title: '另一篇测试文章',
      content: '这是另一篇测试文章，包含更多内容来展示博客系统的各种功能。\n\n## 功能特性\n\n- 文章发布\n- 评论系统\n- 点赞功能\n- 收藏功能\n\n希望您喜欢这个博客系统！',
      excerpt: '展示博客系统功能的另一篇文章',
      slug: 'another-test-post',
      published: true,
      authorId: admin.id,
      publishedAt: new Date(),
    },
  });

  // 创建一些测试评论
  const comment1 = await prisma.comment.create({
    data: {
      content: '这是一条测试评论',
      postId: testPost.id,
      authorId: testUser.id,
      isApproved: true,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: '这是另一条测试评论，用于测试评论系统',
      postId: testPost.id,
      authorId: anonymousUser.id,
      isApproved: false, // 待审核
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Anonymous Browser)',
    },
  });

  // 创建回复评论
  await prisma.comment.create({
    data: {
      content: '这是对第一条评论的回复',
      postId: testPost.id,
      authorId: admin.id,
      parentId: comment1.id,
      isApproved: true,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Admin Browser)',
    },
  });

  // 创建标签
  const tag1 = await prisma.tag.upsert({
    where: { name: '技术' },
    update: {},
    create: {
      name: '技术',
      slug: 'tech',
      color: '#3B82F6',
    },
  });

  const tag2 = await prisma.tag.upsert({
    where: { name: '测试' },
    update: {},
    create: {
      name: '测试',
      slug: 'test',
      color: '#10B981',
    },
  });

  // 关联文章和标签
  await prisma.postTag.upsert({
    where: {
      postId_tagId: {
        postId: testPost.id,
        tagId: tag1.id,
      },
    },
    update: {},
    create: {
      postId: testPost.id,
      tagId: tag1.id,
    },
  });

  await prisma.postTag.upsert({
    where: {
      postId_tagId: {
        postId: secondPost.id,
        tagId: tag2.id,
      },
    },
    update: {},
    create: {
      postId: secondPost.id,
      tagId: tag2.id,
    },
  });

  console.log('种子数据生成完成！');
  console.log(`管理员账户: ${ADMIN_EMAIL} / ******`);
  console.log('测试用户: test@whispers.local / test123');
  console.log(`创建了 ${await prisma.post.count()} 篇文章`);
  console.log(`创建了 ${await prisma.comment.count()} 条评论`);
  console.log(`创建了 ${await prisma.user.count()} 个用户`);
}

main()
  .catch((e) => {
    console.error('种子数据生成失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
