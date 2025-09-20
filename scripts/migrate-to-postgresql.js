const fs = require('fs');
const path = require('path');

// 自动查找项目根目录
function findProjectRoot() {
  let currentDir = __dirname;

  // 向上查找包含 package.json 的目录
  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.join(currentDir, 'package.json')) &&
        fs.existsSync(path.join(currentDir, 'prisma'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // 如果找不到，使用脚本所在目录的父目录
  return path.dirname(__dirname);
}

const projectRoot = findProjectRoot();
console.log('🔍 项目根目录:', projectRoot);
console.log('🔍 当前工作目录:', process.cwd());

// 需要替换的字段映射
const replacements = [
  // 用户相关
  { from: /userUuid/g, to: 'userId' },
  { from: /user_uuid/g, to: 'user_id' },
  { from: /user\.uuid/g, to: 'user.id' },
  { from: /where:\s*{\s*uuid:\s*/g, to: 'where: { id: ' },
  { from: /apiKey\.userUuid/g, to: 'apiKey.ownerUserId' },

  // Prisma查询相关
  { from: /findUnique\(\s*{\s*where:\s*{\s*uuid:/g, to: 'findUnique({ where: { id:' },
  { from: /findFirst\(\s*{\s*where:\s*{\s*uuid:/g, to: 'findFirst({ where: { id:' },
  { from: /update\(\s*{\s*where:\s*{\s*uuid:/g, to: 'update({ where: { id:' },
  { from: /delete\(\s*{\s*where:\s*{\s*uuid:/g, to: 'delete({ where: { id:' },

  // 保留uuid字段的兼容性（在User类型中）
  // 注意：不替换 'uuid:' 在数据结构定义中的情况
];

// 需要处理的文件列表
const filesToProcess = [
  // Service files
  'app/service/creditManager.ts',
  'app/service/orderProcessor.ts',
  'app/service/packageManager.ts',
  'app/service/creditResetService.ts',
  'app/service/user.ts',

  // Model files
  'app/models/order.ts',
  'app/models/creditBalance.ts',
  'app/models/creditTransaction.ts',
  'app/models/userPackage.ts',
  'app/models/package.ts',

  // API routes
  'app/api/credits/balance/route.ts',
  'app/api/credits/use/route.ts',
  'app/api/credits/check-reset/route.ts',
  'app/api/orders/create/route.ts',
  'app/api/orders/pay/mock/route.ts',
  'app/api/packages/route.ts',
  'app/api/packages/renew/route.ts',
  'app/api/packages/credits/route.ts',
  'app/api/apikeys/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/admin/credits/reset/route.ts',
  'app/api/dashboard/route.ts',
  'app/api/dashboard/consumption-trends/route.ts',
  'app/api/dashboard/model-usage/route.ts',

  // Auth files
  'app/auth/config.ts',
  'lib/auth.ts',
  'lib/auth-mock.ts',
  'lib/auth-utils.ts',

  // Test scripts
  'scripts/test-purchase.js',
  'scripts/test-credit-purchase.js',
  'scripts/test-complete-purchase.js',
  'scripts/reset-credits.ts',
  'scripts/seed-dashboard.ts',
  'scripts/test-apikey.ts',
];

function processFile(filePath) {
  // 使用项目根目录构建完整路径
  const fullPath = path.join(projectRoot, filePath);

  console.log(`\n📝 处理文件: ${filePath}`);
  console.log(`   完整路径: ${fullPath}`);

  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  文件不存在，跳过`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  let changeCount = 0;

  replacements.forEach(({ from, to }) => {
    const originalContent = content;
    content = content.replace(from, (match) => {
      changeCount++;
      return typeof to === 'string' ? to : to(match);
    });
    if (originalContent !== content) {
      modified = true;
    }
  });

  if (modified) {
    // 创建备份
    const backupPath = `${fullPath}.backup`;
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, fs.readFileSync(fullPath, 'utf8'));
      console.log(`   💾 已创建备份: ${path.basename(backupPath)}`);
    }

    // 写入修改后的内容
    fs.writeFileSync(fullPath, content);
    console.log(`   ✅ 已更新 (${changeCount} 处修改)`);
  } else {
    console.log(`   ⏭️  无需更新`);
  }
}

// 检查是否在正确的目录
function checkEnvironment() {
  const requiredDirs = ['app', 'prisma', 'scripts', 'lib'];
  const missingDirs = [];

  requiredDirs.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    if (!fs.existsSync(dirPath)) {
      missingDirs.push(dir);
    }
  });

  if (missingDirs.length > 0) {
    console.log('❌ 错误：找不到必需的目录:', missingDirs.join(', '));
    console.log('   请确保在项目根目录运行此脚本');
    return false;
  }

  return true;
}

console.log('🚀 开始迁移到 PostgreSQL...\n');

if (!checkEnvironment()) {
  console.log('\n❌ 环境检查失败，退出脚本');
  process.exit(1);
}

console.log('✅ 环境检查通过\n');
console.log('开始处理文件...\n');

let processedCount = 0;
let errorCount = 0;

filesToProcess.forEach(file => {
  try {
    processFile(file);
    processedCount++;
  } catch (error) {
    errorCount++;
    console.error(`❌ 处理失败 ${file}: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 迁移统计：');
console.log(`   ✅ 成功处理: ${processedCount} 个文件`);
console.log(`   ❌ 处理失败: ${errorCount} 个文件`);
console.log('='.repeat(60));

console.log('\n✨ 迁移脚本执行完成！\n');
console.log('📋 后续步骤：');
console.log('1. 检查生成的 .backup 文件以确保更改正确');
console.log('2. 运行 TypeScript 编译检查: npx tsc --noEmit');
console.log('3. 测试关键功能是否正常');
console.log('4. 如需回滚，可以从 .backup 文件恢复');
console.log('\n💡 提示：如果需要回滚某个文件，运行：');
console.log('   copy filename.backup filename (Windows)');
console.log('   cp filename.backup filename (Mac/Linux)');