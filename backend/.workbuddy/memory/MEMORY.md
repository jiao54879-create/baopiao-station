# 项目长期记忆

## 架构决策
- **Prisma 导入**：prisma 客户端独立在 `src/lib/prisma.ts`，所有文件从此模块导入，禁止从 `index.ts` 导入（会触发 Express 服务器启动导致端口冲突）

## 持续性问题
- 银保监会（cbirc.gov.cn）DNS 持续解析失败
- 小红书 API 全量 404，接口已封禁，需使用 AutoCLI 替代方案
- 多个保险官网页面变更返回 404
- 科技/社会热点源大面积不可用（IT之家、AI产品、微博、知乎）

## 技术栈
- 后端：Express + Prisma ORM + Neon PostgreSQL
- 部署：Railway
- 爬虫：axios + cheerio，定时任务 node-cron
