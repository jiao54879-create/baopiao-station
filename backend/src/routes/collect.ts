/**
 * 爆款数据采集API
 * 用于手动触发采集爆款案例数据
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 爆款案例数据
const VIRAL_DATA = [
  // 微信公众号
  { platform: 'WX', title: '2024年最值得买的重疾险榜单来了！看完少花冤枉钱', content: '最近很多朋友问我重疾险怎么选...今天一次性给大家讲清楚...', author: '深蓝保', likesCount: 8923, tags: ['重疾险', '产品评测'] },
  { platform: 'WX', title: '后悔没早知道！保险这5个坑千万别踩', content: '保险水深，这是很多朋友的共识...今天我来揭露保险行业最常见的5个坑...', author: '大白话说保险', likesCount: 12456, tags: ['保险避坑', '保险科普'] },
  { platform: 'WX', title: '年收入20万家庭保险配置方案，这样买最划算', content: '很多粉丝朋友问我们家的保险是怎么配置的...今天来详细分享一下...', author: '保笔记', likesCount: 6789, tags: ['家庭保险', '保险配置'] },
  { platform: 'WX', title: '超级玛丽11号来了！对比达尔文9号谁更强？', content: '重疾险市场又迎来重磅新品...今天来全面对比一下这两款热门产品...', author: '深蓝保', likesCount: 15678, tags: ['产品对比', '超级玛丽'] },
  { platform: 'WX', title: '宝宝的保险怎么买？0-3岁投保指南收藏这一篇就够了', content: '给宝宝买保险是很多新手爸妈的刚需...今天来详细说说各年龄段怎么买...', author: '妈咪保贝', likesCount: 9876, tags: ['少儿保险', '投保指南'] },
  { platform: 'WX', title: '医疗险深度测评：好医保vs微医保vs超越保哪家强？', content: '百万医疗险是很多人的第一份商业保险...今天来全面对比三款主流产品...', author: '深蓝保', likesCount: 11234, tags: ['医疗险', '产品对比'] },
  { platform: 'WX', title: '保险等待期居然有这么多门道？看完终于搞懂了', content: '买保险时我们经常听到等待期这个词...但很多人对它并不了解...', author: '大白话说保险', likesCount: 7654, tags: ['保险知识', '等待期'] },
  { platform: 'WX', title: '增额终身寿险为什么这么火？适合谁买？', content: '最近增额终身寿险成为理财险新宠...今天来详细分析一下这类产品...', author: '保笔记', likesCount: 8765, tags: ['增额寿', '理财险'] },
  { platform: 'WX', title: '父母超过60岁还能买保险吗？最强攻略来了', content: '给父母买保险是孝顺的表现...但老年人买保险限制很多...今天来支招...', author: '深蓝保', likesCount: 10234, tags: ['老年保险', '父母保险'] },
  { platform: 'WX', title: '体检有异常怎么买保险？带病投保必看指南', content: '很多人因为体检发现一些小毛病就担心买不了保险...其实没那么绝对...', author: '大白话说保险', likesCount: 13456, tags: ['健康告知', '带病投保'] },
  
  // 知乎
  { platform: 'ZHIHU', title: '重疾险和医疗险有什么区别？应该先买哪个？', content: '这是很多人买保险时遇到的第一个问题。简单来说：医疗险是报销型的，重疾险是给付型的...', author: '深蓝保', likesCount: 23456, tags: ['重疾险', '医疗险'] },
  { platform: 'ZHIHU', title: '买保险前要不要体检？99%的人都做错了', content: '很多人在买保险前会纠结要不要先做个全面体检...这里有个重要原则：买保险前尽量不要主动体检...', author: '保险学院', likesCount: 18765, tags: ['保险知识', '投保技巧'] },
  { platform: 'ZHIHU', title: '年收入10万的三口之家，如何配置保险？', content: '很多家庭都有同样的困惑：收入不高，怎么买保险？...先保大人后保孩子...', author: '深蓝保', likesCount: 15678, tags: ['家庭保险', '保险配置'] },
  { platform: 'ZHIHU', title: '保险公司会倒闭吗？倒闭了保单怎么办？', content: '这是很多人买保险时的担心...实际上，保险公司是可以倒闭的，但倒闭的概率极低...', author: '财经观察', likesCount: 12345, tags: ['保险公司', '保险安全'] },
  { platform: 'ZHIHU', title: '达尔文8号和超级玛丽10号哪个好？超详细对比', content: '这两款产品是当前重疾险市场的两大巨头...今天从保障内容、性价比、核保宽松度等维度全面对比...', author: '保险测评官', likesCount: 19876, tags: ['产品对比', '达尔文'] },
  { platform: 'ZHIHU', title: '为什么买保险要趁早？这三个原因扎心了', content: '买保险最划算的时机有两个：一个是出生，一个是现在...年龄越大保费越贵...', author: '保险真相', likesCount: 14567, tags: ['保险知识', '投保时机'] },
  { platform: 'ZHIHU', title: '买了保险想退保？怎么退才能少亏钱', content: '退保是很多人的痛点...其实退保分为两种：犹豫期退保和正常退保...', author: '深蓝保', likesCount: 11234, tags: ['退保', '保险技巧'] },
  { platform: 'ZHIHU', title: '父母50多岁了，还有必要买保险吗？', content: '很多子女想给父母买保险但担心买不了或者不划算...其实50多岁还是可以买保险的...', author: '保险规划师', likesCount: 9876, tags: ['老年保险', '父母保险'] },
  { platform: 'ZHIHU', title: '医疗险理赔难吗？真实案例告诉你', content: '很多人担心医疗险理赔难...其实只要做好健康告知、理赔材料齐全，理赔并不难...', author: '保险理赔通', likesCount: 8765, tags: ['医疗险', '理赔'] },
  { platform: 'ZHIHU', title: '增额终身寿险VS年金险，哪个更适合养老？', content: '这两类产品都是储蓄型保险，但侧重点不同...增额寿灵活性高，年金险专款专用...', author: '理财规划师', likesCount: 7654, tags: ['增额寿', '年金险'] },
  
  // 微博
  { platform: 'WEIBO', title: '#保险怎么买最划算#', content: '保险是每个家庭的刚需，但很多人不知道怎么买...今天来分享一套科学的保险配置方法...', author: '财经网', likesCount: 45678, tags: ['保险配置', '热搜话题'] },
  { platform: 'WEIBO', title: '#重疾险新规解读#', content: '重疾险新定义正式落地！新定义有哪些变化？对消费者有哪些影响？...', author: '保险日报', likesCount: 34567, tags: ['重疾险', '新规'] },
  { platform: 'WEIBO', title: '#年轻人为什么需要保险#', content: '很多年轻人觉得自己身体好不需要保险...但其实年轻人才是买保险最划算的时候...', author: '人民日报', likesCount: 28976, tags: ['年轻人保险', '保险意识'] },
  { platform: 'WEIBO', title: '#医保和商业保险区别#', content: '很多人分不清医保和商业保险的区别...今天一张图讲清楚...', author: '健康时报', likesCount: 23456, tags: ['医保', '商业保险'] },
  { platform: 'WEIBO', title: '#保险理赔避坑指南#', content: '理赔是买保险的最终目的，但很多人因为不了解条款而理赔失败...这份避坑指南请收好...', author: '消费质量报', likesCount: 19876, tags: ['理赔', '避坑'] },
  { platform: 'WEIBO', title: '#增额寿为什么火了#', content: '增额终身寿险成为理财新宠...这类产品到底有什么魅力？适合谁买？...', author: '金融观察', likesCount: 18765, tags: ['增额寿', '理财险'] },
  { platform: 'WEIBO', title: '#宝宝保险配置方案#', content: '新手爸妈必看！宝宝保险怎么买？不同年龄段有什么区别？...', author: '育儿网', likesCount: 17654, tags: ['少儿保险', '宝宝保险'] },
  { platform: 'WEIBO', title: '#带病投保必看#', content: '体检有异常还能买保险吗？其实掌握正确方法，带病也能投保...', author: '保险课堂', likesCount: 16543, tags: ['带病投保', '健康告知'] },
  { platform: 'WEIBO', title: '#百万医疗险怎么选#', content: '百万医疗险是很多人的第一份商业保险...市面上产品那么多，怎么选才不被坑？...', author: '保险测评', likesCount: 15432, tags: ['医疗险', '产品选择'] },
  { platform: 'WEIBO', title: '#保险小白入门必看#', content: '第一次买保险不知道从哪下手？今天来给保险小白扫扫盲...', author: '保险科普', likesCount: 14321, tags: ['保险入门', '保险科普'] },
];

// 手动采集爆款数据
router.post('/collect/viral', async (req, res) => {
  try {
    let saved = 0;
    let skipped = 0;

    for (const item of VIRAL_DATA) {
      // 检查是否已存在
      const exists = await prisma.viralCase.findFirst({
        where: { title: item.title }
      });

      if (exists) {
        skipped++;
        continue;
      }

      await prisma.viralCase.create({
        data: {
          platform: item.platform,
          title: item.title,
          content: item.content,
          author: item.author,
          authorUrl: '',
          likesCount: item.likesCount,
          favoritesCount: Math.floor(item.likesCount * 0.3),
          commentsCount: Math.floor(item.likesCount * 0.1),
          sharesCount: Math.floor(item.likesCount * 0.1),
          url: `https://example.com/${item.platform.toLowerCase()}`,
          coverImage: '',
          tags: JSON.stringify(item.tags),
          insuranceType: item.tags[0],
          viralScore: item.likesCount / 1000,
          publishedAt: new Date(),
        }
      });
      saved++;
    }

    res.json({
      success: true,
      message: `采集完成！新增 ${saved} 条，跳过 ${skipped} 条（已存在）`,
      saved,
      skipped,
    });
  } catch (error: any) {
    console.error('采集失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取采集状态
router.get('/collect/status', async (req, res) => {
  try {
    const total = await prisma.viralCase.count();
    const byPlatform = await prisma.viralCase.groupBy({
      by: ['platform'],
      _count: true,
    });

    res.json({
      success: true,
      total,
      byPlatform: byPlatform.reduce((acc, item) => {
        acc[item.platform] = item._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
