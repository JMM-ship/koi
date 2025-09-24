import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { EmailVerificationCode as PrismaEmailVerificationCode } from "@prisma/client";

// 更新接口定义以匹配数据库模型
export interface EmailVerificationCode {
  id?: string;  // 改为 string (UUID)
  email: string;
  code: string;
  expiresAt: string;  // 改为 expiresAt
  createdAt?: string;  // 改为 createdAt
  isUsed?: boolean;  // 添加 isUsed 字段
}

// 转换 Prisma 模型到应用接口
function fromPrismaVerificationCode(record: PrismaEmailVerificationCode | null): EmailVerificationCode | undefined {
  if (!record) return undefined;

  return {
    id: record.id,
    email: record.email,
    code: record.code,
    expiresAt: record.expiresAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    isUsed: record.isUsed,
  };
}

// 转换应用接口到 Prisma 创建数据
function toPrismaCreateData(data: EmailVerificationCode) {
  return {
    email: data.email,
    code: data.code,
    expiresAt: new Date(data.expiresAt),
    isUsed: data.isUsed || false,
  };
}

// 根据邮箱查找最新验证码
export async function findLatestEmailVerificationCode(
  email: string
): Promise<EmailVerificationCode | undefined> {
  try {
    const record = await prisma.emailVerificationCode.findFirst({
      where: { 
        email,
        isUsed: false,  // 只查找未使用的验证码
      },
      orderBy: {
        createdAt: 'desc',  // 按创建时间降序排列，获取最新的
      },
    });
    
    return fromPrismaVerificationCode(record);
  } catch (err) {
    console.error("Failed to find latest verification code:", err);
    return undefined;
  }
}

// 创建验证码（带哈希）
export async function createVerificationCode(
  email: string,code: string
): Promise<{ plainCode: string } | undefined> {
  try {
    // const plainCode = generateVerificationCode(); // 生成6位数验证码
    // const hashedCode = await bcrypt.hash(plainCode, 10); // bcrypt哈希

    const record: EmailVerificationCode = {
      email,
      code,
      expiresAt: createExpiryTime(10), // 10分钟有效
      isUsed: false,
    };

    await insertEmailVerificationCode(record);

    return 
  } catch (err) {
    console.error("Failed to create verification code:", err);
    return undefined;
  }
}

// 获取最新验证码（根据 email）
export async function getLatestVerificationCode(
  email: string
): Promise<EmailVerificationCode | undefined> {
  try {
    const latest = await findLatestEmailVerificationCode(email);
    return latest ?? undefined;
  } catch (err) {
    console.error("Failed to get latest verification code:", err);
    return undefined;
  }
}

// 插入验证码
export async function insertEmailVerificationCode(
  data: EmailVerificationCode
): Promise<EmailVerificationCode | undefined> {
  try {
    const record = await prisma.emailVerificationCode.create({
      data: toPrismaCreateData(data),
    });
    return fromPrismaVerificationCode(record);
  } catch (err) {
    console.error("Failed to insert verification code:", err);
    return undefined;
  }
}

// 根据邮箱和验证码查找
export async function findEmailVerificationCodeByEmailAndCode(
  email: string,
  code: string
): Promise<EmailVerificationCode | undefined> {
  try {
    const record = await prisma.emailVerificationCode.findFirst({
      where: {
        email,
        code,
        isUsed: false,  // 只查找未使用的验证码
        expiresAt: {
          gt: new Date(),  // 验证码未过期
        },
      },
      orderBy: {
        createdAt: 'desc',  // 获取最新的匹配记录
      },
    });
    
    return fromPrismaVerificationCode(record);
  } catch (err) {
    console.error("Failed to find verification code by email and code:", err);
    return undefined;
  }
}

// 标记验证码为已使用
export async function markVerificationCodeAsUsed(
  id: string
): Promise<boolean> {
  try {
    await prisma.emailVerificationCode.update({
      where: { id },
      data: { isUsed: true },
    });
    return true;
  } catch (err) {
    console.error("Failed to mark verification code as used:", err);
    return false;
  }
}

// 删除过期的验证码
export async function deleteExpiredEmailVerificationCodes(): Promise<number> {
  try {
    const result = await prisma.emailVerificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),  // 删除已过期的验证码
        },
      },
    });
    return result.count;
  } catch (err) {
    console.error("Failed to delete expired verification codes:", err);
    return 0;
  }
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