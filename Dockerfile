FROM node:20-slim

# 安装 OpenSSL (Prisma 需要)
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制后端代码
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# 复制全部代码
COPY backend/ .

# 生成 Prisma Client
RUN npx prisma generate

EXPOSE 3001

# 启动时：先删除旧表，再运行迁移，最后启动服务
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/index.ts"]
