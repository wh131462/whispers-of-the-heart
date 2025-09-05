#!/bin/bash

# 开发环境启动脚本
set -e

echo "🚀 启动 Whispers of the Heart 开发环境..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install
fi

# 生成 Prisma 客户端
echo "🗄️  生成 Prisma 客户端..."
cd apps/api && pnpm prisma:generate && cd ../..

echo ""
echo "✅ 开发环境准备完成！"
echo ""
echo "🌐 启动各个项目："
echo ""
echo "1. 启动后端 API (新终端):"
echo "   pnpm dev:api"
echo ""
echo "2. 启动前端 Web (新终端):"
echo "   pnpm dev:web"
echo ""
echo "3. 启动管理后台 (新终端):"
echo "   pnpm dev:admin"
echo ""
echo "4. 启动所有项目 (并行):"
echo "   pnpm dev"
echo ""
echo "📊 其他有用命令："
echo "   pnpm build:api    # 构建后端"
echo "   pnpm build:web    # 构建前端"
echo "   pnpm build:admin  # 构建管理后台"
echo "   pnpm db:studio    # 打开 Prisma Studio"
echo "   pnpm db:migrate   # 运行数据库迁移"
echo ""
echo "🔧 访问地址："
echo "   前端应用: http://localhost:8888"
echo "   管理后台: http://localhost:9999"
echo "   后端 API: http://localhost:7777"
echo "   Prisma Studio: http://localhost:5555"
