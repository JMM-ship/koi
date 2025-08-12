import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth/config";
import { findUserByEmail } from "@/app/models/user";

// GET /api/profile - 获取用户个人信息
export async function GET(request) {
  try {
    // 获取当前登录用户
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 从数据库获取用户信息
    const user = await findUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 返回用户信息（不包含密码）
    const profileData = {
      uuid: user.uuid,
      email: user.email,
      nickname: user.nickname || user.email.split('@')[0],
      avatarUrl: user.avatar_url || session.user.image || null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}