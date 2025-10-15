// 测试Prisma是否正常工作
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrisma() {
  try {
    console.log('🔍 测试Prisma连接...\n');
    
    // 1. 测试套餐表
    console.log('📦 检查套餐表...');
    const packages = await prisma.package.findMany();
    console.log(`✅ 找到 ${packages.length} 个套餐`);
    
    // 2. 测试积分余额表
    console.log('\n💰 检查积分余额表...');
    const balanceCount = await prisma.creditBalance.count();
    console.log(`✅ 积分余额表有 ${balanceCount} 条记录`);
    
    // 3. 测试积分流水表
    console.log('\n📝 检查积分流水表...');
    const transactionCount = await prisma.creditTransaction.count();
    console.log(`✅ 积分流水表有 ${transactionCount} 条记录`);
    
    // 4. 测试用户套餐表
    console.log('\n👤 检查用户套餐表...');
    const userPackageCount = await prisma.userPackage.count();
    console.log(`✅ 用户套餐表有 ${userPackageCount} 条记录`);
    
    // 5. 显示套餐列表
    if (packages.length > 0) {
      console.log('\n📋 套餐列表:');
      packages.forEach(pkg => {
        console.log(`  - ${pkg.name}: ¥${pkg.price/100} (${pkg.dailyCredits}积分/天)`);
      });
    }
    
    console.log('\n✨ Prisma测试成功！所有表都可以正常访问。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('\n请确保已经执行了: npx prisma generate');
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();