---
name: docker-helper
description: Docker 全流程助手。当处理容器化、Docker 配置、部署、镜像构建、compose 编排、CI/CD、或用户提到"Docker"、"容器"、"部署"、"镜像"、"compose"时使用。
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, TodoWrite
---

# Docker 全流程助手

覆盖 Docker 全生命周期：环境探测、Dockerfile 编写、Compose 编排、镜像构建、部署运维、CI/CD 集成。

---

## 执行流程

### 第一步：探测项目 Docker 现状

在执行任何操作前，先扫描项目中的 Docker 相关文件：

```bash
# 查找所有 Docker 相关文件
find . -maxdepth 4 \( \
  -name "Dockerfile*" -o \
  -name "docker-compose*.yml" -o \
  -name "docker-compose*.yaml" -o \
  -name ".dockerignore" -o \
  -name "*.dockerfile" \
\) -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null

# 检查 package.json 中的 docker 相关脚本
grep -r "docker" package.json --include="package.json" -l 2>/dev/null

# 检查 CI/CD 中的 docker 步骤
find . -path "*/.github/workflows/*.yml" -o -path "*/.gitlab-ci.yml" -o -path "*/Jenkinsfile" 2>/dev/null

# 检查部署脚本
find . -maxdepth 3 \( -name "deploy*.sh" -o -name "release*.sh" -o -name "build*.sh" \) 2>/dev/null
```

阅读找到的文件，建立项目 Docker 全景图后再行动。

---

## 能力域

### 一、Dockerfile 编写与优化

#### 多阶段构建模板（Node.js）

```dockerfile
# ---- 构建阶段 ----
FROM node:22-alpine AS builder
WORKDIR /app

# 利用层缓存：先复制依赖声明
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# 再复制源码并构建
COPY . .
RUN pnpm build

# ---- 运行阶段 ----
FROM node:22-alpine AS production
RUN apk add --no-cache dumb-init
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN corepack enable pnpm && pnpm install --prod --frozen-lockfile

EXPOSE 3000
USER node
CMD ["dumb-init", "node", "dist/main.js"]
```

#### 优化检查清单

在编写或审查 Dockerfile 时，逐项检查：

| 检查项        | 说明                                              |
| ------------- | ------------------------------------------------- |
| 多阶段构建    | 分离构建依赖和运行时，减小镜像体积                |
| 层缓存利用    | 先 COPY package.json -> install -> 再 COPY 源码   |
| .dockerignore | 排除 node_modules、.git、dist、\*.log 等          |
| 非 root 用户  | 使用 `USER node` 或创建专用用户运行应用           |
| PID 1 问题    | 使用 `dumb-init` 或 `tini` 正确处理信号           |
| 健康检查      | HEALTHCHECK 指令确保容器自愈                      |
| 固定版本      | 基础镜像使用具体版本标签，避免 `latest`           |
| 无敏感信息    | 不在镜像中硬编码密码/密钥，使用环境变量或 secrets |
| Alpine 优先   | 优先使用 `-alpine` 变体减小体积                   |
| 清理缓存      | `apk add --no-cache` 或 `rm -rf /var/cache/apk/*` |

#### 常见技术栈模板选择

根据项目技术栈选择对应的 Dockerfile 模式：

- **Node.js (NestJS/Express)**: 两阶段，builder + production
- **前端 SPA (React/Vue)**: 两阶段，builder(node) + 运行(nginx:alpine)，或三阶段 builder + 纯数据容器(仅复制产物到卷)
- **Go**: 两阶段，builder(golang) + 运行(scratch/distroless)
- **Python**: 两阶段，builder + 运行(slim)
- **Monorepo**: 选择性复制 package.json -> 安装 -> 复制源码 -> 构建目标包

---

### 二、Docker Compose 编排

#### 环境分层策略

| 文件                    | 用途                   | 包含内容                                   |
| ----------------------- | ---------------------- | ------------------------------------------ |
| docker-compose.dev.yml  | 开发环境               | 仅基础设施（DB/缓存/MQ），应用在宿主机运行 |
| docker-compose.prod.yml | 生产环境（本地构建）   | 全部服务，含 build 指令                    |
| docker-compose.ghcr.yml | 生产环境（预构建镜像） | 全部服务，使用 image 指令                  |

#### Compose 编写规范

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${PROJECT_NAME:-myapp}-app
    restart: unless-stopped
    env_file: .env
    expose:
      - '3000' # 内部端口，不对外暴露
    volumes:
      - ./uploads:/app/uploads
    networks:
      - internal
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'wget', '-qO-', 'http://localhost:3000/health']
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s

  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - internal
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  db_data:

networks:
  internal:
    driver: bridge
```

#### Compose 检查清单

| 检查项                 | 说明                                                  |
| ---------------------- | ----------------------------------------------------- |
| depends_on + condition | 用 `service_healthy` 而非仅 `service_started`         |
| healthcheck            | 所有有状态服务（DB/缓存）必须配置                     |
| restart 策略           | 生产用 `always`/`unless-stopped`，一次性容器用 `"no"` |
| 网络隔离               | DB 等内部服务不暴露端口，仅通过内部网络通信           |
| 卷持久化               | 有状态数据使用 named volume，不用 bind mount          |
| env_file               | 环境变量通过文件注入，不硬编码在 compose 中           |
| container_name         | 使用项目前缀避免跨项目冲突                            |

---

### 三、部署与运维

#### 部署检查流程

```
1. 检查前置条件
   ├─ Docker / Docker Compose 已安装
   ├─ 环境配置文件存在且完整
   └─ 外部网络（如 Traefik proxy）已创建

2. 备份（升级时）
   └─ docker exec <db-container> pg_dump > backup.sql

3. 构建/拉取镜像
   ├─ 本地构建: docker compose build [--no-cache]
   ├─ 拉取预构建: docker compose pull
   └─ 离线加载: docker load < image.tar.gz

4. 启动服务
   └─ docker compose up -d

5. 验证
   ├─ docker compose ps（所有服务 running/healthy）
   ├─ 健康检查端点可达
   └─ 日志无异常: docker compose logs --tail=50
```

#### 滚动更新模式

```bash
# 1. 更新后端（等健康检查通过）
docker compose up -d --no-deps --force-recreate api
# 2. 验证后端健康
docker compose exec api wget -qO- http://localhost:PORT/health
# 3. 更新前端
docker compose up -d --no-deps --force-recreate web
# 4. 重载反向代理
docker compose exec nginx nginx -s reload
```

#### 数据库备份命令模板

```bash
# PostgreSQL 备份
docker exec <container> pg_dump -U <user> -d <db> | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# PostgreSQL 恢复
gunzip -c backup.sql.gz | docker exec -i <container> psql -U <user> -d <db>

# MySQL 备份
docker exec <container> mysqldump -u<user> -p<pass> <db> | gzip > backup.sql.gz
```

---

### 四、排障诊断

当容器出现问题时，按以下顺序排查：

```bash
# 1. 查看容器状态
docker compose ps

# 2. 查看日志（最近 100 行）
docker compose logs --tail=100 <service>

# 3. 查看容器详情（退出码、重启次数、OOM）
docker inspect <container> --format='{{.State.Status}} ExitCode:{{.State.ExitCode}} OOMKilled:{{.State.OOMKilled}} RestartCount:{{.RestartCount}}'

# 4. 进入容器调试
docker compose exec <service> sh

# 5. 检查网络连通性
docker compose exec <service> wget -qO- http://<other-service>:<port>/health

# 6. 检查磁盘和资源
docker system df
docker stats --no-stream

# 7. 检查网络
docker network ls
docker network inspect <network>
```

#### 常见问题速查

| 症状           | 可能原因                  | 排查命令                                   |
| -------------- | ------------------------- | ------------------------------------------ |
| 容器反复重启   | 应用崩溃/OOM/健康检查失败 | `docker logs`、`docker inspect`(OOMKilled) |
| 容器间无法通信 | 网络不同/服务名错误       | `docker network inspect`、确认同一 network |
| 端口冲突       | 宿主机端口被占用          | `lsof -i :<port>` 或 `ss -tlnp`            |
| 构建缓存失效   | Dockerfile 指令顺序不当   | 检查 COPY 顺序，确认层缓存策略             |
| 镜像体积过大   | 未使用多阶段/未清理缓存   | `docker images`、`docker history <image>`  |
| 挂载卷权限问题 | 容器内外 UID/GID 不匹配   | `ls -la` 宿主机目录、容器内 `id` 命令      |

---

### 五、CI/CD 集成

#### GitHub Actions 模板

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=
            type=raw,value=latest,enable={{is_default_branch}}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

#### 镜像传输策略

| 方式          | 命令                                                    | 适用场景                |
| ------------- | ------------------------------------------------------- | ----------------------- |
| Registry 拉取 | `docker pull`                                           | 服务器可访问 Registry   |
| 文件传输      | `docker save \| gzip` -> SCP -> `gunzip \| docker load` | 服务器无外网/速度更快   |
| 本地构建      | `docker compose build`                                  | 开发测试/代码在服务器上 |

---

### 六、离线发布包

构建可在无外网服务器上部署的完整发布包：

```bash
# 构建流程
1. docker build -> 生成镜像（可指定 --platform linux/amd64 交叉编译）
2. docker save | gzip -> 导出为 .tar.gz
3. 打包 compose 文件 + nginx 配置 + 部署脚本 + env 模板
4. tar 归档为单个发布包

# 服务器部署流程
1. 解压发布包
2. docker load < image.tar.gz 加载镜像
3. 编辑环境配置
4. docker compose up -d
```

---

## 操作原则

1. **先探测后行动** — 执行前先扫描项目现有 Docker 文件，理解现状
2. **最小变更** — 修改现有配置而非重写，保持与项目已有模式一致
3. **环境隔离** — dev/prod 配置严格分离，不混用
4. **安全优先** — 不在镜像或 compose 中硬编码敏感信息
5. **可回滚** — 部署前备份，升级用滚动更新
6. **健康检查** — 所有有状态服务必须配置 healthcheck
7. **向用户确认** — 涉及删除卷、重置数据、force-recreate 等破坏性操作前，先用 AskUserQuestion 确认
