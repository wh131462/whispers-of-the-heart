import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFolderDto, UpdateFolderDto, UploadFileDto, UpdateFileDto } from './dto/file-management.dto';
import { InitSystemFoldersService } from './init-system-folders.service';
import { writeFileSync, mkdirSync, existsSync, createWriteStream } from 'fs';
import { join } from 'path';
import { fixFilenameEncoding } from '../common/utils/filename-encoding.util';

@Injectable()
export class FileManagementService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private initSystemFoldersService: InitSystemFoldersService
  ) {}

  // 权限检查方法
  private async checkFolderPermission(folderId: string, userId: string, userRole: string): Promise<boolean> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) return false;

    // 管理员有所有权限
    if (userRole === 'ADMIN') return true;

    // 公共目录需要编辑权限
    if (folder.isPublic) {
      return userRole === 'EDITOR' || userRole === 'ADMIN';
    }

    // 用户只能访问自己的文件夹
    return folder.ownerId === userId || folder.path.startsWith(`/${userId}`);
  }

  private async checkCreateFolderPermission(parentId: string | null | undefined, userId: string, userRole: string): Promise<boolean> {
    // 管理员可以在任何地方创建文件夹
    if (userRole === 'ADMIN') return true;

    if (!parentId) {
      // 不允许在根目录创建文件夹
      return false;
    }

    return this.checkFolderPermission(parentId, userId, userRole);
  }

  // 文件夹管理
  async createFolder(createFolderDto: CreateFolderDto, userId: string, userRole: string = 'USER') {
    const { name, description } = createFolderDto;
    let { parentId } = createFolderDto;
    
    // 验证用户ID
    if (!userId || userId === 'undefined') {
      throw new BadRequestException('Invalid user ID');
    }
    
    // 权限检查
    const hasPermission = await this.checkCreateFolderPermission(parentId, userId, userRole);
    if (!hasPermission) {
      throw new ForbiddenException('没有权限在此位置创建文件夹');
    }

    let path: string;
    let ownerId: string | null;
    let parentFolder: any = null;

    if (parentId) {
      parentFolder = await this.prisma.folder.findUnique({
        where: { id: parentId }
      });
      if (!parentFolder) {
        throw new NotFoundException('Parent folder not found');
      }

      // 确保父级文件夹有有效的路径
      if (!parentFolder.path || parentFolder.path === 'undefined' || parentFolder.path === '/undefined') {
        throw new BadRequestException('Parent folder has invalid path');
      }

      path = `${parentFolder.path}/${name}`;

      // 公共目录下的文件夹不设置个人所有者
      if (parentFolder.isPublic) {
        ownerId = null; // 公共目录下的内容没有个人所有者
      } else {
        ownerId = parentFolder.ownerId || userId;
      }
    } else {
      // 在用户根目录创建 - 确保用户根目录存在
      let userRootFolder = await this.prisma.folder.findFirst({
        where: { 
          path: `/${userId}`,
          ownerId: userId 
        }
      });
      
      if (!userRootFolder) {
        // 用户根目录不存在，需要先创建
        console.log(`用户根目录不存在，为用户 ${userId} 创建根目录`);
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { username: true }
        });
        
        if (!user) {
          throw new NotFoundException('用户不存在');
        }
        
        await this.initSystemFoldersService.ensureUserRootFolder(userId, user.username);
        
        // 重新获取创建的用户根目录
        userRootFolder = await this.prisma.folder.findFirst({
          where: { 
            path: `/${userId}`,
            ownerId: userId 
          }
        });
        
        if (!userRootFolder) {
          throw new Error('无法创建或找到用户根目录');
        }
      }
      
      path = `/${userId}/${name}`;
      ownerId = userId;
      // 关键修复：设置正确的parentId
      parentId = userRootFolder.id;
    }

    // 检查路径是否已存在
    const existingFolder = await this.prisma.folder.findUnique({
      where: { path }
    });
    if (existingFolder) {
      throw new BadRequestException('文件夹已存在');
    }

    return this.prisma.folder.create({
      data: {
        name,
        path,
        parentId,
        description,
        isSystem: false,
        isPublic: parentFolder?.isPublic || false,
        ownerId
      },
      include: {
        parent: true,
        children: true,
        owner: {
          select: {
            id: true,
            username: true
          }
        },
        _count: {
          select: {
            files: true
          }
        }
      }
    });
  }

  async getFolders(userId: string, userRole: string = 'USER', parentId?: string) {
    console.log(`📁 个人空间getFolders - userId: ${userId}, parentId: ${parentId || 'user-root'}`);
    
    if (!userId) {
      throw new BadRequestException('用户ID是必需的');
    }

    let where: any;

    if (!parentId) {
      // 个人空间根目录：显示用户自己的文件夹 + 公共目录入口
      const userRootFolder = await this.prisma.folder.findFirst({
        where: { 
          path: `/${userId}`,
          ownerId: userId 
        }
      });

      where = {
        OR: [
          // 用户根目录下的直接子文件夹
          {
            parentId: userRootFolder?.id || null,
            ownerId: userId,
            path: { startsWith: `/${userId}/` }
          },
          // 公共目录（只在根目录显示）
          {
            path: '/public',
            isPublic: true
          }
        ]
      };
    } else {
      // 子目录：只显示当前目录下用户有权限的内容
      where = {
        parentId: parentId,
        OR: [
          { isPublic: true },
          { ownerId: userId },
          { path: { startsWith: `/${userId}/` } }
        ]
      };
    }

    return this.prisma.folder.findMany({
      where,
      include: {
        parent: true,
        children: true,
        owner: {
          select: {
            id: true,
            username: true
          }
        },
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: [
        { isPublic: 'desc' }, // 公共文件夹优先
        { isSystem: 'desc' }, // 系统文件夹优先
        { name: 'asc' }
      ]
    });
  }

  async getFolderTree(userId: string, userRole: string = 'USER') {
    console.log(`🌳 个人空间文件夹树 - userId: ${userId}, role: ${userRole}`);
    
    if (!userId) {
      throw new BadRequestException('用户ID是必需的');
    }

    // 个人空间模式：只获取用户自己的文件夹 + 公共文件夹
    const where: any = {
      OR: [
        // 用户自己拥有的文件夹（包括用户根目录）
        { ownerId: userId },
        // 用户目录下的文件夹（路径匹配）
        { path: { startsWith: `/${userId}` } },
        // 公共文件夹（完整的公共目录树）
        { isPublic: true }
      ]
    };

    const allFolders = await this.prisma.folder.findMany({
      where,
      include: {
        parent: true,
        children: true,
        owner: {
          select: {
            id: true,
            username: true
          }
        },
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: [
        { isPublic: 'desc' }, // 公共文件夹优先
        { isSystem: 'desc' }, // 系统文件夹优先
        { name: 'asc' }
      ]
    });

    // 构建树形结构，但要特殊处理根目录
    const buildPersonalTree = (): any[] => {
      const result: any[] = [];
      
      // 1. 添加用户根目录（包含其子文件夹）
      const userRootFolder = allFolders.find(f => f.path === `/${userId}` && f.ownerId === userId);
      if (userRootFolder) {
        const userSubfolders = allFolders.filter(f => f.parentId === userRootFolder.id);
        result.push({
          ...userRootFolder,
          children: userSubfolders.map(folder => ({
            ...folder,
            children: this.buildTreeRecursive(allFolders, folder.id)
          }))
        });
      }
      
      // 2. 添加公共目录（只添加根公共目录）
      const publicRootFolder = allFolders.find(f => f.path === '/public' && f.isPublic);
      if (publicRootFolder) {
        result.push({
          ...publicRootFolder,
          children: this.buildTreeRecursive(allFolders, publicRootFolder.id)
        });
      }
      
      return result;
    };

    return buildPersonalTree();
  }

  // 辅助方法：递归构建树形结构
  private buildTreeRecursive(folders: any[], parentId: string): any[] {
    return folders
      .filter(folder => folder.parentId === parentId)
      .map(folder => ({
        ...folder,
        children: this.buildTreeRecursive(folders, folder.id)
      }));
  }

  // 管理模式：获取所有文件夹的树状结构（仅管理员）
  async getManagementFolderTree() {
    const allFolders = await this.prisma.folder.findMany({
      include: {
        parent: true,
        children: true,
        owner: {
          select: {
            id: true,
            username: true
          }
        },
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: [
        { isPublic: 'desc' }, // 公共文件夹优先
        { isSystem: 'desc' }, // 系统文件夹优先
        { path: 'asc' } // 按路径排序，确保用户目录有序
      ]
    });

    // 构建树形结构
    const buildTree = (folders: any[], parentId: string | null = null): any[] => {
      return folders
        .filter(folder => folder.parentId === parentId)
        .map(folder => ({
          ...folder,
          children: buildTree(folders, folder.id)
        }));
    };

    return buildTree(allFolders);
  }

  // 管理模式：获取当前目录下的文件夹（仅管理员）
  async getManagementFolders(parentId?: string) {
    return this.prisma.folder.findMany({
      where: {
        parentId: parentId || null
      },
      include: {
        parent: true,
        children: true,
        owner: {
          select: {
            id: true,
            username: true
          }
        },
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: [
        { isPublic: 'desc' }, // 公共文件夹优先
        { isSystem: 'desc' }, // 系统文件夹优先
        { name: 'asc' }
      ]
    });
  }

  async updateFolder(id: string, updateFolderDto: UpdateFolderDto, userId: string, userRole: string = 'USER') {
    const folder = await this.prisma.folder.findUnique({
      where: { id }
    });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // 权限检查
    const hasPermission = await this.checkFolderPermission(id, userId, userRole);
    if (!hasPermission) {
      throw new ForbiddenException('没有权限修改此文件夹');
    }

    // 系统文件夹不允许重命名
    if (folder.isSystem && updateFolderDto.name && updateFolderDto.name !== folder.name) {
      throw new BadRequestException('系统文件夹不能重命名');
    }

    return this.prisma.folder.update({
      where: { id },
      data: updateFolderDto,
      include: {
        parent: true,
        children: true,
        owner: {
          select: {
            id: true,
            username: true
          }
        },
        _count: {
          select: {
            files: true
          }
        }
      }
    });
  }

  async deleteFolder(id: string, userId: string, userRole: string = 'USER') {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
      include: {
        children: true,
        files: true
      }
    });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // 权限检查
    const hasPermission = await this.checkFolderPermission(id, userId, userRole);
    if (!hasPermission) {
      throw new ForbiddenException('没有权限删除此文件夹');
    }

    if (folder.isSystem) {
      throw new BadRequestException('系统文件夹不能删除');
    }

    if (folder.children.length > 0) {
      throw new BadRequestException('文件夹包含子文件夹，无法删除');
    }

    if (folder.files.length > 0) {
      throw new BadRequestException('文件夹包含文件，无法删除');
    }

    return this.prisma.folder.delete({
      where: { id }
    });
  }

  // 文件管理
  async uploadFile(uploadFileDto: UploadFileDto, userId: string, userRole: string = 'USER', file: any) {
    const { folderId, description, tags, isPublic } = uploadFileDto;

    // 验证用户ID
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new BadRequestException('Invalid user ID');
    }

    // 确保用户根目录存在 - 获取真实用户名
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });
    
    if (user) {
      await this.initSystemFoldersService.ensureUserRootFolder(userId, user.username);
    } else {
      throw new NotFoundException('用户不存在');
    }

    let folder;
    let fileDir;
    let relativePath;
    let folderPath = `/${userId}`; // 默认为用户根目录路径

    if (folderId && folderId.trim() !== '' && folderId !== 'root' && folderId !== 'public') {
      // 有指定文件夹，验证权限
      folder = await this.prisma.folder.findUnique({
        where: { id: folderId }
      });
      if (!folder) {
        throw new NotFoundException('目标文件夹不存在');
      }

      // 权限检查
      const hasPermission = await this.checkFolderPermission(folderId, userId, userRole);
      if (!hasPermission) {
        throw new ForbiddenException('没有权限上传到此文件夹');
      }

      folderPath = folder.path;
    } else if (folderId === 'public') {
      // 上传到公共目录 - 需要编辑权限
      if (userRole !== 'ADMIN' && userRole !== 'EDITOR') {
        throw new ForbiddenException('没有权限上传到公共目录');
      }

      // 确保公共文件夹存在
      folder = await this.prisma.folder.findFirst({
        where: { path: '/public', isPublic: true }
      });

      if (!folder) {
        throw new NotFoundException('公共目录不存在');
      }

      folderPath = '/public';
    } else {
      // 上传到用户根目录
      folder = await this.prisma.folder.findFirst({
        where: { path: `/${userId}`, ownerId: userId }
      });
      
      if (!folder) {
        // 用户根目录不存在，尝试创建
        console.log(`用户根目录不存在，为用户 ${userId} 创建根目录`);
        try {
          await this.initSystemFoldersService.ensureUserRootFolder(userId, user.username);
          // 重新查找
          folder = await this.prisma.folder.findFirst({
            where: { path: `/${userId}`, ownerId: userId }
          });
          if (!folder) {
            throw new NotFoundException('无法创建用户根目录');
          }
        } catch (error) {
          console.error('创建用户根目录失败:', error);
          throw new NotFoundException('用户根目录不存在且无法创建');
        }
      }

      folderPath = `/${userId}`;
    }

    // 使用multer已经生成的文件名
    const filename = file.filename; // multer已经生成了唯一文件名
    console.log('使用multer生成的文件名:', filename);
    console.log('multer保存的文件路径:', file.path);
    
    // 确保目标文件夹存在
    const uploadsDir = join(process.cwd(), 'uploads');
    fileDir = join(uploadsDir, folderPath);
    if (!existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }

    // 计算最终文件路径
    const finalFilePath = join(fileDir, filename);
    console.log('最终文件路径:', finalFilePath);
    
    // 如果multer保存的文件路径与目标路径不同，则移动文件
    if (file.path && file.path !== finalFilePath) {
      const fs = require('fs');
      console.log(`移动文件: ${file.path} -> ${finalFilePath}`);
      
      // 确保目标目录存在
      if (!existsSync(fileDir)) {
        mkdirSync(fileDir, { recursive: true });
      }
      
      // 检查源文件是否存在
      if (!existsSync(file.path)) {
        throw new Error(`源文件不存在: ${file.path}`);
      }
      
      // 移动文件到正确位置
      fs.renameSync(file.path, finalFilePath);
      console.log('文件移动成功');
    } else {
      console.log('文件已在正确位置，无需移动');
    }
    
    // 生成相对路径用于URL
    relativePath = `${folderPath}${folderPath === '/' ? '' : '/'}${filename}`;
    
    // 生成完整的URL - 确保路径正确并进行URL编码
    const apiUrl = this.configService.get('API_URL', 'http://localhost:7777');
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    
    // 对路径中的文件名部分进行URL编码，但保留路径分隔符
    const pathParts = cleanPath.split('/');
    const encodedPath = pathParts.map((part, index) => {
      // 跳过空字符串和路径分隔符
      if (part === '' || index === 0) return part;
      // 对文件名进行URL编码
      return encodeURIComponent(part);
    }).join('/');
    
    const url = `${apiUrl}/uploads${encodedPath}`;

    // 使用工具函数确保原始文件名使用正确的UTF-8编码
    const originalName = fixFilenameEncoding(file.originalname);

    // 准备文件创建数据
    const fileData: any = {
      filename,
      originalName,
      mimeType: file.mimetype,
      size: file.size,
      url,
      description: description || null,
      tags: tags || [],
      isPublic: isPublic !== false,
      uploader: {
        connect: {
          id: userId
        }
      }
    };

    // 只有当folder存在时才连接文件夹
    if (folder) {
      fileData.folder = {
        connect: {
          id: folder.id
        }
      };
    }

    return this.prisma.file.create({
      data: fileData,
      include: {
        folder: true,
        uploader: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });
  }

  async getFiles(folderId?: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    // 重要：明确处理folderId参数
    if (folderId) {
      // 如果指定了folderId，只返回该文件夹中的文件
      where.folderId = folderId;
    } else {
      // 如果没有指定folderId，只返回根目录的文件（folderId为null的文件）
      where.folderId = null;
    }
    
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }
    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip,
        take: limit,
        include: {
          folder: true,
          uploader: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.file.count({ where })
    ]);

    return {
      files,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getFileById(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        folder: true,
        uploader: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  // 新方法：获取目录内容（文件夹 + 文件）- 个人空间模式
  async getDirectoryContent(
    folderId?: string,
    userId?: string,
    userRole = 'USER',
    search?: string,
    page = 1,
    limit = 20
  ) {
    console.log(`🔍 个人空间模式 - folderId: ${folderId || 'user-root'}, userId: ${userId}, role: ${userRole}`);

    if (!userId) {
      throw new BadRequestException('用户ID是必需的');
    }

    let folderWhere: any;
    let currentFolder: any = null;

    if (!folderId) {
      // 个人空间根目录：显示用户自己的文件夹 + 公共目录入口
      console.log('📁 获取个人空间根目录内容');
      
      // 确保用户根目录存在
      const userRootFolder = await this.prisma.folder.findFirst({
        where: { 
          path: `/${userId}`,
          ownerId: userId 
        }
      });

      folderWhere = {
        OR: [
          // 用户根目录下的直接子文件夹
          {
            parentId: userRootFolder?.id || null,
            ownerId: userId,
            path: { startsWith: `/${userId}/` }
          },
          // 公共目录（只在根目录显示）
          {
            path: '/public',
            isPublic: true
          }
        ]
      };
    } else {
      // 子目录：只显示当前目录下的内容
      currentFolder = await this.prisma.folder.findUnique({
        where: { id: folderId }
      });

      if (!currentFolder) {
        throw new NotFoundException('文件夹不存在');
      }

      // 检查权限：用户只能访问自己的文件夹或公共文件夹
      const canAccess = currentFolder.isPublic || 
                       currentFolder.ownerId === userId || 
                       currentFolder.path.startsWith(`/${userId}/`) ||
                       currentFolder.path.startsWith('/public/');

      if (!canAccess) {
        throw new ForbiddenException('没有权限访问此文件夹');
      }

      // 获取当前文件夹的子文件夹
      folderWhere = {
        parentId: folderId,
        OR: [
          { isPublic: true },
          { ownerId: userId },
          { path: { startsWith: `/${userId}/` } }
        ]
      };
    }

    const folders = await this.prisma.folder.findMany({
      where: folderWhere,
      include: {
        owner: {
          select: { id: true, username: true }
        },
        _count: {
          select: { files: true }
        }
      },
      orderBy: [
        { isPublic: 'desc' }, // 公共文件夹优先
        { name: 'asc' }
      ]
    });

    // 获取文件
    const filesResult = await this.getFiles(folderId, page, limit, search);

    console.log(`📂 个人空间内容 - 文件夹: ${folders.length}, 文件: ${filesResult.files.length}`);

    return {
      folders,
      files: filesResult.files,
      pagination: {
        total: filesResult.total,
        page: filesResult.page,
        limit: filesResult.limit,
        totalPages: filesResult.totalPages
      }
    };
  }

  // 新方法：获取管理模式目录内容
  async getManagementDirectoryContent(
    folderId?: string,
    search?: string,
    page = 1,
    limit = 20
  ) {
    console.log(`🔧 管理模式 - folderId: ${folderId || 'management-root'}`);

    let folderWhere: any;

    if (!folderId) {
      // 管理模式根目录：显示所有用户根目录 + 公共目录
      console.log('📁 获取管理模式根目录内容');
      
      // 获取所有用户根目录
      const allUserRoots = await this.prisma.folder.findMany({
        where: {
          parentId: null,
          ownerId: { not: null },
          isPublic: false,
          path: { not: '/public' }
        },
        select: { id: true }
      });

      const userRootIds = allUserRoots.map(f => f.id);

      folderWhere = {
        OR: [
          // 所有用户的根目录
          {
            id: { in: userRootIds }
          },
          // 公共目录根目录
          {
            path: '/public',
            isPublic: true
          }
        ]
      };
    } else {
      // 子目录：显示当前目录下的所有内容
      folderWhere = {
        parentId: folderId
      };
    }

    const folders = await this.prisma.folder.findMany({
      where: folderWhere,
      include: {
        owner: {
          select: { id: true, username: true }
        },
        _count: {
          select: { files: true }
        }
      },
      orderBy: [
        { isPublic: 'desc' }, // 公共文件夹优先
        { isSystem: 'desc' }, // 系统文件夹优先
        { name: 'asc' }
      ]
    });

    // 获取文件（管理模式：使用特殊逻辑）
    const filesResult = await this.getManagementFiles(folderId, page, limit, search);

    console.log(`🔧 管理模式内容 - 文件夹: ${folders.length}, 文件: ${filesResult.files.length}`);

    return {
      folders,
      files: filesResult.files,
      pagination: {
        total: filesResult.total,
        page: filesResult.page,
        limit: filesResult.limit,
        totalPages: filesResult.totalPages
      }
    };
  }

  // 管理模式专用的文件获取方法
  private async getManagementFiles(folderId?: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};

    // 管理模式下的文件过滤逻辑
    if (folderId) {
      // 如果指定了文件夹ID，返回该文件夹中的文件
      where.folderId = folderId;
    } else {
      // 管理模式根目录不显示任何文件，只显示用户目录结构
      // 返回空结果
      console.log(`🔧 管理模式根目录，不显示文件，只显示用户目录结构`);

      return {
        files: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    console.log(`🔧 管理模式文件查询条件:`, JSON.stringify(where, null, 2));

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip,
        take: limit,
        include: {
          folder: true,
          uploader: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.file.count({ where })
    ]);

    console.log(`🔧 管理模式文件结果: ${files.length} 个文件, 总数: ${total}`);

    return {
      files,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateFile(id: string, updateFileDto: UpdateFileDto) {
    const file = await this.prisma.file.findUnique({
      where: { id }
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    return this.prisma.file.update({
      where: { id },
      data: updateFileDto,
      include: {
        folder: true,
        uploader: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });
  }

  async deleteFile(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id }
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    return this.prisma.file.delete({
      where: { id }
    });
  }

  async incrementDownloadCount(id: string) {
    return this.prisma.file.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1
        }
      }
    });
  }


  // 统计信息
  async getFileStats() {
    const [
      totalFiles,
      totalSize,
      filesByType,
      recentFiles
    ] = await Promise.all([
      this.prisma.file.count(),
      this.prisma.file.aggregate({
        _sum: {
          size: true
        }
      }),
      this.prisma.file.groupBy({
        by: ['mimeType'],
        _count: {
          id: true
        },
        _sum: {
          size: true
        }
      }),
      this.prisma.file.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          folder: true,
          uploader: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      })
    ]);

    return {
      totalFiles,
      totalSize: totalSize._sum.size || 0,
      filesByType: filesByType.map(item => ({
        mimeType: item.mimeType,
        count: item._count.id,
        totalSize: item._sum.size || 0
      })),
      recentFiles
    };
  }

  // 修复现有文件的URL
  async fixFileUrls() {
    const files = await this.prisma.file.findMany({ include: { folder: true } });
    const apiUrl = this.configService.get('API_URL', 'http://localhost:7777');

    for (const file of files) {
      // 处理根目录文件（没有folder关联）
      const folderPath = file.folder?.path || '/';
      const relativePath = `${folderPath}${folderPath === '/' ? '' : '/'}${file.filename}`;
      const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
      const correctUrl = `${apiUrl}/uploads${cleanPath}`;

      if (file.url !== correctUrl) {
        console.log('Fixing file URL:', { oldUrl: file.url, newUrl: correctUrl, fileName: file.originalName });
        await this.prisma.file.update({ where: { id: file.id }, data: { url: correctUrl } });
      }
    }
    return { message: 'File URLs fixed successfully' };
  }

  // 修复现有文件的存储结构
  async fixFileStorage() {
    const files = await this.prisma.file.findMany({ include: { folder: true } });
    const uploadsDir = join(process.cwd(), 'uploads');
    let movedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        // 如果文件没有folder关联，跳过移动操作
        if (!file.folder) {
          console.log(`File ${file.originalName} is in root directory, skipping move`);
          continue;
        }

        // 检查文件是否已经存在于正确的位置
        const folderPath = file.folder.path;
        const correctPath = join(uploadsDir, folderPath, file.filename);
        if (existsSync(correctPath)) {
          console.log(`File already in correct location: ${file.originalName}`);
          continue;
        }

        // 查找文件在uploads根目录中的位置
        const rootFiles = await this.prisma.file.findMany({
          where: {
            filename: file.filename,
            folder: { path: '/' }
          }
        });

        if (rootFiles.length > 0) {
          // 文件在根目录，需要移动到正确的文件夹
          const sourcePath = join(uploadsDir, file.filename);
          if (existsSync(sourcePath)) {
            // 确保目标文件夹存在
            const targetDir = join(uploadsDir, file.folder.path);
            if (!existsSync(targetDir)) {
              mkdirSync(targetDir, { recursive: true });
            }

            // 移动文件
            const fs = require('fs');
            fs.renameSync(sourcePath, correctPath);
            movedCount++;
            console.log(`Moved file: ${file.originalName} to ${file.folder.path}`);
          }
        } else {
          // 尝试通过文件内容匹配找到文件
          const allFiles = require('fs').readdirSync(uploadsDir);
          for (const fileName of allFiles) {
            const filePath = join(uploadsDir, fileName);
            if (require('fs').statSync(filePath).isFile()) {
              // 比较文件大小
              if (require('fs').statSync(filePath).size === file.size) {
                // 确保目标文件夹存在
                const targetDir = join(uploadsDir, file.folder.path);
                if (!existsSync(targetDir)) {
                  mkdirSync(targetDir, { recursive: true });
                }

                // 移动文件
                const fs = require('fs');
                fs.renameSync(filePath, correctPath);
                movedCount++;
                console.log(`Moved file by size match: ${file.originalName} to ${file.folder.path}`);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error moving file ${file.originalName}:`, error);
        errorCount++;
      }
    }

    return { 
      message: 'File storage structure fixed successfully',
      movedCount,
      errorCount
    };
  }
}
