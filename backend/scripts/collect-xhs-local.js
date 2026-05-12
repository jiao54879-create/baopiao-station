#!/usr/bin/env node
/**
 * 本地小红书爆款笔记采集脚本
 * 使用 autocli 搜索小红书真实数据，输出 JSON 文件供导入 Railway
 *
 * 用法: node scripts/collect-xhs-local.js
 * 依赖: autocli (npm install -g autocli)
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const KEYWORDS = [
  '保险怎么买',
  '重疾险推荐',
  '医疗险攻略',
  '保险避坑',
  '家庭保险配置',
  '保险小白',
  '宝宝保险怎么买',
  '增额终身寿',
  '保险对比测评',
  '达尔文重疾险',
];

const OUTPUT_DIR = join(process.env.HOME || '.', 'Downloads', 'baopiao-data');
const MAX_PER_KEYWORD = 20; // 每个关键词最多采集条数

function run(command) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });
    return result;
  } catch (e) {
    console.error(`命令失败: ${command}`);
    console.error(e.message);
    return null;
  }
}

function parseAutocliOutput(output) {
  // autocli 输出可能是 table/json/md 格式，尝试解析
  try {
    // 尝试 JSON 格式
    const json = JSON.parse(output);
    return Array.isArray(json) ? json : (json.data || json.results || []);
  } catch {
    // 尝试解析 markdown/table 格式
    const lines = output.trim().split('\n');
    const results = [];
    let headers = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('─') || trimmed.startsWith('=') || trimmed.startsWith('搜索结果')) continue;

      // 尝试从 md 格式提取
      const mdMatch = trimmed.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/);
      if (mdMatch) {
        if (headers.length === 0) {
          headers = [mdMatch[1], mdMatch[2], mdMatch[3]];
        } else {
          results.push({ title: mdMatch[1], likes: mdMatch[2], url: mdMatch[3] });
        }
        continue;
      }

      // 尝试提取标题和链接
      const titleMatch = trimmed.match(/「(.+?)」/);
      const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
      if (titleMatch) {
        results.push({
          title: titleMatch[1],
          url: urlMatch ? urlMatch[1] : '',
          likes: 0,
        });
      }
    }

    return results;
  }
}

function searchKeyword(keyword) {
  console.log(`\n🔍 搜索: "${keyword}"`);
  const output = run(`autocli xiaohongshu search "${keyword}" --limit ${MAX_PER_KEYWORD} --format json 2>&1`);
  if (!output) return [];
  return parseAutocliOutput(output);
}

function calculateViralScore(likes, favorites, comments, shares) {
  return (likes || 0) * 0.4 + (favorites || 0) * 0.4 + (comments || 0) * 0.1 + (shares || 0) * 0.1;
}

async function collect() {
  console.log('========================================');
  console.log('小红书爆款笔记本地采集工具');
  console.log('========================================\n');

  // 检查 autocli
  const doctor = run('autocli doctor 2>&1');
  if (!doctor || !doctor.includes('Chrome extension connected')) {
    console.error('❌ autocli Chrome 扩展未连接！请先确保：');
    console.error('   1. Chrome 已安装 autocli 扩展');
    console.error('   2. Chrome 已打开并登录小红书');
    console.error('   3. 运行 autocli doctor 确认 connected ✓');
    process.exit(1);
  }
  console.log('✅ autocli 状态正常\n');

  const allCases = [];
  const seenTitles = new Set();

  for (const keyword of KEYWORDS) {
    const results = searchKeyword(keyword);
    let added = 0;

    for (const item of results.slice(0, 10)) {
      const title = item.title?.trim();
      if (!title || seenTitles.has(title)) continue;
      seenTitles.add(title);

      // 简单过滤：标题太短或明显不是保险相关
      if (title.length < 8) continue;

      const likes = parseInt(item.likes) || (item.likesCount || 0);
      const favorites = item.favoritesCount || 0;
      const comments = item.commentsCount || 0;
      const shares = item.sharesCount || 0;

      // 热度评分
      const viralScore = calculateViralScore(likes, favorites, comments, shares);

      // 过滤：点赞太低的跳过（但保留标题供分析）
      // 注：搜索结果中的点赞数可能不完整，只要标题相关就采集
      const publishedAt = item.publishedAt
        ? new Date(item.publishedAt)
        : item.time
        ? new Date(item.time)
        : null;

      // 排除超过15天的
      if (publishedAt) {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        if (publishedAt < fifteenDaysAgo) continue;
      }

      const tags = JSON.stringify([keyword]);

      allCases.push({
        platform: 'XHS',
        title,
        content: item.content || item.desc || item.note?.trim() || '',
        author: item.author || item.nickname || '',
        authorUrl: item.authorUrl || item.userUrl || '',
        likesCount: likes,
        favoritesCount: favorites,
        commentsCount: comments,
        sharesCount: shares,
        url: item.url || item.noteUrl || '',
        coverImage: item.cover || item.images?.[0] || '',
        tags,
        insuranceType: keyword,
        viralScore,
        publishedAt: publishedAt?.toISOString() || null,
        createdAt: new Date().toISOString(),
      });

      added++;
    }

    console.log(`   → 采集 ${added} 条新笔记`);
  }

  console.log(`\n========================================`);
  console.log(`✅ 共采集 ${allCases.length} 条笔记`);
  console.log(`========================================`);

  if (allCases.length === 0) {
    console.log('\n⚠️ 未采集到任何数据，可能原因：');
    console.log('   1. autocli 未获取到完整数据（尝试在 Chrome 中刷新小红书搜索页）');
    console.log('   2. 所有笔记点赞数都低于阈值');
    console.log('   3. autocli 扩展连接不稳定');
    process.exit(1);
  }

  // 统计
  const scoreMap = {};
  for (const c of allCases) {
    if (!scoreMap[c.insuranceType]) scoreMap[c.insuranceType] = 0;
    scoreMap[c.insuranceType]++;
  }
  console.log('\n各关键词采集情况：');
  for (const [kw, count] of Object.entries(scoreMap)) {
    console.log(`  ${kw}: ${count} 条`);
  }

  // 保存
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filePath = join(OUTPUT_DIR, `xhs-cases-${timestamp}.json`);
  writeFileSync(filePath, JSON.stringify(allCases, null, 2), 'utf-8');
  console.log(`\n📁 数据已保存到: ${filePath}`);
  console.log(`\n下一步：将此文件导入 Railway 数据库`);
  console.log(`   访问 http://localhost:3000/cases 导入 JSON`);

  return { filePath, count: allCases.length };
}

collect().catch(e => {
  console.error('采集失败:', e.message);
  process.exit(1);
});
