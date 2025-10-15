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
        ownerUserId: user.id,  // userId -> ownerUserId
        status: 'active'
      }
    });

    if (existingKey) {
      console.log('用户已有 API 密钥:');
      console.log('ID:', existingKey.id);
      console.log('Name:', existingKey.name || 'Untitled');  // title -> name
      console.log('Prefix:', existingKey.prefix + '...');
      console.log('Created:', existingKey.createdAt);
    } else {
      // 创建新的 API 密钥
      const apiKeyValue = `sk-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const crypto = require('crypto');
      const keyHash = crypto.createHash('sha256').update(apiKeyValue).digest('hex');

      const newKey = await prisma.apiKey.create({
        data: {
          keyHash: keyHash,  // apiKey -> keyHash (存储哈希值)
          prefix: apiKeyValue.substring(0, 7),  // 存储前缀用于识别
          name: 'Test API Key',  // title -> name
          ownerUserId: user.id,  // userId -> ownerUserId
          status: 'active'
        }
      });

      console.log('创建了新的 API 密钥:');
      console.log('ID:', newKey.id);
      console.log('Name:', newKey.name);  // title -> name
      console.log('Key (请保存):', apiKeyValue);  // 实际的密钥只在创建时显示
      console.log('Created:', newKey.createdAt);
    }

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiKey();