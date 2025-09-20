import prisma from '../lib/prisma';

async function testApiKey() {
  console.log('创建测试 API 密钥...');

  try {
    // 获取第一个用户
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('没有找到用户，请先创建用户');
      return;
    }

    console.log(`使用用户: ${user.email}`);

    // 检查是否已有 API 密钥
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    if (existingKey) {
      console.log('用户已有 API 密钥:');
      console.log('ID:', existingKey.id);
      console.log('Title:', existingKey.title);
      console.log('Key:', existingKey.apiKey.substring(0, 10) + '...');
      console.log('Created:', existingKey.createdAt);
    } else {
      // 创建新的 API 密钥
      const newKey = await prisma.apiKey.create({
        data: {
          apiKey: `sk-test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          title: 'Test API Key',
          userId: user.id,
          status: 'active'
        }
      });

      console.log('创建了新的 API 密钥:');
      console.log('ID:', newKey.id);
      console.log('Title:', newKey.title);
      console.log('Key:', newKey.apiKey);
      console.log('Created:', newKey.createdAt);
    }

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiKey();