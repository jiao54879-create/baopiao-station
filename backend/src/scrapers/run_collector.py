"""
数据采集主程序

整合所有数据源，执行定时采集任务
"""

import asyncio
import argparse
import json
import sys
import os
from datetime import datetime
from typing import List, Dict

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.scrapers.config import (
    XHS_INSURANCE_KEYWORDS,
    INSURANCE_RELATED_KEYWORDS,
    VIRAL_THRESHOLDS,
)
from src.scrapers.xiaohongshu_scraper import XiaohongshuScraper
from src.scrapers.wechat_scraper import WechatScraper


class DataCollector:
    """数据采集器主类"""

    def __init__(self):
        self.xhs_scraper = XiaohongshuScraper()
        self.wx_scraper = WechatScraper()
        self.collected_data = {
            "intelligence": [],      # 情报数据
            "viral_cases": [],       # 爆款案例
            "collected_at": None,
        }

    async def collect_xiaohongshu(self, keywords: List[str] = None) -> List[Dict]:
        """
        采集小红书数据

        Args:
            keywords: 搜索关键词列表

        Returns:
            采集到的数据
        """
        if keywords is None:
            keywords = XHS_INSURANCE_KEYWORDS

        print(f"\n{'='*50}")
        print(f"开始采集小红书数据")
        print(f"{'='*50}")

        all_notes = []

        for i, keyword in enumerate(keywords[:10]):  # 限制采集数量
            print(f"\n[{i+1}/{min(len(keywords), 10)}] 搜索: {keyword}")

            try:
                # 获取爆款笔记
                notes = await self.xhs_scraper.get_viral_notes(
                    keyword,
                    min_likes=VIRAL_THRESHOLDS["xhs_likes"]
                )

                print(f"  获取到 {len(notes)} 条爆款笔记")

                for note in notes:
                    # 计算爆款分数
                    score = self.xhs_scraper.calculate_viral_score(note)
                    note["viral_score"] = score
                    note["platform"] = "XHS"
                    note["collected_at"] = datetime.now().isoformat()

                    # 检查是否与保险相关
                    if self._is_insurance_related(note.get("title", "")):
                        all_notes.append(note)

                # 添加延迟
                await asyncio.sleep(0.5)

            except Exception as e:
                print(f"  采集失败: {e}")

        print(f"\n小红书采集完成: {len(all_notes)} 条保险相关笔记")

        return all_notes

    async def collect_wechat(self, keywords: List[str] = None) -> List[Dict]:
        """
        采集微信公众号数据

        Args:
            keywords: 搜索关键词列表

        Returns:
            采集到的数据
        """
        if keywords is None:
            keywords = XHS_INSURANCE_KEYWORDS

        print(f"\n{'='*50}")
        print(f"开始采集微信公众号数据")
        print(f"{'='*50}")

        all_articles = []

        for i, keyword in enumerate(keywords[:10]):
            print(f"\n[{i+1}/{min(len(keywords), 10)}] 搜索: {keyword}")

            try:
                articles = await self.wx_scraper.search_articles(
                    keyword,
                    limit=20
                )

                print(f"  获取到 {len(articles)} 篇文章")

                for article in articles:
                    # 计算爆款分数
                    score = self.wx_scraper.calculate_viral_score(article)
                    article["viral_score"] = score
                    article["platform"] = "WX"
                    article["collected_at"] = datetime.now().isoformat()

                    all_articles.append(article)

                # 添加延迟
                await asyncio.sleep(1)

            except Exception as e:
                print(f"  采集失败: {e}")

        print(f"\n微信公众号采集完成: {len(all_articles)} 篇文章")

        return all_articles

    async def collect_all(self) -> Dict:
        """
        采集所有数据源

        Returns:
            所有采集到的数据
        """
        print("\n" + "="*60)
        print("🚀 爆款情报站数据采集任务开始")
        print("="*60)
        print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # 采集小红书
        xhs_data = await self.collect_xiaohongshu()

        # 采集微信公众号
        wx_data = await self.collect_wechat()

        # 整合数据
        self.collected_data = {
            "intelligence": self._generate_intelligence(xhs_data + wx_data),
            "viral_cases": xhs_data + wx_data,
            "collected_at": datetime.now().isoformat(),
            "summary": {
                "xhs_count": len(xhs_data),
                "wx_count": len(wx_data),
                "total_count": len(xhs_data) + len(wx_data),
            }
        }

        print("\n" + "="*60)
        print("✅ 采集任务完成")
        print("="*60)
        print(f"总数据量: {len(xhs_data) + len(wx_data)} 条")
        print(f"  - 小红书: {len(xhs_data)} 条")
        print(f"  - 微信公众号: {len(wx_data)} 条")

        return self.collected_data

    def _is_insurance_related(self, text: str) -> bool:
        """检查文本是否与保险相关"""
        text_lower = text.lower()
        keywords = [
            "保险", "险种", "投保", "理赔", "重疾", "医疗",
            "寿险", "年金", "意外", "养老", "储蓄", "保障",
            "保额", "保费", "健康告知", "免责", "等待期",
        ]
        return any(k in text for k in keywords)

    def _generate_intelligence(self, data: List[Dict]) -> List[Dict]:
        """从采集数据生成情报"""
        intelligence = []

        for item in data:
            intelligence.append({
                "title": item.get("title", ""),
                "summary": item.get("description", "") or item.get("content", "")[:200],
                "content": item.get("content", "") or item.get("description", ""),
                "source": item.get("platform", "XHS"),
                "sourceUrl": item.get("url", ""),
                "category": "INSURANCE",
                "tags": item.get("tags", []),
                "hotScore": int(item.get("viral_score", 0)),
                "publishTime": item.get("published_at", ""),
                "createdAt": datetime.now().isoformat(),
            })

        return intelligence

    def save_to_file(self, filepath: str = None):
        """保存采集数据到文件"""
        if filepath is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = f"./collected_data_{timestamp}.json"

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.collected_data, f, ensure_ascii=False, indent=2)

        print(f"\n数据已保存到: {filepath}")


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="爆款情报站数据采集工具")
    parser.add_argument(
        "--source",
        "-s",
        choices=["xhs", "wechat", "all"],
        default="all",
        help="选择采集数据源"
    )
    parser.add_argument(
        "--keywords",
        "-k",
        nargs="+",
        help="自定义搜索关键词"
    )
    parser.add_argument(
        "--output",
        "-o",
        help="输出文件路径"
    )

    args = parser.parse_args()

    collector = DataCollector()

    if args.source == "xhs":
        data = await collector.collect_xiaohongshu(args.keywords)
    elif args.source == "wechat":
        data = await collector.collect_wechat(args.keywords)
    else:
        data = await collector.collect_all()

    # 保存数据
    if args.output or data:
        collector.save_to_file(args.output)

    return collector.collected_data


if __name__ == "__main__":
    asyncio.run(main())
