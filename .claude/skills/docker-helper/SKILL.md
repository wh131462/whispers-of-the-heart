---
name: docker-helper
description: 帮助配置和调试 Docker 环境。当处理容器化部署、Docker 配置问题、或用户提到"Docker"、"容器"、"部署"时使用。
allowed-tools: Read, Write, Bash, Glob
---

# Docker 助手

帮助管理 Whispers of the Heart 项目的 Docker 环境。

## 项目 Docker 结构

```
infra/
├── docker/
│   ├── api/
│   │   └── Dockerfile
│   └── web/
│       └── Dockerfile
├── docker-compose.yml          # 生产环境
├── docker-compose.dev.yml      # 开发环境
└── docker-compose.override.yml # 本地覆盖配置
```

## 服务列表

| 服务     | 端口      | 描述              |
| -------- | --------- | ----------------- |
| web      | 8888      | 前端应用          |
| api      | 7777      | 后端 API          |
| postgres | 5432      | PostgreSQL 数据库 |
| minio    | 9000/9001 | 对象存储          |
| pgadmin  | 5050      | 数据库管理        |

## 常用命令

### 开发环境

```bash
# 启动所有服务
docker-compose -f docker-compose.dev.yml up -d

# 启动特定服务
docker-compose -f docker-compose.dev.yml up -d postgres minio

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f api

# 停止服务
docker-compose -f docker-compose.dev.yml down

# 重建镜像
docker-compose -f docker-compose.dev.yml build --no-cache api
```

### 生产环境

```bash
# 构建并启动
docker-compose up -d --build

# 查看运行状态
docker-compose ps

# 进入容器
docker-compose exec api sh
```

### 数据库操作

```bash
# 运行迁移
docker-compose exec api npx prisma migrate deploy

# 数据库备份
docker-compose exec postgres pg_dump -U postgres whispers > backup.sql

# 数据库恢复
docker-compose exec -T postgres psql -U postgres whispers < backup.sql
```

## Dockerfile 最佳实践

### 多阶段构建 (Node.js)

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# 运行阶段
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 7777
CMD ["node", "dist/main.js"]
```

## 环境变量

### 开发环境 (.env.development)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whispers
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
```

### 生产环境 (.env.production)

```env
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/whispers
MINIO_ENDPOINT=minio
MINIO_PORT=9000
```

## 常见问题

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs api

# 检查资源
docker system df
docker system prune -a  # 清理未使用资源
```

### 网络连接问题

```bash
# 检查网络
docker network ls
docker network inspect whispers_default

# 容器间通信使用服务名而非 localhost
# 正确: postgres:5432
# 错误: localhost:5432
```

### 数据持久化

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
  - minio_data:/data
```

## 健康检查

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:7777/health']
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 注意事项

- 生产环境不要使用默认密码
- 敏感配置通过环境变量注入
- 使用 `.dockerignore` 排除不必要文件
- 定期备份数据卷
