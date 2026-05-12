// 保险素材库 API
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

const router = Router();

const MaterialSchema = z.object({
  category: z.enum(['PITFALL', 'INFO_GAP', 'TRICK', 'CLAIM', 'COLD_FACT']),
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
});

// GET / - 列表（分页+筛选）
router.get('/', async (req, res) => {
  const { page = '1', limit = '20', category, keyword, tag } = req.query;
  const where: any = {};
  if (category) where.category = category;
  if (keyword) where.OR = [{ title: { contains: keyword as string } }, { content: { contains: keyword as string } }];
  if (tag) where.tags = { contains: tag as string };
  
  const [items, total] = await Promise.all([
    prisma.material.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit) }),
    prisma.material.count({ where })
  ]);
  
  // 解析tags JSON
  const parsed = items.map(item => ({ ...item, tags: JSON.parse(item.tags || '[]') }));
  res.json({ data: parsed, pagination: { page: Number(page), limit: Number(limit), total } });
});

// POST / - 新增
router.post('/', async (req, res) => {
  const data = MaterialSchema.parse(req.body);
  const item = await prisma.material.create({ data: { ...data, tags: JSON.stringify(data.tags || []) } });
  res.json({ data: { ...item, tags: JSON.parse(item.tags || '[]') } });
});

// PUT /:id - 更新
router.put('/:id', async (req, res) => {
  const data = MaterialSchema.partial().parse(req.body);
  if (data.tags) data.tags = JSON.stringify(data.tags) as any;
  const item = await prisma.material.update({ where: { id: Number(req.params.id) }, data });
  res.json({ data: { ...item, tags: JSON.parse(item.tags || '[]') } });
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  await prisma.material.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

// PATCH /:id/bookmark - 收藏/取消
router.patch('/:id/bookmark', async (req, res) => {
  const item = await prisma.material.findUnique({ where: { id: Number(req.params.id) } });
  if (!item) return res.status(404).json({ error: '不存在' });
  const updated = await prisma.material.update({ where: { id: item.id }, data: { isBookmark: !item.isBookmark } });
  res.json({ data: { ...updated, tags: JSON.parse(updated.tags || '[]') } });
});

// PATCH /:id/use - 使用+1
router.patch('/:id/use', async (req, res) => {
  const item = await prisma.material.update({ where: { id: Number(req.params.id) }, data: { usageCount: { increment: 1 } } });
  res.json({ data: { ...item, tags: JSON.parse(item.tags || '[]') } });
});

export default router;
