#!/usr/bin/env python3
"""
小红书爆款数据采集脚本
使用移动端API，无需登录即可获取公开数据
"""

import requests
import json
import time
import sys
import os
import random
import string
from datetime import datetime

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 保险相关关键词
KEYWORDS = [
    "重疾险", "成人重疾险", "少儿重疾险", "多次赔付重疾", "单次赔付重疾",
    "百万医疗险", "小额医疗险", "门诊险", "防癌医疗险",
    "定期寿险", "终身寿险", "增额终身寿险", "年金险", "养老年金",
    "意外险", "少儿意外险", "教育金", "家庭保险配置", "保险怎么买",
    "给孩子买保险", "儿童保险怎么买", "宝宝保险", "父母保险",
    "保险知识", "保险科普", "保险小白", "保险避坑", "保险理赔",
    "达尔文重疾险", "超级玛丽重疾险", "妈咪宝贝"
]

# 小红书移动端API
BASE_URL = "https://www.xiaohongshu.com"

def search_xiaohongshu(keyword, limit=10):
    """搜索小红书"""
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Accept": "application/json",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Referer": "https://www.xiaohongshu.com/",
    }
    
    # 移动端搜索API
    url = f"{BASE_URL}/api/sns/web/v1/search/notes"
    
    data = {
        "keyword": keyword,
        "page": 1,
        "page_size": limit,
        "search_id": "".join(random.choices(string.ascii_lowercase + string.digits, k=16)),
        "sort": "general",
        "note_type": 0
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"  ❌ API返回 {response.status_code}")
            return None
    except Exception as e:
        print(f"  ❌ 请求失败: {e}")
        return None

def extract_notes(data):
    """从响应中提取笔记数据"""
    notes = []
    if not data:
        return notes
    
    try:
        items = data.get("data", {}).get("items", [])
        for item in items:
            note_card = item.get("note_card", {})
            if note_card:
                note = {
                    "title": note_card.get("title", ""),
                    "content": note_card.get("desc", ""),
                    "author": note_card.get("user", {}).get("nickname", ""),
                    "likes": note_card.get("interact_info", {}).get("liked_count", "0"),
                    "collects": note_card.get("interact_info", {}).get("collected_count", "0"),
                    "comments": note_card.get("interact_info", {}).get("comment_count", "0"),
                    "share_url": "https://www.xiaohongshu.com/explore/" + note_card.get("note_id", ""),
                    "cover_url": note_card.get("image_list", [{}])[0].get("url_default", ""),
                    "tags": note_card.get("tag_list", []),
                    "time": note_card.get("time", int(time.time())),
                    "source": "xiaohongshu"
                }
                notes.append(note)
    except Exception as e:
        print(f"  ⚠️ 解析数据失败: {e}")
    
    return notes

def format_number(num_str):
    """格式化数字"""
    if not num_str:
        return 0
    num_str = str(num_str)
    if "万" in num_str:
        return int(float(num_str.replace("万", "")) * 10000)
    if "w" in num_str.lower():
        return int(float(num_str.lower().replace("w", "")) * 10000)
    try:
        return int(num_str)
    except:
        return 0

def save_to_json(notes, keyword):
    """保存到JSON文件"""
    output_dir = "/Users/xubing/WorkBuddy/20260422094347/.workbuddy/insurance-content-station/backend/data"
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"{output_dir}/xhs_{keyword.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)
    return filename

def main():
    """主函数"""
    print("=" * 50)
    print("🔥 小红书爆款数据采集")
    print("=" * 50)
    
    all_notes = []
    success_count = 0
    fail_count = 0
    
    for keyword in KEYWORDS:
        print(f"\n🔍 搜索: {keyword}")
        
        # 搜索并解析数据
        data = search_xiaohongshu(keyword, limit=5)
        
        if data and "data" in data:
            notes = extract_notes(data)
            if notes:
                all_notes.extend(notes)
                print(f"  ✅ 获取 {len(notes)} 条数据")
                success_count += 1
            else:
                print(f"  ⚠️ 无数据")
                fail_count += 1
        else:
            print(f"  ❌ 搜索失败")
            fail_count += 1
        
        # 延时避免请求过快
        time.sleep(1)
    
    # 保存结果
    if all_notes:
        filename = save_to_json(all_notes, "all")
        print(f"\n✅ 采集完成!")
        print(f"   总计: {len(all_notes)} 条数据")
        print(f"   成功关键词: {success_count}")
        print(f"   失败关键词: {fail_count}")
        print(f"   保存位置: {filename}")
    else:
        print("\n❌ 未获取到任何数据")
        print("\n可能原因:")
        print("1. 小红书API有访问限制")
        print("2. 需要登录状态")
        print("3. IP被限制")
    
    return all_notes

if __name__ == "__main__":
    main()
