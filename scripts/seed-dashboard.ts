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

    const userUuid = user.uuid;
    console.log(`使用用户: ${user.email}`);

    // 1. 创建消费趋势数据 (最近7天)
    console.log('创建消费趋势数据...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // 生成随机数据
      const pointsUsed = Math.floor(Math.random() * 2000) + 500;
      const moneyUsed = parseFloat((Math.random() * 100 + 20).toFixed(2));
      const tokensUsed = Math.floor(Math.random() * 150000) + 50000;

      await prisma.consumptionTrend.upsert({
        where: {
          uk_user_date: {
            userUuid,
            date
          }
        },
        update: {
          pointsUsed,
          moneyUsed,
          tokensUsed
        },
        create: {
          userUuid,
          date,
          pointsUsed,
          moneyUsed,
          tokensUsed
        }
      });
    }

    // 2. 创建模型使用记录
    console.log('创建模型使用记录...');
    const models = [
      { name: 'GPT-4o', types: ['Text Generation', 'Code Generation', 'Document Analysis'] },
      { name: 'Claude 3.5', types: ['Code Generation', 'Code Debugging', 'Text Analysis'] },
      { name: 'DALL-E 3', types: ['Image Generation', 'Image Editing'] },
      { name: 'GPT-3.5', types: ['Chat Conversation', 'Simple Tasks'] },
      { name: 'Midjourney', types: ['Image Generation', 'Art Creation'] }
    ];

    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const model = models[Math.floor(Math.random() * models.length)];
      const usageType = model.types[Math.floor(Math.random() * model.types.length)];
      const credits = Math.floor(Math.random() * 500) + 50;
      const timestamp = new Date(now.getTime() - i * 2 * 60 * 60 * 1000); // 每2小时一条

      await prisma.modelUsage.create({
        data: {
          userUuid,
          modelName: model.name,
          usageType,
          credits,
          timestamp,
          status: 'completed'
        }
      });
    }

    // 3. 创建或更新积分余额
    console.log('创建积分余额数据...');
    await prisma.creditBalance.upsert({
      where: {
        userUuid
      },
      update: {
        packageCredits: 5000,
        independentCredits: 37153,
        totalUsed: 12847,
        totalPurchased: 50000,
        packageResetAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7天后重置
      },
      create: {
        userUuid,
        packageCredits: 5000,
        independentCredits: 37153,
        totalUsed: 12847,
        totalPurchased: 50000,
        packageResetAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // 4. 创建积分交易记录
    console.log('创建积分交易记录...');
    const transactionTypes = ['expense', 'income'];
    const creditTypes = ['package', 'independent'];
    
    for (let i = 0; i < 30; i++) {
      const type = i % 3 === 0 ? 'income' : 'expense'; // 1/3 概率是收入
      const creditType = creditTypes[Math.floor(Math.random() * creditTypes.length)];
      const amount = type === 'income' 
        ? Math.floor(Math.random() * 10000) + 1000 
        : Math.floor(Math.random() * 500) + 50;
      
      const transNo = `TRANS-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const createdAt = new Date(now.getTime() - i * 24 * 60 * 60 * 1000); // 每天一条

      await prisma.creditTransaction.create({
        data: {
          transNo,
          userUuid,
          type,
          creditType,
          amount,
          beforeBalance: 50000 - (i * 100),
          afterBalance: 50000 - (i * 100) + (type === 'income' ? amount : -amount),
          description: type === 'income' ? '积分充值' : `使用 ${creditType === 'package' ? '套餐' : '独立'} 积分`,
          createdAt
        }
      });
    }

    // 5. 更新用户信息
    console.log('更新用户信息...');
    await prisma.user.update({
      where: {
        uuid: userUuid
      },
      data: {
        planType: 'pro',
        planExpiredAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        totalCredits: 10000
      }
    });

    console.log('Dashboard 测试数据初始化完成！');
  } catch (error) {
    console.error('初始化数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
seedDashboardData();