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

# 启动时强制同步数据库（重建所有表）
CMD ["sh", "-c", "npx prisma db push --force-reset --skip-generate && npx tsx src/index.ts"]
