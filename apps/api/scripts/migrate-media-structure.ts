/* eslint-disable no-console */
/**
 * 媒体文件目录结构迁移脚本
 *
 * 将旧的扁平目录结构迁移到新的按用户和类型分类的目录结构：
 * 旧结构：uploads/filename.ext
 * 新结构：uploads/{userId}/{type}/filename.ext
 *
 * 使用方法：
 * npx ts-node scripts/migrate-media-structure.ts
 *
 * 或者在项目根目录：
 * pnpm --filter api migrate:media
 */

// 加载环境变量
import * as dotenv from 'dotenv';
import * as path from 'path';

// 尝试加载多个可能的配置文件路径
const envPaths = [
  path.join(process.cwd(), '../../configs/env.development'),
  path.join(process.cwd(), 'configs/env.development'),
  path.join(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`已加载环境变量: ${envPath}`);
    break;
  }
}

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

// 根据 MIME 类型获取子目录名称
const getSubdirByMimeType = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audios';
  return 'files';
};

// 检查是否是旧格式的路径（不包含用户目录）
const isOldFormat = (filename: string): boolean => {
  // 旧格式：直接是文件名，如 "abc123.jpg"
  // 新格式：包含用户目录，如 "userId/images/abc123.jpg"
  return !filename.includes('/');
};

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  errors: Array<{ id: string; filename: string; error: string }>;
}

async function migrateMediaStructure(): Promise<MigrationResult> {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  console.log('开始媒体文件目录结构迁移...');
  console.log(`上传目录: ${uploadsDir}`);

  // 获取所有媒体记录
  const mediaFiles = await prisma.media.findMany({
    select: {
      id: true,
      filename: true,
      url: true,
      mimeType: true,
      uploaderId: true,
    },
  });

  result.total = mediaFiles.length;
  console.log(`共找到 ${result.total} 个媒体文件记录`);

  for (const media of mediaFiles) {
    // 跳过已经是新格式的文件
    if (!isOldFormat(media.filename)) {
      console.log(`[跳过] ${media.filename} - 已是新格式`);
      result.skipped++;
      continue;
    }

    // 跳过没有上传者的文件
    if (!media.uploaderId) {
      console.log(`[跳过] ${media.filename} - 无上传者信息`);
      result.skipped++;
      continue;
    }

    const oldFilePath = path.join(uploadsDir, media.filename);

    // 检查原文件是否存在
    if (!fs.existsSync(oldFilePath)) {
      console.log(`[跳过] ${media.filename} - 文件不存在`);
      result.skipped++;
      continue;
    }

    try {
      // 计算新路径
      const subdir = getSubdirByMimeType(media.mimeType);
      const newRelativePath = path.join(
        media.uploaderId,
        subdir,
        media.filename,
      );
      const newFilePath = path.join(uploadsDir, newRelativePath);
      const newDirPath = path.dirname(newFilePath);

      // 确保目标目录存在
      if (!fs.existsSync(newDirPath)) {
        fs.mkdirSync(newDirPath, { recursive: true });
      }

      // 移动文件
      fs.renameSync(oldFilePath, newFilePath);

      // 更新数据库记录
      const newUrl = `/uploads/${newRelativePath.replace(/\\/g, '/')}`;
      await prisma.media.update({
        where: { id: media.id },
        data: {
          filename: newRelativePath.replace(/\\/g, '/'),
          url: newUrl,
          thumbnail: media.mimeType.startsWith('image/') ? newUrl : undefined,
        },
      });

      console.log(`[迁移] ${media.filename} -> ${newRelativePath}`);
      result.migrated++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[失败] ${media.filename} - ${errorMessage}`);
      result.failed++;
      result.errors.push({
        id: media.id,
        filename: media.filename,
        error: errorMessage,
      });
    }
  }

  return result;
}

async function main() {
  try {
    const result = await migrateMediaStructure();

    console.log('\n========== 迁移完成 ==========');
    console.log(`总计: ${result.total}`);
    console.log(`已迁移: ${result.migrated}`);
    console.log(`已跳过: ${result.skipped}`);
    console.log(`失败: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log('\n失败详情:');
      result.errors.forEach((e) => {
        console.log(`  - ${e.filename}: ${e.error}`);
      });
    }

    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
