/*
  Standalone checker for API_KEYS_ATREST_KEY / ENCRYPTION_KEY and pool key integrity.
  - No tsx/ts-node required. Run with: node scripts/check-api-key-config.js --env .env
*/

const path = require('node:path')
const fs = require('node:fs')
const crypto = require('node:crypto')

let pg
try {
  pg = require('pg')
} catch (e) {
  pg = null
}

function parseArgs() {
  const args = process.argv.slice(2)
  const cfg = { envPath: '.env', limit: 5, checkReplica: false, skipDb: false, sslInsecure: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--env' && args[i + 1]) cfg.envPath = args[++i]
    else if (a === '--limit' && args[i + 1]) cfg.limit = parseInt(args[++i], 10) || cfg.limit
    else if (a === '--replica') cfg.checkReplica = true
    else if (a === '--skip-db') cfg.skipDb = true
    else if (a === '--ssl-insecure') cfg.sslInsecure = true
  }
  return cfg
}

function loadEnv(envFile) {
  if (!fs.existsSync(envFile)) return false
  // Try dotenv if available; otherwise minimal parser
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
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!(key in process.env)) process.env[key] = val
      }
      return true
    } catch (e) {
      return false
    }
  }
}

function sha256Hex(data) { return crypto.createHash('sha256').update(data).digest('hex') }

function describeEnvValue(name, val) {
  const present = val != null && val !== ''
  const info = { name, present }
  if (present) {
    info.length = val.length
    info.trimmedLength = val.trim().length
    info.hasTrailingWhitespace = val.length !== val.trimEnd().length
    info.sample = JSON.stringify(val.slice(0, 8) + (val.length > 8 ? '…' : ''))
    info.sha256 = sha256Hex(val)
  }
  return info
}

function checkApiKeysAtRestKey(val) {
  const res = { name: 'API_KEYS_ATREST_KEY' }
  if (!val) { res.present = false; res.note = 'Not set. decrypt() will fallback to scrypt(ENCRYPTION_KEY)'; return res }
  res.present = true
  try {
    const buf = Buffer.from(val, 'base64')
    res.base64DecodedBytes = buf.length
    res.valid = buf.length === 32
    res.sha256 = sha256Hex(buf)
    if (!res.valid) res.error = `Must decode to 32 bytes, got ${buf.length}`
  } catch (e) { res.valid = false; res.error = `Invalid base64: ${e && e.message || e}` }
  return res
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

function hashApiKeyWithPepper(plaintext, pepper) {
  return crypto.createHash('sha256').update(plaintext + pepper).digest('hex')
}

function maskKey(k) { return !k ? '' : `${k.slice(0, 7)}...****` }

function maskUrl(u) {
  if (!u) return { present: false }
  try { const obj = new URL(u); if (obj.password) obj.password = '***'; return { present: true, url: obj.toString() } }
  catch { return { present: true, url: '<invalid URL format>' } }
}

function buildPoolConfig(dbUrl, sslInsecure) {
  const cfg = { connectionString: dbUrl }
  try {
    const u = new URL(dbUrl)
    const sslmode = (u.searchParams.get('sslmode') || process.env.PGSSLMODE || '').toLowerCase()
    const host = u.hostname || ''
    const needInsecure = sslInsecure || sslmode === 'require' || sslmode === 'no-verify' || /supabase\.co$/.test(host) || /pooler\.supabase\.com$/.test(host)
    if (needInsecure) {
      cfg.ssl = { rejectUnauthorized: false }
    }
  } catch (_) {
    if (sslInsecure) cfg.ssl = { rejectUnauthorized: false }
  }
  return cfg
}

async function checkDbPool(dbUrl, limit, sslInsecure) {
  if (!pg) {
    console.warn('[Warn] pg module is not installed. Run `npm install` or use --skip-db')
    return []
  }
  const { Pool } = pg
  const pool = new Pool(buildPoolConfig(dbUrl, sslInsecure))
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
    const results = []
    for (const r of rows) {
      const id = r.id
      const keyHash = r.key_hash
      const prefix = r.prefix
      let meta = r.meta
      if (typeof meta === 'string') { try { meta = JSON.parse(meta) } catch { meta = {} } }
      const enc = meta && (meta.key_encrypted || meta.keyEncrypted)
      const item = { id, hasEncrypted: Boolean(enc), prefix }
      if (!enc) { item.ok = false; item.error = 'Missing meta.key_encrypted'; results.push(item); continue }
      try {
        const plaintext = decryptApiKey(enc, id)
        item.masked = maskKey(plaintext)
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
      } catch (e) {
        item.ok = false
        item.error = `Decrypt failed: ${e && e.message || e}`
      }
      results.push(item)
    }
    return results
  } finally {
    client.release(); await pool.end()
  }
}

async function main() {
  const cfg = parseArgs()
  if (cfg.sslInsecure) {
    // Global bypass for self-signed certs during this diagnostic run only
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }
  const envFile = path.isAbsolute(cfg.envPath) ? cfg.envPath : path.join(process.cwd(), cfg.envPath)
  if (loadEnv(envFile)) {
    console.log(`Using env file: ${envFile}`)
  } else {
    console.warn(`Env file not found or could not be loaded at ${envFile}, relying on process.env`)
  }

  const apiKeysAtRest = process.env.API_KEYS_ATREST_KEY
  const encryptionKey = process.env.ENCRYPTION_KEY
  const databaseUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL

  console.log('\n[Env Variables]')
  console.table([
    describeEnvValue('ENCRYPTION_KEY', encryptionKey),
    checkApiKeysAtRestKey(apiKeysAtRest),
  ])

  console.log('\n[Database URLs]')
  console.table([
    { name: 'DATABASE_URL', ...maskUrl(databaseUrl) },
    { name: 'DIRECT_URL', ...maskUrl(directUrl) },
  ])

  if (cfg.skipDb) { console.log('\n[Skip DB checks due to --skip-db]'); return }
  if (!databaseUrl) { console.error('DATABASE_URL is required to check pool keys.'); process.exitCode = 2; return }

  console.log(`\n[DB Check] Primary: sampling up to ${cfg.limit} pool keys${cfg.sslInsecure ? ' (sslInsecure)' : ''}`)
  try {
    const rows = await checkDbPool(databaseUrl, cfg.limit, cfg.sslInsecure)
    console.table(rows.map(r => ({ id: r.id, hasEncrypted: r.hasEncrypted, masked: r.masked, prefix: r.prefix, ok: r.ok, hashMatchesPeppered: r.hashMatchesPeppered, hashMatchesBare: r.hashMatchesBare, prefixMatches: r.prefixMatches, error: r.error })))
    const bad = rows.filter(r => !r.ok)
    if (bad.length > 0) { console.warn(`Found ${bad.length} problematic pool key(s) on primary.`); process.exitCode = 1 }
  } catch (e) { console.error('Primary DB check failed:', e && e.message || e); process.exitCode = 3 }

  if (cfg.checkReplica && directUrl) {
    console.log(`\n[DB Check] Replica (DIRECT_URL): sampling up to ${cfg.limit} pool keys${cfg.sslInsecure ? ' (sslInsecure)' : ''}`)
    try {
      const rows = await checkDbPool(directUrl, cfg.limit, cfg.sslInsecure)
      console.table(rows.map(r => ({ id: r.id, hasEncrypted: r.hasEncrypted, masked: r.masked, prefix: r.prefix, ok: r.ok, hashMatchesPeppered: r.hashMatchesPeppered, hashMatchesBare: r.hashMatchesBare, prefixMatches: r.prefixMatches, error: r.error })))
      const bad = rows.filter(r => !r.ok)
      if (bad.length > 0) { console.warn(`Found ${bad.length} problematic pool key(s) on replica.`); process.exitCode = 1 }
    } catch (e) { console.error('Replica DB check failed:', e && e.message || e); process.exitCode = process.exitCode || 3 }
  }
}

main().catch((err) => { console.error(err); process.exit(10) })
