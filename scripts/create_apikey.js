/**
 * Integration test: wallet deduction on usage increment
 */

const crypto = require('crypto')
const request = require('supertest')
process.env.ENABLE_TEST_HELPERS = 'true'

const Application = require('../../src/app')
const usersRepo = require('../../src/repositories/usersRepo')
const apiKeyService = require('../../src/services/apiKeyService')
const { createClient } = require('../../src/models/database/supabaseClient')
const redis = require('../../src/models/redis')

describe('Wallet deduction on usage', () => {
  let app
  let server
  const supa = createClient()
  let adminToken
  let userId
  let keyId

  const username = `wallet_${crypto.randomBytes(5).toString('hex')}`
  const email = `${username}@example.com`

  beforeAll(async () => {
    const application = new Application()
    await application.initialize()
    app = application.app
    server = app

    adminToken = crypto.randomBytes(32).toString('hex')
    await redis.setSession(adminToken, {
      adminId: 'admin-deduct',
      username: 'admin-deduct',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }, 3600)

    userId = await usersRepo.createOrUpdateUser({ username, email, displayName: 'Wallet', role: 'user', isActive: true })

    // Ensure wallet row with initial balances: package 1000, independent 500
    await supa.from('wallets').upsert({
      user_id: userId,
      package_daily_quota_tokens: 0,
      package_tokens_remaining: 1000,
      independent_tokens: 500,
      locked_tokens: 0,
      version: 0
    })

    const created = await apiKeyService.generateApiKey({ name: 'wallet-key', userId, userUsername: username })
    keyId = created.id
  })

  it('deducts from package first then independent', async () => {
    // 1) Deduct 300 core tokens -> package 700 left
    let res = await request(server)
      .post('/admin/_test/increment-usage')
      .set('x-admin-token', adminToken)
      .send({ keyId, model: 'claude-3-5-haiku', input: 200, output: 100 })
    expect(res.status).toBe(200)

    let { data: w1, error: e1 } = await supa.from('wallets').select('package_tokens_remaining,independent_tokens').eq('user_id', userId).maybeSingle()
    if (e1) throw e1
    expect(Number(w1.package_tokens_remaining)).toBe(700)
    expect(Number(w1.independent_tokens)).toBe(500)

    // 2) Deduct 800 core tokens -> package 0, independent 400
    res = await request(server)
      .post('/admin/_test/increment-usage')
      .set('x-admin-token', adminToken)
      .send({ keyId, model: 'claude-3-5-haiku', input: 500, output: 300 })
    expect(res.status).toBe(200)

    const { data: w2, error: e2 } = await supa.from('wallets').select('package_tokens_remaining,independent_tokens').eq('user_id', userId).maybeSingle()
    if (e2) throw e2
    expect(Number(w2.package_tokens_remaining)).toBe(0)
    expect(Number(w2.independent_tokens)).toBe(400)
  })

  afterAll(async () => {
    try {
      if (keyId) await supa.from('api_keys').delete().eq('id', keyId)
      if (userId) await supa.from('wallets').delete().eq('user_id', userId)
      if (userId) await supa.from('users').delete().eq('id', userId)
    } catch (_) { }
  })
})

