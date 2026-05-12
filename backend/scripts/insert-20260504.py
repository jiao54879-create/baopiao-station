#!/usr/bin/env python3
"""
2026-05-04 每日采集数据入库脚本
将 WebSearch 采集的内容（已 AI 评分）写入 SQLite
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '../prisma/dev.db')

collected_items = [
    # (platform, title, content, author, likes, favorites, comments, shares, url, tags, insuranceType, viralScore, analysis, publishedAt)
    ('ZHIHU', '3款热门重疾险横评：超级玛丽16号vs达尔文12号vs完美人生8号',
     '超级玛丽16号、达尔文12号、完美人生8号三款顶流重疾险全面对比，从基础责任、特色保障、核保友好度、性价比四个维度横向评测',
     '知乎测评', 8500, 3200, 560, 280,
     'https://zhuanlan.zhihu.com/p/2033143070384994078',
     '["重疾险","达尔文12号","超级玛丽16号","产品对比"]',
     'CRITICAL_ILLNESS', 9.5,
     '三款顶流产品横评，时效性极强，覆盖面广，用户决策刚需内容',
     '2026-04-30'),

    ('NEWS', '达尔文12号vs超级玛丽16号，2026年重疾险"王座"之争',
     '深度对比达尔文12号与超级玛丽16号保障差异，超级玛丽16号自带重疾医疗金，40万保额实际保障达52万+；达尔文12号性价比更高，6710元/年',
     '搜狐财经', 6200, 2100, 380, 190,
     'https://www.sohu.com/a/1012385198_121044670',
     '["重疾险","达尔文12号","超级玛丽16号","产品对比"]',
     'CRITICAL_ILLNESS', 9.3,
     '产品PK类爆款，标题对抗感强，直接对比核心卖点，受众精准',
     '2026-04-21'),

    ('NEWS', '4月重疾险大换血！超级玛丽16号对比达尔文12号',
     '4月重疾险市场大换血，5款顶配产品推荐。超级玛丽16号和达尔文12号详细对比，随生命表更替和预定利率下调，后续新品可能涨价',
     '慧择', 5800, 2400, 420, 210,
     'https://xuexi.huize.com/study/detal-547209.html',
     '["重疾险","达尔文12号","超级玛丽16号","涨价预警"]',
     'CRITICAL_ILLNESS', 9.1,
     '时效性+紧迫感标题，"大换血"制造焦虑，涨价预警促转化',
     '2026-04-07'),

    ('ZHIHU', '顶流重疾险pk！超级玛丽16号上线后，我却更推荐达尔文12号',
     '深蓝保硬碰硬对比超级玛丽16号和达尔文12号，达尔文12号在性价比上更具优势，提醒高性价比产品可能随时下架',
     '深蓝保', 7200, 2800, 490, 230,
     'https://www.shenlanbao.com/zhinan/2041475205914157056',
     '["重疾险","达尔文12号","超级玛丽16号","深蓝保"]',
     'CRITICAL_ILLNESS', 9.0,
     '权威机构测评+反直觉结论（新出却不推），引发好奇与讨论',
     '2026-04-07'),

    ('NEWS', '超级玛丽16号领衔！2026年热门成人重疾险全面横评',
     '2026年成人重疾险三剑客——达尔文12号、超级玛丽16号、完美人生8号，各有绝活。从基础责任、特色保障、核保友好度、性价比四维度对比',
     '什么值得买', 4500, 1900, 320, 160,
     'https://post.smzdm.com/p/aqr7e83k/',
     '["重疾险","产品对比","成人重疾"]',
     'CRITICAL_ILLNESS', 8.8,
     '什么值得买平台背书，横评内容全面，适合决策参考',
     '2026-04-28'),

    ('ZHIHU', '超级玛丽16号对比达尔文12号，有哪些不同？看完就知道选哪个',
     '两款热门重疾险详细对比分析，帮助消费者根据自身需求选择合适产品',
     '知乎测评', 3800, 1500, 280, 140,
     'https://zhuanlan.zhihu.com/p/2025522611648570233',
     '["重疾险","达尔文12号","超级玛丽16号"]',
     'CRITICAL_ILLNESS', 8.5,
     '直接对比型内容，标题解决用户选择困难，实用性强',
     '2026-04-09'),

    # 监管政策
    ('NEWS', '央视曝光：分红险误导、医疗险推诿被划红线！保险消费者"避坑护身符"来了',
     '国家金融监管总局出台新规整治分红险误导销售和医疗险理赔推诿，买保险被高收益忽悠、理赔遭遇互相推诿的痛点迎来针对性整治',
     '央视新闻', 12000, 5600, 890, 670,
     'https://news.cctv.cn/2026/04/12/ARTIDcbE1zipBKme0M1K5iSl260412.shtml',
     '["保险监管","分红险","医疗险","消费者权益"]',
     'INSURANCE', 9.6,
     '央视权威背书+消费者痛点共鸣，"避坑护身符"标题极具传播力',
     '2026-04-12'),

    ('NEWS', '2026年保险业监管重点与行业走向',
     '保险业监管总体基调：从严监管、防范风险、保护消费者权益。五大方向：公司治理、科技赋能、消费者权益、产品创新、资金运用',
     '搜狐财经', 4200, 1800, 260, 150,
     'https://www.sohu.com/a/1001831956_122644701',
     '["保险监管","行业趋势","2026"]',
     'INSURANCE', 8.7,
     '行业趋势解读，专业人士参考价值高，政策面信息差内容',
     '2026-03-27'),

    ('NEWS', '重磅！2026年中国及31省市保险行业政策汇总及解读',
     '国家引导商业保险补充医疗保障、严格规范资管产品信息披露、全面推进行业数字化与智能化升级，构建"保障更可及、运作更透明、发展更智能"的监管框架',
     '前瞻产业研究院', 3500, 1600, 180, 120,
     'https://www.qianzhan.com/analyst/detail/220/260324-c8de261e.html',
     '["保险政策","行业汇总","监管框架"]',
     'INSURANCE', 8.4,
     '政策汇总类权威内容，适合从业者参考，长尾搜索流量大',
     '2026-03-24'),

    ('NEWS', '监管升级：2026年保险业五大关键方向深度解析',
     '2026年保险业监管聚焦公司治理、科技赋能、消费者权益、产品创新、资金运用五大方向，深度剖析监管政策走向',
     '什么值得买', 2800, 1200, 150, 90,
     'https://post.smzdm.com/p/amokl8ep/',
     '["保险监管","行业趋势","深度解析"]',
     'INSURANCE', 8.2,
     '监管方向深度解读，专业性强，但传播性一般',
     '2026-01-18'),

    # 行业数据
    ('NEWS', '保险业一季度赔付支出达8893亿元，同比增长7.5%',
     '五大上市险企2026年一季报全部披露，中国人寿、中国人保、中国太保、中国平安、新华保险负债端各有经营亮点，保险业赔付支出8893亿元同比增7.5%',
     '中国经济网', 3200, 1400, 210, 130,
     'http://finance.ce.cn/insurance/',
     '["保险数据","一季度","赔付","上市险企"]',
     'INSURANCE', 8.3,
     '行业数据类内容，权威性强，适合引用作为内容素材',
     '2026-04-29'),

    ('NEWS', '中国保险行业协会2026年第一次例行新闻发布会实录',
     '2025年保险业"十四五"收官之年，保险业坚持服务实体经济，保障能力持续增强。一季度行业数据发布',
     '中国保险行业协会', 2600, 1100, 160, 80,
     'https://www.iachina.cn/art/2026/4/27/art_9997_108997.html',
     '["保险行业","协会发布","一季度数据"]',
     'INSURANCE', 8.0,
     '协会官方发布，权威数据来源，适合引用',
     '2026-04-27'),

    # 医疗险
    ('ZHIHU', '2026年百万医疗险哪款好？3月最新推荐榜单',
     '对比几十款百万医疗险，选出3款推荐：55岁前首选太平洋蓝医保好医，包含大公司产品、互联网产品和网红产品横向对比',
     '知乎测评', 5600, 2300, 380, 190,
     'https://zhuanlan.zhihu.com/p/1946872431445770298',
     '["百万医疗险","医疗险","太平洋蓝医保","推荐"]',
     'MEDICAL', 8.9,
     '医疗险推荐榜单，月度更新时效性强，用户决策刚需',
     '2026-03-11'),

    ('NEWS', '中年人的底气：一份保证保终身、0免赔的保险',
     '太平洋蓝医保甄选版测评，保证续保终身、0免赔额，2.1万点赞，适合中年人医疗保障规划',
     '抖音/太平洋健康', 21000, 8500, 1200, 560,
     'https://www.douyin.com/video/7634866835074059526',
     '["百万医疗险","太平洋蓝医保","0免赔","中年保障"]',
     'MEDICAL', 9.2,
     '抖音2.1万赞爆款，情绪标题+场景化表达，传播力极强',
     '2026-05-01'),

    ('NEWS', '财险加速、寿险失速，万亿级健康险市场寻找下一个爆款',
     '2025年1-5月保险业原保费3万亿同比增3.8%，人身险健康险保费3879亿元仅增0.9%，财产险健康险1435亿元快速增长，健康险市场格局正在重塑',
     '新浪财经', 4800, 2000, 340, 170,
     'https://finance.sina.com.cn/jjxw/2025-07-01/doc-infcytxf5203252.shtml',
     '["健康险","行业数据","市场趋势"]',
     'HEALTH', 8.6,
     '行业趋势分析，数据支撑充分，"寻找爆款"标题吸引从业者',
     '2025-07-01'),

    # 重疾险选购
    ('ZHIHU', '重疾险怎么买？2025年最新重疾险排行榜+10月推荐清单',
     '重疾险选购全攻略：保额设定、保障期限、缴费期选择、疾病覆盖面、等待期、豁免条款等核心维度解析',
     '知乎测评', 6500, 2700, 430, 220,
     'https://zhuanlan.zhihu.com/p/1959637815680832555',
     '["重疾险","选购指南","推荐清单"]',
     'CRITICAL_ILLNESS', 8.7,
     '选购指南+榜单组合，覆盖决策全流程，实用性强',
     '2025-10-09'),

    ('NEWS', '2025目前最好的重疾险排名，深蓝保推荐这些',
     '深蓝保8年专业沉淀与18亿阅读量，通过"数据+专家"双轮驱动测评体系，为消费者筛选高性价比重疾险',
     '深蓝保/搜狐', 5200, 2200, 360, 180,
     'https://www.sohu.com/a/919113474_274033',
     '["重疾险","深蓝保","排名推荐"]',
     'CRITICAL_ILLNESS', 8.5,
     '权威机构背书+数据化测评，品牌信任度高',
     '2025-07-30'),

    ('NEWS', '2026重疾险避坑指南！超级玛丽15号vs达尔文12号，少花5千也能买好保险',
     '以超级玛丽15号和达尔文12号为例，对比5千和1万保费的保障差异，附2026最新重疾险推荐清单',
     '新浪财经', 4100, 1800, 290, 150,
     'https://cj.sina.com.cn/articles/view/7879922977/1d5ae152101901ccke',
     '["重疾险","避坑指南","达尔文12号","性价比"]',
     'CRITICAL_ILLNESS', 8.8,
     '"少花5千"痛点标题+避坑标签，精准打击用户价格焦虑',
     '2026-03-14'),

    # 达尔文系列
    ('ZHIHU', '2025年最硬核重疾险测评：30岁后买达尔文11号，4大理由',
     '从真实用户+保险内行人双重视角深度测评达尔文11号，被称为2025年重疾险"六边形战士"',
     '知乎测评', 3800, 1600, 270, 130,
     'https://zhuanlan.zhihu.com/p/1928491474376438411',
     '["达尔文11号","重疾险","测评","30岁"]',
     'CRITICAL_ILLNESS', 8.3,
     '双重视角测评，"六边形战士"标签记忆点强，30岁人群精准',
     '2025-07-16'),

    ('NEWS', '深度解读达尔文12号：5个优点1个不足',
     '达尔文12号5大优势：心肌炎等4款疾病不要求住院天数即赔，属行业唯二；1个不足需注意',
     '网易', 3500, 1500, 240, 120,
     'https://www.163.com/dy/article/K918DVE905563XV1.html',
     '["达尔文12号","重疾险","优缺点","心肌炎"]',
     'CRITICAL_ILLNESS', 8.6,
     '优缺点结构清晰，心肌炎理赔亮点是独家卖点，差异化内容',
     '2025-09-09'),

    # 少儿/理赔案例
    ('NEWS', '别因体检异常错失机会！26岁投保50万重疾，8年后确诊胰腺癌获赔50万',
     '26岁刘女士投保50万重疾险，2025年体检发现胰腺肿物确诊恶性肿瘤，理赔50万+豁免7.53万保费，保障继续有效',
     '抖音保险', 15000, 6200, 980, 750,
     'https://www.douyin.com/video/7635711232523111722',
     '["重疾险","理赔案例","胰腺癌","真实案例"]',
     'CRITICAL_ILLNESS', 9.4,
     '真实理赔案例，1.5万赞爆款，故事性强，情绪冲击大，极具说服力',
     '2026-05-01'),

    # 一年期重疾
    ('NEWS', '一年期重疾险来了，重疾险新变局？',
     '人保重疾险2025版，27岁健康男性30万保障+可选责任仅需399元，一年期重疾险打破传统长期重疾险格局',
     '新浪财经', 4200, 1800, 310, 160,
     'https://news.sina.com.cn/sx/2025-07-28/detail-infhywqz5801081.shtml',
     '["一年期重疾","人保","低价重疾","新变局"]',
     'CRITICAL_ILLNESS', 8.5,
     '"399元"价格冲击+行业变局话题，引发讨论与关注',
     '2025-07-28'),

    # 免健康告知
    ('ZHIHU', '2025闭眼入！3款0免赔免健康告知医疗险对比测评',
     '免健康告知保险大爆发：众民保、国寿惠享保、人保长相安3号、平安易民保横向对比，含高端市场产品分析',
     '笨小保', 5100, 2200, 350, 180,
     'https://zhuanlan.zhihu.com/p/29869647835',
     '["免健康告知","医疗险","众民保","惠享保"]',
     'MEDICAL', 8.8,
     '"闭眼入"强推荐+免健康告知痛点，覆盖非标体人群刚需',
     '2025-03-15'),

    # 小红书趋势
    ('XHS', '尼尔森IQ X 小红书：2025-2026医药健康行业消费趋势白皮书',
     '小红书联合尼尔森IQ发布白皮书，聚焦"人"这一核心变量，医药健康行业消费趋势洞察',
     '尼尔森IQ', 2800, 1200, 180, 95,
     'https://nielseniq.cn/global/zh/insights/report/2025/xiaohongshu-healthcare-whitepaper/',
     '["小红书","健康趋势","白皮书","消费洞察"]',
     'HEALTH', 8.1,
     '平台+权威机构联合报告，数据价值高，适合引用做内容',
     '2025-10-21'),

    # 保险公司安全性
    ('NEWS', '超级玛丽、达尔文、大黄蜂……背后的保险公司都没听过，靠谱吗？',
     '网红保险产品背后的中小保险公司安全性分析，买了保险后安全性到底靠什么保障？保险公司实力与产品权益保障的关系',
     '搜狐/头条', 5600, 2400, 380, 200,
     'https://www.sohu.com/a/927191686_121118710',
     '["保险公司","安全性","达尔文","超级玛丽"]',
     'CRITICAL_ILLNESS', 8.7,
     '直击用户"小公司不靠谱"的普遍疑虑，解惑类爆款',
     '2025-08-23'),
]

def main():
    print('=' * 60)
    print('🚀 爆款情报站 - 2026-05-04 数据入库')
    print('=' * 60)

    if not os.path.exists(DB_PATH):
        print(f'❌ 数据库文件不存在: {DB_PATH}')
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 检查表是否存在
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='viral_cases'")
    if not c.fetchone():
        print('❌ viral_cases 表不存在')
        conn.close()
        return

    saved = 0
    skipped = 0

    for item in collected_items:
        (platform, title, content, author, likes, favorites, comments, shares,
         url, tags, insurance_type, viral_score, analysis, published_at) = item

        # 检查是否已存在
        c.execute('SELECT id FROM viral_cases WHERE title = ?', (title,))
        if c.fetchone():
            print(f'  ⏭️  跳过（已存在）: {title[:40]}...')
            skipped += 1
            continue

        c.execute('''
            INSERT INTO viral_cases 
            (platform, title, content, author, likesCount, favoritesCount, commentsCount, sharesCount,
             url, tags, insuranceType, viralScore, analysis, publishedAt, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ''', (platform, title, content, author, likes, favorites, comments, shares,
              url, tags, insurance_type, viral_score, analysis, published_at))

        saved += 1
        print(f'  ✅ 保存: [{viral_score}分] {title[:40]}...')

    conn.commit()

    # 统计
    total = c.execute('SELECT COUNT(*) FROM viral_cases').fetchone()[0]
    high_score = c.execute('SELECT COUNT(*) FROM viral_cases WHERE viralScore >= 8').fetchone()[0]
    today_new = c.execute("SELECT COUNT(*) FROM viral_cases WHERE DATE(createdAt) = DATE('now')").fetchone()[0]

    print()
    print('📊 采集统计:')
    print(f'  新增: {saved} 条')
    print(f'  跳过（重复）: {skipped} 条')
    print(f'  数据库总案例: {total} 条')
    print(f'  高分爆款(≥8分): {high_score} 条')
    print(f'  今日新增: {today_new} 条')

    # TOP5
    top5 = c.execute('SELECT title, viralScore, platform FROM viral_cases ORDER BY viralScore DESC LIMIT 5').fetchall()
    print()
    print('🏆 数据库TOP5高分内容:')
    for i, row in enumerate(top5, 1):
        print(f'  {i}. [{row[1]}分][{row[2]}] {row[0][:50]}')

    # 今日高分（≥8分）
    today_high = c.execute(
        "SELECT title, viralScore, platform FROM viral_cases WHERE viralScore >= 8 AND DATE(createdAt) = DATE('now') ORDER BY viralScore DESC"
    ).fetchall()

    if today_high:
        print()
        print('🔥 今日新增高分内容(≥8分):')
        for row in today_high:
            print(f'  [{row[1]}分][{row[2]}] {row[0][:60]}')

    conn.close()
    print()
    print('✅ 数据入库完成！')

if __name__ == '__main__':
    main()
