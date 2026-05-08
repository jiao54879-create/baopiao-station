import { Router } from 'express';
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// 生成HTML模板
function generateHtml(content: string, theme: 'professional' | 'minimal' | 'warm' = 'professional') {
  const themes = {
    professional: {
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      cardBg: '#ffffff',
      textColor: '#333333',
      accent: '#667eea'
    },
    minimal: {
      bg: '#f8f9fa',
      cardBg: '#ffffff',
      textColor: '#495057',
      accent: '#343a40'
    },
    warm: {
      bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      cardBg: '#ffffff',
      textColor: '#333333',
      accent: '#f5576c'
    }
  };
  const t = themes[theme];
  
  // 解析内容 - 简单按---分页
  const pages = content.split('---').filter(p => p.trim());
  
  let cardsHtml = '';
  pages.forEach((page, index) => {
    const lines = page.trim().split('\n');
    const title = lines[0].replace(/^#+\s*/, '').trim();
    const body = lines.slice(1).join('<br>').trim();
    
    cardsHtml += `
      <div class="card" id="card-${index}">
        <div class="card-content">
          ${title ? `<h1>${title}</h1>` : ''}
          ${body ? `<div class="body">${body}</div>` : ''}
        </div>
      </div>
    `;
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: ${t.bg};
          min-height: 1920px;
          display: flex;
          flex-wrap: wrap;
          gap: 40px;
          padding: 40px;
          justify-content: center;
          align-items: flex-start;
        }
        .card {
          width: 1080px;
          min-height: 1440px;
          background: ${t.cardBg};
          border-radius: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }
        .card-content {
          padding: 80px 60px;
          min-height: 1440px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
        h1 {
          font-size: 56px;
          font-weight: 700;
          color: ${t.accent};
          margin-bottom: 40px;
          line-height: 1.3;
        }
        .body {
          font-size: 36px;
          line-height: 1.8;
          color: ${t.textColor};
        }
        .body br {
          margin-bottom: 20px;
          display: block;
          content: '';
        }
      </style>
    </head>
    <body>${cardsHtml}</body>
    </html>
  `;
}

router.post('/generate', async (req, res) => {
  let browser;
  try {
    const { content, theme = 'professional' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: '内容不能为空' });
    }
    
    console.log('启动浏览器...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    const html = generateHtml(content, theme);
    
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // 获取所有卡片元素
    const cards = await page.$$('.card');
    const images: string[] = [];
    
    for (let i = 0; i < cards.length; i++) {
      const screenshot = await cards[i].screenshot({ type: 'png' });
      const base64 = `data:image/png;base64,${screenshot.toString('base64')}`;
      images.push(base64);
    }
    
    await browser.close();
    
    res.json({
      success: true,
      count: images.length,
      images: images
    });
    
  } catch (error) {
    console.error('生成配图失败:', error);
    if (browser) await browser.close();
    res.status(500).json({ 
      error: '生成失败',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// 简单测试页面
router.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>配图生成测试</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        textarea { width: 100%; height: 300px; padding: 10px; font-size: 14px; }
        button { background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 10px; }
        button:disabled { background: #ccc; }
        #result { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 20px; }
        #result img { max-width: 200px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .loading { color: #666; font-style: italic; }
      </style>
    </head>
    <body>
      <h1>小红书配图生成测试</h1>
      <textarea id="content" placeholder="输入笔记内容，用---分隔每一页

第一页标题
内容第一行
内容第二行
---
第二页标题
..."></textarea>
      <br>
      <button onclick="generate()">生成配图</button>
      <div id="result"></div>
      
      <script>
        async function generate() {
          const content = document.getElementById('content').value;
          const result = document.getElementById('result');
          result.innerHTML = '<p class="loading">正在生成...</p>';
          
          try {
            const res = await fetch('/api/images/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content })
            });
            
            const data = await res.json();
            
            if (data.success) {
              result.innerHTML = '<p>成功生成 ' + data.count + ' 张配图：</p>';
              data.images.forEach((img, i) => {
                const div = document.createElement('div');
                div.innerHTML = '<a href="' + img + '" download="card_' + i + '.png"><img src="' + img + '"></a>';
                result.appendChild(div);
              });
            } else {
              result.innerHTML = '<p style="color:red">错误: ' + data.error + '</p>';
            }
          } catch (e) {
            result.innerHTML = '<p style="color:red">请求失败: ' + e.message + '</p>';
          }
        }
      </script>
    </body>
    </html>
  `);
});

export default router;
