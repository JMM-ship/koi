import prisma from '../lib/prisma';

async function seedDashboardData() {
  console.log('开始初始化 Dashboard 测试数据...');

  try {
    // 获取第一个用户作为测试用户
    const user = await prisma.user.findFirst();

    if (!user) {
      console.error('没有找到用户，请先创建用户');
      return;
    }

    const userId = user.id;
    console.log(`使用用户: ${user.email}`);

    // 注意：ConsumptionTrend, ModelUsage 和 CreditBalance 模型在新数据库架构中已被移除
    // Dashboard 数据现在通过以下模型生成：
    // - CreditTransaction: 积分交易历史
    // - UsageRecord: 使用记录
    // - Wallet: 钱包余额

    // 1. 创建一些测试的积分交易记录
    console.log('创建积分交易记录...');
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      // 创建每日使用记录
      const points = Math.floor(Math.random() * 100) + 10;

      await prisma.creditTransaction.create({
        data: {
          userId,
          type: 'use',
          bucket: 'independent',
          points,
          tokens: points * 100, // tokens field is required
          beforeIndependentTokens: BigInt(1000),
          afterIndependentTokens: BigInt(1000 - points),
          reason: `API 调用消费`,
          createdAt: date
        }
      });
    }

    // 2. 创建使用记录
    console.log('创建使用记录...');
    const models = ['gpt-4o', 'claude-3-5', 'dalle-3', 'gpt-3.5-turbo'];

    for (let i = 0; i < 20; i++) {
      const modelName = models[Math.floor(Math.random() * models.length)];
      const tokens = Math.floor(Math.random() * 5000) + 500;
      const timestamp = new Date(today.getTime() - i * 2 * 60 * 60 * 1000); // 每2小时一条

      await prisma.usageRecord.create({
        data: {
          requestId: `req_${Date.now()}_${i}`, // requestId is required and must be unique
          userId,
          provider: 'openai', // provider is required
          model: modelName,
          promptTokens: Math.floor(tokens * 0.7),
          completionTokens: Math.floor(tokens * 0.3),
          totalTokens: tokens,
          status: 'success', // status is required
          createdAt: timestamp
        }
      });
    }

    // 3. 确保用户有钱包记录
    console.log('创建或更新钱包余额...');
    await prisma.wallet.upsert({
      where: { userId },
      update: {
        packageTokensRemaining: BigInt(5000),
        independentTokens: BigInt(1000),
      },
      create: {
        userId,
        packageDailyQuotaTokens: BigInt(10000),
        packageTokensRemaining: BigInt(5000),
        independentTokens: BigInt(1000),
      }
    });

    console.log('✅ Dashboard 测试数据创建成功！');

  } catch (error) {
    console.error('创建测试数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDashboardData();