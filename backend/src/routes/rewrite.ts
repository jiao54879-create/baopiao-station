// 一键仿写路由
import { Router } from 'express';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { rewriteContent } from '../services/claude.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const RewriteSchema = z.object({
  url: z.string().url('请输入有效的 URL').optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  style: z.enum(['xhs', 'wechat'], { errorMap: () => ({ message: '风格必须是 xhs 或 wechat' }) }),
  // 跨领域仿写：目标保险选题方向
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

  // 移除无用元素
  $('script, style, nav, footer, header, .ad, .ads, .advertisement, #comments, .share, .related').remove();

  // 尝试多种选择器提取标题
  let title =
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    '';

  // 尝试提取正文
  const contentSelectors = [
    'article',
    '.article-content',
    '.post-content',
    '.entry-content',
    '#content',
    '.content',
    'main',
    '.rich_media_content',  // 公众号
    '#js_content',          // 公众号
    '.note-content',        // 小红书
  ];

  let content = '';
  for (const selector of contentSelectors) {
    const el = $(selector);
    if (el.length && el.text().trim().length > 100) {
      content = el.text().trim();
      break;
    }
  }

  // fallback：取 body 文本
  if (!content || content.length < 50) {
    content = $('body').text().replace(/\s+/g, ' ').trim();
  }

  // 限制长度
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

    // 如果提供了 URL，抓取内容
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

    // 调用 AI 仿写（支持跨领域仿写）
    const result = await rewriteContent(title, content, style, url, targetTopic);

    res.json({
      success: true,
      sourceUrl: url || null,
      originalTitle: title,
      targetTopic: targetTopic || null,  // 返回目标选题（如果有）
      result,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
