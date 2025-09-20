const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function initDatabase() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  })

  try {
    console.log('连接到Supabase数据库...')
    await client.connect()
    console.log('✅ 连接成功')

    // 读取SQL文件
    const sqlPath = path.join(__dirname, '..', 'prisma', 'init_database.sql')
    console.log('读取SQL文件:', sqlPath)
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // 执行SQL
    console.log('执行数据库初始化SQL...')
    await client.query(sqlContent)
    console.log('✅ 数据库表创建成功')

    // 验证表是否创建
    const result = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)

    console.log('\n创建的表:')
    result.rows.forEach(row => {
      console.log(`  - ${row.tablename}`)
    })

    console.log('\n✅ 数据库初始化完成！')

  } catch (err) {
    console.error('❌ 错误:', err.message)
    if (err.message.includes('already exists')) {
      console.log('提示: 某些表可能已经存在，这是正常的')
    }
  } finally {
    await client.end()
  }
}

initDatabase()