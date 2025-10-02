const { Client } = require('pg');

// 替换为你的 Supabase 数据库连接字符串
const connectionString = "postgresql://postgres:Exitsea@2025@db.wbswuxclfayxxamozsaq.supabase.co:5432/postgres";

const TOTAL_TESTS = 10; // 测试次数
const DELAY_MS = 1000;   // 每次间隔 1 秒

(async () => {
  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i <= TOTAL_TESTS; i++) {
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    const start = Date.now();
    try {
      await client.connect();
      const res = await client.query('SELECT now()');
      const duration = Date.now() - start;
      console.log(`[${i}] ✅ 连接成功，耗时: ${duration} ms，返回:`, res.rows[0]);
      successCount++;
    } catch (err) {
      const duration = Date.now() - start;
      console.log(`[${i}] ❌ 连接失败，耗时: ${duration} ms，错误:`, err.message);
      failCount++;
    } finally {
      await client.end();
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\n测试完成：成功 ${successCount} 次，失败 ${failCount} 次，总共 ${TOTAL_TESTS} 次`);
})();
