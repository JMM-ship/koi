const fs = require('fs');
const path = require('path');

// 查找项目根目录
function findProjectRoot() {
  let currentDir = __dirname;
  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.join(currentDir, 'package.json')) &&
        fs.existsSync(path.join(currentDir, 'prisma'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return path.dirname(__dirname);
}

const projectRoot = findProjectRoot();
console.log('🔍 项目根目录:', projectRoot);

// 需要修复的模型映射
const modelMappings = {
  // 旧模型名 -> 新模型名
  'CreditBalance': 'Wallet',
  'creditBalance': 'wallet',
  'Credit': 'CreditTransaction',
  'credit': 'creditTransaction',
  'ApiKey': 'ApiKey',  // 保持不变
  'apiKey': 'apiKey',
  'User': 'User',
  'user': 'user',
  'Order': 'Order',
  'order': 'order',
  'Package': 'Package',
  'package': 'package',
  'UserPackage': 'UserPackage',
  'userPackage': 'userPackage',
};

// 字段映射（针对不同模型）
const fieldMappings = {
  // Wallet (原 CreditBalance)
  'packageCredits': 'Number(packageTokensRemaining)',
  'independentCredits': 'Number(independentTokens)',
  'totalUsed': '0',  // 新模型中没有此字段
  'totalPurchased': '0',  // 新模型中没有此字段

  // ApiKey
  'apiKey': 'keyHash',
  'userUuid': 'ownerUserId',

  // Order
  'amount': 'amountCents',
  'userEmail': 'email',  // 从user关系获取

  // User
  'uuid': 'id',  // user.uuid -> user.id
};

// 需要修复的文件列表
const filesToFix = [
  // Models
  'app/models/creditBalance.ts',
  'app/models/creditTransaction.ts',
  'app/models/order.ts',
  'app/models/userPackage.ts',

  // Services
  'app/service/creditManager.ts',
  'app/service/creditResetService.ts',
  'app/service/orderProcessor.ts',
  'app/service/packageManager.ts',
  'app/service/user.ts',

  // API Routes
  'app/api/credits/balance/route.ts',
  'app/api/credits/use/route.ts',
  'app/api/credits/check-reset/route.ts',
  'app/api/orders/create/route.ts',
  'app/api/packages/route.ts',
  'app/api/apikeys/route.ts',

  // Auth
  'app/auth/config.ts',
  'lib/auth.ts',
  'lib/auth-mock.ts',
];

// 特殊处理：creditBalance.ts 需要重写为 wallet.ts
function rewriteCreditBalanceModel() {
  const filePath = path.join(projectRoot, 'app/models/creditBalance.ts');

  const newContent = `import { prisma } from "@/app/models/db";
import { Wallet as PrismaWallet } from "@prisma/client";

export interface CreditBalance {
  id: string;
  user_id: string;
  package_credits: number;
  package_reset_at?: string;
  independent_credits: number;
  total_used: number;
  total_purchased: number;
  version: number;
  created_at: string;
  updated_at: string;
}

// 转换函数：将Prisma Wallet转换为应用层CreditBalance格式（兼容旧代码）
function fromPrismaWallet(wallet: PrismaWallet | null): CreditBalance | undefined {
  if (!wallet) return undefined;

  return {
    id: wallet.userId,  // 使用userId作为id
    user_id: wallet.userId,
    package_credits: Number(wallet.packageTokensRemaining),
    package_reset_at: wallet.packageResetAt?.toISOString(),
    independent_credits: Number(wallet.independentTokens),
    total_used: 0,  // 新模型中没有此字段，返回默认值
    total_purchased: 0,  // 新模型中没有此字段，返回默认值
    version: wallet.version,
    created_at: wallet.createdAt.toISOString(),
    updated_at: wallet.updatedAt.toISOString(),
  };
}

// 获取用户积分余额
export async function getCreditBalance(userId: string): Promise<CreditBalance | undefined> {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    // 如果不存在，创建新的钱包记录
    if (!wallet) {
      const newWallet = await prisma.wallet.create({
        data: {
          userId,
          packageDailyQuotaTokens: BigInt(0),
          packageTokensRemaining: BigInt(0),
          independentTokens: BigInt(0),
          lockedTokens: BigInt(0),
          version: 0,
        },
      });
      return fromPrismaWallet(newWallet);
    }

    return fromPrismaWallet(wallet);
  } catch (error) {
    console.error('Error getting wallet:', error);
    return undefined;
  }
}

// 更新套餐积分
export async function updatePackageCredits(
  userId: string,
  credits: number,
  resetAt?: Date
): Promise<CreditBalance | undefined> {
  try {
    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {
        packageTokensRemaining: BigInt(credits),
        packageResetAt: resetAt || new Date(),
      },
      create: {
        userId,
        packageDailyQuotaTokens: BigInt(credits),
        packageTokensRemaining: BigInt(credits),
        packageResetAt: resetAt || new Date(),
        independentTokens: BigInt(0),
        lockedTokens: BigInt(0),
        version: 0,
      },
    });

    return fromPrismaWallet(wallet);
  } catch (error) {
    console.error('Error updating package credits:', error);
    return undefined;
  }
}

// 添加独立积分
export async function addIndependentCredits(
  userId: string,
  credits: number,
  orderNo?: string
): Promise<CreditBalance | undefined> {
  try {
    const wallet = await prisma.wallet.update({
      where: { userId },
      data: {
        independentTokens: {
          increment: BigInt(credits),
        },
      },
    });

    return fromPrismaWallet(wallet);
  } catch (error) {
    console.error('Error adding independent credits:', error);
    return undefined;
  }
}

// 使用积分（带乐观锁）
export async function useCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; balance?: CreditBalance; error?: string }> {
  try {
    const wallet = await prisma.$transaction(async (tx) => {
      const current = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!current) {
        throw new Error('Wallet not found');
      }

      const totalAvailable = Number(current.packageTokensRemaining) + Number(current.independentTokens);
      if (totalAvailable < amount) {
        throw new Error('Insufficient credits');
      }

      // 优先使用套餐积分
      let packageToUse = Math.min(amount, Number(current.packageTokensRemaining));
      let independentToUse = amount - packageToUse;

      const updated = await tx.wallet.update({
        where: {
          userId,
          version: current.version,  // 乐观锁
        },
        data: {
          packageTokensRemaining: {
            decrement: BigInt(packageToUse),
          },
          independentTokens: {
            decrement: BigInt(independentToUse),
          },
          version: {
            increment: 1,
          },
        },
      });

      return updated;
    });

    return {
      success: true,
      balance: fromPrismaWallet(wallet),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// 重置套餐积分
export async function resetPackageCredits(
  userId: string,
  dailyCredits: number
): Promise<CreditBalance | undefined> {
  try {
    const wallet = await prisma.wallet.update({
      where: { userId },
      data: {
        packageTokensRemaining: BigInt(dailyCredits),
        packageResetAt: new Date(),
      },
    });

    return fromPrismaWallet(wallet);
  } catch (error) {
    console.error('Error resetting package credits:', error);
    return undefined;
  }
}

// 获取积分统计
export async function getCreditStats(userId: string) {
  const balance = await getCreditBalance(userId);
  if (!balance) return null;

  return {
    packageCredits: balance.package_credits,
    independentCredits: balance.independent_credits,
    totalAvailable: balance.package_credits + balance.independent_credits,
    lastResetAt: balance.package_reset_at,
  };
}

// 导出兼容的函数名
export { getCreditBalance as getUserBalance };
export { updatePackageCredits as setPackageCredits };
export { addIndependentCredits as purchaseCredits };
`;

  fs.writeFileSync(filePath, newContent);
  console.log('✅ 重写了 creditBalance.ts 以适配 Wallet 模型');
}

// 处理文件
function processFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // 替换模型引用
  content = content.replace(/prisma\.creditBalance/g, 'prisma.wallet');
  content = content.replace(/CreditBalance as PrismaCreditBalance/g, 'Wallet as PrismaWallet');
  content = content.replace(/prisma\.credit\./g, 'prisma.creditTransaction.');
  content = content.replace(/prisma\.apiKey/g, 'prisma.apiKey');

  // 修复字段引用
  content = content.replace(/\.packageCredits/g, '.packageTokensRemaining');
  content = content.replace(/\.independentCredits/g, '.independentTokens');
  content = content.replace(/\.apiKey([^a-zA-Z])/g, '.keyHash$1');
  content = content.replace(/\.userUuid/g, '.ownerUserId');

  if (content !== fs.readFileSync(fullPath, 'utf8')) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ 修复了: ${filePath}`);
  }
}

// 主程序
console.log('🔧 开始修复TypeScript类型错误...\n');

// 首先重写 creditBalance.ts
rewriteCreditBalanceModel();

// 然后处理其他文件
filesToFix.forEach(file => {
  if (file !== 'app/models/creditBalance.ts') {  // 跳过已经重写的文件
    try {
      processFile(file);
    } catch (error) {
      console.error(`❌ 处理失败 ${file}: ${error.message}`);
    }
  }
});

console.log('\n✨ 类型错误修复完成！');
console.log('\n📋 后续步骤：');
console.log('1. 运行 npx tsc --noEmit 检查是否还有类型错误');
console.log('2. 如果还有错误，请告诉我具体的错误信息');