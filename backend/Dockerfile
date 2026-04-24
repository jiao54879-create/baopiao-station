FROM node:20-alpine

WORKDIR /app

# 安装依赖（包括 devDependencies 用于编译）
COPY package*.json ./
RUN npm ci

# 复制代码
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./

# 生成 Prisma 客户端
RUN npx prisma generate

# 编译 TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动命令：先执行数据库迁移，再启动服务
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
