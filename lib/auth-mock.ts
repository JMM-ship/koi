// 模拟认证函数 - 仅用于开发测试
// 在生产环境中应该使用真实的认证

import prisma from './prisma';

export async function getMockAuth() {
  // 获取第一个用户作为当前登录用户
  const user = await prisma.user.findFirst({
    where: {
      status: 'active'
    }
  });

  if (!user) {
    // 如果没有用户，创建一个测试用户
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        nickname: 'Test User',
        role: 'user',
        status: 'active',
      }
    });
    return {
      uuid: testUser.id,
      email: testUser.email,
      name: testUser.nickname,
      image: testUser.avatarUrl,
      role: testUser.role,
      planType: 'basic',
      totalCredits: 0
    };
  }

  return {
    uuid: user.id,
    email: user.email,
    name: user.nickname,
    image: user.avatarUrl,
    role: user.role,
    planType: 'basic',
    totalCredits: 0
  };
}