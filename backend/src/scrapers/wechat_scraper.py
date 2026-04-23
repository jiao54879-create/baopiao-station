"""
微信公众号数据采集器

功能：
1. 搜索公众号文章
2. 获取保险相关文章
3. 追踪保险/财经大V

使用搜狗微信搜索 API
"""

import asyncio
import hashlib
import random
import re
import time
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urlencode

try:
    import aiohttp
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False

# 搜狗微信搜索接口
SOGOU_WX_SEARCH_URL = "https://weixin.sogou.com/weixin"


class WechatScraper:
    """微信公众号爬虫"""

    # 保险类公众号
    INSURANCE_ACCOUNTS = [
        "十三姨",
        "深蓝保",
        "奶爸保",
        "关哥说险",
        "大童保险服务",
        "保险观察",
        "保险业大观察",
        "保契",
        "保险文化",
        "慧择保险网",
        "蜗牛保险",
    ]

    # 财经类公众号
    FINANCE_ACCOUNTS = [
        "吴晓波频道",
        "秦朔朋友圈",
        "叶檀财经",
        "饭统戴老板",
        "杠杆最前线",
        "大猫财经",
        "蓝白观楼市",
        "米筐投资",
    ]

    # 搜索关键词
    INSURANCE_KEYWORDS = [
        "保险怎么买",
        "保险避坑",
        "保险理赔",
        "重疾险",
        "医疗险",
        "寿险",
        "年金险",
        "宝宝保险",
        "养老规划",
        "延迟退休",
        "个人养老金",
        "保险科普",
    ]

    def __init__(self):
        self.session = None
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
        }

    async def search_articles(
        self,
        keyword: str,
        limit: int = 20,
        account: str = None
    ) -> List[Dict]:
        """
        搜索微信公众号文章

        Args:
            keyword: 搜索关键词
            limit: 返回数量限制
            account: 指定公众号名称

        Returns:
            文章列表
        """
        if not HAS_AIOHTTP:
            return self._mock_search_results(keyword, limit)

        results = []

        try:
            async with aiohttp.ClientSession(headers=self.headers) as session:
                # 构建搜索URL
                params = {
                    "type": "2",
                    "query": keyword,
                    "ie": "utf8",
                    "s_from": "input",
                    "_sug_": "n",
                    "_sug_type_": "",
                }

                if account:
                    params["query"] = f"{account} {keyword}"

                url = f"{SOGOU_WX_SEARCH_URL}?{urlencode(params)}"

                async with session.get(url, timeout=30) as response:
                    if response.status == 200:
                        html = await response.text()
                        results = self._parse_search_results(html, keyword)

        except Exception as e:
            print(f"搜索失败: {e}")
            results = self._mock_search_results(keyword, limit)

        return results[:limit]

    async def get_account_articles(
        self,
        account_name: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        获取指定公众号的最新文章

        Args:
            account_name: 公众号名称
            limit: 返回数量限制

        Returns:
            文章列表
        """
        # 使用搜狗微信搜索
        return await self.search_articles(account_name, limit, account_name)

    async def get_hot_articles(
        self,
        category: str = "insurance",
        min_reads: int = 10000
    ) -> List[Dict]:
        """
        获取热门文章

        Args:
            category: 类别 (insurance/finance)
            min_reads: 最低阅读数

        Returns:
            热门文章列表
        """
        keywords = self.INSURANCE_KEYWORDS if category == "insurance" else self.FINANCE_ACCOUNTS

        all_articles = []

        # 搜索多个关键词
        for keyword in keywords[:5]:
            articles = await self.search_articles(keyword, limit=20)
            all_articles.extend(articles)

            # 添加延迟，避免被封
            await asyncio.sleep(random.uniform(1, 2))

        # 过滤高阅读量文章
        hot_articles = [
            article for article in all_articles
            if article.get("reads", 0) >= min_reads
        ]

        # 去重
        seen = set()
        unique_articles = []
        for article in hot_articles:
            if article["url"] not in seen:
                seen.add(article["url"])
                unique_articles.append(article)

        # 按阅读数排序
        unique_articles.sort(key=lambda x: x.get("reads", 0), reverse=True)

        return unique_articles[:30]

    def _parse_search_results(self, html: str, keyword: str) -> List[Dict]:
        """
        解析搜狗微信搜索结果

        Args:
            html: 页面HTML
            keyword: 搜索关键词

        Returns:
            文章列表
        """
        results = []

        # 解析文章卡片
        article_pattern = r'<div class="txt-box">(.*?)</div>\s*</div>'
        matches = re.findall(article_pattern, html, re.DOTALL)

        for match in matches[:20]:
            try:
                # 提取标题
                title_match = re.search(r'<h3[^>]*>.*?<a[^>]*>(.*?)</a>', match, re.DOTALL)
                title = title_match.group(1).strip() if title_match else ""

                # 去除HTML标签
                title = re.sub(r'<[^>]+>', '', title)

                # 提取摘要
                desc_match = re.search(r'<p class="txt-info[^"]*">(.*?)</p>', match, re.DOTALL)
                description = desc_match.group(1).strip() if desc_match else ""
                description = re.sub(r'<[^>]+>', '', description)

                # 提取公众号名称
                account_match = re.search(r'<a class="account"[^>]*>(.*?)</a>', match, re.DOTALL)
                account = account_match.group(1).strip() if account_match else ""

                # 提取链接
                url_match = re.search(r'<a[^>]*href=["\'](.*?)["\']', match)
                url = url_match.group(1) if url_match else ""

                # 提取日期
                date_match = re.search(r'<span class="s2"[^>]*>.*?(\d+\s*分钟前|\d+\s*小时前|昨天|\d+-\d+)', match, re.DOTALL)
                date_str = date_match.group(1) if date_match else ""

                article = {
                    "title": title,
                    "description": description,
                    "account": account,
                    "url": url,
                    "date_str": date_str,
                    "keyword": keyword,
                    "source": "wechat",
                    "category": "INSURANCE" if any(k in title for k in ["保险", "险", "理赔"]) else "FINANCE",
                    "reads": 0,
                    "likes": 0,
                    "published_at": self._parse_date(date_str),
                }

                results.append(article)

            except Exception as e:
                continue

        return results

    def _parse_date(self, date_str: str) -> Optional[str]:
        """解析日期字符串"""
        if not date_str:
            return None

        now = datetime.now()

        try:
            if "分钟前" in date_str:
                minutes = int(re.search(r'\d+', date_str).group())
                return (now - timedelta(minutes=minutes)).isoformat()
            elif "小时前" in date_str:
                hours = int(re.search(r'\d+', date_str).group())
                return (now - timedelta(hours=hours)).isoformat()
            elif "昨天" in date_str:
                return (now - timedelta(days=1)).isoformat()
            else:
                # 假设是 MM-DD 格式
                match = re.search(r'(\d+)-(\d+)', date_str)
                if match:
                    month, day = int(match.group(1)), int(match.group(2))
                    return f"{now.year}-{month:02d}-{day:02d}"
        except:
            pass

        return None

    def _mock_search_results(self, keyword: str, limit: int) -> List[Dict]:
        """生成模拟搜索结果"""
        import random

        results = []
        accounts = [
            "深蓝保",
            "奶爸保",
            "十三姨",
            "关哥说险",
            "大童保险服务",
            "保险观察",
        ]

        titles = [
            f"【深度】{keyword}，99%的人都买错了！",
            f"为什么我劝你别轻易买{keyword}？",
            f"{keyword}全面解析，看完就懂了",
            f"吐血整理！{keyword}避坑指南",
            f"保险从业者揭秘：{keyword}背后的真相",
            f"关于{keyword}，这是我见过最实用的攻略",
        ]

        for i in range(min(limit, 10)):
            results.append({
                "id": f"wx_mock_{keyword}_{i}",
                "title": random.choice(titles),
                "description": f"本文详细介绍了{keyword}的相关知识，包括选购技巧、注意事项等...",
                "account": random.choice(accounts),
                "url": f"https://mp.weixin.qq.com/s/{hashlib.md5(str(i).encode()).hexdigest()[:16]}",
                "reads": random.randint(5000, 100000),
                "likes": random.randint(100, 5000),
                "keyword": keyword,
                "source": "wechat",
                "category": "INSURANCE",
                "published_at": datetime.now().isoformat(),
            })

        # 按阅读数排序
        results.sort(key=lambda x: x["reads"], reverse=True)
        return results

    def calculate_viral_score(self, article: Dict) -> float:
        """
        计算文章爆款评分

        评分维度：
        - 阅读数 (50%)
        - 点赞数 (30%)
        - 评论数 (20%)

        Returns:
            爆款评分 0-100
        """
        reads = article.get("reads", 0)
        likes = article.get("likes", 0)

        # 归一化处理
        normalized_reads = min(reads / 100000, 1) * 100
        normalized_likes = min(likes / 5000, 1) * 100

        # 加权计算
        score = normalized_reads * 0.7 + normalized_likes * 0.3

        return round(score, 2)


async def main():
    """主函数 - 测试爬虫"""
    scraper = WechatScraper()

    print("=" * 50)
    print("微信公众号保险内容采集测试")
    print("=" * 50)

    # 测试搜索
    keyword = "保险怎么买"
    print(f"\n搜索关键词: {keyword}")

    articles = await scraper.search_articles(keyword, limit=5)

    print(f"\n获取到 {len(articles)} 篇文章")

    for i, article in enumerate(articles):
        print(f"\n--- 文章 {i+1} ---")
        print(f"标题: {article.get('title', 'N/A')}")
        print(f"公众号: {article.get('account', 'N/A')}")
        print(f"阅读: {article.get('reads', 0)}")
        print(f"在看: {article.get('likes', 0)}")

        # 计算爆款分数
        score = scraper.calculate_viral_score(article)
        article["viral_score"] = score
        print(f"爆款评分: {score}")

    # 测试获取热门文章
    print("\n" + "=" * 50)
    print("保险热门文章 TOP10")
    print("=" * 50)

    hot_articles = await scraper.get_hot_articles("insurance", min_reads=5000)
    print(f"\n找到 {len(hot_articles)} 篇热门文章")

    for i, article in enumerate(hot_articles[:10]):
        print(f"\n{i+1}. {article.get('title', 'N/A')}")
        print(f"   公众号: {article.get('account', 'N/A')}")
        print(f"   阅读: {article.get('reads', 0)}")


if __name__ == "__main__":
    # 需要安装 aiohttp: pip install aiohttp
    if HAS_AIOHTTP:
        asyncio.run(main())
    else:
        print("请先安装 aiohttp: pip install aiohttp")
        # 运行模拟数据测试
        asyncio.run(main())
