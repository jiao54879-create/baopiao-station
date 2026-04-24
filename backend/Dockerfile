FROM node:20-alpine

# 安装 OpenSSL 1.1（Alpine 默认只有 3.x）
RUN apk add --no-cache openssl1.1

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（包括 Prisma）
RUN npm install

# 复制源码
COPY . .

# 预生成 Prisma Client（针对 linux-musl）
RUN npx prisma generate

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]
