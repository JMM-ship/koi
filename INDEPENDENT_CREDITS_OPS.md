# 独立积分（Independent Credits）运维手册

本文档覆盖“独立积分”SKU 的配置、发布、验证、回滚、日常维护与故障排查。

## 核心概念
- 独立积分与套餐积分不同：
  - 套餐积分（package pool）：仅在订阅有效期内生效，且有每日使用上限与恢复/重置逻辑。
  - 独立积分（independent pool）：随时有效，仅因实际使用而扣减，不受订阅是否激活与每日限额影响。

## 数据模型（Prisma）
- Package（套餐/商品信息）：`prisma/schema.prisma:104`
  - 独立积分 SKU 标识：`planType = 'credits'`
  - 金额：`priceCents`（分），`currency`（如 `USD`）
  - 额度：`dailyPoints` 表示“总积分数”（对 credits 套餐是总额，不是每日）
  - 有效期：独立积分 SKU 的 `validDays` 必须为 `NULL`（非 0）
- Wallet（钱包）：`prisma/schema.prisma:162`
  - 独立积分余额：`independentTokens`
  - 套餐积分余额：`packageTokensRemaining`
- CreditTransaction（积分流水）：`prisma/schema.prisma:268`
  - 关键字段：`type`（income/expense/reset）、`bucket`（package/independent）
- Order（订单）：`prisma/schema.prisma:138`
  - 独立积分订单：`order_type = 'credits'`

## 标准 SKU（credits_v2，USD）
- 定价比例：1 USD = 200 credits
- 六档 SKU：
  - 200 / $1
  - 1,000 / $5
  - 2,000 / $10
  - 5,000 / $25
  - 8,000 / $40
  - 10,000 / $50
- 存储：`version = 'credits_v2'`、`currency = 'USD'`、`validDays = NULL`、`features = { type:'independent', expiry:'never', totalCredits }`

## 发布与回滚
### 一键写入（会清理旧 credits）
- 脚本：`scripts/seed-credit-packages.ts`
- 命令：
```
npm run seed:credits:v2
```
- 行为：
  - 删除所有 `planType='credits'` 的旧 SKU
  - 插入上述 6 档标准 USD SKU（credits_v2）

### 发布前备份（建议）
- 以 SQL 快速导出（示例 Postgres）：
```
\copy (SELECT row_to_json(p) FROM packages p WHERE plan_type='credits') TO 'credits_backup.json'
```

### 回滚
1) 删除 v2：
```
DELETE FROM packages WHERE plan_type='credits' AND version='credits_v2';
```
2) 从备份恢复：按备份内容逐条 `INSERT` 回 `packages`。

## 验证与联调
### API 验证
- 列表：`GET /api/packages/credits`（`app/api/packages/credits/route.ts:1`）
  - 预期返回 6 条
  - 字段：`name` 英文（如 `200 Credits`）、`credits` 为整型额度、`price` 为美元金额（单位已是 USD）、`currency='USD'`

### 购买流程
1) 创建订单（独立积分）：`POST /api/orders/create`（`app/api/orders/create/route.ts:1`）
   - body 示例：`{ "orderType":"credits", "packageId":"<credits_sku_id>" }`
2) 支付：
   - 生产 Antom：`POST /api/orders/pay/antom`（`app/api/orders/pay/antom/route.ts:7`）
   - 开发 Mock：`POST /api/orders/pay/mock`（`app/api/orders/pay/mock/route.ts:6`）
3) 入账：成功回调后，服务端调用 `purchaseCredits` 增加钱包 `independentTokens` 并写入流水（income/independent）
   - 回调处理：`app/service/orderProcessor.ts:280`
   - 购买实现：`app/service/creditManager.ts:264`

### 前端展示
- 用户仪表的“Credits Packages”使用：`components/dashboard/IndependentPackages.tsx:1`
  - 金额单位由 API 的 `currency` 决定；USD 显示 `$`，数值不再 /100
  - 名称为英文：`200 Credits` 等

## 日常运维
### 调整/修复用户独立积分（管理员）
- 接口：`POST /api/admin/users/:uuid/credits`（`app/api/admin/users/[uuid]/credits/route.ts:8`）
  - body：`{ action: 'add'|'subtract'|'set', amount: number, reason: string }`
  - 结果：更新 `wallets.independentTokens`；写入 `credit_transactions`（bucket=independent）

### 巡检与查询
- 近期积分流水（独立池）：
```
SELECT id, user_id, type, points, bucket, created_at
FROM credit_transactions
WHERE bucket='independent'
ORDER BY created_at DESC
LIMIT 100;
```
- 用户余额：
```
SELECT user_id, independent_tokens
FROM wallets
WHERE independent_tokens > 0
ORDER BY updated_at DESC;
```

### 变更比例或档位
- 修改脚本数组 `CREDITS_V2`（`scripts/seed-credit-packages.ts:1`）
- 执行 `npm run seed:credits:v2`
- 验证列表接口与前端显示

## 环境与参数
- 货币：credits_v2 固定 `currency='USD'`，API 返回 `price` 为美元金额
- Antom 支付：可由包 `currency` 或 `ANTOM_PAYMENT_CURRENCY` 控制（见 `app/api/orders/pay/antom/route.ts:52`）

## 常见问题（FAQ）
- Q：插入失败，提示 `packages_valid_days_check`？
  - A：`validDays` 不能为 0；credits SKU 应设为 `NULL`。
- Q：前端价格显示为人民币或数值不正确？
  - A：前端组件 `components/dashboard/IndependentPackages.tsx:33` 显示货币符号；价格使用接口 `price`（美元），请勿再次 `/100`。
- Q：购买成功但独立积分未增加？
  - A：检查订单 `status=paid`；确认 `handlePaymentSuccess` 执行；检查用户 `wallets.independentTokens` 与 `credit_transactions` 是否写入 income/independent。
- Q：如何退款独立积分？
  - A：可用管理员调整接口（写流水，快速）；或使用服务 `refundCredits(userId, amount, orderNo, 'independent')`（`app/service/creditManager.ts:604`）。

## 变更实施检查表（Runbook）
1) 备份：导出 `plan_type='credits'` 的 `packages` 行
2) 发布：执行 `npm run seed:credits:v2`
3) 验证：
   - `GET /api/packages/credits` 返回 6 档 USD SKU
   - 前端仪表页展示 `$1.00/$5.00/...` 与英文名称
4) 观察：
   - 下单/支付/入账链路写到 `wallets` 与 `credit_transactions`
5) 回滚（如需）：删除 v2，按备份恢复原 SKU

