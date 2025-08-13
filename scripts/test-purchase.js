// 测试套餐购买流程
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPurchase() {
  try {
    console.log('=== 测试套餐购买流程 ===\n');
    
    // 1. 检查user_packages表是否存在
    console.log('1. 检查user_packages表...');
    const tableExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'user_packages'
    `;
    console.log('表存在检查结果:', tableExists);
    
    // 2. 查看表结构
    console.log('\n2. 查看user_packages表结构...');
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
      AND table_name = 'user_packages'
      ORDER BY ORDINAL_POSITION
    `;
    console.log('表字段:', columns);
    
    // 3. 查询现有记录
    console.log('\n3. 查询现有user_packages记录...');
    const existingRecords = await prisma.userPackage.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log('现有记录数:', existingRecords.length);
    
    if (existingRecords.length > 0) {
      console.log('最新记录:', existingRecords[0]);
    }
    
    // 4. 获取一个测试用户
    console.log('\n4. 获取测试用户...');
    const testUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (!testUser) {
      console.log('没有找到用户，请先注册一个用户');
      return;
    }
    
    console.log('测试用户:', {
      uuid: testUser.uuid,
      email: testUser.email,
      nickname: testUser.nickname
    });
    
    // 5. 获取一个测试套餐
    console.log('\n5. 获取测试套餐...');
    const testPackage = await prisma.package.findFirst({
      where: { isActive: true }
    });
    
    if (!testPackage) {
      console.log('没有找到活跃套餐，请先插入套餐数据');
      return;
    }
    
    console.log('测试套餐:', {
      id: testPackage.id,
      name: testPackage.name,
      price: testPackage.price,
      dailyCredits: testPackage.dailyCredits
    });
    
    // 6. 模拟创建user_package记录
    console.log('\n6. 尝试创建user_package记录...');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    try {
      const newUserPackage = await prisma.userPackage.create({
        data: {
          userUuid: testUser.uuid,
          packageId: testPackage.id,
          orderNo: 'TEST_' + Date.now(),
          startDate: startDate,
          endDate: endDate,
          dailyCredits: testPackage.dailyCredits,
          packageSnapshot: {
            name: testPackage.name,
            price: testPackage.price,
            dailyCredits: testPackage.dailyCredits
          },
          isActive: true,
          isAutoRenew: false
        }
      });
      
      console.log('✅ 成功创建user_package:', newUserPackage);
    } catch (error) {
      console.error('❌ 创建user_package失败:', error.message);
      console.error('详细错误:', error);
    }
    
    // 7. 初始化或更新credit_balances
    console.log('\n7. 初始化用户积分余额...');
    
    // 先检查是否已有记录
    let creditBalance = await prisma.creditBalance.findUnique({
      where: { userUuid: testUser.uuid }
    });
    
    if (!creditBalance) {
      console.log('用户还没有积分记录，创建新记录...');
      
      // 使用 upsert 创建或更新积分余额
      creditBalance = await prisma.creditBalance.upsert({
        where: { userUuid: testUser.uuid },
        update: {
          packageCredits: testPackage.dailyCredits,
          packageResetAt: new Date(),
        },
        create: {
          userUuid: testUser.uuid,
          packageCredits: testPackage.dailyCredits,
          packageResetAt: new Date(),
          independentCredits: 0,
          totalUsed: 0,
          totalPurchased: 0,
          version: 0,
        },
      });
      
      console.log('✅ 成功初始化积分余额');
      
      // 创建交易记录
      await prisma.creditTransaction.create({
        data: {
          transNo: `TRANS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userUuid: testUser.uuid,
          type: 'income',
          creditType: 'package',
          amount: testPackage.dailyCredits,
          beforeBalance: 0,
          afterBalance: testPackage.dailyCredits,
          orderNo: 'TEST_' + Date.now(),
          description: '激活套餐积分（测试）',
        },
      });
      
      console.log('✅ 成功创建交易记录');
    }
    
    // 显示当前积分
    console.log('用户积分:', {
      packageCredits: creditBalance.packageCredits,
      independentCredits: creditBalance.independentCredits,
      totalAvailable: creditBalance.packageCredits + creditBalance.independentCredits
    });
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPurchase().then(() => {
  console.log('\n=== 测试完成 ===');
});