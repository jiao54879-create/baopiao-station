// 保险产品管理 API
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

const router = Router();

// 验证schema
const createProductSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  insuranceType: z.string().min(1),
  status: z.enum(['NEW', 'HOT', 'NORMAL', 'OFFLINE']).optional(),
  priceAdult30: z.number().optional(),
  priceChild0: z.number().optional(),
  launchDate: z.string().optional(),
  offlineDate: z.string().optional(),
  estimatedOffline: z.string().optional(),
  highlights重症: z.array(z.string()).optional(),
  highlights轻症: z.array(z.string()).optional(),
  highlights豁免: z.array(z.string()).optional(),
  highlights特色: z.array(z.string()).optional(),
  highlights增值: z.array(z.string()).optional(),
  advantagesPrice: z.array(z.string()).optional(),
  advantagesCoverage: z.array(z.string()).optional(),
  advantages核保: z.array(z.string()).optional(),
  advantagesService: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  competitorComparison: z.string().optional(),
  drawbacks: z.array(z.string()).optional(),
  source: z.string().optional(),
  sourceUrl: z.string().optional(),
  notes: z.string().optional()
});

// 获取产品列表
router.get('/', async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '20',
      status,
      insuranceType,
      company,
      keyword 
    } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (insuranceType) where.insuranceType = insuranceType;
    if (company) where.company = { contains: company };
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { company: { contains: keyword as string } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.insuranceProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          _count: {
            select: { viralCases: true, intelligences: true }
          }
        }
      }),
      prisma.insuranceProduct.count({ where })
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个产品详情
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.insuranceProduct.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        viralCases: {
          orderBy: { viralScore: 'desc' },
          take: 10
        },
        intelligences: {
          orderBy: { publishTime: 'desc' },
          take: 20
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, error: '产品不存在' });
    }

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建产品
router.post('/', async (req, res) => {
  try {
    const data = createProductSchema.parse(req.body);
    
    const product = await prisma.insuranceProduct.create({
      data: {
        ...data,
        launchDate: data.launchDate ? new Date(data.launchDate) : undefined,
        offlineDate: data.offlineDate ? new Date(data.offlineDate) : undefined,
        estimatedOffline: data.estimatedOffline ? new Date(data.estimatedOffline) : undefined,
        highlightsSevere: JSON.stringify(data.highlights重症 || []),
        highlightsMild: JSON.stringify(data.highlights轻症 || []),
        highlightsWaiver: JSON.stringify(data.highlights豁免 || []),
        highlightsSpecial: JSON.stringify(data.highlights特色 || []),
        highlightsValue: JSON.stringify(data.highlights增值 || []),
        advantagesPrice: JSON.stringify(data.advantagesPrice || []),
        advantagesCoverage: JSON.stringify(data.advantagesCoverage || []),
        advantagesUW: JSON.stringify(data.advantages核保 || []),
        advantagesService: JSON.stringify(data.advantagesService || []),
        competitors: JSON.stringify(data.competitors || []),
        drawbacks: JSON.stringify(data.drawbacks || [])
      }
    });

    res.json({ success: true, data: product });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新产品
router.put('/:id', async (req, res) => {
  try {
    const data = createProductSchema.partial().parse(req.body);
    
    const updateData: any = { ...data, lastUpdated: new Date() };
    
    if (data.launchDate) updateData.launchDate = new Date(data.launchDate);
    if (data.offlineDate) updateData.offlineDate = new Date(data.offlineDate);
    if (data.estimatedOffline) updateData.estimatedOffline = new Date(data.estimatedOffline);
    
    // JSON字段需要序列化
    const jsonFields = [
      'highlightsSevere', 'highlightsMild', 'highlightsWaiver', 'highlightsSpecial', 'highlightsValue',
      'advantagesPrice', 'advantagesCoverage', 'advantagesUW', 'advantagesService',
      'competitors', 'drawbacks'
    ];
    
    for (const field of jsonFields) {
      if ((data as any)[field]) {
        (updateData as any)[field] = JSON.stringify((data as any)[field]);
      }
    }

    const product = await prisma.insuranceProduct.update({
      where: { id: Number(req.params.id) },
      data: updateData
    });

    res.json({ success: true, data: product });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除产品
router.delete('/:id', async (req, res) => {
  try {
    await prisma.insuranceProduct.delete({
      where: { id: Number(req.params.id) }
    });

    res.json({ success: true, message: '产品已删除' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新产品状态（上下架）
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, offlineDate, estimatedOffline } = req.body;
    
    const updateData: any = { status, lastUpdated: new Date() };
    if (offlineDate) updateData.offlineDate = new Date(offlineDate);
    if (estimatedOffline) updateData.estimatedOffline = new Date(estimatedOffline);

    const product = await prisma.insuranceProduct.update({
      where: { id: Number(req.params.id) },
      data: updateData
    });

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取产品统计
router.get('/stats/overview', async (req, res) => {
  try {
    const [total, newProducts, hotProducts, offlineProducts] = await Promise.all([
      prisma.insuranceProduct.count(),
      prisma.insuranceProduct.count({ where: { status: 'NEW' } }),
      prisma.insuranceProduct.count({ where: { status: 'HOT' } }),
      prisma.insuranceProduct.count({ where: { status: 'OFFLINE' } })
    ]);

    // 按公司统计
    const byCompany = await prisma.insuranceProduct.groupBy({
      by: ['company'],
      _count: { id: true }
    });

    // 按险种统计
    const byType = await prisma.insuranceProduct.groupBy({
      by: ['insuranceType'],
      _count: { id: true }
    });

    res.json({
      success: true,
      data: {
        total,
        newProducts,
        hotProducts,
        offlineProducts,
        byCompany,
        byType
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取即将下架的产品
router.get('/upcoming/offline', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Number(days));

    const products = await prisma.insuranceProduct.findMany({
      where: {
        estimatedOffline: {
          lte: futureDate,
          gte: new Date()
        },
        status: { not: 'OFFLINE' }
      },
      orderBy: { estimatedOffline: 'asc' }
    });

    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
