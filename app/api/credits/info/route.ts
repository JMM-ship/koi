import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/auth/config';
import { prisma } from '@/app/models/db';

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

// GET /api/credits/info
export async function GET(request: NextRequest) {
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

    // 读取钱包
    const wallet = await prisma.wallet.findUnique({ where: { userId } });

    // 读取活跃套餐，解析 features
    const activePackage = await prisma.userPackage.findFirst({
      where: { userId, isActive: true, endAt: { gte: now } },
      orderBy: { endAt: 'desc' },
      include: { package: true },
    });

    const snapshot: any = (activePackage as any)?.packageSnapshot || {};
    const snapshotFeatures: any = snapshot.features || {};
    const pkgFeatures: any = (activePackage as any)?.package?.features || {};

    const creditCap: number = Number(snapshotFeatures.creditCap ?? pkgFeatures.creditCap ?? activePackage?.dailyPoints ?? 0);
    const recoveryRate: number = Number(snapshotFeatures.recoveryRate ?? pkgFeatures.recoveryRate ?? 0);
    const dailyUsageLimit: number = Number(snapshotFeatures.dailyUsageLimit ?? pkgFeatures.dailyUsageLimit ?? 999999);
    const manualResetPerDay: number = Number(snapshotFeatures.manualResetPerDay ?? pkgFeatures.manualResetPerDay ?? 1);

    const packageTokensRemaining = Number(wallet?.packageTokensRemaining ?? BigInt(0));
    const independentTokens = Number(wallet?.independentTokens ?? BigInt(0));
    const totalAvailable = packageTokensRemaining + independentTokens;

    const dailyUsageCount = isSameUtcDay(wallet?.dailyUsageResetAt || null, now)
      ? Number(wallet?.dailyUsageCount ?? BigInt(0))
      : 0;

    const resetsToday = isSameUtcDay(wallet?.manualResetAt || null, now) ? (wallet?.manualResetCount || 0) : 0;
    const resetsRemainingToday = Math.max(0, manualResetPerDay - resetsToday);

    return NextResponse.json(
      {
        success: true,
        data: {
          balance: {
            packageTokensRemaining,
            independentTokens,
            totalAvailable,
          },
          packageConfig: {
            creditCap,
            recoveryRate,
            dailyUsageLimit,
            manualResetPerDay,
          },
          usage: {
            dailyUsageCount,
            dailyUsageLimit,
            resetsRemainingToday,
            nextResetAtUtc: nextUtcMidnight(now),
            lastRecoveryAt: wallet?.lastRecoveryAt ? wallet!.lastRecoveryAt.toISOString() : null,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in credits info API:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get credits info' }, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
