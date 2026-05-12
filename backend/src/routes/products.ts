// 保险产品管理 API
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import OpenAI from 'openai';

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
  highlightsSevere: z.array(z.string()).optional(),
  highlightsMild: z.array(z.string()).optional(),
  highlightsWaiver: z.array(z.string()).optional(),
  highlightsSpecial: z.array(z.string()).optional(),
  highlightsValue: z.array(z.string()).optional(),
  advantagesPrice: z.array(z.string()).optional(),
  advantagesCoverage: z.array(z.string()).optional(),
  advantagesUW: z.array(z.string()).optional(),
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
        highlightsSevere: JSON.stringify(data.highlightsSevere || []),
        highlightsMild: JSON.stringify(data.highlightsMild || []),
        highlightsWaiver: JSON.stringify(data.highlightsWaiver || []),
        highlightsSpecial: JSON.stringify(data.highlightsSpecial || []),
        highlightsValue: JSON.stringify(data.highlightsValue || []),
        advantagesPrice: JSON.stringify(data.advantagesPrice || []),
        advantagesCoverage: JSON.stringify(data.advantagesCoverage || []),
        advantagesUW: JSON.stringify(data.advantagesUW || []),
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

// ========== 文件上传和AI解析 ==========

// 配置 multer 存储
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件大小限制 10MB
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.doc', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 PDF、Word、TXT 文件'));
    }
  }
});

// DeepSeek AI 客户端
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

// 解析产品文档 Schema
const ProductAnalyzeSchema = z.object({
  name: z.string(),
  company: z.string(),
  insuranceType: z.string(),
  priceAdult30: z.number().optional(),
  priceChild0: z.number().optional(),
  highlightsSevere: z.array(z.string()).optional(),
  highlightsMild: z.array(z.string()).optional(),
  highlightsWaiver: z.array(z.string()).optional(),
  highlightsSpecial: z.array(z.string()).optional(),
  highlightsValue: z.array(z.string()).optional(),
  advantagesPrice: z.array(z.string()).optional(),
  advantagesCoverage: z.array(z.string()).optional(),
  advantagesUW: z.array(z.string()).optional(),
  advantagesService: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  competitorComparison: z.string().optional(),
  drawbacks: z.array(z.string()).optional(),
  source: z.string().optional(),
  notes: z.string().optional()
});

// 上传并解析产品素材
router.post('/analyze-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传文件' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let textContent = '';

    try {
      // 解析文件内容
      if (ext === '.pdf') {
        const pdfData = await pdfParse(fs.readFileSync(filePath));
        textContent = pdfData.text;
      } else if (ext === '.docx' || ext === '.doc') {
        const result = await mammoth.extractRawText({ path: filePath });
        textContent = result.value;
      } else if (ext === '.txt') {
        textContent = fs.readFileSync(filePath, 'utf-8');
      }
    } finally {
      // 清理上传的文件
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('删除临时文件失败:', e);
      }
    }

    if (!textContent || textContent.trim().length < 50) {
      return res.status(400).json({ 
        success: false, 
        error: '文档内容过少或无法解析，请确保文档包含完整的产品信息' 
      });
    }

    // 调用 DeepSeek 分析
    const prompt = `你是一个专业的保险产品分析师。请从以下保险产品资料中提取关键信息，并以JSON格式返回。

## 险种枚举值（必须严格使用）
- CRITICAL_ILLNESS: 重疾险
- MEDICAL: 医疗险
- LIFE: 寿险
- ACCIDENT: 意外险
- ANNUITY: 年金险
- WHOLE_LIFE: 终身寿险
- INCREASING_LIFE: 增额终身寿险
- CHILD: 少儿保险
- GROUP: 团体险

## 产品资料内容：
${textContent.substring(0, 8000)}

## 请严格按照以下JSON格式返回（不要输出其他内容）：
{
  "name": "产品名称",
  "company": "保险公司名称",
  "insuranceType": "险种枚举值",
  "priceAdult30": 5000,
  "priceChild0": 800,
  "highlightsSevere": ["重疾保障亮点1", "亮点2"],
  "highlightsMild": ["轻/中症亮点"],
  "highlightsWaiver": ["豁免亮点"],
  "highlightsSpecial": ["特色疾病亮点"],
  "highlightsValue": ["性价比亮点"],
  "advantagesPrice": ["价格优势"],
  "advantagesCoverage": ["保障优势"],
  "advantagesUW": ["核保优势"],
  "advantagesService": ["服务优势"],
  "competitors": ["竞品1", "竞品2"],
  "competitorComparison": "竞品对比分析",
  "drawbacks": ["不足1", "不足2"],
  "source": "来源",
  "notes": "备注"
}

注意：
1. 如果某字段没有相关信息，返回空数组或空字符串
2. priceAdult30 是30岁成人保费（年），priceChild0是0岁儿童保费（年）
3. 请尽可能完整提取所有可用信息`;

    let response;
    try {
      response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4096,
      });
    } catch (apiError: any) {
      console.error('DeepSeek API 调用失败:', apiError?.message || apiError);
      return res.status(500).json({ 
        success: false, 
        error: 'AI 服务调用失败: ' + (apiError?.message || '未知错误') 
      });
    }

    const responseText = response.choices[0]?.message?.content || '';
    
    // 去掉 markdown 代码块包裹
    let cleanText = responseText.trim();
    while (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').trim();
    }
    while (cleanText.endsWith('```')) {
      cleanText = cleanText.replace(/\n?```$/, '').trim();
    }

    let parsedProduct: z.infer<typeof ProductAnalyzeSchema> | null = null;
    
    // 方法1: 直接解析
    try {
      parsedProduct = ProductAnalyzeSchema.parse(JSON.parse(cleanText));
    } catch (e1: any) {
      console.error('方法1解析失败:', e1.message);
    }

    // 方法2: 提取大括号内容
    if (!parsedProduct) {
      const braceStart = cleanText.indexOf('{');
      const braceEnd = cleanText.lastIndexOf('}');
      if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
        try {
          parsedProduct = ProductAnalyzeSchema.parse(JSON.parse(cleanText.substring(braceStart, braceEnd + 1)));
        } catch (e2: any) {
          console.error('方法2解析失败:', e2.message);
        }
      }
    }

    // 方法3: 正则提取关键字段（降级方案）
    if (!parsedProduct) {
      console.log('使用正则降级方案提取');
      const extractField = (text: string, fieldName: string): any => {
        const patterns: Record<string, RegExp> = {
          name: /"name"\s*:\s*"([^"]+)"/,
          company: /"company"\s*:\s*"([^"]+)"/,
          insuranceType: /"insuranceType"\s*:\s*"([^"]+)"/,
          priceAdult30: /"priceAdult30"\s*:\s*(\d+(?:\.\d+)?)/,
          priceChild0: /"priceChild0"\s*:\s*(\d+(?:\.\d+)?)/,
          competitorComparison: /"competitorComparison"\s*:\s*"([^"]*(?:"[^"]*"[^"]*)*)"/,
          source: /"source"\s*:\s*"([^"]+)"/,
          notes: /"notes"\s*:\s*"([^"]*)"/
        };
        const arrPatterns: Record<string, RegExp> = {
          highlightsSevere: /"highlightsSevere"\s*:\s*\[([^\]]*)\]/,
          highlightsMild: /"highlightsMild"\s*:\s*\[([^\]]*)\]/,
          highlightsWaiver: /"highlightsWaiver"\s*:\s*\[([^\]]*)\]/,
          highlightsSpecial: /"highlightsSpecial"\s*:\s*\[([^\]]*)\]/,
          highlightsValue: /"highlightsValue"\s*:\s*\[([^\]]*)\]/,
          advantagesPrice: /"advantagesPrice"\s*:\s*\[([^\]]*)\]/,
          advantagesCoverage: /"advantagesCoverage"\s*:\s*\[([^\]]*)\]/,
          advantagesUW: /"advantagesUW"\s*:\s*\[([^\]]*)\]/,
          advantagesService: /"advantagesService"\s*:\s*\[([^\]]*)\]/,
          competitors: /"competitors"\s*:\s*\[([^\]]*)\]/,
          drawbacks: /"drawbacks"\s*:\s*\[([^\]]*)\]/
        };
        
        const pattern = patterns[fieldName] || arrPatterns[fieldName];
        if (!pattern) return undefined;
        
        const match = text.match(pattern);
        if (!match) return undefined;
        
        if (arrPatterns[fieldName]) {
          const itemsStr = match[1];
          if (!itemsStr.trim()) return [];
          return itemsStr.split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
        }
        
        if (fieldName === 'priceAdult30' || fieldName === 'priceChild0') {
          return parseFloat(match[1]);
        }
        
        return match[1];
      };

      const extractedData: any = {};
      const allFields = [
        'name', 'company', 'insuranceType', 'priceAdult30', 'priceChild0',
        'highlightsSevere', 'highlightsMild', 'highlightsWaiver', 'highlightsSpecial',
        'highlightsValue', 'advantagesPrice', 'advantagesCoverage', 'advantagesUW',
        'advantagesService', 'competitors', 'competitorComparison', 'drawbacks',
        'source', 'notes'
      ];
      
      for (const field of allFields) {
        const value = extractField(cleanText, field);
        if (value !== undefined) {
          extractedData[field] = value;
        }
      }

      // 验证必填字段
      if (extractedData.name && extractedData.company && extractedData.insuranceType) {
        try {
          parsedProduct = ProductAnalyzeSchema.parse(extractedData);
        } catch (e3: any) {
          console.error('正则提取数据验证失败:', e3.message);
        }
      }
    }

    if (!parsedProduct) {
      console.error('AI 返回内容:', responseText.substring(0, 500));
      return res.status(500).json({ 
        success: false, 
        error: 'AI 返回格式错误，无法解析产品信息' 
      });
    }

    res.json({
      success: true,
      data: parsedProduct
    });

  } catch (error: any) {
    console.error('解析产品文档失败:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: '文件大小超过10MB限制' });
      }
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
