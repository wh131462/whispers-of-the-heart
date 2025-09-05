#!/bin/bash

echo "🚀 启动博客系统..."

# 检查是否安装了必要的依赖
if ! command -v pnpm &> /dev/null; then
    echo "❌ 请先安装 pnpm"
    exit 1
fi

# 检查是否安装了 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 请先安装 Docker"
    exit 1
fi

# 启动数据库
echo "🗄️  启动数据库..."
docker-compose -f docker-compose.dev.yml up -d postgres

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 5

# 初始化数据库
echo "🔧 初始化数据库..."
./scripts/init-db.sh

# 启动 API 服务
echo "🔌 启动 API 服务..."
cd apps/api
pnpm install
# 加载环境变量并启动API
export $(cat ../../configs/env.development | xargs) && pnpm run start:dev &
API_PID=$!
cd ../..

# 等待 API 启动
echo "⏳ 等待 API 启动..."
sleep 10

# 启动 Web 服务
echo "🌐 启动 Web 服务..."
cd apps/web
pnpm install
# 加载环境变量并启动Web
export $(cat ../../configs/env.development | xargs) && pnpm run dev &
WEB_PID=$!
cd ../..

# 启动 Admin 服务
echo "⚙️  启动 Admin 服务..."
cd apps/admin
pnpm install
# 加载环境变量并启动Admin
export $(cat ../../configs/env.development | xargs) && pnpm run dev &
ADMIN_PID=$!
cd ../..

echo "✅ 所有服务已启动！"
echo ""
echo "📱 服务地址："
echo "  - Web 前端: http://localhost:8888"
echo "  - Admin 后台: http://localhost:9999"
echo "  - API 服务: http://localhost:7777"
echo ""
echo "👤 默认管理员账户："
echo "  - 用户名: admin"
echo "  - 密码: admin123"
echo ""
echo "🛑 停止服务请按 Ctrl+C"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $API_PID $WEB_PID $ADMIN_PID; docker-compose -f docker-compose.dev.yml down; echo '✅ 服务已停止'; exit 0" INT

# 保持脚本运行
wait
