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
    const { name, parentId, description } = createFolderDto;
    
    // 权限检查
    const hasPermission = await this.checkCreateFolderPermission(parentId, userId, userRole);
    if (!hasPermission) {
      throw new ForbiddenException('没有权限在此位置创建文件夹');
    }

    let path: string;
    let ownerId: string;
    let parentFolder: any = null;

    if (parentId) {
      parentFolder = await this.prisma.folder.findUnique({
        where: { id: parentId }
      });
      if (!parentFolder) {
        throw new NotFoundException('Parent folder not found');
      }
      path = `${parentFolder.path}/${name}`;
      
      // 继承父文件夹的所有者
      ownerId = parentFolder.ownerId || userId;
    } else {
      // 在用户根目录创建
      path = `/${userId}/${name}`;
      ownerId = userId;
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
    // 构建查询条件
    const where: any = {
      parentId: parentId || null
    };

    // 非管理员只能看到自己有权限的文件夹
    if (userRole !== 'ADMIN') {
      where.OR = [
        // 公共文件夹（所有人可见）
        { isPublic: true },
        // 用户自己的文件夹
        { ownerId: userId },
        // 用户目录下的文件夹
        { path: { startsWith: `/${userId}` } }
      ];
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
    // 构建查询条件
    const where: any = {};

    // 非管理员只能看到自己有权限的文件夹
    if (userRole !== 'ADMIN') {
      where.OR = [
        // 公共文件夹（所有人可见）
        { isPublic: true },
        // 用户自己的文件夹
        { ownerId: userId },
        // 用户目录下的文件夹
        { path: { startsWith: `/${userId}` } }
      ];
    }

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

    // 确保用户根目录存在
    await this.initSystemFoldersService.ensureUserRootFolder(userId, `user-${userId}`);

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
        throw new NotFoundException('用户根目录不存在');
      }

      folderPath = `/${userId}`;
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    relativePath = `${folderPath}${folderPath === '/' ? '' : '/'}${filename}`;

    // 确保文件夹存在
    const uploadsDir = join(process.cwd(), 'uploads');
    fileDir = join(uploadsDir, folderPath);
    if (!existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }

    // 文件已经被multer保存到磁盘，我们只需要移动或重命名它
    const finalFilePath = join(fileDir, filename);
    
    // 如果multer保存的文件路径与目标路径不同，则移动文件
    if (file.path && file.path !== finalFilePath) {
      const fs = require('fs');
      // 确保目标目录存在
      if (!existsSync(fileDir)) {
        mkdirSync(fileDir, { recursive: true });
      }
      // 移动文件到正确位置
      fs.renameSync(file.path, finalFilePath);
    }
    
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
    if (folderId) {
      where.folderId = folderId;
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
