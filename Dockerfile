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

# 预生成 Prisma Client
RUN npx prisma generate

EXPOSE 3001

# 启动时同步数据库 schema
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx src/index.ts"]
