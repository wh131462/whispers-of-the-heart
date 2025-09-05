# 🚀 Whispers of the Heart 开发指南

## 📋 项目端口配置

| 项目 | 端口 | 访问地址 | 说明 |
|------|------|----------|------|
| **API** | 7777 | http://localhost:7777 | 后端 NestJS 服务 |
| **Web** | 8888 | http://localhost:8888 | 前端展示应用 |
| **Admin** | 9999 | http://localhost:9999 | 管理后台 |

## 🛠️ 开发命令

### 启动所有项目
```bash
pnpm dev
```

### 分别启动项目
```bash
# 启动后端 API
pnpm dev:api

# 启动前端 Web
pnpm dev:web

# 启动管理后台
pnpm dev:admin
```

### 构建项目
```bash
# 构建所有项目
pnpm build

# 分别构建
pnpm build:api
pnpm build:web
pnpm build:admin
```

### 数据库操作
```bash
# 生成 Prisma 客户端
pnpm db:generate

# 运行数据库迁移
pnpm db:migrate

# 打开 Prisma Studio
pnpm db:studio

# 推送数据库架构
pnpm db:push

# 重置数据库
pnpm db:reset
```

### 包管理
```bash
# 构建所有包
pnpm packages:build

# 开发模式构建包
pnpm packages:dev
```

### Docker 操作
```bash
# 启动 Docker 服务
pnpm docker:up

# 停止 Docker 服务
pnpm docker:down

# 构建 Docker 镜像
pnpm docker:build

# 查看 Docker 日志
pnpm docker:logs
```

## 🔧 快速开始

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **生成 Prisma 客户端**
   ```bash
   pnpm db:generate
   ```

3. **启动开发环境**
   ```bash
   # 启动后端 API
   pnpm dev:api
   
   # 新终端：启动前端 Web
   pnpm dev:web
   
   # 新终端：启动管理后台
   pnpm dev:admin
   ```

4. **访问应用**
   - 前端展示：http://localhost:8888
   - 管理后台：http://localhost:9999
   - 后端 API：http://localhost:7777/api/v1

## 📱 功能特性

### Web 前端
- 文章展示
- 关于我们
- 跳转到管理后台

### 管理后台
- 文章管理
- 评论管理
- 用户管理
- 媒体管理
- **站点配置管理**
  - 基本信息设置
  - SEO 配置
  - OSS 存储配置（本地、阿里云、AWS、七牛）

### 后端 API
- 认证系统（JWT + RefreshToken）
- 用户管理
- 博客管理
- 媒体管理
- 评论管理
- 管理接口
- **站点配置管理**

## 🌐 OSS 存储支持

支持多种云存储服务商：
- **本地存储**：文件保存在服务器本地
- **阿里云 OSS**：阿里云对象存储服务
- **AWS S3**：亚马逊云存储服务
- **七牛云**：七牛云对象存储服务

## 🔍 查看端口信息

```bash
pnpm info
```

## 📝 注意事项

1. 确保端口 7777、8888、9999 未被其他服务占用
2. 首次启动需要运行 `pnpm db:generate`
3. 管理后台的站点配置功能需要先登录
4. 所有项目都支持热重载开发模式
