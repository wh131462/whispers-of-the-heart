#!/bin/bash

# Whispers of the Heart - 一键部署脚本
# 用法: ./deploy.sh [dev|prod]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 默认环境
ENV=${1:-prod}

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    log_error "用法: ./deploy.sh [dev|prod]"
    exit 1
fi

log_info "开始部署 Whispers of the Heart ($ENV 环境)..."

# 检查 Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose 未安装"
    exit 1
fi

# 检查配置文件
ENV_FILE="configs/env.${ENV}uction"
[ "$ENV" = "dev" ] && ENV_FILE="configs/env.development"
[ "$ENV" = "prod" ] && ENV_FILE="configs/env.production"

if [ ! -f "$ENV_FILE" ]; then
    log_warn "配置文件不存在，从模板创建..."
    cp configs/env.example "$ENV_FILE"
    log_warn "请编辑 $ENV_FILE 填入你的配置后重新运行此脚本"
    exit 1
fi

# 创建必要目录
log_info "创建必要目录..."
mkdir -p uploads logs backups infra/ssl

# 加载环境变量
log_info "加载环境变量..."
set -a
source "$ENV_FILE"
set +a

# 检查 SSL 证书（生产环境）
if [ "$ENV" = "prod" ]; then
    if [ ! -f "infra/ssl/131462.wang.crt" ]; then
        log_warn "SSL 证书不存在，尝试生成自签名证书（仅用于测试）..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout infra/ssl/131462.wang.key \
            -out infra/ssl/131462.wang.crt \
            -subj "/CN=131462.wang" 2>/dev/null || true
        cp infra/ssl/131462.wang.crt infra/ssl/api.131462.wang.crt
        cp infra/ssl/131462.wang.key infra/ssl/api.131462.wang.key
        log_warn "已生成自签名证书，生产环境请替换为正式证书"
    fi
fi

# 停止旧服务
log_info "停止旧服务..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 构建镜像
log_info "构建 Docker 镜像（这可能需要几分钟）..."
docker-compose -f docker-compose.prod.yml build

# 启动服务
log_info "启动服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
log_info "等待服务启动..."
sleep 10

# 检查服务状态
log_info "检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

# 初始化数据库（首次部署）
if [ "$2" = "--init" ] || [ "$2" = "-i" ]; then
    log_info "初始化数据库..."
    docker exec whispers-api-prod sh -c "npx prisma db push && npx prisma db seed"
fi

echo ""
log_info "部署完成！"
echo ""
echo "访问地址："
if [ "$ENV" = "prod" ]; then
    echo "  博客前端: https://131462.wang"
    echo "  管理后台: https://131462.wang/admin"
    echo "  API 服务: https://api.131462.wang"
else
    echo "  博客前端: http://localhost:8888"
    echo "  管理后台: http://localhost:8888/admin"
    echo "  API 服务: http://localhost:7777"
fi
echo ""
echo "常用命令："
echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f"
echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
echo "  停止服务: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "首次部署请运行: ./deploy.sh $ENV --init"
