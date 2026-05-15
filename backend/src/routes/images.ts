import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// 预设背景色
const BG_PRESETS = {
  pink: '#FFF5F5',
  cream: '#FFF8F0',
  blue: '#F0F5FF',
  green: '#F0FFF4',
  purple: '#F5F0FF',
  yellow: '#FFFFF0',
};

// POST /api/images/auto-markup - AI自动标注内容重点
router.post('/auto-markup', async (req, res) => {
  try {
    const { title, content: noteContent } = req.body;
    
    if (!title || !noteContent) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: 'AI 服务未配置' });
    }

    const deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseURL: 'https://api.deepseek.com',
    });

    const prompt = `你是一个小红书保险笔记内容标注专家。请为以下笔记内容添加视觉重点标注，让生成图片时重点突出。

## 标注语法
- **重点文字** → 黄色高亮涂抹（用于核心观点、关键数字、重要结论）
- *强调文字* → 红色变色（用于警示、坑点、需要注意的地方）
- __下划线文字__ → 加下划线（用于补充说明、专业术语）

## 标注原则
1. 每段只标注1-2个最关键的重点，不要过度标注
2. 数字、金额、年龄等具体数据用 **高亮**
3. 坑点、风险、警示用 *换色*
4. 专业术语用 __下划线__
5. 只返回标注后的内容，不要添加任何解释

## 标题
${title}

## 正文
${noteContent}`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    });

    const markedContent = response.choices[0]?.message?.content || noteContent;
    
    res.json({
      success: true,
      content: markedContent
    });
  } catch (error) {
    console.error('AI自动标注失败:', error);
    res.status(500).json({ 
      error: '标注失败',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/images/presets - 获取预设颜色
router.get('/presets', (req, res) => {
  res.json({
    success: true,
    bgColors: [
      { key: 'pink', label: '淡粉', value: BG_PRESETS.pink },
      { key: 'cream', label: '米白', value: BG_PRESETS.cream },
      { key: 'blue', label: '淡蓝', value: BG_PRESETS.blue },
      { key: 'green', label: '淡绿', value: BG_PRESETS.green },
      { key: 'purple', label: '淡紫', value: BG_PRESETS.purple },
      { key: 'yellow', label: '淡黄', value: BG_PRESETS.yellow },
    ],
    accentColors: [
      { key: 'red', label: '红色', value: '#FF4757' },
      { key: 'pink', label: '粉色', value: '#FF6B9D' },
      { key: 'orange', label: '橙色', value: '#FF9F43' },
      { key: 'blue', label: '蓝色', value: '#3498DB' },
      { key: 'green', label: '绿色', value: '#2ECC71' },
      { key: 'purple', label: '紫色', value: '#9B59B6' },
    ]
  });
});

export default router;
