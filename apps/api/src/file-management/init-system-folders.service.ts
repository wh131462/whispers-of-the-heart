import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class InitSystemFoldersService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.initSystemFolders();
  }

  async initSystemFolders() {
    try {
      // 确保公共目录存在
      const publicFolder = await this.prisma.folder.findFirst({
        where: { path: '/public' }
      });

      if (!publicFolder) {
        await this.prisma.folder.create({
          data: {
            name: '公共目录',
            path: '/public',
            description: '所有用户共享的公共文件目录',
            isSystem: true,
            isPublic: true,
            ownerId: null
          }
        });
        console.log('✅ Public folder initialized');
      }

      // 为所有现有用户创建根目录
      const users = await this.prisma.user.findMany({
        select: { id: true, username: true }
      });

      for (const user of users) {
        await this.ensureUserRootFolder(user.id, user.username);
      }

      console.log('✅ System folders initialization completed');
    } catch (error) {
      console.error('❌ Error initializing system folders:', error);
    }
  }

  /**
   * 确保用户根目录存在
   */
  async ensureUserRootFolder(userId: string, username: string) {
    try {
      // 首先验证用户是否存在
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.warn(`⚠️ User with ID ${userId} not found, skipping folder creation`);
        return;
      }

      const userRootPath = `/${userId}`;
      
      const existingFolder = await this.prisma.folder.findFirst({
        where: { path: userRootPath }
      });

      if (!existingFolder) {
        await this.prisma.folder.create({
          data: {
            name: `${username || user.username}的文件`,
            path: userRootPath,
            description: `${username || user.username}的个人文件目录`,
            isSystem: true,
            isPublic: false,
            ownerId: userId
          }
        });
        console.log(`✅ User root folder created for ${username || user.username} (${userId})`);
      }
    } catch (error) {
      console.error(`❌ Error creating user root folder for ${userId}:`, error);
      // 不要抛出错误，继续处理其他用户
    }
  }

  /**
   * 为新用户创建根目录
   */
  async createUserRootFolder(userId: string, username: string) {
    return this.ensureUserRootFolder(userId, username);
  }
}
