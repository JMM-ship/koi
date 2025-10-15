// 这个脚本用于应用 dashboard 相关的数据库更改
// 使用 prisma db push 来同步 schema 到数据库

const { execSync } = require('child_process');
const path = require('path');

console.log('开始应用 Dashboard 数据库更改...\n');

try {
  // 1. 生成 Prisma Client
  console.log('1. 生成 Prisma Client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log('✓ Prisma Client 生成成功\n');

  // 2. 推送 schema 更改到数据库
  console.log('2. 推送 schema 更改到数据库...');
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  console.log('✓ Schema 更改已应用到数据库\n');

  console.log('Dashboard 数据库更改应用成功！');
  console.log('\n下一步：');
  console.log('1. 运行测试数据初始化（可选）：');
  console.log('   npx tsx scripts/seed-dashboard.ts');
  console.log('2. 启动开发服务器：');
  console.log('   npm run dev');
  
} catch (error) {
  console.error('错误：应用数据库更改失败');
  console.error(error.message);
  process.exit(1);
}