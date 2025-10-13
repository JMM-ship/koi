/**
 * 手动处理 pending 状态的订单
 * 用于修复 webhook 没有触发的情况
 *
 * 运行: npx tsx scripts/fix-pending-orders.ts <订单号>
 * 例如: npx tsx scripts/fix-pending-orders.ts ORD2025101217602796693051164
 */

import { handlePaymentSuccess } from '../app/service/orderProcessor'

async function fixOrder() {
  const orderNo = process.argv[2]

  if (!orderNo) {
    console.log('❌ 请提供订单号')
    console.log('用法: npx tsx scripts/fix-pending-orders.ts <订单号>')
    console.log('\n例如:')
    console.log('npx tsx scripts/fix-pending-orders.ts ORD2025101217602796693051164')
    process.exit(1)
  }

  console.log(`🔧 处理订单: ${orderNo}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // 模拟支付成功的详情
    const paymentDetails = {
      method: 'stripe',
      transactionId: `manual_fix_${Date.now()}`,
      paidAt: new Date().toISOString(),
      email: undefined,
      metadata: {
        note: 'Manually processed due to missed webhook'
      }
    }

    console.log('📝 处理支付成功...')
    const result = await handlePaymentSuccess(orderNo, paymentDetails)

    if (result.success) {
      console.log('✅ 订单处理成功!')
      console.log('   - 订单状态已更新为 paid')
      console.log('   - 积分已发放')
      console.log('   - 套餐已激活（如适用）')
    } else {
      console.log('❌ 处理失败:', result.error)
    }

  } catch (error: any) {
    console.error('❌ 处理订单时出错:', error.message)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('💡 提示: 请确保下次启动 Stripe CLI 以避免此问题')
}

fixOrder()
