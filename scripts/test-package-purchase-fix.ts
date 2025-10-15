import { createOrder, handlePaymentSuccess } from "../app/service/orderProcessor";
import { getPackagesWithUserStatus } from "../app/service/packageManager";
import { OrderType } from "../app/service/orderProcessor";

async function testPackagePurchase() {
  console.log('开始测试套餐购买功能...');

  try {
    // 1. 创建测试用户ID（模拟真实用户）
    const testUserId = "550e8400-e29b-41d4-a716-446655440000"; // 模拟UUID
    const testUserEmail = "test@example.com";

    // 2. 获取可用套餐列表
    console.log('获取可用套餐...');
    const packagesResult = await getPackagesWithUserStatus(testUserId);
    console.log('可用套餐:', packagesResult.packages.length);

    if (packagesResult.packages.length === 0) {
      console.log('没有可用套餐，无法测试购买功能');
      return;
    }

    // 选择第一个套餐进行测试
    const testPackage = packagesResult.packages[0];
    console.log('测试套餐:', testPackage.name, '价格:', testPackage.priceCents / 100, '元');

    // 3. 创建订单
    console.log('创建订单...');
    const orderResult = await createOrder({
      userId: testUserId,
      userEmail: testUserEmail,
      orderType: OrderType.Package,
      packageId: testPackage.id,
      paymentMethod: 'test'
    });

    if (!orderResult.success) {
      console.error('创建订单失败:', orderResult.error);
      return;
    }

    console.log('订单创建成功:', orderResult.order?.orderNo);

    // 4. 模拟支付成功
    console.log('模拟支付成功...');
    const paymentResult = await handlePaymentSuccess(
      orderResult.order!.orderNo,
      {
        paymentId: 'test_payment_123',
        amount: orderResult.order!.amount,
        currency: 'CNY',
        email: testUserEmail,
        status: 'succeeded'
      }
    );

    if (!paymentResult.success) {
      console.error('支付处理失败:', paymentResult.error);
      return;
    }

    console.log('支付处理成功！');

    // 5. 验证用户套餐状态
    console.log('验证用户套餐状态...');
    const updatedPackagesResult = await getPackagesWithUserStatus(testUserId);

    if (updatedPackagesResult.currentPackage) {
      console.log('用户当前套餐:', updatedPackagesResult.currentPackage.package_id);
      console.log('套餐开始时间:', updatedPackagesResult.currentPackage.start_date);
      console.log('套餐结束时间:', updatedPackagesResult.currentPackage.end_date);
      console.log('每日积分:', updatedPackagesResult.currentPackage.daily_credits);
    } else {
      console.log('用户没有活跃套餐');
    }

    console.log('套餐购买测试完成！');

  } catch (error) {
    console.error('测试过程中出现错误:', error);

    // 打印详细错误信息
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('堆栈跟踪:', error.stack);
    }
  }
}

// 运行测试
if (require.main === module) {
  testPackagePurchase()
    .then(() => {
      console.log('测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('测试失败:', error);
      process.exit(1);
    });
}

export { testPackagePurchase };