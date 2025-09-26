import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const errors: { test: string; error: any }[] = [];

// 创建的测试数据 ID 列表（用于清理）
const testDataIds = {
  users: [] as string[],
  packages: [] as string[],
  orders: [] as string[],
  apiKeys: [] as string[],
  userPackages: [] as string[],
  creditTransactions: [] as string[],
  usageRecords: [] as string[],
};

// Prisma 客户端
const prisma = new PrismaClient({
  log: process.env.VERBOSE ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// 工具函数：测试断言
function assert(condition: boolean, testName: string, errorMessage?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
  } else {
    failedTests++;
    const error = errorMessage || 'Assertion failed';
    console.log(`${colors.red}✗${colors.reset} ${testName}: ${error}`);
    errors.push({ test: testName, error });
  }
}

// 工具函数：生成随机邮箱
function generateTestEmail(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
}

// 工具函数：生成 API Key
function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `sk-test-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 7);
  return { key, hash, prefix };
}

// 测试部分分隔符
function printSection(title: string) {
  console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bright}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);
}

// ========== 测试函数 ==========

// 1. 测试数据库连接
async function testDatabaseConnection() {
  printSection('1. 测试数据库连接');

  try {
    await prisma.$connect();
    assert(true, '数据库连接成功');

    // 测试简单查询
    const count = await prisma.user.count();
    assert(true, `查询用户表成功 (当前 ${count} 条记录)`);
  } catch (error: any) {
    assert(false, '数据库连接失败', error.message);
    throw error; // 如果连接失败，终止测试
  }
}

// 2. 测试用户模型 CRUD
async function testUserCRUD() {
  printSection('2. 测试用户模型 CRUD');

  const testEmail = generateTestEmail();
  let userId: string | undefined;

  try {
    // CREATE
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        nickname: 'Test User',
        role: 'user',
        status: 'active',
      },
    });
    userId = user.id;
    testDataIds.users.push(userId);
    assert(!!user.id, '创建用户成功');

    // READ
    const foundUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    assert(foundUser?.email === testEmail, '查询用户成功');

    // UPDATE
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nickname: 'Updated User' },
    });
    assert(updatedUser.nickname === 'Updated User', '更新用户成功');

    // 测试唯一约束
    try {
      await prisma.user.create({
        data: {
          email: testEmail, // 重复的邮箱
          nickname: 'Duplicate User',
        },
      });
      assert(false, '唯一约束测试（应该失败）');
    } catch (error: any) {
      assert(error.code === 'P2002', '唯一约束正常工作');
    }

  } catch (error: any) {
    assert(false, '用户 CRUD 操作失败', error.message);
  }

  return userId;
}

// 3. 测试套餐模型
async function testPackageCRUD() {
  printSection('3. 测试套餐模型');

  let packageId: string | undefined;

  try {
    // 创建套餐
    const pkg = await prisma.package.create({
      data: {
        name: '测试套餐',
        version: 'v1.0.0',
        description: '这是一个测试套餐',
        priceCents: 9999,
        currency: 'CNY',
        dailyPoints: 1000,
        validDays: 30,
        planType: 'pro',
        features: {
          maxRequests: 10000,
          supportPriority: 'high',
        },
        sortOrder: 1,
        isActive: true,
      },
    });
    packageId = pkg.id;
    testDataIds.packages.push(packageId);
    assert(!!pkg.id, '创建套餐成功');

    // 查询激活的套餐
    const activePackages = await prisma.package.findMany({
      where: { isActive: true },
    });
    assert(activePackages.length > 0, '查询激活套餐成功');

  } catch (error: any) {
    assert(false, '套餐 CRUD 操作失败', error.message);
  }

  return packageId;
}

// 4. 测试钱包功能
async function testWalletOperations(userId: string) {
  printSection('4. 测试钱包功能');

  try {
    // 创建或获取钱包
    const wallet = await prisma.wallet.upsert({
      where: { userId },
      create: {
        userId,
        packageDailyQuotaTokens: BigInt(10000),
        packageTokensRemaining: BigInt(10000),
        independentTokens: BigInt(5000),
        lockedTokens: BigInt(0),
      },
      update: {},
    });
    assert(!!wallet, '创建/获取钱包成功');

    // 更新钱包余额
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: {
        independentTokens: {
          increment: BigInt(1000),
        },
      },
    });
    assert(updatedWallet.independentTokens >= BigInt(6000), '更新钱包余额成功');

    // 测试乐观锁
    const walletWithVersion = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (walletWithVersion) {
      try {
        // 使用版本号更新
        await prisma.wallet.update({
          where: {
            userId,
            version: walletWithVersion.version,
          },
          data: {
            packageTokensRemaining: BigInt(9000),
            version: { increment: 1 },
          },
        });
        assert(true, '乐观锁更新成功');
      } catch (error: any) {
        // 如果版本不匹配，会失败
        assert(false, '乐观锁更新失败', error.message);
      }
    }

  } catch (error: any) {
    assert(false, '钱包操作失败', error.message);
  }
}

// 5. 测试订单和用户套餐
async function testOrderAndUserPackage(userId: string, packageId: string) {
  printSection('5. 测试订单和用户套餐');

  const orderNo = `TEST_${Date.now()}`;
  let orderId: string | undefined;

  try {
    // 创建订单
    const order = await prisma.order.create({
      data: {
        orderNo,
        userId,
        status: 'paid',
        amountCents: 9999, // 99.99 元
        currency: 'CNY',
        productType: 'package',
        packageId,
        creditsPoints: 1000,
        paymentProvider: 'test',
        paidAt: new Date(),
        details: {
          userEmail: 'test@example.com',
          productName: '测试套餐',
          validMonths: 1,
        },
      },
    });
    orderId = order.id;
    testDataIds.orders.push(orderId);
    assert(!!order.id, '创建订单成功');

    // 创建用户套餐
    const startAt = new Date();
    const endAt = new Date();
    endAt.setDate(endAt.getDate() + 30);

    const userPackage = await prisma.userPackage.create({
      data: {
        userId,
        packageId,
        orderId,
        startAt,
        endAt,
        dailyPoints: 1000,
        dailyQuotaTokens: BigInt(10000),
        packageSnapshot: {
          name: '测试套餐',
          price: 99.99,
          dailyCredits: 1000,
        },
        isActive: true,
      },
    });
    testDataIds.userPackages.push(userPackage.id);
    assert(!!userPackage.id, '创建用户套餐成功');

    // 查询用户活跃套餐
    const activePackage = await prisma.userPackage.findFirst({
      where: {
        userId,
        isActive: true,
        endAt: { gte: new Date() },
      },
    });
    assert(!!activePackage, '查询用户活跃套餐成功');

  } catch (error: any) {
    assert(false, '订单和用户套餐操作失败', error.message);
  }

  return orderId;
}

// 6. 测试 API 密钥
async function testApiKeyOperations(userId: string) {
  printSection('6. 测试 API 密钥');

  const { key, hash, prefix } = generateApiKey();
  let apiKeyId: string | undefined;

  try {
    // 创建 API 密钥
    const apiKey = await prisma.apiKey.create({
      data: {
        ownerUserId: userId,
        keyHash: hash,
        prefix,
        name: 'Test API Key',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        meta: {
          createdBy: 'test_script',
          purpose: 'testing',
        },
      },
    });
    apiKeyId = apiKey.id;
    testDataIds.apiKeys.push(apiKeyId);
    assert(!!apiKey.id, '创建 API 密钥成功');
    console.log(`  ${colors.dim}生成的密钥: ${key}${colors.reset}`);

    // 查询 API 密钥
    const foundKey = await prisma.apiKey.findUnique({
      where: { keyHash: hash },
    });
    assert(foundKey?.ownerUserId === userId, '通过哈希查询 API 密钥成功');

    // 更新最后使用时间
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    });
    assert(true, '更新 API 密钥最后使用时间成功');

  } catch (error: any) {
    assert(false, 'API 密钥操作失败', error.message);
  }

  return apiKeyId;
}

// 7. 测试积分交易
async function testCreditTransactions(userId: string) {
  printSection('7. 测试积分交易');

  try {
    // 创建充值交易
    const rechargeTransaction = await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'recharge',
        bucket: 'independent',
        tokens: 5000,
        points: 50,
        beforeIndependentTokens: BigInt(1000),
        afterIndependentTokens: BigInt(6000),
        reason: '测试充值',
        meta: {
          source: 'test_script',
        },
      },
    });
    testDataIds.creditTransactions.push(rechargeTransaction.id);
    assert(!!rechargeTransaction.id, '创建充值交易成功');

    // 创建消费交易
    const useTransaction = await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'use',
        bucket: 'package',
        tokens: 1000,
        points: 10,
        beforePackageTokens: BigInt(10000),
        afterPackageTokens: BigInt(9000),
        requestId: `req_test_${Date.now()}`,
        reason: 'API 调用消费',
      },
    });
    testDataIds.creditTransactions.push(useTransaction.id);
    assert(!!useTransaction.id, '创建消费交易成功');

    // 查询用户交易历史
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    assert(transactions.length >= 2, '查询交易历史成功');

  } catch (error: any) {
    assert(false, '积分交易操作失败', error.message);
  }
}

// 8. 测试使用记录
async function testUsageRecords(userId: string, apiKeyId?: string) {
  printSection('8. 测试使用记录');

  const requestId = `req_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    // 创建使用记录
    const usageRecord = await prisma.usageRecord.create({
      data: {
        requestId,
        userId,
        apiKeyId,
        provider: 'openai',
        model: 'gpt-4',
        promptTokens: 500,
        completionTokens: 200,
        totalTokens: 700,
        tokensCharged: 700,
        pointsCharged: 7,
        bucketPackageTokens: 700,
        bucketIndependentTokens: 0,
        status: 'success',
        meta: {
          temperature: 0.7,
          maxTokens: 1000,
        },
      },
    });
    testDataIds.usageRecords.push(usageRecord.id);
    assert(!!usageRecord.id, '创建使用记录成功');

    // 统计使用量
    const stats = await prisma.usageRecord.aggregate({
      where: { userId },
      _sum: {
        totalTokens: true,
        pointsCharged: true,
      },
      _count: true,
    });
    assert(stats._count > 0, '统计使用量成功');
    console.log(`  ${colors.dim}总使用: ${stats._sum.totalTokens || 0} tokens, ${stats._sum.pointsCharged || 0} points${colors.reset}`);

  } catch (error: any) {
    assert(false, '使用记录操作失败', error.message);
  }
}

// 9. 测试事务
async function testTransactions(userId: string) {
  printSection('9. 测试事务操作');

  try {
    // 成功的事务
    await prisma.$transaction(async (tx) => {
      // 更新钱包
      await tx.wallet.update({
        where: { userId },
        data: {
          independentTokens: {
            decrement: BigInt(100),
          },
        },
      });

      // 创建交易记录
      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'use',
          bucket: 'independent',
          tokens: 100,
          points: 1,
          reason: '事务测试消费',
        },
      });
    });
    assert(true, '事务执行成功');

    // 测试事务回滚
    try {
      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId },
          data: {
            independentTokens: {
              decrement: BigInt(100),
            },
          },
        });

        // 故意触发错误
        throw new Error('模拟事务失败');
      });
      assert(false, '事务应该回滚');
    } catch (error: any) {
      assert(error.message === '模拟事务失败', '事务回滚成功');
    }

  } catch (error: any) {
    assert(false, '事务测试失败', error.message);
  }
}

// 10. 清理测试数据
async function cleanupTestData() {
  printSection('10. 清理测试数据');

  console.log(`${colors.yellow}是否清理测试数据？ (输入 'yes' 确认，其他任意键跳过)${colors.reset}`);

  // 在脚本中默认不清理，需要手动确认
  const cleanup = process.argv.includes('--cleanup');

  if (!cleanup) {
    console.log('跳过清理步骤（使用 --cleanup 参数来启用清理）');
    return;
  }

  try {
    // 清理顺序很重要，要先清理有外键依赖的表

    // 清理使用记录
    if (testDataIds.usageRecords.length > 0) {
      await prisma.usageRecord.deleteMany({
        where: { id: { in: testDataIds.usageRecords } },
      });
      console.log(`清理了 ${testDataIds.usageRecords.length} 条使用记录`);
    }

    // 清理积分交易
    if (testDataIds.creditTransactions.length > 0) {
      await prisma.creditTransaction.deleteMany({
        where: { id: { in: testDataIds.creditTransactions } },
      });
      console.log(`清理了 ${testDataIds.creditTransactions.length} 条积分交易`);
    }

    // 清理用户套餐
    if (testDataIds.userPackages.length > 0) {
      await prisma.userPackage.deleteMany({
        where: { id: { in: testDataIds.userPackages } },
      });
      console.log(`清理了 ${testDataIds.userPackages.length} 个用户套餐`);
    }

    // 清理订单
    if (testDataIds.orders.length > 0) {
      await prisma.order.deleteMany({
        where: { id: { in: testDataIds.orders } },
      });
      console.log(`清理了 ${testDataIds.orders.length} 个订单`);
    }

    // 清理 API 密钥
    if (testDataIds.apiKeys.length > 0) {
      await prisma.apiKey.deleteMany({
        where: { id: { in: testDataIds.apiKeys } },
      });
      console.log(`清理了 ${testDataIds.apiKeys.length} 个 API 密钥`);
    }

    // 清理钱包
    if (testDataIds.users.length > 0) {
      await prisma.wallet.deleteMany({
        where: { userId: { in: testDataIds.users } },
      });
      console.log(`清理了 ${testDataIds.users.length} 个钱包`);
    }

    // 清理用户
    if (testDataIds.users.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testDataIds.users } },
      });
      console.log(`清理了 ${testDataIds.users.length} 个用户`);
    }

    // 清理套餐
    if (testDataIds.packages.length > 0) {
      await prisma.package.deleteMany({
        where: { id: { in: testDataIds.packages } },
      });
      console.log(`清理了 ${testDataIds.packages.length} 个套餐`);
    }

    console.log(`${colors.green}测试数据清理完成${colors.reset}`);

  } catch (error: any) {
    console.error(`${colors.red}清理测试数据失败: ${error.message}${colors.reset}`);
  }
}

// ========== 主测试函数 ==========
async function runTests() {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}数据库功能完整测试${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  const startTime = Date.now();

  try {
    // 1. 测试数据库连接
    await testDatabaseConnection();

    // 2. 测试用户 CRUD
    const userId = await testUserCRUD();

    if (!userId) {
      throw new Error('用户创建失败，无法继续测试');
    }

    // 3. 测试套餐
    const packageId = await testPackageCRUD();

    // 4. 测试钱包
    await testWalletOperations(userId);

    // 5. 测试订单和用户套餐
    if (packageId) {
      await testOrderAndUserPackage(userId, packageId);
    }

    // 6. 测试 API 密钥
    const apiKeyId = await testApiKeyOperations(userId);

    // 7. 测试积分交易
    await testCreditTransactions(userId);

    // 8. 测试使用记录
    await testUsageRecords(userId, apiKeyId);

    // 9. 测试事务
    await testTransactions(userId);

    // 10. 清理（可选）
    await cleanupTestData();

  } catch (error: any) {
    console.error(`\n${colors.red}测试过程中发生致命错误: ${error.message}${colors.reset}`);
    console.error(error.stack);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // 打印测试结果
  printSection('测试结果');

  console.log(`总测试数: ${colors.bright}${totalTests}${colors.reset}`);
  console.log(`${colors.green}通过: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}失败: ${failedTests}${colors.reset}`);
  console.log(`耗时: ${colors.cyan}${duration}秒${colors.reset}`);

  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0';
  console.log(`通过率: ${passedTests === totalTests ? colors.green : colors.yellow}${passRate}%${colors.reset}`);

  // 如果有失败的测试，显示详细错误
  if (errors.length > 0) {
    console.log(`\n${colors.red}失败的测试详情:${colors.reset}`);
    errors.forEach(({ test, error }) => {
      console.log(`  ${colors.red}✗${colors.reset} ${test}`);
      console.log(`    ${colors.dim}${error}${colors.reset}`);
    });
  }

  // 断开数据库连接
  await prisma.$disconnect();

  // 设置退出代码
  process.exit(failedTests > 0 ? 1 : 0);
}

// 运行测试
runTests().catch((error) => {
  console.error(`${colors.red}未捕获的错误:${colors.reset}`, error);
  process.exit(1);
});