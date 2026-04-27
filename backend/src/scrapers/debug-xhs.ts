/**
 * 小红书调试脚本 - 检查页面内容
 */

import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  
  try {
    // 尝试移动端页面
    const url = 'https://www.xiaohongshu.com/search_result?keyword=重疾险&type=51';
    console.log('访问:', url);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    // 获取页面标题
    const title = await page.title();
    console.log('页面标题:', title);
    
    // 检查是否有登录提示
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('页面内容前500字:', bodyText);
    
    // 截图
    await page.screenshot({ path: '/tmp/xhs-debug.png', fullPage: true });
    console.log('截图已保存: /tmp/xhs-debug.png');
    
  } catch (error: any) {
    console.log('错误:', error.message);
  }
  
  await browser.close();
}

debug().catch(console.error);
