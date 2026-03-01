#!/bin/bash

# 生产环境部署脚本
set -e

echo "开始部署 Whispers of the Heart..."

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    exit 1
fi

# 检查环境配置
if [ ! -f "configs/env.production" ]; then
    echo "错误: 生产环境配置文件 configs/env.production 不存在"
    exit 1
fi

# 确保 Traefik 外部网络存在
if ! docker network inspect proxy >/dev/null 2>&1; then
    echo "创建 Traefik 外部网络 'proxy'..."
    docker network create proxy
fi

# 设置生产环境变量
echo "设置生产环境配置..."
cp configs/env.production .env

# 备份当前数据库（如果存在）
if docker ps | grep -q whispers-postgres-prod; then
    echo "备份当前数据库..."
    ./scripts/backup-db.sh
fi

# 构建镜像
echo "构建 Docker 镜像..."
docker compose -f docker-compose.prod.yml build --no-cache

# 停止旧服务
echo "停止旧服务..."
docker compose -f docker-compose.prod.yml down

# 清理旧镜像
echo "清理旧镜像..."
docker image prune -f

# 启动新服务
echo "启动新服务..."
docker compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 健康检查
echo "检查服务状态..."

services=("whispers-nginx-prod" "whispers-api-prod" "whispers-postgres-prod" "whispers-minio-prod")

for service in "${services[@]}"; do
    if docker ps | grep -q $service; then
        echo "  $service 运行正常"
    else
        echo "  $service 启动失败"
        echo "查看日志:"
        docker compose -f docker-compose.prod.yml logs $service
        exit 1
    fi
done

# 显示访问信息
echo ""
echo "部署完成!"
echo ""
echo "访问地址:"
echo "  主站: https://131462.wang"
echo "  API: https://api.131462.wang"
echo ""
echo "监控命令:"
echo "  查看日志: docker compose -f docker-compose.prod.yml logs -f"
echo "  查看状态: docker compose -f docker-compose.prod.yml ps"
