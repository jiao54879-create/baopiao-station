# Frontend Dockerfile - Build Context = repo root
FROM node:18-alpine AS builder
WORKDIR /app

# 从仓库根目录复制 frontend/ 下的文件
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
