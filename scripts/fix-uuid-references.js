const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 需要修复的文件列表和对应的替换规则
const fixRules = [
  // API文件中的 session.user.uuid 替换
  {
    file: 'app/api/packages/renew/route.ts',
    replacements: [
      { from: 'session?.user?.uuid', to: 'session?.user?.uuid || session?.user?.id' }
    ]
  },
  {
    file: 'app/api/credits/use/test/route.ts',
    replacements: [
      { from: 'session?.user?.uuid', to: 'session?.user?.uuid || session?.user?.id' },
      { from: 'session.user.uuid', to: 'session.user.uuid || session.user.id' }
    ]
  },
  {
    file: 'app/api/credits/use/route.ts',
    replacements: [
      { from: 'session?.user?.uuid', to: 'session?.user?.uuid || session?.user?.id' }
    ]
  },
  {
    file: 'app/api/credits/check-reset/route.ts',
    replacements: [
      { from: 'session?.user?.uuid', to: 'session?.user?.uuid || session?.user?.id' }
    ]
  },
  {
    file: 'app/api/orders/pay/mock/route.ts',
    replacements: [
      { from: 'session?.user?.uuid', to: 'session?.user?.uuid || session?.user?.id' }
    ]
  },
  {
    file: 'app/api/credits/balance/route.ts',
    replacements: [
      { from: 'session?.user?.uuid', to: 'session?.user?.uuid || session?.user?.id' }
    ]
  },
  {
    file: 'app/api/orders/create/route.ts',
    replacements: [
      { from: 'session?.user?.uuid', to: 'session?.user?.uuid || session?.user?.id' }
    ]
  },
  {
    file: 'app/api/apikeys/route.ts',
    replacements: [
      { from: 'user.uuid', to: 'user.id' }
    ]
  },
  {
    file: 'app/api/dashboard/model-usage/route.ts',
    replacements: [
      { from: 'user.uuid', to: 'user.id' }
    ]
  },
  {
    file: 'app/api/dashboard/consumption-trends/route.ts',
    replacements: [
      { from: 'user.uuid', to: 'user.id' }
    ]
  },
  {
    file: 'app/api/auth/refresh-session/route.ts',
    replacements: [
      { from: 'user.uuid', to: 'user.id' }
    ]
  },
  {
    file: 'app/api/admin/credits/reset/route.ts',
    replacements: [
      { from: 'session?.user?.uuid', to: 'session?.user?.uuid || session?.user?.id' }
    ]
  },
  {
    file: 'components/debug/DebugPanel.tsx',
    replacements: [
      { from: 'session?.user?.uuid', to: 'session?.user?.uuid || session?.user?.id' }
    ]
  },
  {
    file: 'components/layout/header/Header.tsx',
    replacements: [
      { from: 'user?.uuid', to: 'user?.uuid || user?.id' }
    ]
  }
];

function fixFile(filePath, replacements) {
  const fullPath = path.join(rootDir, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      changed = true;
      console.log(`Fixed ${filePath}: ${from} -> ${to}`);
    }
  });

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
  }
}

console.log('开始修复UUID引用...');

fixRules.forEach(({ file, replacements }) => {
  fixFile(file, replacements);
});

console.log('UUID引用修复完成！');