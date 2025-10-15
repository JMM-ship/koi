# 订阅套餐系统管理指南

> 本文档面向不熟悉该项目的开发者和运营人员，帮助快速理解和管理订阅套餐系统。

## 目录
- [系统概述](#系统概述)
- [核心概念](#核心概念)
- [数据库结构](#数据库结构)
- [完整业务流程](#完整业务流程)
- [代码架构](#代码架构)
- [常见操作指南](#常见操作指南)
- [定时任务](#定时任务)
- [故障排查](#故障排查)

---

## 系统概述

这是一个基于 **Next.js 14 + Prisma + PostgreSQL** 构建的 AI 服务订阅系统，提供：

- ✅ 套餐订阅管理（按天计费，套餐积分上限）
- ✅ 独立积分购买（一次性购买，永久有效）
- ✅ 双积分系统（套餐积分 + 独立积分）
- ✅ 订单与支付处理（支持 Stripe、Antom 等）
- ✅ 按小时持续恢复（基于套餐 `recoveryRate`）
- ✅ 每日使用限额（仅限制套餐积分的当日累计消耗）
- ✅ 手动重置到上限（每日限次）
- ✅ 套餐到期自动处理

---

## 核心概念

### 1. 套餐类型 (planType)

| 类型 | 说明 | 示例 |
|-----|------|-----|
| `basic` | 基础套餐 | 每日 1000 积分，30 天有效 |
| `pro` | 专业套餐 | 每日 5000 积分，30 天有效 |
| `enterprise` | 企业套餐 | 每日 20000 积分，365 天有效 |
| `credits` | 独立积分包 | 一次性 10000 积分（不按天重置）|

### 2. 双积分系统

#### 套餐积分 (packageTokensRemaining)
- 按小时持续恢复，直至达到 `creditCap`
- 套餐过期后清零
- 优先消耗；其消耗计入“每日使用限额”

#### 独立积分 (independentTokens)
- 一次性购买，永久有效
- 套餐积分不足时使用
- 不受“每日使用限额”限制

**消耗顺序：** 套餐积分 → 独立积分

### 3. 小时恢复与每日限额

- 恢复速度：按套餐 `features.recoveryRate` 定义（如 500/1000/2500 每小时）。
- 上限：`features.creditCap`，恢复与手动重置均不超过上限。
- 每日使用限额：`features.dailyUsageLimit`，仅统计“套餐积分”的当日累计消耗（UTC 同日窗口）。
- 手动重置：`features.manualResetPerDay` 次/日（按 UTC 日），将套餐余额直接提升到 `creditCap`。

恢复计算（简化示例）：
```
hours = (now - lastRecoveryAt) / 3600000
recovered = floor(hours * recoveryRate)
newPackageBalance = min(currentPackage + recovered, creditCap)
```

### 3. 订单类型

| 类型 | 说明 | 处理逻辑 |
|-----|------|---------|
| `package` | 套餐订单 | 创建 UserPackage 记录，重置套餐积分 |
| `credits` | 积分订单 | 增加独立积分 |

### 4. 订单状态

```
pending → processing → paid (成功)
          ↓
       failed/cancelled (失败)
```

| 状态 | 说明 |
|-----|------|
| `pending` | 待支付 |
| `processing` | 处理中 |
| `paid` | 已支付（激活积分）|
| `failed` | 支付失败 |
| `cancelled` | 已取消 |
| `refunded` | 已退款 |

---

## 数据库结构

### 核心表关系

```
User (用户)
  ├─ UserPackage (用户套餐)
  │    └─ Package (套餐模板)
  ├─ Wallet (钱包/积分余额)
  ├─ Order (订单)
  └─ CreditTransaction (积分流水)
```

### 1. Package (套餐模板)
**位置：** `prisma/schema.prisma:104-128`

```prisma
model Package {
  id            String   @id @default(uuid())
  name          String   // 套餐名称，如 "基础套餐"
  version       String   // 版本号，如 "v1.0"
  priceCents    Int      // 价格（分），如 999 = 9.99 USD
  currency      String   // 货币，如 "USD"
  dailyPoints   Int      // 每日积分配额
  planType      String   // 套餐类型：basic/pro/enterprise/credits
  validDays     Int?     // 有效天数，如 30
  features      Json     // 功能特性 { isRecommended: true, ... }
  limitations   Json     // 限制条件 { maxFileSize: "10MB", ... }
  isActive      Boolean  // 是否激活
  sortOrder     Int      // 排序顺序
}
```

**示例数据：**
```json
{
  "name": "Pro 套餐",
  "version": "v1.0",
  "priceCents": 2999,
  "currency": "USD",
  "dailyPoints": 5000,
  "planType": "pro",
  "validDays": 30,
  "features": {
    "isRecommended": true,
    "supportPriority": "high",
    "maxRequests": 1000
  },
  "isActive": true,
  "sortOrder": 2
}
```

### 唯一激活策略（每层级仅保留 1 条激活记录）
- 目标：避免前端出现多个同层级（Plus/Pro/Max）卡片。
- 方式：
  - 去重脚本：`npm run packages:dedupe-only`（按 `updatedAt`/`createdAt` 保留最新一条，其他 `isActive=false`）
  - 强制约束：`npm run db:index:packages-unique-active`（创建部分唯一索引，限制 `plan_type IN ('basic','pro','enterprise') AND is_active=true` 的唯一性）
- 一次性执行两步：`npm run packages:enforce-unique`


### 2. UserPackage (用户套餐)
**位置：** `prisma/schema.prisma:202-224`

```prisma
model UserPackage {
  id               String   @id
  userId           String   // 用户ID
  packageId        String   // 套餐ID
  orderId          String?  // 订单ID
  startAt          DateTime // 开始时间
  endAt            DateTime // 结束时间
  dailyPoints      Int      // 每日积分
  dailyQuotaTokens BigInt   // 每日配额
  isActive         Boolean  // 是否激活
  packageSnapshot  Json     // 套餐快照（购买时的套餐信息）
}
```

**作用：**
- 记录用户购买的套餐实例
- 同一时间只有一个 `isActive=true` 的套餐
- 保存购买时的套餐信息快照（防止套餐模板修改影响已购用户）

### 3. Wallet (钱包)
（关键字段已升级以支持小时恢复、每日限额与手动重置）

```prisma
model Wallet {
  userId                  String    @id
  packageDailyQuotaTokens BigInt
  packageTokensRemaining  BigInt
  independentTokens       BigInt
  lockedTokens            BigInt
  version                 Int

  // 每日使用量跟踪（仅套餐消耗计入）
  dailyUsageCount         BigInt     @default(0)
  dailyUsageResetAt       DateTime?

  // 手动重置跟踪
  manualResetCount        Int        @default(0)
  manualResetAt           DateTime?

  // 恢复时间基准
  lastRecoveryAt          DateTime?
}
```

字段说明：
- `packageTokensRemaining`：当前套餐剩余积分（受上限与小时恢复影响）
- `independentTokens`：独立购买的积分（不受每日限额）
- `dailyUsageCount` / `dailyUsageResetAt`：记录 UTC 当日套餐消耗与重置基准
- `manualResetCount` / `manualResetAt`：手动重置的当日计数与时间
- `lastRecoveryAt`：上次触发自动恢复的时间基准
- `version`：乐观锁并发控制

### 4. Order (订单)
**位置：** `prisma/schema.prisma:131-158`

```prisma
model Order {
  id                String    @id
  orderNo           String    @unique  // 订单号
  userId            String    // 用户ID
  status            String    // 订单状态
  amountCents       Int       // 金额（分）
  currency          String    // 货币
  productType       String    // 产品类型：package/credits
  packageId         String?   // 套餐ID（package订单）
  creditsPoints     Int?      // 积分数量（credits订单）
  paymentProvider   String?   // 支付提供商：stripe/antom
  paymentSessionId  String?   // 支付会话ID
  paidAt            DateTime? // 支付时间
  details           Json      // 订单详情
}
```

### 5. CreditTransaction (积分流水)
**位置：** `prisma/schema.prisma:259-285`

```prisma
model CreditTransaction {
  id                      String   @id
  userId                  String   // 用户ID
  type                    String   // 类型：income/expense/reset
  bucket                  String   // 积分类型：package/independent
  tokens                  Int      // 数量
  points                  Int      // 积分
  beforePackageTokens     BigInt?  // 操作前套餐积分
  afterPackageTokens      BigInt?  // 操作后套餐积分
  beforeIndependentTokens BigInt?  // 操作前独立积分
  afterIndependentTokens  BigInt?  // 操作后独立积分
  requestId               String?  // 请求ID
  orderId                 String?  // 订单ID
  reason                  String?  // 原因描述
  meta                    Json     // 元数据
}
```

### 6. 手动重置（Manual Reset）

**语义**
- 仅作用于订阅套餐积分池（`packageTokensRemaining`），独立积分不限制且不变更。
- 计数窗口按 UTC 日历天重置（UTC 00:00）。同一 UTC 日内可重置次数由套餐 `features.manualResetPerDay` 决定（默认 1）。
- 重置效果：将套餐余额直接提升到上限 `creditCap`（不超过上限）。
- 多套餐并存时，以 `endAt` 最新的活跃套餐为当前套餐。

**Wallet 字段交互**
- `packageTokensRemaining`：设为 `creditCap`
- `manualResetCount`：同一 UTC 日 +1；跨日重置为 1
- `manualResetAt`：写入当前 UTC 时间
- `lastRecoveryAt`：写入当前 UTC 时间（重置后重新开始小时恢复窗口）
- `version`：+1（乐观锁）

**事务与并发**
- 单一事务：读取套餐/钱包 → 校验 → 原子更新 Wallet（`WHERE userId AND version = oldVersion`）→ 写入流水
- 冲突（更新计数=0）即失败，不做自动重试

**流水记录**
- 仅在实际有提升量时写入 `credit_transactions`：
  - `type: 'reset'`
  - `bucket: 'package'`
  - `tokens/points = creditCap - beforePackageTokens`
  - `beforePackageTokens/afterPackageTokens`：重置前/后；独立积分前后为 `null`
  - `orderId: null`
  - `reason: '手动重置到上限'`
  - `meta`：`{ source: 'manualResetCredits', creditCap, manualResetPerDay, resetsTodayBefore, resetsTodayAfter, atUtc }`

代码参考：
- 服务：`app/service/creditRecoveryService.ts:manualResetCredits`

### 7. 小时恢复（Auto Recovery）

语义与要点：
- 仅作用于套餐积分池（独立积分不参与）。
- 从活跃套餐（`isActive=true && endAt>now`，若多条取 `endAt` 最新）解析 `features`：
  - `creditCap`、`recoveryRate`、`dailyUsageLimit`、`manualResetPerDay`
- 基准时间：`lastRecoveryAt || wallet.updatedAt || wallet.createdAt`。
- 事务 + 乐观锁更新 Wallet，只有实际恢复量 > 0 时写 `income/package` 流水。

实现与注入：
- `autoRecoverCredits(userId, { now? })` 支持注入 `now`，用于确定性测试与预生产回放。
- 定时作业透传 `now`：`hourlyRecoveryJob({ now })`。

### 8. API 参考（已实现）

**1) POST `/api/credits/manual-reset`**
- 认证：登录用户
- 请求体：`{}`（可选 `requestId` 便于幂等）
- 响应：
```json
{
  "success": true,
  "data": {
    "resetAmount": 3000,
    "newBalance": 6000,
    "resetsRemainingToday": 0,
    "nextAvailableAtUtc": "2025-10-02T00:00:00.000Z"
  },
  "timestamp": "2025-10-02T01:02:03.456Z"
}
```
- 失败示例：
```json
{
  "success": false,
  "error": { "code": "LIMIT_REACHED", "message": "LIMIT_REACHED" },
  "resetsRemainingToday": 0,
  "nextAvailableAtUtc": "2025-10-03T00:00:00.000Z",
  "timestamp": "2025-10-02T01:02:03.456Z"
}
```
- 错误码：`NO_ACTIVE_PACKAGE | LIMIT_REACHED | ALREADY_AT_CAP | UNAUTHORIZED`

**2) GET `/api/credits/info`**
- 认证：登录用户
- 响应示例：
```json
{
  "success": true,
  "data": {
    "balance": {
      "packageTokensRemaining": 3250,
      "independentTokens": 0,
      "totalAvailable": 3250
    },
    "packageConfig": {
      "creditCap": 6000,
      "recoveryRate": 500,
      "dailyUsageLimit": 18000,
      "manualResetPerDay": 1
    },
    "usage": {
      "dailyUsageCount": 750,
      "dailyUsageLimit": 18000,
      "resetsRemainingToday": 1,
      "nextResetAtUtc": "2025-10-02T00:00:00.000Z",
      "lastRecoveryAt": "2025-10-01T09:30:00.000Z"
    }
  },
  "timestamp": "2025-10-02T01:02:03.456Z"
}
```

**3) POST `/api/credits/use`**
- 认证：登录用户
- 请求体：`{ "amount": number, "service": string, "metadata?": object, "requestId?": string }`
- 响应（成功示例）：
```json
{
  "success": true,
  "data": {
    "transaction": { "transNo": "uuid", "amount": 900, "creditType": "package" },
    "balance": { "packageCredits": 5500, "independentCredits": 600, "totalAvailable": 6100 }
  },
  "timestamp": "2025-10-02T01:02:03.456Z"
}
```
- 失败示例（余额不足或每日限额触发）：
```json
{
  "success": false,
  "error": { "code": "INSUFFICIENT_CREDITS", "message": "Insufficient credits" },
  "timestamp": "2025-10-02T01:02:03.456Z"
}
```
```json
{
  "success": false,
  "error": { "code": "DAILY_LIMIT_REACHED", "message": "DAILY_LIMIT_REACHED" },
  "remainingToday": 500,
  "timestamp": "2025-10-02T01:02:03.456Z"
}
```

说明：
- 优先套餐池扣减；若套餐受每日限额裁剪后无法由独立池补足，总体余额充足也会优先返回 `DAILY_LIMIT_REACHED`。
- 幂等：传入相同 `requestId` 将只扣减一次，并返回同一条流水（软幂等）。

实现建议：
- 手动重置：直接复用 `manualResetCredits()` 的返回，补充 `resetsRemainingToday` 与 `nextAvailableAtUtc` 计算。
- 积分信息：组合 Wallet + 活跃套餐 features，按 UTC 生成 `nextResetAtUtc`。

**流水类型：**
- `income`：充值/购买
- `expense`：消耗/使用
- `reset`：每日重置

---

## 完整业务流程

### 流程 1：用户购买套餐

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 选择套餐 │ -> │ 创建订单 │ -> │ 支付成功 │ -> │ 激活套餐 │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

#### 步骤详解

**1. 用户选择套餐**
- API: `GET /api/packages`
- 代码: `app/models/package.ts:77` (`getActivePackages()`)
- 返回所有激活的套餐列表

**2. 创建订单**
- API: `POST /api/orders/create`
- 代码: `app/service/orderProcessor.ts:49` (`createOrder()`)

```typescript
// 请求示例
{
  "orderType": "package",
  "packageId": "uuid-xxx-xxx",
  "paymentMethod": "stripe"
}
```

**处理逻辑：**
```typescript
// 1. 生成订单号
orderNo = `ORD${year}${month}${day}${timestamp}${random}`

// 2. 获取套餐信息
package = await getPackageById(packageId)

// 3. 计算金额和积分
amount = package.priceCents / 100
credits = package.dailyPoints * package.validDays

// 4. 创建套餐快照
packageSnapshot = {
  id, name, version, price,
  dailyCredits, validDays, features
}

// 5. 创建订单记录
await insertOrder({
  order_no: orderNo,
  user_id: userId,
  status: 'pending',
  amount, credits, currency,
  order_type: 'package',
  package_id: packageId,
  package_snapshot: packageSnapshot,
  expired_at: now + 30分钟
})

// 6. 返回支付URL
return { orderNo, paymentUrl }
```

**3. 支付处理**
- Webhook: `POST /api/orders/pay/antom/notify` (Antom)
- 代码: `app/service/orderProcessor.ts:214` (`handlePaymentSuccess()`)

```typescript
// 支付成功处理流程
async function handlePaymentSuccess(orderNo, paymentDetails) {
  // 1. 验证订单状态
  if (order.status !== 'pending') {
    return { error: 'Invalid order status' }
  }

  // 2. 更新订单状态为 paid
  await updateOrderStatus(orderNo, 'paid', paidAt)

  // 3. 根据订单类型处理
  if (order.order_type === 'package') {
    await purchasePackage(userId, packageId, orderNo)
  } else if (order.order_type === 'credits') {
    await purchaseCredits(userId, creditAmount, orderNo)
  }

  // 4. 发送确认邮件（TODO）
  // 5. 处理推广佣金（TODO）
}
```

**4. 激活套餐**
- 代码: `app/service/packageManager.ts:26` (`purchasePackage()`)

```typescript
async function purchasePackage(userId, packageId, orderNo) {
  // 1. 计算套餐起止时间
  startDate = new Date()
  endDate = new Date(startDate + validDays)

  // 2. 创建用户套餐（自动将旧套餐设为 isActive=false）
  await createUserPackage({
    user_id: userId,
    package_id: packageId,
    order_no: orderNo,
    start_date: startDate,
    end_date: endDate,
    daily_credits: dailyPoints,
    package_snapshot: packageSnapshot
  })

  // 3. 重置套餐积分到新套餐的日积分值
  await resetPackageCreditsForNewPackage(
    userId,
    dailyPoints,
    orderNo
  )
}
```

**5. 积分处理**
- 代码: `app/service/creditManager.ts:235` (`resetPackageCreditsForNewPackage()`)

```typescript
// 使用事务确保数据一致性
await prisma.$transaction(async (tx) => {
  // 1. 获取当前余额
  currentBalance = await getCreditBalance(userId)

  // 2. 更新 Wallet 表
  await prisma.wallet.upsert({
    where: { userId },
    update: {
      packageTokensRemaining: dailyPoints,
      packageResetAt: tomorrow_0am,
      version: { increment: 1 }  // 乐观锁
    },
    create: {
      userId,
      packageTokensRemaining: dailyPoints,
      packageDailyQuotaTokens: dailyPoints,
      independentTokens: 0
    }
  })

  // 3. 创建积分流水
  await createCreditTransaction({
    user_id: userId,
    type: 'reset',
    credit_type: 'package',
    amount: dailyPoints,
    before_balance: currentBalance.total,
    after_balance: dailyPoints + currentBalance.independent_credits,
    order_no: orderNo,
    description: '购买套餐重置积分'
  })
})
```

---

### 流程 2：用户购买独立积分

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 选择积分 │ -> │ 创建订单 │ -> │ 支付成功 │ -> │ 增加积分 │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

**创建订单请求：**
```typescript
{
  "orderType": "credits",
  "creditAmount": 10000  // 购买 10000 积分
}
```

**激活积分：**
- 代码: `app/service/creditManager.ts:112` (`purchaseCredits()`)

```typescript
async function purchaseCredits(userId, amount, orderNo) {
  await prisma.$transaction(async (tx) => {
    // 1. 更新独立积分
    await prisma.wallet.update({
      where: { userId },
      data: {
        independentTokens: { increment: amount }
      }
    })

    // 2. 创建流水
    await createCreditTransaction({
      user_id: userId,
      type: 'income',
      credit_type: 'independent',
      amount,
      description: '购买独立积分'
    })
  })
}
```

---

### 流程 3：用户消耗积分

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 调用API  │ -> │ 检查余额 │ -> │ 扣减积分 │ -> │ 记录流水 │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

**代码：** `app/service/creditManager.ts:46` (`useCredits()`)

```typescript
async function useCredits(userId, amount, service, metadata) {
  // 1. 检查余额
  balance = await getCreditBalance(userId)
  if (balance.total < amount) {
    return { error: 'Insufficient credits' }
  }

  // 2. 扣减积分（带乐观锁）
  await prisma.wallet.update({
    where: {
      userId,
      version: balance.version  // 乐观锁
    },
    data: {
      // 优先消耗套餐积分
      packageTokensRemaining: {
        decrement: Math.min(amount, balance.packageTokensRemaining)
      },
      // 套餐积分不足时消耗独立积分
      independentTokens: {
        decrement: Math.max(0, amount - balance.packageTokensRemaining)
      },
      version: { increment: 1 }
    }
  })

  // 3. 创建消耗流水
  await createCreditTransaction({
    user_id: userId,
    type: 'expense',
    amount,
    description: `${service}服务消耗`
  })
}
```

---

### 流程 4：每日积分重置

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 定时触发 │ -> │ 查询用户 │ -> │ 重置积分 │ -> │ 记录流水 │
│ (0:00)  │    │ (活跃套餐)│    │          │    │          │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

**代码：** `app/service/packageManager.ts:191` (`dailyResetTask()`)

```typescript
async function dailyResetTask() {
  // 1. 先处理过期套餐
  await deactivateExpiredPackages()

  // 2. 获取所有活跃套餐用户
  activeUsers = await getAllActivePackageUsers()
  // 返回: [{ userId, dailyCredits }, ...]

  // 3. 批量重置积分
  await batchResetPackageCredits(
    activeUsers.map(u => ({
      userId: u.userId,
      dailyCredits: u.dailyCredits
    }))
  )

  // 4. 批量创建重置流水
  await batchCreateResetTransactions(resetData)
}
```

**批量重置实现：**
```sql
-- 批量更新 Wallet 表
UPDATE wallets
SET
  package_tokens_remaining = daily_credits,
  package_reset_at = NOW() + INTERVAL '1 day',
  updated_at = NOW()
WHERE user_id IN (...)
```

---

## 代码架构

### 目录结构

```
app/
├── models/                    # 数据层（直接操作数据库）
│   ├── package.ts            # 套餐模板 CRUD
│   ├── userPackage.ts        # 用户套餐 CRUD
│   ├── order.ts              # 订单 CRUD
│   ├── creditBalance.ts      # 积分余额操作
│   └── creditTransaction.ts  # 积分流水记录
│
├── service/                   # 业务逻辑层
│   ├── packageManager.ts     # 套餐管理（购买、续费、过期处理）
│   ├── orderProcessor.ts     # 订单处理（创建、支付、退款）
│   ├── creditManager.ts      # 积分管理（充值、消耗、重置）
│   └── cronJobs.ts           # 定时任务（每日重置、过期检查）
│
└── api/                       # API 路由层
    ├── packages/
    │   └── route.ts          # GET /api/packages - 获取套餐列表
    ├── orders/
    │   ├── create/route.ts   # POST /api/orders/create - 创建订单
    │   └── pay/
    │       ├── antom/route.ts        # POST /api/orders/pay/antom
    │       └── antom/notify/route.ts # Webhook
    └── credits/
        └── check-reset/route.ts  # GET /api/credits/check-reset
```

### 层级调用关系

```
API Layer (route.ts)
    ↓
Service Layer (xxxManager.ts)
    ↓
Model Layer (model/xxx.ts)
    ↓
Database (Prisma + PostgreSQL)
```

**示例：购买套餐调用链**
```
POST /api/orders/create
  → orderProcessor.createOrder()
    → getPackageById()  (models/package.ts)
    → insertOrder()     (models/order.ts)

Webhook: /api/orders/pay/antom/notify
  → orderProcessor.handlePaymentSuccess()
    → packageManager.purchasePackage()
      → createUserPackage()              (models/userPackage.ts)
      → creditManager.resetPackageCreditsForNewPackage()
        → getCreditBalance()             (models/creditBalance.ts)
        → resetPackageCredits()          (models/creditBalance.ts)
        → createCreditTransaction()      (models/creditTransaction.ts)
```

---

## 常见操作指南

### 1. 创建新套餐

#### 方法 A：使用 Prisma Studio（推荐）

```bash
npm run prisma:studio
```

打开 `http://localhost:5555`，在 `Package` 表中添加记录：

```json
{
  "name": "新套餐",
  "version": "v1.0",
  "priceCents": 1999,
  "currency": "USD",
  "dailyPoints": 3000,
  "planType": "pro",
  "validDays": 30,
  "features": {
    "isRecommended": true,
    "maxRequests": 500
  },
  "limitations": {},
  "isActive": true,
  "sortOrder": 10
}
```

#### 方法 B：使用代码

```typescript
import { createPackage } from '@/app/models/package'

await createPackage({
  name: "新套餐",
  version: "v1.0",
  priceCents: 1999,
  currency: "USD",
  dailyPoints: 3000,
  planType: "pro",
  validDays: 30,
  features: { isRecommended: true },
  isActive: true,
  sortOrder: 10
})
```

### 2. 查看用户套餐状态

```typescript
import { getUserActivePackage } from '@/app/models/userPackage'
import { getCreditBalance } from '@/app/models/creditBalance'

// 获取活跃套餐
const activePackage = await getUserActivePackage(userId)
console.log({
  packageName: activePackage?.package_snapshot?.name,
  dailyCredits: activePackage?.daily_credits,
  startDate: activePackage?.start_date,
  endDate: activePackage?.end_date,
  isActive: activePackage?.is_active
})

// 获取积分余额
const balance = await getCreditBalance(userId)
console.log({
  packageCredits: balance.package_credits,
  independentCredits: balance.independent_credits,
  total: balance.package_credits + balance.independent_credits,
  resetAt: balance.package_reset_at
})
```

### 3. 手动为用户充值积分（管理员操作）

```typescript
import { addIndependentCredits } from '@/app/models/creditBalance'
import { createCreditTransaction } from '@/app/models/creditTransaction'

// 增加独立积分
await addIndependentCredits(userId, 5000)

// 创建流水记录
await createCreditTransaction({
  user_id: userId,
  type: 'income',
  credit_type: 'independent',
  amount: 5000,
  description: '管理员手动充值',
  metadata: { adminId: 'xxx', reason: '补偿' }
})
```

### 4. 查询用户订单历史

```typescript
import { findOrdersByUserId } from '@/app/models/order'

const orders = await findOrdersByUserId(userId, {
  page: 1,
  pageSize: 10,
  status: 'paid'  // 可选：筛选状态
})

orders.forEach(order => {
  console.log({
    orderNo: order.order_no,
    type: order.order_type,
    amount: order.amount,
    status: order.status,
    paidAt: order.paid_at
  })
})
```

### 5. 手动触发积分重置

```typescript
import { dailyResetTask } from '@/app/service/packageManager'

// 重置所有用户
const result = await dailyResetTask()
console.log(`重置完成: ${result.resetCount} 个用户`)
```

### 6. 处理套餐过期

```typescript
import { checkAndExpirePackages } from '@/app/service/packageManager'

// 查找并处理过期套餐
const expiredCount = await checkAndExpirePackages()
console.log(`处理了 ${expiredCount} 个过期套餐`)
```

---

## 定时任务（小时恢复为主）

### 配置

**位置：** `app/service/cronJobs.ts:getCronJobConfigs()`

| 任务 | 时间 | 说明 |
|-----|------|------|
| Hourly Credit Recovery | 每小时第 5 分 | 按用户 `lastRecoveryAt` 与 `now` 计算恢复量（受 `ENABLE_HOURLY_RECOVERY` 控制） |
| Daily Credit Reset | 每天 0:00 | 旧的每日重置（默认禁用，`ENABLE_DAILY_RESET=false`） |
| Package Expiry Check | 每天 1:00 | 检查并处理过期套餐 |
| Expired Order Cleanup | 每天 2:00 | 清理过期未支付订单 |

### 启用定时任务

**环境变量：** `.env` 或 `.env.local`

```bash
ENABLE_HOURLY_RECOVERY=true
ENABLE_DAILY_RESET=false
HOURLY_RECOVERY_PAGE_SIZE=500
HOURLY_RECOVERY_CONCURRENCY=5
TZ=Asia/Shanghai
```

### 运行方式

#### 方式 1：使用 cron 调度器（推荐生产环境）

```bash
npm run cron
```

**实现：** `scripts/cron-scheduler.ts`
```typescript
import cron from 'node-cron'
import { getCronJobConfigs } from '@/app/service/cronJobs'

const configs = getCronJobConfigs()

configs.forEach(config => {
  if (config.enabled) {
    cron.schedule(config.schedule, async () => {
      console.log(`Running job: ${config.name}`)
      await config.handler()
    })
  }
})
```

#### 方式 2：运行一次

```bash
npm run cron:once
```

#### 方式 3：通过 API 手动触发（开发/调试）

```bash
curl -X POST https://your-domain.com/api/admin/jobs/trigger \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"jobName": "Daily Credit Reset"}'
```

### 定时任务日志

定时任务执行结果会记录到控制台：

```
[2025-10-01T00:00:00.000Z] Starting daily credit reset job...
[2025-10-01T00:00:05.123Z] Credit reset completed: 1234/1234 users processed successfully

[2025-10-01T01:00:00.000Z] Starting package expiry check job...
[2025-10-01T01:00:02.456Z] Package expiry check completed: 5 packages expired
```

---

## 故障排查

### 问题 1：用户积分未恢复/未变化

**症状：** 预期在小时恢复后，套餐积分没有按速率恢复；或 Info 接口 `usage.lastRecoveryAt` 长时间未更新

**排查步骤：**

1. **检查定时任务是否运行**
   ```bash
   # 查看 cron 进程
   ps aux | grep cron

   # 检查环境变量
   echo $ENABLE_CRON_JOBS
   ```

2. **手动触发小时恢复**
  ```typescript
  import { hourlyRecoveryJob } from '@/app/service/cronJobs'
  const result = await hourlyRecoveryJob({ now: new Date() })
  console.log(result)
  ```

3. **检查用户套餐状态**
   ```typescript
   const activePackage = await getUserActivePackage(userId)
   if (!activePackage) {
     console.log('用户没有活跃套餐')
   } else if (new Date(activePackage.end_date) < new Date()) {
     console.log('用户套餐已过期')
   }
   ```

4. **检查 Wallet 表**
  ```sql
  SELECT
    user_id,
    package_tokens_remaining,
    daily_usage_count,
    daily_usage_reset_at,
    manual_reset_count,
    manual_reset_at,
    last_recovery_at,
    updated_at
  FROM wallets
  WHERE user_id = 'xxx';
  ```

### 问题 2：支付成功但积分未到账

**症状：** 订单状态为 `paid`，但用户积分未增加

**排查步骤：**

1. **检查订单状态**
   ```typescript
   const order = await findOrderByOrderNo(orderNo)
   console.log({
     status: order.status,
     paidAt: order.paid_at,
     orderType: order.order_type
   })
   ```

2. **检查 UserPackage 表**（套餐订单）
   ```sql
   SELECT * FROM user_packages
   WHERE order_id = 'orderNo'
   ```

3. **检查积分流水**
   ```sql
   SELECT * FROM credit_transactions
   WHERE order_id = 'orderNo'
   ORDER BY created_at DESC;
   ```

4. **手动补偿（谨慎操作）**
   ```typescript
   if (order.order_type === 'package') {
     await purchasePackage(userId, order.package_id, orderNo)
   } else {
     await purchaseCredits(userId, order.credit_amount, orderNo)
   }
   ```

### 问题 3：套餐过期但仍可使用

**症状：** 套餐 `endDate` 已过期，但 `isActive=true`，用户仍可使用

**排查步骤：**

1. **手动触发过期检查**
   ```typescript
   const expiredCount = await checkAndExpirePackages()
   console.log(`处理了 ${expiredCount} 个过期套餐`)
   ```

2. **检查定时任务配置**
   ```typescript
   import { getCronJobConfigs } from '@/app/service/cronJobs'
   const configs = getCronJobConfigs()
   console.log(configs.find(c => c.name === 'Package Expiry Check'))
   ```

3. **检查数据库数据**
   ```sql
   SELECT
     id, user_id, end_at, is_active
   FROM user_packages
   WHERE is_active = true
     AND end_at < NOW();
   ```

### 问题 4：乐观锁冲突

**症状：** 错误日志中出现 `Record to update not found` 或 `Version mismatch`

**原因：** 高并发情况下，多个请求同时更新 `Wallet` 表，触发乐观锁

**解决方案：**

```typescript
// 增加重试逻辑
async function useCreditWithRetry(userId, amount, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await useCredits(userId, amount)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)))
    }
  }
}
```

### 问题 5：积分流水不一致

**症状：** `CreditTransaction` 表中的流水与 `Wallet` 表的余额不匹配

**排查步骤：**

1. **计算流水总和**
   ```sql
   SELECT
     user_id,
     SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as calculated_balance
   FROM credit_transactions
   WHERE user_id = 'xxx'
   GROUP BY user_id;
   ```

2. **对比钱包余额**
   ```sql
   SELECT
     user_id,
     package_tokens_remaining + independent_tokens as actual_balance
   FROM wallets
   WHERE user_id = 'xxx';
   ```

3. **检查事务日志**
   - 查看是否有事务失败但部分操作成功的情况
   - 检查 Prisma 事务的 `timeout` 和 `maxWait` 配置

---

## 最佳实践

### 1. 数据一致性

✅ **使用事务包裹关键操作**
```typescript
await prisma.$transaction(async (tx) => {
  await updateWallet(tx)
  await createTransaction(tx)
}, {
  maxWait: 30000,
  timeout: 30000
})
```

✅ **使用乐观锁防止并发冲突**
```typescript
await prisma.wallet.update({
  where: {
    userId,
    version: currentVersion  // 乐观锁
  },
  data: {
    balance: newBalance,
    version: { increment: 1 }
  }
})
```

### 2. 错误处理

✅ **捕获并记录所有错误**
```typescript
try {
  await purchasePackage(userId, packageId, orderNo)
} catch (error) {
  console.error('Failed to purchase package:', error)
  // 记录到错误日志系统
  // 发送告警通知
  throw error
}
```

✅ **支付失败时更新订单状态**
```typescript
if (paymentFailed) {
  await updateOrderStatus(orderNo, 'failed', paidAt, reason)
}
```

### 3. 性能优化

✅ **批量操作代替循环**
```typescript
// ❌ 不推荐
for (const user of users) {
  await resetCredits(user.id)
}

// ✅ 推荐
await batchResetPackageCredits(users.map(u => ({
  userId: u.id,
  dailyCredits: u.dailyCredits
})))
```

✅ **使用数据库索引**
```prisma
@@index([userId, isActive])
@@index([status, createdAt])
```

### 4. 测试

✅ **编写单元测试**
```typescript
// tests/service/packageManager.test.ts
describe('purchasePackage', () => {
  it('should create UserPackage and reset credits', async () => {
    const result = await purchasePackage(userId, packageId, orderNo)
    expect(result.success).toBe(true)

    const balance = await getCreditBalance(userId)
    expect(balance.package_credits).toBe(1000)
  })
})
```

---

## 附录：常用命令

```bash
# 数据库相关
npm run prisma:generate    # 生成 Prisma 客户端
npm run prisma:migrate     # 运行数据库迁移
npm run prisma:push        # 推送 schema 到数据库
npm run prisma:studio      # 打开数据库管理界面

# 定时任务
npm run cron              # 启动定时任务调度器
npm run cron:once         # 执行一次所有定时任务

# 测试脚本
npm run reset:credits     # 重置用户积分
npm run test:db           # 测试数据库连接

# 开发
npm run dev               # 启动开发服务器
npm run build             # 构建生产版本
npm run lint              # 运行代码检查
```

---

## 联系与支持

如有问题或建议，请通过以下方式联系：

- 📖 项目文档：`/CLAUDE.md`
- 🐛 问题反馈：GitHub Issues
- 📧 技术支持：your-email@example.com

---

**文档版本：** v1.0
**最后更新：** 2025-10-01
**作者：** AI Assistant (Claude Code)
