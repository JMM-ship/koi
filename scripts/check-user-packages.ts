import prisma from '@/lib/prisma';

async function checkUserPackages() {
  try {
    // 检查所有用户套餐
    const allUserPackages = await prisma.userPackage.findMany({
      include: {
        package: true,
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('=== 所有用户套餐数据 ===');
    console.log(`总计找到 ${allUserPackages.length} 个用户套餐`);

    allUserPackages.forEach((up, index) => {
      console.log(`\n${index + 1}. 用户套餐:`);
      console.log(`  - ID: ${up.id}`);
      console.log(`  - 用户: ${up.user.email} (${up.user.id})`);
      console.log(`  - 套餐: ${up.package?.name || 'Unknown'}`);
      console.log(`  - 每日积分: ${up.dailyPoints}`);
      console.log(`  - 开始时间: ${up.startAt}`);
      console.log(`  - 结束时间: ${up.endAt}`);
      console.log(`  - 是否激活: ${up.isActive}`);
      console.log(`  - 是否过期: ${new Date(up.endAt) < new Date()}`);
    });

    // 检查所有套餐
    const allPackages = await prisma.package.findMany();
    console.log('\n=== 所有套餐数据 ===');
    console.log(`总计找到 ${allPackages.length} 个套餐`);

    allPackages.forEach((pkg, index) => {
      console.log(`\n${index + 1}. 套餐:`);
      console.log(`  - ID: ${pkg.id}`);
      console.log(`  - 名称: ${pkg.name}`);
      console.log(`  - 版本: ${pkg.version}`);
      console.log(`  - 计划类型: ${pkg.planType}`);
      console.log(`  - 每日积分: ${pkg.dailyPoints}`);
      console.log(`  - 价格: ${pkg.priceCents} cents`);
      console.log(`  - 是否激活: ${pkg.isActive}`);
    });

    // 检查所有用户
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        planType: true,
        planExpiredAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n=== 所有用户数据 ===');
    console.log(`总计找到 ${allUsers.length} 个用户`);

    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. 用户:`);
      console.log(`  - ID: ${user.id}`);
      console.log(`  - 邮箱: ${user.email}`);
      console.log(`  - 计划类型: ${user.planType}`);
      console.log(`  - 计划过期时间: ${user.planExpiredAt}`);
      console.log(`  - 注册时间: ${user.createdAt}`);
    });

  } catch (error) {
    console.error('Error checking user packages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPackages();