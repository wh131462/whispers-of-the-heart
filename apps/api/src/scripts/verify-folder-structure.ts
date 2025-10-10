import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyFolderStructure() {
  console.log('验证文件夹结构...\n');

  try {
    // 1. 检查公共文件夹
    console.log('=== 公共文件夹 ===');
    const publicFolders = await prisma.folder.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        name: true,
        path: true,
        ownerId: true,
        isPublic: true,
        owner: {
          select: {
            username: true
          }
        }
      },
      orderBy: { path: 'asc' }
    });

    publicFolders.forEach(folder => {
      console.log(`📁 ${folder.name} (${folder.path})`);
      console.log(`   所有者: ${folder.ownerId ? `${folder.owner?.username} (${folder.ownerId})` : '无 (正确)'}`);
      console.log(`   公共: ${folder.isPublic ? '是' : '否'}`);
      console.log('');
    });

    // 2. 检查用户文件夹
    console.log('=== 用户文件夹 ===');
    const userFolders = await prisma.folder.findMany({
      where: { 
        isPublic: false,
        ownerId: { not: null }
      },
      select: {
        id: true,
        name: true,
        path: true,
        ownerId: true,
        isPublic: true,
        owner: {
          select: {
            username: true
          }
        }
      },
      orderBy: { path: 'asc' }
    });

    userFolders.forEach(folder => {
      console.log(`🏠 ${folder.name} (${folder.path})`);
      console.log(`   所有者: ${folder.owner?.username} (${folder.ownerId})`);
      console.log(`   公共: ${folder.isPublic ? '是' : '否'}`);
      console.log('');
    });

    // 3. 检查孤立文件夹
    console.log('=== 孤立文件夹 ===');
    const orphanFolders = await prisma.folder.findMany({
      where: {
        isPublic: false,
        ownerId: null,
        path: { not: { startsWith: '/public' } }
      },
      select: {
        id: true,
        name: true,
        path: true,
        ownerId: true,
        isPublic: true
      },
      orderBy: { path: 'asc' }
    });

    if (orphanFolders.length === 0) {
      console.log('无孤立文件夹 ✅');
    } else {
      orphanFolders.forEach(folder => {
        console.log(`⚠️  ${folder.name} (${folder.path})`);
        console.log(`   所有者: 无`);
        console.log(`   公共: ${folder.isPublic ? '是' : '否'}`);
        console.log('');
      });
    }

    // 4. 统计信息
    console.log('=== 统计信息 ===');
    const stats = await prisma.folder.groupBy({
      by: ['isPublic'],
      _count: {
        id: true
      },
      _min: {
        ownerId: true
      }
    });

    console.log(`总文件夹数: ${await prisma.folder.count()}`);
    stats.forEach(stat => {
      console.log(`${stat.isPublic ? '公共文件夹' : '私有文件夹'}: ${stat._count.id} 个`);
    });

  } catch (error) {
    console.error('验证过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行这个脚本
if (require.main === module) {
  verifyFolderStructure()
    .then(() => {
      console.log('\n验证完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('验证失败:', error);
      process.exit(1);
    });
}

export { verifyFolderStructure };
