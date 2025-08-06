import { NextResponse } from 'next/server';
import { createUserWithPassword, findUserByEmail } from '@/app/models/user';
import { increaseCredits } from '@/app/service/credit';
import { CreditsAmount, CreditsTransType } from '@/app/service/credit';
import { getOneYearLaterTimestr } from '@/app/lib/time';
import { findVerificationCode, markCodeAsUsed } from '@/app/models/verification';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, email, password, verificationCode } = body;

    // 验证输入
    if (!username || !email || !password || !verificationCode) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 验证邮箱验证码
    const verification = await findVerificationCode(email, verificationCode);
    if (!verification) {
      return NextResponse.json(
        { error: '验证码无效或已过期' },
        { status: 400 }
      );
    }

    // 检查验证码是否已过期
    const expiresAt = new Date(verification.expires_at);
    const now = new Date();

    // 调试日志
    console.log('验证码验证:', {
      expires_at: verification.expires_at,
      expiresAt: expiresAt.toISOString(),
      now: now.toISOString(),
      isExpired: now > expiresAt,
      timeDiff: (expiresAt - now) / 1000 / 60 // 分钟差
    });

    if (now > expiresAt) {
      return NextResponse.json(
        { error: '验证码已过期' },
        { status: 400 }
      );
    }

    // 验证用户名长度
    if (username.length < 3) {
      return NextResponse.json(
        { error: '用户名至少需要 3 个字符' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 8) {
      return NextResponse.json(
        { error: '密码至少需要 8 个字符' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已被注册
    const existingUser = await findUserByEmail(email, "credentials");
    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 创建新用户
    const newUser = await createUserWithPassword(email, password, username);

    // 标记验证码为已使用
    if (verification.id) {
      await markCodeAsUsed(verification.id);
    }

    // 给新用户分配初始积分
    await increaseCredits({
      user_uuid: newUser.uuid,
      trans_type: CreditsTransType.NewUser,
      credits: CreditsAmount.NewUserGet,
      expired_at: getOneYearLaterTimestr(),
    });

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        uuid: newUser.uuid,
        email: newUser.email,
        nickname: newUser.nickname,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    // 处理数据库错误
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '注册时发生错误，请稍后重试' },
      { status: 500 }
    );
  }
}