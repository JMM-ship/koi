// 测试购买积分功能
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreditPurchase() {
  try {
    console.log('='.repeat(60));
    console.log('测试购买积分功能');
    console.log('='.repeat(60));
    console.log('');
    
    // 1. 检查积分套餐是否存在
    console.log('1. 检查积分套餐...');
    const creditPackages = await prisma.package.findMany({
      where: {
        planType: 'credits',
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
    
    if (creditPackages.length === 0) {
      console.log('❌ 没有找到积分套餐！');
      console.log('请先运行: node scripts/seed-credit-packages.js');
      return;
    }
    
    console.log(`✅ 找到 ${creditPackages.length} 个积分套餐:`);
    creditPackages.forEach(pkg => {
      const price = (pkg.price / 100).toFixed(2);
      const credits = pkg.dailyCredits.toLocaleString();
      console.log(`   - ${pkg.name}: ${credits} 积分 / ¥${price}`);
    });
    console.log('');
    
    // 2. 选择一个套餐进行测试
    const testPackage = creditPackages[1] || creditPackages[0]; // 选择50K套餐或第一个
    console.log('2. 选择测试套餐:');
    console.log(`   套餐: ${testPackage.name}`);
    console.log(`   积分: ${testPackage.dailyCredits.toLocaleString()}`);
    console.log(`   价格: ¥${(testPackage.price / 100).toFixed(2)}`);
    console.log('');
    
    // 3. 创建测试用户
    console.log('3. 创建测试用户...');
    const testUserEmail = `test_${Date.now()}@example.com`;
    const testUserUuid = `test_uuid_${Date.now()}`;
    
    const testUser = await prisma.user.create({
      data: {
        uuid: testUserUuid,
        email: testUserEmail,
        nickname: 'Test User',
      },
    });
    console.log(`✅ 创建测试用户: ${testUser.email}`);
    console.log('');
    
    // 4. 初始化用户积分余额
    console.log('4. 初始化用户积分余额...');
    const initialBalance = await prisma.creditBalance.create({
      data: {
        userId: testUserUuid,
        packageCredits: 0,
        independentCredits: 0,
        totalUsed: 0,
        totalPurchased: 0,
      },
    });
    console.log(`✅ 初始余额: 套餐积分=${initialBalance.packageCredits}, 独立积分=${initialBalance.independentCredits}`);
    console.log('');
    
    // 5. 创建订单
    console.log('5. 创建积分购买订单...');
    const orderNo = `TEST_${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderNo: orderNo,
        userId: testUserUuid,
        userEmail: testUserEmail,
        amount: testPackage.price,
        status: 'pending',
        credits: testPackage.dailyCredits,
        currency: 'CNY',
        productName: testPackage.name,
        orderType: 'credits',
        packageId: testPackage.id,
        creditAmount: testPackage.dailyCredits,
        packageSnapshot: {
          id: testPackage.id,
          name: testPackage.name,
          price: testPackage.price,
          totalCredits: testPackage.dailyCredits,
        },
      },
    });
    console.log(`✅ 创建订单: ${order.orderNo}`);
    console.log(`   订单类型: ${order.orderType}`);
    console.log(`   积分数量: ${order.credits.toLocaleString()}`);
    console.log(`   订单金额: ¥${(order.amount / 100).toFixed(2)}`);
    console.log('');
    
    // 6. 模拟支付成功
    console.log('6. 模拟支付成功...');
    await prisma.order.update({
      where: { orderNo: orderNo },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paidEmail: testUserEmail,
        paidDetail: JSON.stringify({
          method: 'mock',
          transactionId: 'mock_' + Date.now(),
        }),
      },
    });
    console.log('✅ 订单支付成功');
    console.log('');
    
    // 7. 增加独立积分
    console.log('7. 增加独立积分...');
    const updatedBalance = await prisma.creditBalance.update({
      where: { userId: testUserUuid },
      data: {
        independentCredits: {
          increment: testPackage.dailyCredits,
        },
        totalPurchased: {
          increment: testPackage.dailyCredits,
        },
      },
    });
    console.log(`✅ 积分已增加到账户`);
    console.log(`   独立积分: ${updatedBalance.independentCredits.toLocaleString()}`);
    console.log(`   总购买量: ${updatedBalance.totalPurchased.toLocaleString()}`);
    console.log('');
    
    // 8. 创建交易记录
    console.log('8. 创建交易记录...');
    const transaction = await prisma.creditTransaction.create({
      data: {
        transNo: `TRANS_${Date.now()}`,
        userId: testUserUuid,
        type: 'income',
        creditType: 'independent',
        amount: testPackage.dailyCredits,
        beforeBalance: 0,
        afterBalance: testPackage.dailyCredits,
        orderNo: orderNo,
        description: `购买${testPackage.name}`,
        metadata: {
          orderNo: orderNo,
          packageId: testPackage.id,
          packageName: testPackage.name,
        },
      },
    });
    console.log(`✅ 交易记录已创建: ${transaction.transNo}`);
    console.log('');
    
    // 9. 验证最终状态
    console.log('9. 验证最终状态...');
    const finalBalance = await prisma.creditBalance.findUnique({
      where: { userId: testUserUuid },
    });
    const paidOrder = await prisma.order.findUnique({
      where: { orderNo: orderNo },
    });
    
    console.log('最终结果:');
    console.log(`   订单状态: ${paidOrder.status}`);
    console.log(`   套餐积分: ${finalBalance.packageCredits.toLocaleString()}`);
    console.log(`   独立积分: ${finalBalance.independentCredits.toLocaleString()}`);
    console.log(`   总可用积分: ${(finalBalance.packageCredits + finalBalance.independentCredits).toLocaleString()}`);
    console.log('');
    
    console.log('='.repeat(60));
    console.log('✅ 购买积分功能测试成功！');
    console.log('='.repeat(60));
    
    // 清理测试数据（可选）
    console.log('\n清理测试数据...');
    await prisma.creditTransaction.deleteMany({ where: { userId: testUserUuid } });
    await prisma.creditBalance.delete({ where: { userId: testUserUuid } });
    await prisma.order.delete({ where: { orderNo: orderNo } });
    await prisma.user.delete({ where: { id: testUserUuid } });
    console.log('✅ 测试数据已清理');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreditPurchase();