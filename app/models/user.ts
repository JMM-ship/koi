import { User } from "@/app/types/user";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { User as PrismaUser } from "@prisma/client";

// 转换Prisma User到应用User类型
function fromPrismaUser(user: PrismaUser | null): User | undefined {
  if (!user) return undefined;

  return {
    id: user.id,  // 现在id就是UUID
    email: user.email,
    created_at: user.createdAt.toISOString(),
    nickname: user.nickname || undefined,
    avatar_url: user.avatarUrl || undefined,
    locale: user.locale || undefined,
    updated_at: user.updatedAt.toISOString(),
    role: user.role || 'user',
    status: user.status || 'active',
  };
}

// 转换应用User到Prisma创建数据
function toPrismaCreateData(user: Partial<User>) {
  return {
    email: user.email!,
    nickname: user.nickname || null,
    avatarUrl: user.avatar_url || null,
    locale: user.locale || null,
    role: user.role || 'user',
    status: user.status || 'active',
  };
}

export async function insertUser(user: Partial<User>) {
  try {
    const data = await prisma.user.create({
      data: toPrismaCreateData(user),
    });
    return fromPrismaUser(data);
  } catch (error) {
    throw error;
  }
}

export async function findUserByEmail(
  email: string
): Promise<User | undefined> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return fromPrismaUser(user);
  } catch (error) {
    return undefined;
  }
}

export async function findUserById(id: string): Promise<User | undefined> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return fromPrismaUser(user);
  } catch (error) {
    return undefined;
  }
}

// 兼容旧代码：将 findUserByUuid 重定向到 findUserById
export async function findUserByUuid(uuid: string): Promise<User | undefined> {
  return findUserById(uuid);
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

export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });
    return users.map(fromPrismaUser).filter(Boolean) as User[];
  } catch (error) {
    return [];
  }
}

// 兼容旧代码
export async function getUsersByUuids(user_uuids: string[]): Promise<User[]> {
  return getUsersByIds(user_uuids);
}

export async function getUserIdsByEmail(email: string) {
  try {
    const users = await prisma.user.findMany({
      where: { email },
      select: { id: true },
    });
    return users.map((user) => user.id);
  } catch (error) {
    return [];
  }
}

// 兼容旧代码
export async function getUserUuidsByEmail(email: string) {
  return getUserIdsByEmail(email);
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

  try {
    const data = await prisma.user.create({
      data: {
        email,
        nickname,
        role: 'user',
        status: 'active',
        // Note: 密码字段在新架构中移除了，如果需要可以在单独的auth表中管理
      },
    });

    return fromPrismaUser(data) as User;
  } catch (error) {
    throw error;
  }
}

// 新增的辅助函数
export async function updateUser(
  id: string,
  data: Partial<User>
): Promise<User | undefined> {
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        nickname: data.nickname,
        avatarUrl: data.avatar_url,
        locale: data.locale,
        role: data.role,
        status: data.status,
      },
    });
    return fromPrismaUser(updated);
  } catch (error) {
    return undefined;
  }
}

// 以下函数在新架构中已不需要，但为兼容性暂时保留空实现
export async function updateUserInviteCode(user_uuid: string, invite_code: string) {
  // 新架构中没有 inviteCode 字段
  return findUserById(user_uuid);
}

export async function updateUserInvitedBy(user_uuid: string, invited_by: string) {
  // 新架构中没有 invitedBy 字段
  return findUserById(user_uuid);
}

export async function findUserByInviteCode(invite_code: string) {
  // 新架构中没有 inviteCode 字段
  return undefined;
}