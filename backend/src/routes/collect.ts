/**
 * 爆款数据采集API
 * 直接调用小红书 Web API 采集真实爆款笔记（近15天，点赞50+，保险获客类）
 * 不依赖本地 autocli，可在 Railway 云端独立运行
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

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
 * 小红书搜索 API 直接调用
 * 使用 edith.xiaohongshu.com API，无需登录态即可获取公开数据
 */
async function searchXhsByKeyword(keyword: string): Promise<any[]> {
  try {
    const response = await axios.get(
      'https://edith.xiaohongshu.com/api/sns/web/v1/search/notes',
      {
        params: {
          keyword,
          page: 1,
          page_size: 20,
          search_id: Math.random().toString(36).substring(2, 15),
          sort: 'general',
          note_type: 0
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.xiaohongshu.com',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    const data = response.data;
    if (!data?.data?.items) return [];

    return data.data.items
      .map((item: any) => {
        const noteCard = item.note_card || item;
        const interact = noteCard.interact_info || {};
        const likes = Number(interact.liked_count || 0);
        const favorites = Number(interact.collected_count || 0);
        const comments = Number(interact.comment_count || 0);
        const shares = Number(interact.share_count || 0);
        const noteId = noteCard.note_id || '';
        const publishedAt = noteCard.time ? new Date(noteCard.time * 1000) : new Date();

        // 过滤：近15天 + 点赞≥50
        const daysAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysAgo > 15 || likes < 50) return null;

        return {
          platform: 'XHS',
          title: noteCard.title || noteCard.display_title || '',
          content: noteCard.desc || noteCard.content || '',
          author: noteCard.user?.nickname || '',
          authorUrl: noteCard.user?.user_id ? `https://www.xiaohongshu.com/user/profile/${noteCard.user.user_id}` : '',
          url: noteId ? `https://www.xiaohongshu.com/explore/${noteId}` : '',
          coverImage: noteCard.cover?.url || noteCard.image_list?.[0]?.url || '',
          likesCount: likes,
          favoritesCount: favorites,
          commentsCount: comments,
          sharesCount: shares,
          tags: JSON.stringify([keyword, '保险', 'XHS']),
          insuranceType: guessInsuranceType(keyword),
          viralScore: calcViralScore(likes, favorites, comments, shares),
          publishedAt
        };
      })
      .filter((item: any) => item !== null && item.title.length > 0);

  } catch (e: any) {
    console.log(`小红书 API 搜索"${keyword}"失败: ${e.message}`);
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

// searchXhsByKeyword 已在上文定义

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
      message: '未采集到数据。小红书 API 可能暂时不可用，请稍后重试。',
      tip: '小红书有反爬机制，部分关键词可能无法获取数据'
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
