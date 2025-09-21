// EmailVerificationCode 功能在新数据库架构中已被移除
// 此文件保留为存根以避免破坏可能的依赖

export interface EmailVerificationCode {
  id?: number;
  email: string;
  code: string;
  expires_at: string;
  created_at?: string;
  updated_at?: string;
}

// 插入验证码
export async function insertEmailVerificationCode(
  data: EmailVerificationCode
): Promise<EmailVerificationCode | undefined> {
  console.warn('Email verification feature is disabled in the new database architecture');
  return undefined;
}

// 根据邮箱和验证码查找
export async function findEmailVerificationCodeByEmailAndCode(
  email: string,
  code: string
): Promise<EmailVerificationCode | undefined> {
  console.warn('Email verification feature is disabled in the new database architecture');
  return undefined;
}

// 删除过期的验证码
export async function deleteExpiredEmailVerificationCodes(): Promise<number> {
  console.warn('Email verification feature is disabled in the new database architecture');
  return 0;
}

// 生成6位数字验证码
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 创建验证码过期时间
export function createExpiryTime(minutesFromNow: number = 10): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutesFromNow);
  return now.toISOString();
}