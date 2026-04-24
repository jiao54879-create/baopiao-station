FROM node:20-slim

WORKDIR /app

# 复制后端代码
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# 复制全部代码
COPY backend/ .

# 预生成 Prisma Client
RUN npx prisma generate

# 数据库迁移
RUN npx prisma migrate deploy || true

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]
