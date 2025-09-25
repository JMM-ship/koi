import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth/config";
import { findUserByEmail } from "@/app/models/user";
import { prisma } from "@/app/models/db";

// POST /api/profile/update - 更新用户个人信息
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
    const { nickname, avatarUrl } = body;

    // 验证输入
    if (!nickname || nickname.trim() === "") {
      return NextResponse.json(
        { error: "Nickname is required" },
        { status: 400 }
      );
    }

    // 昵称长度限制
    if (nickname.length > 50) {
      return NextResponse.json(
        { error: "Nickname is too long (max 50 characters)" },
        { status: 400 }
      );
    }

    // 验证头像URL格式（如果提供）
    if (avatarUrl && avatarUrl !== "") {
      try {
        new URL(avatarUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid avatar URL format" },
          { status: 400 }
        );
      }
    }

    // 查找用户
    const user = await findUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        nickname: nickname.trim(),
        avatarUrl: avatarUrl || null,
        updatedAt: new Date(),
      },
    });

    // 返回更新后的用户信息
    return NextResponse.json({
      success: true,
      data: {
        uuid: updatedUser.id,
        email: updatedUser.email,
        nickname: updatedUser.nickname,
        avatarUrl: updatedUser.avatarUrl,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}