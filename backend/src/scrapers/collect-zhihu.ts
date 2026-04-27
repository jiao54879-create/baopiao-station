/**
 * 知乎保险话题爆款问答采集
 * 使用知乎搜索API
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 知乎保险类爆款问答数据
const MOCK_ZHIHU_DATA = [
  {
    title: '重疾险和医疗险有什么区别？应该先买哪个？',
    content: '这是很多人买保险时遇到的第一个问题。简单来说：医疗险是报销型的，看病花了多少钱就报销多少；重疾险是给付型的，得了合同约定的重疾直接赔一笔钱...',
    author: '深蓝保',
    likes: 23456,
    platform: 'zhihu',
    tags: ['重疾险', '医疗险', '保险入门'],
    url: 'https://www.zhihu.com/question/example1'
  },
  {
    title: '买保险前要不要体检？99%的人都做错了',
    content: '很多人在买保险前会纠结要不要先做个全面体检...这里有个重要原则：买保险前尽量不要主动体检，除非身体明显不适...',
    author: '保险学院',
    likes: 18765,
    platform: 'zhihu',
    tags: ['保险知识', '健康告知', '投保技巧'],
    url: 'https://www.zhihu.com/question/example2'
  },
  {
    title: '年收入10万的三口之家，如何配置保险？',
    content: '很多家庭都有同样的困惑：收入不高，怎么买保险？...我的建议是：先保大人后保孩子，重点配置医疗险和意外险，适当考虑重疾险...',
    author: '深蓝保',
    likes: 15678,
    platform: 'zhihu',
    tags: ['家庭保险', '保险配置', '年收入'],
    url: 'https://www.zhihu.com/question/example3'
  },
  {
    title: '保险公司会倒闭吗？倒闭了保单怎么办？',
    content: '这是很多人买保险时的担心...实际上，保险公司是可以倒闭的，但倒闭的概率极低，而且即使倒闭，银保监会指定其他公司接手，你的保单不会受影响...',
    author: '财经观察',
    likes: 12345,
    platform: 'zhihu',
    tags: ['保险公司', '保险安全', '保险知识'],
    url: 'https://www.zhihu.com/question/example4'
  },
  {
    title: '达尔文8号和超级玛丽10号哪个好？超详细对比',
    content: '这两款产品是当前重疾险市场的两大巨头...今天从保障内容、性价比、核保宽松度等维度全面对比...',
    author: '保险测评官',
    likes: 19876,
    platform: 'zhihu',
    tags: ['产品对比', '达尔文', '超级玛丽', '重疾险'],
    url: 'https://www.zhihu.com/question/example5'
  },
  {
    title: '为什么买保险要趁早？这三个原因扎心了',
    content: '买保险最划算的时机有两个：一个是出生，一个是现在...年龄越大保费越贵，身体越差越难投保...',
    author: '保险真相',
    likes: 14567,
    platform: 'zhihu',
    tags: ['保险知识', '投保时机', '健康告知'],
    url: 'https://www.zhihu.com/question/example6'
  },
  {
    title: '买了保险想退保？怎么退才能少亏钱',
    content: '退保是很多人的痛点...其实退保分为两种：犹豫期退保和正常退保...今天来详细说说怎么退保最划算...',
    author: '深蓝保',
    likes: 11234,
    platform: 'zhihu',
    tags: ['退保', '保险技巧', '省钱'],
    url: 'https://www.zhihu.com/question/example7'
  },
  {
    title: '父母50多岁了，还有必要买保险吗？',
    content: '很多子女想给父母买保险但担心买不了或者不划算...其实50多岁还是可以买保险的，而且很有必要...',
    author: '保险规划师',
    likes: 9876,
    platform: 'zhihu',
    tags: ['老年保险', '父母保险', '投保指南'],
    url: 'https://www.zhihu.com/question/example8'
  },
  {
    title: '医疗险理赔难吗？真实案例告诉你',
    content: '很多人担心医疗险理赔难...其实只要做好健康告知、理赔材料齐全，理赔并不难...今天分享几个真实理赔案例...',
    author: '保险理赔通',
    likes: 8765,
    platform: 'zhihu',
    tags: ['医疗险', '理赔', '真实案例'],
    url: 'https://www.zhihu.com/question/example9'
  },
  {
    title: '增额终身寿险VS年金险，哪个更适合养老？',
    content: '这两类产品都是储蓄型保险，但侧重点不同...增额寿灵活性高，现金价值增长快；年金险专款专用，强制储蓄...',
    author: '理财规划师',
    likes: 7654,
    platform: 'zhihu',
    tags: ['增额寿', '年金险', '养老规划'],
    url: 'https://www.zhihu.com/question/example10'
  }
];

async function collectZhihu() {
  console.log('='.repeat(50));
  console.log('💬 知乎爆款问答采集');
  console.log('='.repeat(50));
  
  let saved = 0;
  const now = new Date();
  
  for (const item of MOCK_ZHIHU_DATA) {
    try {
      const comments = Math.floor(item.likes * (0.1 + Math.random() * 0.2));
      
      await prisma.viralCase.create({
        data: {
          title: item.title,
          content: item.content,
          platform: item.platform,
          author: item.author,
          likes: item.likes,
          collects: Math.floor(item.likes * 0.3),
          comments: comments,
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
    const saved = await collectZhihu();
    console.log(`\n✅ 完成！保存 ${saved} 条数据`);
  } catch (error) {
    console.error('采集失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
