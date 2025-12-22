#!/bin/bash

# 构建并导出 Docker 镜像到 release 目录
# 用法: ./scripts/build-release.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RELEASE_DIR="$PROJECT_ROOT/release"
VERSION=$(date +%Y%m%d%H%M%S)

echo "========================================"
echo "  Whispers of the Heart - 构建发布包"
echo "========================================"
echo ""
echo "版本: $VERSION"
echo "输出目录: $RELEASE_DIR"
echo ""

# 创建 release 目录
mkdir -p "$RELEASE_DIR"

cd "$PROJECT_ROOT"

# 目标平台（服务器是 AMD64）
PLATFORM="linux/amd64"

# 构建 API 镜像
echo "[1/5] 构建 API 镜像 (平台: $PLATFORM)..."
docker build \
  --platform $PLATFORM \
  -f infra/docker/Dockerfile.api \
  -t whispers-api:latest \
  -t whispers-api:$VERSION \
  --target production \
  .

# 构建 Web 镜像
echo "[2/5] 构建 Web 镜像 (平台: $PLATFORM)..."
docker build \
  --platform $PLATFORM \
  -f infra/docker/Dockerfile.web \
  -t whispers-web:latest \
  -t whispers-web:$VERSION \
  --target production \
  --build-arg VITE_API_URL=https://api.131462.wang \
  .

# 导出镜像
echo "[3/5] 导出镜像到 release 目录..."
docker save whispers-api:latest | gzip > "$RELEASE_DIR/whispers-api.tar.gz"
docker save whispers-web:latest | gzip > "$RELEASE_DIR/whispers-web.tar.gz"

# 复制部署文件
echo "[4/5] 复制部署配置..."
cp "$PROJECT_ROOT/docker-compose.prod.yml" "$RELEASE_DIR/"
cp -r "$PROJECT_ROOT/infra/nginx" "$RELEASE_DIR/"
mkdir -p "$RELEASE_DIR/configs"
if [ -f "$PROJECT_ROOT/configs/env.production" ]; then
  cp "$PROJECT_ROOT/configs/env.production" "$RELEASE_DIR/configs/"
else
  echo "# 生产环境配置" > "$RELEASE_DIR/configs/env.production"
  echo "# 请根据实际情况填写" >> "$RELEASE_DIR/configs/env.production"
fi

# 创建 .env 文件用于 docker-compose 变量替换
cat > "$RELEASE_DIR/.env" << 'ENVEOF'
# Docker Compose 环境变量（从 configs/env.production 同步）
# 这个文件用于 docker-compose 变量替换
POSTGRES_DATABASE=whispers_db
POSTGRES_USERNAME=EternalHeart
POSTGRES_PASSWORD=Qq542624047
MINIO_ACCESS_KEY=@!Qq542624047
MINIO_SECRET_KEY=@!Qq542624047
ENVEOF

# 创建部署用的 docker-compose
cat > "$RELEASE_DIR/docker-compose.yml" << 'EOF'
services:
  # Nginx 反向代理 + 静态文件服务
  nginx:
    image: nginx:alpine
    container_name: whispers-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/sites-available:/etc/nginx/sites-available:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./uploads:/var/www/uploads:ro
      - web_dist:/usr/share/nginx/html:ro
    networks:
      - whispers-network
    depends_on:
      web:
        condition: service_completed_successfully

  # API 后端服务
  api:
    image: whispers-api:latest
    container_name: whispers-api
    restart: always
    expose:
      - "7777"
    environment:
      - NODE_ENV=production
    env_file:
      - ./configs/env.production
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - whispers-network
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy

  # Web 前端构建服务（构建完成后退出）
  web:
    image: whispers-web:latest
    container_name: whispers-web
    restart: "no"
    volumes:
      - web_dist:/dist
    networks:
      - whispers-network

  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: whispers-postgres
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DATABASE:-whispers_db}
      POSTGRES_USER: ${POSTGRES_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      TZ: Asia/Shanghai
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - whispers-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO 对象存储
  minio:
    image: minio/minio:latest
    container_name: whispers-minio
    restart: always
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin}
      TZ: Asia/Shanghai
    volumes:
      - minio_data:/data
    networks:
      - whispers-network
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  minio_data:
  web_dist:

networks:
  whispers-network:
    driver: bridge
EOF

# 创建部署脚本
cat > "$RELEASE_DIR/deploy.sh" << 'EOF'
#!/bin/bash

# 服务器部署脚本
# 用法: ./deploy.sh

set -e

echo "========================================"
echo "  Whispers of the Heart - 部署"
echo "========================================"

# 加载镜像
echo "[1/4] 加载 Docker 镜像..."
docker load < whispers-api.tar.gz
docker load < whispers-web.tar.gz

# 停止旧服务并清理
echo "[2/4] 停止旧服务..."
docker compose down --remove-orphans 2>/dev/null || true
# 强制删除可能残留的容器
docker rm -f whispers-nginx whispers-api whispers-web whispers-postgres whispers-minio 2>/dev/null || true

# 创建 SSL 证书
echo "[3/4] 检查 SSL 证书..."
mkdir -p ssl

# 检查是否安装了 certbot
if command -v certbot &> /dev/null; then
  # 使用 Let's Encrypt 申请证书
  if [ ! -f ssl/131462.wang.crt ]; then
    echo "使用 Let's Encrypt 申请证书..."
    # 确保 80 端口没有被占用
    docker stop whispers-nginx 2>/dev/null || true

    # 申请主域名证书
    certbot certonly --standalone --non-interactive --agree-tos \
      --email admin@131462.wang \
      -d 131462.wang -d www.131462.wang \
      || echo "Let's Encrypt 申请失败，使用自签名证书"

    # 申请 API 域名证书
    certbot certonly --standalone --non-interactive --agree-tos \
      --email admin@131462.wang \
      -d api.131462.wang \
      || echo "Let's Encrypt API 证书申请失败，使用自签名证书"

    # 复制证书到 ssl 目录
    if [ -f /etc/letsencrypt/live/131462.wang/fullchain.pem ]; then
      cp /etc/letsencrypt/live/131462.wang/fullchain.pem ssl/131462.wang.crt
      cp /etc/letsencrypt/live/131462.wang/privkey.pem ssl/131462.wang.key
      echo "✓ 131462.wang Let's Encrypt 证书已安装"
    fi
    if [ -f /etc/letsencrypt/live/api.131462.wang/fullchain.pem ]; then
      cp /etc/letsencrypt/live/api.131462.wang/fullchain.pem ssl/api.131462.wang.crt
      cp /etc/letsencrypt/live/api.131462.wang/privkey.pem ssl/api.131462.wang.key
      echo "✓ api.131462.wang Let's Encrypt 证书已安装"
    fi
  fi
else
  echo "certbot 未安装，如需 Let's Encrypt 证书请先安装: apt install certbot"
fi

# 如果没有证书，创建自签名证书作为后备
if [ ! -f ssl/131462.wang.crt ]; then
  echo "创建自签名 SSL 证书..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/131462.wang.key \
    -out ssl/131462.wang.crt \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=Whispers/CN=131462.wang" \
    -addext "subjectAltName=DNS:131462.wang,DNS:www.131462.wang"
fi
if [ ! -f ssl/api.131462.wang.crt ]; then
  echo "创建 API 自签名 SSL 证书..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/api.131462.wang.key \
    -out ssl/api.131462.wang.crt \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=Whispers/CN=api.131462.wang" \
    -addext "subjectAltName=DNS:api.131462.wang"
fi

# 启动所有服务（API 容器会自动运行数据库迁移）
echo "[4/4] 启动服务..."
docker compose up -d

# 等待服务就绪
echo ""
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "服务状态:"
docker compose ps

# 设置 Let's Encrypt 证书自动续期
if command -v certbot &> /dev/null && [ -d /etc/letsencrypt/live ]; then
  echo ""
  echo "[自动续期] 配置证书自动续期..."

  # 创建续期脚本
  cat > /usr/local/bin/whispers-renew-ssl.sh << 'RENEW_EOF'
#!/bin/bash
# Whispers SSL 证书续期脚本
cd /workspace/deploy/whispers

# 停止 nginx 释放 80 端口
docker stop whispers-nginx 2>/dev/null || true

# 续期证书
certbot renew --quiet

# 复制新证书
if [ -f /etc/letsencrypt/live/131462.wang/fullchain.pem ]; then
  cp /etc/letsencrypt/live/131462.wang/fullchain.pem ssl/131462.wang.crt
  cp /etc/letsencrypt/live/131462.wang/privkey.pem ssl/131462.wang.key
fi
if [ -f /etc/letsencrypt/live/api.131462.wang/fullchain.pem ]; then
  cp /etc/letsencrypt/live/api.131462.wang/fullchain.pem ssl/api.131462.wang.crt
  cp /etc/letsencrypt/live/api.131462.wang/privkey.pem ssl/api.131462.wang.key
fi

# 重启 nginx
docker start whispers-nginx
RENEW_EOF

  chmod +x /usr/local/bin/whispers-renew-ssl.sh

  # 添加 cron 任务（每月 1 号和 15 号凌晨 3 点执行）
  CRON_JOB="0 3 1,15 * * /usr/local/bin/whispers-renew-ssl.sh >> /var/log/whispers-ssl-renew.log 2>&1"
  (crontab -l 2>/dev/null | grep -v "whispers-renew-ssl"; echo "$CRON_JOB") | crontab -

  echo "✓ 已配置证书自动续期（每月 1 号和 15 号凌晨 3 点）"
fi

echo ""
echo "部署完成！"
echo ""
echo "查看服务状态: docker compose ps"
echo "查看日志: docker compose logs -f"
EOF

chmod +x "$RELEASE_DIR/deploy.sh"

# 创建升级脚本
cat > "$RELEASE_DIR/upgrade.sh" << 'EOF'
#!/bin/bash

# 平滑升级脚本
# 用法: ./upgrade.sh

set -e

echo "========================================"
echo "  Whispers of the Heart - 平滑升级"
echo "========================================"

# 加载新镜像
echo "[1/4] 加载新镜像..."
docker load < whispers-api.tar.gz
docker load < whispers-web.tar.gz

# 备份当前数据库（可选但推荐）
echo "[2/4] 备份数据库..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec whispers-postgres pg_dump -U postgres whispers_prod > "backups/$BACKUP_FILE" 2>/dev/null || {
  mkdir -p backups
  echo "跳过数据库备份（首次部署或数据库未运行）"
}

# 滚动更新服务
echo "[3/4] 滚动更新服务..."

# 更新 API（先启动新容器，再停止旧容器）
echo "  - 更新 API 服务..."
docker compose up -d --no-deps --force-recreate api

# 等待 API 健康检查通过
echo "  - 等待 API 启动..."
for i in {1..30}; do
  if docker exec whispers-api node -e "require('http').get('http://localhost:7777/api/v1/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" 2>/dev/null; then
    echo "  ✓ API 已就绪"
    break
  fi
  sleep 2
  if [ $i -eq 30 ]; then
    echo "  ✗ API 启动超时，请检查日志: docker logs whispers-api"
    exit 1
  fi
done

# 更新 Web（复制静态文件到卷）
echo "  - 更新 Web 静态资源..."
docker compose up -d --no-deps --force-recreate web

# 等待 Web 容器完成复制（容器会自动退出）
echo "  - 等待静态资源复制..."
for i in {1..15}; do
  STATUS=$(docker inspect whispers-web --format '{{.State.Status}}' 2>/dev/null)
  if [ "$STATUS" = "exited" ]; then
    EXIT_CODE=$(docker inspect whispers-web --format '{{.State.ExitCode}}' 2>/dev/null)
    if [ "$EXIT_CODE" = "0" ]; then
      echo "  ✓ 静态资源已更新"
      break
    else
      echo "  ✗ Web 容器退出异常，请检查日志: docker logs whispers-web"
      exit 1
    fi
  fi
  sleep 1
  if [ $i -eq 15 ]; then
    echo "  ✗ Web 资源复制超时，请检查日志: docker logs whispers-web"
    exit 1
  fi
done

# 重新加载 Nginx 配置（不中断连接）
echo "[4/4] 重新加载 Nginx..."
docker exec whispers-nginx nginx -s reload 2>/dev/null || docker restart whispers-nginx

# 清理旧镜像
echo ""
echo "清理旧镜像..."
docker image prune -f

echo ""
echo "========================================"
echo "  升级完成！"
echo "========================================"
echo ""
echo "查看服务状态: docker compose ps"
echo "查看日志: docker compose logs -f"
echo ""
if [ -f "backups/$BACKUP_FILE" ]; then
  echo "数据库备份: backups/$BACKUP_FILE"
fi
EOF

chmod +x "$RELEASE_DIR/upgrade.sh"

# 打包成完整的 tar 包（包含所有文件，Docker 镜像已压缩无需再压缩）
echo "[5/5] 打包发布文件..."
cd "$RELEASE_DIR"
ARCHIVE_FILE="whispers-release-$VERSION.tar"
# 排除 macOS 特有的文件（._ 文件和 .DS_Store）
COPYFILE_DISABLE=1 tar --exclude='._*' --exclude='.DS_Store' -cvf "$ARCHIVE_FILE" .
cd "$PROJECT_ROOT"

# 显示结果
echo ""
echo "========================================"
echo "  构建完成！"
echo "========================================"
echo ""
echo "发布文件:"
ls -lh "$RELEASE_DIR"
echo ""
echo "完整发布包:"
ls -lh "$RELEASE_DIR/$ARCHIVE_FILE"
echo ""
echo "下一步:"
echo "1. 上传: scp release/$ARCHIVE_FILE user@server:/path/"
echo "2. 解压: mkdir -p whispers && tar -xvf $ARCHIVE_FILE -C whispers/"
echo "3. 编辑 configs/env.production 配置文件"
echo "4. 运行 ./deploy.sh 部署"
