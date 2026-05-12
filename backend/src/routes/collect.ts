/**
 * 爆款数据采集API
 * 通过 autocli 采集小红书真实爆款笔记（近15天，点赞50+，保险获客类）
 * 依赖：用户 Chrome 已登录小红书，且已安装 autocli Chrome 扩展
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = Router();
const prisma = new PrismaClient();
const execAsync = promisify(exec);

// 保险获客类关键词（覆盖常见爆款选题方向）
const XHS_INSURANCE_KEYWORDS = [
  '保险怎么买',
  '重疾险推荐',
  '医疗险攻略',
  '保险避坑',
  '家庭保险配置',
  '保险小白',
  '买保险',
  '宝宝保险',
  '保险对比',
  '增额终身寿'
];

/**
 * 解析 autocli 返回的小红书搜索 JSON
 * autocli xiaohongshu search "关键词" --format json
 */
function parseAutocliXhsResult(raw: string): any[] {
  try {
    let text = raw.trim();
    // 去掉可能的 markdown 包裹
    if (text.startsWith('```')) {
      text = text.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').replace(/\n?```$/, '').trim();
    }
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.items) return parsed.items;
    if (parsed.data) return parsed.data;
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * 计算爆款分数（点赞×0.4 + 收藏×0.4 + 评论×0.1 + 分享×0.1）
 */
function calcViralScore(likes: number, favorites: number, comments: number, shares: number = 0): number {
  return Math.round(likes * 0.4 + favorites * 0.4 + comments * 0.1 + shares * 0.1);
}

/**
 * 判断是否为近 N 天内发布
 */
function isWithinDays(dateStr: string | number | null, days: number): boolean {
  if (!dateStr) return true; // 日期未知时不过滤
  const ts = typeof dateStr === 'number' ? dateStr * 1000 : new Date(dateStr).getTime();
  const now = Date.now();
  return now - ts <= days * 24 * 60 * 60 * 1000;
}

/**
 * 用 autocli 搜索某关键词，返回过滤后的笔记列表
 */
async function searchXhsByKeyword(keyword: string): Promise<any[]> {
  try {
    const { stdout } = await execAsync(
      `autocli xiaohongshu search "${keyword}" --limit 20 --format json`,
      { timeout: 30000 }
    );
    const items = parseAutocliXhsResult(stdout);

    return items
      .filter(item => {
        const likes = Number(item.likes || item.likesCount || item.liked_count || 0);
        const publishTime = item.publishTime || item.time || item.created_at || null;
        return likes >= 50 && isWithinDays(publishTime, 15);
      })
      .map(item => {
        const likes = Number(item.likes || item.likesCount || item.liked_count || 0);
        const favorites = Number(item.favorites || item.favoritesCount || item.collected_count || 0);
        const comments = Number(item.comments || item.commentsCount || item.comment_count || 0);
        const shares = Number(item.shares || item.sharesCount || item.share_count || 0);
        const noteId = item.id || item.note_id || item.noteId || '';
        const rawUrl = item.url || item.link || '';

        // 构建完整的小红书链接
        let url = rawUrl;
        if (!url && noteId) {
          url = `https://www.xiaohongshu.com/explore/${noteId}`;
        }
        if (url && !url.startsWith('http')) {
          url = `https://www.xiaohongshu.com/explore/${url}`;
        }

        return {
          platform: 'XHS',
          title: item.title || item.name || '',
          content: item.desc || item.content || item.description || '',
          author: item.author || item.user?.nickname || item.nickname || '',
          authorUrl: item.authorUrl || (item.user?.id ? `https://www.xiaohongshu.com/user/profile/${item.user.id}` : ''),
          url,
          coverImage: item.cover || item.image || item.thumbnail || '',
          likesCount: likes,
          favoritesCount: favorites,
          commentsCount: comments,
          sharesCount: shares,
          tags: JSON.stringify([keyword, '保险', 'XHS']),
          insuranceType: guessInsuranceType(keyword),
          viralScore: calcViralScore(likes, favorites, comments, shares),
          publishedAt: item.publishTime
            ? new Date(typeof item.publishTime === 'number' ? item.publishTime * 1000 : item.publishTime)
            : new Date()
        };
      })
      .filter(item => item.title.length > 0); // 必须有标题
  } catch (e: any) {
    console.log(`autocli 搜索"${keyword}"失败: ${e.message}`);
    return [];
  }
}

/**
 * 根据关键词猜测险种
 */
function guessInsuranceType(keyword: string): string {
  if (keyword.includes('重疾')) return 'CRITICAL_ILLNESS';
  if (keyword.includes('医疗')) return 'MEDICAL';
  if (keyword.includes('寿险') || keyword.includes('终身寿') || keyword.includes('增额')) return 'TERM_LIFE';
  if (keyword.includes('意外')) return 'ACCIDENT';
  if (keyword.includes('年金') || keyword.includes('养老')) return 'ANNUITY';
  if (keyword.includes('宝宝') || keyword.includes('儿童') || keyword.includes('少儿')) return 'CHILDREN';
  if (keyword.includes('父母') || keyword.includes('老人')) return 'SENIOR';
  if (keyword.includes('家庭')) return 'FAMILY';
  return 'INSURANCE';
}

/**
 * POST /collect/viral
 * 通过 autocli 采集小红书真实保险获客爆款笔记
 * 要求：Chrome 已登录小红书 + autocli Chrome 扩展已连接
 */
router.post('/collect/viral', async (req, res) => {
  // 支持自定义关键词，默认使用内置列表
  const keywords: string[] = req.body?.keywords || XHS_INSURANCE_KEYWORDS;
  const allNotes: any[] = [];

  // 逐关键词采集
  for (const keyword of keywords) {
    const notes = await searchXhsByKeyword(keyword);
    allNotes.push(...notes);
    // 每个关键词间隔 1.5 秒，避免频率过高
    await new Promise(r => setTimeout(r, 1500));
  }

  // 去重（按 url，保留高分）
  const seen = new Map<string, any>();
  for (const note of allNotes) {
    const key = note.url || note.title;
    if (!seen.has(key) || note.viralScore > seen.get(key).viralScore) {
      seen.set(key, note);
    }
  }

  const uniqueNotes = [...seen.values()].sort((a, b) => b.viralScore - a.viralScore);

  // 写入数据库
  let saved = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const note of uniqueNotes) {
    try {
      // 按 url 去重（url 不为空时）
      if (note.url && !note.url.includes('example')) {
        const exists = await prisma.viralCase.findFirst({ where: { url: note.url } });
        if (exists) { skipped++; continue; }
      } else if (note.title) {
        const exists = await prisma.viralCase.findFirst({ where: { title: note.title } });
        if (exists) { skipped++; continue; }
      }

      await prisma.viralCase.create({ data: note });
      saved++;
    } catch (e: any) {
      errors.push(note.title + ': ' + e.message);
    }
  }

  const total = uniqueNotes.length;

  if (total === 0) {
    return res.status(503).json({
      success: false,
      message: '未采集到数据。请确认：① Chrome 已打开并登录小红书 ② autocli Chrome 扩展已安装并连接（运行 autocli doctor 检查）',
      tip: '运行命令诊断：autocli doctor'
    });
  }

  res.json({
    success: true,
    message: `采集完成！共发现 ${total} 条，新增 ${saved} 条，跳过 ${skipped} 条（已存在）`,
    total,
    saved,
    skipped,
    errors: errors.length > 0 ? errors.slice(0, 5) : undefined
  });
});

// 获取采集状态
router.get('/collect/status', async (req, res) => {
  try {
    const total = await prisma.viralCase.count();
    const xhsReal = await prisma.viralCase.count({
      where: { platform: 'XHS', url: { not: { contains: 'example' } } }
    });
    const byPlatform = await prisma.viralCase.groupBy({
      by: ['platform'],
      _count: true,
    });
    const recentXhs = await prisma.viralCase.count({
      where: {
        platform: 'XHS',
        url: { not: { contains: 'example' } },
        publishedAt: { gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }
      }
    });

    res.json({
      success: true,
      total,
      xhsRealCount: xhsReal,
      recentXhsCount: recentXhs,
      byPlatform: byPlatform.reduce((acc, item) => {
        acc[item.platform] = item._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
