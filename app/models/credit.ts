import { prisma } from "@/app/models/db";
import { Credit as PrismaCredit } from "@prisma/client";

// 转换函数：将应用层数据转换为Prisma格式
function toPrismaCredit(credit: any): any {
  return {
    transNo: credit.trans_no,
    userUuid: credit.user_uuid,
    transType: credit.trans_type,
    credits: credit.credits,
    orderNo: credit.order_no || null,
    expiredAt: credit.expired_at ? new Date(credit.expired_at) : null,
  };
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaCredit(credit: PrismaCredit | null): any | undefined {
  if (!credit) return undefined;
  
  return {
    id: credit.id,
    trans_no: credit.transNo,
    created_at: credit.createdAt.toISOString(),
    user_uuid: credit.userUuid,
    trans_type: credit.transType,
    credits: credit.credits,
    order_no: credit.orderNo,
    expired_at: credit.expiredAt?.toISOString(),
  };
}

export async function insertCredit(credit: any) {
  try {
    const data = await prisma.credit.create({
      data: toPrismaCredit(credit),
    });
    return fromPrismaCredit(data);
  } catch (error) {
    throw error;
  }
}

export async function findCreditByTransNo(
  trans_no: string
): Promise<any | undefined> {
  try {
    const credit = await prisma.credit.findUnique({
      where: { transNo: trans_no },
    });
    return fromPrismaCredit(credit);
  } catch (error) {
    return undefined;
  }
}

export async function findCreditByOrderNo(
  order_no: string
): Promise<any | undefined> {
  try {
    const credit = await prisma.credit.findFirst({
      where: { orderNo: order_no },
    });
    return fromPrismaCredit(credit);
  } catch (error) {
    return undefined;
  }
}

export async function getUserValidCredits(
  user_uuid: string
): Promise<any[] | undefined> {
  const now = new Date();
  try {
    const credits = await prisma.credit.findMany({
      where: {
        userUuid: user_uuid,
        expiredAt: {
          gte: now,
        },
      },
      orderBy: {
        expiredAt: 'asc',
      },
    });
    return credits.map(fromPrismaCredit);
  } catch (error) {
    return undefined;
  }
}

export async function getCreditsByUserUuid(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<any[] | undefined> {
  try {
    const credits = await prisma.credit.findMany({
      where: {
        userUuid: user_uuid,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return credits.map(fromPrismaCredit);
  } catch (error) {
    return undefined;
  }
}