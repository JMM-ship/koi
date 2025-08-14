import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth/helpers";
import { findUserByEmail } from "@/app/models/user";

/**
 * GET /api/auth/refresh-session
 * 刷新用户 session，获取最新的角色信息
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 从数据库获取最新的用户信息
    const user = await findUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 返回最新的用户信息
    return NextResponse.json({
      success: true,
      user: {
        uuid: user.uuid,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        status: user.status,
        planType: user.planType,
        totalCredits: user.totalCredits,
      },
      message: 'Session refreshed. Please refresh the page to apply changes.'
    });
  } catch (error) {
    console.error('Failed to refresh session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh session' },
      { status: 500 }
    );
  }
}