import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * POST /import/xhs-json
 * 导入本地采集的 JSON 文件数据到 Railway 数据库
 * Body: { cases: ViralCase[] }
 */
router.post('/import/xhs-json', async (req, res) => {
  try {
    const { cases } = req.body;

    if (!Array.isArray(cases) || cases.length === 0) {
      return res.status(400).json({ success: false, error: '无效数据：需要非空数组' });
    }

    const imported = [];
    const skipped = [];
    const errors = [];

    for (const item of cases) {
      try {
        if (!item.title || !item.platform) {
          skipped.push({ reason: '缺少必要字段', title: item.title });
          continue;
        }

        // 去重：检查相同标题是否已存在
        const existing = await prisma.viralCase.findFirst({
          where: {
            title: item.title,
            platform: item.platform,
            url: item.url || '',
          },
        });

        if (existing) {
          skipped.push({ reason: '已存在', title: item.title });
          continue;
        }

        const created = await prisma.viralCase.create({
          data: {
            platform: item.platform || 'XHS',
            title: item.title,
            content: item.content || null,
            author: item.author || null,
            authorUrl: item.authorUrl || null,
            likesCount: Number(item.likesCount) || 0,
            favoritesCount: Number(item.favoritesCount) || 0,
            commentsCount: Number(item.commentsCount) || 0,
            sharesCount: Number(item.sharesCount) || 0,
            url: item.url || '',
            coverImage: item.coverImage || null,
            tags: typeof item.tags === 'string' ? item.tags : JSON.stringify(item.tags || []),
            insuranceType: item.insuranceType || null,
            viralScore: Number(item.viralScore) || 0,
            analysis: item.analysis || null,
            publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
          },
        });

        imported.push(created);
      } catch (e) {
        errors.push({ title: item.title, error: e.message });
      }
    }

    res.json({
      success: true,
      message: `导入完成：新增 ${imported.length} 条，跳过 ${skipped.length} 条（已存在/无效）`,
      data: {
        imported: imported.length,
        skipped: skipped.length,
        errors: errors.length,
        details: {
          skippedTitles: skipped.slice(0, 5),
          errorTitles: errors.slice(0, 5),
        },
      },
    });
  } catch (error) {
    console.error('导入失败:', error);
    res.status(500).json({ success: false, error: '导入失败', details: error.message });
  }
});

export default router;
