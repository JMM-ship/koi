import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/auth/config';
import { useCredits } from '@/annotation/service/creditManager';

// POST /api/credits/use/test - Test endpoint to consume credits
export async function POST(request: NextRequest) {
  try {
    // Verify user login
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

    // Parse request body
    const body = await request.json();
    const { amount = 100 } = body; // Default to 100 credits

    // Validate amount
    if (!amount || amount <= 0 || amount > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Invalid credit amount (1-10000)',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Consume credits
    const result = await useCredits(
      session.user.uuid,
      amount,
      'Test Service',
      {
        testType: 'manual',
        testTime: new Date().toISOString(),
        description: 'Manual credit consumption test',
      }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREDIT_USE_FAILED',
            message: result.error || 'Failed to consume credits',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        amountUsed: amount,
        balance: result.balance,
        transaction: result.transaction,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in test credit consumption:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process test credit consumption',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}