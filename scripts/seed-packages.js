// 初始化套餐数据
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const packages = [
  {
    name: '基础版',
    nameEn: 'Basic',
    version: 'v1.0.0',
    description: '适合个人用户和小团队',
    price: 9900, // 99元 (以分为单位)
    originalPrice: null,
    currency: 'CNY',
    dailyCredits: 100,
    validDays: 30,
    planType: 'basic',
    features: {
      maxRequests: 100,
      supportPriority: 'standard',
      models: ['GPT-3.5', 'Claude-2'],
    },
    sortOrder: 1,
    isActive: true,
    isRecommended: false,
    tag: null,
  },
  {
    name: '专业版',
    nameEn: 'Professional',
    version: 'v1.0.0',
    description: '适合专业用户和成长型团队',
    price: 29900, // 299元
    originalPrice: 39900, // 原价399元
    currency: 'CNY',
    dailyCredits: 500,
    validDays: 30,
    planType: 'pro',
    features: {
      maxRequests: 500,
      supportPriority: 'priority',
      models: ['GPT-4', 'Claude-3', 'DALL-E'],
      advancedFeatures: true,
    },
    sortOrder: 2,
    isActive: true,
    isRecommended: true,
    tag: 'HOT',
  },
  {
    name: '企业版',
    nameEn: 'Enterprise',
    version: 'v1.0.0',
    description: '适合大型团队和企业',
    price: 99900, // 999元
    originalPrice: null,
    currency: 'CNY',
    dailyCredits: 2000,
    validDays: 30,
    planType: 'enterprise',
    features: {
      maxRequests: 'unlimited',
      supportPriority: 'vip',
      models: 'all',
      advancedFeatures: true,
      customization: true,
      dedicatedSupport: true,
    },
    sortOrder: 3,
    isActive: true,
    isRecommended: false,
    tag: 'VIP',
  },
];

async function seedPackages() {
  try {
    console.log('开始插入套餐数据...');
    
    // 清空现有套餐（可选）
    // await prisma.package.deleteMany();
    
    // 插入套餐数据
    for (const pkg of packages) {
      const existing = await prisma.package.findFirst({
        where: {
          name: pkg.name,
          version: pkg.version,
        }
      });
      
      if (existing) {
        console.log(`套餐 ${pkg.name} 已存在，跳过`);
        continue;
      }
      
      const created = await prisma.package.create({
        data: pkg,
      });
      
      console.log(`创建套餐: ${created.name} (${created.planType})`);
    }
    
    console.log('套餐数据插入完成！');
    
    // 显示所有套餐
    const allPackages = await prisma.package.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    
    console.log('\n当前所有套餐:');
    allPackages.forEach(pkg => {
      console.log(`- ${pkg.name} (${pkg.planType}): ¥${pkg.price/100} / ${pkg.dailyCredits}积分/天`);
    });
    
  } catch (error) {
    console.error('插入套餐数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPackages();