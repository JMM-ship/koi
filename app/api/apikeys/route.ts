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

    // 格式化返回数据，隐藏部分密钥
    const formattedKeys = apiKeys.map((key: any) => ({
      id: key.id,
      title: key.name || 'Untitled Key',
      apiKey: maskApiKey(key.keyHash), // 默认隐藏大部分密钥
      fullKey: key.keyHash, // 完整密钥（前端控制显示）
      createdAt: key.createdAt,
      status: key.status || 'active'
    }));

    return NextResponse.json({ apiKeys: formattedKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// 创建新的 API 密钥
export async function POST(request: Request) {
  try {
    // 获取当前用户
    let user = await getAuth(request);
    
    if (!user && process.env.NODE_ENV === 'development') {
      user = await getMockAuth();
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    // 获取用户ID
    const userId = user.uuid;

    // 检查用户是否已有 API 密钥（每用户限制一个）
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        ownerUserId: userId,
        status: 'active'
      }
    });

    if (existingKey) {
      return NextResponse.json(
        { error: 'You already have an active API key. Please delete it before creating a new one.' },
        { status: 400 }
      );
    }

    // 从数据库中获取一个可用的 API 密钥
    // 查找一个未分配的活动 API 密钥
    const availableKey = await prisma.apiKey.findFirst({
      where: {
        ownerUserId: null,
        status: 'active'
      }
    });

    if (!availableKey) {
      return NextResponse.json(
        { error: 'No available API keys. Please contact support.' },
        { status: 503 }
      );
    }

    // 从 meta.key_encrypted 中获取加密的 key 值
    const meta = availableKey.meta as any;
    const encryptedKey = meta?.key_encrypted;

    if (!encryptedKey) {
      return NextResponse.json(
        { error: 'Invalid API key configuration: missing encrypted key. Please contact support.' },
        { status: 500 }
      );
    }

    // 解密 API 密钥
    let actualKey: string;
    try {
      // 调试：打印加密数据的信息
      console.log('Encrypted key format:', {
        encrypted: encryptedKey,
        keyId: availableKey.id,
        encryptedLength: encryptedKey?.length,
        encryptedType: typeof encryptedKey
      });

      // 使用 API key ID 作为 AAD（附加认证数据）
      actualKey = decryptApiKey(encryptedKey, availableKey.id);
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      console.error('Encrypted key was:', encryptedKey);
      return NextResponse.json(
        { error: 'Failed to decrypt API key. Please contact support.' },
        { status: 500 }
      );
    }

    // 更新密钥，分配给当前用户（使用 where 条件确保并发安全）
    const updatedKey = await prisma.apiKey.updateMany({
      where: {
        id: availableKey.id,
        ownerUserId: null, // 确保只有在还未分配时才更新
        status: 'active'
      },
      data: {
        ownerUserId: userId,
        name: title || 'My API Key',
        keyHash: actualKey, // 更新 keyHash 为实际的 key 值
        prefix: actualKey.substring(0, 7) // 更新前缀
      }
    });

    // 检查是否成功更新（如果 count 为 0，说明该 key 已被其他请求占用）
    if (updatedKey.count === 0) {
      return NextResponse.json(
        { error: 'The API key was assigned to another user. Please try again.' },
        { status: 409 }
      );
    }

    // 重新获取更新后的完整记录
    const result = await prisma.apiKey.findUnique({
      where: { id: availableKey.id }
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to retrieve the assigned API key.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      apiKey: {
        id: result.id,
        title: result.name || 'My API Key',
        apiKey: actualKey, // 创建时返回完整密钥
        createdAt: result.createdAt,
        status: result.status
      },
      message: 'API key created successfully. Please save it securely as it won\'t be shown again.'
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create API key';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
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