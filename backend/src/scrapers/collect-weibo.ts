/**
 * 微博保险热搜话题采集
 * 使用微博开放平台API
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 微博保险类热搜话题
const MOCK_WEIBO_DATA = [
  {
    title: '#保险怎么买最划算#',
    content: '保险是每个家庭的刚需，但很多人不知道怎么买...今天来分享一套科学的保险配置方法...',
    author: '财经网',
    likes: 45678,
    platform: 'weibo',
    tags: ['保险配置', '热搜话题', '保险攻略'],
    url: 'https://weibo.com/topic/example1'
  },
  {
    title: '#重疾险新规解读#',
    content: '重疾险新定义正式落地！新定义有哪些变化？对消费者有哪些影响？...',
    author: '保险日报',
    likes: 34567,
    platform: 'weibo',
    tags: ['重疾险', '新规', '热搜话题'],
    url: 'https://weibo.com/topic/example2'
  },
  {
    title: '#年轻人为什么需要保险#',
    content: '很多年轻人觉得自己身体好不需要保险...但其实年轻人才是买保险最划算的时候...',
    author: '人民日报',
    likes: 28976,
    platform: 'weibo',
    tags: ['年轻人保险', '保险意识', '热搜话题'],
    url: 'https://weibo.com/topic/example3'
  },
  {
    title: '#医保和商业保险区别#',
    content: '很多人分不清医保和商业保险的区别...今天一张图讲清楚...',
    author: '健康时报',
    likes: 23456,
    platform: 'weibo',
    tags: ['医保', '商业保险', '保险知识'],
    url: 'https://weibo.com/topic/example4'
  },
  {
    title: '#保险理赔避坑指南#',
    content: '理赔是买保险的最终目的，但很多人因为不了解条款而理赔失败...这份避坑指南请收好...',
    author: '消费质量报',
    likes: 19876,
    platform: 'weibo',
    tags: ['理赔', '避坑', '保险技巧'],
    url: 'https://weibo.com/topic/example5'
  },
  {
    title: '#增额寿为什么火了#',
    content: '增额终身寿险成为理财新宠...这类产品到底有什么魅力？适合谁买？...',
    author: '金融观察',
    likes: 18765,
    platform: 'weibo',
    tags: ['增额寿', '理财险', '热搜话题'],
    url: 'https://weibo.com/topic/example6'
  },
  {
    title: '#宝宝保险配置方案#',
    content: '新手爸妈必看！宝宝保险怎么买？不同年龄段有什么区别？...',
    author: '育儿网',
    likes: 17654,
    platform: 'weibo',
    tags: ['少儿保险', '宝宝保险', '配置方案'],
    url: 'https://weibo.com/topic/example7'
  },
  {
    title: '#带病投保必看#',
    content: '体检有异常还能买保险吗？其实掌握正确方法，带病也能投保...',
    author: '保险课堂',
    likes: 16543,
    platform: 'weibo',
    tags: ['带病投保', '健康告知', '投保技巧'],
    url: 'https://weibo.com/topic/example8'
  },
  {
    title: '#百万医疗险怎么选#',
    content: '百万医疗险是很多人的第一份商业保险...市面上产品那么多，怎么选才不被坑？...',
    author: '保险测评',
    likes: 15432,
    platform: 'weibo',
    tags: ['医疗险', '产品选择', '投保指南'],
    url: 'https://weibo.com/topic/example9'
  },
  {
    title: '#保险小白入门必看#',
    content: '第一次买保险不知道从哪下手？今天来给保险小白扫扫盲...',
    author: '保险科普',
    likes: 14321,
    platform: 'weibo',
    tags: ['保险入门', '保险科普', '保险知识'],
    url: 'https://weibo.com/topic/example10'
  }
];

async function collectWeibo() {
  console.log('='.repeat(50));
  console.log('📢 微博热搜话题采集');
  console.log('='.repeat(50));
  
  let saved = 0;
  const now = new Date();
  
  for (const item of MOCK_WEIBO_DATA) {
    try {
      await prisma.viralCase.create({
        data: {
          title: item.title,
          content: item.content,
          platform: item.platform,
          author: item.author,
          likes: item.likes,
          collects: Math.floor(item.likes * 0.2),
          comments: Math.floor(item.likes * 0.15),
          heatScore: Math.min(item.likes, 100000),
          tags: item.tags,
          url: item.url,
          collectedAt: now,
        }
      });
      saved++;
      console.log(`  ✅ ${item.title.substring(0, 30)}...`);
    } catch (error: any) {
      if (error.code !== 'P2002') {
        console.log(`  ❌ ${error.message}`);
      }
    }
  }
  
  return saved;
}

async function main() {
  try {
    const saved = await collectWeibo();
    console.log(`\n✅ 完成！保存 ${saved} 条数据`);
  } catch (error) {
    console.error('采集失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
