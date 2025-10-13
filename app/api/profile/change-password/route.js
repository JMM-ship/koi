import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth/config";
import { findUserByEmail } from "@/app/models/user";
import { prisma } from "@/app/models/db";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic'

// POST /api/profile/change-password - 修改密码
export async function POST(request) {
  try {
    // 获取当前登录用户
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 获取请求数据
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // 验证输入
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All password fields are required" },
        { status: 400 }
      );
    }

    // 验证新密码和确认密码是否一致
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirm password do not match" },
        { status: 400 }
      );
    }

    // 验证新密码强度
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // 验证新密码不能与当前密码相同
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password cannot be the same as current password" },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await findUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 如果用户是通过OAuth登录的，可能没有密码
    if (!user.password) {
      return NextResponse.json(
        { error: "Cannot change password for OAuth users" },
        { status: 400 }
      );
    }

    // 验证当前密码是否正确
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.user.update({
      where: { uuid: user.uuid },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}