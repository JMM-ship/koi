import { NextResponse } from 'next/server';
import { createVerificationCode, getLatestVerificationCode } from '@/app/models/verification';
import { sendVerificationEmail } from '@/app/lib/email';

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email format
    if (!email) {
      return NextResponse.json(
        { error: "Please provide an email address" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Check rate limit (allow only once per 60 seconds)
    const latestCode = await getLatestVerificationCode(email);
    if (latestCode) {
      const createdAt = new Date(latestCode.created_at);
      const now = new Date();
      const diffInSeconds = (now - createdAt) / 1000;

      if (diffInSeconds < 60) {
        const remainingSeconds = Math.ceil(60 - diffInSeconds);
        return NextResponse.json(
          { error: `Please wait ${remainingSeconds} seconds before trying again`, remainingSeconds },
          { status: 429 }
        );
      }
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Save code to database
    try {
      await createVerificationCode(email, code);
    } catch (dbError) {
      console.error("Failed to save verification code:", dbError);
      return NextResponse.json(
        { error: "Failed to save verification code, please try again later" },
        { status: 500 }
      );
    }

    // Send email
    const emailResult = await
      fetch('http://38.60.223.56/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          code: code
        })
      }).then(res => res.json());
    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send email, please check the address or try again later" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code has been sent to your email",
      expiresInMinutes: 10,
    });
  } catch (error) {
    console.error("Error while sending verification code:", error);
    return NextResponse.json(
      { error: "An error occurred while sending the verification code, please try again later" },
      { status: 500 }
    );
  }
}