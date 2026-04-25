# Frontend Dockerfile - 从仓库根目录构建，Build Context = 仓库根目录
FROM node:18-alpine AS builder
WORKDIR /app

# 复制前端依赖文件
COPY frontend/package*.json ./
RUN npm ci

# 复制前端源码
COPY frontend/ .

# 构建前端
RUN npm run build

# 生产阶段：nginx 托管静态文件
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
