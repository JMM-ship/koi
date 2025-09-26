import { NextResponse } from 'next/server';
import { createUserWithPassword, findUserByEmail } from '@/app/models/user';
import { CreditsAmount } from '@/app/service/credit';
import { findEmailVerificationCodeByEmailAndCode, markVerificationCodeAsUsed } from '@/app/models/verification';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, email, password, verificationCode } = body;

    // Validate input
    if (!username || !email || !password || !verificationCode) {
      return NextResponse.json(
        { error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // Verify email verification code
    const verification = await findEmailVerificationCodeByEmailAndCode(email, verificationCode);
    if (!verification) {
      return NextResponse.json(
        { error: 'The verification code is invalid or has expired.' },
        { status: 400 }
      );
    }

    // Check if the code has expired
    const expiresAt = new Date(verification.expiresAt);
    const now = new Date();

    // Debug log
    console.log('Verification code check:', {
      expiresAt: verification.expiresAt,
      expiresAtIso: expiresAt.toISOString(),
      now: now.toISOString(),
      isExpired: now > expiresAt,
      timeDiffMinutes: (expiresAt - now) / 1000 / 60
    });

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'The verification code has expired.' },
        { status: 400 }
      );
    }

    // Validate username length
    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(email, "credentials");
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email address has already been registered.' },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = await createUserWithPassword(email, password, username);

    // Mark the verification code as used
    if (verification.id) {
      await markVerificationCodeAsUsed(verification.id);
    }

    // Grant initial credits to the new user using new wallet system
    try {
      const { addIndependentCredits } = await import("@/app/models/creditBalance");
      await addIndependentCredits(newUser.id, CreditsAmount.NewUserGet);

      // Create credit transaction record
      const { createCreditTransaction, TransactionType, CreditType } = await import("@/app/models/creditTransaction");
      await createCreditTransaction({
        user_id: newUser.id,
        type: TransactionType.Income,
        credit_type: CreditType.Independent,
        amount: CreditsAmount.NewUserGet,
        before_balance: 0,
        after_balance: CreditsAmount.NewUserGet,
        description: '新用户注册奖励',
        metadata: {
          source: 'email_registration',
          email: newUser.email,
        },
      });
    } catch (creditError) {
      console.error("Failed to grant initial credits to new user:", creditError);
      // Continue with registration, don't block user creation
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Registration successful.',
      user: {
        uuid: newUser.id, // 使用id字段
        email: newUser.email,
        nickname: newUser.nickname,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle database unique constraint error
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { error: 'This email address has already been registered.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again later.' },
      { status: 500 }
    );
  }
}