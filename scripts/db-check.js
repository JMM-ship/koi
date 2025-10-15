const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query','error','warn'] : ['error']
});
(async () => {
  try {
    await prisma.$connect();
    console.log('DB: connected');
    const cnt = await prisma.package.count();
    console.log('packages:', cnt);
  } catch (e) {
    console.error('DB connect failed:', e?.message || e);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
})();
