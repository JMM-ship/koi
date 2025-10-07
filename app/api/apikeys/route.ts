import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getMockAuth } from '@/lib/auth-mock';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { decryptApiKey } from '@/app/lib/crypto';

// 生成 API 密钥
function generateApiKey(): string {
  const prefix = 'sk-';
  const randomBytes = crypto.randomBytes(32).toString('base64url');
  return `${prefix}${randomBytes}`;
}

// 获取用户的 API 密钥列表
export async function GET(request: Request) {
  try {
    // 获取当前用户
    let user = await getAuth(request);
    if (!user && process.env.NODE_ENV === 'development') {
      user = await getMockAuth();
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取用户ID
    const userId = user.uuid;

    // 获取用户的 API 密钥
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        ownerUserId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 格式化返回数据，解密真实密钥
    const formattedKeys = apiKeys.map((key: any) => {
      let actualKey = key.keyHash; // 默认使用哈希值（如果解密失败）

      try {
        // 从 meta 中获取加密的 key 并解密
        const meta = (key.meta || {}) as any;
        const encryptedKey: string | undefined = meta?.key_encrypted || meta?.keyEncrypted;

        if (encryptedKey) {
          // 解密获取真实的 key
          actualKey = decryptApiKey(encryptedKey, key.id);
        }
      } catch (err) {
        console.error(`Failed to decrypt key ${key.id}:`, err);
        // 解密失败时使用哈希值
      }
      console.log('actualKey', actualKey,key.id);
      
      return {
        id: key.id,
        title: key.name || 'Untitled Key',
        apiKey: maskApiKey(actualKey), // 默认隐藏大部分密钥
        fullKey: actualKey, // 完整的真实密钥
        createdAt: key.createdAt,
        status: key.status || 'active'
      };
    });

    return NextResponse.json({ apiKeys: formattedKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

function hashApiKey(rawKey: string): string {
  const pepper = process.env.ENCRYPTION_KEY || ''
  return crypto.createHash('sha256').update(rawKey + pepper).digest('hex')
  }

  // 创建新的 API 密钥
  export async function POST(request: Request) {
  try {
  // 1) 获取当前用户
  let user = await getAuth(request)
  if (!user && process.env.NODE_ENV === 'development') {
  user = await getMockAuth()
  }
  if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

      const body = await request.json()
      const { title } = body
      const userId = user.uuid

      // 2) 每用户限制一个激活中的密钥
      const existingKey = await prisma.apiKey.findFirst({
        where: { ownerUserId: userId, status: 'active' }
      })
      if (existingKey) {
        return NextResponse.json(
          { error: 'You already have an active API key. Please delete it before creating a new one.' },
          { status: 400 }
        )
      }

      // 3) 领取一个未分配的活动密钥
      const availableKey = await prisma.apiKey.findFirst({
        where: { ownerUserId: null, status: 'active' }
      })
      if (!availableKey) {
        return NextResponse.json(
          { error: 'No available API keys. Please contact support.' },
          { status: 503 }
        )
      }
      console.log('availableKey', availableKey);
      
      // 4) 从 meta 中取加密串并解密（AAD 使用 key 的 id）
      const meta = (availableKey.meta || {}) as any
      const encryptedKey: string | undefined = meta?.key_encrypted || meta?.keyEncrypted
      if (!encryptedKey) {
        return NextResponse.json(
          { error: 'Invalid API key configuration: missing encrypted key. Please contact support.' },
          { status: 500 }
        )
      }

      let actualKey: string
      try {
        actualKey = decryptApiKey(encryptedKey, availableKey.id)
      } catch (err) {
        return NextResponse.json(
          { error: 'Failed to decrypt API key. Please contact support.' },
          { status: 500 }
        )
      }

      // 5) 一致性校验：解密出的明文应匹配数据库中的哈希与前缀
      const computedHash = hashApiKey(actualKey)
      if (availableKey.keyHash && availableKey.keyHash !== computedHash) {
        return NextResponse.json(
          { error: 'Key integrity check failed. Please contact support.' },
          { status: 500 }
        )
      }
      if (availableKey.prefix && !actualKey.startsWith(availableKey.prefix)) {
        return NextResponse.json(
          { error: 'Key prefix mismatch. Please contact support.' },
          { status: 500 }
        )
      }

      // 6) 抢占归属（并发安全）：只更新 ownerUserId 和 name，不要修改 keyHash/prefix
      const updated = await prisma.apiKey.updateMany({
        where: { id: availableKey.id, ownerUserId: null, status: 'active' },
        data: {
          ownerUserId: userId,
          name: title || 'My API Key'
        }
      })
      console.log('updated', updated,userId,availableKey.id);
      
      if (updated.count === 0) {
        return NextResponse.json(
          { error: 'The API key was assigned to another user. Please try again.' },
          { status: 409 }
        )
      }

      // 7) 返回给用户一次性展示的明文 key（不持久化明文）
      const result = await prisma.apiKey.findUnique({ where: { id: availableKey.id } })
      if (!result) {
        return NextResponse.json(
          { error: 'Failed to retrieve the assigned API key.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        apiKey: {
          id: result.id,
          title: result.name || 'My API Key',
          apiKey: maskApiKey(actualKey), // 隐藏版本
          fullKey: actualKey, // 完整的真实 key（只在创建时返回一次）
          createdAt: result.createdAt,
          status: result.status
        },
        message: "API key created successfully. Please save it securely as it won't be shown again."
      })

  } catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Failed to create API key'
  return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
  }

// 删除 API 密钥
export async function DELETE(request: Request) {
  try {
    // 获取当前用户
    let user = await getAuth(request);
    if (!user && process.env.NODE_ENV === 'development') {
      user = await getMockAuth();
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    // 获取用户ID
    const userId = user.uuid;

    // 验证密钥属于当前用户
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        ownerUserId: userId
      }
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // 删除密钥（软删除，更新状态为 deleted）
    await prisma.apiKey.update({
      where: {
        id: keyId
      },
      data: {
        status: 'deleted'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

// 隐藏 API 密钥的中间部分
function maskApiKey(key: string): string {
  if (key.length <= 10) return key;
  const start = key.substring(0, 7);
  const end = key.substring(key.length - 4);
  return `${start}...${end}`;
}