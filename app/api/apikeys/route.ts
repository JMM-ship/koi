import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getMockAuth } from '@/lib/auth-mock';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

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

    // 生成新的 API 密钥
    const newApiKey = generateApiKey();
    const prefix = newApiKey.substring(0, 7); // 前缀用于快速查找

    // 保存到数据库
    const apiKey = await prisma.apiKey.create({
      data: {
        keyHash: newApiKey,
        prefix: prefix,
        name: title || 'My API Key',
        ownerUserId: userId,
        status: 'active'
      }
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        title: apiKey.name || 'My API Key',
        apiKey: newApiKey, // 创建时返回完整密钥
        createdAt: apiKey.createdAt,
        status: apiKey.status
      },
      message: 'API key created successfully. Please save it securely as it won\'t be shown again.'
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
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