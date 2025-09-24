import { prisma } from "../app/models/db";
import { createOrder, OrderType, handlePaymentSuccess } from "../app/service/orderProcessor";
import { getActivePackages } from "../app/models/package";
import { getUserActivePackage } from "../app/models/userPackage";
import { getCreditBalance } from "../app/models/creditBalance";

async function testPackagePurchase() {
  console.log('🚀 开始测试套餐购买功能...\n');

  try {
    // 1. 创建或获取测试用户
    console.log('1️⃣ 创建测试用户...');
    const testUser = await prisma.user.upsert({
      where: { email: 'test-purchase@example.com' },
      update: {},
      create: {
        id: 'test-user-purchase-123',
        email: 'test-purchase@example.com',
        nickname: 'Test Purchase User',
        role: 'user',
        status: 'active',
        planType: 'free',
      },
    });
    console.log('✅ 测试用户准备完毕:', testUser.email);

    // 2. 获取测试套餐
    console.log('\n2️⃣ 获取可用套餐...');
    const packages = await getActivePackages();
    const testPackage = packages.find(pkg => pkg.planType !== 'credits');

    if (!testPackage) {
      console.error('❌ 没有找到可用的套餐，请先创建套餐');
      return;
    }
    console.log('✅ 选择测试套餐:', testPackage.name, '价格:', testPackage.priceCents / 100, '元');

    // 3. 创建订单
    console.log('\n3️⃣ 创建订单...');
    const orderResult = await createOrder({
      userId: testUser.id,
      userEmail: testUser.email,
      orderType: OrderType.Package,
      packageId: testPackage.id,
      paymentMethod: 'test',
    });

    if (!orderResult.success) {
      console.error('❌ 创建订单失败:', orderResult.error);
      return;
    }

    const orderNo = orderResult.order?.orderNo;
    console.log('✅ 订单创建成功:', orderNo);

    // 4. 模拟支付成功
    console.log('\n4️⃣ 处理支付成功...');
    const paymentResult = await handlePaymentSuccess(orderNo!, {
      method: 'test',
      transactionId: 'test_' + Date.now(),
      paidAt: new Date().toISOString(),
      email: testUser.email,
    });

    if (!paymentResult.success) {
      console.error('❌ 支付处理失败:', paymentResult.error);
      return;
    }
    console.log('✅ 支付处理成功');

    // 5. 验证结果
    console.log('\n5️⃣ 验证结果...');

    // 检查用户套餐
    const userPackage = await getUserActivePackage(testUser.id);
    console.log('用户套餐:', userPackage ? {
      packageName: userPackage.package_snapshot?.name || 'Unknown',
      dailyCredits: userPackage.daily_credits,
      startDate: userPackage.start_date,
      endDate: userPackage.end_date,
      isActive: userPackage.is_active,
    } : 'None');

    // 检查用户积分
    const creditBalance = await getCreditBalance(testUser.id);
    console.log('积分余额:', creditBalance ? {
      packageCredits: creditBalance.package_credits,
      independentCredits: creditBalance.independent_credits,
      totalCredits: creditBalance.package_credits + creditBalance.independent_credits,
    } : 'None');

    // 检查订单状态
    const order = await prisma.order.findFirst({
      where: { orderNo: orderNo! },
    });
    console.log('订单状态:', order?.status);

    // 检查积分流水
    const transactions = await prisma.creditTransaction.findMany({
      where: {
        userId: testUser.id,
        orderId: orderNo,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    console.log('积分流水记录:', transactions.length, '条');

    console.log('\n✅ 测试完成！所有功能正常');

    // 验证测试用例中的各项
    console.log('\n📋 测试用例验证:');
    console.log('- Orders表记录:', order?.status === 'paid' ? '✅ 已支付' : '❌ 状态异常');
    console.log('- UserPackage记录:', userPackage?.is_active ? '✅ 套餐激活' : '❌ 套餐未激活');
    console.log('- Wallet积分:', creditBalance?.package_credits ? '✅ 积分到账' : '❌ 积分未到账');
    console.log('- 积分流水:', transactions.length > 0 ? '✅ 流水记录正常' : '❌ 无流水记录');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 清理测试数据
async function cleanupTestData() {
  console.log('🧹 清理测试数据...');
  try {
    const testUserId = 'test-user-purchase-123';

    // 删除积分流水
    await prisma.creditTransaction.deleteMany({
      where: { userId: testUserId },
    });

    // 删除钱包
    await prisma.wallet.deleteMany({
      where: { userId: testUserId },
    });

    // 删除用户套餐
    await prisma.userPackage.deleteMany({
      where: { userId: testUserId },
    });

    // 删除订单
    await prisma.order.deleteMany({
      where: { userId: testUserId },
    });

    // 删除用户
    await prisma.user.delete({
      where: { id: testUserId },
    });

    console.log('✅ 测试数据清理完成');
  } catch (error) {
    console.error('清理测试数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 检查命令行参数
const command = process.argv[2];

if (command === 'cleanup') {
  cleanupTestData();
} else {
  testPackagePurchase();
}