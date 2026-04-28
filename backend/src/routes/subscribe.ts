import { Router } from 'express';

const router = Router();

// 公众号订阅配置存储（内存存储，重启后会丢失，生产环境应存入数据库）
const subscribedAccounts: Map<string, {
  bizId: string;
  name: string;
  wechatId: string;
  subscribedAt: Date;
  articleUrl: string;
}> = new Map();

// 从微信文章链接提取 biz_id 或 gh_id
function extractWechatId(url: string): string | null {
  // 尝试从 __biz= 参数提取
  const bizMatch = url.match(/__biz=([^&]+)/i);
  if (bizMatch) {
    // base64 解码得到原始 biz
    try {
      const decoded = Buffer.from(bizMatch[1] + '=', 'base64').toString('utf8');
      const ghMatch = decoded.match(/^(gh_[a-z0-9]+)/i);
      if (ghMatch) return ghMatch[1];
    } catch (e) {}
    return bizMatch[1];
  }
  
  // 尝试从 gh_ 提取（原始ID）
  const ghMatch = url.match(/gh_([a-z0-9]+)/i);
  if (ghMatch) return 'gh_' + ghMatch[1];
  
  return null;
}

// 验证公众号 ID 是否有效格式
function isValidWechatId(id: string): boolean {
  return /^gh_[a-z0-9]{10,16}$/i.test(id) || /^[a-zA-Z0-9_-]{2,30}$/.test(id);
}

// POST /api/subscribe/wechat - 订阅公众号
router.post('/wechat', async (req, res) => {
  try {
    const { articleUrl, wechatId, wechatName } = req.body;
    
    let targetId = '';
    let source = '';
    
    // 方式1：从文章链接提取
    if (articleUrl && articleUrl.includes('mp.weixin.qq.com')) {
      const extracted = extractWechatId(articleUrl);
      if (extracted) {
        targetId = extracted;
        source = 'article';
      } else {
        return res.status(400).json({ 
          success: false, 
          error: '无法从链接中提取公众号ID，请确保链接包含完整的 __biz 或 gh_ 参数',
          hint: '提示：短链接（如 mp.weixin.qq.com/s/xxx）可能不包含公众号ID，请尝试使用完整文章链接'
        });
      }
    }
    // 方式2：直接输入微信号
    else if (wechatId) {
      targetId = wechatId.trim();
      source = 'wechatId';
    }
    else {
      return res.status(400).json({ 
        success: false, 
        error: '请提供公众号文章链接或微信号'
      });
    }
    
    // 统一转换为小写
    targetId = targetId.toLowerCase();
    
    // 检查是否已订阅
    if (subscribedAccounts.has(targetId)) {
      return res.json({
        success: true,
        message: '该公众号已订阅',
        data: subscribedAccounts.get(targetId),
        rssUrl: `https://rsshub.app/wechat/mp/${targetId}`
      });
    }

    // 存储订阅信息
    const accountInfo = {
      bizId: targetId,
      name: wechatName || `公众号_${targetId.slice(0, 8)}`,
      wechatId: targetId,
      subscribedAt: new Date(),
      articleUrl: articleUrl || ''
    };
    
    subscribedAccounts.set(targetId, accountInfo);

    res.json({
      success: true,
      message: '订阅成功！系统将自动采集该公众号的最新文章',
      data: {
        ...accountInfo,
        rssUrl: `https://rsshub.app/wechat/mp/${targetId}`
      },
      rssUrl: `https://rsshub.app/wechat/mp/${targetId}`,
      tips: [
        '✅ RSS 地址已生成',
        '💡 可以复制 RSS 地址到 RSS 阅读器订阅',
        '📌 系统将在下次数据采集中获取该公众号文章'
      ]
    });

  } catch (error: any) {
    console.error('订阅公众号失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/subscribe/wechat - 获取已订阅的公众号列表
router.get('/wechat', async (req, res) => {
  try {
    const accounts = Array.from(subscribedAccounts.values()).map(acc => ({
      ...acc,
      rssUrl: `https://rsshub.app/wechat/mp/${acc.bizId}`
    }));

    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE /api/subscribe/wechat/:bizId - 取消订阅
router.delete('/wechat/:bizId', async (req, res) => {
  try {
    const { bizId } = req.params;
    const targetId = bizId.toLowerCase();
    
    if (subscribedAccounts.has(targetId)) {
      subscribedAccounts.delete(targetId);
      res.json({ success: true, message: '已取消订阅' });
    } else {
      res.status(404).json({ success: false, error: '未找到该订阅' });
    }
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
