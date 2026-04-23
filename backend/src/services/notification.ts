// 通知服务 - 支持飞书、邮件等多种渠道
import axios from 'axios';
import nodemailer from 'nodemailer';
import { prisma } from '../index.js';

export interface NotificationPayload {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'daily_summary';
  data?: any;
}

export interface UserPreferences {
  email: boolean;
  feishu: boolean;
  browser: boolean;
}

// 通知服务类
class NotificationService {
  private feishuWebhook: string = '';
  private emailTransport: nodemailer.Transporter | null = null;

  constructor() {
    this.initEmailTransport();
  }

  // 初始化邮件服务
  private initEmailTransport() {
    if (process.env.SMTP_HOST) {
      this.emailTransport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  // 设置飞书 Webhook
  setFeishuWebhook(webhook: string) {
    this.feishuWebhook = webhook;
  }

  // 发送飞书消息
  async sendFeishu(notification: NotificationPayload): Promise<boolean> {
    if (!this.feishuWebhook) {
      console.log('飞书 Webhook 未配置');
      return false;
    }

    try {
      // 富文本消息卡片格式
      const card = {
        msg_type: 'interactive',
        card: {
          header: {
            title: {
              tag: 'plain_text',
              content: this.getTypeEmoji(notification.type) + ' ' + notification.title
            },
            template: this.getColorByType(notification.type)
          },
          elements: [
            {
              tag: 'markdown',
              content: notification.content
            },
            {
              tag: 'hr'
            },
            {
              tag: 'note',
              elements: [
                {
                  tag: 'plain_text',
                  content: `来自爆款情报站 · ${new Date().toLocaleString()}`
                }
              ]
            }
          ]
        }
      };

      await axios.post(this.feishuWebhook, card);
      return true;
    } catch (error: any) {
      console.error('飞书通知发送失败:', error.message);
      return false;
    }
  }

  // 发送邮件
  async sendEmail(to: string, notification: NotificationPayload): Promise<boolean> {
    if (!this.emailTransport) {
      console.log('邮件服务未配置');
      return false;
    }

    try {
      await this.emailTransport.sendMail({
        from: process.env.SMTP_FROM || '"爆款情报站" <noreply@baopiang.com>',
        to,
        subject: `${this.getTypeEmoji(notification.type)} ${notification.title}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ff6b6b, #4ecdc4); padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔥 爆款情报站</h1>
            </div>
            <div style="background: #f8f9fa; padding: 24px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333; margin-top: 0;">${notification.title}</h2>
              <div style="color: #666; line-height: 1.6;">${notification.content}</div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">
                发送时间：${new Date().toLocaleString()}<br/>
                <a href="${process.env.API_BASE_URL}" style="color: #ff6b6b;">打开爆款情报站</a>
              </p>
            </div>
          </div>
        `
      });
      return true;
    } catch (error: any) {
      console.error('邮件发送失败:', error.message);
      return false;
    }
  }

  // 发送浏览器通知
  async sendBrowserNotification(userId: number, notification: NotificationPayload): Promise<boolean> {
    // 检查用户是否开启了浏览器通知
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true }
      });

      const prefs = user?.preferences as any;
      if (!prefs?.notifications?.browser) {
        return false;
      }

      // 浏览器通知需要前端配合，这里只记录
      console.log(`浏览器通知 [${userId}]: ${notification.title}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // 广播通知给团队所有成员
  async broadcastToTeam(teamId: number, notification: NotificationPayload): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: { teamId },
        select: { id: true, email: true, preferences: true }
      });

      for (const user of users) {
        const prefs = user.preferences as any || {};

        // 根据用户偏好发送
        if (prefs.notifications?.email) {
          await this.sendEmail(user.email, notification);
        }

        await this.sendBrowserNotification(user.id, notification);
      }

      // 飞书通知
      await this.sendFeishu(notification);

    } catch (error) {
      console.error('广播通知失败:', error);
    }
  }

  // 发送每日摘要
  async sendDailySummary(teamId: number): Promise<void> {
    try {
      // 获取今日数据统计
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [intelligenceCount, caseCount, newCases] = await Promise.all([
        prisma.intelligence.count({
          where: { createdAt: { gte: today } }
        }),
        prisma.viralCase.count({
          where: { createdAt: { gte: today } }
        }),
        prisma.viralCase.findMany({
          where: { createdAt: { gte: today } },
          orderBy: { viralScore: 'desc' },
          take: 5,
          select: { title: true, likesCount: true, viralScore: true }
        })
      ]);

      // 获取热门情报
      const hotIntelligences = await prisma.intelligence.findMany({
        where: { createdAt: { gte: today } },
        orderBy: { hotScore: 'desc' },
        take: 5,
        select: { title: true, category: true, hotScore: true }
      });

      // 构建摘要内容
      let content = `📊 **今日数据概览**\n\n`;
      content += `- 新增情报：**${intelligenceCount}** 条\n`;
      content += `- 新增爆款案例：**${caseCount}** 条\n\n`;

      if (newCases.length > 0) {
        content += `🔥 **今日爆款案例 TOP5**\n`;
        newCases.forEach((c, i) => {
          content += `${i + 1}. ${c.title} (👍${c.likesCount})\n`;
        });
        content += '\n';
      }

      if (hotIntelligences.length > 0) {
        content += `📰 **热门情报 TOP5**\n`;
        hotIntelligences.forEach((item, i) => {
          content += `${i + 1}. [${item.category}] ${item.title}\n`;
        });
      }

      await this.broadcastToTeam(teamId, {
        title: '📋 爆款情报站 - 每日摘要',
        content,
        type: 'daily_summary'
      });

    } catch (error) {
      console.error('发送每日摘要失败:', error);
    }
  }

  // 发送紧急提醒
  async sendUrgentAlert(teamId: number, title: string, content: string, relatedUrl?: string): Promise<void> {
    let fullContent = content;
    if (relatedUrl) {
      fullContent += `\n\n[查看详情](${relatedUrl})`;
    }

    await this.broadcastToTeam(teamId, {
      title: `🚨 紧急提醒：${title}`,
      content: fullContent,
      type: 'urgent'
    });
  }

  // 根据类型获取表情
  private getTypeEmoji(type: string): string {
    const map: Record<string, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      urgent: '🚨',
      daily_summary: '📋'
    };
    return map[type] || '📢';
  }

  // 根据类型获取颜色
  private getColorByType(type: string): string {
    const map: Record<string, string> = {
      info: 'blue',
      warning: 'yellow',
      urgent: 'red',
      daily_summary: 'purple'
    };
    return map[type] || 'grey';
  }
}

// 导出单例
const notificationService = new NotificationService();
export default notificationService;
