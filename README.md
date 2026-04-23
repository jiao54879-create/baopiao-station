# 🔥 爆款情报站

> 保险内容创作者一站式平台 - 信息聚合 + 爆款标题工厂

## ✨ 功能特性

### 📊 情报中心
- 多行业热点聚合（保险、金融、教育、科技、社会热点）
- 定时自动采集，实时更新
- 智能标签分类，高亮紧急情报

### 🔥 爆款案例库
- 小红书、公众号、抖音等平台爆款追踪
- AI 爆款分析，拆解爆款规律
- 按平台、险种智能筛选

### ✍️ 标题生成器
- Claude AI 驱动，批量生成爆款标题
- 多类型支持（震惊体、数字体、故事体等）
- AI 评分预测，一键复制

### 👥 团队协作
- 邀请成员，权限管理
- 团队收藏夹，共享资源
- 活动日志，追踪使用

### 📈 数据看板
- 情报/案例/用户统计
- 热门关键词、分类分析
- 每日摘要自动推送

### 🔔 通知推送
- 飞书群通知
- 邮件日报推送

## 🛠️ 技术栈

### 后端
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Claude AI API

### 前端
- React 18
- TypeScript
- Ant Design 5
- TailwindCSS
- Zustand

### 部署
- Docker + Docker Compose
- 支持本地一键启动

## 🚀 快速开始

### 环境要求
- Docker Desktop (macOS/Windows)
- 或 Node.js 18+ / Python 3.9+

### 一键启动（推荐）

```bash
# 克隆项目
cd insurance-content-station

# 复制配置
cp backend/.env.example backend/.env

# 编辑 .env，填入 Claude API Key
# ANTHROPIC_API_KEY=sk-ant-xxxxx

# 启动服务
cd docker
docker-compose up -d

# 访问 http://localhost:3000
```

### 本地开发

```bash
# 后端
cd backend
npm install
npm run dev

# 前端（新终端）
cd frontend
npm install
npm run dev
```

## 📁 项目结构

```
insurance-content-station/
├── backend/                    # 后端服务
│   ├── prisma/
│   │   └── schema.prisma     # 数据库 Schema
│   ├── src/
│   │   ├── routes/           # API 路由
│   │   │   ├── auth.ts       # 认证
│   │   │   ├── users.ts       # 用户
│   │   │   ├── intelligence.ts # 情报
│   │   │   ├── cases.ts       # 案例
│   │   │   ├── generator.ts   # 生成器
│   │   │   ├── teams.ts       # 团队
│   │   │   └── stats.ts       # 统计
│   │   ├── services/          # 业务服务
│   │   │   ├── claude.ts      # Claude AI
│   │   │   ├── notification.ts # 通知
│   │   │   └── report.ts      # 报表
│   │   ├── scrapers/          # 数据采集
│   │   │   ├── base.ts        # 爬虫基类
│   │   │   ├── cbirc.ts       # 银保监会
│   │   │   ├── social.ts       # 社会热点
│   │   │   ├── tech.ts         # 科技热点
│   │   │   ├── xiaohongshu.ts  # 小红书
│   │   │   └── scheduler.ts    # 调度器
│   │   ├── middleware/         # 中间件
│   │   └── index.ts           # 入口
│   └── package.json
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   ├── components/        # 通用组件
│   │   ├── store/            # 状态管理
│   │   └── utils/            # 工具函数
│   └── package.json
└── docker/                    # Docker 配置
    └── docker-compose.yml
```

## 📡 API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录

### 情报
- `GET /api/intelligence` - 获取情报列表
- `GET /api/intelligence/hot` - 获取热门情报
- `POST /api/intelligence` - 创建情报

### 案例
- `GET /api/cases` - 获取爆款案例
- `POST /api/cases/generate` - AI 生成标题
- `POST /api/cases/analyze` - AI 分析案例

### 统计
- `GET /api/stats/dashboard` - 获取统计数据

## 🔧 配置说明

### 环境变量 (.env)

```env
# 应用配置
NODE_ENV=development
PORT=3001

# 数据库
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/baopiang

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# Claude AI
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 飞书通知（可选）
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxx

# 邮件配置（可选）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

## 📝 数据采集任务

| 任务 | 频率 | 说明 |
|------|------|------|
| 银保监会动态 | 每30分钟 | 政策法规、监管动态 |
| 保险行业资讯 | 每15分钟 | 行业新闻、公司公告 |
| 社会热点 | 每10分钟 | 微博热搜、知乎热榜等 |
| 科技热点 | 每30分钟 | 36氪、虎嗅、IT之家 |
| 小红书爆款 | 每小时 | 保险相关爆款笔记 |
| 金融动态 | 每20分钟 | 股市、财经新闻 |
| 教育动态 | 每小时 | 教育部、培训机构 |

## 🎯 后续开发计划

- [ ] 小程序版本
- [ ] 更多平台数据源接入
- [ ] 高级数据分析
- [ ] API 开放平台

## 📄 License

MIT
