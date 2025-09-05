#!/bin/bash

# 生产环境部署脚本
set -e

echo "🚀 开始部署 Whispers of the Heart..."

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose 未安装"
    exit 1
fi

# 检查环境配置
if [ ! -f "configs/env.production" ]; then
    echo "错误: 生产环境配置文件 configs/env.production 不存在"
    exit 1
fi

# 设置生产环境变量
echo "📝 设置生产环境配置..."
cp configs/env.production .env

# 备份当前数据库（如果存在）
if docker ps | grep -q whispers-postgres-prod; then
    echo "💾 备份当前数据库..."
    ./scripts/backup-db.sh
fi

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 停止旧服务
echo "⏹️  停止旧服务..."
docker-compose -f docker-compose.prod.yml down

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

# 启动新服务
echo "▶️  启动新服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🔍 检查服务状态..."

services=("whispers-nginx-prod" "whispers-api-prod" "whispers-web-prod" "whispers-admin-prod" "whispers-postgres-prod" "whispers-redis-prod")

for service in "${services[@]}"; do
    if docker ps | grep -q $service; then
        echo "✅ $service 运行正常"
    else
        echo "❌ $service 启动失败"
        echo "查看日志:"
        docker-compose -f docker-compose.prod.yml logs $service
        exit 1
    fi
done

# SSL 证书检查
echo "🔒 检查 SSL 证书..."
if [ ! -f "infra/ssl/whispers.example.com.crt" ]; then
    echo "⚠️  警告: SSL 证书文件不存在，请确保已正确配置 SSL 证书"
fi

# 显示访问信息
echo ""
echo "🎉 部署完成!"
echo ""
echo "访问地址:"
echo "  🌐 主站: https://whispers.example.com"
echo "  🔧 管理后台: https://admin.whispers.example.com"
echo "  📡 API: https://api.whispers.example.com"
echo ""
echo "监控命令:"
echo "  查看日志: pnpm prod:logs"
echo "  查看状态: docker-compose -f docker-compose.prod.yml ps"
echo "  重启服务: pnpm prod:restart"

# 发送部署通知（可选）
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 Whispers of the Heart 部署完成 - $(date)\"}" \
        $SLACK_WEBHOOK_URL
fi
