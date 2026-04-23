"""
小红书数据采集器

功能：
1. 搜索保险相关话题
2. 获取爆款笔记
3. 追踪保险类博主

注意：使用 MCP 工具进行采集
"""

import asyncio
import json
from datetime import datetime
from typing import List, Dict, Optional

# 如果需要直接请求小红书 API，可以使用这个模块
# 但更推荐使用 MCP 工具

class XiaohongshuScraper:
    """小红书爬虫"""

    BASE_URL = "https://www.xiaohongshu.com"

    # 保险相关搜索关键词
    INSURANCE_KEYWORDS = [
        "保险怎么买",
        "保险避坑",
        "保险理赔",
        "重疾险推荐",
        "医疗险测评",
        "宝宝保险",
        "老人保险",
        "养老规划",
        "个人养老金账户",
        "延迟退休",
        "年金险值得买吗",
        "增额终身寿",
        "保险小白",
        "保险科普",
        "保险真实案例",
        "保险拒赔",
    ]

    # 高赞笔记关键词组合
    VIRAL_COMBINATIONS = [
        "保险 骗局",
        "保险 后悔",
        "保险 不赔",
        "保险 坑",
        "重疾险 踩坑",
        "医疗险 真相",
        "年金险 收益",
        "延迟退休 养老",
    ]

    def __init__(self, mcp_client=None):
        """
        初始化爬虫

        Args:
            mcp_client: MCP 客户端实例，用于调用 xhs-mcp 工具
        """
        self.mcp_client = mcp_client
        self.session = None

    async def search_notes(self, keyword: str, limit: int = 20) -> List[Dict]:
        """
        搜索小红书笔记

        Args:
            keyword: 搜索关键词
            limit: 返回数量限制

        Returns:
            笔记列表
        """
        results = []

        try:
            # 尝试使用 MCP 工具
            if self.mcp_client:
                notes = await self.mcp_client.search_note(keyword, limit)
                results.extend(notes)
            else:
                # 如果没有 MCP，使用模拟数据
                results = self._mock_search_results(keyword, limit)

        except Exception as e:
            print(f"搜索失败: {e}")

        return results

    async def get_viral_notes(self, keyword: str, min_likes: int = 1000) -> List[Dict]:
        """
        获取爆款笔记（高赞）

        Args:
            keyword: 搜索关键词
            min_likes: 最低点赞数

        Returns:
            爆款笔记列表
        """
        notes = await self.search_notes(keyword, limit=50)

        # 过滤高赞笔记
        viral_notes = [
            note for note in notes
            if note.get("likes", 0) >= min_likes
        ]

        # 按点赞数排序
        viral_notes.sort(key=lambda x: x.get("likes", 0), reverse=True)

        return viral_notes[:20]

    async def get_user_notes(self, user_id: str, limit: int = 10) -> List[Dict]:
        """
        获取指定用户的所有笔记

        Args:
            user_id: 用户ID
            limit: 返回数量限制

        Returns:
            笔记列表
        """
        results = []

        try:
            if self.mcp_client:
                notes = await self.mcp_client.get_user_notes(user_id, limit)
                results.extend(notes)
            else:
                results = self._mock_user_notes(user_id, limit)

        except Exception as e:
            print(f"获取用户笔记失败: {e}")

        return results

    async def get_note_detail(self, note_id: str) -> Optional[Dict]:
        """
        获取笔记详情

        Args:
            note_id: 笔记ID

        Returns:
            笔记详情
        """
        try:
            if self.mcp_client:
                return await self.mcp_client.get_note_detail(note_id)
            else:
                return self._mock_note_detail(note_id)

        except Exception as e:
            print(f"获取笔记详情失败: {e}")
            return None

    def calculate_viral_score(self, note: Dict) -> float:
        """
        计算笔记爆款评分

        评分维度：
        - 点赞数 (30%)
        - 收藏数 (25%)
        - 评论数 (20%)
        - 分享数 (25%)

        Returns:
            爆款评分 0-100
        """
        likes = note.get("likes", 0)
        favorites = note.get("favorites", 0)
        comments = note.get("comments", 0)
        shares = note.get("shares", 0)

        # 归一化处理（假设最高值为 100000）
        max_val = 100000
        normalized_likes = min(likes / max_val, 1) * 100
        normalized_favorites = min(favorites / max_val, 1) * 100
        normalized_comments = min(comments / max_val, 1) * 100
        normalized_shares = min(shares / max_val, 1) * 100

        # 加权计算
        score = (
            normalized_likes * 0.30 +
            normalized_favorites * 0.25 +
            normalized_comments * 0.20 +
            normalized_shares * 0.25
        )

        return round(score, 2)

    def _mock_search_results(self, keyword: str, limit: int) -> List[Dict]:
        """生成模拟搜索结果（用于测试）"""
        import random

        results = []
        for i in range(min(limit, 10)):
            results.append({
                "id": f"mock_note_{keyword}_{i}",
                "title": f"【保险攻略】{keyword}你真的懂吗？{i+1}个真相必须知道",
                "author": f"保险达人{i+1}",
                "author_id": f"user_{i+1}",
                "likes": random.randint(500, 50000),
                "favorites": random.randint(200, 20000),
                "comments": random.randint(50, 5000),
                "shares": random.randint(20, 2000),
                "tags": ["保险", "攻略", keyword],
                "url": f"https://www.xiaohongshu.com/discovery/item/{random.randint(100000, 999999)}",
                "published_at": datetime.now().isoformat(),
                "source": "xhs",
                "category": "INSURANCE",
                "viral_score": 0  # 待计算
            })

        return results

    def _mock_user_notes(self, user_id: str, limit: int) -> List[Dict]:
        """生成模拟用户笔记"""
        import random

        results = []
        keywords = ["保险怎么买", "重疾险", "医疗险", "养老规划"]
        for i in range(min(limit, 10)):
            results.append({
                "id": f"mock_note_{user_id}_{i}",
                "title": f"【原创】关于{kandomwords[i%4]}的一些思考",
                "author_id": user_id,
                "likes": random.randint(100, 10000),
                "favorites": random.randint(50, 5000),
                "comments": random.randint(10, 1000),
                "shares": random.randint(5, 500),
                "url": f"https://www.xiaohongshu.com/discovery/item/{random.randint(100000, 999999)}",
            })

        return results

    def _mock_note_detail(self, note_id: str) -> Optional[Dict]:
        """生成模拟笔记详情"""
        import random

        return {
            "id": note_id,
            "title": "保险深度测评：这类产品千万别买！",
            "content": """
            最近很多朋友问我保险怎么买，今天来给大家详细说说。

            首先，要明确自己的需求：
            1. 保障型：重疾险、医疗险、意外险
            2. 储蓄型：年金险、增额终身寿

            很多人在买保险时容易踩坑，我总结了以下几点：

            1. 不要只看保额，要看保障范围
            2. 不要只看价格，要看性价比
            3. 不要忽略健康告知
            4. 一定要看清楚条款

            如果大家有什么问题，欢迎在评论区留言！
            """,
            "author": "保险小百科",
            "author_id": "user_123",
            "likes": random.randint(1000, 50000),
            "favorites": random.randint(500, 20000),
            "comments": random.randint(100, 5000),
            "shares": random.randint(50, 2000),
            "tags": ["保险", "避坑", "测评"],
            "images": [],
            "url": f"https://www.xiaohongshu.com/discovery/item/{note_id}",
        }


async def main():
    """主函数 - 测试爬虫"""
    scraper = XiaohongshuScraper()

    print("=" * 50)
    print("小红书保险内容采集测试")
    print("=" * 50)

    # 测试搜索
    keyword = "保险怎么买"
    print(f"\n搜索关键词: {keyword}")

    notes = await scraper.search_notes(keyword, limit=5)

    print(f"\n获取到 {len(notes)} 条笔记")

    for i, note in enumerate(notes):
        print(f"\n--- 笔记 {i+1} ---")
        print(f"标题: {note.get('title', 'N/A')}")
        print(f"作者: {note.get('author', 'N/A')}")
        print(f"点赞: {note.get('likes', 0)}")
        print(f"收藏: {note.get('favorites', 0)}")

        # 计算爆款分数
        score = scraper.calculate_viral_score(note)
        note["viral_score"] = score
        print(f"爆款评分: {score}")

    # 测试获取爆款笔记
    print("\n" + "=" * 50)
    print("爆款笔记（点赞>1000）")
    print("=" * 50)

    viral_notes = await scraper.get_viral_notes(keyword, min_likes=1000)
    print(f"\n找到 {len(viral_notes)} 条爆款笔记")

    for i, note in enumerate(viral_notes[:3]):
        print(f"\n--- 爆款 {i+1} ---")
        print(f"标题: {note.get('title', 'N/A')}")
        print(f"点赞: {note.get('likes', 0)}")
        print(f"爆款评分: {note.get('viral_score', 0)}")


if __name__ == "__main__":
    asyncio.run(main())
