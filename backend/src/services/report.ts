// 数据统计服务
import { prisma } from '../index.js';

export interface DashboardStats {
  overview: {
    totalIntelligence: number;
    totalCases: number;
    totalUsers: number;
    todayNewIntelligence: number;
    todayNewCases: number;
  };
  hotTrends: {
    hotKeywords: Array<{ keyword: string; count: number }>;
    hotCategories: Array<{ category: string; count: number }>;
    hotSources: Array<{ source: string; count: number }>;
  };
  viralInsights: {
    topPlatform: { platform: string; count: number };
    avgViralScore: number;
    topCases: Array<{
      title: string;
      platform: string;
      likesCount: number;
      viralScore: number;
    }>;
  };
  userActivity: {
    activeUsers: number;
    topUsers: Array<{
      username: string;
      savedCount: number;
      generatedCount: number;
    }>;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    user: string;
    time: Date;
  }>;
}

export class ReportService {
  // 获取仪表盘统计数据
  async getDashboardStats(teamId?: number): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 基础查询条件
    const userWhere = teamId ? { teamId } : {};

    // 概览统计
    const [
      totalIntelligence,
      totalCases,
      totalUsers,
      todayNewIntelligence,
      todayNewCases
    ] = await Promise.all([
      prisma.intelligence.count(),
      prisma.viralCase.count(),
      prisma.user.count({ where: { isActive: true, ...userWhere } }),
      prisma.intelligence.count({ where: { createdAt: { gte: today } } }),
      prisma.viralCase.count({ where: { createdAt: { gte: today } } })
    ]);

    // 热门趋势
    const hotKeywords = await this.getHotKeywords();
    const hotCategories = await this.getHotCategories();
    const hotSources = await this.getHotSources();

    // 爆款洞察
    const viralInsights = await this.getViralInsights();

    // 用户活动
    const userActivity = await this.getUserActivity(teamId);

    // 最近活动
    const recentActivity = await this.getRecentActivity(teamId);

    return {
      overview: {
        totalIntelligence,
        totalCases,
        totalUsers,
        todayNewIntelligence,
        todayNewCases
      },
      hotTrends: {
        hotKeywords,
        hotCategories,
        hotSources
      },
      viralInsights,
      userActivity,
      recentActivity
    };
  }

  // 获取热门关键词
  private async getHotKeywords(): Promise<Array<{ keyword: string; count: number }>> {
    const intelligences = await prisma.intelligence.findMany({
      select: { tags: true }
    });

    const keywordCount: Record<string, number> = {};
    intelligences.forEach(i => {
      i.tags?.forEach(tag => {
        keywordCount[tag] = (keywordCount[tag] || 0) + 1;
      });
    });

    return Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
  }

  // 获取热门分类
  private async getHotCategories(): Promise<Array<{ category: string; count: number }>> {
    const result = await prisma.intelligence.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    return result.map(r => ({
      category: r.category,
      count: r._count.id
    }));
  }

  // 获取热门来源
  private async getHotSources(): Promise<Array<{ source: string; count: number }>> {
    const result = await prisma.intelligence.groupBy({
      by: ['source'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    return result.map(r => ({
      source: r.source,
      count: r._count.id
    }));
  }

  // 获取爆款洞察
  private async getViralInsights(): Promise<DashboardStats['viralInsights']> {
    // 各平台数量
    const platformStats = await prisma.viralCase.groupBy({
      by: ['platform'],
      _count: { id: true }
    });

    const topPlatform = platformStats.length > 0
      ? { platform: platformStats[0].platform, count: platformStats[0]._count.id }
      : { platform: 'N/A', count: 0 };

    // 平均爆款分数
    const avgScore = await prisma.viralCase.aggregate({
      _avg: { viralScore: true }
    });

    // Top 案例
    const topCases = await prisma.viralCase.findMany({
      orderBy: { viralScore: 'desc' },
      take: 10,
      select: {
        title: true,
        platform: true,
        likesCount: true,
        viralScore: true
      }
    });

    return {
      topPlatform,
      avgViralScore: avgScore._avg.viralScore || 0,
      topCases
    };
  }

  // 获取用户活动统计
  private async getUserActivity(teamId?: number): Promise<DashboardStats['userActivity']> {
    const userWhere = teamId ? { teamId } : {};

    // 活跃用户数（最近7天有操作）
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const activeUsers = await prisma.activityLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: weekAgo } }
    });

    // Top 用户
    const topUsersData = await prisma.user.findMany({
      where: { isActive: true, ...userWhere },
      select: {
        username: true,
        _count: {
          select: {
            savedIntelligences: true,
            savedCases: true,
            savedTitles: true
          }
        }
      }
    });

    const topUsers = topUsersData
      .map(u => ({
        username: u.username,
        savedCount: u._count.savedIntelligences + u._count.savedCases,
        generatedCount: u._count.savedTitles
      }))
      .sort((a, b) => b.savedCount + b.generatedCount - (a.savedCount + a.generatedCount))
      .slice(0, 10);

    return {
      activeUsers: activeUsers.length,
      topUsers
    };
  }

  // 获取最近活动
  private async getRecentActivity(teamId?: number): Promise<DashboardStats['recentActivity']> {
    const userWhere = teamId ? { user: { teamId } } : {};

    const activities = await prisma.activityLog.findMany({
      where: userWhere,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { username: true } } }
    });

    return activities.map(a => ({
      type: a.action,
      description: this.getActivityDescription(a),
      user: a.user.username,
      time: a.createdAt
    }));
  }

  // 生成活动描述
  private getActivityDescription(log: any): string {
    switch (log.action) {
      case 'GENERATE_TITLES':
        return `生成了标题，关键词：${log.details?.keywords?.join(', ')}`;
      case 'SAVE_TITLE':
        return '保存了标题';
      case 'SAVE_CASE':
        return '收藏了爆款案例';
      case 'SAVE_INTELLIGENCE':
        return '收藏了情报';
      default:
        return log.action;
    }
  }

  // 生成日报
  async generateDailyReport(teamId?: number): Promise<string> {
    const stats = await this.getDashboardStats(teamId);

    let report = `# 📊 爆款情报站日报\n\n`;
    report += `**日期**: ${new Date().toLocaleDateString('zh-CN')}\n\n`;

    report += `## 📈 数据概览\n\n`;
    report += `| 指标 | 数值 |\n`;
    report += `|------|------|\n`;
    report += `| 总情报数 | ${stats.overview.totalIntelligence} |\n`;
    report += `| 总爆款案例 | ${stats.overview.totalCases} |\n`;
    report += `| 团队用户 | ${stats.overview.totalUsers} |\n`;
    report += `| 今日新增情报 | ${stats.overview.todayNewIntelligence} |\n`;
    report += `| 今日新增案例 | ${stats.overview.todayNewCases} |\n\n`;

    if (stats.hotTrends.hotKeywords.length > 0) {
      report += `## 🔥 热门关键词\n\n`;
      stats.hotTrends.hotKeywords.slice(0, 5).forEach((k, i) => {
        report += `${i + 1}. ${k.keyword} (${k.count})\n`;
      });
      report += '\n';
    }

    if (stats.viralInsights.topCases.length > 0) {
      report += `## ⭐ 热门爆款案例\n\n`;
      stats.viralInsights.topCases.slice(0, 5).forEach((c, i) => {
        report += `${i + 1}. ${c.title}\n`;
        report += `   - 平台: ${c.platform} | 点赞: ${c.likesCount} | 爆款分: ${c.viralScore?.toFixed(1)}\n`;
      });
      report += '\n';
    }

    return report;
  }
}

export default new ReportService();
