// 检查套餐数据
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPackages() {
  try {
    console.log('检查套餐数据...\n');
    
    // 获取所有套餐
    const packages = await prisma.package.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    
    console.log(`找到 ${packages.length} 个套餐:\n`);
    
    if (packages.length === 0) {
      console.log('数据库中没有套餐数据！');
      console.log('请运行: node scripts/seed-packages.js 来添加套餐数据\n');
    } else {
      packages.forEach(pkg => {
        console.log(`套餐: ${pkg.name}`);
        console.log(`  - ID: ${pkg.id}`);
        console.log(`  - 类型: ${pkg.planType || '未设置'}`);
        console.log(`  - 价格: ¥${pkg.price/100}`);
        console.log(`  - 每日积分: ${pkg.dailyCredits}`);
        console.log(`  - 有效天数: ${pkg.validDays}天`);
        console.log(`  - 状态: ${pkg.isActive ? '激活' : '未激活'}`);
        console.log(`  - 推荐: ${pkg.isRecommended ? '是' : '否'}`);
        console.log('');
      });
    }
    
    // 检查API访问
    console.log('测试API访问...');
    try {
      const response = await fetch('http://localhost:3000/api/packages');
      const data = await response.json();
      
      if (data.success) {
        console.log('API访问成功！');
        console.log(`API返回 ${data.data?.packages?.length || 0} 个套餐`);
      } else {
        console.log('API访问失败:', data.error);
      }
    } catch (error) {
      console.log('无法访问API (服务器可能未启动)');
      console.log('请运行: npm run dev');
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPackages();