import { NextResponse } from 'next/server';
import { createVerificationCode, getLatestVerificationCode } from '@/models/verification';
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    // 验证邮箱格式
    if (!email) {
      return NextResponse.json(
        { error: '请提供邮箱地址' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 检查发送频率限制（60秒内只能发送一次）
    const latestCode = await getLatestVerificationCode(email);
    if (latestCode) {
      const createdAt = new Date(latestCode.created_at);
      const now = new Date();
      const diffInSeconds = (now - createdAt) / 1000;
      
      if (diffInSeconds < 60) {
        const remainingSeconds = Math.ceil(60 - diffInSeconds);
        return NextResponse.json(
          { 
            error: `请稍候 ${remainingSeconds} 秒后再试`,
            remainingSeconds 
          },
          { status: 429 }
        );
      }
    }

    // 生成验证码
    const code = generateVerificationCode();

    // 保存验证码到数据库
    try {
      await createVerificationCode(email, code);
    } catch (dbError) {
      console.error('保存验证码失败:', dbError);
      return NextResponse.json(
        { error: '保存验证码失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 发送邮件
    const emailResult = await sendVerificationEmail(email, code);
    
    if (!emailResult.success) {
      return NextResponse.json(
        { error: '发送邮件失败，请检查邮箱地址或稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '验证码已发送到您的邮箱',
      expiresInMinutes: 10
    });

  } catch (error) {
    console.error('发送验证码错误:', error);
    return NextResponse.json(
      { error: '发送验证码时发生错误，请稍后重试' },
      { status: 500 }
    );
  }
}