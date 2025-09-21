import { NextRequest, NextResponse } from "next/server";

/**
 * RedemptionCode 功能在新数据库架构中暂时禁用
 * 如需恢复此功能，请在 prisma/schema.prisma 中添加 RedemptionCode 模型
 */

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      error: "RedemptionCode feature is temporarily disabled in the new database architecture",
      message: "卡密功能在新数据库架构中暂时禁用"
    },
    { status: 501 }
  );
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: "RedemptionCode feature is temporarily disabled",
      message: "卡密功能在新数据库架构中暂时禁用"
    },
    { status: 501 }
  );
}

export async function PUT(req: NextRequest) {
  return NextResponse.json(
    {
      error: "RedemptionCode feature is temporarily disabled",
      message: "卡密功能在新数据库架构中暂时禁用"
    },
    { status: 501 }
  );
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json(
    {
      error: "RedemptionCode feature is temporarily disabled",
      message: "卡密功能在新数据库架构中暂时禁用"
    },
    { status: 501 }
  );
}
