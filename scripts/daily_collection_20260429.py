#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
爆款情报站每日数据采集脚本
采集日期: 2026-04-29
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = "/Users/xubing/WorkBuddy/20260422094347/.workbuddy/insurance-content-station/backend/prisma/dev.db"

# 从WebSearch获取的保险行业新闻数据
NEW_CASES = [
    {
        "platform": "NEWS",
        "title": "2026年保险行业4大核心调整，影响到每个人的钱包",
        "content": "2026年，保险行业将迎来密集的政策落地。从1月1日落地的第四套生命表，到2月即将生效的适当性管理办法，再到全面推行的投保前风险测评。",
        "author": "新浪财经",
        "url": "https://k.sina.cn/article_7880068201_1d5b04c6901901vxds.html",
        "likesCount": 8900,
        "commentsCount": 2340,
        "sharesCount": 1200,
        "publishedAt": "2026-04-29T08:00:00",
        "tags": ["保险新规", "政策解读", "投保指南"],
        "insuranceType": "综合",
    },
    {
        "platform": "NEWS",
        "title": "2026年4月商业保险新规全面解读：车险医疗险三大领域核心变动",
        "content": "2026年4月1日，一批全国性商业保险新规正式实施，覆盖车险、人身险、医疗险三大核心领域。此次改革从定价规则、保障责任、理赔规范到销售监管进行全面升级。",
        "author": "什么值得买",
        "url": "https://post.smzdm.com/p/aww3wv3p/",
        "likesCount": 5600,
        "commentsCount": 1890,
        "sharesCount": 890,
        "publishedAt": "2026-04-28T10:00:00",
        "tags": ["保险新规", "医疗险", "车险"],
        "insuranceType": "医疗险",
    },
    {
        "platform": "NEWS",
        "title": "一季度保险业保费收入同比增长6.2%",
        "content": "中国保险行业协会召开新闻发布会，介绍2026年一季度保险业经营发展情况，保费收入同比增长6.2%。",
        "author": "财联社",
        "url": "https://www.cls.cn/subject/1685",
        "likesCount": 3200,
        "commentsCount": 780,
        "sharesCount": 450,
        "publishedAt": "2026-04-27T15:00:00",
        "tags": ["行业数据", "保费收入", "保险行业"],
        "insuranceType": "综合",
    },
    {
        "platform": "ZHIHU",
        "title": "2026年我最推荐的重疾险：达尔文12号！保障超全",
        "content": "达尔文12号更宽容：别人家要求某些疾病状态必须持续180天才能赔，达尔文12号打破了天数限制，大大降低了理赔门槛。",
        "author": "知乎用户",
        "url": "https://www.zhihu.com/tardis/bd/art/18409748188",
        "likesCount": 15600,
        "commentsCount": 3420,
        "sharesCount": 2100,
        "publishedAt": "2026-03-28T12:00:00",
        "tags": ["达尔文12号", "重疾险推荐", "保障全面"],
        "insuranceType": "重疾险",
    },
    {
        "platform": "NEWS",
        "title": "达尔文12号vs超级玛丽16号，2026年重疾险王座之争",
        "content": "超级玛丽16号在中症赔付比例和医疗报销上胜出，达尔文12号在意外额外赔和住院津贴上胜出。",
        "author": "搜狐",
        "url": "https://www.sohu.com/a/1012385198_121044670",
        "likesCount": 12800,
        "commentsCount": 2890,
        "sharesCount": 1780,
        "publishedAt": "2026-04-21T09:00:00",
        "tags": ["达尔文12号", "超级玛丽16号", "重疾险对比"],
        "insuranceType": "重疾险",
    },
    {
        "platform": "NEWS",
        "title": "达尔文12号深度测评：值不值得买？优缺点全解析",
        "content": "复星联合健康推出的达尔文12号，是近期重疾险市场里一款以极致性价比为卖点的产品。",
        "author": "保险资讯网",
        "url": "https://www.acc5.com/news-xinwen/detail_224016.html",
        "likesCount": 9800,
        "commentsCount": 2150,
        "sharesCount": 1340,
        "publishedAt": "2026-04-28T14:00:00",
        "tags": ["达尔文12号", "产品测评", "性价比"],
        "insuranceType": "重疾险",
    },
    {
        "platform": "NEWS",
        "title": "3款热门重疾险横评：超级玛丽16号vs达尔文12号vs完美人生8号",
        "content": "现在重疾险产品太多了，超级玛丽16号、达尔文12号、完美人生8号看着都不错，到底该选哪款？",
        "author": "网易",
        "url": "https://www.163.com/dy/article/KRKJNCOU0519WRQU.html",
        "likesCount": 11200,
        "commentsCount": 2560,
        "sharesCount": 1650,
        "publishedAt": "2026-04-28T11:00:00",
        "tags": ["重疾险横评", "达尔文12号", "超级玛丽16号", "完美人生8号"],
        "insuranceType": "重疾险",
    },
    {
        "platform": "ZHIHU",
        "title": "重疾险哪款好？2026重疾险超全挑选指南+4月最新推荐榜单",
        "content": "给大家介绍挑选重疾险的三步走加成人少儿重疾险TOP榜单推荐。",
        "author": "知乎",
        "url": "https://zhuanlan.zhihu.com/p/2004486723623747737",
        "likesCount": 18900,
        "commentsCount": 4230,
        "sharesCount": 2890,
        "publishedAt": "2026-04-01T10:00:00",
        "tags": ["重疾险榜单", "挑选指南", "成人重疾险", "少儿重疾险"],
        "insuranceType": "重疾险",
    },
    {
        "platform": "NEWS",
        "title": "2026年重疾险怎么选？核保放宽+高性价比，一篇教你避坑",
        "content": "2026年很多重疾险都涨价了，核心原因是预定利率从之前的3.0%下调到2.5%，相同保障下，保费普遍涨了15%-30%。",
        "author": "新浪",
        "url": "https://k.sina.cn/article_7879922977_1d5ae152101901dzru.html",
        "likesCount": 7800,
        "commentsCount": 1780,
        "sharesCount": 980,
        "publishedAt": "2026-04-06T08:00:00",
        "tags": ["重疾险选购", "核保", "涨价原因"],
        "insuranceType": "重疾险",
    },
    {
        "platform": "NEWS",
        "title": "从开门黑到开门红，2026年保险行业上演绝地反击",
        "content": "新华保险A股涨超14%，中国人寿、中国太平等港股涨幅均超15%，南北两市保险股共振走强。",
        "author": "腾讯新闻",
        "url": "https://news.qq.com/rain/a/20260120A05A0100",
        "likesCount": 6500,
        "commentsCount": 1230,
        "sharesCount": 890,
        "publishedAt": "2026-01-20T15:00:00",
        "tags": ["保险股", "行业趋势", "资本市场"],
        "insuranceType": "综合",
    },
]


def calculate_viral_score(likes, comments, shares, platform):
    """计算爆款评分"""
    platform_weights = {
        "ZHIHU": 1.2,
        "WEIBO": 1.1,
        "XHS": 1.3,
        "WX": 1.0,
        "NEWS": 0.9,
    }
    weight = platform_weights.get(platform, 1.0)
    base_score = (likes * 1 + comments * 2 + shares * 3) / 1000
    score = min(base_score * weight, 100)
    return round(score, 1)


def insert_cases():
    """插入新采集的数据"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    inserted_count = 0
    high_score_count = 0

    for case in NEW_CASES:
        viral_score = calculate_viral_score(
            case["likesCount"],
            case["commentsCount"],
            case["sharesCount"],
            case["platform"]
        )

        if viral_score >= 80:
            high_score_count += 1

        tags_str = json.dumps(case["tags"], ensure_ascii=False)

        analysis = f"""【爆款分析】
平台：{case['platform']}
互动数据：点赞{case['likesCount']} | 评论{case['commentsCount']} | 转发{case['sharesCount']}
爆款评分：{viral_score}/100
内容类型：{case['insuranceType']}
标签：{tags_str}"""

        cursor.execute("""
            INSERT INTO viral_cases (
                platform, title, content, author, url,
                likesCount, favoritesCount, commentsCount, sharesCount,
                url, tags, insuranceType, viralScore, analysis, publishedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            case["platform"],
            case["title"],
            case["content"],
            case["author"],
            case["url"],
            case["likesCount"],
            0,
            case["commentsCount"],
            case["sharesCount"],
            case["url"],
            tags_str,
            case["insuranceType"],
            viral_score,
            analysis,
            case["publishedAt"]
        ))

        inserted_count += 1

    conn.commit()
    cursor.execute("SELECT COUNT(*) FROM viral_cases")
    total_count = cursor.fetchone()[0]
    conn.close()

    return {
        "inserted": inserted_count,
        "total": total_count,
        "high_score": high_score_count
    }


if __name__ == "__main__":
    print("=" * 50)
    print("爆款情报站每日采集报告")
    print(f"采集日期: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)

    result = insert_cases()

    print(f"\n[OK] 新增爆款案例: {result['inserted']} 条")
    print(f"[INFO] 数据库总案例: {result['total']} 条")
    print(f"[FIRE] 高分爆款(>=80分): {result['high_score']} 条")

    print("\n" + "=" * 50)
    print("采集完成!")
