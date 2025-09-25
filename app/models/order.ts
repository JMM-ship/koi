import { prisma } from "@/app/models/db";
import { Order as PrismaOrder } from "@prisma/client";

export enum OrderStatus {
  Created = "created",
  Paid = "paid",
  Deleted = "deleted",
}

// 转换函数：将应用层数据转换为Prisma格式
function toPrismaOrder(order: any): any {
  // 将额外信息存储在 details JSON 中
  const details: any = {
    userEmail: order.user_email || '',
    interval: order.interval || null,
    expiredAt: order.expired_at || null,
    subId: order.sub_id || null,
    subIntervalCount: order.sub_interval_count || null,
    subCycleAnchor: order.sub_cycle_anchor || null,
    subPeriodEnd: order.sub_period_end || null,
    subPeriodStart: order.sub_period_start || null,
    subTimes: order.sub_times || null,
    productName: order.product_name || null,
    validMonths: order.valid_months || null,
    orderDetail: order.order_detail || null,
    paidEmail: order.paid_email || null,
    paidDetail: order.paid_detail || null,
    packageSnapshot: order.package_snapshot || null,
    startDate: order.start_date || null,
    endDate: order.end_date || null,
    discountAmount: order.discount_amount || 0,
    couponCode: order.coupon_code || null,
  };

  return {
    orderNo: order.order_no,
    userId: order.user_id || '',
    status: order.status,
    amountCents: Math.round((order.amount || 0) * 100), // 元转分
    currency: order.currency || 'USD',
    productType: order.order_type || 'unknown',
    packageId: order.package_id || null,
    creditsPoints: order.credits || order.credit_amount || null,
    paymentProvider: order.payment_method || null,
    paymentSessionId: order.stripe_session_id || null,
    paidAt: order.paid_at ? new Date(order.paid_at) : null,
    details: details,
  };
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaOrder(order: PrismaOrder | null): any | undefined {
  if (!order) return undefined;

  // 从 details JSON 中提取额外信息
  const details = (order.details as any) || {};

  return {
    id: order.id,
    order_type: order.productType, // productType 对应 order_type
    order_no: order.orderNo,
    created_at: order.createdAt.toISOString(),
    user_id: order.userId,
    user_email: details.userEmail || '', // 从 details 中获取
    amount: order.amountCents / 100, // 分转元
    interval: details.interval || null,
    expired_at: details.expiredAt || null,
    status: order.status,
    stripe_session_id: order.paymentSessionId,
    credits: order.creditsPoints,
    currency: order.currency,
    sub_id: details.subId || null,
    sub_interval_count: details.subIntervalCount || null,
    sub_cycle_anchor: details.subCycleAnchor || null,
    sub_period_end: details.subPeriodEnd || null,
    sub_period_start: details.subPeriodStart || null,
    sub_times: details.subTimes || null,
    package_id: order.packageId,
    product_name: details.productName || null,
    valid_months: details.validMonths || null,
    order_detail: details.orderDetail || null,
    paid_at: order.paidAt?.toISOString(),
    paid_email: details.paidEmail || null,
    paid_detail: details.paidDetail || null,
    credit_amount: order.creditsPoints || null,
    package_snapshot: details.packageSnapshot || null,
    start_date: details.startDate || null,
    end_date: details.endDate || null,
    discount_amount: details.discountAmount || 0,
    coupon_code: details.couponCode || null,
    payment_method: order.paymentProvider || null,
  };
}

export async function insertOrder(order: any) {
  
  try {
    const data = await prisma.order.create({
      data: toPrismaOrder(order),
    });
    return fromPrismaOrder(data);
  } catch (error) {
    throw error;
  }
}

export async function findOrderByOrderNo(
  order_no: string
): Promise<any | undefined> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNo: order_no },
    });
    
    return fromPrismaOrder(order);
  } catch (error) {
    return undefined;
  }
}

export async function getFirstPaidOrderByUserUuid(
  user_id: string
): Promise<any | undefined> {
  try {
    const order = await prisma.order.findFirst({
      where: {
        userId: user_id,
        status: "paid",
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return fromPrismaOrder(order);
  } catch (error) {
    return undefined;
  }
}

export async function getFirstPaidOrderByUserEmail(
  user_email: string
): Promise<any | undefined> {
  try {
    // 由于 userEmail 现在存储在 details JSON 中，需要使用不同的查询方法
    const orders = await prisma.order.findMany({
      where: {
        status: "paid",
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 过滤出匹配的 email
    const matchingOrder = orders.find(order => {
      const details = (order.details as any) || {};
      return details.userEmail === user_email;
    });

    return fromPrismaOrder(matchingOrder || null);
  } catch (error) {
    return undefined;
  }
}

export async function updateOrderStatus(
  order_no: string,
  status: string,
  paid_at: string,
  paid_email: string,
  paid_detail: string
) {
  try {
    // 获取当前订单以保留现有 details
    const currentOrder = await prisma.order.findUnique({
      where: { orderNo: order_no }
    });

    const currentDetails = (currentOrder?.details as any) || {};

    const data = await prisma.order.update({
      where: { orderNo: order_no },
      data: {
        status,
        paidAt: new Date(paid_at),
        details: {
          ...currentDetails,
          paidEmail: paid_email,
          paidDetail: paid_detail,
        },
      },
    });
    return fromPrismaOrder(data);
  } catch (error) {
    throw error;
  }
}

export async function updateOrderSession(
  order_no: string,
  stripe_session_id: string,
  order_detail: string
) {
  try {
    // 获取当前订单以保留现有 details
    const currentOrder = await prisma.order.findUnique({
      where: { orderNo: order_no }
    });

    const currentDetails = (currentOrder?.details as any) || {};

    const data = await prisma.order.update({
      where: { orderNo: order_no },
      data: {
        paymentSessionId: stripe_session_id, // stripeSessionId -> paymentSessionId
        details: {
          ...currentDetails,
          orderDetail: order_detail,
        },
      },
    });
    return fromPrismaOrder(data);
  } catch (error) {
    throw error;
  }
}

export async function updateOrderSubscription(
  order_no: string,
  sub_id: string,
  sub_interval_count: number,
  sub_cycle_anchor: number,
  sub_period_end: number,
  sub_period_start: number,
  status: string,
  paid_at: string,
  sub_times: number,
  paid_email: string,
  paid_detail: string
) {
  try {
    // 获取当前订单以保留现有 details
    const currentOrder = await prisma.order.findUnique({
      where: { orderNo: order_no }
    });

    const currentDetails = (currentOrder?.details as any) || {};

    const data = await prisma.order.update({
      where: { orderNo: order_no },
      data: {
        status,
        paidAt: new Date(paid_at),
        details: {
          ...currentDetails,
          subId: sub_id,
          subIntervalCount: sub_interval_count,
          subCycleAnchor: sub_cycle_anchor,
          subPeriodEnd: sub_period_end,
          subPeriodStart: sub_period_start,
          subTimes: sub_times,
          paidEmail: paid_email,
          paidDetail: paid_detail,
        },
      },
    });
    return fromPrismaOrder(data);
  } catch (error) {
    throw error;
  }
}

export async function getOrdersByUserUuid(
  user_id: string
): Promise<any[] | undefined> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: user_id,
        status: "paid",
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return orders.map(fromPrismaOrder);
  } catch (error) {
    return undefined;
  }
}

export async function getOrdersByUserEmail(
  user_email: string
): Promise<any[] | undefined> {
  try {
    // 由于 userEmail 现在存储在 details JSON 中，需要使用不同的查询方法
    const orders = await prisma.order.findMany({
      where: {
        status: "paid",
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 过滤出匹配的 email
    const matchingOrders = orders.filter(order => {
      const details = (order.details as any) || {};
      return details.userEmail === user_email;
    });

    return matchingOrders.map(fromPrismaOrder);
  } catch (error) {
    return undefined;
  }
}

export async function getOrdersByPaidEmail(
  paid_email: string
): Promise<any[] | undefined> {
  try {
    // paidEmail 现在存储在 details JSON 中
    const orders = await prisma.order.findMany({
      where: {
        status: "paid",
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 过滤出匹配的 paid email
    const matchingOrders = orders.filter(order => {
      const details = (order.details as any) || {};
      return details.paidEmail === paid_email;
    });

    return matchingOrders.map(fromPrismaOrder);
  } catch (error) {
    return undefined;
  }
}

export async function getPaiedOrders(
  page: number,
  limit: number
): Promise<any[] | undefined> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "paid",
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return orders.map(fromPrismaOrder);
  } catch (error) {
    return undefined;
  }
}

export async function getPaidOrdersTotal(): Promise<number | undefined> {
  try {
    const count = await prisma.order.count({
      where: {
        status: "paid",
      },
    });
    return count;
  } catch (error) {
    return undefined;
  }
}

export async function getOrderCountByDate(
  startTime: string,
  status?: string
): Promise<Map<string, number> | undefined> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(startTime),
        },
        ...(status && { status }),
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date in memory
    const dateCountMap = new Map<string, number>();
    orders.forEach((item) => {
      const date = item.createdAt.toISOString().split("T")[0];
      dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
    });

    return dateCountMap;
  } catch (error) {
    return undefined;
  }
}