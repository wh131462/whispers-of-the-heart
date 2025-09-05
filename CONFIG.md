# 环境配置说明

## 配置文件位置

- 开发环境: `configs/env.development`
- 生产环境: `configs/env.production`

## 主要配置项

### 应用URL配置

```bash
# 应用配置
WEB_URL=http://localhost:8888          # Web前端地址
API_URL=http://localhost:7777          # API服务地址
ADMIN_URL=http://localhost:9999        # Admin后台地址
```

### 端口配置

```bash
# 端口配置
API_PORT=7777                          # API服务端口
WEB_PORT=8888                          # Web前端端口
ADMIN_PORT=9999                        # Admin后台端口
```

### CORS配置

```bash
# 安全配置
CORS_ORIGINS=http://localhost:8888,http://localhost:9999
```

## 环境变量使用

### 前端项目 (Web & Admin)

前端项目通过 `import.meta.env` 访问环境变量：

```typescript
// 开发环境
if (import.meta.env.DEV) {
  return 'http://localhost:7777'
}
// 生产环境
return import.meta.env.VITE_API_URL || 'https://api.whispers.local'
```

### 后端项目 (API)

后端项目通过 `process.env` 访问环境变量：

```typescript
const apiUrl = process.env.API_URL || 'http://localhost:7777'
```

## 不同环境配置

### 开发环境

- Web前端: http://localhost:8888
- Admin后台: http://localhost:9999
- API服务: http://localhost:7777

### 生产环境

- Web前端: https://whispers.local
- Admin后台: https://admin.whispers.local
- API服务: https://api.whispers.local

## 启动方式

### 开发环境

```bash
./start-blog-system.sh
```

### 生产环境

```bash
# 使用生产环境配置
export $(cat configs/env.production | xargs)
./start-blog-system.sh
```

## 配置验证

使用测试脚本验证配置：

```bash
./test-blog-system.sh
```
