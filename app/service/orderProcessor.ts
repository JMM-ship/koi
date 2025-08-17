import { insertOrder, updateOrderStatus, findOrderByOrderNo } from "@/app/models/order";
import { getPackageById } from "@/app/models/package";
import { purchasePackage, renewPackage } from "./packageManager";
import { purchaseCredits } from "./creditManager";
import { handleOrderSession } from "./order";

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
  userUuid: string;
  userEmail: string;
  orderType: OrderType;
  packageId?: string;
  creditAmount?: number;
  paymentMethod?: string;
  couponCode?: string;
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
      
      if (!packageInfo.is_active) {
        return { success: false, error: 'Package is not active' };
      }
      
      amount = packageInfo.price;
      credits = packageInfo.daily_credits * packageInfo.valid_days; // 总积分数
      productName = packageInfo.name;
      validDays = packageInfo.valid_days;
      
      // 创建套餐快照
      packageSnapshot = {
        id: packageInfo.id,
        name: packageInfo.name,
        version: packageInfo.version,
        price: packageInfo.price,
        originalPrice: packageInfo.original_price,
        dailyCredits: packageInfo.daily_credits,
        validDays: packageInfo.valid_days,
        features: packageInfo.features,
        limitations: packageInfo.limitations,
      };
    } else if (params.orderType === OrderType.Credits) {
      // 积分订单
      // 如果提供了packageId，说明是购买积分套餐
      if (params.packageId) {
        const packageInfo = await getPackageById(params.packageId);
        if (!packageInfo) {
          return { success: false, error: 'Package not found' };
        }
        
        if (!packageInfo.is_active) {
          return { success: false, error: 'Package is not active' };
        }
        
        if (packageInfo.plan_type !== 'credits') {
          return { success: false, error: 'Invalid package type for credits order' };
        }
        
        amount = packageInfo.price;
        credits = packageInfo.daily_credits; // 对于积分套餐，daily_credits存储的是总积分数
        productName = packageInfo.name;
        params.creditAmount = credits; // 设置creditAmount用于后续处理
        
        // 创建套餐快照
        packageSnapshot = {
          id: packageInfo.id,
          name: packageInfo.name,
          version: packageInfo.version,
          price: packageInfo.price,
          originalPrice: packageInfo.original_price,
          totalCredits: packageInfo.daily_credits,
          features: packageInfo.features,
        };
      } else if (params.creditAmount && params.creditAmount > 0) {
        // 直接指定积分数量购买（保留旧逻辑）
        credits = params.creditAmount;
        // 计算价格（示例：1积分 = 0.01元）
        amount = Math.round(credits * 1); // 1积分 = 1分钱
        productName = `${credits} 积分`;
      } else {
        return { success: false, error: 'Credit amount or package ID is required' };
      }
    } else {
      return { success: false, error: 'Invalid order type' };
    }
    
    // 应用优惠券（如果有）
    let discountAmount = 0;
    if (params.couponCode) {
      // TODO: 实现优惠券验证和计算逻辑
      // discountAmount = await calculateCouponDiscount(params.couponCode, amount);
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
      user_uuid: params.userUuid,
      user_email: params.userEmail,
      amount: amount,
      status: OrderStatus.Pending,
      credits: credits,
      currency: 'CNY',
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

      
      // 激活套餐
      const result = await purchasePackage(
        order.user_uuid,
        order.package_id,
        orderNo
      );
      
      if (!result.success) {
        // 如果激活失败，需要处理退款逻辑
        console.error('Failed to activate package:', result.error);
        return { success: false, error: 'Failed to activate package' };
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
        order.user_uuid,
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
    
    // TODO: 处理推广佣金
    // await processAffiliateCommission(order);
    
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
  userUuid?: string,
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