// DeepSeek AI 服务封装（替代 Claude）
import OpenAI from 'openai';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

const TitleOutputSchema = z.object({
  titles: z.array(z.object({
    title: z.string(),
    type: z.string(),
    score: z.number().min(1).max(10),
    explanation: z.string(),
    hashtags: z.array(z.string()),
    selfCriticism: z.string(),
    targetAudience: z.string().optional()  // 精准人群标签，如"宝妈""打工人"等
  }))
});

const TitleArraySchema = z.array(z.object({
  title: z.string(),
  type: z.string(),
  score: z.number().min(1).max(10),
  explanation: z.string(),
  hashtags: z.array(z.string()),
  selfCriticism: z.string(),
  targetAudience: z.string().optional()
}));

const tripleBacktick = '\x60\x60\x60';

/**
 * 从数据库拉取小红书高分爆款标题，作为 Prompt 参考样本
 * 优先取 XHS 平台，点赞 50+ 最近 15 天，最多 8 条
 */
async function fetchViralTitleExamples(keywords: string[]): Promise<string> {
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // 先尝试取最近 15 天 XHS 点赞 50+ 数据
    let cases = await prisma.viralCase.findMany({
      where: {
        platform: 'XHS',
        likesCount: { gte: 50 },
        publishedAt: { gte: fifteenDaysAgo },
        // 排除示例数据
        url: { not: { contains: 'example' } }
      },
      orderBy: { viralScore: 'desc' },
      take: 8,
      select: { title: true, likesCount: true, favoritesCount: true }
    });

    // 如果近 15 天数据不足，放宽到 60 天
    if (cases.length < 4) {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      cases = await prisma.viralCase.findMany({
        where: {
          platform: 'XHS',
          likesCount: { gte: 50 },
          publishedAt: { gte: sixtyDaysAgo },
          url: { not: { contains: 'example' } }
        },
        orderBy: { viralScore: 'desc' },
        take: 8,
        select: { title: true, likesCount: true, favoritesCount: true }
      });
    }

    if (cases.length === 0) return '';

    const exampleList = cases
      .map((c, i) => `${i + 1}. 「${c.title}」（点赞${c.likesCount}，收藏${c.favoritesCount || 0}）`)
      .join('\n');

    return `\n## 🔥 真实爆款参考（数据库中过去15天点赞50+的小红书笔记标题）\n以下是本账号数据库中已验证有流量的真实爆款标题，请仔细学习它们的措辞方式、情绪触点和结构规律，仿照这些风格生成新标题，但内容必须完全原创：\n${exampleList}\n\n【分析维度】：学习上述标题的①关键词选择 ②数字使用 ③情绪触发词 ④结构模式，将这些元素融入新标题。\n`;
  } catch (e) {
    console.log('拉取爆款标题参考失败（忽略）:', e);
    return '';
  }
}

export async function generateTitles(keywords: string[], context?: string): Promise<z.infer<typeof TitleOutputSchema>> {
  let background = '';
  if (context) {
    background = '\n当前背景：' + context + '\n';
  }

  // 动态注入真实爆款参考标题
  const viralExamples = await fetchViralTitleExamples(keywords);

  const prompt = `你是一个深谙小红书流量密码的保险赛道标题黑客。你深知小红书用户的心理：她们不吃恐吓那套，反而对"大佬思路""行业大实话""反套路"这种走心唠嗑风毫无抵抗力。

用户输入的关键词：` + keywords.join(', ') + background + viralExamples + `

## 铁律
1. 标题必须≤20个字（小红书硬性限制）
2. 必须像真人发的朋友圈，不像AI生成的广告
3. 禁止恐吓式标题（"千万别买""后悔死了"已过时）

## 12种爆款风格（每种至少生成1个，共12-15个标题）

### 风格1：大佬思路通透风（最高点击率）
用"大佬""聪明人""内行"制造降维打击感，让用户觉得"我要学他们"
模板句式：
- 大佬买XX的思路，真的太通透了
- 聪明人XX，从来不乱跟风
- 真正懂XX的人，都在悄悄这样买
- 看懂大佬XX逻辑，少花几万冤枉钱
- 我发现大佬买XX思路好清晰啊
- 我发现大佬选XX逻辑好清晰啊
- 我发现大佬避XX坑好清晰啊
- 内行买XX，只抓这3个核心点

### 风格2：行业大实话风（最高信任感）
用"不卖了""退出行业""从业多年"制造内部人爆料感
模板句式：
- 不卖XX了，掏句良心大实话
- 做XX多年，有些真话不敢公开说
- 退出XX行业，说点没人敢讲的真话
- 从业多年，揭开XX不为人知内幕
- 我已经不卖XX，但还想说点大实话
- 干了X年保险，辞职前说句掏心窝的话
- 从保险公司离职，说点没人敢讲的内幕

### 风格3：反套路吐槽风（最高互动率）
直接点破行业套路，让用户觉得"终于有人说真话了"
模板句式：
- 别再瞎买XX，全是隐形大坑
- XX里的信息差，被我扒得明明白白
- 买XX别听业务员画大饼了
- XX水太深，小白千万别盲目入手
- 揭秘保险噱头，都是收割普通人
- XX，就是专门收割普通人的

### 风格4：走心共情风（最高收藏率）
站在普通人立场说话，消除焦虑
模板句式：
- 普通家庭XX，真的不用买太贵
- 给家人XX，记住这几点就够了
- XX避坑，普通人看完少走弯路
- 越精简越靠谱
- 坦白了，很多XX根本没必要买
- 关于XX的套路，劝你越早知道越好

### 风格5：悬念好奇风（最高点击率）
制造信息差缺口，不点不舒服
模板句式：
- 为什么聪明人，从不乱买XX
- XX最大信息差，90%人都不知道
- XX的谎言，终于被拆穿了
- 我悟了，XX根本不用纠结
- 业务员绝不告诉你的XX真相
- 一张表看透XX所有坑点套路

### 风格6：灵魂拷问式（戳中隐性焦虑）
不用陈述句说教，用直击灵魂的问题戳中用户最担心的点
模板句式：
- 你买的XX，真的有用吗？
- 你家的XX，其实都是白花钱
- 花几万买XX，出事能赔多少？
- 你的XX，能报外购药吗？
- XX确诊即赔？纯纯大谎言

### 风格7：极端场景代入式（制造紧迫感）
把用户带入一个极端但真实可能发生的场景
模板句式：
- 如果明天得XX，你的保险够吗？
- 如果突然失业，你的XX能兜底吗？
- 如果住院花10万，XX能报多少？
- 如果老公出事，家里能撑多久？
- 如果明天XX，你的XX能扛住吗？

### 风格8：一句话反常识式（颠覆认知）
直接说一句和大众认知完全相反的话，制造强烈反差
模板句式：
- 先给孩子买XX，是最大的错误
- XX买得越多，反而越不安全
- 大公司的XX，其实更坑人
- 带身故的XX，就是智商税
- XX，其实是最大的误区

### 风格9：精准人群劝退式（命中目标用户）
直接点名某一类人群，告诉他们什么不能买
模板句式：
- 如果你是XX，别买XX
- 如果你是工薪族，别买终身寿险
- 如果你没钱，别碰返还型保险
- 如果你超过40岁，别买XX
- 如果你有房贷，一定要买定期寿险

### 风格10：数字暴击式（具体数字冲击）
用具体、有冲击力的数字对比，突出信息差
模板句式：
- 花1万买的XX，只赔了1000块
- 交了10年保费，退保只退2000
- 同样50万保额，差价能差3倍
- 90%的人，XX都买贵了50%
- XX，80%的情况用不上

### 风格11：亲身踩坑故事式（共情力拉满）
用一个简短的、有结果的亲身故事开头
模板句式：
- 我闺蜜买XX，理赔时被拒了
- 我妈买的XX，10年亏了2万
- 我同事买XX，肠子都悔青了
- 我给娃买XX，白花了5000块
- 我朋友买XX，最后XX了

### 风格12：紧急预警式（紧迫感）
用"注意""警惕""马上"等词，营造紧急氛围
模板句式：
- 注意！这些XX下个月就要涨价
- 警惕！这种XX正在大量拒赔
- 赶紧查！你的XX可能已经失效
- 别买了！这些XX马上要停售
- 提醒！买XX前一定要看这一点

## 12种精准身份选题方向（生成标题时必须考虑，至少3个标题要精准命中目标人群）

1. **宝妈** — 宝妈买XX，XX
2. **打工人/社畜** — 打工人买XX，XX
3. **房贷族** — 有房贷的人，一定要XX
4. **独生子女** — 独生子女买XX，XX
5. **刚毕业** — 刚毕业买XX，XX
6. **理赔过的人** — 理赔过的人，告诉你XX
7. **退保过的人** — 退保亏了X万，我才明白XX
8. **医生/护士** — 医生买XX，只买XX
9. **律师** — 律师买XX，只看XX
10. **自由职业者** — 自由职业者，一定要买XX
11. **单亲妈妈/爸爸** — 单亲妈妈买XX，XX
12. **丁克/单身贵族** — 丁克买XX，和别人不一样

## 5种高转化句式变体（高互动、高收藏）

1. **跟XX聊完 + 全换/全退**
   - 跟医生朋友聊完，把宝宝保险全换了
   - 跟律师聊完，才知道XX要这样买

2. **经历完XX + 全换/全退**
   - 陪妈妈住院后，把医疗险全换了
   - 经历完理赔，我把XX全退了

3. **XX之后 + 只留了XX**
   - 跟医生聊完，宝宝保险我只留了2种
   - 退完保之后，我只留了XX

4. **原来XX + 我把XX全换了**
   - 原来保险这么买，我把旧的全换了
   - 原来XX才是坑，我把XX全换了

5. **听了XX的话 + 我把XX全换了**
   - 听了医生的话，把宝宝保险全换了
   - 听了内行的话，我把XX全换了

## 评分标准（与真实爆款对标）
- 9-10分：能和"我发现大佬买保险思路好清晰"级别的真实爆款掰手腕
- 7-8分：有强烈点击欲，像真人说的
- 5-6分：中规中矩，没有记忆点
- 3-4分：像AI生成的，或像广告
- 1-2分：说明书式，完全不想点

评分重点：新颖度>情绪张力>信息量。一个没数字但走心的标题（如"大佬买保险的思路好通透"）远比一个堆数字但像广告的标题（如"3种保险坑让你亏8万"）更有爆款潜力。

## 禁止清单
- 禁止"今天分享""一起来了解""给大家介绍"式开头
- 禁止纯"科普""攻略""指南"等说明书式用词
- 禁止过度恐吓（"千万别""后悔死了"已审美疲劳）
- 禁止像产品广告
- 禁止超过20字

⚠️ 自我批判：生成后诚实自评，参照真实爆款衡量。

【重要】请直接输出纯JSON，不要用markdown代码块包裹，不要加${tripleBacktick}json或${tripleBacktick}：
{
  "titles": [
    {"title": "标题1", "type": "大佬思路风", "score": 9, "explanation": "说明", "hashtags": ["标签1"], "selfCriticism": "自我批评", "targetAudience": "打工人"}
  ]
}`;

  let response;
  try {
    response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4096,
    });
  } catch (error: any) {
    console.error('DeepSeek API 调用失败:', error?.message || error);
    throw new Error('AI 服务调用失败: ' + (error?.message || '未知错误'));
  }

  const responseText = response.choices[0]?.message?.content || '';
  // 去掉markdown代码块包裹
  let cleanText = responseText.trim();
  // 处理 ```json 或 ``` 开头
  while (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```json
?/i, '').replace(/^```
?/i, '').trim();
  }
  // 处理结尾的 ```
  while (cleanText.endsWith('```')) {
    cleanText = cleanText.replace(/
?```$/, '').trim();
  }

  let jsonStr = cleanText;
  try {
    const parsed = JSON.parse(jsonStr);
    return TitleOutputSchema.parse(parsed);
  } catch (e1: any) {
    console.error('方法1解析失败:', e1.message);
  }

  const braceStart = jsonStr.indexOf('{');
  const braceEnd = jsonStr.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    jsonStr = jsonStr.substring(braceStart, braceEnd + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      return TitleOutputSchema.parse(parsed);
    } catch (e2: any) {
      console.error('方法2解析失败:', e2.message);
    }
  }

  try {
    const parsed = JSON.parse(cleanText);
    if (Array.isArray(parsed)) {
      return { titles: TitleArraySchema.parse(parsed) };
    }
  } catch (e3: any) {
    console.error('方法3解析失败:', e3.message);
  }

  // 方法4：用正则从混乱文本中逐个提取标题对象（即使JSON被截断/重叠也能工作）
  try {
    const titleRegex = /"title"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"([^"]+)"\s*,\s*"score"\s*:\s*(\d+)\s*,\s*"explanation"\s*:\s*"(.+?)"\s*,\s*"hashtags"\s*:\s*\[([^\]]*)\]\s*,\s*"selfCriticism"\s*:\s*"(.+?)"\s*\}/g;
    const extractedTitles: Array<{title: string; type: string; score: number; explanation: string; hashtags: string[]; selfCriticism: string; targetAudience?: string}> = [];
    let match;
    while ((match = titleRegex.exec(cleanText)) !== null) {
      const hashtagsStr = match[5];
      const hashtags = hashtagsStr.split(',').map((h: string) => h.trim().replace(/"/g, '')).filter(Boolean);
      extractedTitles.push({
        title: match[1],
        type: match[2],
        score: parseInt(match[3]),
        explanation: match[4],
        hashtags,
        selfCriticism: match[6]
      });
    }
    if (extractedTitles.length > 0) {
      console.log(`正则提取到 ${extractedTitles.length} 个标题`);
      return TitleOutputSchema.parse({ titles: extractedTitles });
    }
  } catch (e4: any) {
    console.error('方法4正则提取失败:', e4.message);
  }

  console.error('AI 返回内容:', responseText);
  throw new Error('AI 返回格式错误，返回内容: ' + responseText.substring(0, 500));
}

const CaseAnalysisSchema = z.object({
  viralFactors: z.array(z.string()),
  contentStructure: z.object({
    opening: z.string(),
    middle: z.string(),
    ending: z.string()
  }),
  topicAngle: z.string(),
  reusableFormula: z.string(),
  suggestions: z.array(z.string())
});

export async function analyzeViralCase(
  title: string,
  content: string,
  metrics: { likes: number; favorites: number; comments: number }
): Promise<z.infer<typeof CaseAnalysisSchema>> {
  const prompt = `你是一个深谙小红书流量密码的保险赛道内容分析师。请分析以下爆款笔记的爆款原因。

标题：${title}
内容：${content}
点赞：${metrics.likes}
收藏：${metrics.favorites}
评论：${metrics.comments}

请从以下维度分析：
1. 爆款因子（为什么能爆）
2. 内容结构（开头、中间、结尾如何设计）
3. 选题角度（切入角度是否独特）
4. 可复用公式（能否提炼出模板）
5. 改进建议

【重要】请直接输出纯JSON，不要用markdown代码块包裹：
{
  "viralFactors": ["因子1", "因子2"],
  "contentStructure": {"opening": "开头", "middle": "中间", "ending": "结尾"},
  "topicAngle": "选题角度分析",
  "reusableFormula": "可复用公式",
  "suggestions": ["建议1", "建议2"]
}`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2048,
  });

  const responseText = response.choices[0]?.message?.content || '';
  let cleanText = responseText.trim().replace(/^```json
?/i, '').replace(/^```
?/i, '').replace(/
?```$/, '').trim();

  try {
    return CaseAnalysisSchema.parse(JSON.parse(cleanText));
  } catch (e: any) {
    console.error('案例分析解析失败:', e.message, '原始内容:', responseText.substring(0, 500));
    throw new Error('AI 返回格式错误');
  }
}

export { TitleOutputSchema, TitleArraySchema };
