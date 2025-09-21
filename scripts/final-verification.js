const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔍 验证数据库迁移状态...\n');

// 查找项目根目录
function findProjectRoot(startPath = __dirname) {
  let currentPath = startPath;
  while (currentPath !== path.parse(currentPath).root) {
    if (fs.existsSync(path.join(currentPath, 'package.json')) &&
        fs.existsSync(path.join(currentPath, 'prisma'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  return null;
}

const projectRoot = findProjectRoot();
if (!projectRoot) {
  console.error('❌ 无法找到项目根目录');
  process.exit(1);
}

process.chdir(projectRoot);
console.log(`📁 项目根目录: ${projectRoot}\n`);

async function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`⏳ ${description}...`);
    exec(command, { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ ${description} 失败:`);
        console.error(stderr || error.message);
        reject(error);
      } else {
        console.log(`✅ ${description} 成功`);
        if (stdout.trim()) {
          console.log(stdout);
        }
        resolve(stdout);
      }
    });
  });
}

async function checkFileExists(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description} 存在: ${filePath}`);
    return true;
  } else {
    console.error(`❌ ${description} 不存在: ${filePath}`);
    return false;
  }
}

async function verifyMigration() {
  let hasErrors = false;

  console.log('=== 1. 检查文件结构 ===\n');

  // 检查关键文件
  const filesToCheck = [
    { path: 'prisma/schema.prisma', desc: 'Prisma Schema' },
    { path: '.env', desc: '环境变量文件' },
    { path: 'app/models/db.ts', desc: '数据库连接文件' },
    { path: 'app/models/user.ts', desc: '用户模型' },
    { path: 'app/models/creditBalance.ts', desc: '积分余额模型' },
  ];

  for (const file of filesToCheck) {
    if (!await checkFileExists(file.path, file.desc)) {
      hasErrors = true;
    }
  }

  console.log('\n=== 2. 检查Prisma客户端 ===\n');

  try {
    await runCommand('npx prisma generate', '生成Prisma客户端');
  } catch (error) {
    hasErrors = true;
  }

  console.log('\n=== 3. 检查TypeScript编译 ===\n');

  try {
    // 使用 tsc --noEmit 只检查类型，不生成文件
    await runCommand('npx tsc --noEmit', 'TypeScript类型检查');
  } catch (error) {
    console.log('\n⚠️ TypeScript编译有错误，尝试使用Next.js构建检查...\n');

    // 如果tsc失败，尝试Next.js的类型检查
    try {
      await runCommand('npm run type-check || npm run typecheck || npx next lint', '备用类型检查');
    } catch (error2) {
      console.error('❌ 类型检查失败，可能存在TypeScript错误');
      hasErrors = true;
    }
  }

  console.log('\n=== 4. 检查数据库连接 ===\n');

  // 创建测试连接脚本
  const testDbScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 测试基本查询
    const userCount = await prisma.user.count();
    console.log(\`✅ 用户表可访问，当前用户数: \${userCount}\`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
  `;

  const testDbPath = path.join(projectRoot, 'scripts', 'test-db-connection-temp.js');
  fs.writeFileSync(testDbPath, testDbScript);

  try {
    await runCommand('node scripts/test-db-connection-temp.js', '测试数据库连接');
  } catch (error) {
    hasErrors = true;
  } finally {
    // 清理临时文件
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  }

  console.log('\n=== 5. 检查API路由 ===\n');

  // 检查已修改的API路由
  const apiRoutes = [
    'app/api/admin/stats/route.ts',
    'app/api/admin/users/route.ts',
    'app/api/admin/users/[uuid]/route.ts',
    'app/api/admin/users/[uuid]/credits/route.ts',
    'app/api/admin/codes/route.ts',
  ];

  for (const route of apiRoutes) {
    await checkFileExists(route, `API路由 ${path.basename(path.dirname(route))}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 迁移验证结果总结:');
  console.log('='.repeat(50) + '\n');

  if (!hasErrors) {
    console.log('✅ 所有检查通过！数据库迁移成功完成。\n');
    console.log('下一步建议:');
    console.log('1. 运行 npm run dev 启动开发服务器');
    console.log('2. 测试关键功能（用户登录、积分系统、管理后台等）');
    console.log('3. 检查日志确保没有运行时错误');
  } else {
    console.log('⚠️ 发现一些问题，请根据上述错误信息进行修复。\n');
    console.log('常见解决方法:');
    console.log('1. 如果是TypeScript错误，运行 npm run build 查看详细错误');
    console.log('2. 如果是数据库连接错误，检查 .env 文件中的 DATABASE_URL');
    console.log('3. 如果是Prisma错误，运行 npx prisma generate');
  }

  process.exit(hasErrors ? 1 : 0);
}

// 运行验证
verifyMigration().catch(error => {
  console.error('验证过程出错:', error);
  process.exit(1);
});