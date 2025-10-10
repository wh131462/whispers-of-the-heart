import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOrphanFolders() {
  console.log('开始检查和修复孤立文件夹...');

  try {
    // 1. 查找引用了不存在用户的文件夹
    const foldersWithOwners = await prisma.folder.findMany({
      where: {
        ownerId: { not: null }
      },
      include: {
        owner: true
      }
    });

    const orphanFolders = foldersWithOwners.filter(folder => !folder.owner);
    
    if (orphanFolders.length > 0) {
      console.log(`发现 ${orphanFolders.length} 个孤立文件夹（引用不存在的用户）:`);
      
      for (const folder of orphanFolders) {
        console.log(`  - ${folder.name} (${folder.path}) -> 用户ID: ${folder.ownerId}`);
        
        // 根据路径判断如何处理
        if (folder.path.startsWith('/public')) {
          // 公共目录下的文件夹，移除所有者
          await prisma.folder.update({
            where: { id: folder.id },
            data: { 
              ownerId: null,
              isPublic: true 
            }
          });
          console.log(`    ✅ 已修复为公共文件夹`);
        } else {
          // 检查是否是用户根目录
          const userIdFromPath = folder.path.replace('/', '');
          const userExists = await prisma.user.findUnique({
            where: { id: userIdFromPath }
          });
          
          if (userExists) {
            // 用户存在，更新所有者
            await prisma.folder.update({
              where: { id: folder.id },
              data: { ownerId: userIdFromPath }
            });
            console.log(`    ✅ 已修复所有者为 ${userExists.username}`);
          } else {
            // 用户不存在，删除文件夹
            console.log(`    ⚠️ 用户不存在，将删除文件夹`);
            
            // 首先删除文件夹中的文件
            await prisma.file.deleteMany({
              where: { folderId: folder.id }
            });
            
            // 然后删除子文件夹
            await prisma.folder.deleteMany({
              where: { parentId: folder.id }
            });
            
            // 最后删除文件夹本身
            await prisma.folder.delete({
              where: { id: folder.id }
            });
            
            console.log(`    ✅ 已删除孤立文件夹`);
          }
        }
      }
    } else {
      console.log('✅ 没有发现孤立文件夹');
    }

    // 2. 验证修复结果
    console.log('\n验证修复结果...');
    const remainingOrphans = await prisma.folder.findMany({
      where: {
        ownerId: { not: null }
      },
      include: {
        owner: true
      }
    });

    const stillOrphan = remainingOrphans.filter(folder => !folder.owner);
    
    if (stillOrphan.length === 0) {
      console.log('✅ 所有文件夹的用户引用都是有效的');
    } else {
      console.log(`❌ 仍有 ${stillOrphan.length} 个文件夹存在无效的用户引用`);
    }

    // 3. 显示统计信息
    const totalFolders = await prisma.folder.count();
    const publicFolders = await prisma.folder.count({ where: { isPublic: true } });
    const userFolders = await prisma.folder.count({ 
      where: { 
        isPublic: false, 
        ownerId: { not: null } 
      } 
    });
    const systemFolders = await prisma.folder.count({ where: { isSystem: true } });

    console.log('\n=== 修复后统计 ===');
    console.log(`总文件夹: ${totalFolders}`);
    console.log(`公共文件夹: ${publicFolders}`);
    console.log(`用户文件夹: ${userFolders}`);
    console.log(`系统文件夹: ${systemFolders}`);

  } catch (error) {
    console.error('修复过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行这个脚本
if (require.main === module) {
  fixOrphanFolders()
    .then(() => {
      console.log('\n修复完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('修复失败:', error);
      process.exit(1);
    });
}

export { fixOrphanFolders };
