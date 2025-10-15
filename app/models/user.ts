import { User } from "@/app/types/user";
import { prisma, dbRouter } from "./db";
import bcrypt from "bcryptjs";
import { User as PrismaUser } from "@prisma/client";

// ====== 转换函数 ======

// PrismaUser -> 应用 User
function fromPrismaUser(user: PrismaUser | null): User | undefined {
  if (!user) return undefined;

  return {
    id: user.id,
    email: user.email,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
    password:user.password || undefined,
    nickname: user.nickname || undefined,
    avatar_url: user.avatarUrl || undefined,
    locale: user.locale || undefined,
    role: user.role || "user",
    status: user.status || "active",
  };
}

// 应用 User -> Prisma 创建数据
function toPrismaCreateData(user: Partial<User>) {
  return {
    email: user.email!,
    nickname: user.nickname || null,
    avatarUrl: user.avatar_url || null,
    locale: user.locale || null,
    role: user.role || "user",
    status: user.status || "active",
  };
}

// ====== CRUD 函数 ======

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

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const user = await prisma.user.findFirst({ where: { email } });
 
  
  return fromPrismaUser(user);
}

export async function findUserById(id: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { id } });
  return fromPrismaUser(user);
}

// ====== 分页/批量查询 ======

export async function getUsers(page = 1, limit = 50): Promise<User[]> {
  const offset = (page - 1) * limit;
  // 使用副本库 - 列表查询允许轻微延迟
  const users = await dbRouter.read.user.findMany({
    skip: offset,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return users.map(fromPrismaUser).filter(Boolean) as User[];
}

export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  });
  return users.map(fromPrismaUser).filter(Boolean) as User[];
}

// ====== 统计 ======

export async function getUsersTotal(): Promise<number> {
  // 使用副本库 - 统计查询允许轻微延迟
  return dbRouter.read.user.count();
}

export async function getUserCountByDate(startTime: string): Promise<Map<string, number>> {
  // 使用副本库 - 统计查询允许轻微延迟
  const users = await dbRouter.read.user.findMany({
    where: { createdAt: { gte: new Date(startTime) } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, number>();
  users.forEach(u => {
    const date = u.createdAt.toISOString().split("T")[0];
    map.set(date, (map.get(date) || 0) + 1);
  });
  return map;
}

// ====== 创建用户（带密码） ======

export async function createUserWithPassword(
  email: string,
  password: string,
  nickname?: string
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const data = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      nickname: nickname || null,
      role: "user",
      status: "active",
    },
  });
  return fromPrismaUser(data);
}

// ====== 更新用户 ======

export async function updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
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
}
