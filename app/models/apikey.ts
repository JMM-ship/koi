import { prisma } from "@/app/models/db";
import { ApiKey as PrismaApiKey } from "@prisma/client";

export enum ApikeyStatus {
  Created = "created",
  Deleted = "deleted",
}

// 转换函数：将应用层数据转换为Prisma格式
function toPrismaApiKey(apikey: any): any {
  return {
    keyHash: apikey.api_key,
    prefix: apikey.api_key ? apikey.api_key.substring(0, 7) : '',
    name: apikey.title || null,
    ownerUserId: apikey.user_uuid,
    status: apikey.status || 'active',
  };
}

// 转换函数：将Prisma数据转换为应用层格式
function fromPrismaApiKey(apikey: PrismaApiKey | null): any | undefined {
  if (!apikey) return undefined;

  return {
    id: apikey.id,
    api_key: apikey.keyHash,
    title: apikey.name,
    user_uuid: apikey.ownerUserId,
    created_at: apikey.createdAt.toISOString(),
    status: apikey.status,
  };
}

export async function insertApikey(apikey: any) {
  try {
    const data = await prisma.apiKey.create({
      data: toPrismaApiKey(apikey),
    });
    return fromPrismaApiKey(data);
  } catch (error) {
    throw error;
  }
}

export async function getUserApikeys(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<any[] | undefined> {
  const offset = (page - 1) * limit;

  try {
    const apikeys = await prisma.apiKey.findMany({
      where: {
        ownerUserId: user_uuid,
        NOT: {
          status: ApikeyStatus.Deleted,
        },
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return apikeys.map(fromPrismaApiKey);
  } catch (error) {
    return undefined;
  }
}

export async function getUserUuidByApiKey(
  apiKey: string
): Promise<string | undefined> {
  try {
    const data = await prisma.apiKey.findFirst({
      where: {
        keyHash: apiKey,
        status: 'active',
      },
      select: {
        ownerUserId: true,
      },
    });
    return data?.ownerUserId;
  } catch (error) {
    return undefined;
  }
}