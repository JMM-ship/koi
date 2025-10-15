const { Client } = require('pg')
const path = require('path')

// 明确指定 .env 文件路径
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function testConnection() {
  console.log('检查环境变量...')
  console.log('DIRECT_URL 是否存在:', !!process.env.DIRECT_URL)
  console.log('DATABASE_URL 是否存在:', !!process.env.DATABASE_URL)

  if (!process.env.DIRECT_URL) {
    console.error('❌ 错误: DIRECT_URL 环境变量未设置')
    console.log('当前工作目录:', process.cwd())
    console.log('.env 文件路径:', path.join(__dirname, '..', '.env'))
    return
  }

  console.log('测试Supabase数据库连接...')
  console.log('连接URL:', process.env.DIRECT_URL.replace(/:[^:@]+@/, ':***@'))

  const client = new Client({
    connectionString: process.env.DIRECT_URL
  })

  try {
    await client.connect()
    console.log('✅ 数据库连接成功！')

    const res = await client.query('SELECT NOW(), current_database()')
    console.log('服务器时间:', res.rows[0].now)
    console.log('当前数据库:', res.rows[0].current_database)

    // 测试表是否存在
    const tables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      LIMIT 5
    `)

    if (tables.rows.length > 0) {
      console.log('找到的表:', tables.rows.map(r => r.tablename).join(', '))
    } else {
      console.log('数据库中还没有表')
    }

  } catch (err) {
    console.error('❌ 连接失败:', err.message)
    if (err.message.includes('password')) {
      console.log('提示: 检查密码是否正确编码（@ 应该是 %40）')
    }
  } finally {
    await client.end()
    console.log('连接已关闭')
  }
}

// 先检查依赖
try {
  require('pg')
} catch (err) {
  console.error('❌ 请先安装 pg 包: npm install pg')
  process.exit(1)
}

testConnection()