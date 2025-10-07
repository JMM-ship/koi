import { prisma } from '@/app/models/db'
import fs from 'fs'
import path from 'path'

function splitSqlStatements(sql: string): string[] {
  // Naive splitter by semicolon; ignores lines starting with -- comments
  const lines = sql
    .split('\n')
    .filter(l => !l.trim().startsWith('--'))
  const joined = lines.join('\n')
  return joined
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
}

async function main() {
  const sqlPath = path.join(process.cwd(), 'prisma', 'referral_meta.migration.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  console.log('Applying referral_meta migration...')
  const stmts = splitSqlStatements(sql)
  for (const stmt of stmts) {
    // Execute each statement independently
    await (prisma as any).$executeRawUnsafe(stmt)
  }
  console.log('Done.')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
