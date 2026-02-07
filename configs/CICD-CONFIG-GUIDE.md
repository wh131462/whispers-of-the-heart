# CI/CD 环境配置指南

本文档说明项目 CI/CD 流程中所有需要配置的 GitHub Secrets 和 Variables。

> 部署时 CI/CD 会自动从 Secrets/Variables 生成服务器端的 `configs/env.production`，无需手动维护服务器配置文件。

---

## 一、GitHub Secrets（密钥）

> 配置位置：GitHub 仓库 &rarr; Settings &rarr; Secrets and variables &rarr; Actions &rarr; **Secrets**
>
> 注意：Secrets 创建后无法查看，只能更新或删除。

### SSH 连接（部署用）

| 名称             | 必填 | 说明                                              | 示例                                     |
| ---------------- | ---- | ------------------------------------------------- | ---------------------------------------- |
| `SERVER_HOST`    | 是   | 生产服务器 IP 或域名                              | `1.2.3.4`                                |
| `SERVER_USER`    | 是   | SSH 登录用户名                                    | `root`                                   |
| `SERVER_SSH_KEY` | 是   | SSH 私钥（完整内容，含 BEGIN/END 行）             | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT`    | 否   | SSH 端口，默认 `22`                               | `22`                                     |
| `DEPLOY_PATH`    | 否   | 服务器部署目录，默认 `/workspace/deploy/whispers` | `/workspace/deploy/whispers`             |

### 应用密钥（运行时敏感配置）

| 名称                   | 必填 | 说明                           | 生成方式                  |
| ---------------------- | ---- | ------------------------------ | ------------------------- |
| `POSTGRES_USERNAME`    | 是   | PostgreSQL 用户名              | 自定义                    |
| `POSTGRES_PASSWORD`    | 是   | PostgreSQL 密码                | 自定义强密码              |
| `JWT_SECRET`           | 是   | JWT 签名密钥                   | `openssl rand -base64 32` |
| `REFRESH_TOKEN_SECRET` | 是   | 刷新令牌签名密钥               | `openssl rand -base64 32` |
| `MINIO_ACCESS_KEY`     | 是   | MinIO 访问密钥                 | 自定义                    |
| `MINIO_SECRET_KEY`     | 是   | MinIO 秘密密钥                 | 自定义强密码              |
| `MAIL_PASSWORD`        | 是   | 邮件 SMTP 密码或授权码         | 从邮件服务商获取          |
| `SESSION_SECRET`       | 是   | 会话签名密钥                   | `openssl rand -base64 32` |
| `ADMIN_PASSWORD`       | 是   | 管理员初始密码（首次 seed 用） | 自定义强密码              |
| `AI_API_KEY`           | 是   | AI API 密钥（如 DeepSeek Key） | 从 AI 服务商获取          |

> `GITHUB_TOKEN` 由 GitHub 自动提供，无需手动配置。

---

## 二、GitHub Variables（变量）

> 配置位置：GitHub 仓库 &rarr; Settings &rarr; Secrets and variables &rarr; Actions &rarr; **Variables**
>
> Variables 用于非敏感配置，值可查看和修改。所有 Variables 都有默认值，不配置也能正常构建和部署。

### 前端构建变量

| 名称               | 说明                                             | 默认值                        |
| ------------------ | ------------------------------------------------ | ----------------------------- |
| `VITE_API_URL`     | 前端调用的后端 API 地址                          | `https://api.131462.wang`     |
| `VITE_AI_PROVIDER` | AI 提供商（openai / deepseek / claude / custom） | `deepseek`                    |
| `VITE_AI_MODEL`    | AI 模型名称                                      | `deepseek-chat`               |
| `VITE_AI_BASE_URL` | AI API 基础地址                                  | `https://api.deepseek.com/v1` |
| `VITE_AI_ENABLED`  | 是否启用 AI 功能（true / false）                 | `true`                        |

### 后端部署变量

| 名称             | 说明                       | 默认值                                        |
| ---------------- | -------------------------- | --------------------------------------------- |
| `WEB_URL`        | 网站域名                   | `https://131462.wang`                         |
| `MAIL_HOST`      | SMTP 服务器地址            | `smtp.exmail.qq.com`                          |
| `MAIL_PORT`      | SMTP 端口                  | `465`                                         |
| `MAIL_USERNAME`  | SMTP 发件人账号            | `no-reply@131462.wang`                        |
| `MAIL_FROM`      | 发件人地址                 | `no-reply@131462.wang`                        |
| `ADMIN_EMAIL`    | 管理员邮箱                 | `admin@131462.wang`                           |
| `ADMIN_USERNAME` | 管理员用户名               | `admin`                                       |
| `CORS_ORIGINS`   | 允许的跨域来源（逗号分隔） | `https://131462.wang,https://www.131462.wang` |

---

## 三、自动生成机制

部署时不再需要手动维护服务器上的 `configs/env.production`。CI/CD 流程会在每次部署时：

1. 从 GitHub Secrets 读取敏感配置（密码、密钥等）
2. 从 GitHub Variables 读取非敏感配置（域名、邮箱等），缺失时使用默认值
3. 自动生成 `configs/env.production` 写入服务器
4. Docker Compose 通过 `env_file` 加载该文件启动容器

> 修改配置只需在 GitHub 界面更新 Secret/Variable，然后重新触发部署即可同步到服务器。

### 固定值（无需配置，硬编码在 workflow 中）

以下值在生产环境中固定不变，由 workflow 自动写入：

```
NODE_ENV=production
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DATABASE=whispers_db
REDIS_HOST=redis
REDIS_PORT=6379
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_BUCKET=whispers-storage
MINIO_USE_SSL=false
API_PORT=7777
WEB_PORT=8888
BCRYPT_ROUNDS=12
```

---

## 四、配置关系总结

```
GitHub Secrets (密钥)
├── SSH 连接信息    → 部署时连接服务器
└── 应用密钥        → 生成 env.production 中的敏感值

GitHub Variables (变量)
├── VITE_* 前端变量 → 构建前端镜像时注入（build-args）
└── 后端部署变量    → 生成 env.production 中的非敏感值

服务器 configs/env.production → 由 CI/CD 自动生成，无需手动维护
```

### 数据流

```
1. 代码推送到 master
2. GitHub Actions 触发构建
   ├── build-api: 构建后端镜像（不需要额外变量）
   └── build-web: 构建前端镜像
       └── 从 GitHub Variables 读取 VITE_* 变量注入构建
3. deploy: 部署到服务器
   ├── 使用 Secrets 中的 SSH 信息连接服务器
   ├── 传输镜像文件到 DEPLOY_PATH
   ├── 从 Secrets/Variables 自动生成 configs/env.production
   └── docker compose up -d 启动容器（自动加载 env.production）
```

---

## 五、首次部署检查清单

- [ ] GitHub Secrets 中配置了 SSH 连接：`SERVER_HOST`、`SERVER_USER`、`SERVER_SSH_KEY`
- [ ] GitHub Secrets 中配置了应用密钥：`POSTGRES_USERNAME`、`POSTGRES_PASSWORD`、`JWT_SECRET`、`REFRESH_TOKEN_SECRET`
- [ ] GitHub Secrets 中配置了服务密钥：`MINIO_ACCESS_KEY`、`MINIO_SECRET_KEY`、`MAIL_PASSWORD`、`SESSION_SECRET`
- [ ] GitHub Secrets 中配置了管理和 AI：`ADMIN_PASSWORD`、`AI_API_KEY`
- [ ] GitHub Variables 中按需配置了 `VITE_*` 前端变量（或使用默认值）
- [ ] GitHub Variables 中按需配置了后端部署变量（或使用默认值）
- [ ] SSL 证书已放置到服务器 `$DEPLOY_PATH/infra/ssl/` 目录
- [ ] 首次部署后执行 `docker exec whispers-api npx prisma db seed` 初始化管理员账号
