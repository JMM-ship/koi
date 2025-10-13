import { POST as antomPost } from '@/app/api/orders/pay/antom/route'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(async () => ({ user: { id: 'u1', email: 'u@example.com' } })),
}))

jest.mock('@/app/models/order', () => ({
  findOrderByOrderNo: jest.fn(async (orderNo: string) => ({
    order_no: orderNo,
    amount: 9.1,
    currency: 'USD',
    product_name: 'Test Order',
  })),
}))

const antomPayMock = jest.fn(async () => ({
  ok: true,
  paymentRedirectUrl: 'https://pay.example/redirect',
  raw: { result: { resultStatus: 'U' } },
  paymentId: 'pid',
  paymentRequestId: 'req',
}))

jest.mock('@/app/service/antom', () => ({
  antomPay: (...args: any[]) => (antomPayMock as any)(...args),
  getBaseUrl: () => 'http://localhost:3000',
}))

function makeRequest(body: any, headers: Record<string, string> = {}) {
  const hLower: Record<string, string> = {}
  for (const k of Object.keys(headers)) hLower[k.toLowerCase()] = headers[k]
  return {
    url: 'http://localhost:3000/api/orders/pay/antom',
    headers: {
      get: (name: string) => hLower[name.toLowerCase()] || null,
    },
    json: async () => body,
  } as any
}

describe('POST /api/orders/pay/antom - TW auto TWD', () => {
  beforeEach(() => {
    antomPayMock.mockClear()
    process.env.ENABLE_TW_JKOPAY_AUTO = 'true'
    process.env.ANTOM_USD_TWD_RATE = '32'
    process.env.ANTOM_PAYMENT_CURRENCY = 'USD'
    delete process.env.ANTOM_SETTLEMENT_CURRENCY
  })

  test('TW header, no explicit method -> TWD cashier with integer', async () => {
    const req = makeRequest({ orderNo: 'ORD1' }, { 'x-vercel-ip-country': 'TW' })
    const res = await antomPost(req)
    const data = await (res as any).json()
    expect((data?.data?.debug?.currency)).toBe('TWD')
    expect((data?.data?.debug?.amount)).toBe(292) // 9.1*32 -> 292 ceil
    // Check antomPay called with TWD & integer
    const call = antomPayMock.mock.calls[0][0]
    expect(call.currency).toBe('TWD')
    expect(call.amount).toBe(292)
    expect(call.paymentMethodType).toBe('CONNECT_WALLET')
    expect(call.userRegion).toBe('TW')
    expect(call.settlementCurrency).toBeUndefined()
  })

  test('US header, no explicit method -> stays USD', async () => {
    const req = makeRequest({ orderNo: 'ORD2' }, { 'x-vercel-ip-country': 'US' })
    const res = await antomPost(req)
    const data = await (res as any).json()
    expect((data?.data?.debug?.currency)).toBe('USD')
    expect((data?.data?.debug?.amount)).toBe(9.1)
    const call = antomPayMock.mock.calls[0][0]
    expect(call.currency).toBe('USD')
    expect(call.amount).toBe(9.1)
    expect(call.paymentMethodType).toBe('CONNECT_WALLET')
  })
})
