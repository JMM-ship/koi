import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createOrder, OrderType } from '@/app/service/orderProcessor';

// POST /api/orders/create - 创建订单
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await getServerSession();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    
    // 解析请求体
    const body = await request.json();
    const {
      orderType,
      packageId,
      creditAmount,
      paymentMethod = 'stripe',
      couponCode,
    } = body;
    
    // 验证参数
    if (!orderType || !Object.values(OrderType).includes(orderType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Invalid order type',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    if (orderType === OrderType.Package && !packageId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Package ID is required for package orders',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    if (orderType === OrderType.Credits && (!creditAmount || creditAmount <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Valid credit amount is required for credit orders',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // 创建订单
    const result = await createOrder({
      userUuid: session.user.id,
      userEmail: session.user.email,
      orderType,
      packageId,
      creditAmount,
      paymentMethod,
      couponCode,
    });
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_CREATE_FAILED',
            message: result.error || 'Failed to create order',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        order: result.order,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create order',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}