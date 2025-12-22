/**
 * 评论数据迁移脚本
 * 将旧的 parentId 嵌套结构转换为抖音风格的扁平化结构
 *
 * 运行方式: npx ts-node prisma/migrate-comments.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateComments() {
  console.log('开始迁移评论数据...');

  // 获取所有有 parentId 的评论（即回复）
  const repliesWithParent = await prisma.comment.findMany({
    where: {
      parentId: { not: null },
      rootId: null, // 只处理未迁移的
    },
    include: {
      parent: {
        include: {
          author: true,
          parent: {
            include: {
              author: true,
              parent: true,
            },
          },
        },
      },
    },
  });

  console.log(`找到 ${repliesWithParent.length} 条需要迁移的回复`);

  for (const reply of repliesWithParent) {
    // 找到顶级评论（rootId）
    let rootComment = reply.parent;
    while (rootComment?.parent) {
      rootComment = rootComment.parent as any;
    }

    // replyToId 就是原来的 parentId
    // replyToUserId 是被回复评论的作者
    const replyToId = reply.parentId;
    const replyToUserId = reply.parent?.authorId;
    const rootId = rootComment?.id;

    if (rootId && replyToId) {
      await prisma.comment.update({
        where: { id: reply.id },
        data: {
          rootId,
          replyToId,
          replyToUserId,
        },
      });
      console.log(`迁移评论 ${reply.id}: rootId=${rootId}, replyToId=${replyToId}`);
    }
  }

  console.log('评论数据迁移完成！');
}

migrateComments()
  .catch((e) => {
    console.error('迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
