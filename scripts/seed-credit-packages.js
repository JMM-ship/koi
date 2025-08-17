// 初始化积分套餐数据
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const creditPackages = [
  {
    name: '10K积分包',
    nameEn: '10K Credits',
    version: 'credits_v1',
    description: '10,000积分，适合轻度使用',
    price: 999, // 9.99元 (以分为单位)
    originalPrice: null,
    currency: 'CNY',
    dailyCredits: 10000, // 总积分数量
    validDays: 0, // 0表示永久有效
    planType: 'credits', // 标识为积分套餐
    features: {
      totalCredits: 10000,
      type: 'independent',
      expiry: 'never'
    },
    sortOrder: 101,
    isActive: true,
    isRecommended: false,
    tag: null,
  },
  {
    name: '50K积分包',
    nameEn: '50K Credits',
    version: 'credits_v1',
    description: '50,000积分，最受欢迎的选择',
    price: 3999, // 39.99元
    originalPrice: 4999, // 原价49.99元
    currency: 'CNY',
    dailyCredits: 50000, // 总积分数量
    validDays: 0,
    planType: 'credits',
    features: {
      totalCredits: 50000,
      type: 'independent',
      expiry: 'never',
      savings: '20%'
    },
    sortOrder: 102,
    isActive: true,
    isRecommended: true,
    tag: 'Popular',
  },
  {
    name: '100K积分包',
    nameEn: '100K Credits',
    version: 'credits_v1',
    description: '100,000积分，专业用户的选择',
    price: 6999, // 69.99元
    originalPrice: 9999, // 原价99.99元
    currency: 'CNY',
    dailyCredits: 100000, // 总积分数量
    validDays: 0,
    planType: 'credits',
    features: {
      totalCredits: 100000,
      type: 'independent',
      expiry: 'never',
      savings: '30%'
    },
    sortOrder: 103,
    isActive: true,
    isRecommended: false,
    tag: 'Save 30%',
  },
  {
    name: '500K积分包',
    nameEn: '500K Credits',
    version: 'credits_v1',
    description: '500,000积分，企业级容量',
    price: 29999, // 299.99元
    originalPrice: 49999, // 原价499.99元
    currency: 'CNY',
    dailyCredits: 500000, // 总积分数量
    validDays: 0,
    planType: 'credits',
    features: {
      totalCredits: 500000,
      type: 'independent',
      expiry: 'never',
      savings: '40%'
    },
    sortOrder: 104,
    isActive: true,
    isRecommended: false,
    tag: 'Save 40%',
  },
];

async function seedCreditPackages() {
  try {
    console.log('开始插入积分套餐数据...\n');
    
    // 检查并删除旧的积分套餐
    const oldCredits = await prisma.package.deleteMany({
      where: {
        planType: 'credits'
      }
    });
    
    if (oldCredits.count > 0) {
      console.log(`删除了 ${oldCredits.count} 个旧的积分套餐\n`);
    }
    
    // 插入新的积分套餐数据
    for (const pkg of creditPackages) {
      const created = await prisma.package.create({
        data: pkg,
      });
      
      console.log(`创建积分套餐: ${created.name}`);
      console.log(`  - 积分数量: ${created.dailyCredits.toLocaleString()}`);
      console.log(`  - 价格: ¥${(created.price/100).toFixed(2)}`);
      if (created.originalPrice) {
        console.log(`  - 原价: ¥${(created.originalPrice/100).toFixed(2)}`);
        const savings = Math.round((1 - created.price/created.originalPrice) * 100);
        console.log(`  - 优惠: ${savings}%`);
      }
      console.log('');
    }
    
    console.log('积分套餐数据插入完成！\n');
    
    // 显示所有积分套餐
    const allCreditPackages = await prisma.package.findMany({
      where: {
        planType: 'credits'
      },
      orderBy: { sortOrder: 'asc' },
    });
    
    console.log('当前所有积分套餐:');
    console.log('='.repeat(60));
    allCreditPackages.forEach(pkg => {
      const price = (pkg.price/100).toFixed(2);
      const credits = pkg.dailyCredits.toLocaleString();
      const pricePerK = (pkg.price / pkg.dailyCredits * 1000 / 100).toFixed(3);
      console.log(`${pkg.name.padEnd(15)} | ${credits.padStart(10)} 积分 | ¥${price.padStart(8)} | ¥${pricePerK}/1K积分`);
    });
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('插入积分套餐数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCreditPackages();