import { NextRequest, NextResponse } from 'next/server';
import { getPackageById } from '@/app/models/package';

// GET /api/packages/:id - 获取套餐详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packageId = params.id;
    
    if (!packageId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Package ID is required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // 获取套餐详情
    const packageInfo = await getPackageById(packageId);
    
    if (!packageInfo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_NOT_FOUND',
            message: 'Package not found',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: packageInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting package details:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to get package details',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}