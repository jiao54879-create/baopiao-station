FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制代码
COPY prisma ./prisma
COPY src ./src

# 生成 Prisma 客户端
RUN npx prisma generate

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["sh", "-c", "npx prisma db push && npm start"]
