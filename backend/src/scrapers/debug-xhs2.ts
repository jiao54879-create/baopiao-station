/**
 * 小红书调试脚本 v2 - 使用正确的URL格式
 */

import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: false }); // 显示浏览器
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  
  try {
    // 小红书网页版
    const url = 'https://www.xiaohongshu.com/';
    console.log('访问首页:', url);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    
    // 获取页面标题
    const title = await page.title();
    console.log('页面标题:', title);
    
    // 检查URL
    console.log('当前URL:', page.url());
    
    // 如果需要登录，显示提示
    const loginBtn = await page.$('button:has-text("登录"), a:has-text("登录")');
    if (loginBtn) {
      console.log('⚠️ 需要登录！');
    }
    
    // 截图
    await page.screenshot({ path: '/tmp/xhs-home.png', fullPage: false });
    console.log('截图已保存');
    
    console.log('\n📌 请在打开的浏览器中手动登录小红书');
    console.log('登录后告诉我，我会继续采集数据');
    
    // 等待60秒让用户操作
    await page.waitForTimeout(60000);
    
    // 登录后截图
    await page.screenshot({ path: '/tmp/xhs-after-login.png', fullPage: true });
    console.log('登录后截图已保存');
    
  } catch (error: any) {
    console.log('错误:', error.message);
  }
  
  // 不要关闭浏览器，等待用户操作
  console.log('浏览器保持打开，按 Ctrl+C 结束');
  await new Promise(resolve => setTimeout(resolve, 60000));
  await browser.close();
}

debug().catch(console.error);
