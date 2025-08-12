import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth/helpers";

/**
 * 检查用户是否为管理员
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === 'admin';
}

/**
 * 管理员权限中间件
 * 用于保护管理员API路由
 */
export function withAdminAuth(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    const session = await auth();
    
    // 检查是否登录
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }
    
    // 检查是否为管理员
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden - Admin access required',
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }
    
    // 执行实际的处理函数
    return handler(req, context);
  };
}

/**
 * 获取当前管理员信息
 */
export async function getAdminUser() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    return null;
  }
  
  return {
    uuid: session.user.uuid,
    email: session.user.email,
    nickname: session.user.nickname,
    role: session.user.role,
  };
}