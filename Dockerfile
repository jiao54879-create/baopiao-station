FROM node:20-slim

# 安装 OpenSSL (Prisma 需要)
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ===== 构建前端 =====
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci

COPY frontend/ .
ENV VITE_API_URL=""
RUN npm run build

# ===== 构建后端 =====
WORKDIR /app
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm cache clean --force && npm install

# Force full rebuild - bust all COPY cache - 2026-05-20-v14
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
