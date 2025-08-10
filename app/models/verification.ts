import { prisma } from "./db";
import { getIsoTimestr } from "@/app/lib/time";
import { EmailVerificationCode as PrismaEmailVerificationCode } from "@prisma/client";

export interface EmailVerificationCode {
  id?: number;
  email: string;
  code: string;
  expires_at: string;
  created_at?: string;
  is_used: boolean;
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaVerificationCode(code: PrismaEmailVerificationCode | null): EmailVerificationCode | null {
  if (!code) return null;
  
  return {
    id: code.id,
    email: code.email,
    code: code.code,
    expires_at: code.expiresAt.toISOString(),
    created_at: code.createdAt.toISOString(),
    is_used: code.isUsed,
  };
}

export async function createVerificationCode(
  email: string,
  code: string,
  expiresInMinutes: number = 10
): Promise<EmailVerificationCode> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);
  
  try {
    const data = await prisma.emailVerificationCode.create({
      data: {
        email,
        code,
        expiresAt,
        isUsed: false,
      },
    });
    
    return fromPrismaVerificationCode(data)!;
  } catch (error) {
    throw error;
  }
}

export async function findVerificationCode(
  email: string,
  code: string
): Promise<EmailVerificationCode | null> {
  try {
    const data = await prisma.emailVerificationCode.findFirst({
      where: {
        email,
        code,
        isUsed: false,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return fromPrismaVerificationCode(data);
  } catch (error) {
    return null;
  }
}

export async function markCodeAsUsed(id: number): Promise<void> {
  try {
    await prisma.emailVerificationCode.update({
      where: { id },
      data: { isUsed: true },
    });
  } catch (error) {
    throw error;
  }
}

export async function getLatestVerificationCode(
  email: string
): Promise<EmailVerificationCode | null> {
  try {
    const data = await prisma.emailVerificationCode.findFirst({
      where: { email },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return fromPrismaVerificationCode(data);
  } catch (error) {
    return null;
  }
}

export async function cleanExpiredCodes(): Promise<void> {
  try {
    await prisma.emailVerificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    throw error;
  }
}