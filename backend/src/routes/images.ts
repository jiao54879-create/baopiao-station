import { Router } from 'express';
import { chromium } from 'playwright';

const router = Router();

// 预设背景色
const BG_PRESETS = {
  pink: '#FFF5F5',      // 淡粉
  cream: '#FFF8F0',     // 米白
  blue: '#F0F5FF',      // 淡蓝
  green: '#F0FFF4',     // 淡绿
  purple: '#F5F0FF',    // 淡紫
  yellow: '#FFFFF0',    // 淡黄
};

// 解析标记语法：**重点** -> 高亮，*换色* -> 斜体变红，__下划线__ -> 下划线
function parseMarkup(text: string, accentColor: string, highlightColor: string): string {
  // 1. 先处理 **高亮** (优先于其他)
  text = text.replace(/\*\*(.+?)\*\*/g, (_, content) => {
    return `<span style="background:${highlightColor}; padding:4px 8px; border-radius:6px; font-weight:600;">${content}</span>`;
  });
  
  // 2. 处理 *换色*
  text = text.replace(/\*(.+?)\*/g, (_, content) => {
    return `<span style="color:${accentColor}; font-weight:700;">${content}</span>`;
  });
  
  // 3. 处理 __下划线__
  text = text.replace(/__(.+?)__/g, (_, content) => {
    return `<span style="text-decoration:underline; text-decoration-thickness:3px; text-underline-offset:4px;">${content}</span>`;
  });
  
  return text;
}

// 生成首图HTML
function generateCoverHtml(title: string, bgColor: string, accentColor: string, highlightColor: string): string {
  const parsedTitle = parseMarkup(title, accentColor, highlightColor);
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: ${bgColor};
      width: 1080px;
      height: 1440px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 80px;
    }
    .container {
      text-align: center;
      max-width: 900px;
    }
    .title {
      font-size: 76px;
      font-weight: 800;
      color: #333;
      line-height: 1.4;
      letter-spacing: 2px;
      word-break: break-word;
    }
    .watermark {
      position: absolute;
      bottom: 60px;
      font-size: 28px;
      color: #999;
      letter-spacing: 4px;
    }
    .decor-left {
      position: absolute;
      left: 60px;
      top: 60px;
      width: 120px;
      height: 8px;
      background: ${accentColor};
      border-radius: 4px;
    }
    .decor-right {
      position: absolute;
      right: 60px;
      bottom: 60px;
      width: 120px;
      height: 8px;
      background: ${accentColor};
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="decor-left"></div>
  <div class="container">
    <div class="title">${parsedTitle}</div>
  </div>
  <div class="watermark">保险干货 | 关注不迷路</div>
  <div class="decor-right"></div>
</body>
</html>`;
}

// 生成内容图HTML
function generateContentHtml(
  title: string, 
  lines: string[], 
  bgColor: string, 
  accentColor: string, 
  highlightColor: string
): string {
  const parsedTitle = parseMarkup(title, accentColor, highlightColor);
  const parsedLines = lines.map(line => parseMarkup(line, accentColor, highlightColor));
  
  const linesHtml = parsedLines.map((line, index) => {
    const isEmoji = line.match(/^[\u{1F300}-\u{1F9FF}]/u);
    return `<div class="line" style="${isEmoji ? 'margin-bottom: 24px;' : ''}">${line}</div>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: ${bgColor};
      width: 1080px;
      min-height: 1440px;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%);
      padding: 50px 60px;
      text-align: center;
    }
    .header-title {
      font-size: 52px;
      font-weight: 700;
      color: white;
      letter-spacing: 4px;
    }
    .content {
      flex: 1;
      padding: 60px;
    }
    .line {
      font-size: 36px;
      line-height: 1.8;
      color: #333;
      margin-bottom: 16px;
      padding: 20px 30px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    }
    .watermark {
      text-align: center;
      padding: 30px;
      font-size: 24px;
      color: #999;
      letter-spacing: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-title">${parsedTitle}</div>
  </div>
  <div class="content">
    ${linesHtml}
  </div>
  <div class="watermark">保险干货 | 关注不迷路</div>
</body>
</html>`;
}

// POST /api/images/cover - 生成首图
router.post('/cover', async (req, res) => {
  let browser;
  try {
    const { title, bgColor = '#FFF5F5', accentColor = '#FF4757', highlightColor = '#FFE66D' } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: '标题不能为空' });
    }
    
    console.log('生成首图，标题:', title.substring(0, 50));
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1080, height: 1440 });
    
    const html = generateCoverHtml(title, bgColor, accentColor, highlightColor);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    
    const screenshot = await page.screenshot({ type: 'png' });
    const base64 = `data:image/png;base64,${screenshot.toString('base64')}`;
    
    await browser.close();
    
    res.json({
      success: true,
      image: base64
    });
    
  } catch (error) {
    console.error('生成首图失败:', error);
    if (browser) await browser.close();
    res.status(500).json({ 
      error: '生成失败',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /api/images/content - 生成内容图
router.post('/content', async (req, res) => {
  let browser;
  try {
    const { title, lines = [], bgColor = '#FFF5F5', accentColor = '#FF4757', highlightColor = '#FFE66D' } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: '标题不能为空' });
    }
    
    if (lines.length === 0) {
      return res.status(400).json({ error: '内容行不能为空' });
    }
    
    console.log('生成内容图，标题:', title, '行数:', lines.length);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1080, height: 1440 });
    
    const html = generateContentHtml(title, lines, bgColor, accentColor, highlightColor);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    
    const screenshot = await page.screenshot({ type: 'png' });
    const base64 = `data:image/png;base64,${screenshot.toString('base64')}`;
    
    await browser.close();
    
    res.json({
      success: true,
      image: base64
    });
    
  } catch (error) {
    console.error('生成内容图失败:', error);
    if (browser) await browser.close();
    res.status(500).json({ 
      error: '生成失败',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/images/presets - 获取预设
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
    ],
    highlightColors: [
      { key: 'yellow', label: '黄色', value: '#FFE66D' },
      { key: 'green', label: '绿色', value: '#98FB98' },
      { key: 'pink', label: '粉色', value: '#FFB6C1' },
      { key: 'blue', label: '蓝色', value: '#87CEEB' },
      { key: 'orange', label: '橙色', value: '#FFD700' },
      { key: 'purple', label: '紫色', value: '#DDA0DD' },
    ]
  });
});



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

    const { default: OpenAI } = await import('openai');
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

// POST /api/images/note - 一键生成笔记全部配图（首图+内容图）
router.post('/note', async (req, res) => {
  let browser;
  try {
    const { 
      title, 
      content: noteContent, 
      bgColor = '#FFF5F5', 
      accentColor = '#FF4757', 
      highlightColor = '#FFE66D' 
    } = req.body;
    
    if (!title || !noteContent) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }
    
    console.log('生成笔记配图，标题:', title.substring(0, 50));
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1080, height: 1440 });
    
    const images: string[] = [];
    
    // 1. 生成首图
    const coverHtml = generateCoverHtml(title, bgColor, accentColor, highlightColor);
    await page.setContent(coverHtml, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const coverScreenshot = await page.screenshot({ type: 'png' });
    images.push(`data:image/png;base64,${coverScreenshot.toString('base64')}`);
    
    // 2. 自动拆分内容生成内容图
    // 按段落拆分，每5-7行一张图
    const allLines = noteContent.split('\n').filter((line: string) => line.trim());
    const LINES_PER_PAGE = 7;
    const pages: string[][] = [];
    
    for (let i = 0; i < allLines.length; i += LINES_PER_PAGE) {
      pages.push(allLines.slice(i, i + LINES_PER_PAGE));
    }
    
    // 3. 生成每张内容图
    for (const pageLines of pages) {
      const html = generateContentHtml(title, pageLines, bgColor, accentColor, highlightColor);
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const screenshot = await page.screenshot({ type: 'png' });
      images.push(`data:image/png;base64,${screenshot.toString('base64')}`);
    }
    
    await browser.close();
    
    res.json({
      success: true,
      count: images.length,
      coverCount: 1,
      contentCount: pages.length,
      images: images
    });
    
  } catch (error) {
    console.error('生成笔记配图失败:', error);
    if (browser) await browser.close();
    res.status(500).json({ 
      error: '生成失败',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
