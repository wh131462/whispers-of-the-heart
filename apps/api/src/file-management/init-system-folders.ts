import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initSystemFolders() {
  try {
    // 创建系统文件夹
    const systemFolders = [
      {
        name: 'images',
        path: '/images',
        description: '图片文件存储',
        isSystem: true
      },
      {
        name: 'documents',
        path: '/documents',
        description: '文档文件存储',
        isSystem: true
      },
      {
        name: 'videos',
        path: '/videos',
        description: '视频文件存储',
        isSystem: true
      },
      {
        name: 'audio',
        path: '/audio',
        description: '音频文件存储',
        isSystem: true
      },
      {
        name: 'archives',
        path: '/archives',
        description: '压缩包文件存储',
        isSystem: true
      },
      {
        name: 'others',
        path: '/others',
        description: '其他类型文件存储',
        isSystem: true
      }
    ];

    for (const folder of systemFolders) {
      const existingFolder = await prisma.folder.findUnique({
        where: { path: folder.path }
      });

      if (!existingFolder) {
        await prisma.folder.create({
          data: folder
        });
        console.log(`Created system folder: ${folder.name}`);
      } else {
        console.log(`System folder already exists: ${folder.name}`);
      }
    }

    console.log('System folders initialization completed');
  } catch (error) {
    console.error('Error initializing system folders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initSystemFolders();
}

export { initSystemFolders };
