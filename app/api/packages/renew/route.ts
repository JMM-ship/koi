import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/auth/config';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.uuid) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Unauthorized' }
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { months } = body;

    if (!months || months < 1 || months > 12) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid renewal period. Please select between 1 and 12 months.' }
        },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    console.log(userId,"sssdsdsa");
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'User ID not found' }
        },
        { status: 401 }
      );
    }

    // Get the user's current active package
    const currentPackage = await prisma.userPackage.findFirst({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        endAt: 'desc'
      }
    });

    if (!currentPackage) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'No active package found to renew' }
        },
        { status: 404 }
      );
    }

    // Calculate new end date
    const currentEndDate = new Date(currentPackage.endAt);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);

    // Update the package end date
    const updatedPackage = await prisma.userPackage.update({
      where: {
        id: currentPackage.id
      },
      data: {
        endAt: newEndDate,
        updatedAt: new Date()
      }
    });

    // Log the renewal transaction
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'income',
        bucket: 'package',
        tokens: 0,
        points: 0,
        beforePackageTokens: BigInt(0),
        afterPackageTokens: BigInt(0),
        beforeIndependentTokens: BigInt(0),
        afterIndependentTokens: BigInt(0),
        reason: `Package renewed for ${months} month(s)`,
        meta: {
          action: 'renew',
          months: months,
          packageId: currentPackage.packageId
        },
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        package: {
          id: updatedPackage.id,
          packageId: updatedPackage.packageId,
          startDate: updatedPackage.startAt,
          endDate: updatedPackage.endAt,
          dailyCredits: updatedPackage.dailyPoints,
          isActive: updatedPackage.isActive,
          renewedMonths: months
        },
        message: `Package renewed successfully for ${months} month(s)`
      }
    });

  } catch (error) {
    console.error('Package renewal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to renew package',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}