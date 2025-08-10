import { prisma } from "@/app/models/db";
import { getUsersByUuids } from "./user";
import { Affiliate as PrismaAffiliate } from "@prisma/client";

// 转换函数：将应用层数据转换为Prisma格式
function toPrismaAffiliate(affiliate: any): any {
  return {
    userUuid: affiliate.user_uuid,
    invitedBy: affiliate.invited_by,
    status: affiliate.status || '',
    paidOrderNo: affiliate.paid_order_no || '',
    paidAmount: affiliate.paid_amount || 0,
    rewardPercent: affiliate.reward_percent || 0,
    rewardAmount: affiliate.reward_amount || 0,
  };
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaAffiliate(affiliate: PrismaAffiliate | null): any | undefined {
  if (!affiliate) return undefined;
  
  return {
    id: affiliate.id,
    user_uuid: affiliate.userUuid,
    created_at: affiliate.createdAt.toISOString(),
    status: affiliate.status,
    invited_by: affiliate.invitedBy,
    paid_order_no: affiliate.paidOrderNo,
    paid_amount: affiliate.paidAmount,
    reward_percent: affiliate.rewardPercent,
    reward_amount: affiliate.rewardAmount,
  };
}

export async function insertAffiliate(affiliate: any) {
  try {
    const data = await prisma.affiliate.create({
      data: toPrismaAffiliate(affiliate),
    });
    return fromPrismaAffiliate(data);
  } catch (error) {
    throw error;
  }
}

export async function getUserAffiliates(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<any[] | undefined> {
  try {
    const affiliates = await prisma.affiliate.findMany({
      where: {
        invitedBy: user_uuid,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!affiliates || affiliates.length === 0) {
      return undefined;
    }

    const user_uuids = Array.from(new Set(affiliates.map((item) => item.userUuid)));
    const users = await getUsersByUuids(user_uuids);
    
    const affiliatesWithUsers = affiliates.map((item) => {
      const affiliate = fromPrismaAffiliate(item);
      const user = users.find((user) => user.uuid === item.userUuid);
      return { ...affiliate, user };
    });

    return affiliatesWithUsers;
  } catch (error) {
    console.error("Error fetching user invites:", error);
    return [];
  }
}

export async function getAffiliateSummary(user_uuid: string) {
  const summary = {
    total_invited: 0,
    total_paid: 0,
    total_reward: 0,
  };

  try {
    const affiliates = await prisma.affiliate.findMany({
      where: {
        invitedBy: user_uuid,
      },
    });

    const invited_users = new Set();
    const paid_users = new Set();

    affiliates.forEach((item) => {
      invited_users.add(item.userUuid);
      if (item.paidAmount > 0) {
        paid_users.add(item.userUuid);
        summary.total_reward += item.rewardAmount;
      }
    });

    summary.total_invited = invited_users.size;
    summary.total_paid = paid_users.size;

    return summary;
  } catch (error) {
    return summary;
  }
}

export async function findAffiliateByOrderNo(order_no: string) {
  try {
    const affiliate = await prisma.affiliate.findFirst({
      where: {
        paidOrderNo: order_no,
      },
    });
    return fromPrismaAffiliate(affiliate);
  } catch (error) {
    return undefined;
  }
}

export async function getAllAffiliates(
  page: number = 1,
  limit: number = 50
): Promise<any[]> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 50;

  const offset = (page - 1) * limit;

  try {
    const affiliates = await prisma.affiliate.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!affiliates || affiliates.length === 0) {
      return [];
    }

    const user_uuids = Array.from(new Set(affiliates.map((item) => item.userUuid)));
    const invited_by_uuids = Array.from(
      new Set(affiliates.map((item) => item.invitedBy))
    );

    const users = await getUsersByUuids(user_uuids);
    const invited_by_users = await getUsersByUuids(invited_by_uuids);

    const affiliatesWithDetails = affiliates.map((item) => {
      const affiliate = fromPrismaAffiliate(item);
      const user = users.find((user) => user.uuid === item.userUuid);
      const invited_by = invited_by_users.find(
        (user) => user.uuid === item.invitedBy
      );
      return { ...affiliate, user, invited_by_user: invited_by };
    });

    return affiliatesWithDetails;
  } catch (error) {
    return [];
  }
}