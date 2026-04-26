// 定时任务调度器
import cron from 'node-cron';
import { prisma } from '../index.js';

// 导入所有爬虫
import cbircScraper from './cbirc.js';
import jinribaoScraper from './jinribao.js';
import socialScraper from './social.js';
import techScraper from './tech.js';
import xhsScraper from './xiaohongshu.js';
import financeScraper from './finance.js';
import educationScraper from './education.js';
import insuranceScraper from './insurance.js';
import policyScraper from './policy.js';
import productScraper from './product.js';
import productNewsScraper from './product_news.js';
import iachinaScraper from './iachina.js';
import wechatScraper from './wechat_public.js';

interface ScrapeJob {
  name: string;
  scraper: any;
  schedule: string; // cron 表达式
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

// 爬虫任务配置 - 每日一次
const scrapeJobs: ScrapeJob[] = [
  {
    name: '保险行业资讯',
    scraper: insuranceScraper,
    schedule: '0 9 * * *', // 每天上午9点
    enabled: true
  },
  {
    name: '政策法规动态',
    scraper: policyScraper,
    schedule: '0 9 * * *', // 每天上午9点
    enabled: true
  },
  {
    name: '保险产品资讯',
    scraper: productScraper,
    schedule: '0 9 * * *', // 每天上午9点
    enabled: true
  },
  {
    name: '银保监会动态',
    scraper: cbircScraper,
    schedule: '0 9 * * *', // 每天上午9点
    enabled: true
  },
  {
    name: '中保协动态',
    scraper: iachinaScraper,
    schedule: '0 9 * * *', // 每天上午9点
    enabled: true
  },
  {
    name: '微信公众号产品分析',
    scraper: wechatScraper,
    schedule: '0 10 * * *', // 每天上午10点
    enabled: true
  },
  {
    name: '保险公司官网动态',
    scraper: productNewsScraper,
    schedule: '0 10 * * *', // 每天上午10点
    enabled: true
  },
  {
    name: '保险行业资讯',
    scraper: jinribaoScraper,
    schedule: '0 9 * * *', // 每天上午9点
    enabled: true
  },
  {
    name: '社会热点',
    scraper: socialScraper,
    schedule: '0 9 * * *', // 每天上午9点
    enabled: true
  },
  {
    name: '科技热点',
    scraper: techScraper,
    schedule: '0 9 * * *', // 每天上午9点
    enabled: true
  },
  {
    name: '小红书爆款',
    scraper: xhsScraper,
    schedule: '0 9 * * *', // 每天上午9点
    enabled: true
  },
  {
    name: '金融行业动态',
    scraper: financeScraper,
    schedule: '0 9 * * *', // 每天上午9点
    enabled: true
  },
  {
    name: '教育行业动态',
    scraper: educationScraper,
    schedule: '0 9 * * *', // 每天上午9点
    enabled: true
  }
];

class ScraperScheduler {
  private tasks: cron.ScheduledTask[] = [];
  private isRunning: boolean = false;

  // 启动所有定时任务
  start() {
    if (this.isRunning) {
      console.log('调度器已在运行中');
      return;
    }

    console.log('🚀 数据采集调度器启动');
    this.isRunning = true;

    scrapeJobs.forEach((job, index) => {
      if (!job.enabled) {
        console.log(`⏸️ 跳过任务: ${job.name} (已禁用)`);
        return;
      }

      const task = cron.schedule(job.schedule, async () => {
        await this.runJob(job);
      });

      this.tasks.push(task);
      console.log(`✅ 已调度任务: ${job.name} (${job.schedule})`);
    });

    // 保存任务状态到数据库
    this.syncTasksToDB();

    console.log(`\n📊 共启动 ${this.tasks.length} 个采集任务`);
  }

  // 停止所有定时任务
  stop() {
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
    this.isRunning = false;
    console.log('⏹️ 数据采集调度器已停止');
  }

  // 执行单个任务
  async runJob(job: ScrapeJob) {
    const startTime = Date.now();
    console.log(`\n🔄 开始执行: ${job.name}`);

    try {
      const result = await job.scraper.scrape();

      if (result.success) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ ${job.name} 完成: 采集 ${result.data?.length || 0} 条, 新增 ${result.count || 0} 条 (耗时 ${duration}s)`);

        // 更新任务状态
        job.lastRun = new Date();
      } else {
        console.error(`❌ ${job.name} 失败: ${result.error}`);
      }
    } catch (error: any) {
      console.error(`❌ ${job.name} 异常: ${error.message}`);
    }
  }

  // 手动执行所有任务
  async runAll() {
    console.log('\n📦 手动执行所有采集任务...\n');

    for (const job of scrapeJobs) {
      if (job.enabled) {
        await this.runJob(job);
        // 每个任务间隔2秒
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n📦 所有任务执行完成');
  }

  // 手动执行单个任务
  async runOne(name: string) {
    const job = scrapeJobs.find(j => j.name === name);
    if (job) {
      await this.runJob(job);
    } else {
      console.error(`未找到任务: ${name}`);
    }
  }

  // 获取任务状态
  getStatus() {
    return scrapeJobs.map(job => ({
      name: job.name,
      enabled: job.enabled,
      schedule: job.schedule,
      lastRun: job.lastRun,
      nextRun: job.nextRun
    }));
  }

  // 同步任务状态到数据库
  private async syncTasksToDB() {
    for (const job of scrapeJobs) {
      try {
        await prisma.scrapeTask.upsert({
          where: { id: scrapeJobs.indexOf(job) + 1 },
          create: {
            id: scrapeJobs.indexOf(job) + 1,
            name: job.name,
            source: job.scraper.name,
            sourceUrl: '',
            category: job.scraper.category,
            schedule: job.schedule,
            status: job.enabled ? 'ACTIVE' : 'PAUSED'
          },
          update: {
            name: job.name,
            schedule: job.schedule,
            status: job.enabled ? 'ACTIVE' : 'PAUSED'
          }
        });
      } catch (e) {
        // 忽略错误
      }
    }
  }

  // 更新任务状态
  async toggleTask(name: string, enabled: boolean) {
    const job = scrapeJobs.find(j => j.name === name);
    if (job) {
      job.enabled = enabled;
      await this.syncTasksToDB();
      console.log(`${enabled ? '启用' : '禁用'}任务: ${name}`);
    }
  }
}

// 导出单例
const scheduler = new ScraperScheduler();
export default scheduler;

// 如果直接运行此文件，执行所有任务
if (process.argv[1]?.includes('scheduler')) {
  scheduler.runAll();
}
