/**
 * 小红书爆款数据采集脚本
 * 使用 Playwright 模拟浏览器访问
 */

import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 保险相关关键词
const KEYWORDS = [
  '重疾险', '成人重疾险', '少儿重疾险', '百万医疗险',
  '定期寿险', '终身寿险', '年金险', '意外险',
  '保险怎么买', '保险知识', '保险科普', '保险避坑',
  '达尔文重疾险', '超级玛丽重疾险', '妈咪宝贝'
];

async function collectXHS(keyword: string): Promise<any[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
  });
  const page = await context.newPage();
  
  const results: any[] = [];
  
  try {
    // 访问小红书搜索页面
    const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&type=51`;
    console.log(`  🌐 访问: ${keyword}`);
    
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 等待内容加载
    await page.waitForTimeout(3000);
    
    // 滚动页面加载更多内容
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
    }
    
    // 提取笔记数据
    const notes = await page.evaluate(() => {
      const items: any[] = [];
      
      // 尝试多种选择器
      const cards = document.querySelectorAll('.note-item, .feeds-page .cover, [class*="note"]');
      
      cards.forEach(card => {
        const titleEl = card.querySelector('.title, .note-content, [class*="title"]');
        const descEl = card.querySelector('.desc, [class*="desc"]');
        const authorEl = card.querySelector('.author, .user-name, [class*="author"]');
        const likeEl = card.querySelector('.liked-count, [class*="like"]');
        
        if (titleEl) {
          items.push({
            title: titleEl.textContent?.trim() || '',
            desc: descEl?.textContent?.trim() || '',
            author: authorEl?.textContent?.trim() || '',
            likes: likeEl?.textContent?.trim() || '0'
          });
        }
      });
      
      return items;
    });
    
    console.log(`  ✅ 获取 ${notes.length} 条数据`);
    results.push(...notes);
    
  } catch (error: any) {
    console.log(`  ❌ 错误: ${error.message}`);
  }
  
  await browser.close();
  return results;
}

async function saveToDatabase(notes: any[]) {
  let saved = 0;
  
  for (const note of notes) {
    if (!note.title) continue;
    
    try {
      // 计算热度分数
      const likes = parseInt(note.likes) || 0;
      const heatScore = Math.min(likes, 99999);
      
      await prisma.viralCase.create({
        data: {
          title: note.title.substring(0, 200),
          content: note.desc?.substring(0, 1000) || '',
          platform: 'xiaohongshu',
          author: note.author || '未知',
          likes: likes,
          heatScore: heatScore,
          tags: ['保险', '小红书爆款'],
          url: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(note.title)}`,
          collectedAt: new Date(),
        }
      });
      saved++;
    } catch (error) {
      // 忽略重复数据
    }
  }
  
  return saved;
}

async function main() {
  console.log('='.repeat(50));
  console.log('🔥 小红书爆款数据采集 (Playwright)');
  console.log('='.repeat(50));
  
  let allNotes: any[] = [];
  
  // 采集每个关键词
  for (const keyword of KEYWORDS) {
    const notes = await collectXHS(keyword);
    allNotes.push(...notes);
    
    // 延时避免请求过快
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n📊 总计获取: ${allNotes.length} 条数据`);
  
  // 保存到数据库
  if (allNotes.length > 0) {
    const saved = await saveToDatabase(allNotes);
    console.log(`✅ 保存到数据库: ${saved} 条`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
