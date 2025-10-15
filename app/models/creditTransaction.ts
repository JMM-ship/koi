import { prisma } from "@/app/models/db";
import { CreditTransaction as PrismaCreditTransaction } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';

export enum TransactionType {
  Income = 'income',
  Expense = 'expense',
  Reset = 'reset',
}

export enum CreditType {
  Package = 'package',
  Independent = 'independent',
}

export interface CreditTransaction {
  id: string;
  trans_no: string;
  user_id: string;
  type: TransactionType;
  credit_type: CreditType;
  amount: number;
  before_balance: number;
  after_balance: number;
  order_no?: string;
  description?: string;
  metadata?: any;
  created_at: string;
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaCreditTransaction(trans: PrismaCreditTransaction | null): CreditTransaction | undefined {
  if (!trans) return undefined;

  // 计算 before_balance 和 after_balance
  const beforeBalance = Number(trans.beforePackageTokens || 0) + Number(trans.beforeIndependentTokens || 0);
  const afterBalance = Number(trans.afterPackageTokens || 0) + Number(trans.afterIndependentTokens || 0);

  return {
    id: trans.id,
    trans_no: trans.id, // 使用 id 作为交易号
    user_id: trans.userId,
    type: trans.type as TransactionType,
    credit_type: trans.bucket as CreditType, // bucket 对应 credit_type
    amount: trans.points, // 使用 points 作为 amount
    before_balance: beforeBalance,
    after_balance: afterBalance,
    order_no: trans.orderId || undefined,
    description: trans.reason || undefined,
    metadata: trans.meta,
    created_at: trans.createdAt.toISOString(),
  };
}

// 生成交易号
function generateTransNo(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `T${year}${month}${day}${Date.now()}${random}`;
}

// 创建积分流水记录
export async function createCreditTransaction(data: {
  user_id: string;
  type: TransactionType;
  credit_type: CreditType;
  amount: number;
  before_balance: number;
  after_balance: number;
  order_no?: string;
  description?: string;
  metadata?: any;
}): Promise<CreditTransaction | undefined> {
  try {
    const trans = await prisma.creditTransaction.create({
      data: {
        userId: data.user_id,
        type: data.type,
        bucket: data.credit_type, // credit_type 映射到 bucket
        tokens: data.amount, // 使用 tokens 字段
        points: data.amount, // 使用 points 字段
        // 根据积分类型设置before/after值
        beforePackageTokens: data.credit_type === CreditType.Package ? BigInt(data.before_balance) : null,
        afterPackageTokens: data.credit_type === CreditType.Package ? BigInt(data.after_balance) : null,
        beforeIndependentTokens: data.credit_type === CreditType.Independent ? BigInt(data.before_balance) : null,
        afterIndependentTokens: data.credit_type === CreditType.Independent ? BigInt(data.after_balance) : null,
        // orderId 字段为 UUID，仅当传入合法 UUID 时才写入，否则置 null
        orderId: data.order_no && data.order_no.match(/^[0-9a-fA-F-]{36}$/) ? data.order_no : null,
        reason: data.description || null,
        meta: data.metadata || {},
      },
    });
    return fromPrismaCreditTransaction(trans);
  } catch (error) {
    console.error('Error creating credit transaction:', error);
    throw error;
  }
}

// 获取用户积分流水
export async function getCreditTransactions(
  userId: string,
  options?: {
    type?: TransactionType;
    creditType?: CreditType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }
): Promise<{ transactions: CreditTransaction[]; total: number }> {
  try {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const skip = (page - 1) * pageSize;
    
    const where: any = { userId };
    
    if (options?.type) {
      where.type = options.type;
    }
    
    if (options?.creditType) {
      where.bucket = options.creditType; // creditType 映射到 bucket
    }
    
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options?.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }
    
    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.creditTransaction.count({ where }),
    ]);
    
    return {
      transactions: transactions.map(t => fromPrismaCreditTransaction(t)!),
      total,
    };
  } catch (error) {
    console.error('Error getting credit transactions:', error);
    return { transactions: [], total: 0 };
  }
}

// 获取今日使用量
export async function getTodayUsage(userId: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: TransactionType.Expense,
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        points: true, // 使用 points 字段
      },
    });
    
    return result._sum.points || 0;
  } catch (error) {
    console.error('Error getting today usage:', error);
    return 0;
  }
}

// 获取月度使用量
export async function getMonthlyUsage(userId: string): Promise<number> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const result = await prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: TransactionType.Expense,
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        points: true, // 使用 points 字段
      },
    });
    
    return result._sum.points || 0;
  } catch (error) {
    console.error('Error getting monthly usage:', error);
    return 0;
  }
}

// 获取用户积分统计
export async function getCreditStatsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalIncome: number;
  totalExpense: number;
  totalReset: number;
  netChange: number;
}> {
  try {
    const transactions = await prisma.creditTransaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        type: true,
        points: true,
      },
    });
    
    let totalIncome = 0;
    let totalExpense = 0;
    let totalReset = 0;
    
    transactions.forEach(trans => {
      switch (trans.type) {
        case TransactionType.Income:
          totalIncome += trans.points;
          break;
        case TransactionType.Expense:
          totalExpense += trans.points;
          break;
        case TransactionType.Reset:
          totalReset += trans.points;
          break;
      }
    });
    
    return {
      totalIncome,
      totalExpense,
      totalReset,
      netChange: totalIncome - totalExpense,
    };
  } catch (error) {
    console.error('Error getting credit stats:', error);
    return {
      totalIncome: 0,
      totalExpense: 0,
      totalReset: 0,
      netChange: 0,
    };
  }
}

// 批量创建积分重置流水
export async function batchCreateResetTransactions(
  resets: Array<{
    userId: string;
    amount: number;
    beforeBalance: number;
    afterBalance: number;
  }>
): Promise<number> {
  try {
    const transactions = resets.map(reset => ({
      userId: reset.userId,
      type: TransactionType.Reset,
      bucket: CreditType.Package, // creditType 映射到 bucket
      tokens: reset.amount,
      points: reset.amount,
      beforePackageTokens: BigInt(reset.beforeBalance),
      afterPackageTokens: BigInt(reset.afterBalance),
      beforeIndependentTokens: null,
      afterIndependentTokens: null,
      reason: 'Daily credits reset',
      meta: { autoReset: true },
    }));
    
    const result = await prisma.creditTransaction.createMany({
      data: transactions,
    });
    
    return result.count;
  } catch (error) {
    console.error('Error batch creating reset transactions:', error);
    return 0;
  }
}

// 获取最近的交易记录
export async function getRecentTransactions(
  userId: string,
  limit: number = 10
): Promise<CreditTransaction[]> {
  try {
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return transactions.map(t => fromPrismaCreditTransaction(t)!);
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    return [];
  }
}

// 根据订单号获取流水
export async function getTransactionsByOrderNo(orderNo: string): Promise<CreditTransaction[]> {
  try {
    const transactions = await prisma.creditTransaction.findMany({
      where: { orderId: orderNo }, // orderNo -> orderId
      orderBy: { createdAt: 'desc' },
    });
    
    return transactions.map(t => fromPrismaCreditTransaction(t)!);
  } catch (error) {
    console.error('Error getting transactions by order no:', error);
    return [];
  }
}
