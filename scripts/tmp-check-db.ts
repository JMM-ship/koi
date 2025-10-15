import prisma from '@/lib/prisma'
async function main(){
  try{ await prisma.$connect(); console.log('DB: connected');
    const cnt = await prisma.package.count(); console.log('packages:', cnt);
  }catch(e){ console.error('DB connect failed:', (e as any)?.message || e); process.exit(2)}
  finally{ await prisma.$disconnect(); }
}
main();
