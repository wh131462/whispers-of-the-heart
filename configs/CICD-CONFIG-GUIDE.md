# CI/CD 环境配置指南

本文档说明项目 CI/CD 流程中所有需要配置的 GitHub Secrets、Variables，以及服务器端配置文件。

---

## 一、GitHub Secrets（密钥）

> 配置位置：GitHub 仓库 → Settings → Secrets and variables → Actions → **Secrets**
>
> 注意：Secrets 创建后无法查看，只能更新或删除。

| 名称             | 必填 | 说明                                              | 示例                                     |
| ---------------- | ---- | ------------------------------------------------- | ---------------------------------------- |
| `SERVER_HOST`    | 是   | 生产服务器 IP 或域名                              | `1.2.3.4`                                |
| `SERVER_USER`    | 是   | SSH 登录用户名                                    | `root`                                   |
| `SERVER_SSH_KEY` | 是   | SSH 私钥（完整内容，含 BEGIN/END 行）             | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT`    | 否   | SSH 端口，默认 `22`                               | `22`                                     |
| `DEPLOY_PATH`    | 否   | 服务器部署目录，默认 `/workspace/deploy/whispers` | `/workspace/deploy/whispers`             |

> `GITHUB_TOKEN` 由 GitHub 自动提供，无需手动配置。

---

## 二、GitHub Variables（变量）

> 配置位置：GitHub 仓库 → Settings → Secrets and variables → Actions → **Variables**
>
> Variables 用于非敏感的构建配置，值可查看和修改。

| 名称               | 必填 | 说明                                             | 默认值                        |
| ------------------ | ---- | ------------------------------------------------ | ----------------------------- |
| `VITE_API_URL`     | 否   | 前端调用的后端 API 地址                          | `https://api.131462.wang`     |
| `VITE_AI_PROVIDER` | 否   | AI 提供商（openai / deepseek / claude / custom） | `deepseek`                    |
| `VITE_AI_MODEL`    | 否   | AI 模型名称                                      | `deepseek-chat`               |
| `VITE_AI_BASE_URL` | 否   | AI API 基础地址                                  | `https://api.deepseek.com/v1` |
| `VITE_AI_ENABLED`  | 否   | 是否启用 AI 功能（true / false）                 | `true`                        |

> 所有 Variables 都有默认值，不配置也能正常构建。
> 如果需要切换 AI 提供商或关闭 AI，修改对应变量后重新触发构建即可。

---

## 三、服务器端配置文件

> 文件位置：服务器 `$DEPLOY_PATH/configs/env.production`
>
> 此文件不提交到 Git，需要在服务器上手动创建和维护。
> 模板参考：仓库中的 `configs/env.example`

### 核心配置项

```bash
# ============ 数据库 ============
DATABASE_URL=postgresql://用户名:密码@postgres:5432/whispers_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USERNAME=<数据库用户名>
POSTGRES_PASSWORD=<数据库密码>
POSTGRES_DATABASE=whispers_db

# ============ JWT ============
JWT_SECRET=<随机字符串，务必修改>
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=<随机字符串，务必修改>
REFRESH_TOKEN_EXPIRES_IN=30d

# ============ MinIO ============
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=<MinIO 访问密钥>
MINIO_SECRET_KEY=<MinIO 秘密密钥>
MINIO_BUCKET=whispers-storage
MINIO_USE_SSL=false

# ============ 邮件 ============
MAIL_HOST=smtp.exmail.qq.com
MAIL_PORT=465
MAIL_USERNAME=<发件邮箱>
MAIL_PASSWORD=<邮箱密码或授权码>
MAIL_FROM=<发件人地址>

# ============ 应用 ============
APP_NAME="Whispers of the Heart"
WEB_URL=https://你的域名
API_URL=https://api.你的域名
API_PORT=7777
WEB_PORT=8888

# ============ Vite 前端变量（运行时不使用，仅本地开发） ============
VITE_API_URL=https://api.你的域名
VITE_WEB_URL=https://你的域名
VITE_WEB_PORT=8888

# ============ 安全 ============
CORS_ORIGINS=https://你的域名,https://www.你的域名
SESSION_SECRET=<随机字符串>
BCRYPT_ROUNDS=12

# ============ 管理员账号（首次 seed 时使用） ============
ADMIN_EMAIL=admin@你的域名
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<管理员密码>

# ============ AI 配置（后端专用） ============
AI_API_KEY=<你的 AI API Key，如 sk-xxx>

# ============ 功能开关 ============
ENABLE_REGISTRATION=true
ENABLE_COMMENTS=true
ENABLE_LIKES=true
ENABLE_EMAIL_VERIFICATION=true
```

---

## 四、配置关系总结

```
GitHub Secrets (密钥)          → CI/CD 部署连接服务器
GitHub Variables (变量)        → 前端构建时注入 VITE_* 环境变量
服务器 configs/env.production  → 后端运行时配置 + Docker Compose 服务配置
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
   └── 在服务器上 source configs/env.production 后启动容器
```

---

## 五、首次部署检查清单

- [ ] GitHub Secrets 中配置了 `SERVER_HOST`、`SERVER_USER`、`SERVER_SSH_KEY`
- [ ] GitHub Variables 中配置了 `VITE_AI_PROVIDER`、`VITE_AI_MODEL`、`VITE_AI_BASE_URL`、`VITE_AI_ENABLED`（或使用默认值）
- [ ] 服务器 `$DEPLOY_PATH/configs/env.production` 已创建并填写了所有必要配置
- [ ] 服务器 `$DEPLOY_PATH/configs/env.production` 中的 `AI_API_KEY` 已填写
- [ ] SSL 证书已放置到 `$DEPLOY_PATH/infra/ssl/` 目录
- [ ] 首次部署后执行 `docker exec <api容器> npx prisma db seed` 初始化管理员账号
