import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/auth/config';
import { handlePaymentSuccess } from '@/app/service/orderProcessor';

// POST /api/orders/pay/mock - 模拟支付成功（开发环境使用）
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.uuid) {
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
    const { orderNo, paymentDetails } = body;
    
    // 验证参数
    if (!orderNo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Order number is required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // 模拟支付详情
    const mockPaymentDetails = {
      method: paymentDetails?.method || 'mock',
      transactionId: paymentDetails?.transactionId || 'mock_' + Date.now(),
      paidAt: paymentDetails?.paidAt || new Date().toISOString(),
      email: session.user.email,
      mockPayment: true,
      // 添加模拟支付的标记
      metadata: {
        environment: 'development',
        userId: session.user.uuid || session.user.id,
        ...paymentDetails
      }
    };
    
    // 处理支付成功
    const result = await handlePaymentSuccess(orderNo, mockPaymentDetails);
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_PROCESS_FAILED',
            message: result.error || 'Failed to process payment',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        orderNo,
        status: 'paid',
        message: 'Payment processed successfully (mock)',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing mock payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process mock payment',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}