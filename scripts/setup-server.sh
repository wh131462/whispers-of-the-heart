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
mkdir -p uploads logs backups infra/ssl configs

# 复制环境变量模板
if [ ! -f "configs/env.production" ]; then
    cp configs/env.production.example configs/env.production
    echo "已创建 configs/env.production，请编辑配置："
    echo "  nano $DEPLOY_DIR/configs/env.production"
fi

# 申请 Let's Encrypt SSL 证书
echo "检查 SSL 证书..."
if [ ! -f "infra/ssl/131462.wang.crt" ] || [ ! -f "infra/ssl/api.131462.wang.crt" ]; then
    echo "申请 Let's Encrypt SSL 证书..."

    # 安装 certbot（如果未安装）
    if ! command -v certbot &> /dev/null; then
        echo "安装 certbot..."
        apt-get update && apt-get install -y certbot
    fi

    # 停止可能占用 80 端口的服务
    systemctl stop nginx 2>/dev/null || true
    docker stop whispers-nginx 2>/dev/null || true

    # 申请 131462.wang 证书
    echo "申请 131462.wang 证书..."
    certbot certonly --standalone --non-interactive --agree-tos \
        --email admin@131462.wang \
        -d 131462.wang -d www.131462.wang \
        || echo "警告: 131462.wang 证书申请失败"

    # 申请 api.131462.wang 证书
    echo "申请 api.131462.wang 证书..."
    certbot certonly --standalone --non-interactive --agree-tos \
        --email admin@131462.wang \
        -d api.131462.wang \
        || echo "警告: api.131462.wang 证书申请失败"

    # 复制证书到项目目录
    if [ -d "/etc/letsencrypt/live/131462.wang" ]; then
        cp /etc/letsencrypt/live/131462.wang/fullchain.pem infra/ssl/131462.wang.crt
        cp /etc/letsencrypt/live/131462.wang/privkey.pem infra/ssl/131462.wang.key
        echo "✅ 131462.wang SSL 证书已安装"
    fi

    if [ -d "/etc/letsencrypt/live/api.131462.wang" ]; then
        cp /etc/letsencrypt/live/api.131462.wang/fullchain.pem infra/ssl/api.131462.wang.crt
        cp /etc/letsencrypt/live/api.131462.wang/privkey.pem infra/ssl/api.131462.wang.key
        echo "✅ api.131462.wang SSL 证书已安装"
    fi

    # 设置证书自动续期定时任务
    if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
        (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/131462.wang/fullchain.pem $DEPLOY_DIR/infra/ssl/131462.wang.crt && cp /etc/letsencrypt/live/131462.wang/privkey.pem $DEPLOY_DIR/infra/ssl/131462.wang.key && cp /etc/letsencrypt/live/api.131462.wang/fullchain.pem $DEPLOY_DIR/infra/ssl/api.131462.wang.crt && cp /etc/letsencrypt/live/api.131462.wang/privkey.pem $DEPLOY_DIR/infra/ssl/api.131462.wang.key && docker restart whispers-nginx") | crontab -
        echo "✅ 已设置证书自动续期定时任务"
    fi
else
    echo "✅ SSL 证书已存在"
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
echo "2. 配置 SSL 证书（见上方提示）"
echo "3. 登录 GHCR: echo \$GITHUB_TOKEN | docker login ghcr.io -u wh131462 --password-stdin"
echo "4. 启动服务: docker compose -f docker-compose.ghcr.yml up -d"
echo ""
