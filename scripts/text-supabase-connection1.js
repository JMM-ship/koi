const { Client } = require("pg");
require('dotenv').config()

async function testConnection() {
  console.log('连接URL:', process.env.DIRECT_URL?.replace(/:[^:@]+@/, ':***@'))
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT NOW()");
    console.log("数据库连接成功:", res.rows[0]);
  } catch (err) {
    console.error("连接失败:", err.message);
  } finally {
    await client.end();

  }
}

testConnection();