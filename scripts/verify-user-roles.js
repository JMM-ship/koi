/**
 * 验证用户角色设置
 * 运行: node scripts/verify-user-roles.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUserRoles() {
  try {
    console.log('='.repeat(70));
    console.log('用户角色验证报告');
    console.log('='.repeat(70));
    
    // 统计各角色用户数量
    const adminCount = await prisma.user.count({
      where: { role: 'admin' }
    });
    
    const userCount = await prisma.user.count({
      where: { role: 'user' }
    });
    
    const totalCount = await prisma.user.count();
    
    console.log('\n📊 用户角色统计:');
    console.log('-'.repeat(40));
    console.log(`总用户数: ${totalCount}`);
    console.log(`管理员数: ${adminCount}`);
    console.log(`普通用户数: ${userCount}`);
    
    // 列出所有管理员
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        email: true,
        createdAt: true,
        nickname: true,
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('\n👤 管理员列表:');
    console.log('-'.repeat(40));
    if (admins.length > 0) {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email}`);
        console.log(`   昵称: ${admin.nickname || '未设置'}`);
        console.log(`   注册时间: ${new Date(admin.createdAt).toLocaleDateString('zh-CN')}`);
      });
    } else {
      console.log('暂无管理员账户');
    }
    
    // 测试新用户默认角色
    console.log('\n✅ 新用户默认角色测试:');
    console.log('-'.repeat(40));
    
    // 检查数据库 schema 中的默认值
    const testUser = {
      uuid: 'test-' + Date.now(),
      email: 'test-' + Date.now() + '@example.com',
      signinProvider: 'test',
    };
    
    // 创建测试用户（不指定 role）
    const newUser = await prisma.user.create({
      data: testUser,
      select: {
        email: true,
        role: true,
      }
    });
    
    console.log(`创建测试用户: ${newUser.email}`);
    console.log(`分配的角色: ${newUser.role}`);
    console.log(`结果: ${newUser.role === 'user' ? '✓ 正确（普通用户）' : '✗ 错误'}`);
    
    // 清理测试用户
    await prisma.user.delete({
      where: { email: testUser.email }
    });
    console.log('已清理测试用户');
    
    console.log('\n' + '='.repeat(70));
    console.log('✨ 设置完成！');
    console.log('- 现有用户已设置为管理员');
    console.log('- 新注册用户将自动成为普通用户');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('验证失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行验证
verifyUserRoles();