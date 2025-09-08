import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initSystemFolders() {
  try {
    console.log('开始初始化系统文件夹...');

    // 1. 创建公共目录
    const publicFolder = await prisma.folder.findFirst({
      where: { path: '/public' }
    });

    if (!publicFolder) {
      await prisma.folder.create({
        data: {
          name: '公共目录',
          path: '/public',
          description: '所有用户共享的公共文件目录',
          isSystem: true,
          isPublic: true,
          ownerId: null
        }
      });
      console.log('✅ 公共目录创建成功');
    } else {
      console.log('✅ 公共目录已存在');
    }

    // 2. 为所有现有用户创建根目录
    const users = await prisma.user.findMany({
      select: { id: true, username: true }
    });

    for (const user of users) {
      const userRootPath = `/${user.id}`;
      
      const existingFolder = await prisma.folder.findFirst({
        where: { path: userRootPath }
      });

      if (!existingFolder) {
        await prisma.folder.create({
          data: {
            name: `${user.username}的文件`,
            path: userRootPath,
            description: `${user.username}的个人文件目录`,
            isSystem: true,
            isPublic: false,
            ownerId: user.id
          }
        });
        console.log(`✅ 用户 ${user.username} 的根目录创建成功`);
      } else {
        console.log(`✅ 用户 ${user.username} 的根目录已存在`);
      }
    }

    console.log('✅ 系统文件夹初始化完成');

  } catch (error) {
    console.error('❌ 初始化系统文件夹时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initSystemFolders();
}

export { initSystemFolders };
