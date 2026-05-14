// 笔记创作API - 从零创作保险笔记
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import OpenAI from 'openai';

const router = Router();

// 内容结构配置 - 爆款内容写作模板
const contentStructures = {
  strategy: {
    label: '思路类',
    promptHint: `重点讲解该人群的保险配置思路：该买什么、不该买什么、预算怎么分配、优先级怎么排。
    参考爆款结构：
    - 震撼开头：先用一句话抓人，如"大佬们买保险的思路太震撼了"或"卖了几年保险，我想说点搜不到的"
    - 按人群分块：每个人群3-4个保险推荐，每个推荐带价格参考
    - 条列清晰：用1/2/3数字编号，每个观点独立成段
    - 温暖收尾：引导互动，"有不懂的问我"`,
    examples: [
      '《绝对是细糠！大佬们买保险的思路太震撼了》',
      '《卖了几年宝宝险，我想说点小红书上搜不到的》'
    ]
  },
  pitfall: {
    label: '避坑类',
    promptHint: `重点揭露保险信息差和坑点，参考爆款结构：
    - 身份背书开头：如"8年保险人大实话"、"和儿科医生聊完1小时"
    - 按险种分块：医疗险/重疾险/意外险等
    - 每块先列坑(⭕)再给正确做法(✅)：对比强烈，坑点用emoji标记
    - 简洁有力：每个观点一句话，独立成段
    - CTA引导："有问题的评论区见"`,
    examples: [
      '《8年保险人大实话！普通家庭真没必要买保险》',
      '《和儿科医生聊完1小时，我把宝宝保险全换了》'
    ]
  },
  product: {
    label: '产品类',
    promptHint: `重点做产品测评对比，参考结构：
    - 产品测评开头：用数据或对比抓眼球
    - 保障内容拆解：表格或条列形式
    - 价格对比：突出性价比
    - 优缺点分析：客观专业
    - 适合人群总结
    - 购买建议+CTA`,
    examples: ['产品横向对比类笔记']
  },
  demand: {
    label: '需求激发类',
    promptHint: `重点激发保险需求，参考结构：
    - 场景引入：如真实就医场景、经济压力场景
    - 用真实案例/数据唤醒风险意识
    - 不硬推销，而是让读者自己产生"我需要"的念头
    - 结尾给一个低门槛的行动入口`,
    examples: ['风险意识激发类笔记']
  }
};

// 大佬锚点配置
const masterConfigs: Record<string, { name: string; languageDNA: any }> = {
  // 走心唠嗑风
  mimeng: {
    name: '咪蒙模式',
    languageDNA: {
      opener: '自黑/自嘲式开头，"我承认我……"或"我以前也觉得……"',
      sentencePattern: '5-15字一句，短句密集轰炸，一句话独立成段',
      emotion: '情绪饱满贯穿全文，适当用"靠""妈蛋"增加真实感',
      structure: '自黑开场→故事代入→金句收尾',
      ending: '一句扎心金句收尾，让人忍不住截图'
    }
  },
  houcuicui: {
    name: '侯翠翠模式',
    languageDNA: {
      opener: '"我跟你讲""你知道吗"闺蜜八卦式',
      sentencePattern: '碎碎念式，想到哪说到哪，但逻辑暗线清晰',
      emotion: '抱怨中带真实感，反焦虑治愈系，吐槽但不丧',
      structure: '日常琐事切入→吐槽→突然给个温暖的结论',
      ending: '温暖的鼓励或自我和解'
    }
  },
  leijun: {
    name: '雷军模式',
    languageDNA: {
      opener: '直接亮数据或事实，"说实话""跟你们讲"',
      sentencePattern: '大白话，像隔壁大哥聊天，偶尔冒出一句金句',
      emotion: '真诚不装，偶尔自嘲"Are you OK"式',
      structure: '抛问题→讲真实经历→给朴素建议',
      ending: '朴实但有力，"这事儿就这么简单"'
    }
  },
  // 干货避坑风
  banfo: {
    name: '半佛仙人模式',
    languageDNA: {
      opener: '颠覆性结论开头，"你以为的XXX全是错的"',
      sentencePattern: '一句话一段，类现代诗格式，快节奏',
      emotion: '冷静理性中带讽刺，"前方有坑绕行"的举牌人',
      structure: '颠覆结论→极端案例→拆解底层逻辑→给可操作建议',
      ending: '三步自救法，可操作'
    }
  },
  zhangxuefeng: {
    name: '张雪峰模式',
    languageDNA: {
      opener: '极端判断抓注意，"千万别""一定不要"',
      sentencePattern: '干货+段子，单口相声节奏，东北味幽默',
      emotion: '激昂亢奋，为普通人着急，"急"是核心情绪',
      structure: '制造焦虑→给具体方案→用数据打脸',
      ending: '扎心金句+行动指令'
    }
  },
  kazike: {
    name: '卡兹克模式',
    languageDNA: {
      opener: '从真实体验切入，不用宏大叙事',
      sentencePattern: '平实直接，拒绝套话，Slogan式干货',
      emotion: '冷静客观但有态度，自嘲幽默',
      structure: '体验/观察→数据支撑→一句话结论→扩展解释',
      ending: '一句话核心总结'
    }
  },
  // 反转打脸风
  baguamangguo: {
    name: '八卦芒果模式',
    languageDNA: {
      opener: '"嘿我跟你说个事"，八卦式切入',
      sentencePattern: '先站队→讲故事→突然反转，和观众站同一条战线',
      emotion: '共同吐槽→认知颠覆→恍然大悟',
      structure: '制造共同敌人→统一战线→用事实打脸→给出新认知',
      ending: '反常识的新结论，让人"啊？是这样？"'
    }
  },
  'mimeng-slap': {
    name: '咪蒙打脸模式',
    languageDNA: {
      opener: '先承认普遍想法，"很多人觉得……"',
      sentencePattern: '一句话打脸→展开论证→金句锤死',
      emotion: '从温和到激烈，"如果善良是纵容，我愿意一辈子歹毒"',
      structure: '承认普遍观点→一句话颠覆→案例论证→给行动方案',
      ending: '态度鲜明的立场宣言'
    }
  },
  'banfo-twist': {
    name: '半佛反转模式',
    languageDNA: {
      opener: '直接抛颠覆性结论',
      sentencePattern: '前15秒结论→1-3分钟极端案例→3-5分钟拆解逻辑',
      emotion: '冷静拆解中的暴击，"你以为你在XXX，其实你在YYY"',
      structure: '颠覆结论→极端案例轰炸→拆解底层逻辑→可操作建议',
      ending: '行动指南，三步自救'
    }
  },
  // 焦虑共鸣风
  'zhangxuefeng-anxiety': {
    name: '张雪峰焦虑模式',
    languageDNA: {
      opener: '用具体数字/场景制造紧迫感',
      sentencePattern: '先扎心→给路，短句密集',
      emotion: '为普通人着急，"急"是核心情绪，但底层是关心',
      structure: '制造焦虑场景→用数据佐证→给具体出路',
      ending: '具体行动指令，"现在就做XXX"'
    }
  },
  baolocaomei: {
    name: '暴躁草莓模式',
    languageDNA: {
      opener: '抱怨/吐槽真实困境，"烦死了""好崩溃"',
      sentencePattern: '吐槽押韵，魔性文案，把痛苦写成段子',
      emotion: '先暴露脆弱→在抱怨中坚持→最终没有放弃',
      structure: '暴露困境→吐槽发泄→找到方法→继续前行',
      ending: '不鸡汤但温暖的和解'
    }
  },
  'mimeng-resonate': {
    name: '咪蒙共鸣模式',
    languageDNA: {
      opener: '戳中一个隐秘痛点，"你是不是也……"',
      sentencePattern: '排比+反问增强情绪，短句为主',
      emotion: '先共情→再愤怒→然后给力量',
      structure: '戳痛点→引发共鸣→站在你这边→给行动力量',
      ending: '有力的立场宣言'
    }
  },
  // 数据震撼风
  'kazike-data': {
    name: '卡兹克数据模式',
    languageDNA: {
      opener: '一个让人震惊的数据/事实',
      sentencePattern: 'Slogan式一句话结论→数据支撑→扩展',
      emotion: '冷静中有冲击，自嘲但不减说服力',
      structure: '数据结论→对比数据→推导结论→一句话总结',
      ending: '压缩成一句话的核心信息'
    }
  },
  'banfo-data': {
    name: '半佛数据模式',
    languageDNA: {
      opener: '一串数字直接砸脸',
      sentencePattern: '每个观点三个信源，高信息密度',
      emotion: '冷静理性，用数据说话不带情绪',
      structure: '数据呈现→异常点分析→风险拆解→建议',
      ending: '事实风控+可验证的建议'
    }
  },
  'zhangxuefeng-data': {
    name: '张雪峰数据模式',
    languageDNA: {
      opener: '极端数据制造冲击',
      sentencePattern: '数据+金句配合，"80%都没干本行！"',
      emotion: '亢奋激昂，用数据撕破幻想',
      structure: '震撼数据→解释背后逻辑→给现实建议',
      ending: '扎心数据+行动指令'
    }
  },
  'no-imitation': {
    name: '不模仿，自由发挥',
    languageDNA: {
      opener: '自然开场，用最适合内容的方式切入',
      sentencePattern: '灵活多样，根据主题自然调整',
      emotion: '真实自然，不做作不刻意',
      structure: '根据内容主题选择最合适的结构',
      ending: '自然收尾，留下余味'
    }
  }
};

// 创建笔记验证Schema
const CreationSchema = z.object({
  topic: z.string().min(1, '请输入选题/主题').max(100),
  structure: z.enum(['strategy', 'pitfall', 'product', 'demand']).optional(),
  structureSub: z.string().optional(),
  style: z.enum(['hearth', 'practical', 'twist', 'anxiety', 'data']),
  master: z.string(),
  customStyleDesc: z.string().optional(),
  reference: z.string().optional()
});

// 创作笔记内容
async function createNoteContent(
  topic: string,
  style: string,
  master: string,
  structure?: string,
  structureSub?: string,
  customStyleDesc?: string,
  reference?: string
): Promise<{ title: string; content: string; tags: string[]; callToAction?: string }> {
  const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: 'https://api.deepseek.com',
  });

  // 获取大佬语言DNA
  let masterInfo = masterConfigs[master];
  if (!masterInfo) {
    masterInfo = masterConfigs['no-imitation'];
  }

  // 构建语言DNA
  let languageDNA = masterInfo.languageDNA;
  if (master === 'custom-imitation' && customStyleDesc) {
    languageDNA = {
      opener: `用"${customStyleDesc}"描述的风格开场`,
      sentencePattern: `用"${customStyleDesc}"描述的风格调整句式`,
      emotion: `用"${customStyleDesc}"描述的风格调整情绪`,
      structure: `用"${customStyleDesc}"描述的风格调整结构`,
      ending: `用"${customStyleDesc}"描述的风格收尾`
    };
  }

  // 获取内容结构提示
  let structureHint = '';
  if (structure && contentStructures[structure as keyof typeof contentStructures]) {
    const structInfo = contentStructures[structure as keyof typeof contentStructures];
    structureHint = `\n\n## 内容类型：${structInfo.label}\n${structInfo.promptHint}`;
    
    if (structureSub) {
      structureHint += `\n具体方向：${structureSub}`;
    }
  }

  // 参考素材提示
  const referenceHint = reference ? `\n\n## 参考素材\n用户提供的素材：\n${reference}` : '';

  // 爆款写作模板
  const viralTemplate = `
## 爆款保险笔记写作模板（已验证有效结构）

### 模板1：避坑类（⭕坑点 + ✅正确做法）
开头：身份背书/震撼数字/反转结论
正文：
【XX险】
⭕ 坑点1：xxx
✅ 正确做法：xxx
⭕ 坑点2：xxx
✅ 正确做法：xxx

结尾：引导互动 + 表明可咨询

### 模板2：思路类（人群划分）
开头：震撼数字/大佬背书
正文：
【人群1】
- 推荐1：xxx（价格参考）
- 推荐2：xxx（价格参考）

【人群2】
...

结尾：互动引导 + CTA

### 模板3：个人经历类
开头：个人真实经历，建立信任
正文：
- 观点1（简短有力）
- 观点2（简短有力）
- 观点3（简短有力）

结尾：温暖鼓励 + 咨询引导

### 通用爆款要素
1. 开头3秒抓人：身份背书/震撼数字/反转结论/场景代入
2. 独立成段：一句话一段，不要长段落
3. 避坑类用⭕/✅对比，思路类用1/2/3条列
4. 全文emoji点缀，增加可读性
5. 结尾CTA：引导互动 + 表明可咨询`;

  const prompt = `你是一个深谙小红书流量密码的保险赛道内容创作者。

## 写作风格：大佬锚点 - ${masterInfo.name}
${master === 'custom-imitation' && customStyleDesc ? `（自定义风格：${customStyleDesc}）` : ''}
${master !== 'no-imitation' ? '请严格按照以下语言DNA写作：' : ''}

【开场方式】
${languageDNA.opener}

【句式特征】
${languageDNA.sentencePattern}

【情绪基调】
${languageDNA.emotion}

【文章结构】
${languageDNA.structure}

【收尾方式】
${languageDNA.ending}
${structureHint}${referenceHint}

## 选题要求
请围绕"${topic}"创作一篇小红书保险笔记。

## 爆款写作模板参考
${viralTemplate}

## 严格要求
1. 标题：≤20字，要有爆款感，像真人发的
2. 正文：500-800字，符合小红书排版风格
3. 标签：生成3-5个小红书热门标签（格式：#标签名）
4. 全文要用emoji增加可读性
5. 正文要分段，每段不要太长，一句话一段为佳
6. 保险相关内容要专业但易懂
7. 参考爆款模板结构组织文章
8. 严格遵循上述语言DNA的每个维度
9. ${structureHint ? '严格按照内容结构要求来组织文章' : '灵活组织文章结构'}
10. 结尾要有互动引导（问问题/评论区见）+ CTA（有问题找我/可以问我）

## 输出格式
请直接输出纯JSON，不要用markdown代码块包裹，不要加\`\`\`json或\`\`\`：
{
  "title": "新标题（≤20字）",
  "content": "正文内容（500-800字，含emoji和分段）",
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
  "callToAction": "互动引导语（引导评论+表明可咨询）",
  "usageTip": "创作亮点说明"
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
    throw new AppError('AI 服务调用失败: ' + (error?.message || '未知错误'), 500);
  }

  const responseText = response.choices[0]?.message?.content || '';

  // 解析JSON响应
  let jsonStr = responseText.trim();
  // 去掉markdown代码块包裹
  while (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').trim();
  }
  while (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.replace(/\n?```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      title: parsed.title || '',
      content: parsed.content || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      callToAction: parsed.callToAction || '',
      usageTip: parsed.usageTip || ''
    };
  } catch (e) {
    // 尝试从文本中提取JSON
    const braceStart = jsonStr.indexOf('{');
    const braceEnd = jsonStr.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
      const extracted = jsonStr.substring(braceStart, braceEnd + 1);
      try {
        const parsed = JSON.parse(extracted);
        return {
          title: parsed.title || '',
          content: parsed.content || '',
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          callToAction: parsed.callToAction || '',
          usageTip: parsed.usageTip || ''
        };
      } catch (e2) {
        console.error('JSON解析失败:', e2);
      }
    }
    console.error('AI返回内容:', responseText);
    throw new AppError('AI 返回格式错误', 500);
  }
}

// POST /api/creation - 创建笔记
router.post('/', async (req, res, next) => {
  try {
    const { topic, structure, structureSub, style, master, customStyleDesc, reference } = CreationSchema.parse(req.body);

    if (!process.env.DEEPSEEK_API_KEY) {
      throw new AppError('AI 服务未配置，请联系管理员配置 DeepSeek API Key', 500);
    }

    // 生成笔记内容
    const result = await createNoteContent(
      topic,
      style,
      master,
      structure,
      structureSub,
      customStyleDesc,
      reference
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
