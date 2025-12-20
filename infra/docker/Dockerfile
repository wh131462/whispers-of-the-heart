# 前端构建镜像
# 多阶段构建：构建阶段 + 生产阶段

# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/hooks/package.json ./packages/hooks/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建前端应用
RUN pnpm --filter=web build

# 生产阶段
FROM nginx:alpine AS production

# 复制构建产物到 Nginx 目录
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY infra/docker/nginx.conf /etc/nginx/nginx.conf
COPY infra/docker/default.conf /etc/nginx/conf.d/default.conf

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
