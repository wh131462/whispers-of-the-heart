import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPublicFolderOwnership() {
  console.log('开始修复公共目录文件夹的所有权问题...');

  try {
    // 1. 修复公共目录下的文件夹，移除错误的所有者
    const result = await prisma.folder.updateMany({
      where: {
        OR: [
          { path: { startsWith: '/public/' } }, // 公共目录下的子文件夹
          { path: '/public' }, // 公共目录本身
          { isPublic: true } // 所有标记为公共的文件夹
        ],
        ownerId: { not: null } // 有所有者的
      },
      data: {
        ownerId: null // 移除所有者
      }
    });

    console.log(`已修复 ${result.count} 个公共文件夹的所有权问题`);

    // 2. 确保公共目录标记正确
    const publicFolders = await prisma.folder.updateMany({
      where: {
        OR: [
          { path: '/public' },
          { path: { startsWith: '/public/' } }
        ]
      },
      data: {
        isPublic: true,
        ownerId: null
      }
    });

    console.log(`已确保 ${publicFolders.count} 个文件夹正确标记为公共文件夹`);

    // 3. 检查并报告修复后的状态
    const publicFoldersCount = await prisma.folder.count({
      where: { isPublic: true }
    });

    const userFoldersCount = await prisma.folder.count({
      where: { 
        isPublic: false,
        ownerId: { not: null }
      }
    });

    const orphanFoldersCount = await prisma.folder.count({
      where: {
        isPublic: false,
        ownerId: null,
        path: { not: { startsWith: '/public' } }
      }
    });

    console.log('\n修复完成！当前状态：');
    console.log(`- 公共文件夹: ${publicFoldersCount} 个`);
    console.log(`- 用户文件夹: ${userFoldersCount} 个`);
    console.log(`- 孤立文件夹: ${orphanFoldersCount} 个`);

    if (orphanFoldersCount > 0) {
      console.warn('\n警告：发现孤立文件夹（非公共且无所有者），请手动检查');
      
      const orphanFolders = await prisma.folder.findMany({
        where: {
          isPublic: false,
          ownerId: null,
          path: { not: { startsWith: '/public' } }
        },
        select: {
          id: true,
          name: true,
          path: true
        }
      });

      console.log('孤立文件夹列表：');
      orphanFolders.forEach(folder => {
        console.log(`  - ID: ${folder.id}, 名称: ${folder.name}, 路径: ${folder.path}`);
      });
    }

  } catch (error) {
    console.error('修复过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行这个脚本
if (require.main === module) {
  fixPublicFolderOwnership()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

export { fixPublicFolderOwnership };
