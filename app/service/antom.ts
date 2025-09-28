import crypto from 'crypto'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface AntomConfig {
  gatewayUrl: string
  clientId: string
  merchantPrivateKey: string
  alipayPublicKey?: string
  keyVersion?: number
  agentToken?: string
}

export interface AntomPayParams {
  orderNo: string
  amount: number // in major unit, e.g. 12.34 CNY -> 12.34
  currency: string // e.g. CNY
  productName: string
  userEmail?: string
  notifyUrl: string
  returnUrl: string
  // Optional overrides
  paymentMethodType?: string // e.g. ALIPAY_CN
  settlementCurrency?: string // e.g. CNY
}

export interface AntomPayResult {
  ok: boolean
  raw: any
  paymentRedirectUrl?: string
  paymentId?: string
  paymentRequestId?: string
  message?: string
}

const DEFAULT_KEY_VERSION = 1

function toPEM(key: string, type: 'PRIVATE' | 'PUBLIC'): string {
  if (key.includes('-----BEGIN')) return key
  const header = `-----BEGIN ${type} KEY-----\n`
  const footer = `\n-----END ${type} KEY-----`
  // wrap at 64 chars per line
  const body = key.replace(/\s+/g, '').match(/.{1,64}/g)?.join('\n') || ''
  return header + body + footer
}

function nowIso(): string {
  return new Date().toISOString()
}

// Build sign payload: "<METHOD> <PATH>\n<clientId>.<requestTime>.<body>"
function buildSignContent(method: HttpMethod, path: string, clientId: string, time: string, body: string) {
  return `${method} ${path}\n${clientId}.${time}.${body}`
}

function signRSA256Base64(content: string, privateKey: string): string {
  // Try PKCS8 first, then fallback to PKCS1 header
  const trySign = (pemHeader: 'PRIVATE' | 'RSA PRIVATE') => {
    const header = pemHeader === 'PRIVATE' ? 'PRIVATE' : 'RSA PRIVATE'
    const pem = privateKey.includes('-----BEGIN') ? privateKey : `-----BEGIN ${header} KEY-----\n${privateKey.replace(/\s+/g, '').match(/.{1,64}/g)?.join('\n') || ''}\n-----END ${header} KEY-----`
    const signer = crypto.createSign('RSA-SHA256')
    signer.update(content, 'utf8')
    signer.end()
    return signer.sign(pem, 'base64')
  }
  try {
    return trySign('PRIVATE')
  } catch (e) {
    return trySign('RSA PRIVATE')
  }
}

function verifyRSA256Base64(content: string, signatureBase64: string, publicKey: string): boolean {
  const pem = toPEM(publicKey, 'PUBLIC')
  const verifier = crypto.createVerify('RSA-SHA256')
  verifier.update(content, 'utf8')
  verifier.end()
  return verifier.verify(pem, signatureBase64, 'base64')
}

function buildHeaders(cfg: AntomConfig, method: HttpMethod, path: string, body: string, requestTime?: string) {
  const reqTime = requestTime || nowIso()
  const signContent = buildSignContent(method, path, cfg.clientId, reqTime, body)
  const signatureBase64 = signRSA256Base64(signContent, cfg.merchantPrivateKey)
  const signatureValue = encodeURIComponent(signatureBase64)
  const keyVersion = cfg.keyVersion ?? DEFAULT_KEY_VERSION
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Request-Time': reqTime,
    'client-id': cfg.clientId,
    'Signature': `algorithm=RSA256,keyVersion=${keyVersion},signature=${signatureValue}`,
  }
  if (cfg.agentToken) headers['agent-token'] = cfg.agentToken
  return headers
}

function getGatewayUrl(): string {
  // Prefer explicit ANTOM_GATEWAY; fallback to known default
  const gw = process.env.ANTOM_GATEWAY_URL || 'https://open-na.alipay.com'
  return gw.replace(/\/$/, '')
}

function getClientId(): string {
  const id = process.env.ANTOM_CLIENT_ID || ''
  return id
}

function isSandbox(clientId: string): boolean {
  return clientId.startsWith('SANDBOX_')
}

function getPayPath(clientId: string): string {
  return isSandbox(clientId) ? '/ams/sandbox/api/v1/payments/pay' : '/ams/api/v1/payments/pay'
}

function getKeyVersion(): number {
  const v = Number(process.env.ANTOM_KEY_VERSION || '')
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_KEY_VERSION
}

export function getAntomConfig(): AntomConfig {
  const clientId = getClientId()
  const merchantPrivateKey = (process.env.ANTOM_MERCHANT_PRIVATE_KEY || '').trim()
  const alipayPublicKey = (process.env.ANTOM_ALIPAY_PUBLIC_KEY || '').trim()
  if (!clientId || !merchantPrivateKey) {
    throw new Error('Missing ANTOM_CLIENT_ID or ANTOM_MERCHANT_PRIVATE_KEY in env')
  }
  return {
    gatewayUrl: getGatewayUrl(),
    clientId,
    merchantPrivateKey,
    alipayPublicKey: alipayPublicKey || undefined,
    keyVersion: getKeyVersion(),
  }
}

export async function antomPay(params: AntomPayParams): Promise<AntomPayResult> {
  const cfg = getAntomConfig()
  const method: HttpMethod = 'POST'
  const path = getPayPath(cfg.clientId)

  // Antom expects minor units (cents) as string
  const valueMinorUnit = Math.round(Number(params.amount) * 100)

  const payload: any = {
    clientId: cfg.clientId,
    productCode: 'CASHIER_PAYMENT',
    paymentRequestId: params.orderNo,
    paymentAmount: { currency: params.currency, value: String(valueMinorUnit) },
    order: {
      referenceOrderId: params.orderNo,
      orderDescription: params.productName,
      orderAmount: { currency: params.currency, value: String(valueMinorUnit) },
    },
    paymentNotifyUrl: params.notifyUrl,
    paymentRedirectUrl: params.returnUrl,
    env: {
      terminalType: 'WEB',
      osType: 'WEB',
    },
  }

  // Only include a specific payment method if provided; otherwise let cashier show all supported methods
  if (params.paymentMethodType) {
    payload.paymentMethod = { paymentMethodType: params.paymentMethodType }
  }

  // Only set settlement strategy if explicitly provided to avoid contract mismatches
  if (params.settlementCurrency) {
    payload.settlementStrategy = { settlementCurrency: params.settlementCurrency }
  }

  const body = JSON.stringify(payload)
  const headers = buildHeaders(cfg, method, path, body)
  const url = cfg.gatewayUrl + path

  const resp = await fetch(url, { method, headers, body, redirect: 'follow' })
  const text = await resp.text()
  let data: any
  try { data = text ? JSON.parse(text) : {} } catch { data = { raw: text } }

  // Try to extract redirect URL and interpret result
  const resultStatus = data?.result?.resultStatus || data?.resultStatus || data?.result_code
  let redirectUrl: string | undefined
  // paymentActionForm may be a JSON string
  if (typeof data?.paymentActionForm === 'string') {
    try {
      const paf = JSON.parse(data.paymentActionForm)
      if (typeof paf?.redirectUrl === 'string') redirectUrl = paf.redirectUrl
    } catch {}
  } else if (data?.paymentActionForm?.redirectUrl) {
    redirectUrl = data.paymentActionForm.redirectUrl
  }
  if (!redirectUrl && data?.redirectActionForm?.redirectUrl) {
    redirectUrl = data.redirectActionForm.redirectUrl
  }
  if (!redirectUrl && typeof data?.normalUrl === 'string') {
    redirectUrl = data.normalUrl
  }
  if (!redirectUrl && typeof data?.paymentUrl === 'string') {
    redirectUrl = data.paymentUrl
  }
  if (!redirectUrl && typeof data?.paymentData?.paymentUrl === 'string') {
    redirectUrl = data.paymentData.paymentUrl
  }

  // Treat "U" (in process) as valid for redirect to cashier
  const interimStatuses = new Set(['U', 'PAYMENT_IN_PROCESS', 'PENDING'])
  const ok = resp.ok && (
    resultStatus === 'S' || resultStatus === 'SUCCESS' || interimStatuses.has(String(resultStatus)) || !!redirectUrl || !data?.result
  )

  return {
    ok,
    raw: data,
    paymentRedirectUrl: redirectUrl,
    paymentId: data?.paymentId,
    paymentRequestId: data?.paymentRequestId || params.orderNo,
    message: data?.result?.resultMessage || data?.message || (ok ? undefined : 'Antom pay failed')
  }
}

export interface WebhookVerifyParams {
  method: HttpMethod
  path: string // request URI without domain
  clientIdHeader: string
  requestTimeHeader: string
  signatureHeader: string // raw header value: algorithm=...,keyVersion=...,signature=...
  body: string
}

export function verifyWebhookSignature(p: WebhookVerifyParams): boolean {
  const cfg = getAntomConfig()
  if (!cfg.alipayPublicKey) {
    // if no public key configured, skip verification (not recommended for prod)
    return false
  }
  const parts = p.signatureHeader.split('signature=')
  if (parts.length < 2) return false
  const signatureEncoded = parts[1]
  // header is URL-encoded
  const signature = decodeURIComponent(signatureEncoded)
  const content = buildSignContent(p.method, p.path, cfg.clientId, p.requestTimeHeader, p.body)
  return verifyRSA256Base64(content, signature, cfg.alipayPublicKey)
}

export function getBaseUrl(): string {
  // Prefer explicit base URL for callbacks; try common envs
  const fromEnv = process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || ''
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return ''
}
