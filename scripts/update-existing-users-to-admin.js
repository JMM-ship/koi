/**
 * 将所有现有用户更新为管理员
 * 运行: node scripts/update-existing-users-to-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateExistingUsersToAdmin() {
  try {
    console.log('开始更新现有用户为管理员...');
    
    // 获取所有现有用户
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      }
    });
    
    console.log(`找到 ${existingUsers.length} 个用户`);
    
    // 更新所有用户为管理员
    const updateResult = await prisma.user.updateMany({
      where: {
        role: {
          not: 'admin'
        }
      },
      data: {
        role: 'admin'
      }
    });
    
    console.log(`成功更新 ${updateResult.count} 个用户为管理员`);
    
    // 显示更新后的用户列表
    const updatedUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log('\n当前所有用户状态:');
    console.log('═'.repeat(60));
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email.padEnd(30)} | 角色: ${user.role.padEnd(10)} | 注册时间: ${new Date(user.createdAt).toLocaleDateString('zh-CN')}`);
    });
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行更新
updateExistingUsersToAdmin();