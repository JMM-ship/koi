import { insertOrder, updateOrderStatus, findOrderByOrderNo } from "@/app/models/order";
import { getPackageById, findActiveCreditsPackageByTotalCredits } from "@/app/models/package";
import { purchasePackage, renewPackage } from "./packageManager";
import { purchaseCredits } from "./creditManager";
import { handleOrderSession } from "./order";
import { processFirstPurchase } from "./referral";

export enum OrderType {
  Package = 'package',
  Credits = 'credits',
}

export enum OrderStatus {
  Pending = 'pending',
  Processing = 'processing',
  Paid = 'paid',
  Failed = 'failed',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

export interface CreateOrderParams {
  userId: string;
  userEmail: string;
  orderType: OrderType;
  packageId?: string;
  creditAmount?: number;
  paymentMethod?: string;
  couponCode?: string;
  upgradeDiscount?: number; // 升级折扣金额
  renewMonths?: number; // 续费月数(默认1个月)
}

export interface CreateOrderResult {
  success: boolean;
  order?: any;
  paymentUrl?: string;
  error?: string;
}

// 生成订单号
function generateOrderNo(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${year}${month}${day}${Date.now()}${random}`;
}

// 创建订单
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  try {
    const orderNo = generateOrderNo();
    let amount = 0;
    let credits = 0;
    let productName = '';
    let packageSnapshot = null;
    let validDays = 0;
    let currency = process.env.ANTOM_PAYMENT_CURRENCY || 'USD';
    
    // 根据订单类型处理
    if (params.orderType === OrderType.Package) {
      // 套餐订单
      if (!params.packageId) {
        return { success: false, error: 'Package ID is required' };
      }

      const packageInfo = await getPackageById(params.packageId);
      if (!packageInfo) {
        return { success: false, error: 'Package not found' };
      }

      if (!packageInfo.isActive) {
        return { success: false, error: 'Package is not active' };
      }

      // 计算续费金额:如果是续费订单,金额 = 单月价格 * 续费月数
      const renewMonths = params.renewMonths || 1;
      amount = (packageInfo.priceCents / 100) * renewMonths;
      credits = (packageInfo.dailyPoints || 0) * (packageInfo.validDays || 0);
      productName = renewMonths > 1 ? `${packageInfo.name} (${renewMonths} months)` : packageInfo.name;
      validDays = (packageInfo.validDays || 0) * renewMonths;
      currency = packageInfo.currency || process.env.ANTOM_PAYMENT_CURRENCY || 'USD';

      // 创建套餐快照
      packageSnapshot = {
        id: packageInfo.id,
        name: packageInfo.name,
        version: packageInfo.version,
        price: packageInfo.priceCents / 100,
        dailyCredits: packageInfo.dailyPoints,
        validDays: packageInfo.validDays,
        features: packageInfo.features,
        limitations: packageInfo.limitations,
        renewMonths, // 保存续费月数
      };
    } else if (params.orderType === OrderType.Credits) {
      // 积分订单
      // 如果提供了packageId，说明是购买积分套餐
      if (params.packageId) {
        let packageInfo = await getPackageById(params.packageId);
        // 兼容兜底：若通过 ID 未找到，尝试按积分总额匹配一个激活的 credits 套餐
        if (!packageInfo && params.creditAmount && params.creditAmount > 0) {
          packageInfo = await findActiveCreditsPackageByTotalCredits(params.creditAmount);
        }
        if (!packageInfo) {
          return { success: false, error: 'Package not found' };
        }
        
        if (!packageInfo.isActive) {
          return { success: false, error: 'Package is not active' };
        }
        
        if (packageInfo.planType !== 'credits') {
          return { success: false, error: 'Invalid package type for credits order' };
        }
        
        amount = packageInfo.priceCents / 100;
        credits = packageInfo.dailyPoints || 0; // credits 套餐，dailyPoints 表示总积分
        productName = packageInfo.name;
        params.creditAmount = credits; // 设置creditAmount用于后续处理
        currency = packageInfo.currency || process.env.ANTOM_PAYMENT_CURRENCY || 'USD';
        
        // 创建套餐快照
        packageSnapshot = {
          id: packageInfo.id,
          name: packageInfo.name,
          version: packageInfo.version,
          price: packageInfo.priceCents / 100,
          totalCredits: packageInfo.dailyPoints,
          features: packageInfo.features,
        };
      } else if (params.creditAmount && params.creditAmount > 0) {
        // 直接指定积分数量购买（保留旧逻辑）
        credits = params.creditAmount;
        // 计算价格：按现有 credits_v2 比例估算（200 credits = $1）
        // 注意：前端通常会传 packageId，只有在找不到套餐时才会进入此分支
        const priceByUsdRatio = credits / 200; // $1 = 200 credits
        amount = priceByUsdRatio;
        productName = `${credits} 积分`;
        currency = process.env.ANTOM_PAYMENT_CURRENCY || 'USD';
      } else {
        return { success: false, error: 'Credit amount or package ID is required' };
      }
    } else {
      return { success: false, error: 'Invalid order type' };
    }
    
    // 应用折扣
    let discountAmount = 0;

    // 优先使用升级折扣
    if (params.upgradeDiscount && params.upgradeDiscount > 0) {
      discountAmount = params.upgradeDiscount;
    } else if (params.couponCode) {
      // TODO: 实现优惠券验证和计算逻辑
      // discountAmount = await calculateCouponDiscount(params.couponCode, amount);
    }

    // 确保折扣不超过订单金额
    if (discountAmount > amount) {
      discountAmount = amount;
    }
    
    // 计算订单有效期
    const now = new Date();
    const expiredAt = new Date(now.getTime() + 30 * 60 * 1000); // 30分钟后过期
    
    // 套餐起止时间
    let startDate = null;
    let endDate = null;
    if (params.orderType === OrderType.Package && validDays > 0) {
      startDate = now;
      endDate = new Date();
      endDate.setDate(endDate.getDate() + validDays);
    }
    
    // 创建订单
    const orderData = {
      order_no: orderNo,
      created_at: now.toISOString(),
      user_id: params.userId,
      user_email: params.userEmail,
      amount: amount,
      status: OrderStatus.Pending,
      credits: credits,
      currency: currency,
      product_name: productName,
      order_type: params.orderType,
      package_id: params.packageId,
      package_snapshot: packageSnapshot,
      credit_amount: params.orderType === OrderType.Credits ? params.creditAmount : null,
      start_date: startDate,
      end_date: endDate,
      discount_amount: discountAmount,
      coupon_code: params.couponCode,
      payment_method: params.paymentMethod,
      expired_at: expiredAt.toISOString(),
    };
    
    const order = await insertOrder(orderData);
    if (!order) {
      return { success: false, error: 'Failed to create order' };
    }
    
    // TODO: 创建支付会话
    // const paymentUrl = await createPaymentSession(order);
    const paymentUrl = `https://payment.example.com/checkout?order=${orderNo}`;
    
    return {
      success: true,
      order: {
        orderNo: order.order_no,
        orderType: order.order_type,
        amount: order.amount,
        discountAmount: order.discount_amount,
        finalAmount: order.amount - order.discount_amount,
        currency: order.currency,
        status: order.status,
        productName: order.product_name,
        credits: order.credits,
        expiresAt: order.expired_at,
        paymentUrl: paymentUrl,
      },
      paymentUrl,
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: 'Failed to create order' };
  }
}

// 处理支付成功
export async function handlePaymentSuccess(
  orderNo: string,
  paymentDetails: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // 获取订单信息
    const order = await findOrderByOrderNo(orderNo);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    if (order.status !== OrderStatus.Pending && order.status !== OrderStatus.Processing) {
      return { success: false, error: 'Order status is invalid' };
    }
    
    // 更新订单状态
    const paidAt = new Date().toISOString();
    await updateOrderStatus(
      orderNo,
      OrderStatus.Paid,
      paidAt,
      paymentDetails.email || order.user_email,
      JSON.stringify(paymentDetails)
    );

    
    // 根据订单类型处理
    if (order.order_type === OrderType.Package) {
      // 检查套餐ID是否存在
      if (!order.package_id) {
        return { success: false, error: 'Package ID not found in order' };
      }

      // 检查是否为续费订单
      const packageSnapshot = order.package_snapshot || {};
      const renewMonths = packageSnapshot.renewMonths;

      if (renewMonths && renewMonths >= 1) {
        // 续费订单:延长现有套餐
        console.log(`Processing renewal for ${renewMonths} month(s)`);
        const result = await renewPackage(
          order.user_id,
          order.package_id,
          orderNo,
          renewMonths
        );

        if (!result.success) {
          console.error('Failed to renew package:', result.error);
          return { success: false, error: 'Failed to renew package' };
        }
      } else {
        // 首次购买:创建/激活套餐
        console.log('Processing new package purchase');
        const result = await purchasePackage(
          order.user_id,
          order.package_id,
          orderNo
        );

        if (!result.success) {
          console.error('Failed to activate package:', result.error);
          return { success: false, error: 'Failed to activate package' };
        }
      }
    } else if (order.order_type === OrderType.Credits) {
      // 增加积分
      // 使用 credit_amount 或 credits 字段（向后兼容）
      const creditAmount = order.credit_amount || order.credits;

      if (!creditAmount || creditAmount <= 0) {
        console.error('Invalid credit amount in order:', order);
        return { success: false, error: 'Invalid credit amount' };
      }

      const result = await purchaseCredits(
        order.user_id,
        creditAmount,
        orderNo
      );

      if (!result.success) {
        console.error('Failed to add credits:', result.error);
        return { success: false, error: 'Failed to add credits' };
      }
    }
    
    // TODO: 发送订单确认邮件
    // await sendOrderConfirmationEmail(order);
    
    // 推荐计划：首次消费奖励（幂等由内部判定）
    try {
      await processFirstPurchase(order.user_id, orderNo)
    } catch (e) {
      console.error('processFirstPurchase error:', e)
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error handling payment success:', error);
    return { success: false, error: 'Failed to process payment' };
  }
}

// 处理支付失败
export async function handlePaymentFailed(
  orderNo: string,
  reason?: string
): Promise<{ success: boolean }> {
  try {
    const order = await findOrderByOrderNo(orderNo);
    if (!order) {
      return { success: false };
    }
    
    await updateOrderStatus(
      orderNo,
      OrderStatus.Failed,
      new Date().toISOString(),
      order.user_email,
      JSON.stringify({ reason })
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error handling payment failed:', error);
    return { success: false };
  }
}

// 取消订单
export async function cancelOrder(
  orderNo: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await findOrderByOrderNo(orderNo);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    if (order.status === OrderStatus.Paid) {
      return { success: false, error: 'Cannot cancel paid order' };
    }
    
    if (order.status === OrderStatus.Cancelled) {
      return { success: false, error: 'Order already cancelled' };
    }
    
    await updateOrderStatus(
      orderNo,
      OrderStatus.Cancelled,
      new Date().toISOString(),
      order.user_email,
      JSON.stringify({ reason })
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return { success: false, error: 'Failed to cancel order' };
  }
}

// 检查订单是否过期
export async function checkOrderExpiry(orderNo: string): Promise<boolean> {
  try {
    const order = await findOrderByOrderNo(orderNo);
    if (!order) {
      return true;
    }
    
    if (order.status !== OrderStatus.Pending) {
      return false;
    }
    
    const now = new Date();
    const expiredAt = new Date(order.expired_at);
    
    if (now > expiredAt) {
      // 订单已过期，更新状态
      await updateOrderStatus(
        orderNo,
        OrderStatus.Cancelled,
        new Date().toISOString(),
        order.user_email,
        JSON.stringify({ reason: 'Order expired' })
      );
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking order expiry:', error);
    return true;
  }
}

// 批量检查过期订单
export async function batchCheckExpiredOrders(): Promise<number> {
  try {
    // TODO: 实现批量检查逻辑
    // 1. 查询所有pending状态且已过期的订单
    // 2. 批量更新状态为cancelled
    // 3. 返回处理数量
    
    return 0;
  } catch (error) {
    console.error('Error batch checking expired orders:', error);
    return 0;
  }
}

// 计算订单统计
export async function calculateOrderStats(
  userId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalOrders: number;
  totalRevenue: number;
  packageOrders: number;
  creditOrders: number;
  averageOrderValue: number;
}> {
  try {
    // TODO: 实现订单统计逻辑
    // 1. 根据条件查询订单
    // 2. 计算各项统计数据
    // 3. 返回统计结果
    
    return {
      totalOrders: 0,
      totalRevenue: 0,
      packageOrders: 0,
      creditOrders: 0,
      averageOrderValue: 0,
    };
  } catch (error) {
    console.error('Error calculating order stats:', error);
    return {
      totalOrders: 0,
      totalRevenue: 0,
      packageOrders: 0,
      creditOrders: 0,
      averageOrderValue: 0,
    };
  }
}

// Stripe Webhook处理
export async function handleStripeWebhook(event: any): Promise<{ success: boolean }> {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // 支付成功
        await handleOrderSession(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        // 支付失败
        const orderNo = event.data.object.metadata?.order_no;
        if (orderNo) {
          await handlePaymentFailed(orderNo, 'Payment failed');
        }
        break;
      
      case 'customer.subscription.updated':
        // 订阅更新
        // TODO: 处理订阅更新逻辑
        break;
      
      case 'customer.subscription.deleted':
        // 订阅取消
        // TODO: 处理订阅取消逻辑
        break;
      
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return { success: false };
  }
}
