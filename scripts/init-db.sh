#!/bin/bash

echo "🔧 初始化数据库..."

# 检查是否在开发环境
#if [ "$NODE_ENV" != "development" ]; then
#  echo "❌ 此脚本只能在开发环境中运行"
#  exit 1
#fi

# 进入 API 目录
cd apps/api

# 重置数据库
echo "🗑️  重置数据库..."
pnpm prisma migrate reset --force

# 创建迁移
echo "📝 创建数据库迁移..."
pnpm prisma migrate dev --name init

# 生成 Prisma 客户端
echo "🔨 生成 Prisma 客户端..."
pnpm prisma generate

# 创建初始数据
echo "📊 创建初始数据..."
pnpm prisma db seed

echo "✅ 数据库初始化完成！"