"""
保险内容创作者情报站 - 数据采集器配置

覆盖以下数据源：
1. 保险行业 - 银保监会、保险公司官网、保险资讯网站
2. 金融行业 - 雪球、东方财富、同花顺
3. 教育行业 - 教育部门官网、芥末堆、多知网
4. 科技/AI - 36氪、虎嗅、机器之心
5. 小红书 - 保险相关内容
6. 微信公众号 - 保险/财经大V
7. 抖音 - 保险科普视频
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.scrapers.base import ScraperConfig, SourceType

# ==================== 保险行业数据源 ====================

CBIRC_CONFIG = ScraperConfig(
    name="银保监会",
    source="银保监会官网",
    source_url="https://www.cbirc.gov.cn/",
    category="INSURANCE",
    source_type=SourceType.GOVERNMENT,
    selectors={
        "list": ".news_list li, .article-list li, .news-item",
        "title": "a",
        "url": "a@href",
        "date": ".date, .time"
    }
)

INSURANCE_DOT_COM = ScraperConfig(
    name="今日保险",
    source="今日保险资讯网",
    source_url="https://www.insurancenews.com.cn/",
    category="INSURANCE",
    source_type=SourceType.NEWS,
    selectors={
        "list": ".article-list li, .news-item",
        "title": "h3 a, .title a",
        "url": "a@href",
        "date": ".time, .date"
    }
)

INSURANCE_WEEKLY = ScraperConfig(
    name="保险赢家",
    source="保险赢家",
    source_url="http://www.baoxianyingjia.com/",
    category="INSURANCE",
    source_type=SourceType.NEWS,
    selectors={
        "list": ".list-content li, .article-item",
        "title": "a",
        "url": "a@href"
    }
)

# 保险公司官网列表
INSURANCE_COMPANIES = [
    {"name": "中国人寿", "url": "https://www.chinalife.com.cn/", "category": "INSURANCE"},
    {"name": "平安保险", "url": "https://www.pingan.com/", "category": "INSURANCE"},
    {"name": "太平洋保险", "url": "https://www.cpic.com.cn/", "category": "INSURANCE"},
    {"name": "新华保险", "url": "https://www.newchinalife.com/", "category": "INSURANCE"},
    {"name": "泰康保险", "url": "https://www.taikang.com/", "category": "INSURANCE"},
    {"name": "友邦保险", "url": "https://www.aia.com.cn/", "category": "INSURANCE"},
]

# ==================== 金融行业数据源 ====================

XUEQIU = ScraperConfig(
    name="雪球",
    source="雪球",
    source_url="https://xueqiu.com/",
    category="FINANCE",
    source_type=SourceType.SOCIAL,
    selectors={
        "list": ".stock-item, .topic-item",
        "title": ".title, .stock-name",
        "url": "a@href"
    }
)

EAST_MONEY = ScraperConfig(
    name="东方财富",
    source="东方财富网",
    source_url="https://www.eastmoney.com/",
    category="FINANCE",
    source_type=SourceType.NEWS,
    selectors={
        "list": ".news-list-item, .data-item",
        "title": "a",
        "url": "a@href"
    }
)

TONGHUA_SHUN = ScraperConfig(
    name="同花顺",
    source="同花顺财经",
    source_url="https://www.10jqka.com.cn/",
    category="FINANCE",
    source_type=SourceType.NEWS,
    selectors={
        "list": ".news-item, .article-item",
        "title": "a",
        "url": "a@href"
    }
)

# 保险相关话题 - 用于搜索
INSURANCE_TOPICS = [
    "保险怎么买",
    "保险骗局",
    "保险理赔",
    "重疾险",
    "医疗险",
    "寿险",
    "年金险",
    "意外险",
    "儿童保险",
    "老人保险",
    "保险知识",
    "保险科普",
    "延迟退休",
    "养老规划",
    "个人养老金",
]

# ==================== 教育行业数据源 ====================

MOE_GOV = ScraperConfig(
    name="教育部",
    source="教育部官网",
    source_url="http://www.moe.gov.cn/",
    category="EDUCATION",
    source_type=SourceType.GOVERNMENT,
    selectors={
        "list": ".news-list li, .article-list li",
        "title": "a",
        "url": "a@href"
    }
)

JIEMO_CAI = ScraperConfig(
    name="芥末堆",
    source="芥末堆教育网",
    source_url="https://www.jiemodui.com/",
    category="EDUCATION",
    source_type=SourceType.NEWS,
    selectors={
        "list": ".article-item, .news-item",
        "title": "h3 a, .title a",
        "url": "a@href"
    }
)

DUO_ZHI = ScraperConfig(
    name="多知网",
    source="多知网",
    source_url="https://www.duozhi.com/",
    category="EDUCATION",
    source_type=SourceType.NEWS,
    selectors={
        "list": ".article-list li, .post-item",
        "title": "a",
        "url": "a@href"
    }
)

# ==================== 科技/AI行业数据源 ====================

CHINAZHIKU = ScraperConfig(
    name="36氪",
    source="36氪",
    source_url="https://36kr.com/",
    category="TECH",
    source_type=SourceType.NEWS,
    selectors={
        "list": ".article-item, .kr-list-item",
        "title": ".article-title a, .title a",
        "url": "a@href"
    }
)

HUXIU = ScraperConfig(
    name="虎嗅",
    source="虎嗅网",
    source_url="https://www.huxiu.com/",
    category="TECH",
    source_type=SourceType.NEWS,
    selectors={
        "list": ".article-list-item, .mod-info-flow .item",
        "title": "h3 a, .tuijian-title",
        "url": "a@href"
    }
)

JIQIZHIXIN = ScraperConfig(
    name="机器之心",
    source="机器之心",
    source_url="https://www.jiqizhixin.com/",
    category="TECH",
    source_type=SourceType.NEWS,
    selectors={
        "list": ".article-item, .news-item",
        "title": "a",
        "url": "a@href"
    }
)

AI_TOPICS = [
    "ChatGPT",
    "AI工具",
    "人工智能",
    "大模型",
    "AIGC",
    "AI写作",
    "AI生成",
    "智能助手",
    "AI应用",
    "AI学习",
]

# ==================== 社会热点数据源 ====================

BAIDU_HOT = ScraperConfig(
    name="百度热搜",
    source="百度热搜榜",
    source_url="https://top.baidu.com/board?tab=realtime",
    category="SOCIAL",
    source_type=SourceType.TRENDING,
    selectors={
        "list": ".c-single-cell, .list-item",
        "title": ".c-title, .title",
        "url": "a@href"
    }
)

WEIBO_HOT = ScraperConfig(
    name="微博热搜",
    source="微博热搜榜",
    source_url="https://s.weibo.com/top/summary",
    category="SOCIAL",
    source_type=SourceType.TRENDING,
    selectors={
        "list": ".td-01 li, .hot-list li",
        "title": "a",
        "url": "a@href"
    }
)

ZHIHU_HOT = ScraperConfig(
    name="知乎热榜",
    source="知乎热榜",
    source_url="https://www.zhihu.com/hot",
    category="SOCIAL",
    source_type=SourceType.TRENDING,
    selectors={
        "list": ".List-item, .HotItem",
        "title": ".HotItem-title a, .QuestionItem-title",
        "url": "a@href"
    }
)

# ==================== 小红书数据源 ====================

# 小红书搜索关键词 - 保险相关内容
XHS_INSURANCE_KEYWORDS = [
    "保险怎么买",
    "保险避坑",
    "保险理赔",
    "重疾险推荐",
    "医疗险测评",
    "宝宝保险",
    "老人保险",
    "养老规划",
    "个人养老金账户",
    "延迟退休影响",
    "年金险值得买吗",
    "增额终身寿",
    "保险小白",
    "保险科普",
    "保险真实案例",
    "保险拒赔",
    "保险条款解读",
    "保险经纪人",
    "保险对比",
    "保险配置",
]

# 小红书博主 - 保险类
XHS_INSURANCE_ACCOUNTS = [
    "保险小百科",
    "深蓝保",
    "奶爸保",
    "大童保险服务",
    "蜗牛保险",
    "保险小当家",
    "大燕子说保险",
    "关哥说险",
]

# ==================== 微信公众号数据源 ====================

# 保险类公众号 - 使用搜狗微信搜索
WX_PUBLIC_ACCOUNTS = [
    {"name": "十三姨", "id": "shiyi_insurance"},
    {"name": "深蓝保", "id": "shenlanbao"},
    {"name": "奶爸保", "id": "naibubao"},
    {"name": "关哥说险", "id": "guangeshuoxian"},
    {"name": "大童保险", "id": "dtbx_service"},
    {"name": "保险观察", "id": "insurancegc"},
]

# 财经类公众号
WX_FINANCE_ACCOUNTS = [
    {"name": "吴晓波频道", "id": "wuxiaobokan"},
    {"name": "秦朔朋友圈", "id": "qinshuopengyou"},
    {"name": "叶檀财经", "id": "tancaijing"},
    {"name": "饭统戴老板", "id": "worldboss"},
]

# ==================== 抖音数据源 ====================

# 抖音保险话题
DOUYIN_INSURANCE_TOPICS = [
    "#保险怎么买",
    "#保险避坑指南",
    "#保险科普",
    "#重疾险",
    "#医疗险报销",
    "#宝宝保险配置",
    "#养老规划",
    "#个人养老金",
    "#延迟退休",
    "#保险理赔",
]

# 抖音保险类账号
DOUYIN_ACCOUNTS = [
    "深蓝保官方",
    "奶爸保",
    "关哥说险",
    "保险小百科",
    "蜗牛保险",
]

# ==================== 数据采集配置 ====================

# 采集频率配置
SCRAPE_SCHEDULES = {
    # 高频：每小时采集
    "high": ["baidu_hot", "weibo_hot", "zhihu_hot"],

    # 中频：每4小时采集
    "medium": [
        "cbirc", "insurance_dot_com", "insurance_weekly",
        "xueqiu", "east_money",
        "chinazhiku", "huxiu"
    ],

    # 低频：每天采集2次
    "low": [
        "moe_gov", "jiemo_cai", "duo_zhi",
        "jiqizhixin"
    ]
}

# 并发采集配置
CONCURRENT_SCRAPERS = 5
REQUEST_DELAY = 1.0  # 秒
MAX_RETRIES = 3

# 数据过滤规则
INSURANCE_RELATED_KEYWORDS = [
    "保险", "险种", "投保", "理赔", "拒赔",
    "重疾", "医疗", "寿险", "年金", "意外",
    "养老", "储蓄", "保障", "保额", "保费",
    "健康告知", "免责条款", "等待期",
    "保险公司", "保险产品", "保险责任"
]

FINANCE_INSURANCE_KEYWORDS = [
    "养老金", "个人养老金", "延迟退休", "养老规划",
    "理财保险", "分红险", "万能险", "投连险",
    "资产配置", "财富管理", "财务规划"
]

# 爆款标准
VIRAL_THRESHOLDS = {
    "xhs_likes": 1000,      # 小红书点赞
    "xhs_favorites": 500,   # 小红书收藏
    "weibo_likes": 10000,   # 微博点赞
    "douyin_likes": 10000,  # 抖音点赞
    "wx_reads": 10000,      # 微信公众号阅读
    "zhihu_likes": 500,     # 知乎点赞
}

# 导出所有配置
ALL_CONFIGS = [
    CBIRC_CONFIG,
    INSURANCE_DOT_COM,
    INSURANCE_WEEKLY,
    XUEQIU,
    EAST_MONEY,
    TONGHUA_SHUN,
    MOE_GOV,
    JIEMO_CAI,
    DUO_ZHI,
    CHINAZHIKU,
    HUXIU,
    JIQIZHIXIN,
    BAIDU_HOT,
    WEIBO_HOT,
    ZHIHU_HOT,
]
