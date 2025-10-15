const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查项列表
const checks = [];
let passedChecks = 0;
let failedChecks = 0;

// 添加检查项
function addCheck(name, fn) {
  checks.push({ name, fn });
}

// 执行检查
async function runCheck(check) {
  try {
    log(`\n🔍 检查: ${check.name}`, 'blue');
    const result = await check.fn();
    if (result.success) {
      log(`   ✅ ${result.message}`, 'green');
      passedChecks++;
    } else {
      log(`   ❌ ${result.message}`, 'red');
      failedChecks++;
    }
    return result;
  } catch (error) {
    log(`   ❌ 错误: ${error.message}`, 'red');
    failedChecks++;
    return { success: false, error: error.message };
  }
}

// 1. 检查 TypeScript 编译
addCheck('TypeScript 编译', async () => {
  try {
    await execAsync('npx tsc --noEmit');
    return { success: true, message: 'TypeScript 编译成功，没有类型错误' };
  } catch (error) {
    const errorLines = error.stdout.split('\n').slice(0, 5).join('\n');
    return { success: false, message: `TypeScript 编译失败:\n${errorLines}` };
  }
});

// 2. 检查 Prisma Client 生成
addCheck('Prisma Client', async () => {
  const clientPath = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');
  if (fs.existsSync(clientPath)) {
    // 检查是否包含新的模型
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // 检查新模型是否存在
      const hasWallet = typeof prisma.wallet !== 'undefined';
      const hasUser = typeof prisma.user !== 'undefined';
      const hasOrder = typeof prisma.order !== 'undefined';

      await prisma.$disconnect();

      if (hasWallet && hasUser && hasOrder) {
        return { success: true, message: 'Prisma Client 已生成，包含新的数据模型' };
      } else {
        return { success: false, message: 'Prisma Client 缺少某些模型' };
      }
    } catch (error) {
      return { success: false, message: `Prisma Client 检查失败: ${error.message}` };
    }
  } else {
    return { success: false, message: 'Prisma Client 未生成' };
  }
});

// 3. 检查数据库连接
addCheck('数据库连接', async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // 尝试查询数据库
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();

    return { success: true, message: 'PostgreSQL (Supabase) 数据库连接成功' };
  } catch (error) {
    return { success: false, message: `数据库连接失败: ${error.message}` };
  }
});

// 4. 检查关键模型文件
addCheck('模型文件更新', () => {
  const modelFiles = [
    'app/models/user.ts',
    'app/models/creditBalance.ts',
    'app/types/user.ts',
  ];

  const issues = [];

  for (const file of modelFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      issues.push(`文件不存在: ${file}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // 检查是否还有旧的字段引用
    if (content.includes('userUuid') && !file.includes('types')) {
      issues.push(`${file} 仍包含 userUuid`);
    }
    if (content.includes('user.uuid') && !file.includes('types')) {
      issues.push(`${file} 仍包含 user.uuid`);
    }
  }

  if (issues.length === 0) {
    return { success: true, message: '所有模型文件已正确更新' };
  } else {
    return { success: false, message: `发现问题:\n   ${issues.join('\n   ')}` };
  }
});

// 5. 检查环境变量
addCheck('环境变量配置', () => {
  const required = ['DATABASE_URL', 'DIRECT_URL'];
  const missing = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length === 0) {
    // 检查是否是 PostgreSQL 连接字符串
    if (process.env.DATABASE_URL.includes('postgresql://')) {
      return { success: true, message: '环境变量已正确配置为 PostgreSQL' };
    } else {
      return { success: false, message: 'DATABASE_URL 不是 PostgreSQL 连接字符串' };
    }
  } else {
    return { success: false, message: `缺少环境变量: ${missing.join(', ')}` };
  }
});

// 6. 测试基本 CRUD 操作
addCheck('数据库 CRUD 操作', async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // 创建测试用户
    const testEmail = `test_${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        nickname: 'Test User',
        role: 'user',
        status: 'active',
      },
    });

    // 验证用户创建
    if (!user.id || typeof user.id !== 'string') {
      return { success: false, message: '用户ID应该是UUID字符串' };
    }

    // 查询用户
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) {
      return { success: false, message: '无法查询到创建的用户' };
    }

    // 删除测试用户
    await prisma.user.delete({
      where: { id: user.id },
    });

    await prisma.$disconnect();

    return { success: true, message: 'CRUD 操作测试成功' };
  } catch (error) {
    return { success: false, message: `CRUD 操作失败: ${error.message}` };
  }
});

// 7. 检查备份文件
addCheck('备份文件', () => {
  const backupFiles = [];
  const dirs = ['app/service', 'app/models', 'app/api', 'lib', 'scripts'];

  for (const dir of dirs) {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath, { recursive: true });
      const backups = files.filter(f => f.toString().endsWith('.backup'));
      backupFiles.push(...backups);
    }
  }

  if (backupFiles.length > 0) {
    return {
      success: true,
      message: `找到 ${backupFiles.length} 个备份文件（可用于回滚）`
    };
  } else {
    return {
      success: true,
      message: '没有备份文件（可能是首次迁移）'
    };
  }
});

// 主函数
async function main() {
  console.log('');
  log('=' .repeat(60), 'blue');
  log('       🚀 PostgreSQL 迁移验证工具', 'blue');
  log('=' .repeat(60), 'blue');

  // 加载环境变量
  require('dotenv').config();

  // 执行所有检查
  for (const check of checks) {
    await runCheck(check);
  }

  // 输出总结
  console.log('');
  log('=' .repeat(60), 'blue');
  log('📊 验证结果总结', 'blue');
  log('=' .repeat(60), 'blue');

  log(`✅ 通过的检查: ${passedChecks}`, 'green');
  log(`❌ 失败的检查: ${failedChecks}`, 'red');

  if (failedChecks === 0) {
    console.log('');
    log('🎉 恭喜！数据库迁移成功完成！', 'green');
    log('=' .repeat(60), 'green');
    console.log('');
    log('✨ 下一步建议：', 'yellow');
    log('1. 运行开发服务器测试: npm run dev', 'yellow');
    log('2. 测试主要功能：用户注册、登录、积分等', 'yellow');
    log('3. 如果一切正常，可以删除 .backup 文件', 'yellow');
  } else {
    console.log('');
    log('⚠️  迁移验证未完全通过', 'red');
    log('=' .repeat(60), 'red');
    console.log('');
    log('🔧 修复建议：', 'yellow');
    log('1. 检查上面失败的项目', 'yellow');
    log('2. 运行 npx tsc --noEmit 查看详细的类型错误', 'yellow');
    log('3. 确保 .env 文件包含正确的 PostgreSQL 连接字符串', 'yellow');
    log('4. 如需回滚，可以从 .backup 文件恢复', 'yellow');
  }

  process.exit(failedChecks > 0 ? 1 : 0);
}

// 运行验证
main().catch(error => {
  log(`致命错误: ${error.message}`, 'red');
  process.exit(1);
});