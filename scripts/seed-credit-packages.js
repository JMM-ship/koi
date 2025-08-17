// 初始化积分套餐数据
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const creditPackages = [
  {
    name: '10K Credits Pack',
    nameEn: '10K Credits',
    version: 'credits_v1',
    description: '10,000 credits for light usage',
    price: 999, // 9.99 CNY (in cents)
    originalPrice: null,
    currency: 'CNY',
    dailyCredits: 10000, // Total credits amount
    validDays: 0, // 0 means never expires
    planType: 'credits', // Identifies as credit package
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
    name: '50K Credits Pack',
    nameEn: '50K Credits',
    version: 'credits_v1',
    description: '50,000 credits - Most popular choice',
    price: 3999, // 39.99 CNY
    originalPrice: 4999, // Original price 49.99 CNY
    currency: 'CNY',
    dailyCredits: 50000, // Total credits amount
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
    name: '100K Credits Pack',
    nameEn: '100K Credits',
    version: 'credits_v1',
    description: '100,000 credits for professional users',
    price: 6999, // 69.99 CNY
    originalPrice: 9999, // Original price 99.99 CNY
    currency: 'CNY',
    dailyCredits: 100000, // Total credits amount
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
    name: '500K Credits Pack',
    nameEn: '500K Credits',
    version: 'credits_v1',
    description: '500,000 credits for enterprise scale',
    price: 29999, // 299.99 CNY
    originalPrice: 49999, // Original price 499.99 CNY
    currency: 'CNY',
    dailyCredits: 500000, // Total credits amount
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
    console.log('Starting to insert credit package data...\n');
    
    // Check and delete old credit packages
    const oldCredits = await prisma.package.deleteMany({
      where: {
        planType: 'credits'
      }
    });
    
    if (oldCredits.count > 0) {
      console.log(`Deleted ${oldCredits.count} old credit package(s)\n`);
    }
    
    // Insert new credit package data
    for (const pkg of creditPackages) {
      const created = await prisma.package.create({
        data: pkg,
      });
      
      console.log(`Created credit package: ${created.name}`);
      console.log(`  - Credits amount: ${created.dailyCredits.toLocaleString()}`);
      console.log(`  - Price: ¥${(created.price/100).toFixed(2)}`);
      if (created.originalPrice) {
        console.log(`  - Original price: ¥${(created.originalPrice/100).toFixed(2)}`);
        const savings = Math.round((1 - created.price/created.originalPrice) * 100);
        console.log(`  - Discount: ${savings}%`);
      }
      console.log('');
    }
    
    console.log('Credit package data insertion completed!\n');
    
    // Display all credit packages
    const allCreditPackages = await prisma.package.findMany({
      where: {
        planType: 'credits'
      },
      orderBy: { sortOrder: 'asc' },
    });
    
    console.log('Current credit packages:');
    console.log('='.repeat(60));
    allCreditPackages.forEach(pkg => {
      const price = (pkg.price/100).toFixed(2);
      const credits = pkg.dailyCredits.toLocaleString();
      const pricePerK = (pkg.price / pkg.dailyCredits * 1000 / 100).toFixed(3);
      console.log(`${pkg.name.padEnd(20)} | ${credits.padStart(10)} credits | ¥${price.padStart(8)} | ¥${pricePerK}/1K credits`);
    });
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Failed to insert credit package data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCreditPackages();