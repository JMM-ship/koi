import nodemailer from 'nodemailer';

let transporter = null;

export function getEmailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // 增加超时时间
      connectionTimeout: 60000, // 60秒
      socketTimeout: 60000, // 60秒
      // 添加调试选项
      logger: true,
      debug: true,
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

export async function sendVerificationEmail(to, code) {
  const transporter = getEmailTransporter();

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'KOI'}" <${process.env.SMTP_USER || 'noreply@koi.com'}>`,
    to: to,
    subject: 'Email Verification Code - KOI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p style="color: #666; font-size: 16px;">Hello,</p>
        <p style="color: #666; font-size: 16px;">
          You are registering for a KOI account. Please use the following verification code to complete your registration:
        </p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">
          This code is valid for 10 minutes. If you did not request this code, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated message. Please do not reply.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('发送邮件失败:', error);
    return { success: false, error: error.message };
  }
}

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}