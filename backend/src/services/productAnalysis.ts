// 保险产品深度分析服务
// 按标准化条件计算：成人30岁/30万/30年交/保终身；儿童0岁/50万/30年交/保终身

import { prisma } from '../index.js';

interface ProductAnalysisInput {
  productName: string;
  company: string;
  insuranceType: string;
  sourceUrl?: string;
  content?: string;
}

interface ProductHighlight {
  category: string;
  title: string;
  value: string;
  unit?: string;
  comparison?: string; // 与竞品对比
}

interface ProductAdvantage {
  dimension: string;
  content: string;
  weight: 'high' | 'medium' | 'low';
}

interface CompetitorComparison {
  productName: string;
  dimensions: {
    name: string;
    thisProduct: string;
    competitor: string;
    winner: 'this' | 'competitor' | 'tie';
  }[];
}

interface DeepAnalysis {
  productName: string;
  company: string;
  insuranceType: string;
  
  // 价格信息（标准化计算）
  pricing: {
    adult: {
      age: number;
      coverage: string;
      paymentTerm: number;
      coverageTerm: string;
      annualPremium: number;
      monthlyPremium: number;
    };
    child: {
      age: number;
      coverage: number;
      paymentTerm: number;
      coverageTerm: string;
      annualPremium: number;
      monthlyPremium: number;
    };
  };
  
  // 产品亮点
  highlights: {
   重症: ProductHighlight[];
    中症: ProductHighlight[];
    轻症: ProductHighlight[];
    豁免: ProductHighlight[];
    特色: ProductHighlight[];
    增值服务: ProductHighlight[];
  };
  
  // 核心优势
  advantages: ProductAdvantage[];
  
  // 竞品对比
  competitors: CompetitorComparison[];
  
  // 产品缺点/注意事项
  drawbacks: {
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  
  // 适合人群
  suitableFor: string[];
  
  // 分析更新时间
  updatedAt: Date;
}

export class ProductAnalysisService {
  
  // 已知产品数据库（实际项目中可从数据库读取）
  private knownProducts: Record<string, any> = {
    '超级玛丽13号': {
      company: '君龙人寿',
      type: 'CRITICAL_ILLNESS',
      pricing: {
        adult30: { annual: 3000, monthly: 250 }, // 30岁/30万/30年交/保终身估算
        child0: { annual: 2500, monthly: 208 }    // 0岁/50万/30年交/保终身估算
      },
      highlights: {
        重症: [
          { category: '重症种类', title: '重疾种类数', value: '120种', comparison: '行业平均100种' },
          { category: '赔付次数', title: '重症赔付次数', value: '3次', comparison: '主流2次' },
          { category: '赔付比例', title: '每次赔付', value: '100%' },
          { category: '60岁前额外', title: '60岁前额外赔付', value: '80%', comparison: '行业较高' }
        ],
        中症: [
          { category: '中症种类', title: '中症种类数', value: '25种' },
          { category: '赔付次数', title: '赔付次数', value: '3次' },
          { category: '赔付比例', title: '每次赔付', value: '60%' }
        ],
        轻症: [
          { category: '轻症种类', title: '轻症种类数', value: '50种' },
          { category: '赔付次数', title: '赔付次数', value: '4次' },
          { category: '赔付比例', title: '每次赔付', value: '30%' },
          { category: '原位癌', title: '原位癌保障', value: '包含' }
        ],
        豁免: [
          { category: '投被保人豁免', title: '投被保人豁免', value: '轻/中/重症豁免' }
        ],
        特色: [
          { category: '癌症多次赔', title: '癌症津贴', value: '间隔1年，40%/年，最多3次' },
          { category: '心脑血管保障', title: '特定心脑血管', value: '可选，间隔期1年' },
          { category: 'ICU保障', title: 'ICU住院津贴', value: '1000元/天' }
        ],
        增值服务: [
          { category: '绿通', title: '重疾绿通', value: '覆盖300+医院' },
          { category: 'MDT', title: '多学科会诊', value: '可申请' },
          { category: '术后护理', title: '术后护理服务', value: '1年3次' }
        ]
      },
      advantages: [
        { dimension: '价格', content: '价格竞争力强，比同类产品低10-15%', weight: 'high' },
        { dimension: '保障', content: '60岁前额外赔付80%，保障力度大', weight: 'high' },
        { dimension: '核保', content: '健康告知仅3条，核保相对宽松', weight: 'high' },
        { dimension: '增值服务', content: '增值服务实用，覆盖医院多', weight: 'medium' }
      ],
      competitors: [
        {
          productName: '达尔文10号',
          dimensions: [
            { name: '年缴保费(30岁/30万)', thisProduct: '¥3,000', competitor: '¥3,500', winner: 'this' },
            { name: '重症赔付次数', thisProduct: '3次', competitor: '2次', winner: 'this' },
            { name: '60岁前额外赔', thisProduct: '80%', competitor: '60%', winner: 'this' },
            { name: '核保宽松度', thisProduct: '较宽松', competitor: '一般', winner: 'this' }
          ]
        }
      ],
      drawbacks: [
        { title: '等待期较长', description: '等待期180天，略长于部分竞品', severity: 'low' },
        { title: '心脑血管附加险', description: '需额外付费附加', severity: 'medium' }
      ],
      suitableFor: ['预算有限但追求高保障人群', '年轻家庭经济支柱', '希望价格实惠的用户']
    },
    '达尔文10号': {
      company: '复星联合健康险',
      type: 'CRITICAL_ILLNESS',
      pricing: {
        adult30: { annual: 3500, monthly: 292 },
        child0: { annual: 2800, monthly: 233 }
      },
      highlights: {
        重症: [
          { category: '重症种类', title: '重疾种类数', value: '110种' },
          { category: '赔付次数', title: '重症赔付次数', value: '2次' },
          { category: '60岁前额外', title: '60岁前额外赔付', value: '60%' }
        ],
        中症: [
          { category: '赔付比例', title: '每次赔付', value: '60%' }
        ],
        轻症: [
          { category: '赔付比例', title: '每次赔付', value: '30%' }
        ],
        豁免: [
          { category: '豁免范围', title: '轻/中/重症豁免', value: '包含' }
        ],
        特色: [
          { category: '重大疾病津贴', title: '重疾津贴', value: '确诊后每年给付10%，最多5次' },
          { category: '癌症多次赔', title: '癌症二次赔', value: '间隔3年，100%' }
        ],
        增值服务: [
          { category: '绿通', title: '就医绿通', value: '覆盖200+医院' },
          { category: '二诊', title: '专家二次诊疗', value: '可申请' }
        ]
      },
      advantages: [
        { dimension: '品牌', content: '复星联合专注健康险，品牌值得信赖', weight: 'high' },
        { dimension: '特色保障', content: '重疾津贴型设计，实用性好', weight: 'high' },
        { dimension: '核保', content: '智能核保系统完善', weight: 'medium' }
      ],
      competitors: [
        {
          productName: '超级玛丽13号',
          dimensions: [
            { name: '年缴保费', thisProduct: '¥3,500', competitor: '¥3,000', winner: 'competitor' },
            { name: '重症赔付', thisProduct: '2次', competitor: '3次', winner: 'competitor' }
          ]
        }
      ],
      drawbacks: [
        { title: '价格较高', description: '比同类产品贵10-15%', severity: 'medium' }
      ],
      suitableFor: ['追求大品牌用户', '重视癌症多次赔人群', '预算充足客户']
    },
    '妈咪宝贝MAX': {
      company: '复星联合健康险',
      type: 'CHILDREN_CRITICAL',
      pricing: {
        adult30: null,
        child0: { annual: 2800, monthly: 233 } // 0岁/50万/30年交/保终身
      },
      highlights: {
        重症: [
          { category: '少儿特疾', title: '少儿特疾保障', value: '20种，额外100%' },
          { category: '罕见病', title: '少儿罕见病', value: '10种，额外200%' },
          { category: '重症种类', title: '重疾种类数', value: '128种' }
        ],
        中症: [
          { category: '赔付比例', title: '每次赔付', value: '60%' }
        ],
        轻症: [
          { category: '赔付比例', title: '每次赔付', value: '30%' }
        ],
        豁免: [
          { category: '投保人豁免', title: '投被保人双豁免', value: '包含' }
        ],
        特色: [
          { category: '忠诚客户权益', title: '忠诚客户', value: '到期可免健康告知转同类产品' },
          { category: '重度癌症多次', title: '癌症多次赔', value: '可选，间隔3年' }
        ],
        增值服务: [
          { category: '健康管理', title: '少儿健康服务', value: '在线咨询等' }
        ]
      },
      advantages: [
        { dimension: '少儿保障', content: '少儿特疾覆盖全面，额外赔付高', weight: 'high' },
        { dimension: '忠诚权益', content: '忠诚客户权益，解决期满后投保难题', weight: 'high' },
        { dimension: '价格', content: '少儿重疾价格实惠', weight: 'high' }
      ],
      competitors: [
        {
          productName: '青云卫5号',
          dimensions: [
            { name: '少儿特疾额外赔', thisProduct: '100%', competitor: '120%', winner: 'tie' },
            { name: '价格', thisProduct: '实惠', competitor: '相近', winner: 'tie' }
          ]
        }
      ],
      drawbacks: [
        { title: '等待期', description: '等待期180天', severity: 'low' }
      ],
      suitableFor: ['0-17岁儿童', '关注少儿特疾保障家长', '追求性价比家庭']
    }
  };

  // 获取产品深度分析
  async getDeepAnalysis(productName: string, company?: string): Promise<DeepAnalysis | null> {
    // 先从已知产品库查找
    const known = this.knownProducts[productName];
    if (known) {
      return this.buildAnalysis(productName, known);
    }

    // 从数据库查找
    const dbProduct = await prisma.insuranceProduct.findFirst({
      where: {
        name: { contains: productName }
      }
    });

    if (dbProduct) {
      return this.buildAnalysisFromDB(dbProduct);
    }

    return null;
  }

  // 从已知产品构建分析
  private buildAnalysis(productName: string, data: any): DeepAnalysis {
    return {
      productName,
      company: data.company,
      insuranceType: data.type,
      pricing: {
        adult: data.pricing.adult30 ? {
          age: 30,
          coverage: '30万',
          paymentTerm: 30,
          coverageTerm: '终身',
          annualPremium: data.pricing.adult30.annual,
          monthlyPremium: data.pricing.adult30.monthly
        } : null,
        child: data.pricing.child0 ? {
          age: 0,
          coverage: 50,
          paymentTerm: 30,
          coverageTerm: '终身',
          annualPremium: data.pricing.child0.annual,
          monthlyPremium: data.pricing.child0.monthly
        } : null
      },
      highlights: data.highlights,
      advantages: data.advantages,
      competitors: data.competitors,
      drawbacks: data.drawbacks,
      suitableFor: data.suitableFor,
      updatedAt: new Date()
    };
  }

  // 从数据库产品构建分析
  private buildAnalysisFromDB(product: any): DeepAnalysis {
    return {
      productName: product.name,
      company: product.company,
      insuranceType: product.insuranceType,
      pricing: {
        adult: product.priceAdult30 ? {
          age: 30,
          coverage: '30万',
          paymentTerm: 30,
          coverageTerm: '终身',
          annualPremium: Number(product.priceAdult30),
          monthlyPremium: Number(product.priceAdult30) / 12
        } : null,
        child: product.priceChild0 ? {
          age: 0,
          coverage: 50,
          paymentTerm: 30,
          coverageTerm: '终身',
          annualPremium: Number(product.priceChild0),
          monthlyPremium: Number(product.priceChild0) / 12
        } : null
      },
      highlights: {
        重症: [],
        中症: [],
        轻症: [],
        豁免: [],
        特色: [],
        增值服务: []
      },
      advantages: [],
      competitors: [],
      drawbacks: [],
      suitableFor: [],
      updatedAt: new Date()
    };
  }

  // 添加/更新产品分析
  async upsertProduct(input: ProductAnalysisInput, analysis: Partial<DeepAnalysis>) {
    return await prisma.insuranceProduct.upsert({
      where: {
        id: (await prisma.insuranceProduct.findFirst({
          where: { name: input.productName }
        }))?.id || 0
      },
      create: {
        name: input.productName,
        company: input.company,
        insuranceType: input.insuranceType,
        highlights重症: JSON.stringify(analysis.highlights?.重症 || []),
        highlights轻症: JSON.stringify(analysis.highlights?.轻症 || []),
        highlights豁免: JSON.stringify(analysis.highlights?.豁免 || []),
        highlights特色: JSON.stringify(analysis.highlights?.特色 || []),
        highlights增值: JSON.stringify(analysis.highlights?.增值服务 || []),
        advantagesPrice: JSON.stringify(analysis.advantages || []),
        competitors: JSON.stringify(analysis.competitors || []),
        drawbacks: JSON.stringify(analysis.drawbacks || []),
        sourceUrl: input.sourceUrl,
        lastUpdated: new Date()
      },
      update: {
        highlights重症: JSON.stringify(analysis.highlights?.重症 || []),
        highlights轻症: JSON.stringify(analysis.highlights?.轻症 || []),
        highlights豁免: JSON.stringify(analysis.highlights?.豁免 || []),
        highlights特色: JSON.stringify(analysis.highlights?.特色 || []),
        highlights增值: JSON.stringify(analysis.highlights?.增值服务 || []),
        advantagesPrice: JSON.stringify(analysis.advantages || []),
        competitors: JSON.stringify(analysis.competitors || []),
        drawbacks: JSON.stringify(analysis.drawbacks || []),
        lastUpdated: new Date()
      }
    });
  }

  // 获取竞品对比报告
  async getCompetitorReport(productA: string, productB: string): Promise<CompetitorComparison | null> {
    const analysisA = await this.getDeepAnalysis(productA);
    const analysisB = await this.getDeepAnalysis(productB);

    if (!analysisA || !analysisB) return null;

    const dimensions = [
      {
        name: '年缴保费(30岁/30万)',
        thisProduct: analysisA.pricing.adult ? `¥${analysisA.pricing.adult.annual.toLocaleString()}` : 'N/A',
        competitor: analysisB.pricing.adult ? `¥${analysisB.pricing.adult.annual.toLocaleString()}` : 'N/A',
        winner: this.comparePrice(analysisA.pricing.adult?.annual || 0, analysisB.pricing.adult?.annual || 0)
      }
    ];

    return {
      productName: productB,
      dimensions
    };
  }

  private comparePrice(priceA: number, priceB: number): 'this' | 'competitor' | 'tie' {
    if (priceA === priceB) return 'tie';
    return priceA < priceB ? 'this' : 'competitor';
  }
}

export default new ProductAnalysisService();
