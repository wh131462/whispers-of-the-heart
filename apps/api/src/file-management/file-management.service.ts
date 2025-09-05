import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFolderDto, UpdateFolderDto, UploadFileDto, UpdateFileDto } from './dto/file-management.dto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FileManagementService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  // 文件夹管理
  async createFolder(createFolderDto: CreateFolderDto, userId: string) {
    const { name, parentId, description } = createFolderDto;
    
    // 生成文件夹路径
    let path = `/${name}`;
    if (parentId) {
      const parentFolder = await this.prisma.folder.findUnique({
        where: { id: parentId }
      });
      if (!parentFolder) {
        throw new NotFoundException('Parent folder not found');
      }
      path = `${parentFolder.path}/${name}`;
    }

    // 检查路径是否已存在
    const existingFolder = await this.prisma.folder.findUnique({
      where: { path }
    });
    if (existingFolder) {
      throw new BadRequestException('Folder with this path already exists');
    }

    return this.prisma.folder.create({
      data: {
        name,
        path,
        parentId,
        description,
        isSystem: false
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            files: true
          }
        }
      }
    });
  }

  async getFolders(parentId?: string) {
    return this.prisma.folder.findMany({
      where: {
        parentId: parentId || null
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async getFolderTree() {
    const allFolders = await this.prisma.folder.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
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

  async updateFolder(id: string, updateFolderDto: UpdateFolderDto) {
    const folder = await this.prisma.folder.findUnique({
      where: { id }
    });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return this.prisma.folder.update({
      where: { id },
      data: updateFolderDto,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            files: true
          }
        }
      }
    });
  }

  async deleteFolder(id: string) {
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

    if (folder.isSystem) {
      throw new BadRequestException('Cannot delete system folder');
    }

    if (folder.children.length > 0) {
      throw new BadRequestException('Cannot delete folder with subfolders');
    }

    if (folder.files.length > 0) {
      throw new BadRequestException('Cannot delete folder with files');
    }

    return this.prisma.folder.delete({
      where: { id }
    });
  }

  // 文件管理
  async uploadFile(uploadFileDto: UploadFileDto, userId: string, file:any) {
    const { folderId, description, tags, isPublic } = uploadFileDto;

    // 验证文件夹是否存在
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId }
    });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    const relativePath = `${folder.path}/${filename}`;
    
    // 确保文件夹存在
    const uploadsDir = join(process.cwd(), 'uploads');
    const fileDir = join(uploadsDir, folder.path);
    if (!existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }
    
    // 保存文件到磁盘
    const filePath = join(fileDir, filename);
    writeFileSync(filePath, file.buffer);
    
    // 生成完整的URL - 确保路径正确
    const apiUrl = this.configService.get('API_URL', 'http://localhost:7777');
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    const url = `${apiUrl}/uploads${cleanPath}`;

    return this.prisma.file.create({
      data: {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        description,
        tags: tags || [],
        isPublic: isPublic !== false,
        folder: {
          connect: {
            id: folderId
          }
        },
        uploader: {
          connect: {
            id: userId
          }
        }
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
      const relativePath = `${file.folder.path}/${file.filename}`;
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
        // 检查文件是否已经存在于正确的位置
        const correctPath = join(uploadsDir, file.folder.path, file.filename);
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
