# 环境配置说明

## 配置文件位置

所有环境配置文件统一存放在 `configs/` 目录：

| 文件 | 说明 |
|------|------|
| `configs/env.example` | 配置模板（已提交到 Git） |
| `configs/env.development` | 开发环境配置 |
| `configs/env.production` | 生产环境配置 |

> 注意：`env.development` 和 `env.production` 已被 `.gitignore` 忽略，不会提交到版本库。

## 配置模板

首次配置时，复制模板文件：

```bash
cp configs/env.example configs/env.development
cp configs/env.example configs/env.production
```

## 主要配置项

### 数据库配置

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/whispers_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=whispers_db
```

### JWT 认证配置

```bash
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=30d
```

### MinIO 对象存储配置

```bash
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=whispers-storage
MINIO_USE_SSL=false
```

### 邮件配置

```bash
MAIL_HOST=smtp.example.com
MAIL_PORT=465
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password
MAIL_FROM=noreply@example.com
```

### 应用 URL 配置

```bash
# 应用配置
APP_NAME=Whispers of the Heart
WEB_URL=http://localhost:8888      # Web 前端地址（含管理后台）
API_URL=http://localhost:7777      # API 服务地址
```

### 端口配置

```bash
API_PORT=7777                      # API 服务端口
WEB_PORT=8888                      # Web 前端端口
```

### Vite 前端环境变量

```bash
VITE_API_URL=http://localhost:7777
VITE_WEB_URL=http://localhost:8888
VITE_WEB_PORT=8888
```

### CORS 配置

```bash
CORS_ORIGINS=http://localhost:8888
```

## 环境变量使用

### 前端项目 (Web)

前端项目通过 `import.meta.env` 访问环境变量：

```typescript
// 开发环境
if (import.meta.env.DEV) {
  return 'http://localhost:7777'
}
// 生产环境
return import.meta.env.VITE_API_URL || 'https://api.131462.wang'
```

### 后端项目 (API)

后端项目通过 `process.env` 访问环境变量：

```typescript
const apiUrl = process.env.API_URL || 'http://localhost:7777'
```

## 不同环境配置

### 开发环境

| 应用 | 地址 |
|------|------|
| Web 前端 | http://localhost:8888 |
| 管理后台 | http://localhost:8888/admin |
| API 服务 | http://localhost:7777 |

### 生产环境

| 应用 | 地址 |
|------|------|
| Web 前端 | https://131462.wang |
| 管理后台 | https://131462.wang/admin |
| API 服务 | https://api.131462.wang |

## 启动方式

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 生产环境

```bash
# 使用 Docker Compose 启动
docker-compose -f docker-compose.prod.yml up -d
```

## 功能开关

```bash
ENABLE_REGISTRATION=true           # 是否开放注册
ENABLE_COMMENTS=true               # 是否开启评论
ENABLE_LIKES=true                  # 是否开启点赞
ENABLE_EMAIL_VERIFICATION=true     # 是否需要邮箱验证
```

## 安全配置

```bash
SESSION_SECRET=your_session_secret
BCRYPT_ROUNDS=12                   # 密码加密轮数
```

## 日志配置

```bash
LOG_LEVEL=info                     # 日志级别：debug, info, warn, error
LOG_FILE=logs/app.log              # 日志文件路径
```
