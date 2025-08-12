import { User } from "@/app/types/user";
import { getIsoTimestr } from "@/app/lib/time";
import { prisma } from "./db";
import { getUuid } from "@/app/lib/hash";
import bcrypt from "bcryptjs";
import { User as PrismaUser } from "@prisma/client";

// 转换Prisma User到应用User类型
function toPrismaUser(user: User): any {
  return {
    uuid: user.uuid,
    email: user.email,
    nickname: user.nickname || null,
    avatarUrl: user.avatar_url || null,
    locale: user.locale || null,
    signinType: user.signin_type || null,
    signinIp: user.signin_ip || null,
    signinProvider: user.signin_provider || null,
    signinOpenid: user.signin_openid || null,
    inviteCode: user.invite_code || '',
    invitedBy: user.invited_by || '',
    isAffiliate: user.is_affiliate || false,
    password: user.password || null,
  };
}

// 转换Prisma User到应用User类型
function fromPrismaUser(user: PrismaUser | null): User | undefined {
  if (!user) return undefined;
  
  return {
    id: user.id,
    uuid: user.uuid,
    email: user.email,
    created_at: user.createdAt.toISOString(),
    nickname: user.nickname || undefined,
    avatar_url: user.avatarUrl || undefined,
    locale: user.locale || undefined,
    signin_type: user.signinType || undefined,
    signin_ip: user.signinIp || undefined,
    signin_provider: user.signinProvider || undefined,
    signin_openid: user.signinOpenid || undefined,
    invite_code: user.inviteCode || undefined,
    updated_at: user.updatedAt.toISOString(),
    invited_by: user.invitedBy || undefined,
    is_affiliate: user.isAffiliate || undefined,
    password: user.password || undefined,
    role: user.role || 'user',
    status: user.status || 'active',
    planType: user.planType || 'free',
    planExpiredAt: user.planExpiredAt?.toISOString() || undefined,
    totalCredits: user.totalCredits || 0,
  };
}

export async function insertUser(user: User) {
  try {
    const data = await prisma.user.create({
      data: toPrismaUser(user),
    });
    return fromPrismaUser(data);
  } catch (error) {
    throw error;
  }
}

export async function findUserByEmail(
  email: string,
  provider?: string
): Promise<User | undefined> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        ...(provider && { signinProvider: provider }),
      },
    });
    return fromPrismaUser(user);
  } catch (error) {
    return undefined;
  }
}

export async function findUserByUuid(uuid: string): Promise<User | undefined> {
  try {
    const user = await prisma.user.findUnique({
      where: { uuid },
    });
    return fromPrismaUser(user);
  } catch (error) {
    return undefined;
  }
}

export async function getUsers(
  page: number = 1,
  limit: number = 50
): Promise<User[] | undefined> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 50;

  const offset = (page - 1) * limit;

  try {
    const users = await prisma.user.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return users.map(fromPrismaUser).filter(Boolean) as User[];
  } catch (error) {
    return undefined;
  }
}

export async function updateUserInviteCode(
  user_uuid: string,
  invite_code: string
) {
  try {
    const data = await prisma.user.update({
      where: { uuid: user_uuid },
      data: {
        inviteCode: invite_code,
        updatedAt: new Date(),
      },
    });
    return fromPrismaUser(data);
  } catch (error) {
    throw error;
  }
}

export async function updateUserInvitedBy(
  user_uuid: string,
  invited_by: string
) {
  try {
    const data = await prisma.user.update({
      where: { uuid: user_uuid },
      data: {
        invitedBy: invited_by,
        updatedAt: new Date(),
      },
    });
    return fromPrismaUser(data);
  } catch (error) {
    throw error;
  }
}

export async function getUsersByUuids(user_uuids: string[]): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        uuid: {
          in: user_uuids,
        },
      },
    });
    return users.map(fromPrismaUser).filter(Boolean) as User[];
  } catch (error) {
    return [];
  }
}

export async function findUserByInviteCode(invite_code: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { inviteCode: invite_code },
    });
    return fromPrismaUser(user);
  } catch (error) {
    return undefined;
  }
}

export async function getUserUuidsByEmail(email: string) {
  try {
    const users = await prisma.user.findMany({
      where: { email },
      select: { uuid: true },
    });
    return users.map((user) => user.uuid);
  } catch (error) {
    return [];
  }
}

export async function getUsersTotal(): Promise<number | undefined> {
  try {
    const count = await prisma.user.count();
    return count;
  } catch (error) {
    return undefined;
  }
}

export async function getUserCountByDate(
  startTime: string
): Promise<Map<string, number> | undefined> {
  try {
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(startTime),
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date in memory
    const dateCountMap = new Map<string, number>();
    users.forEach((item) => {
      const date = item.createdAt.toISOString().split("T")[0];
      dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
    });

    return dateCountMap;
  } catch (error) {
    return undefined;
  }
}

export async function createUserWithPassword(
  email: string,
  password: string,
  nickname: string
): Promise<User> {
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = {
    uuid: getUuid(),
    email,
    password: hashedPassword,
    nickname,
    signinProvider: "credentials",
    signinType: "credentials",
    inviteCode: '',
    invitedBy: '',
    isAffiliate: false,
  };
  
  try {
    const data = await prisma.user.create({
      data: newUser,
    });
    
    return fromPrismaUser(data) as User;
  } catch (error) {
    throw error;
  }
}