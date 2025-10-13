/**
 * 检查 Stripe 订单状态的脚本
 * 运行: npx tsx scripts/check-stripe-orders.ts
 */

import { prisma } from '../app/models/db'

async function checkOrders() {
  console.log('🔍 检查最近的订单...\n')

  try {
    // 获取最近的 5 个订单
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    if (orders.length === 0) {
      console.log('❌ 没有找到任何订单')
      return
    }

    console.log(`✅ 找到 ${orders.length} 个最近的订单:\n`)

    for (const order of orders) {
      const details = (order.details as any) || {}

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📦 订单号: ${order.orderNo}`)
      console.log(`👤 用户ID: ${order.userId}`)
      console.log(`📧 用户邮箱: ${details.userEmail || '未知'}`)
      console.log(`💰 金额: ${order.amountCents / 100} ${order.currency}`)
      console.log(`📊 状态: ${order.status}`)
      console.log(`🎁 积分: ${order.creditsPoints || 0}`)
      console.log(`📦 套餐ID: ${order.packageId || '无'}`)
      console.log(`💳 支付方式: ${order.paymentProvider || '未知'}`)
      console.log(`🕐 创建时间: ${order.createdAt.toISOString()}`)
      console.log(`✅ 支付时间: ${order.paidAt ? order.paidAt.toISOString() : '未支付'}`)

      // 检查订单是否已处理
      if (order.status === 'paid') {
        console.log('✅ 订单状态: 已支付')

        // 检查用户积分
        if (order.userId) {
          const wallet = await prisma.wallet.findUnique({
            where: { userId: order.userId }
          })

          if (wallet) {
            console.log(`💎 当前积分余额: ${wallet.independentCredits}`)
          }

          // 检查是否有对应的套餐
          if (order.packageId) {
            const userPackage = await prisma.userPackage.findFirst({
              where: {
                userId: order.userId,
                packageId: order.packageId,
                isActive: true
              }
            })

            if (userPackage) {
              console.log(`📦 套餐状态: 已激活`)
              console.log(`📅 有效期: ${userPackage.startAt.toISOString()} - ${userPackage.endAt.toISOString()}`)
            } else {
              console.log(`⚠️  警告: 套餐未激活!`)
            }
          }
        }
      } else {
        console.log(`⏳ 订单状态: ${order.status} (未支付)`)
      }

      console.log('')
    }

    // 检查 Stripe webhook 相关信息
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💡 故障排查提示:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const pendingOrders = orders.filter(o => o.status !== 'paid')
    const paidOrders = orders.filter(o => o.status === 'paid')

    if (pendingOrders.length > 0) {
      console.log('⚠️  发现未支付的订单:')
      pendingOrders.forEach(o => {
        console.log(`   - ${o.orderNo} (${o.status})`)
      })
      console.log('\n📋 如果支付成功但状态未更新:')
      console.log('   1. 检查 Stripe CLI 是否在运行')
      console.log('   2. 检查开发服务器日志')
      console.log('   3. 检查 .env.local 中的 STRIPE_WEBHOOK_SECRET')
      console.log('')
    }

    if (paidOrders.length > 0) {
      console.log('✅ 已支付订单:')
      for (const o of paidOrders) {
        const wallet = o.userId ? await prisma.wallet.findUnique({
          where: { userId: o.userId }
        }) : null

        console.log(`   - ${o.orderNo}`)
        console.log(`     积分: ${o.creditsPoints || 0}`)
        console.log(`     当前余额: ${wallet?.independentCredits || 0}`)

        if (o.creditsPoints && wallet && wallet.independentCredits < o.creditsPoints) {
          console.log(`     ⚠️  积分可能未发放!`)
        }
      }
    }

  } catch (error) {
    console.error('❌ 检查订单时出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOrders()
