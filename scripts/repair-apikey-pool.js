/*
  Repair script for api_keys pool:
  - Finds pool records (owner_user_id IS NULL AND status='active')
  - Decrypts meta.key_encrypted with AAD=id
  - Recomputes key_hash as sha256(plaintext + ENCRYPTION_KEY)
  - Optionally updates key_hash and prefix to match plaintext (dry-run by default)

  Usage:
    node scripts/repair-apikey-pool.js --env .env             # dry run
    node scripts/repair-apikey-pool.js --env .env --apply     # apply changes
    node scripts/repair-apikey-pool.js --env .env --limit 20  # limit rows
    node scripts/repair-apikey-pool.js --env .env --ssl-insecure
*/

const path = require('node:path')
const fs = require('node:fs')
const crypto = require('node:crypto')
let pg
try { pg = require('pg') } catch { pg = null }

function parseArgs() {
  const args = process.argv.slice(2)
  const cfg = { envPath: '.env', limit: 100, apply: false, sslInsecure: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--env' && args[i + 1]) cfg.envPath = args[++i]
    else if (a === '--limit' && args[i + 1]) cfg.limit = parseInt(args[++i], 10) || cfg.limit
    else if (a === '--apply') cfg.apply = true
    else if (a === '--ssl-insecure') cfg.sslInsecure = true
  }
  return cfg
}

function loadEnv(envFile) {
  if (!fs.existsSync(envFile)) return false
  try {
    const dotenv = require('dotenv')
    dotenv.config({ path: envFile })
    return true
  } catch (_) {
    try {
      const raw = fs.readFileSync(envFile, 'utf8')
      for (const line of raw.split(/\r?\n/)) {
        const s = line.trim()
        if (!s || s.startsWith('#')) continue
        const idx = s.indexOf('=')
        if (idx <= 0) continue
        const key = s.slice(0, idx).trim()
        let val = s.slice(idx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
        if (!(key in process.env)) process.env[key] = val
      }
      return true
    } catch { return false }
  }
}

function buildPoolConfig(dbUrl, sslInsecure) {
  const cfg = { connectionString: dbUrl }
  try {
    const u = new URL(dbUrl)
    const sslmode = (u.searchParams.get('sslmode') || process.env.PGSSLMODE || '').toLowerCase()
    const host = u.hostname || ''
    const needInsecure = sslInsecure || sslmode === 'require' || sslmode === 'no-verify' || /supabase\.co$/.test(host) || /pooler\.supabase\.com$/.test(host)
    if (needInsecure) cfg.ssl = { rejectUnauthorized: false }
  } catch (_) { if (sslInsecure) cfg.ssl = { rejectUnauthorized: false } }
  return cfg
}

function getEncryptionKey() {
  const apiKeysKey = process.env.API_KEYS_ATREST_KEY
  if (apiKeysKey) {
    const key = Buffer.from(apiKeysKey, 'base64')
    if (key.length !== 32) throw new Error(`API_KEYS_ATREST_KEY must be 32 bytes after base64 decode (got ${key.length})`)
    return key
  }
  const encryptionKey = process.env.ENCRYPTION_KEY
  if (encryptionKey) {
    const salt = 'api-keys-at-rest'
    return crypto.scryptSync(encryptionKey, salt, 32)
  }
  throw new Error('Missing encryption key: API_KEYS_ATREST_KEY or ENCRYPTION_KEY must be set')
}

function decryptApiKey(encryptedPayload, aad = '') {
  const key = getEncryptionKey()
  const parts = String(encryptedPayload).split(':')
  if (parts.length !== 4) throw new Error('invalid envelope format')
  const [ver, ivB64, ctB64, tagB64] = parts
  if (ver !== 'v1') throw new Error('unsupported envelope version')
  const iv = Buffer.from(ivB64, 'base64')
  const ct = Buffer.from(ctB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  if (aad) decipher.setAAD(Buffer.from(aad))
  decipher.setAuthTag(tag)
  const p1 = decipher.update(ct)
  const p2 = decipher.final()
  return Buffer.concat([p1, p2]).toString('utf8')
}

function hashPeppered(plaintext) {
  const pepper = process.env.ENCRYPTION_KEY || ''
  return crypto.createHash('sha256').update(plaintext + pepper).digest('hex')
}

function maskKey(k) { return !k ? '' : `${k.slice(0, 7)}...****` }

async function repair(dbUrl, limit, apply, sslInsecure) {
  if (!pg) throw new Error('pg module is not installed. Run `npm install`.')
  const { Pool } = pg
  const pool = new Pool(buildPoolConfig(dbUrl, sslInsecure))
  const client = await pool.connect()
  const results = []
  try {
    const { rows } = await client.query(
      `SELECT id, key_hash, prefix, meta FROM api_keys
       WHERE owner_user_id IS NULL AND status='active'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    )
    for (const r of rows) {
      const id = r.id
      const currentHash = r.key_hash
      const prefix = r.prefix
      let meta = r.meta
      if (typeof meta === 'string') { try { meta = JSON.parse(meta) } catch { meta = {} } }
      const enc = meta && (meta.key_encrypted || meta.keyEncrypted)
      const rowRes = { id, masked: '', prefix, currentHash, action: 'none', note: '' }
      if (!enc) { rowRes.action = 'skip'; rowRes.note = 'Missing meta.key_encrypted'; results.push(rowRes); continue }
      try {
        const plaintext = decryptApiKey(enc, id)
        rowRes.masked = maskKey(plaintext)
        const computed = hashPeppered(plaintext)
        const newPrefix = plaintext.slice(0, 7)
        if (currentHash === computed && prefix === newPrefix) {
          rowRes.action = 'ok'
        } else {
          // Check uniqueness before update
          const { rows: dup } = await client.query('SELECT 1 FROM api_keys WHERE key_hash=$1 AND id<>$2 LIMIT 1', [computed, id])
          if (dup.length > 0) {
            rowRes.action = 'conflict'
            rowRes.note = 'Another record already has this key_hash'
          } else if (apply) {
            await client.query('UPDATE api_keys SET key_hash=$1, prefix=$2, updated_at=now() WHERE id=$3', [computed, newPrefix, id])
            rowRes.action = 'updated'
          } else {
            rowRes.action = 'would-update'
          }
        }
      } catch (e) {
        rowRes.action = 'error'
        rowRes.note = (e && e.message) || String(e)
      }
      results.push(rowRes)
    }
  } finally {
    client.release(); await pool.end()
  }
  return results
}

async function main() {
  const cfg = parseArgs()
  if (cfg.sslInsecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  const envFile = path.isAbsolute(cfg.envPath) ? cfg.envPath : path.join(process.cwd(), cfg.envPath)
  if (loadEnv(envFile)) console.log(`Using env file: ${envFile}`)
  else console.warn(`Env file not found or could not be loaded at ${envFile}, relying on process.env`)

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) { console.error('DATABASE_URL is required'); process.exit(2) }

  console.log(`[Repair] limit=${cfg.limit} apply=${cfg.apply ? 'yes' : 'no'}${cfg.sslInsecure ? ' (sslInsecure)' : ''}`)
  try {
    const rows = await repair(databaseUrl, cfg.limit, cfg.apply, cfg.sslInsecure)
    console.table(rows.map(r => ({ id: r.id, masked: r.masked, prefix: r.prefix, currentHash: (r.currentHash||'').slice(0,8)+'…', action: r.action, note: r.note })))
    const updated = rows.filter(r => r.action === 'updated').length
    const would = rows.filter(r => r.action === 'would-update').length
    const ok = rows.filter(r => r.action === 'ok').length
    const conflict = rows.filter(r => r.action === 'conflict').length
    const skip = rows.filter(r => r.action === 'skip').length
    const err = rows.filter(r => r.action === 'error').length
    console.log(`Summary: ok=${ok}, updated=${updated}, wouldUpdate=${would}, conflict=${conflict}, skip=${skip}, error=${err}`)
    if (!cfg.apply && would > 0) {
      console.log('Dry run only. Re-run with --apply to write changes.')
    }
  } catch (e) {
    console.error('Repair failed:', (e && e.message) || e)
    process.exit(1)
  }
}

main()

