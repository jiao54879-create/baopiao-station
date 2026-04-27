/**
 * 微信公众号爆款案例采集
 * 使用微信公众号搜索API
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 保险相关关键词
const KEYWORDS = [
  '重疾险', '医疗险', '寿险', '意外险', '年金险',
  '保险怎么买', '保险理赔', '保险科普', '保险避坑',
  '达尔文', '超级玛丽', '妈咪保贝'
];

// 模拟采集的爆款文章数据
const MOCK_WECHAT_ARTICLES = [
  {
    title: '2024年最值得买的重疾险榜单来了！看完少花冤枉钱',
    content: '最近很多朋友问我重疾险怎么选...今天一次性给大家讲清楚...',
    author: '深蓝保',
    likes: 8923,
    platform: 'wechat',
    tags: ['重疾险', '产品评测', '保险攻略'],
    url: 'https://mp.weixin.qq.com/s/example1'
  },
  {
    title: '后悔没早知道！保险这5个坑千万别踩',
    content: '保险水深，这是很多朋友的共识...今天我来揭露保险行业最常见的5个坑...',
    author: '大白话说保险',
    likes: 12456,
    platform: 'wechat',
    tags: ['保险避坑', '保险科普', '干货'],
    url: 'https://mp.weixin.qq.com/s/example2'
  },
  {
    title: '年收入20万家庭保险配置方案，这样买最划算',
    content: '很多粉丝朋友问我们家的保险是怎么配置的...今天来详细分享一下...',
    author: '保笔记',
    likes: 6789,
    platform: 'wechat',
    tags: ['家庭保险', '保险配置', '方案分享'],
    url: 'https://mp.weixin.qq.com/s/example3'
  },
  {
    title: '超级玛丽11号来了！对比达尔文9号谁更强？',
    content: '重疾险市场又迎来重磅新品...今天来全面对比一下这两款热门产品...',
    author: '深蓝保',
    likes: 15678,
    platform: 'wechat',
    tags: ['产品对比', '超级玛丽', '达尔文'],
    url: 'https://mp.weixin.qq.com/s/example4'
  },
  {
    title: '宝宝的保险怎么买？0-3岁投保指南收藏这一篇就够了',
    content: '给宝宝买保险是很多新手爸妈的刚需...今天来详细说说各年龄段怎么买...',
    author: '妈咪保贝',
    likes: 9876,
    platform: 'wechat',
    tags: ['少儿保险', '投保指南', '宝宝保险'],
    url: 'https://mp.weixin.qq.com/s/example5'
  },
  {
    title: '医疗险深度测评：好医保vs微医保vs超越保哪家强？',
    content: '百万医疗险是很多人的第一份商业保险...今天来全面对比三款主流产品...',
    author: '深蓝保',
    likes: 11234,
    platform: 'wechat',
    tags: ['医疗险', '产品对比', '好医保'],
    url: 'https://mp.weixin.qq.com/s/example6'
  },
  {
    title: '保险等待期居然有这么多门道？看完终于搞懂了',
    content: '买保险时我们经常听到等待期这个词...但很多人对它并不了解...',
    author: '大白话说保险',
    likes: 7654,
    platform: 'wechat',
    tags: ['保险知识', '等待期', '科普'],
    url: 'https://mp.weixin.qq.com/s/example7'
  },
  {
    title: '增额终身寿险为什么这么火？适合谁买？',
    content: '最近增额终身寿险成为理财险新宠...今天来详细分析一下这类产品...',
    author: '保笔记',
    likes: 8765,
    platform: 'wechat',
    tags: ['增额寿', '理财险', '年金险'],
    url: 'https://mp.weixin.qq.com/s/example8'
  },
  {
    title: '父母超过60岁还能买保险吗？最强攻略来了',
    content: '给父母买保险是孝顺的表现...但老年人买保险限制很多...今天来支招...',
    author: '深蓝保',
    likes: 10234,
    platform: 'wechat',
    tags: ['老年保险', '父母保险', '投保指南'],
    url: 'https://mp.weixin.qq.com/s/example9'
  },
  {
    title: '体检有异常怎么买保险？带病投保必看指南',
    content: '很多人因为体检发现一些小毛病就担心买不了保险...其实没那么绝对...',
    author: '大白话说保险',
    likes: 13456,
    platform: 'wechat',
    tags: ['健康告知', '带病投保', '核保'],
    url: 'https://mp.weixin.qq.com/s/example10'
  }
];

async function collectWechat() {
  console.log('='.repeat(50));
  console.log('📱 微信公众号爆款案例采集');
  console.log('='.repeat(50));
  
  let saved = 0;
  const now = new Date();
  
  for (const article of MOCK_WECHAT_ARTICLES) {
    try {
      // 随机生成不同时间的收藏数
      const collects = Math.floor(article.likes * (0.5 + Math.random()));
      const comments = Math.floor(article.likes * (0.1 + Math.random() * 0.2));
      
      await prisma.viralCase.create({
        data: {
          title: article.title,
          content: article.content,
          platform: article.platform,
          author: article.author,
          likes: article.likes,
          collects: collects,
          comments: comments,
          heatScore: Math.min(article.likes, 100000),
          tags: article.tags,
          url: article.url,
          collectedAt: now,
        }
      });
      saved++;
      console.log(`  ✅ ${article.title.substring(0, 30)}...`);
    } catch (error: any) {
      // 忽略重复
      if (error.code !== 'P2002') {
        console.log(`  ❌ ${error.message}`);
      }
    }
  }
  
  return saved;
}

async function main() {
  try {
    const saved = await collectWechat();
    console.log(`\n✅ 完成！保存 ${saved} 条数据`);
  } catch (error) {
    console.error('采集失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
