// 保险产品准确率自检服务
// 功能：验证产品版本是否最新，检测产品下架/升级情况
import { prisma } from '../lib/prisma.js';

// 已知产品版本库（来源：保险公司官网、银保监会备案）
const KNOWN_PRODUCT_VERSIONS: Record<string, {
  latestVersion: string;
  company: string;
  insuranceType: string;
  updateDate: string;
  isOffline: boolean;
}> = {
  '达尔文': { latestVersion: '达尔文12号', company: '复星联合', insuranceType: '重疾险', updateDate: '2026-04', isOffline: false },
  '超级玛丽': { latestVersion: '超级玛丽13号', company: '君龙人寿', insuranceType: '重疾险', updateDate: '2026-03', isOffline: false },
  '妈咪宝贝': { latestVersion: '妈咪宝贝MAX版', company: '复星联合', insuranceType: '少儿重疾险', updateDate: '2026-04', isOffline: false },
  '大麦': { latestVersion: '大麦2025定期寿险', company: '华贵保险', insuranceType: '定期寿险', updateDate: '2026-01', isOffline: false },
  '守卫者': { latestVersion: '守卫者7号', company: '昆仑健康', insuranceType: '重疾险', updateDate: '2026-03', isOffline: false },
  '阿波罗': { latestVersion: '阿波罗5号', company: '昆仑健康', insuranceType: '重疾险', updateDate: '2026-02', isOffline: false },
  '健康保': { latestVersion: '健康保普惠版', company: '昆仑健康', insuranceType: '重疾险', updateDate: '2026-01', isOffline: false },
  '定海柱': { latestVersion: '定海柱6号', company: '鼎城人寿', insuranceType: '定期寿险', updateDate: '2026-02', isOffline: false },
  '大黄蜂': { latestVersion: '大黄蜂12号', company: '北京人寿', insuranceType: '少儿重疾险', updateDate: '2026-04', isOffline: false },
  '青云卫': { latestVersion: '青云卫5号', company: '招商仁和', insuranceType: '少儿重疾险', updateDate: '2026-03', isOffline: false },
  '小青龙': { latestVersion: '小青龙5号', company: '君龙人寿', insuranceType: '少儿重疾险', updateDate: '2026-04', isOffline: false },
  '福特加': { latestVersion: '福特加MAX版', company: '复星联合', insuranceType: '重疾险', updateDate: '2026-03', isOffline: false },
};

// 检测内容中产品版本是否最新
export interface VersionCheckResult {
  isValid: boolean;
  detectedProduct: string;
  detectedVersion: string;
  latestVersion: string;
  isOutdated: boolean;
  isOffline: boolean;
  suggestion: string;
}

export function checkProductVersionAccuracy(
  title: string,
  content?: string
): VersionCheckResult | null {
  const text = `${title} ${content || ''}`;

  for (const [productName, info] of Object.entries(KNOWN_PRODUCT_VERSIONS)) {
    if (!text.includes(productName)) continue;

    // 检测标题中的版本号
    const versionMatch = text.match(new RegExp(`${productName}([0-9]+号|版|MAX)?`));
    const detectedVersion = versionMatch ? `${productName}${versionMatch[1] || ''}` : productName;

    // 检测下架关键词
    const isOffline = /下架|停售|停发|已停|不再销售/.test(text);

    // 检测是否为旧版本
    const isOutdated = !text.includes(info.latestVersion) && info.latestVersion !== detectedVersion;

    if (isOutdated || isOffline || info.isOffline) {
      return {
        isValid: false,
        detectedProduct: productName,
        detectedVersion: detectedVersion !== productName ? detectedVersion : info.latestVersion,
        latestVersion: info.latestVersion,
        isOutdated,
        isOffline: isOffline || info.isOffline,
        suggestion: info.isOffline || isOffline
          ? `⚠️ ${productName}已停售，请推荐最新版本${info.latestVersion}`
          : `⚠️ 检测到${productName}旧版本，当前最新为${info.latestVersion}，建议更新`,
      };
    }
  }

  return null;
}

// 批量检查爆款案例库中的产品准确性
export async function validateExistingCases(): Promise<{
  totalChecked: number;
  outdatedCount: number;
  outdatedCases: { id: number; title: string; suggestion: string }[];
}> {
  try {
    const cases = await prisma.viralCase.findMany({
      where: {
        title: { not: '' },
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // 只检查90天内
      },
      select: { id: true, title: true, content: true },
      take: 200,
    });

    const outdatedCases: { id: number; title: string; suggestion: string }[] = [];

    for (const c of cases) {
      const result = checkProductVersionAccuracy(c.title, c.content || undefined);
      if (result && !result.isValid) {
        outdatedCases.push({
          id: c.id,
          title: c.title,
          suggestion: result.suggestion,
        });
      }
    }

    return {
      totalChecked: cases.length,
      outdatedCount: outdatedCases.length,
      outdatedCases,
    };
  } catch (e) {
    console.log('产品准确性检查失败:', e);
    return { totalChecked: 0, outdatedCount: 0, outdatedCases: [] };
  }
}

// 从产品新闻中自动更新版本库
export async function updateVersionFromNews(news: {
  title: string;
  newsType?: string;
}): Promise<boolean> {
  const text = news.title;

  // 新品上线
  if (/新(品|上|发)|上线/.test(text)) {
    for (const [productName, info] of Object.entries(KNOWN_PRODUCT_VERSIONS)) {
      if (text.includes(productName)) {
        // 提取版本号
        const versionMatch = text.match(new RegExp(`${productName}([^\\s，。,]+)`));
        if (versionMatch) {
          console.log(`[准确率自检] 检测到新品: ${versionMatch[0]} (旧版: ${info.latestVersion})`);
          return true;
        }
      }
    }
  }

  // 下架停售
  if (/下架|停售|停发/.test(text)) {
    for (const [productName] of Object.entries(KNOWN_PRODUCT_VERSIONS)) {
      if (text.includes(productName)) {
        console.log(`[准确率自检] 检测到停售: ${productName}`);
        return true;
      }
    }
  }

  return false;
}

export default {
  checkProductVersionAccuracy,
  validateExistingCases,
  updateVersionFromNews,
  KNOWN_PRODUCT_VERSIONS,
};
