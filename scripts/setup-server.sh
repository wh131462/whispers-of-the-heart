#!/bin/bash
# 服务器初始化脚本
# 用于首次部署时初始化服务器环境
# 使用方法: ./scripts/setup-server.sh

set -e

DEPLOY_DIR="${DEPLOY_PATH:-/workspace/deploy/whispers}"
REPO_URL="https://github.com/wh131462/whispers-of-the-heart.git"

echo "========================================="
echo "Whispers of the Heart - 服务器初始化"
echo "========================================="

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用 root 用户运行此脚本"
    exit 1
fi

# 创建部署目录
echo "创建部署目录: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# 克隆仓库配置文件
echo "下载配置文件..."
if [ ! -d ".git" ]; then
    git init
    git remote add origin "$REPO_URL"
fi
git fetch origin master
git checkout origin/master -- docker-compose.ghcr.yml
git checkout origin/master -- infra/nginx/
git checkout origin/master -- configs/env.production.example

# 创建必要目录
echo "创建必要目录..."
mkdir -p uploads logs backups configs

# 复制环境变量模板
if [ ! -f "configs/env.production" ]; then
    cp configs/env.production.example configs/env.production
    echo "已创建 configs/env.production，请编辑配置："
    echo "  nano $DEPLOY_DIR/configs/env.production"
fi

# 确保 Traefik 外部网络存在
echo "检查 Docker 网络..."
if ! docker network inspect proxy >/dev/null 2>&1; then
    echo "创建 Traefik 外部网络 'proxy'..."
    docker network create proxy
    echo "✅ proxy 网络已创建"
else
    echo "✅ proxy 网络已存在"
fi

# 设置权限
chown -R 1001:1001 uploads logs 2>/dev/null || true
chmod -R 755 uploads logs

echo ""
echo "========================================="
echo "初始化完成!"
echo "========================================="
echo ""
echo "下一步操作："
echo "1. 编辑环境变量: nano $DEPLOY_DIR/configs/env.production"
echo "2. 确保 Traefik 反向代理已运行并连接到 'proxy' 网络"
echo "3. 登录 GHCR: echo \$GITHUB_TOKEN | docker login ghcr.io -u wh131462 --password-stdin"
echo "4. 启动服务: docker compose -f docker-compose.ghcr.yml up -d"
echo ""
