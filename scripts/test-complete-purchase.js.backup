// 测试完整的套餐购买流程（包括积分初始化）
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 模拟 activatePackageCredits 函数的逻辑
async function activatePackageCredits(userUuid, dailyCredits, orderNo) {
  try {
    // 获取当前余额
    const currentBalance = await prisma.creditBalance.findUnique({
      where: { userUuid }
    });
    
    const beforeBalance = currentBalance 
      ? currentBalance.packageCredits + currentBalance.independentCredits 
      : 0;
    
    // 使用 upsert 更新或创建积分余额
    const newBalance = await prisma.creditBalance.upsert({
      where: { userUuid },
      update: {
        packageCredits: dailyCredits,
        packageResetAt: new Date(),
      },
      create: {
        userUuid,
        packageCredits: dailyCredits,
        packageResetAt: new Date(),
        independentCredits: 0,
        totalUsed: 0,
        totalPurchased: 0,
        version: 0,
      },
    });
    
    // 创建流水记录
    const transaction = await prisma.creditTransaction.create({
      data: {
        transNo: `TRANS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userUuid: userUuid,
        type: 'income',
        creditType: 'package',
        amount: dailyCredits,
        beforeBalance: beforeBalance,
        afterBalance: newBalance.packageCredits + newBalance.independentCredits,
        orderNo: orderNo,
        description: '激活套餐积分',
        metadata: {
          orderNo,
          purchaseType: 'package',
          dailyCredits,
        },
      },
    });
    
    return {
      success: true,
      balance: newBalance,
      transaction,
    };
  } catch (error) {
    console.error('Error activating package credits:', error);
    return { success: false, error: error.message };
  }
}

// 模拟完整的套餐购买流程
async function purchasePackage(userUuid, packageId, orderNo) {
  try {
    // 获取套餐信息
    const packageInfo = await prisma.package.findUnique({
      where: { id: packageId }
    });
    
    if (!packageInfo) {
      return { success: false, error: 'Package not found' };
    }
    
    // 计算套餐起止时间
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + packageInfo.validDays);
    
    // 创建套餐快照
    const packageSnapshot = {
      id: packageInfo.id,
      name: packageInfo.name,
      version: packageInfo.version,
      price: packageInfo.price,
      dailyCredits: packageInfo.dailyCredits,
      validDays: packageInfo.validDays,
      features: packageInfo.features,
    };
    
    // 创建用户套餐
    const userPackage = await prisma.userPackage.create({
      data: {
        userUuid: userUuid,
        packageId: packageId,
        orderNo: orderNo,
        startDate: startDate,
        endDate: endDate,
        dailyCredits: packageInfo.dailyCredits,
        packageSnapshot: packageSnapshot,
        isActive: true,
        isAutoRenew: false,
      },
    });
    
    console.log('✅ 用户套餐创建成功');
    
    // 激活套餐积分
    const creditResult = await activatePackageCredits(
      userUuid,
      packageInfo.dailyCredits,
      orderNo
    );
    
    if (!creditResult.success) {
      console.error('❌ 激活套餐积分失败:', creditResult.error);
      return { success: false, error: 'Failed to activate package credits' };
    }
    
    console.log('✅ 套餐积分激活成功');
    
    return {
      success: true,
      userPackage,
      creditBalance: creditResult.balance,
    };
  } catch (error) {
    console.error('Error purchasing package:', error);
    return { success: false, error: error.message };
  }
}

async function testCompletePurchase() {
  try {
    console.log('=== 测试完整套餐购买流程 ===\n');
    
    // 1. 获取测试用户
    console.log('1. 获取测试用户...');
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
    });
    
    // 2. 获取测试套餐
    console.log('\n2. 获取测试套餐...');
    const testPackage = await prisma.package.findFirst({
      where: { isActive: true }
    });
    
    if (!testPackage) {
      console.log('没有找到活跃套餐');
      return;
    }
    
    console.log('测试套餐:', {
      id: testPackage.id,
      name: testPackage.name,
      dailyCredits: testPackage.dailyCredits,
    });
    
    // 3. 检查购买前的积分余额
    console.log('\n3. 检查购买前的积分余额...');
    let creditBalance = await prisma.creditBalance.findUnique({
      where: { userUuid: testUser.uuid }
    });
    
    if (creditBalance) {
      console.log('购买前积分:', {
        packageCredits: creditBalance.packageCredits,
        independentCredits: creditBalance.independentCredits,
        total: creditBalance.packageCredits + creditBalance.independentCredits,
      });
    } else {
      console.log('用户还没有积分记录');
    }
    
    // 4. 执行购买流程
    console.log('\n4. 执行套餐购买流程...');
    const orderNo = 'TEST_ORDER_' + Date.now();
    const result = await purchasePackage(testUser.uuid, testPackage.id, orderNo);
    
    if (result.success) {
      console.log('✅ 套餐购买成功!');
      
      // 5. 验证购买后的积分余额
      console.log('\n5. 验证购买后的积分余额...');
      creditBalance = await prisma.creditBalance.findUnique({
        where: { userUuid: testUser.uuid }
      });
      
      if (creditBalance) {
        console.log('购买后积分:', {
          packageCredits: creditBalance.packageCredits,
          independentCredits: creditBalance.independentCredits,
          total: creditBalance.packageCredits + creditBalance.independentCredits,
          packageResetAt: creditBalance.packageResetAt,
        });
        
        // 验证积分是否正确设置
        if (creditBalance.packageCredits === testPackage.dailyCredits) {
          console.log('✅ 套餐积分正确设置为每日额度:', testPackage.dailyCredits);
        } else {
          console.log('❌ 套餐积分设置不正确');
        }
      }
      
      // 6. 查看用户套餐记录
      console.log('\n6. 查看用户套餐记录...');
      const userPackage = await prisma.userPackage.findFirst({
        where: { 
          userUuid: testUser.uuid,
          isActive: true 
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (userPackage) {
        console.log('活跃套餐:', {
          packageId: userPackage.packageId,
          dailyCredits: userPackage.dailyCredits,
          startDate: userPackage.startDate,
          endDate: userPackage.endDate,
        });
      }
      
      // 7. 查看交易记录
      console.log('\n7. 查看最新交易记录...');
      const latestTransaction = await prisma.creditTransaction.findFirst({
        where: { userUuid: testUser.uuid },
        orderBy: { createdAt: 'desc' }
      });
      
      if (latestTransaction) {
        console.log('最新交易:', {
          transNo: latestTransaction.transNo,
          type: latestTransaction.type,
          creditType: latestTransaction.creditType,
          amount: latestTransaction.amount,
          description: latestTransaction.description,
        });
      }
      
    } else {
      console.log('❌ 套餐购买失败:', result.error);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompletePurchase().then(() => {
  console.log('\n=== 测试完成 ===');
});