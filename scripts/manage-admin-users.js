/**
 * 管理员用户管理脚本
 * 运行: node scripts/manage-admin-users.js [command] [email]
 * 
 * 命令:
 * - list: 列出所有管理员
 * - add [email]: 将指定用户设置为管理员
 * - remove [email]: 将指定管理员降级为普通用户
 * - check: 检查用户角色设置
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const command = process.argv[2];
const email = process.argv[3];

async function listAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: {
      email: true,
      nickname: true,
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log('\n👤 管理员列表:');
  console.log('='.repeat(60));
  
  if (admins.length === 0) {
    console.log('暂无管理员账户');
  } else {
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email}`);
      console.log(`   昵称: ${admin.nickname || '未设置'}`);
      console.log(`   状态: ${admin.status || 'active'}`);
      console.log(`   注册时间: ${new Date(admin.createdAt).toLocaleDateString('zh-CN')}`);
      console.log('-'.repeat(60));
    });
  }
  
  console.log(`\n总计: ${admins.length} 个管理员\n`);
}

async function addAdmin(email) {
  if (!email) {
    console.error('❌ 请提供用户邮箱');
    return;
  }
  
  const user = await prisma.user.findFirst({
    where: { email }
  });
  
  if (!user) {
    console.error(`❌ 用户 ${email} 不存在`);
    return;
  }
  
  if (user.role === 'admin') {
    console.log(`ℹ️ 用户 ${email} 已经是管理员`);
    return;
  }
  
  await prisma.user.update({
    where: { uuid: user.uuid },
    data: { role: 'admin' }
  });
  
  console.log(`✅ 成功将 ${email} 设置为管理员`);
}

async function removeAdmin(email) {
  if (!email) {
    console.error('❌ 请提供用户邮箱');
    return;
  }
  
  const user = await prisma.user.findFirst({
    where: { email }
  });
  
  if (!user) {
    console.error(`❌ 用户 ${email} 不存在`);
    return;
  }
  
  if (user.role !== 'admin') {
    console.log(`ℹ️ 用户 ${email} 不是管理员`);
    return;
  }
  
  // 检查是否是最后一个管理员
  const adminCount = await prisma.user.count({
    where: { role: 'admin' }
  });
  
  if (adminCount <= 1) {
    console.error('❌ 不能移除最后一个管理员');
    return;
  }
  
  await prisma.user.update({
    where: { uuid: user.uuid },
    data: { role: 'user' }
  });
  
  console.log(`✅ 成功将 ${email} 降级为普通用户`);
}

async function checkRoles() {
  const stats = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });
  
  const total = await prisma.user.count();
  
  console.log('\n📊 用户角色统计:');
  console.log('='.repeat(60));
  console.log(`总用户数: ${total}`);
  console.log('-'.repeat(60));
  
  stats.forEach(stat => {
    const percentage = ((stat._count / total) * 100).toFixed(1);
    console.log(`${stat.role === 'admin' ? '管理员' : '普通用户'}: ${stat._count} (${percentage}%)`);
  });
  
  console.log('='.repeat(60));
}

async function main() {
  try {
    switch (command) {
      case 'list':
        await listAdmins();
        break;
      case 'add':
        await addAdmin(email);
        break;
      case 'remove':
        await removeAdmin(email);
        break;
      case 'check':
        await checkRoles();
        break;
      default:
        console.log(`
管理员用户管理工具

使用方法:
  node scripts/manage-admin-users.js [command] [email]

命令:
  list              列出所有管理员
  add [email]       将指定用户设置为管理员
  remove [email]    将指定管理员降级为普通用户
  check             检查用户角色统计

示例:
  node scripts/manage-admin-users.js list
  node scripts/manage-admin-users.js add user@example.com
  node scripts/manage-admin-users.js remove user@example.com
  node scripts/manage-admin-users.js check
        `);
    }
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();