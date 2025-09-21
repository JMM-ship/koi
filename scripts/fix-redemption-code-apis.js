const fs = require('fs');
const path = require('path');

console.log('🔧 处理 RedemptionCode 相关API...\n');

// 需要处理的文件
const filesToHandle = [
  'app/api/admin/codes/route.ts',
  'app/api/admin/codes/[code]/route.ts',
  'app/api/admin/codes/generate/route.ts',
  'app/api/redeem/route.ts',
  'app/api/admin/codes/batch/[batchId]/route.ts',
];

// 创建临时禁用的响应
const disabledResponse = `import { NextRequest, NextResponse } from "next/server";

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
`;

// 处理每个文件
filesToHandle.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (fs.existsSync(fullPath)) {
    // 创建备份
    const backupPath = `${fullPath}.redemption-backup`;
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(fullPath, backupPath);
      console.log(`✅ 创建备份: ${path.basename(backupPath)}`);
    }

    // 替换内容
    fs.writeFileSync(fullPath, disabledResponse);
    console.log(`✅ 禁用API: ${filePath}`);
  } else {
    console.log(`⚠️  文件不存在: ${filePath}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('📌 RedemptionCode API 已禁用');
console.log('='.repeat(60));
console.log('\n说明：');
console.log('1. RedemptionCode（卡密）功能在新的PostgreSQL架构中不存在');
console.log('2. 所有相关API已返回501状态（功能未实现）');
console.log('3. 原文件已备份为 .redemption-backup');
console.log('\n如需恢复此功能，有两个选项：');
console.log('选项1: 在 prisma/schema.prisma 中添加 RedemptionCode 模型');
console.log('选项2: 从备份文件恢复并迁移到新的实现方式');