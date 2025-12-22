# 部署指南

## 部署方式

- **方式一**：本地构建镜像 → 上传到服务器（推荐小服务器）
- **方式二**：服务器直接构建（需要较多资源）
- **方式三**：GitHub Actions 自动构建 + 自动部署（CI/CD，推荐）

---

## 方式一：本地构建部署

适合 2H2G 等资源有限的服务器。

### 1. 本地构建

```bash
# 执行构建脚本
./scripts/build-release.sh
```

构建完成后 `release/` 目录包含：
```
release/
├── whispers-api.tar.gz    # API 镜像 (~200MB)
├── whispers-web.tar.gz    # Web 镜像 (~50MB)
├── docker-compose.yml     # 部署配置
├── deploy.sh              # 部署脚本
├── nginx/                 # Nginx 配置
└── configs/
    └── env.production     # 环境变量
```

### 2. 上传到服务器

```bash
# 打包
cd release && tar -czvf ../whispers-release.tar.gz . && cd ..

# 上传
scp whispers-release.tar.gz user@your-server:/home/user/
```

### 3. 服务器部署

```bash
# SSH 登录服务器
ssh user@your-server

# 解压
mkdir -p whispers && cd whispers
tar -xzvf ../whispers-release.tar.gz

# 配置环境变量
nano configs/env.production

# 停止并删除所有 whispers 相关容器（如有缓存）
docker rm -f whispers-nginx whispers-api whispers-web whispers-postgres whispers-minio 2>/dev/null
# 删除旧的错误平台镜像
docker rmi whispers-api:latest whispers-web:latest 2>/dev/null
# 部署
./deploy.sh
```

### 4. 验证

```bash
docker compose ps
docker compose logs -f api
```

---

## 方式二：服务器直接构建

需要 4G+ 内存，或配置 Swap。

### 1. 克隆代码

```bash
git clone https://github.com/wh131462/whispers-of-the-heart.git
cd whispers-of-the-heart
```

### 2. 配置环境

```bash
cp configs/env.production.example configs/env.production
nano configs/env.production
```

### 3. 构建并启动

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

---

## 方式三：GitHub Actions CI/CD（推荐）

代码推送后自动构建镜像并部署到服务器。

### 1. 服务器首次配置

```bash
# 在服务器上运行初始化脚本
curl -sSL https://raw.githubusercontent.com/wh131462/whispers-of-the-heart/master/scripts/setup-server.sh | sudo bash

# 或者手动创建目录
sudo mkdir -p /opt/whispers
cd /opt/whispers

# 下载必要配置文件
git init
git remote add origin https://github.com/wh131462/whispers-of-the-heart.git
git fetch origin master
git checkout origin/master -- docker-compose.ghcr.yml
git checkout origin/master -- infra/nginx/
git checkout origin/master -- configs/env.production.example

# 创建目录和配置
mkdir -p uploads logs backups infra/ssl configs
cp configs/env.production.example configs/env.production
nano configs/env.production
```

### 2. 配置 GitHub Secrets

在仓库 Settings → Secrets and variables → Actions 中添加：

**Secrets（必需）**：
| 名称 | 说明 | 示例 |
|------|------|------|
| `SERVER_HOST` | 服务器 IP 或域名 | `1.2.3.4` |
| `SERVER_USER` | SSH 用户名 | `root` |
| `SERVER_SSH_KEY` | SSH 私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `GHCR_TOKEN` | GitHub Personal Access Token (需 packages:read 权限) | `ghp_xxxx` |

**Secrets（可选）**：
| 名称 | 说明 | 默认值 |
|------|------|--------|
| `SERVER_PORT` | SSH 端口 | `22` |
| `DEPLOY_PATH` | 服务器部署路径 | `/opt/whispers` |

**Variables**：
| 名称 | 说明 | 值 |
|------|------|-----|
| `VITE_API_URL` | API 地址 | `https://api.131462.wang` |

### 3. 创建 GitHub Environment

1. 进入仓库 Settings → Environments
2. 创建名为 `production` 的环境
3. 可选：配置保护规则（如需要审批）

### 4. 生成 SSH 密钥

```bash
# 在本地生成密钥对
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/github_actions.pub user@your-server

# 将私钥内容复制到 GitHub Secrets (SERVER_SSH_KEY)
cat ~/.ssh/github_actions
```

### 5. 生成 GHCR Token

1. 进入 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 生成新 Token，勾选 `read:packages` 权限
3. 将 Token 保存到 `GHCR_TOKEN` Secret

### 6. 触发部署

```bash
# 推送代码自动触发
git push origin master

# 或手动触发
# 进入 Actions 页面 → Build and Deploy → Run workflow
```

### 7. 手动部署（服务器端）

如果只想手动拉取镜像部署：

```bash
cd /opt/whispers

# 登录 GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u wh131462 --password-stdin

# 拉取最新镜像
docker compose -f docker-compose.ghcr.yml pull

# 重启服务
docker compose -f docker-compose.ghcr.yml down web
docker compose -f docker-compose.ghcr.yml up -d
```

---

## 环境配置

编辑 `configs/env.production`：

```bash
# 数据库
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/whispers_prod
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=your_strong_password

# MinIO 对象存储
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=whispers

# JWT（生成：openssl rand -base64 32）
JWT_SECRET=your_random_secret_key
JWT_EXPIRES_IN=7d

# 应用
PORT=7777
NODE_ENV=production

# 邮件（可选）
MAIL_HOST=smtp.example.com
MAIL_PORT=465
MAIL_USER=your_email@example.com
MAIL_PASS=your_password
```

---

## SSL 证书

### 自动申请（Let's Encrypt）

```bash
# 安装 certbot
apt install certbot

# 申请证书（需要先停止 nginx 或使用 webroot 模式）
docker stop whispers-nginx
certbot certonly --standalone -d 131462.wang -d www.131462.wang
certbot certonly --standalone -d api.131462.wang

# 复制证书
cp /etc/letsencrypt/live/131462.wang/fullchain.pem infra/ssl/131462.wang.crt
cp /etc/letsencrypt/live/131462.wang/privkey.pem infra/ssl/131462.wang.key
cp /etc/letsencrypt/live/api.131462.wang/fullchain.pem infra/ssl/api.131462.wang.crt
cp /etc/letsencrypt/live/api.131462.wang/privkey.pem infra/ssl/api.131462.wang.key

# 重启 nginx
docker start whispers-nginx
```

### 证书续期

```bash
# 添加定时任务
crontab -e
# 添加：0 0 1 * * certbot renew --pre-hook "docker stop whispers-nginx" --post-hook "docker start whispers-nginx"
```

---

## 常用命令

```bash
# 查看服务状态
docker compose -f docker-compose.ghcr.yml ps

# 查看日志
docker compose -f docker-compose.ghcr.yml logs -f api
docker compose -f docker-compose.ghcr.yml logs -f nginx

# 重启服务
docker compose -f docker-compose.ghcr.yml restart api

# 停止所有服务
docker compose -f docker-compose.ghcr.yml down

# 更新镜像并重启
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml down web
docker compose -f docker-compose.ghcr.yml up -d
```

---

## 数据备份

```bash
# 备份数据库
docker exec whispers-postgres pg_dump -U postgres whispers_prod > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup.sql | docker exec -i whispers-postgres psql -U postgres -d whispers_prod

# 备份上传文件
tar -czvf uploads_backup.tar.gz uploads/

# 备份 MinIO 数据
docker run --rm -v whispers_minio_data:/data -v $(pwd):/backup alpine tar -czvf /backup/minio_backup.tar.gz /data
```

---

## 故障排查

```bash
# 查看容器日志
docker logs whispers-api --tail 100

# 进入容器调试
docker exec -it whispers-api sh

# 检查网络
docker network ls
docker network inspect whispers-network

# 检查资源使用
docker stats

# 检查 GHCR 镜像
docker images | grep ghcr.io
```

---

## 服务器资源建议

| 配置 | 说明 |
|------|------|
| 2H2G | 可运行，建议使用方式一（本地构建）或方式三（CI/CD） |
| 2H4G | 可直接在服务器构建 |
| 4H8G | 推荐配置，可同时运行多个服务 |
