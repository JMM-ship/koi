const path = require('path')

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function testPrismaConnection() {
  console.log('测试Prisma与Supabase的连接...\n')

  try {
    // 动态导入Prisma Client
    const { PrismaClient } = require('../node_modules/.prisma/client-supabase')
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })

    console.log('1. 测试数据库连接...')
    await prisma.$connect()
    console.log('✅ Prisma连接成功\n')

    console.log('2. 创建测试用户...')
    const testUser = await prisma.user.create({
      data: {
        email: `test_${Date.now()}@example.com`,
        nickname: 'Test User',
        role: 'user',
        status: 'active'
      }
    })
    console.log('✅ 用户创建成功:', testUser.id, '\n')

    console.log('3. 查询用户...')
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    console.log(`✅ 找到 ${users.length} 个用户\n`)

    console.log('4. 创建测试套餐...')
    const testPackage = await prisma.package.create({
      data: {
        name: `Test Package ${Date.now()}`,
        version: '1.0.0',
        description: 'Test package for Supabase',
        priceCents: 999,
        currency: 'USD',
        dailyPoints: 1000,
        planType: 'basic',
        validDays: 30
      }
    })
    console.log('✅ 套餐创建成功:', testPackage.id, '\n')

    console.log('5. 测试关联查询...')
    const userWithRelations = await prisma.user.findFirst({
      where: { id: testUser.id },
      include: {
        orders: true,
        apiKeys: true
      }
    })
    console.log('✅ 关联查询成功\n')

    console.log('6. 清理测试数据...')
    await prisma.package.delete({ where: { id: testPackage.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    console.log('✅ 测试数据已清理\n')

    await prisma.$disconnect()
    console.log('🎉 所有测试通过！Prisma与Supabase集成成功！')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('详细错误:', error)
    process.exit(1)
  }
}

// 检查Prisma客户端是否存在
try {
  require('../node_modules/.prisma/client-supabase')
  testPrismaConnection()
} catch (err) {
  console.error('❌ Prisma客户端未找到')
  console.log('请先运行: npx prisma generate --schema=prisma/schema.supabase.prisma')
  process.exit(1)
}