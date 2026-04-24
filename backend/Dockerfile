FROM node:20-slim

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制源码
COPY . .

# 预生成 Prisma Client
RUN npx prisma generate

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]
