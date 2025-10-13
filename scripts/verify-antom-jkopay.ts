import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { antomPay } from '../app/service/antom'

type Case = {
  title: string
  currency: string
  settlementCurrency?: string
}

async function runCase(test: Case) {
  const orderNo = `VERIFY_JKOPAY_${Date.now()}_${Math.floor(Math.random()*1000)}`
  const res = await antomPay({
    orderNo,
    amount: 2.00, // use whole major units so minor ends with "00"
    currency: test.currency,
    productName: `Verify JKOPay (${test.title})`,
    notifyUrl: 'https://example.com/api/orders/pay/antom/notify',
    returnUrl: 'https://example.com/return',
    paymentMethodType: 'JKOPAY',
    settlementCurrency: test.settlementCurrency,
  })

  const status = res?.raw?.result?.resultStatus || res?.raw?.resultStatus || res?.raw?.result_code
  const message = res?.raw?.result?.resultMessage || res?.raw?.message || res?.message
  console.log(`\n[${test.title}] currency=${test.currency} settlement=${test.settlementCurrency || '-'}:`)
  console.log(` ok=${res.ok} status=${status || '-'} redirect=${res.paymentRedirectUrl ? 'yes' : 'no'}`)
  if (message) console.log(` message=${message}`)
}

async function main() {
  const cases: Case[] = [
    { title: 'USD + USD settlement', currency: 'USD', settlementCurrency: 'USD' },
    { title: 'USD (no settlement)', currency: 'USD' },
    { title: 'TWD (no settlement)', currency: 'TWD' },
  ]
  for (const c of cases) {
    try {
      await runCase(c)
    } catch (e: any) {
      console.error(`\n[${c.title}] Error:`, e?.message || e)
    }
  }
}

main().catch(err => {
  console.error('Fatal error running verification:', err)
  process.exit(1)
})
