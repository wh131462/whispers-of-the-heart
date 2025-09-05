#!/bin/bash

# Docker 启动脚本
set -e

echo "🚀 启动 Whispers of the Heart 应用..."

# 检查 Docker 和 Docker Compose 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p uploads
mkdir -p ssl
mkdir -p logs

# 检查 SSL 证书
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "⚠️  SSL 证书未找到，将使用 HTTP 模式"
    echo "   如需 HTTPS，请将证书文件放置在 ssl/ 目录下"
fi

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker-compose build

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 运行数据库迁移
echo "🗄️  运行数据库迁移..."
docker-compose exec api npx prisma migrate deploy

# 生成 Prisma 客户端
echo "⚙️  生成 Prisma 客户端..."
docker-compose exec api npx prisma generate

echo "✅ 应用启动完成！"
echo ""
echo "🌐 访问地址："
echo "   前端应用: http://localhost"
echo "   管理后台: http://localhost/admin"
echo "   API 文档: http://localhost:7777/api/v1"
echo "   数据库管理: http://localhost:8081"
echo "   MinIO 控制台: http://localhost:9001"
echo ""
echo "📊 查看日志："
echo "   docker-compose logs -f"
echo ""
echo "🛑 停止服务："
echo "   docker-compose down"
