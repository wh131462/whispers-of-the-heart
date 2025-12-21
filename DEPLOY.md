# 部署指南

## 一键部署

```bash
# 1. 克隆代码
git clone https://github.com/wh131462/whispers-of-the-heart.git
cd whispers-of-the-heart

# 2. 配置环境变量（首次需要）
cp configs/env.example configs/env.production
nano configs/env.production  # 编辑配置

# 3. 一键部署
./deploy.sh prod --init
```

完成！访问 https://131462.wang

## 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ 内存

## 配置说明

编辑 `configs/env.production`，主要配置：

```bash
# 数据库密码
POSTGRES_PASSWORD=你的密码

# JWT 密钥（生成：openssl rand -base64 32）
JWT_SECRET=随机密钥

# MinIO 密钥
MINIO_ACCESS_KEY=你的密钥
MINIO_SECRET_KEY=你的密钥

# 管理员账号
ADMIN_EMAIL=admin@131462.wang
ADMIN_PASSWORD=你的密码
```

## SSL 证书

部署脚本会自动生成自签名证书用于测试。生产环境替换为正式证书：

```bash
# Let's Encrypt 证书
sudo certbot certonly --standalone -d 131462.wang -d api.131462.wang

# 复制证书
cp /etc/letsencrypt/live/131462.wang/fullchain.pem infra/ssl/131462.wang.crt
cp /etc/letsencrypt/live/131462.wang/privkey.pem infra/ssl/131462.wang.key
cp infra/ssl/131462.wang.crt infra/ssl/api.131462.wang.crt
cp infra/ssl/131462.wang.key infra/ssl/api.131462.wang.key

# 重启 nginx
docker restart whispers-nginx-prod
```

## 常用命令

```bash
# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f api

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 更新部署
git pull && ./deploy.sh prod
```

## 数据备份

```bash
# 备份数据库
docker exec whispers-postgres-prod pg_dump -U EternalHeart whispers_db > backup.sql

# 恢复数据库
cat backup.sql | docker exec -i whispers-postgres-prod psql -U EternalHeart -d whispers_db
```
