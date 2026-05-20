// 一键仿写路由（骨架提取两步法版本）
import { Router } from 'express';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { AppError } from '../middleware/errorHandler.js';

// 合规规则（与creation.ts保持一致）
const complianceRules = `
## 🚨 小红书保险笔记合规红线（2026最新）
### 绝对禁用词
- 保本保息/零风险/无风险 → 长期储蓄/稳健增值/现金价值增长
- 银行存款/定期存款/理财 → 年金险/增额终身寿/教育金/养老金
- 避税/避债/资产隔离/遗产税 → 财富规划/资产配置/家庭财务安全
- 抗癌/防癌/治病/报销医药费 → 覆盖医疗费用/减轻经济负担/大病保障
- 保证理赔/100%理赔/理赔最快 → 理赔流程透明/支持协赔/理赔案例分享
- 终身保证续保/无条件续保 → 保证续保20年/续保条件友好
- 秒杀/疯抢/限时停售/最后3天 → 产品即将调整/建议尽早规划/核保政策收紧
- 国家推荐/政府补贴/社保替代 → 社保补充/个人保障/家庭风险转移

### 高风险词
- 最好的/性价比最高/全网第一/销量第一/TOP1 → 我整理的几款/人气很高/口碑不错
- 最便宜/最划算 → 百元级保障/学生党友好/高性价比之选
- 有病治病/无病养老 → 保障+储蓄双重功能/身故返还保费
- 专家推荐/央视推荐 → 很多博主都在推/我自己也买了
- 什么都保/全险/万能险 → 保障全面/覆盖多种风险

### 中风险词
- 最适合/必买/一定要买 → 建议配置/适合XX人群/我认为值得买
- 免费/白嫖/零元购 → 免费咨询/免费测算
- 躺着赚钱/被动收入/财务自由 → 被动现金流/养老补充
- 确诊即赔/立刻赔钱 → 符合条件即可赔付/理赔流程简单
- 收益最高/回报率最高 → 收益稳定/复利增长/长期收益可观

### 绝对不能做
❌ 留联系方式（微信/电话/二维码/私信领资料）
❌ 贬低其他保险公司
❌ 承诺具体收益数字
❌ 谐音/拼音/符号规避（系统精准识别）
❌ 绝对化用语：最佳/最优/最好/最高/顶级/极致/完美/100%/万能/永久/独家/天花板
❌ 医疗用语：治疗/治愈/根治/特效
`;

const router = Router();

const RewriteSchema = z.object({
  url: z.string().url('请输入有效的 URL').optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  style: z.enum(['xhs', 'wechat'], { errorMap: () => ({ message: '风格必须是 xhs 或 wechat' }) }),
  targetTopic: z.string().optional(),
});

// 从 URL 抓取文章内容
async function fetchArticle(url: string): Promise<{ title: string; content: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let html: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new AppError(`无法访问该链接（HTTP ${response.status}），请手动粘贴文章内容`, 400);
    }
    html = await response.text();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err instanceof AppError) throw err;
    if (err.name === 'AbortError') {
      throw new AppError('抓取超时，请手动粘贴文章内容', 400);
    }
    throw new AppError('链接无法访问，请手动粘贴文章内容', 400);
  }

  const $ = cheerio.load(html);

  $('script, style, nav, footer, header, .ad, .ads, .advertisement, #comments, .share, .related').remove();

  let title =
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    '';

  const contentSelectors = [
    'article',
    '.article-content',
    '.post-content',
    '.entry-content',
    '#content',
    '.content',
    'main',
    '.rich_media_content',
    '#js_content',
    '.note-content',
  ];

  let content = '';
  for (const selector of contentSelectors) {
    const el = $(selector);
    if (el.length && el.text().trim().length > 100) {
      content = el.text().trim();
      break;
    }
  }

  if (!content || content.length < 50) {
    content = $('body').text().replace(/\s+/g, ' ').trim();
  }

  content = content.substring(0, 5000);

  if (!content || content.length < 30) {
    throw new AppError('无法提取文章内容，请手动粘贴文章内容', 400);
  }

  return { title: title.substring(0, 200), content };
}

// POST /api/rewrite - 执行仿写
router.post('/', async (req, res, next) => {
  try {
    const { url, title: manualTitle, content: manualContent, style, targetTopic } = RewriteSchema.parse(req.body);

    if (!process.env.DEEPSEEK_API_KEY) {
      throw new AppError('AI 服务未配置，请联系管理员', 500);
    }

    let title = manualTitle || '';
    let content = manualContent || '';

    if (url) {
      if (!content || content.length < 20) {
        const fetched = await fetchArticle(url);
        if (!title) title = fetched.title;
        if (!content) content = fetched.content;
      }
    }

    if (!content || content.length < 20) {
      throw new AppError('请提供文章链接或直接粘贴文章内容', 400);
    }

    const deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseURL: 'https://api.deepseek.com',
    });

    const isXhs = style === 'xhs';
    const crossDomainHint = targetTopic ? `
## 跨领域仿写
原文不是保险领域内容，请将原文的爆款结构、钩子、情绪技巧移植到保险赛道。
目标保险选题：${targetTopic}
` : '';

    const rewritePrompt = `你是一个深谙小红书流量密码的保险赛道内容创作者。

## 任务：两步仿写改写
请严格按照两步执行：
第一步：提取原文的句式骨架（保留结构，替换具体内容为占位符）
第二步：基于骨架填入保险内容

## 原文
标题：${title}
内容：${content}
${crossDomainHint}
${complianceRules}

## 第一步：骨架提取规则
- 标题骨架：保留句式结构、情绪词、连接词，把具体产品名/数字/人群替换为[XX]
  例：原文标题"截图为证，这位姐妹买保险的思路真是清晰"
  → 骨架："[证据]，这位[身份]买保险的思路真是[评价]"
- 正文骨架：逐句提取句式，替换具体内容为占位符
  例：原文"她先给自己配了重疾险，年交3800"
  → 骨架："她先给自己配了[险种]，年交[价格]"
- 骨架示例：
  1. 原文标题"年收入30万的宝妈，保险这么配省了2万" → 骨架："年收入[数字]的[人群]，保险这么配省了[数字]"
  2. 原文标题"和理赔员聊完1小时，我把全家保险换了" → 骨架："和[权威人物]聊完[时长]，我把[范围]保险换了"
  3. 原文正文"第一步：先把百万医疗买了，这个是底线" → 骨架："第一步：先把[险种]买了，这个是[定位]"

## 第二步：骨架填充规则
- 骨架结构不变，只替换占位符
- 填入的内容必须是保险领域相关信息
- 填入的内容要自然流畅，不像模板套出来的
- 每个观点/坑点深入展开3-5句，不要一句话带过

## ${isXhs ? '小红书' : '公众号'}风格要求
${isXhs ? `- emoji点缀增加可读性
- 一句话一段，口语化
- ⭕/✅对比格式
- 互动引导结尾` : `- 专业深度，逻辑清晰
- 段落完整，论述充分
- 数据支撑观点
- 权威感+亲和力平衡`}

## 严格要求
1. 标题≤20字，爆款感，像真人发的
2. 正文1000-1500字
3. 3-5个热门标签
4. 严格遵循合规红线，绝不使用禁用词
5. 必须先提取骨架，再基于骨架生成仿写（不是自由发挥）
6. 每个观点/坑点必须深入展开3-5句，包含是什么→为什么→怎么办
7. 结尾互动引导+CTA
8. 不能留联系方式、不能贬低其他公司、不能承诺收益

## 输出格式
请直接输出纯JSON，不要用markdown代码块：
{
  "style": "${style}",
  "targetTopic": ${targetTopic ? `"${targetTopic}"` : 'null'},
  "skeleton": {
    "title": "标题骨架（含占位符）",
    "titlePlaceholders": ["占位符1说明", "占位符2说明"],
    "content": ["正文骨架句1", "正文骨架句2", "正文骨架句3"],
    "contentPlaceholders": ["占位符1说明", "占位符2说明", "占位符3说明"]
  },
  "originalAnalysis": {
    "topic": "原文选题",
    "coreIdea": "核心观点",
    "structure": "内容结构",
    "styleFeatures": "风格特点",
    "hooks": ["钩子1", "钩子2"]
  },
  "rewrittenContent": {
    "title": "新标题",
    "content": "新正文",
    "hashtags": ["标签1", "标签2", "标签3"],
    "callToAction": "互动引导语"
  },
  "writingNotes": "仿写说明"
}`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: rewritePrompt }],
      temperature: 0.8,
      max_tokens: 4096,
    });

    const responseText = response.choices[0]?.message?.content || '';
    let jsonStr = responseText.trim();
    while (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').trim();
    }
    while (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.replace(/\n?```$/, '').trim();
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      const braceStart = jsonStr.indexOf('{');
      const braceEnd = jsonStr.lastIndexOf('}');
      if (braceStart !== -1 && braceEnd !== -1) {
        result = JSON.parse(jsonStr.substring(braceStart, braceEnd + 1));
      } else {
        throw new AppError('AI 返回格式错误', 500);
      }
    }

    res.json({
      success: true,
      sourceUrl: url || null,
      originalTitle: title,
      targetTopic: targetTopic || null,
      result,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
