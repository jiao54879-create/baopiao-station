# 爆款情报站 - 部署指南

## 方案：Vercel（前端）+ Railway（后端）

### 第一步：准备账号

1. **Railway** - 注册 https://railway.app （用 GitHub 登录）
2. **Vercel** - 注册 https://vercel.com （用 GitHub 登录）
3. **GitHub** - 创建账号 https://github.com 并创建空仓库

### 第二步：上传代码到 GitHub

```bash
cd /Users/xubing/WorkBuddy/20260422094347/.workbuddy/insurance-content-station

# 初始化 Git
git init
git add .
git commit -m "爆款情报站 v1.0"

# 添加远程仓库（替换为你的 GitHub 仓库地址）
git remote add origin https://github.com/你的用户名/insurance-content-station.git
git branch -M main
git push -u origin main
```

### 第三步：部署后端（Railway）

1. 登录 Railway，点击 "New Project" → "Deploy from GitHub repo"
2. 选择你的仓库
3. Railway 会自动检测 Node.js 项目
4. **添加环境变量**（在项目 Settings → Variables）：
   ```
   DATABASE_URL = postgresql://...  # Railway 会自动创建 PostgreSQL
   PORT = 3001
   NODE_ENV = production
   JWT_SECRET = 随机字符串（用 https://randomkeygen.com 生成）
   ANTHROPIC_API_KEY = sk-ant-your-key-here
   ```
5. Railway 会自动：
   - 安装依赖
   - 运行 Prisma 迁移
   - 启动服务
6. 部署完成后，Railway 会给你一个 URL：`https://xxx.railway.app`

### 第四步：部署前端（Vercel）

1. 登录 Vercel，点击 "Add New" → "Project"
2. 选择 "Import Git Repository"，选择你的仓库
3. 配置项目：
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **添加环境变量**（在项目 Settings → Environment Variables）：
   ```
   VITE_API_URL = https://xxx.railway.app/api
   ```
5. 点击 "Deploy"

### 第五步：配置完成

部署成功后：
- 前端地址：`https://your-project.vercel.app`
- 后端 API：`https://xxx.railway.app/api`

### 常见问题

**Q: Railway 找不到 Prisma？**
A: 在 Railway 项目的 Start Command 中填入：
```
sh -c "npx prisma db push && npm start"
```

**Q: 数据库连接失败？**
A: Railway PostgreSQL 的 DATABASE_URL 格式：
```
postgresql://postgres:password@host.railway.tech:5432/railway
```

**Q: 免费额度够用吗？**
A: Railway 免费额度：
- 500小时/月（足够个人使用）
- 1GB PostgreSQL
- 休眠后自动唤醒
