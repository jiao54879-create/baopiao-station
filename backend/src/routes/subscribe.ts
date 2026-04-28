import { Router } from 'express';

const router = Router();

// 公众号订阅配置存储
const subscribedAccounts: Map<string, {
  bizId: string;
  name: string;
  subscribedAt: Date;
  articleUrl: string;
}> = new Map();

// 从微信文章链接提取 biz_id
function extractBizId(url: string): string | null {
  // 尝试从 URL 参数中提取 biz
  const bizMatch = url.match(/biz=([^&]+)/);
  if (bizMatch) return bizMatch[1];
  
  // 尝试从短链中提取
  const shortUrlMatch = url.match(/(gh_[a-z0-9]+)/);
  if (shortUrlMatch) return shortUrlMatch[1];
  
  return null;
}

// POST /api/subscribe/wechat - 订阅公众号
router.post('/wechat', async (req, res) => {
  try {
    const { articleUrl } = req.body;
    
    if (!articleUrl || !articleUrl.includes('mp.weixin.qq.com')) {
      return res.status(400).json({ 
        success: false, 
        error: '请提供有效的微信公众号文章链接' 
      });
    }

    // 提取 biz_id
    const bizId = extractBizId(articleUrl);
    
    if (!bizId) {
      return res.status(400).json({ 
        success: false, 
        error: '无法从链接中提取公众号ID，请确保链接完整' 
      });
    }

    // 检查是否已订阅
    if (subscribedAccounts.has(bizId)) {
      return res.json({
        success: true,
        message: '该公众号已订阅',
        data: subscribedAccounts.get(bizId),
        rssUrl: `https://rsshub.app/wechat/mp/${bizId}`
      });
    }

    // 存储订阅信息（这里需要实际调用微信API或RSSHub来获取公众号名称）
    const accountInfo = {
      bizId,
      name: `公众号_${bizId.slice(0, 8)}`, // 临时名称，后续通过RSSHub获取
      subscribedAt: new Date(),
      articleUrl
    };
    
    subscribedAccounts.set(bizId, accountInfo);

    res.json({
      success: true,
      message: '订阅成功！系统将自动采集该公众号的最新文章',
      data: accountInfo,
      rssUrl: `https://rsshub.app/wechat/mp/${bizId}`,
      instructions: [
        '1. 复制上方的 RSS 地址',
        '2. 在 RSS 阅读器（如 Feedly、Inoreader）中添加订阅',
        '3. 系统将自动同步最新文章到爆款案例库'
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
    
    if (subscribedAccounts.has(bizId)) {
      subscribedAccounts.delete(bizId);
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
