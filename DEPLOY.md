# 部署指南

本文档介绍如何将 Whispers of the Heart 博客系统部署到生产服务器。

## 服务器要求

| 要求 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 1 核 | 2 核+ |
| 内存 | 2GB | 4GB+ |
| 硬盘 | 20GB | 50GB+ |
| 系统 | Ubuntu 20.04+ / CentOS 8+ | Ubuntu 22.04 |

## 前置准备

### 1. 安装 Docker 和 Docker Compose

```bash
# Ubuntu
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登录以使 docker 组生效
```

### 2. 配置域名 DNS

在你的域名服务商处添加以下 DNS 记录：

| 类型 | 名称 | 值 |
|------|------|-----|
| A | @ | 你的服务器 IP |
| A | www | 你的服务器 IP |
| A | api | 你的服务器 IP |

### 3. 获取 SSL 证书

推荐使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt install certbot

# 获取证书（先停止 nginx 或使用 DNS 验证）
sudo certbot certonly --standalone -d 131462.wang -d www.131462.wang -d api.131462.wang

# 证书位置
# /etc/letsencrypt/live/131462.wang/fullchain.pem
# /etc/letsencrypt/live/131462.wang/privkey.pem
```

## 部署步骤

### 步骤 1：克隆代码

```bash
git clone https://github.com/wh131462/whispers-of-the-heart.git
cd whispers-of-the-heart
```

### 步骤 2：配置环境变量

```bash
# 复制生产环境配置模板
cp configs/env.example configs/env.production

# 编辑配置文件
nano configs/env.production
```

需要修改的关键配置：

```bash
# 数据库配置（修改为你的密码）
DATABASE_URL=postgresql://EternalHeart:你的密码@postgres:5432/whispers_db
POSTGRES_PASSWORD=你的密码

# JWT 密钥（使用随机字符串）
JWT_SECRET=生成一个随机密钥
REFRESH_TOKEN_SECRET=生成另一个随机密钥

# MinIO 配置
MINIO_ACCESS_KEY=你的MinIO密钥
MINIO_SECRET_KEY=你的MinIO密钥

# 邮件配置
MAIL_PASSWORD=你的邮箱密码
```

生成随机密钥：

```bash
openssl rand -base64 32
```

### 步骤 3：配置 SSL 证书

将 SSL 证书复制到项目目录：

```bash
# 创建证书目录
mkdir -p infra/ssl

# 复制证书（使用 Let's Encrypt 证书）
sudo cp /etc/letsencrypt/live/131462.wang/fullchain.pem infra/ssl/131462.wang.crt
sudo cp /etc/letsencrypt/live/131462.wang/privkey.pem infra/ssl/131462.wang.key

# API 子域名证书
sudo cp /etc/letsencrypt/live/131462.wang/fullchain.pem infra/ssl/api.131462.wang.crt
sudo cp /etc/letsencrypt/live/131462.wang/privkey.pem infra/ssl/api.131462.wang.key

# 修改权限
sudo chown -R $USER:$USER infra/ssl
chmod 600 infra/ssl/*.key
```

### 步骤 4：创建必要目录

```bash
mkdir -p uploads logs backups
```

### 步骤 5：构建并启动服务

```bash
# 加载环境变量
export $(cat configs/env.production | grep -v '^#' | xargs)

# 构建镜像
docker-compose -f docker-compose.prod.yml build

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

### 步骤 6：初始化数据库

```bash
# 进入 API 容器
docker exec -it whispers-api-prod sh

# 推送数据库架构
npx prisma db push

# 初始化种子数据
npx prisma db seed

# 退出容器
exit
```

### 步骤 7：验证部署

```bash
# 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 测试 API
curl https://api.131462.wang/health

# 测试前端
curl -I https://131462.wang
```

## 服务管理

### 查看服务状态

```bash
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志

```bash
# 查看所有日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart api
```

### 停止服务

```bash
docker-compose -f docker-compose.prod.yml down
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并部署
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 数据备份

### 数据库备份

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec whispers-postgres-prod pg_dump -U EternalHeart whispers_db > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql
# 保留最近 7 天的备份
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# 添加定时任务（每天凌晨 3 点备份）
(crontab -l 2>/dev/null; echo "0 3 * * * cd $(pwd) && ./backup.sh") | crontab -
```

### 恢复数据库

```bash
# 解压备份
gunzip backups/db_20231201_030000.sql.gz

# 恢复数据
cat backups/db_20231201_030000.sql | docker exec -i whispers-postgres-prod psql -U EternalHeart -d whispers_db
```

## SSL 证书续期

Let's Encrypt 证书有效期 90 天，设置自动续期：

```bash
# 添加续期定时任务
sudo crontab -e

# 添加以下行（每月 1 号凌晨 2 点续期）
0 2 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/131462.wang/* /path/to/whispers-of-the-heart/infra/ssl/ && docker exec whispers-nginx-prod nginx -s reload
```

## 常见问题

### 1. 容器无法启动

```bash
# 检查日志
docker-compose -f docker-compose.prod.yml logs api

# 常见原因：
# - 数据库连接失败：检查 DATABASE_URL
# - 端口被占用：检查 80/443 端口
# - 权限问题：检查 uploads 目录权限
```

### 2. 数据库连接失败

```bash
# 检查 PostgreSQL 容器
docker exec -it whispers-postgres-prod psql -U EternalHeart -d whispers_db

# 如果无法连接，检查环境变量
echo $POSTGRES_PASSWORD
```

### 3. 上传文件失败

```bash
# 检查 uploads 目录权限
chmod 755 uploads
```

### 4. HTTPS 无法访问

```bash
# 检查证书文件
ls -la infra/ssl/

# 检查 nginx 配置
docker exec whispers-nginx-prod nginx -t
```

## 生产环境访问

| 应用 | 地址 |
|------|------|
| 博客前端 | https://131462.wang |
| 管理后台 | https://131462.wang/admin |
| API 服务 | https://api.131462.wang |
| MinIO 控制台 | http://服务器IP:9001 (内部访问) |
