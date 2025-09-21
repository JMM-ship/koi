const { exec } = require('child_process');
const path = require('path');

console.log('检查 TypeScript 编译错误...\n');

const projectRoot = path.join(__dirname, '..');
process.chdir(projectRoot);

exec('npx tsc --noEmit', { cwd: projectRoot }, (error, stdout, stderr) => {
  if (error) {
    console.log('TypeScript 编译错误：');
    console.log(stderr || error.message);
    process.exit(1);
  } else {
    console.log('✅ TypeScript 编译成功！没有错误。');
    process.exit(0);
  }
});