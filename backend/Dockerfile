FROM node:20-alpine

WORKDIR /app

# 安装所有依赖（包括 devDependencies，因为 tsx 需要）
COPY package*.json ./
RUN npm ci

# 复制代码
COPY prisma ./prisma
COPY src ./src

# 生成 Prisma 客户端
RUN npx prisma generate

# 暴露端口
EXPOSE 3001

# 使用 tsx 直接运行 TypeScript（跳过编译步骤）
CMD ["npx", "tsx", "src/index.ts"]
