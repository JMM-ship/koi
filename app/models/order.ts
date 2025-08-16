import { prisma } from "@/app/models/db";
import { Order as PrismaOrder } from "@prisma/client";

export enum OrderStatus {
  Created = "created",
  Paid = "paid",
  Deleted = "deleted",
}

// 转换函数：将应用层数据转换为Prisma格式
function toPrismaOrder(order: any): any {

  
  return {
    orderNo: order.order_no,
    userUuid: order.user_uuid || '',
    userEmail: order.user_email || '',
    amount: order.amount,
    interval: order.interval || null,
    expiredAt: order.expired_at ? new Date(order.expired_at) : null,
    status: order.status,
    stripeSessionId: order.stripe_session_id || null,
    credits: order.credits,
    currency: order.currency || null,
    subId: order.sub_id || null,
    subIntervalCount: order.sub_interval_count || null,
    subCycleAnchor: order.sub_cycle_anchor || null,
    subPeriodEnd: order.sub_period_end || null,
    subPeriodStart: order.sub_period_start || null,
    subTimes: order.sub_times || null,
    packageId: order.package_id || null,
    productName: order.product_name || null,
    validMonths: order.valid_months || null,
    orderDetail: order.order_detail || null,
    paidAt: order.paid_at ? new Date(order.paid_at) : null,
    paidEmail: order.paid_email || null,
    paidDetail: order.paid_detail || null,
    orderType: order.order_type,
    creditAmount: order.credit_amount || null,
    packageSnapshot: order.package_snapshot || null,
    startDate: order.start_date ? new Date(order.start_date) : null,
    endDate: order.end_date ? new Date(order.end_date) : null,
    discountAmount: order.discount_amount || 0,
    couponCode: order.coupon_code || null,
    paymentMethod: order.payment_method || null
  };
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaOrder(order: PrismaOrder | null): any | undefined {
  if (!order) return undefined;
  return {
    id: order.id,
    order_type: order.orderType,
    order_no: order.orderNo,
    created_at: order.createdAt.toISOString(),
    user_uuid: order.userUuid,
    user_email: order.userEmail,
    amount: order.amount,
    interval: order.interval,
    expired_at: order.expiredAt?.toISOString(),
    status: order.status,
    stripe_session_id: order.stripeSessionId,
    credits: order.credits,
    currency: order.currency,
    sub_id: order.subId,
    sub_interval_count: order.subIntervalCount,
    sub_cycle_anchor: order.subCycleAnchor,
    sub_period_end: order.subPeriodEnd,
    sub_period_start: order.subPeriodStart,
    sub_times: order.subTimes,
    package_id: order.packageId,
    product_name: order.productName,
    valid_months: order.validMonths,
    order_detail: order.orderDetail,
    paid_at: order.paidAt?.toISOString(),
    paid_email: order.paidEmail,
    paid_detail: order.paidDetail,
  };
}

export async function insertOrder(order: any) {
  console.log("出版人",order);
  
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
  user_uuid: string
): Promise<any | undefined> {
  try {
    const order = await prisma.order.findFirst({
      where: {
        userUuid: user_uuid,
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
    const order = await prisma.order.findFirst({
      where: {
        userEmail: user_email,
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

export async function updateOrderStatus(
  order_no: string,
  status: string,
  paid_at: string,
  paid_email: string,
  paid_detail: string
) {
  try {
    const data = await prisma.order.update({
      where: { orderNo: order_no },
      data: {
        status,
        paidAt: new Date(paid_at),
        paidEmail: paid_email,
        paidDetail: paid_detail,
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
    const data = await prisma.order.update({
      where: { orderNo: order_no },
      data: {
        stripeSessionId: stripe_session_id,
        orderDetail: order_detail,
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
    const data = await prisma.order.update({
      where: { orderNo: order_no },
      data: {
        subId: sub_id,
        subIntervalCount: sub_interval_count,
        subCycleAnchor: sub_cycle_anchor,
        subPeriodEnd: sub_period_end,
        subPeriodStart: sub_period_start,
        status,
        paidAt: new Date(paid_at),
        subTimes: sub_times,
        paidEmail: paid_email,
        paidDetail: paid_detail,
      },
    });
    return fromPrismaOrder(data);
  } catch (error) {
    throw error;
  }
}

export async function getOrdersByUserUuid(
  user_uuid: string
): Promise<any[] | undefined> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userUuid: user_uuid,
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
    const orders = await prisma.order.findMany({
      where: {
        userEmail: user_email,
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

export async function getOrdersByPaidEmail(
  paid_email: string
): Promise<any[] | undefined> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        paidEmail: paid_email,
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