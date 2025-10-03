import { PrismaClient } from '@prisma/client'
import path from 'path'

// Load env from project .env explicitly for local runs
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
} catch {}

function maskUrl(u?: string) {
  if (!u) return 'N/A'
  try {
    const url = new URL(u)
    if (url.password) url.password = '***'
    return url.toString()
  } catch {
    return u.replace(/:(?:[^:@]+)@/, ':***@')
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL
  console.log('DATABASE_URL present:', !!dbUrl)
  console.log('DATABASE_URL (masked):', maskUrl(dbUrl))

  const prisma = new PrismaClient({
    log: ['warn', 'error'],
  })

  try {
    console.log('\nConnecting with Prisma...')
    await prisma.$connect()
    console.log('✅ Connected')

    const rows = (await prisma.$queryRawUnsafe(
      "select current_database() as db, current_user as usr, inet_server_port() as port, now() as now"
    )) as any[]
    console.log('Server info:', rows[0])

    const tables = (await prisma.$queryRawUnsafe(
      "select count(*)::int as n from pg_tables where schemaname='public'"
    )) as any[]
    console.log('Public tables count:', tables?.[0]?.n)

    console.log('\n✅ Prisma ping succeeded')
  } catch (err: any) {
    console.error('\n❌ Prisma ping failed')
    console.error('name:', err?.name)
    console.error('code:', err?.code)
    console.error('message:', err?.message)
    if (err?.meta) console.error('meta:', err.meta)
    process.exitCode = 1
  } finally {
    await (async () => {
      try { await prisma.$disconnect() } catch {}
    })()
  }
}

main()

