# Docker 基础设施配置

本项目使用 Docker 和 Docker Compose 来管理整个应用栈，包括前端、后端、数据库和缓存服务。

## 🏗️ 架构概览

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Frontend      │    │   Backend API   │
│   (Port 8080)   │◄──►│   (Port 80)     │◄──►│   (Port 7777)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │     MinIO       │
│   (Port 5432)   │    │   (Port 6379)   │    │  (Port 9000)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

### 启动应用

1. **克隆项目并进入目录**
   ```bash
   cd infra/docker
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，设置必要的环境变量
   ```

3. **启动所有服务**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

   或者手动启动：
   ```bash
   docker-compose up -d
   ```

4. **访问应用**
   - 前端应用: http://localhost
   - 管理后台: http://localhost/admin
   - API 文档: http://localhost:7777/api/v1
   - 数据库管理: http://localhost:8081
   - MinIO 控制台: http://localhost:9001

## 📁 文件结构

```
infra/docker/
├── Dockerfile                 # 前端构建镜像
├── Dockerfile.api            # 后端 API 构建镜像
├── docker-compose.yaml       # Docker Compose 配置
├── nginx.conf                # Nginx 主配置
├── default.conf              # Nginx 站点配置
├── nginx-proxy.conf          # Nginx 反向代理配置
├── nginx-default.conf        # Nginx 反向代理站点配置
├── init-db.sql              # 数据库初始化脚本
├── start.sh                 # 启动脚本
├── .env.example             # 环境变量示例
└── README.md                # 本文档
```

## 🔧 服务配置

### 前端应用 (Web)
- **端口**: 80 (HTTP), 443 (HTTPS)
- **构建**: 多阶段构建，最终使用 Nginx 服务
- **特性**: 支持 React Router 的 SPA 应用

### 后端 API
- **端口**: 7777
- **运行时**: Node.js 18 Alpine
- **特性**: 健康检查、用户隔离、自动重启

### 数据库 (PostgreSQL)
- **端口**: 5432
- **版本**: 15 Alpine
- **特性**: 数据持久化、健康检查、初始化脚本

### 缓存 (Redis)
- **端口**: 6379
- **版本**: 7 Alpine
- **特性**: 密码保护、数据持久化、健康检查

### 对象存储 (MinIO)
- **端口**: 9000 (API), 9001 (控制台)
- **特性**: S3 兼容、Web 控制台、数据持久化

### 反向代理 (Nginx)
- **端口**: 8080 (HTTP), 8443 (HTTPS)
- **特性**: 负载均衡、SSL 终止、限流保护

## 🔒 安全配置

### 网络安全
- 容器间网络隔离
- 自定义网络配置
- 端口映射限制

### 应用安全
- JWT 认证
- 请求限流
- 安全头设置
- CORS 配置

### 数据安全
- 数据库密码保护
- Redis 密码认证
- 文件权限控制

## 📊 监控和日志

### 健康检查
- 所有服务都配置了健康检查
- 自动重启失败的服务
- 健康状态监控

### 日志管理
- 结构化日志格式
- 日志轮转配置
- 错误日志分离

### 性能监控
- 请求限流配置
- 连接池管理
- 缓存策略

## 🛠️ 常用命令

### 服务管理
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]
```

### 数据库操作
```bash
# 进入数据库
docker-compose exec postgres psql -U whispers_user -d whispers_db

# 运行迁移
docker-compose exec api npx prisma migrate deploy

# 生成客户端
docker-compose exec api npx prisma generate

# 重置数据库
docker-compose exec api npx prisma db push --force-reset
```

### 维护操作
```bash
# 清理未使用的资源
docker system prune -a

# 查看资源使用情况
docker stats

# 备份数据库
docker-compose exec postgres pg_dump -U whispers_user whispers_db > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U whispers_user -d whispers_db < backup.sql
```

## 🔧 自定义配置

### 修改端口映射
编辑 `docker-compose.yaml` 文件中的 `ports` 部分：

```yaml
services:
  web:
    ports:
      - "7777:80"  # 将前端端口改为 7777
```

### 添加环境变量
在 `docker-compose.yaml` 的 `environment` 部分添加：

```yaml
services:
  api:
    environment:
      - CUSTOM_VAR=value
```

### 修改 Nginx 配置
编辑相应的 Nginx 配置文件，然后重启服务：

```bash
docker-compose restart web nginx
```

## 🚨 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :80
   
   # 修改 docker-compose.yaml 中的端口映射
   ```

2. **服务启动失败**
   ```bash
   # 查看详细日志
   docker-compose logs [service_name]
   
   # 检查服务状态
   docker-compose ps
   ```

3. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose exec postgres pg_isready -U whispers_user
   
   # 查看数据库日志
   docker-compose logs postgres
   ```

4. **内存不足**
   ```bash
   # 增加 Docker 内存限制
   # 或在 docker-compose.yaml 中添加内存限制
   services:
     api:
       deploy:
         resources:
           limits:
             memory: 1G
   ```

### 性能优化

1. **启用 Docker BuildKit**
   ```bash
   export DOCKER_BUILDKIT=1
   docker-compose build
   ```

2. **使用多阶段构建**
   - 前端和后端都使用多阶段构建
   - 减少最终镜像大小

3. **配置缓存策略**
   - 静态资源长期缓存
   - API 响应适当缓存

## 📚 相关文档

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 配置指南](https://nginx.org/en/docs/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Redis 文档](https://redis.io/documentation)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个 Docker 配置！

## 📄 许可证

本项目采用 MIT 许可证。
