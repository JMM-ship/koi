/**
 * 测试套餐购买功能的完整流程
 *
 * 使用方法：
 * 1. 确保开发服务器运行: npm run dev
 * 2. 运行测试: node test-package-purchase.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

// 测试用户信息（需要先登录获取session）
const TEST_USER = {
  email: 'testuser@example.com',
  // 这里需要实际的session token，从浏览器中获取
  sessionToken: 'your-session-token-here'
};

// 测试套餐ID（需要从数据库中获取实际的套餐ID）
const TEST_PACKAGE_ID = 'test-package-id';

async function testPackagePurchase() {
  console.log('🚀 开始测试套餐购买流程...\n');

  try {
    // 1. 获取可用套餐列表
    console.log('1️⃣  获取套餐列表...');
    const packagesResponse = await fetch(`${BASE_URL}/api/packages`);
    const packagesData = await packagesResponse.json();

    if (!packagesData.success || !packagesData.data?.packages?.length) {
      console.error('❌ 获取套餐列表失败:', packagesData);
      return;
    }

    const availablePackages = packagesData.data.packages.filter(pkg =>
      pkg.isActive && pkg.planType !== 'credits'
    );

    if (availablePackages.length === 0) {
      console.error('❌ 没有可用的套餐');
      return;
    }

    const testPackage = availablePackages[0];
    console.log('✅ 找到测试套餐:', testPackage.name, '价格:', testPackage.priceCents / 100, '元');

    // 2. 创建订单
    console.log('\n2️⃣  创建订单...');
    const createOrderResponse = await fetch(`${BASE_URL}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${TEST_USER.sessionToken}` // 需要实际的session
      },
      body: JSON.stringify({
        orderType: 'package',
        packageId: testPackage.id,
        paymentMethod: 'mock'
      })
    });

    const orderData = await createOrderResponse.json();

    if (!orderData.success) {
      console.error('❌ 创建订单失败:', orderData);
      return;
    }

    const orderNo = orderData.data.order.orderNo;
    console.log('✅ 订单创建成功:', orderNo);

    // 3. 模拟支付成功
    console.log('\n3️⃣  模拟支付成功...');
    const paymentResponse = await fetch(`${BASE_URL}/api/orders/pay/mock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${TEST_USER.sessionToken}` // 需要实际的session
      },
      body: JSON.stringify({
        orderNo,
        paymentDetails: {
          method: 'test',
          transactionId: 'test_' + Date.now(),
          paidAt: new Date().toISOString()
        }
      })
    });

    const paymentData = await paymentResponse.json();

    if (!paymentData.success) {
      console.error('❌ 支付处理失败:', paymentData);
      return;
    }

    console.log('✅ 支付处理成功');

    // 4. 验证Dashboard数据
    console.log('\n4️⃣  验证Dashboard数据...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: {
        'Cookie': `next-auth.session-token=${TEST_USER.sessionToken}` // 需要实际的session
      }
    });

    const dashboardData = await dashboardResponse.json();

    if (!dashboardResponse.ok) {
      console.error('❌ 获取Dashboard数据失败:', dashboardData);
      return;
    }

    console.log('✅ Dashboard数据获取成功');
    console.log('   - 套餐积分:', dashboardData.creditBalance?.packageCredits || 0);
    console.log('   - 独立积分:', dashboardData.creditBalance?.independentCredits || 0);
    console.log('   - 总积分:', dashboardData.creditBalance?.totalCredits || 0);
    console.log('   - 当前套餐:', dashboardData.userPackage?.packageName || 'None');

    // 5. 验证数据库数据（需要直接数据库查询）
    console.log('\n5️⃣  请手动验证数据库数据:');
    console.log('   - orders 表中订单状态为 "paid"');
    console.log('   - user_packages 表中有对应的活跃套餐记录');
    console.log('   - wallets 表中套餐积分已更新');
    console.log('   - credit_transactions 表中有购买积分流水记录');

    console.log('\n🎉 套餐购买流程测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 手动测试指南
function printManualTestGuide() {
  console.log(`
📖 手动测试指南:

1. 启动开发服务器:
   npm run dev

2. 在浏览器中登录用户账户

3. 打开浏览器开发工具，获取session token:
   - 打开 Application/Storage > Cookies
   - 找到 next-auth.session-token 的值
   - 复制该值到上面的 TEST_USER.sessionToken

4. 从数据库获取实际的套餐ID:
   SELECT id, name, price_cents, daily_points FROM packages WHERE is_active = true;

5. 更新上面的 TEST_PACKAGE_ID 为实际的套餐ID

6. 运行测试:
   node test-package-purchase.js

或者直接在浏览器中测试:
1. 访问 /dashboard?section=plans
2. 选择一个套餐点击 "Choose Plan"
3. 确认购买
4. 查看 Dashboard 中的积分变化
5. 检查数据库表的数据变化
`);
}

// 检查是否提供了session token
if (TEST_USER.sessionToken === 'your-session-token-here') {
  console.log('⚠️  请先配置测试参数!\n');
  printManualTestGuide();
} else {
  testPackagePurchase();
}