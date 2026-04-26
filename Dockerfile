FROM node:20-slim

# 安装 OpenSSL 和 psql (Prisma 和数据库操作需要)
RUN apt-get update && apt-get install -y openssl libssl-dev postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制后端代码
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# 复制全部代码（包括 migrations）
COPY backend/ .

# 生成 Prisma Client
RUN npx prisma generate

EXPOSE 3001

# 启动时：先用 psql 清空数据库，再运行迁移
CMD ["sh", "-c", "PGPASSWORD=${DATABASE_PASSWORD} psql -h ${DATABASE_HOST} -U ${DATABASE_USER} -d ${DATABASE_NAME} -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;' && npx prisma migrate deploy && npx tsx src/index.ts"]
