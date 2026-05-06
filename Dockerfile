FROM node:20-slim

# 安装 OpenSSL (Prisma 需要)
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制后端代码
COPY backend/package*.json ./backend/
WORKDIR /app/backend

# 强制重新安装依赖
RUN npm cache clean --force && npm install

# 复制全部代码
COPY backend/ .

# 生成 Prisma Client
RUN npx prisma generate

# 运行数据库迁移
RUN npx prisma migrate deploy || echo "Migration skipped (may already be applied)"

# 运行种子数据（创建管理员）
RUN npx tsx prisma/seed-admin.ts || echo "Seed skipped"

EXPOSE 3001

# 直接运行 TypeScript
CMD ["npx", "tsx", "src/index.ts"]
