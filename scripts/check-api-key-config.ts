import 'dotenv/config'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { Pool } from 'pg'
import { decryptApiKey } from '@/app/lib/crypto'

type Cfg = {
  envPath: string
  limit: number
  checkReplica: boolean
  skipDb: boolean
}

function parseArgs(): Cfg {
  const args = process.argv.slice(2)
  const cfg: Cfg = {
    envPath: process.env.ENV_PATH || '.env',
    limit: 5,
    checkReplica: false,
    skipDb: false,
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--env' && args[i + 1]) {
      cfg.envPath = args[++i]
    } else if (a === '--limit' && args[i + 1]) {
      cfg.limit = parseInt(args[++i], 10) || cfg.limit
    } else if (a === '--replica') {
      cfg.checkReplica = true
    } else if (a === '--skip-db') {
      cfg.skipDb = true
    }
  }
  return cfg
}

function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

function describeEnvValue(name: string, val?: string) {
  const present = val != null && val !== ''
  const info: any = { present }
  if (present) {
    info.length = val!.length
    info.trimmedLength = val!.trim().length
    info.hasTrailingWhitespace = val!.length !== val!.trimEnd().length
    info.sample = JSON.stringify(val!.slice(0, 8) + (val!.length > 8 ? '…' : ''))
    info.sha256 = sha256Hex(val!)
  }
  return { name, ...info }
}

function checkApiKeysAtRestKey(val?: string) {
  const res: any = { name: 'API_KEYS_ATREST_KEY' }
  if (!val) {
    res.present = false
    res.note = 'Not set. decrypt() will fallback to scrypt(ENCRYPTION_KEY)'
    return res
  }
  res.present = true
  try {
    const buf = Buffer.from(val, 'base64')
    res.base64DecodedBytes = buf.length
    res.valid = buf.length === 32
    res.sha256 = sha256Hex(buf)
    if (!res.valid) {
      res.error = `Must decode to 32 bytes, got ${buf.length}`
    }
  } catch (e: any) {
    res.valid = false
    res.error = `Invalid base64: ${e?.message || e}`
  }
  return res
}

function hashApiKeyWithPepper(plaintext: string, pepper: string): string {
  return crypto.createHash('sha256').update(plaintext + pepper).digest('hex')
}

function maskKey(k: string): string {
  if (!k) return ''
  return `${k.slice(0, 7)}...****`
}

async function checkDbPool(dbUrl: string, limit: number) {
  const pool = new Pool({ connectionString: dbUrl })
  const client = await pool.connect()
  try {
    const sql = `
      SELECT id, key_hash, prefix, meta
      FROM api_keys
      WHERE owner_user_id IS NULL AND status = 'active'
      ORDER BY created_at DESC
      LIMIT $1
    `
    const { rows } = await client.query(sql, [limit])
    const results: any[] = []
    for (const r of rows) {
      const id: string = r.id
      const keyHash: string = r.key_hash
      const prefix: string | null = r.prefix
      const meta: any = r.meta || {}
      const enc: string | undefined = meta?.key_encrypted || meta?.keyEncrypted
      const item: any = {
        id,
        hasEncrypted: Boolean(enc),
        prefix,
      }
      if (!enc) {
        item.ok = false
        item.error = 'Missing meta.key_encrypted'
        results.push(item)
        continue
      }
      try {
        const plaintext = decryptApiKey(enc, id)
        item.masked = maskKey(plaintext)
        // Compare two possibilities to aid debugging
        const pepper = process.env.ENCRYPTION_KEY || ''
        const hPeppered = hashApiKeyWithPepper(plaintext, pepper)
        const hBare = crypto.createHash('sha256').update(plaintext).digest('hex')
        item.hashMatchesPeppered = keyHash === hPeppered
        item.hashMatchesBare = keyHash === hBare
        item.prefixMatches = prefix ? plaintext.startsWith(prefix) : true
        item.ok = Boolean(item.hashMatchesPeppered && item.prefixMatches)
        if (!item.ok) {
          item.expectedHashPeppered = hPeppered
          item.expectedHashBare = hBare
          item.actualKeyHash = keyHash
        }
      } catch (e: any) {
        item.ok = false
        item.error = `Decrypt failed: ${e?.message || e}`
      }
      results.push(item)
    }
    return results
  } finally {
    client.release()
    await pool.end()
  }
}

function maskUrl(u?: string) {
  if (!u) return { present: false }
  try {
    const obj = new URL(u)
    if (obj.password) obj.password = '***'
    return { present: true, url: obj.toString() }
  } catch {
    return { present: true, url: '<invalid URL format>' }
  }
}

async function main() {
  const cfg = parseArgs()
  const envFile = path.isAbsolute(cfg.envPath) ? cfg.envPath : path.join(process.cwd(), cfg.envPath)
  if (fs.existsSync(envFile)) {
    // eslint-disable-next-line no-console
    console.log(`Using env file: ${envFile}`)
    // Re-load explicitly to ensure correct path
    require('dotenv').config({ path: envFile })
  } else {
    // eslint-disable-next-line no-console
    console.warn(`Env file not found at ${envFile}, relying on process.env`)
  }

  // 1) Print env diagnostics
  const apiKeysAtRest = process.env.API_KEYS_ATREST_KEY
  const encryptionKey = process.env.ENCRYPTION_KEY
  const databaseUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL

  // eslint-disable-next-line no-console
  console.log('\n[Env Variables]')
  // eslint-disable-next-line no-console
  console.table([
    describeEnvValue('ENCRYPTION_KEY', encryptionKey),
    checkApiKeysAtRestKey(apiKeysAtRest),
  ])

  // eslint-disable-next-line no-console
  console.log('\n[Database URLs]')
  // eslint-disable-next-line no-console
  console.table([
    { name: 'DATABASE_URL', ...maskUrl(databaseUrl) },
    { name: 'DIRECT_URL', ...maskUrl(directUrl) },
  ])

  if (cfg.skipDb) {
    // eslint-disable-next-line no-console
    console.log('\n[Skip DB checks due to --skip-db]')
    return
  }

  if (!databaseUrl) {
    // eslint-disable-next-line no-console
    console.error('DATABASE_URL is required to check pool keys.')
    process.exitCode = 2
    return
  }

  // 2) Check primary DB
  // eslint-disable-next-line no-console
  console.log(`\n[DB Check] Primary: sampling up to ${cfg.limit} pool keys`)
  try {
    const rows = await checkDbPool(databaseUrl, cfg.limit)
    // eslint-disable-next-line no-console
    console.table(rows.map(r => ({
      id: r.id,
      hasEncrypted: r.hasEncrypted,
      masked: r.masked,
      prefix: r.prefix,
      ok: r.ok,
      hashMatchesPeppered: r.hashMatchesPeppered,
      hashMatchesBare: r.hashMatchesBare,
      prefixMatches: r.prefixMatches,
      error: r.error,
    })))
    const bad = rows.filter((r: any) => !r.ok)
    if (bad.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`Found ${bad.length} problematic pool key(s) on primary.`)
      process.exitCode = 1
    }
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('Primary DB check failed:', e?.message || e)
    process.exitCode = 3
  }

  // 3) Optionally check replica
  if (cfg.checkReplica && directUrl) {
    // eslint-disable-next-line no-console
    console.log(`\n[DB Check] Replica (DIRECT_URL): sampling up to ${cfg.limit} pool keys`)
    try {
      const rows = await checkDbPool(directUrl, cfg.limit)
      // eslint-disable-next-line no-console
      console.table(rows.map(r => ({
        id: r.id,
        hasEncrypted: r.hasEncrypted,
        masked: r.masked,
        prefix: r.prefix,
        ok: r.ok,
        hashMatchesPeppered: r.hashMatchesPeppered,
        hashMatchesBare: r.hashMatchesBare,
        prefixMatches: r.prefixMatches,
        error: r.error,
      })))
      const bad = rows.filter((r: any) => !r.ok)
      if (bad.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(`Found ${bad.length} problematic pool key(s) on replica.`)
        process.exitCode = 1
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('Replica DB check failed:', e?.message || e)
      process.exitCode ||= 3
    }
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(10)
})

