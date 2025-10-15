import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/auth/config';
import { prisma } from '@/app/models/db';
import { manualResetCredits } from '@/app/service/creditRecoveryService';

function isSameUtcDay(a?: Date | null, b?: Date | null) {
  if (!a || !b) return false;
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function nextUtcMidnight(from = new Date()): string {
  const ts = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 1, 0, 0, 0, 0));
  return ts.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.uuid && !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' }, timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const userId = session.user.uuid || session.user.id!;

    const now = new Date();
    // 解析活跃套餐，以便获取 manualResetPerDay
    const activePackage = await prisma.userPackage.findFirst({
      where: { userId, isActive: true, endAt: { gte: now } },
      orderBy: { endAt: 'desc' },
      include: { package: true },
    });

    if (!activePackage) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ACTIVE_PACKAGE', message: 'No active package found' }, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const snapshot: any = (activePackage as any).packageSnapshot || {};
    const snapshotFeatures: any = snapshot.features || {};
    const pkgFeatures: any = (activePackage as any).package?.features || {};

    const manualResetPerDay: number = Number(
      snapshotFeatures.manualResetPerDay ?? pkgFeatures.manualResetPerDay ?? 1
    );

    // 执行手动重置
    const result = await manualResetCredits(userId);

    // 读取最新钱包，计算剩余次数和下次可用时间
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    const resetsToday = isSameUtcDay(wallet?.manualResetAt || null, now) ? (wallet?.manualResetCount || 0) : 0;
    const resetsRemainingToday = Math.max(0, manualResetPerDay - resetsToday);
    const nextAvailableAtUtc = resetsRemainingToday > 0 ? now.toISOString() : nextUtcMidnight(now);

    if (!result.success) {
      const code = result.code || 'MANUAL_RESET_FAILED';
      return NextResponse.json(
        {
          success: false,
          error: { code, message: code },
          resetsRemainingToday,
          nextAvailableAtUtc,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          resetAmount: result.resetAmount,
          newBalance: result.newBalance,
          resetsRemainingToday,
          nextAvailableAtUtc,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in manual reset API:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to manual reset credits' }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

