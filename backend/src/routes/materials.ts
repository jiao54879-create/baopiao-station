// 素材上传路由 - 支持文件上传管理
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../index.js';

const router = Router();

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'materials');
    // 自动创建目录
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳-原文件名
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器：只允许常见格式
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
    'text/plain', 'text/markdown'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}。支持的格式：图片/JPG/PNG/GIF/WebP、PDF、Word、Excel、TXT、Markdown`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 单文件最大10MB
  }
});

// 上传单个文件
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请选择要上传的文件' });
      return;
    }

    // 保存到数据库
    const material = await prisma.savedIntelligence.create({
      data: {
        userId: (req as any).user.id,
        intelligenceId: 0, // 上传类不需要关联
        notes: JSON.stringify({
          type: 'MATERIAL_UPLOAD',
          filename: req.file.originalname,
          storedFilename: req.file.filename,
          path: `/uploads/materials/${req.file.filename}`,
          size: req.file.size,
          mimeType: req.file.mimetype,
        })
      }
    });

    res.json({
      success: true,
      data: {
        id: material.id,
        filename: req.file.originalname,
        url: `/uploads/materials/${req.file.filename}`,
        size: req.file.size,
        mimeType: req.file.mimetype,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 上传多个文件
router.post('/upload/multiple', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: '请选择要上传的文件' });
      return;
    }

    const results = files.map(file => ({
      filename: file.originalname,
      url: `/uploads/materials/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
    }));

    res.json({
      success: true,
      data: results,
      total: results.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取素材列表
router.get('/list', async (req, res) => {
  try {
    const { type, page = '1', limit = '20' } = req.query;
    
    const uploads = await prisma.savedIntelligence.findMany({
      where: {
        userId: (req as any).user.id,
        notes: { contains: '"type":"MATERIAL_UPLOAD"' }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    // 解析notes字段
    const materials = uploads.map(u => {
      const meta = JSON.parse(u.notes || '{}');
      return {
        id: u.id,
        filename: meta.filename,
        url: meta.url,
        size: meta.size,
        mimeType: meta.mimeType,
        createdAt: u.createdAt,
      };
    });

    res.json({ success: true, data: materials });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除素材
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const saved = await prisma.savedIntelligence.findFirst({
      where: {
        id: Number(id),
        userId: (req as any).user.id,
        notes: { contains: '"type":"MATERIAL_UPLOAD"' }
      }
    });

    if (!saved) {
      res.status(404).json({ error: '素材不存在' });
      return;
    }

    // 删除物理文件
    const meta = JSON.parse(saved.notes || '{}');
    if (meta.storedFilename) {
      const filePath = path.join(process.cwd(), 'uploads', 'materials', meta.storedFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.savedIntelligence.delete({ where: { id: Number(id) } });

    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
