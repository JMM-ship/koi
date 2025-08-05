import { NextResponse } from 'next/server';
import { findVerificationCode, markCodeAsUsed } from '@/models/verification';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // 验证输入
    if (!email || !code) {
      return NextResponse.json(
        { error: '请提供邮箱和验证码' },
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

    // 验证验证码格式（6位数字）
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: '验证码格式错误' },
        { status: 400 }
      );
    }

    // 检查频率限制
    const rateLimit = checkRateLimit(`verify-code:${email}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: `验证失败次数过多，请 ${rateLimit.resetInSeconds} 秒后再试`,
          resetInSeconds: rateLimit.resetInSeconds
        },
        { status: 429 }
      );
    }

    // 查找验证码
    const verificationCode = await findVerificationCode(email, code);
    
    if (!verificationCode) {
      return NextResponse.json(
        { error: '验证码无效或已过期' },
        { status: 400 }
      );
    }

    // 检查验证码是否已过期
    const expiresAt = new Date(verificationCode.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: '验证码已过期' },
        { status: 400 }
      );
    }

    // 标记验证码为已使用
    if (verificationCode.id) {
      await markCodeAsUsed(verificationCode.id);
    }

    return NextResponse.json({
      success: true,
      message: '验证码验证成功',
      email: email
    });

  } catch (error) {
    console.error('验证码校验错误:', error);
    return NextResponse.json(
      { error: '验证码校验时发生错误，请稍后重试' },
      { status: 500 }
    );
  }
}