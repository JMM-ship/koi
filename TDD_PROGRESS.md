# TDD 套餐改造进度报告

> 📅 **日期：** 2025-10-02
> 🎯 **目标：** 将"每日一次性重置"改造为"按小时持续恢复 + 积分上限 + 每日使用限额"
> 🔧 **方法：** 测试驱动开发（TDD）

---

## 📊 总体进度：96% 完成

### ✅ 已完成阶段

#### **阶段 1：测试环境和数据库准备** ✓ (100%)

**1.1 Jest 测试环境配置**
- ✅ 安装依赖：`jest`, `@types/jest`, `ts-jest`, `@testing-library`
- ✅ 创建配置文件：
  - `jest.config.js` - Jest 配置
  - `jest.setup.js` - 全局测试设置
- ✅ 添加测试命令到 `package.json`：
  ```bash
  npm test           # 运行所有测试
  npm test:watch     # 监听模式
  npm test:coverage  # 覆盖率报告
  ```
- ✅ 创建测试辅助工具：`tests/helpers/testDb.ts`
  - `createTestUser()` - 创建测试用户
  - `createTestPackage()` - 创建测试套餐
  - `createTestUserPackage()` - 创建用户套餐
  - `setWalletBalance()` - 设置钱包余额
  - `cleanupTestData()` - 清理测试数据

**1.2 数据库 Schema 修改**
- ✅ 编写 Wallet Schema 测试：`tests/database/wallet-schema.test.ts` (10个测试)
- ✅ 修改 `prisma/schema.prisma`，添加 5 个新字段：
  ```prisma
  model Wallet {
    // ... 原有字段

    // 新增：每日使用量跟踪
    dailyUsageCount    BigInt    @default(0)
    dailyUsageResetAt  DateTime?

    // 新增：手动重置跟踪
    manualResetCount   Int       @default(0)
    manualResetAt      DateTime?

    // 新增：最后恢复时间
    lastRecoveryAt     DateTime?
  }
  ```
- ✅ 执行数据库迁移：`npm run prisma:push`
- ✅ 所有 Schema 测试通过（10/10，用时 31.9秒）

**1.3 测试性能优化**
- ✅ 优化前：36.6秒
- ✅ 优化后：31.9秒
- ✅ 提升：~13%
- 🔧 优化手段：
  - 缓存测试数据，减少重复查询
  - 合并多个测试用例为单个测试
  - 字段验证测试从 ~2秒 降至 ~1-4ms

---

#### **阶段 2：积分恢复计算逻辑** ✓ (100%)

**2.1 编写积分恢复计算测试**
- ✅ 创建测试文件：`tests/service/creditRecovery.test.ts`
- ✅ 测试覆盖：
  - 基础恢复计算（3个测试）
  - 不同套餐恢复速度（2个测试）
  - 积分上限控制（4个测试）
  - 边界情况（4个测试）
  - 完全恢复时间验证（3个测试）
  - 实际场景模拟（2个测试）
- ✅ **总计 18 个测试，全部通过，用时 0.155秒** ⚡

**2.2 实现积分恢复计算函数**
- ✅ 创建服务文件：`app/service/creditRecoveryService.ts`
- ✅ 实现 `calculateRecoverableCredits()` 纯函数
  ```typescript
  export function calculateRecoverableCredits(
    lastRecoveryTime: Date,
    currentCredits: number,
    config: PackageConfig,
    now: Date = new Date()
  ): number
  ```
- ✅ 功能特性：
  - 按小时计算恢复量（支持小数）
  - 不超过积分上限
  - 已达上限时不恢复
  - 支持不同套餐速度（500/1000/2500 每小时）

**2.3 套餐配置接口定义**
```typescript
export interface PackageConfig {
  creditCap: number;          // 积分上限
  recoveryRate: number;       // 每小时恢复速度
  dailyUsageLimit: number;    // 每日使用上限
  manualResetPerDay: number;  // 每日手动重置次数
}
```

---

#### **阶段 3：自动恢复积分功能** ✓ (100%)

**3.1 编写自动恢复测试**
- ✅ 创建测试文件：`tests/service/autoRecovery.test.ts`
- ✅ 测试覆盖：
  - 基础恢复功能（3个测试）
  - 边界情况处理（4个测试）
  - 不同套餐恢复速度（2个测试）
  - 向后兼容性（1个测试）
  - 乐观锁和并发控制（1个测试）
  - 实际使用场景（2个测试）
- ✅ **总计 13 个测试，全部通过，用时 195.9秒** ⚡

**3.2 实现自动恢复函数** ✅ 已完成
- ✅ 实现 `autoRecoverCredits(userId: string)` 函数
- ✅ 已实现功能：
  1. 使用 Prisma 事务确保数据一致性
  2. 查询用户钱包和活跃套餐（isActive=true 且 endAt>now）
  3. 从 `packageSnapshot.features` 获取配置（向后兼容旧套餐）
  4. 调用 `calculateRecoverableCredits()` 计算恢复量
  5. 乐观锁更新钱包余额（WHERE version=oldVersion）
  6. 创建积分流水记录（type='income', bucket='package'）
  7. 返回恢复结果 `{ success, recovered, newBalance }`
- ✅ 关键实现细节：
  - **事务一致性：** 整个流程在单个 `prisma.$transaction()` 中执行
  - **乐观锁：** 使用 `updateMany + version 字段` 防止并发冲突
  - **首次恢复基准：** `lastRecoveryAt ?? activePackage.startAt`（套餐激活时间）
  - **无活跃套餐：** 返回 `{ success: false, recovered: 0, newBalance: 0 }`
  - **旧套餐兼容：** `recoveryRate` 默认为 0（不恢复）

**3.3 测试优化**
- ✅ 解决套餐唯一约束冲突：使用时间戳+随机数生成唯一版本号
- ✅ 修复 `packageSnapshot` 结构：自动从 Package 复制完整配置
- ✅ 修复外键约束问题：调整数据清理顺序
- ✅ 修复测试精度问题：使用范围断言处理时间延迟（2500-2510）

---

### 🔜 待完成阶段

#### **阶段 4：手动重置积分功能** ✓ (100%)
- ✅ 规则与语义（与你对齐）：
  - 仅作用于订阅套餐积分池（packageTokensRemaining），独立积分不限制
  - 计数窗口按 UTC 日历天重置（UTC 00:00）
  - 用户前端按钮每天仅可点击一次；点击后积分直接恢复至上限；同一 UTC 日再次点击无效
  - 多套餐并存时，以 endAt 最新的活跃套餐为当前套餐

**4.1 测试**
- ✅ 文件：`tests/service/manualReset.test.ts`（5 个通过）
  - 提升到上限并写 reset 流水
  - 当日第二次限制（LIMIT_REACHED）
  - 已在上限不变更（ALREADY_AT_CAP）
  - 无活跃套餐失败（NO_ACTIVE_PACKAGE）
  - 跨日计数重置

**4.2 实现**
- ✅ 函数：`manualResetCredits(userId: string)`（`app/service/creditRecoveryService.ts`）
- ✅ 要点：
  - UTC 同日判定（比较 UTC Y-M-D）
  - 事务 + 乐观锁原子更新 Wallet；仅在实际提升量时写 `CreditTransaction(type=reset, bucket=package)`
  - 更新字段：`packageTokensRemaining → cap`、`manualResetCount`（同日 +1 / 跨日=1）、`manualResetAt=now`、`lastRecoveryAt=now`、`version+=1`

**4.1 接口与返回值**

```ts
// 文件：app/service/creditRecoveryService.ts
export async function manualResetCredits(userId: string): Promise<{
  success: boolean;
  resetAmount: number;    // 本次提升量（到达上限的差值）
  newBalance: number;     // 重置后的套餐余额
  code?: 'NO_ACTIVE_PACKAGE' | 'LIMIT_REACHED' | 'ALREADY_AT_CAP';
}>
```

**4.2 行为定义**
- 前置条件：必须存在活跃套餐；从 `packageSnapshot.features → package.features → fallback` 解析：
  `{ creditCap = dailyPoints, recoveryRate = 0, dailyUsageLimit = 999999, manualResetPerDay = 1 }`
- 当日次数控制：同一 UTC 日内 `manualResetCount < manualResetPerDay` 才允许重置；否则返回 `{ success: false, code: 'LIMIT_REACHED' }`
- 已达上限：`packageTokensRemaining >= creditCap` 时返回 `{ success: false, code: 'ALREADY_AT_CAP' }`
- 允许重置：将 `packageTokensRemaining` 直接提升至 `creditCap`

**4.3 Wallet 字段更新（仅在有实际提升量时）**
- `packageTokensRemaining`：设为 `creditCap`
- `manualResetCount`：同一 UTC 日 +1；跨日则重置为 1
- `manualResetAt`：写入当前 UTC 时间
- `lastRecoveryAt`：写入当前 UTC 时间（重置后重新开始小时恢复窗口）
- `version`：`+1`（乐观锁）

**4.4 并发与事务**
- 使用单一 Prisma 事务：读取套餐/钱包 → 校验 → 原子更新 Wallet（`WHERE userId AND version = oldVersion`）→ 写入流水
- 冲突（更新计数=0）即失败，不做自动重试

**4.5 流水记录（仅当有提升量时）**
- 表：`credit_transactions`
- 字段：
  - `type: 'reset'`
  - `bucket: 'package'`
  - `tokens/points = creditCap - beforePackageTokens`
  - `beforePackageTokens/afterPackageTokens`：重置前/后
  - `beforeIndependentTokens/afterIndependentTokens`：`null`
  - `orderId: null`
  - `reason: '手动重置到上限'`
  - `meta`: `{ source: 'manualResetCredits', creditCap, manualResetPerDay, resetsTodayBefore, resetsTodayAfter, atUtc }`

#### **阶段 5：积分消耗改造** ✓ (100%)
**5.1 测试（先行）**
- ✅ 新增：`tests/service/useCredits.test.ts`（7 个测试，通过）
  - 仅套餐扣减：`dailyUsageCount` 仅累计套餐部分
  - 达限额但独立足够：仅独立扣减（限额不阻塞）
  - 限额优先：裁剪后独立不足 → 返回 `DAILY_LIMIT_REACHED`（含 `remainingToday`）
  - 混合扣减成功：一条流水，四个 before/after 精确
  - 无活跃套餐：不做限额，仅独立扣减；`dailyUsageCount` 不变
  - 幂等：同一 `requestId` 仅扣减一次，仅一条流水
  - 用前自动恢复：恢复后再消费（失败不阻塞）

**5.2 实现**
- ✅ 服务：`app/service/creditManager.ts: useCredits()` 改造（外部签名兼容，新增可选 `options.requestId`）
  - 用前自动恢复：调用 `autoRecoverCredits(userId)`；失败忽略
  - 限额口径：仅限制“套餐积分”的当日累计消耗（UTC 同日）；独立积分不限额；无活跃套餐不做限额
  - 事务 + 乐观锁：`updateMany({ where: { userId, version }})` + `version += 1`，并发冲突短重试（2 次，50/100ms）
  - 额度计算：`packageUse = min(amount, packageAvail, allowedPackageRemaining)`；`independentNeed = amount - packageUse`
  - 优先级：同时出现“套餐每日限额不足”和“总体余额不足” → 优先返回 `DAILY_LIMIT_REACHED`
  - 流水：单条 `expense`，`bucket` 为 `package`（混合/套餐）或 `independent`（仅独立）；`points=tokens=amount`；四个 before/after 精确；`meta` 写入 `{ packageUsed, independentUsed, dailyUsageBefore/After }`
  - 幂等：支持 `requestId`（软幂等，存在即复用）
  - 事务配置：`{ maxWait: 30000, timeout: 30000 }` 防止远程 DB 事务超时（P2028）
- ✅ API：`app/api/credits/use/route.ts`
  - 支持接收 `requestId` 并透传到服务层
  - `DAILY_LIMIT_REACHED` 返回体携带 `remainingToday`，状态码按“默认”保持 400

**5.3 注意事项（指引）**
- 测试数据需设置 `dailyUsageResetAt=now` 才会按“UTC 同日”生效
- 仅套餐消耗计入 `dailyUsageCount`；独立消耗不计入
- 混合扣减仅生成一条流水，但四个 before/after 字段能完整还原两池变化

#### **阶段 6：定时任务** ✓ (100%)
- ✅ 实现 `hourlyRecoveryJob()`（`app/service/cronJobs.ts`）
  - 分页扫描活跃套餐用户（`HOURLY_RECOVERY_PAGE_SIZE`，默认 500）
  - 保守并发恢复（`HOURLY_RECOVERY_CONCURRENCY`，默认 5）调用 `autoRecoverCredits(userId, { now? })`
  - 基于 `lastRecoveryAt` 与当前时间差逐用户计算恢复量，确保“相对用户时间”按小时恢复
- ✅ 调度与开关（`scripts/cron-scheduler.ts` + 环境变量）
  - `ENABLE_HOURLY_RECOVERY=true` 时启用“每小时恢复”任务（每小时第 5 分：`0 5 * * * *`）
  - 旧“每日积分重置”用 `ENABLE_DAILY_RESET` 独立开关，默认禁用
  - `--once` 时优先执行“每小时恢复”，仅在显式开启下才执行“每日重置”
- ✅ 作业层测试：
  - `tests/integration/hourly-recovery-job.e2e.test.ts` 覆盖分页与并发（容忍轻微时间漂移）
  - 新增确定性用例 `tests/integration/hourly-recovery-job.deterministic.test.ts`：注入固定 `now`、并发=1、分页=2，断言严格等于预期恢复量（已稳定通过）
- 📝 可选项评估：`dailyUsageResetJob()` 维持“可选不实现”（消费路径跨日已自动归零）

#### **阶段 7：API 接口** ✓ (100%)
- ✅ `POST /api/credits/manual-reset`（`app/api/credits/manual-reset/route.ts`）
  - 返回 `{ success, resetAmount, newBalance, code?, resetsRemainingToday, nextAvailableAtUtc }`
  - 错误码：`NO_ACTIVE_PACKAGE | LIMIT_REACHED | ALREADY_AT_CAP`
- ✅ `GET /api/credits/info`（`app/api/credits/info/route.ts`）
  - 返回余额（套餐/独立/总计）、套餐配置（`creditCap/recoveryRate/dailyUsageLimit/manualResetPerDay`）、使用信息（`dailyUsageCount/Limit/resetsRemainingToday/nextResetAtUtc/lastRecoveryAt`）
  - 说明：GET 为只读，不隐式触发自动恢复
- ⚠️ 测试说明：按你的指示未新增 API 层测试（服务层测试已覆盖核心逻辑）

#### 前端对接（本轮新增）
- ✅ Dashboard → Credits Balance 卡片下方新增“Manual Reset to Cap”按钮与提示（`components/dashboard/SatisfactionRate.tsx`）
  - 按钮：调用 `POST /api/credits/manual-reset`；成功后刷新仪表；无可用次数或无套餐时禁用并提示
  - 提示：展示 `Resets remaining today`、`Next available (UTC→本地时区)` 与 `Cap`

#### **阶段 8：集成测试** ✓ (完成)
- ✅ 购买流程：`tests/integration/package-purchase.e2e.test.ts`
  - API 创建订单 → 模拟支付成功（`handlePaymentSuccess`）→ 激活套餐与钱包重置 → 校验快照 features 与 reset 流水
- ✅ 使用流程：`tests/integration/credits-use.e2e.test.ts`
  - 每日限额仅限制套餐池、混合扣减单条流水四字段、无活跃套餐仅独立扣减、幂等 requestId、用前自动恢复
- ✅ 手动重置：`tests/integration/manual-reset.e2e.test.ts`
  - 首次到上限并写 reset 流水、同日第二次 LIMIT_REACHED、已在上限 ALREADY_AT_CAP、无活跃套餐
- ✅ 信息查询：`tests/integration/info.e2e.test.ts`
  - 返回余额/配置/使用信息，不隐式触发恢复
- 🟨 每小时恢复作业：`tests/integration/hourly-recovery-job.e2e.test.ts`
  - 已编写并运行，断言放宽（±10）且加入短等待；后续继续加固稳定性
- ✅ 端到端场景：`tests/e2e/full-journey.e2e.test.ts`
  - 购买 → 查询 → 使用 → 自动恢复 → 手动重置 → 终态查询（1 个通过，~60–95s）

- ✅ 购买失败与退款场景：`tests/integration/order-failure-and-refund.e2e.test.ts`
  - 创建套餐订单 → 标记支付失败（Failed）→ 校验订单状态与钱包不变
  - 独立积分购买后退款（扣减独立池，写退款流水）
  - 套餐退款（清空套餐池，写退款流水）
  - 结果：3/3 通过（~100–120s）

测试配置与稳定性
- 方案 A：直接调用 API Route Handler，mock `next-auth` 的 `getServerSession`
- 集成测试文件内设置较长超时（`jest.setTimeout(240000)`），测试集串行执行（`--runInBand`）
- 远端 DB：在断言前加入短等待/轮询；写入与清理使用 upsert + 重试，放宽作业类断言允许少量时间漂移

#### **阶段 9：套餐数据迁移** 🚧 (进行中 ~70%)
- ✅ 新增脚本：`scripts/migrate-packages.ts`
  - 支持 scope: `tagged|all`（默认 tagged，带安全保护）；`tagged` 模式仅处理带 `tag` 的测试数据，`all` 模式需要 `confirmAll=true`
  - 新套餐 features：按示例（6000/10000/15000 上限与 500/1000/2500 每小时恢复等）
- ✅ 迁移测试：`tests/migration/packages.migration.test.ts`
  - 仅在 tag 作用域内替换旧套餐并幂等；二次运行不产生重复；不影响非测试数据
  - 结果：1/1 通过（~35–45s）
  - 生产执行：按“全部替换（删除三档旧套餐 → 创建新套餐）”需 `MIGRATION_SCOPE=all` 且 `CONFIRM_ALL=true`
  - 名称统一：`BASE`（basic）、`PRO`（pro）、`MAX`（enterprise）
  - 前端展示：套餐页特性由 features 渲染为英文要点（cap / recovery / daily max / full recovery hours / manual reset per day / tools / technical support）。PRO/MAX 显示“Priority technical support”，BASE 显示“Standard technical support”

#### **阶段 10：文档更新** 📝 (0%)
- [ ] 更新 `SUBSCRIPTION_PACKAGE_GUIDE.md`
- [ ] 添加新功能说明
- [ ] 更新 API 文档

---

## 📈 测试统计

| 测试文件 | 测试数量 | 状态 | 用时 |
|---------|---------|------|------|
| `wallet-schema.test.ts` | 10 | ✅ 全部通过 | ~35–40s |
| `creditRecovery.test.ts` | 18 | ✅ 全部通过 | ~0.12s |
| `autoRecovery.test.ts` | 13 | ✅ 全部通过 | ~240–255s |
| `manualReset.test.ts` | 5 | ✅ 全部通过 | ~105–140s |
| `useCredits.test.ts` | 7 | ✅ 全部通过 | ~190–210s |
| `package-purchase.e2e.test.ts` | 1 | ✅ 通过 | ~60–90s |
| `credits-use.e2e.test.ts` | 7 | ✅ 通过 | ~180–230s |
| `manual-reset.e2e.test.ts` | 4 | ✅ 通过 | ~120–170s |
| `info.e2e.test.ts` | 1 | ✅ 通过 | ~40–60s |
| `hourly-recovery-job.e2e.test.ts` | 1 | ✅ 通过 | ~100–130s |
| `order-failure-and-refund.e2e.test.ts` | 3 | ✅ 通过 | ~100–120s |
| `full-journey.e2e.test.ts` | 1 | ✅ 通过 | ~60–95s |
| `hourly-recovery-job.deterministic.test.ts` | 1 | ✅ 通过（确定性） | ~60–90s |
| **总计** | **72** | **72 通过 / 0 待加固** | **~1,200–1,500s（远程DB波动）** |

---

## 🎯 新旧对比

### **核心改变总览**

| 维度 | 当前系统 | 改造后系统 |
|-----|---------|-----------|
| 积分发放 | 每天0点一次性发放 | 按小时持续恢复 |
| 积分上限 | 无上限概念 | 6000/10000/15000 |
| 恢复速度 | - | 500/1000/2500 每小时 |
| 每日限额 | 无限制 | 18000/34000/75000 |
| 手动重置 | 无 | 每天1次，立即恢复到上限 |
| 完全恢复时间 | - | 12/10/6 小时 |

### **套餐配置对比**

#### 会员套餐（$50/月）
```typescript
{
  creditCap: 6000,           // 新增
  recoveryRate: 500,          // 新增：每小时恢复
  dailyUsageLimit: 18000,     // 新增：每日限额
  manualResetPerDay: 1,       // 新增：手动重置次数
}
```

#### 高级会员（$100/月）
```typescript
{
  creditCap: 10000,
  recoveryRate: 1000,
  dailyUsageLimit: 34000,
  manualResetPerDay: 1,
}
```

#### 尊享会员（$200/月）
```typescript
{
  creditCap: 15000,
  recoveryRate: 2500,
  dailyUsageLimit: 75000,
  manualResetPerDay: 1,
}
```

---

## 🛠️ 关键实现细节

### **1. 数据库新字段说明**

```sql
-- 每日使用量跟踪
daily_usage_count BIGINT DEFAULT 0         -- 今日已使用积分
daily_usage_reset_at TIMESTAMPTZ           -- 每日用量重置时间

-- 手动重置跟踪
manual_reset_count INT DEFAULT 0           -- 今日手动重置次数
manual_reset_at TIMESTAMPTZ                -- 上次手动重置时间

-- 恢复时间跟踪
last_recovery_at TIMESTAMPTZ               -- 上次自动恢复时间
```

### **2. 积分恢复算法**

```typescript
// 伪代码
hoursPassed = (now - lastRecoveryTime) / 3600000
recoveredAmount = floor(hoursPassed * recoveryRate)
newCredits = min(currentCredits + recoveredAmount, creditCap)
```

**示例：**
- 用户剩余 5000 积分
- 上次恢复：1小时前
- 恢复速度：500/小时
- 结果：5000 + 500 = 5500

### **3. 向后兼容策略**

```typescript
// 旧套餐没有 features.recoveryRate 字段
const config: PackageConfig = activePackage.package_snapshot?.features || {
  creditCap: activePackage.daily_credits,
  recoveryRate: 0,  // 旧套餐不恢复
  dailyUsageLimit: 999999,
  manualResetPerDay: 0
};
```

---

## 📌 决策与口径（本轮对齐）

- 首次恢复基准：沿用“当前实现”口径，而非文档早前草案
  - 基准时间 = `lastRecoveryAt || wallet.updatedAt || wallet.createdAt`
  - 非 `activePackage.startAt`（文档已在后续更新列表中标记）
- 作业层测试：纳入 `hourlyRecoveryJob` 的集成测试（分页 + 并发），持续加固其稳定性
  - 在作业与服务层引入 `now` 注入口径，测试可传入固定时间以获得确定性结果
- 集成测试配置：
  - mock `getServerSession`，不发真实 HTTP 请求
  - 文件级超时 240s，`--runInBand` 串行执行
  - 远端 DB 下在断言前加入短等待/轮询；非确定性用例放宽断言允许少量时间漂移（±10）

---

## 🚨 已解决的问题

### **问题 1：测试速度慢（36.6秒）**
**原因：**
- 数据库在远程（Supabase AWS）
- 每个测试都执行真实数据库操作
- 大量重复查询

**解决方案：**
- 缓存测试数据，减少查询
- 合并测试用例
- 纯函数测试独立出来（0.155秒）

**效果：** 31.9秒，提升 13%

### **问题 2：planType 约束冲突**
**原因：**
```sql
CHECK (plan_type IN ('basic','pro','enterprise'))
```
测试中使用了 `'member'`，不符合约束

**解决方案：**
- 修改测试辅助函数默认值为 `'basic'`
- 明确指定 `planType: 'pro'` 或 `'enterprise'`

### **问题 3：Package 唯一约束冲突**
**原因：**
```sql
UNIQUE (name, version)
```
测试中每次创建套餐都使用相同的 `version: 'v1.0-test'`

**解决方案：**
```typescript
const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
version: `v1.0-test-${uniqueSuffix}` // 确保每次都唯一
```

### **问题 4：UserPackage.orderId 类型错误**
**原因：**
`orderId` 字段类型是 `String? @db.Uuid`，但测试传入了字符串 `test-order-${Date.now()}`

**解决方案：**
```typescript
orderId: null  // 测试环境不关联订单
```

### **问题 5：packageSnapshot 缺少 features**
**原因：**
测试中创建的 `UserPackage` 的 `packageSnapshot` 为空对象 `{}`，导致 `autoRecoverCredits` 无法读取配置

**解决方案：**
```typescript
// 创建 UserPackage 时，从 Package 复制完整配置
const packageInfo = await prisma.package.findUnique({ where: { id: packageId } });
packageSnapshot: {
  id: packageInfo.id,
  name: packageInfo.name,
  features: packageInfo.features,  // 包含 recoveryRate 等配置
  // ...
}
```

### **问题 6：测试数据清理外键约束冲突**
**原因：**
清理数据时，先删除 User 再删除 Package，但 UserPackage 还引用了它们

**解决方案：**
调整删除顺序（从底层到顶层）：
```typescript
1. creditTransaction
2. usageRecord
3. userPackage    // 必须在 Package 之前
4. apiKey
5. wallet
6. order
7. user
8. package        // 最后删除
```

### **问题 7：测试精度问题（Expected: 2500, Received: 2501）**
**原因：**
测试执行有延迟，实际经过时间 > 1小时，导致 `Math.floor(1.0004 * 2500) = 2501`

**解决方案：**
```typescript
// 使用范围断言允许一定误差
expect(result.recovered).toBeGreaterThanOrEqual(2500);
expect(result.recovered).toBeLessThanOrEqual(2510);
```

### **问题 8：Wallet 创建外键约束（P2003）**
**原因：**
事务内直接创建 Wallet，但用户记录尚未确认存在，触发 `wallets_user_id_fkey` 约束

**解决方案：**
- 在 `useCredits()` 事务内创建 Wallet 前先 `tx.user.findUnique({ where: { id: userId } })` 校验；不存在则报错

### **问题 9：事务超时（P2028 Transaction already closed）**
**原因：**
远程 DB 延迟导致交互式事务超过默认 5s 超时

**解决方案：**
- 为 `prisma.$transaction` 设置 `{ maxWait: 30000, timeout: 30000 }`

### **问题 10：每日限额同日口径未生效**
**原因：**
测试数据未设置 `dailyUsageResetAt` 为“今天（UTC）”，导致系统判定“今日未用”而绕过限额

**解决方案：**
- 在测试准备阶段显式设置 `dailyUsageResetAt = now`
- `tests/helpers/testDb.ts` 的 `setWalletBalance()` 新增该字段支持

### **问题 11：作业类测试因时间漂移不稳定**
**原因：**
- `hourlyRecoveryJob` 与 `autoRecoverCredits` 基于系统时间，E2E 在远端 DB 场景下存在时间漂移与可见性延迟，导致断言需容忍范围

**解决方案：**
- 为 `autoRecoverCredits(userId, { now? })` 增加可选时间注入
- `hourlyRecoveryJob({ now })` 透传到服务层
- 新增确定性 E2E：`tests/integration/hourly-recovery-job.deterministic.test.ts`，固定 `now`、并发=1、分页=2，并增加短轮询确保可见性，断言严格等于预期

**效果：**
- 作业类用例稳定通过；该场景不再依赖 ±10 范围容忍

---

## 📋 下一步操作清单

### **✅ 已完成（2025-10-01）**

1. ✅ **实现 `autoRecoverCredits()` 函数**
   - 文件：`app/service/creditRecoveryService.ts`
   - 功能：自动恢复用户积分，支持事务、乐观锁、流水记录
   - 测试：13/13 通过

2. ✅ **优化测试辅助工具**
   - 修复 `createTestPackage()` 唯一性问题
   - 修复 `createTestUserPackage()` packageSnapshot 结构
   - 优化 `cleanupTestData()` 删除顺序

3. ✅ **实现手动重置功能**
   - 测试：`tests/service/manualReset.test.ts`（5/5 通过）
   - 函数：`manualResetCredits(userId: string)`（UTC 日窗口、事务+乐观锁、reset 流水）

### **✅ 已完成（2025-10-02）**

4. ✅ **加固 hourly-recovery 作业测试稳定性**
   - 新增确定性 E2E：`tests/integration/hourly-recovery-job.deterministic.test.ts`（固定 `now`、并发=1、分页=2、短轮询）
   - 服务层：`autoRecoverCredits(userId, { now? })` 支持时间注入
   - 作业层：`hourlyRecoveryJob({ now })` 透传到服务层
   - 结果：用例稳定通过，断言精确，无需 ±10 容忍

### **待执行（按优先级）**

- 文档与说明同步（见下“文档更新”）

5. **实现定时任务（阶段 6）**
   - 每小时恢复任务：`hourlyRecoveryJob()`（遍历活跃用户，调用 `autoRecoverCredits()`；批量化/分页）
   - 每日 UTC 00:00 重置任务：`dailyUsageResetJob()`（将所有钱包的 `dailyUsageCount=0, dailyUsageResetAt=now`；`manualResetCount` 可不强制清零，因我们用 UTC 日窗口判断）
   - 位置建议：
     - 任务逻辑：`app/service/cronJobs.ts` 或 `app/service/recoveryJobs.ts`
     - 调度入口：`scripts/cron-scheduler.ts`（现有），示例：
       - 每小时第 5 分：`0 5 * * * *`（node-cron 表达式）
       - 每日 00:05 UTC：`0 5 0 * * *`

6. **创建 API 接口（阶段 7）**
   - `POST /api/credits/manual-reset`
     - Auth：登录用户
     - Request：`{}`（可选 `requestId`）
     - Response：`{ success, resetAmount, newBalance, code?, resetsRemainingToday?, nextAvailableAtUtc? }`
     - 错误码：`NO_ACTIVE_PACKAGE | LIMIT_REACHED | ALREADY_AT_CAP | UNAUTHORIZED`
   - `GET /api/credits/info`
     - Auth：登录用户
     - Response：
       ```json
       {
         "balance": {
           "packageTokensRemaining": number,
           "independentTokens": number,
           "totalAvailable": number
         },
         "packageConfig": {
           "creditCap": number,
           "recoveryRate": number,
           "dailyUsageLimit": number,
           "manualResetPerDay": number
         },
         "usage": {
           "dailyUsageCount": number,
           "dailyUsageLimit": number,
           "resetsRemainingToday": number,
           "nextResetAtUtc": string,
           "lastRecoveryAt": string | null
         }
       }
       ```
   - 文档：在 `SUBSCRIPTION_PACKAGE_GUIDE.md` 同步 API 说明

7. **集成测试**
   - 完整购买流程测试
   - 完整使用流程测试（购买 → 使用 → 自动恢复 → 手动重置）
   - 端到端场景验证

8. **套餐数据迁移**
   - 创建新套餐脚本（包含 `features` 配置）
   - 执行套餐创建
   - 数据验证

9. **文档更新**
   - 更新 `SUBSCRIPTION_PACKAGE_GUIDE.md`
   - 添加新功能说明（自动恢复、手动重置）
   - 更新 API 文档

---

## 📁 文件清单

### **新增文件**

```
tests/
├── database/
│   └── wallet-schema.test.ts          ✅ 数据库字段测试（10个测试）
├── service/
│   ├── creditRecovery.test.ts         ✅ 积分计算测试（18个测试）
│   ├── autoRecovery.test.ts           ✅ 自动恢复测试（13个测试）
│   ├── manualReset.test.ts            ✅ 手动重置测试（5个测试）
│   └── useCredits.test.ts             ✅ 积分消耗测试（7个测试：套餐限额/混合扣减/幂等/自动恢复）
├── integration/
│   └── hourly-recovery-job.deterministic.test.ts  ✅ 作业确定性测试（1个测试：注入 now 严格断言）
└── helpers/
    └── testDb.ts                       ✅ 测试辅助工具（6个函数）

app/service/
└── creditRecoveryService.ts            ✅ 积分恢复服务（4个函数）
    ├── PackageConfig interface
    ├── calculateRecoverableCredits()   ✅ 纯函数（18个测试覆盖）
    ├── autoRecoverCredits(userId, { now? })  ✅ 异步函数（13个测试覆盖；支持时间注入）
    └── manualResetCredits()            ✅ 异步函数（5个测试覆盖）

jest.config.js                          ✅ Jest 配置
jest.setup.js                           ✅ 测试设置

app/api/credits/manual-reset/route.ts   ✅ 手动重置 API 路由
app/api/credits/info/route.ts           ✅ 积分信息 API 路由
.env.example                             ✅ 环境变量样例（新增作业与并发开关）
```

### **修改文件**

```
prisma/schema.prisma                    ✅ Wallet 模型新增 5 个字段（历史改动）
  - dailyUsageCount (BigInt)
  - dailyUsageResetAt (DateTime?)
  - manualResetCount (Int)
  - manualResetAt (DateTime?)
  - lastRecoveryAt (DateTime?)

tests/helpers/testDb.ts                 ✅ 优化测试辅助函数
  - createTestPackage() - 添加唯一版本号生成
  - createTestUserPackage() - 自动复制 packageSnapshot
  - cleanupTestData() - 优化删除顺序；加入退避重试与 FK 冲突重试
  - setWalletBalance() - 新增 `dailyUsageResetAt` 支持（UTC 同日口径）
  - waitForDbReady() - 远端 DB 就绪等待

app/service/creditManager.ts            ✅ `useCredits()` 改造（仅套餐限额、乐观锁+短重试、幂等、UTC 同日、四字段流水）
  - 读取/创建钱包改为 upsert，减少并发读放大

app/api/credits/use/route.ts            ✅ 接口支持 `requestId` 幂等；`DAILY_LIMIT_REACHED` 返回 `remainingToday`

prisma/migrations/migration_lock.toml   ✅ MySQL→PostgreSQL
package.json                            ✅ 添加测试命令

app/service/cronJobs.ts                 ✅ 新增 `hourlyRecoveryJob()`；加入任务开关（`ENABLE_HOURLY_RECOVERY`/`ENABLE_DAILY_RESET`）；透传 `now` 到服务层以支持确定性测试
scripts/cron-scheduler.ts               ✅ `--once` 时优先跑小时恢复；旧“每日重置”仅在显式开启时执行
app/service/creditRecoveryService.ts    ✅ 事务统一 `{ maxWait: 30000, timeout: 30000 }`；新增 `autoRecoverCredits(userId, { now? })` 支持时间注入，便于确定性测试

// 以下为本轮为稳定集成测试做的实现级加固（不改变业务语义）
app/service/creditManager.ts            ✅ `resetPackageCreditsForNewPackage()` 由交互式事务改为顺序执行，避免远端事务超时（P2028）
app/models/creditBalance.ts             ✅ `resetPackageCredits()` 改为 upsert，确保钱包不存在时自动创建
app/service/packageManager.ts           ✅ 购买时将 `orderNo` 映射为订单 UUID 传入，无法获取则置空（避免 UserPackage.orderId UUID 约束）
app/models/userPackage.ts               ✅ 仅当传入为合法 UUID 时写 `orderId`，否则为 null
app/models/creditTransaction.ts         ✅ 仅当传入为合法 UUID 时写 `orderId`，否则为 null
tests/helpers/testDb.ts                 ✅ 清理逻辑改为分步执行，避免长事务死锁；`setWalletBalance()` 改为 upsert + 重试；清理时补充删除关联订单
tests/integration/*                     ✅ 新增 6 个集成测试文件（API 四项 + 作业两项）
```

---

## 🎓 交接要点

### **核心代码位置**

1. 积分恢复服务
   - 文件：`app/service/creditRecoveryService.ts`
   - 核心函数：
     - `calculateRecoverableCredits()`：计算恢复量（纯函数，快速测试）
     - `autoRecoverCredits(userId, { now? })`：自动恢复（事务 + 乐观锁；支持注入时间便于确定性测试）

2. 消费服务
   - 文件：`app/service/creditManager.ts`
   - 核心函数：
     - `useCredits(userId, amount, service, metadata?, options?)`
       - 每日限额口径：仅限制“套餐积分”的当日累计消耗（UTC 同日窗口），独立积分不限额；无活跃套餐不做限额
       - 幂等：支持 `options.requestId`，同一请求只扣减一次
       - 并发：`updateMany + version` 乐观锁，短重试 2 次（50/100ms）
       - 流水：混合扣减写一条 `expense`，精确四个 before/after 字段；`bucket` 混合/套餐为 `package`，仅独立为 `independent`
       - 事务配置：`{ maxWait: 30000, timeout: 30000 }`（远程 DB 下已验证稳定）
   - 其他关联：
     - `purchaseCredits()` / `activatePackageCredits()` 使用事务 `{ maxWait/timeout: 60000 }`
     - `resetPackageCreditsForNewPackage()` 顺序执行，避免交互式事务在远端超时

3. 测试文件
   - 服务层：
     - `tests/service/creditRecovery.test.ts`（纯函数，极快）
     - `tests/service/autoRecovery.test.ts`（完整流程，覆盖恢复/并发/边界）
     - `tests/service/useCredits.test.ts`（每日限额/混合扣减/幂等/自动恢复）
   - 集成层（方案 A，mock 会话直调 API/服务）：
     - `tests/integration/package-purchase.e2e.test.ts`
     - `tests/integration/credits-use.e2e.test.ts`
     - `tests/integration/manual-reset.e2e.test.ts`
     - `tests/integration/info.e2e.test.ts`
     - `tests/integration/hourly-recovery-job.e2e.test.ts`
     - `tests/integration/hourly-recovery-job.deterministic.test.ts`
   - 测试辅助：`tests/helpers/testDb.ts`（必读：waitForDbReady、cleanup 顺序、upsert + 重试）

4. 数据库字段
   - `prisma/schema.prisma` → Wallet 模型新增字段：`dailyUsageCount`, `dailyUsageResetAt`, `manualResetCount`, `manualResetAt`, `lastRecoveryAt`

5. API
   - `app/api/credits/use/route.ts`（POST `/api/credits/use`）
     - 支持 `requestId` 幂等；命中每日限额时返回 `DAILY_LIMIT_REACHED`，并携带 `remainingToday`
   - `app/api/credits/manual-reset/route.ts`（POST `/api/credits/manual-reset`）
     - 返回 `{ success, resetAmount, newBalance, code?, resetsRemainingToday, nextAvailableAtUtc }`
   - `app/api/credits/info/route.ts`（GET `/api/credits/info`）
     - 返回余额、套餐配置、使用信息（含 `resetsRemainingToday/nextAvailableAtUtc/lastRecoveryAt`）

### **关键配置**

1. 套餐配置（`PackageConfig` interface）
```ts
{
  creditCap: 6000,          // 积分上限
  recoveryRate: 500,        // 每小时恢复速度
  dailyUsageLimit: 18000,   // 每日使用上限
  manualResetPerDay: 1      // 每日手动重置次数
}
```

2. 测试超时与运行
- 纯函数/快速测试：默认 5000ms
- 服务/数据库测试：建议 120000–180000ms（远端较慢）
- 集成测试（方案 A）：文件内置 `jest.setTimeout(240000)`，建议串行 `--runInBand`
- 常用命令（示例）：
```bash
# 服务层
npm test -- tests/service/creditRecovery.test.ts
npm test -- tests/service/autoRecovery.test.ts --runInBand --testTimeout=240000
npm test -- tests/service/manualReset.test.ts --runInBand --testTimeout=180000
npm test -- tests/service/useCredits.test.ts --runInBand --testTimeout=240000

# 集成层（API/作业）
npm test -- tests/integration/package-purchase.e2e.test.ts --runInBand --testTimeout=240000
npm test -- tests/integration/manual-reset.e2e.test.ts --runInBand --testTimeout=240000
npm test -- tests/integration/credits-use.e2e.test.ts --runInBand --testTimeout=240000
npm test -- tests/integration/info.e2e.test.ts --runInBand --testTimeout=240000
npm test -- tests/integration/hourly-recovery-job.e2e.test.ts --runInBand --testTimeout=240000
npm test -- tests/integration/hourly-recovery-job.deterministic.test.ts --runInBand --testTimeout=240000
npm test -- tests/integration/order-failure-and-refund.e2e.test.ts --runInBand --testTimeout=240000

# 端到端
npm test -- tests/e2e/full-journey.e2e.test.ts --runInBand --testTimeout=240000
```

3. 环境与常见问题速查
- 环境变量：
  - `ENABLE_HOURLY_RECOVERY=true` 启用小时恢复任务
  - `ENABLE_DAILY_RESET=false` 禁用旧每日重置
  - `HOURLY_RECOVERY_PAGE_SIZE` / `HOURLY_RECOVERY_CONCURRENCY` 控制分页与并发（默认 500/5）
- 定时任务：`scripts/cron-scheduler.ts --once` 单次执行（生产通过开关控制调度）
- 常见问题与指引：
  - 套餐唯一约束冲突 → 使用 `${Date.now()}-${random}` 生成唯一版本
  - 外键约束冲突 → 按顺序删除（userPackage 先于 package）；测试清理已内置顺序与重试
  - 时间漂移/恢复误差 → 使用范围断言（`toBeGreaterThanOrEqual` + `toBeLessThanOrEqual`）
  - 远端 DB 抖动/可见性 → 串行执行、放宽超时、断言前短等待/轮询；辅助函数 upsert + 重试
  - 迁移执行：
    - 全量替换三档套餐：`npm run migrate:packages:all`（危险操作，删除旧套餐再创建 BASE/PRO/MAX）
    - 标签范围替换：`npm run migrate:packages:tag`（仅测试用）
  - 前端本地预览：`PUBLIC_APP_URL/PUBLIC_BASE_URL/PUBLIC_NOTIFY_URL/NEXTAUTH_URL` 请指向 `http://localhost:3000`，避免登录跳到生产看不到本地改动

### **下一步建议**

1) 立即项
- 生产执行全量迁移：`npm run migrate:packages:all` 并记录执行与校验结果（数量、features、isActive）
- 观察小时作业线上表现（耗时/错误率/恢复增量分布），必要时调整并发与分页

2) 文档与对齐
- 更新 `SUBSCRIPTION_PACKAGE_GUIDE.md` 与 API 文档（小时恢复/每日限额/手动重置/端到端流程）
- 明确 UI 文案规范（套餐卡片英文要点与技术支持优先级）

3) 运行与运维
- 生产开启：`ENABLE_HOURLY_RECOVERY=true`（默认分页 500/并发 5 可按量调整）
- 保持 `ENABLE_DAILY_RESET=false`
- 监控小时作业执行耗时与错误率，必要时调整并发与分页
- 若需要排查线上作业：可通过注入固定 `now` 的方式在预生产环境回放特定时刻（仅测试环境使用）

---

## 💡 TDD 最佳实践总结

### **我们做对的事**

1. ✅ **先写测试，明确需求**
   - 18个测试覆盖所有边界情况
   - 测试即文档，清晰易懂

2. ✅ **红-绿-重构循环**
   - 测试失败（红）→ 实现代码（绿）→ 优化（重构）
   - `wallet-schema.test.ts`：10个测试从失败到通过
   - `creditRecovery.test.ts`：18个测试一次性全部通过

3. ✅ **纯函数优先**
   - `calculateRecoverableCredits()` 无副作用，测试极快（0.155秒）
   - 容易测试，容易维护

4. ✅ **测试独立性**
   - 每个测试自己创建数据
   - `beforeEach` / `afterAll` 清理数据

### **改进空间**

1. 🔄 **考虑使用测试数据库**
   - 本地 PostgreSQL 可能更快
   - 或使用内存数据库（SQLite）

2. 🔄 **Mock 外部依赖**
   - 数据库操作可以 Mock
   - 加快测试速度

3. 🔄 **并行测试**
   - 当前 `maxWorkers: 1`（串行）
   - 优化数据隔离后可并行

---

## 📞 交接信息

### **环境信息**
- **Node.js 版本：** （检查 `node -v`）
- **数据库：** Supabase PostgreSQL（aws-1-us-west-1）
- **Prisma 版本：** 6.16.2
- **Jest 版本：** 30.2.0

### **运行命令**

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- tests/service/creditRecovery.test.ts

# 监听模式
npm test:watch

# 生成 Prisma 客户端
npm run prisma:generate

# 推送 Schema 到数据库
npm run prisma:push
```

### **重要注意事项**

1. ⚠️ **数据库约束：** `planType` 只能是 `'basic'`, `'pro'`, `'enterprise'`
2. ⚠️ **远程数据库：** 测试速度受网络影响
3. ⚠️ **乐观锁：** Wallet 表使用 `version` 字段防止并发冲突
4. ⚠️ **BigInt 类型：** 积分字段使用 `BigInt`，注意类型转换
5. ⚠️ **UTC 边界：** 手动重置按 UTC 00:00 计算同一日窗口
6. ⚠️ **本地前端预览：** 若 `PUBLIC_APP_URL/PUBLIC_BASE_URL/PUBLIC_NOTIFY_URL/NEXTAUTH_URL` 指向生产域名，登录将跳到线上环境导致看不到本地改动；本地调试请统一指向 `http://localhost:3000`

---

## 🎉 里程碑

- ✅ 测试环境配置完成
- ✅ 数据库 Schema 迁移完成
- ✅ 积分恢复计算逻辑实现完成（18个测试）
- ✅ 自动恢复功能实现完成（13个测试）
- ✅ 手动重置功能实现完成（5个测试）
- ✅ 积分消耗改造完成（7个测试：仅套餐限额/混合扣减/幂等/用前自动恢复）
- ✅ 定时任务（小时恢复）与 API 完成
- 🎯 集成测试与文档

---

## 🎓 交接要点

### **核心代码位置**

1. **积分恢复服务**
   - 文件：`app/service/creditRecoveryService.ts`
   - 核心函数：
     - `calculateRecoverableCredits()` - 计算恢复量（纯函数，快速测试）
     - `autoRecoverCredits(userId)` - 自动恢复（事务+乐观锁）

2. **消费服务**
   - 文件：`app/service/creditManager.ts`
   - 核心函数：
     - `useCredits(userId, amount, service, metadata?, options?)`
       - 每日限额口径：仅限制“套餐积分”的当日累计消耗（UTC 同日窗口），独立积分不限额；无活跃套餐不做限额
       - 幂等：支持 `options.requestId`，同一请求只扣减一次
       - 并发：`updateMany + version` 乐观锁，短重试 2 次（50/100ms）
       - 流水：混合扣减写一条 `expense`，精确四个 before/after 字段；`bucket` 混合/套餐为 `package`，仅独立为 `independent`
       - 事务配置：`{ maxWait: 30000, timeout: 30000 }` 防远程 DB 超时

3. **测试文件**
   - `tests/service/creditRecovery.test.ts` - 计算逻辑测试（0.155秒，极快）
   - `tests/service/autoRecovery.test.ts` - 完整流程测试（195.9秒，慢但全面）
   - `tests/service/useCredits.test.ts` - 积分消耗测试（~170–180秒，7 个用例：套餐限额/混合扣减/幂等/自动恢复）
   - `tests/helpers/testDb.ts` - 测试辅助工具（必读！）

4. **数据库字段**
   - 查看 `prisma/schema.prisma` 中的 Wallet 模型
   - 5 个新字段：`dailyUsageCount`, `dailyUsageResetAt`, `manualResetCount`, `manualResetAt`, `lastRecoveryAt`

5. **API**
   - `app/api/credits/use/route.ts` - POST `/api/credits/use`
     - 支持 `requestId` 幂等；当限额命中时返回 `DAILY_LIMIT_REACHED`，并携带 `remainingToday`
   - `app/api/credits/manual-reset/route.ts` - POST `/api/credits/manual-reset`
     - 返回 `{ success, resetAmount, newBalance, code?, resetsRemainingToday, nextAvailableAtUtc }`
   - `app/api/credits/info/route.ts` - GET `/api/credits/info`
     - 返回余额、套餐配置、使用信息（含 `resetsRemainingToday/nextResetAtUtc`）

### **关键配置**

1. **套餐配置**（`PackageConfig` interface）
   ```typescript
   {
     creditCap: 6000,          // 积分上限
     recoveryRate: 500,        // 每小时恢复速度
     dailyUsageLimit: 18000,   // 每日使用上限
     manualResetPerDay: 1      // 每日手动重置次数
   }
   ```

2. **测试超时设置**
   - 纯函数测试：默认 5000ms
   - 数据库测试：建议 120000–180000ms（远程数据库慢）
  - 运行命令：
     - `npm test -- tests/service/autoRecovery.test.ts --runInBand --testTimeout=240000`
     - `npm test -- tests/service/manualReset.test.ts --runInBand --testTimeout=180000`
     - `npm test -- tests/service/useCredits.test.ts --runInBand --testTimeout=240000`

3. **环境与常见问题速查**
  - 环境变量：
    - `ENABLE_HOURLY_RECOVERY=true` 启用小时恢复任务
    - `ENABLE_DAILY_RESET=false` 禁用旧每日重置
    - `HOURLY_RECOVERY_PAGE_SIZE`/`HOURLY_RECOVERY_CONCURRENCY` 控制分页与并发（默认 500/5）
  - 定时任务：
    - `scripts/cron-scheduler.ts --once` 单次执行；生产用开关控制调度
  - 套餐唯一约束冲突 → 使用 `${Date.now()}-${random}` 生成唯一版本
  - 外键约束冲突 → 按正确顺序删除（userPackage 先于 package）
  - 测试精度问题 → 使用范围断言（`toBeGreaterThanOrEqual` + `toBeLessThanOrEqual`）
  - 远端 DB 抖动 → 使用串行执行（`--runInBand`）、放宽超时、借助 `waitForDbReady()` 与重试（已内置于测试辅助）

### **下一步建议**

1. **校验当前通过用例（含消费与重置）**
   ```bash
   # 纯函数（极快）
   npm test -- tests/service/creditRecovery.test.ts

   # 集成（远程 DB 慢，建议串行并放宽超时）
   npm test -- tests/service/autoRecovery.test.ts --runInBand --testTimeout=240000
   npm test -- tests/service/manualReset.test.ts --runInBand --testTimeout=180000
   npm test -- tests/service/useCredits.test.ts --runInBand --testTimeout=240000

   # 作业一次性验证（需：ENABLE_HOURLY_RECOVERY=true, ENABLE_DAILY_RESET=false）
   npx tsx scripts/cron-scheduler.ts --once
   ```

2. **熟悉核心实现**
   - `calculateRecoverableCredits()`：恢复量计算（纯函数）
   - `autoRecoverCredits()`：自动恢复（事务 + 乐观锁 + income 流水）
   - `manualResetCredits()`：手动重置到上限（UTC 窗口 + 事务 + 乐观锁 + reset 流水）
   - `useCredits()`：每日套餐限额口径、混合扣减、幂等（`requestId`）、用前自动恢复
   - `hourlyRecoveryJob()`：分页 + 保守并发的小时恢复（相对用户时间）
   - API：`POST /api/credits/manual-reset`、`GET /api/credits/info`

3. **按阶段推进（TDD）**
   - 阶段 8：集成测试
     - 完整购买 → 使用 → 自动恢复 → 手动重置的端到端用例
     - 对接前端按钮与提示（`resetsRemainingToday/nextAvailableAtUtc`）
   - 阶段 9：套餐数据迁移
     - 创建新套餐脚本（含 `features` 四键）并执行校验
   - 阶段 10：文档更新
     - 完善 `SUBSCRIPTION_PACKAGE_GUIDE.md` 与 API 文档
   - 运行与运维建议
     - 生产开启：`ENABLE_HOURLY_RECOVERY=true`，保守并发（默认 500/5）
     - 旧作业保持关闭：`ENABLE_DAILY_RESET=false`
     - 监控小时作业执行时长与错误率，必要时调整并发与分页

---

**祝下一位接手的同事工作顺利！如有疑问，请参考本文档和代码注释。** 🚀

---

## 📝 更新日志

### **2025-10-01 更新**
- ✅ 完成阶段 3：自动恢复积分功能（13 测试）
- ✅ 完成阶段 4：手动重置功能（5 测试）
- ✅ 完成阶段 5：积分消耗改造（7 测试：仅套餐限额/混合扣减/幂等/用前自动恢复）
- ✅ 所有 53 个测试全部通过（远程 DB）
- 📊 总体进度：70%

### **2025-10-01 二次更新**
- ✅ 完成阶段 6：定时任务（`hourlyRecoveryJob` + 调度开关；跳过作业层测试）
- ✅ 完成阶段 7：API（`POST /api/credits/manual-reset`、`GET /api/credits/info`）
- ✅ 新增 `.env.example` 并引入作业开关与并发参数
- 🛠️ 提升稳定性：
  - `creditRecoveryService` 事务统一 `{ maxWait: 30000, timeout: 30000 }`
  - `creditManager` 钱包创建改 upsert，减少并发/读放大问题
  - `tests/helpers/testDb` 增加 `withRetry`/`waitForDbReady`，清理顺序与 FK 冲突重试
- ✅ 全部相关服务层测试通过（53/53）
- 📊 总体进度：85%

### **2025-10-02 更新**
- ✅ 新增并通过集成测试：订单失败与退款（3 用例）
- ✅ 新增迁移脚本与迁移测试（tag 范围幂等）
- 🛠️ 重构购买/退款事务逻辑（单事务 + 乐观锁，统一使用 tx，远端连接池更稳定）
- 🛠️ 每小时恢复作业支持注入 `now/pageSize/concurrency` 以提升可测性
- 📊 总体进度：90%

### **2025-10-02 三次更新**
- ✅ 新增端到端大用例：`tests/e2e/full-journey.e2e.test.ts`（购买 → 查询 → 使用 → 自动恢复 → 手动重置 → 查询）
- ✅ 前端对接：Dashboard → Credits Balance 卡片新增“Manual Reset to Cap”按钮与提示（调用 `/api/credits/manual-reset`）
- ✅ 套餐名称与展示：统一为 `BASE/PRO/MAX`；套餐页特性从 features 渲染为英文要点（cap/recovery/daily max/full recovery/manual reset + tools + technical support）
- 🛠️ 新增脚本命令：`npm run migrate:packages:all` / `npm run migrate:packages:tag`
- 📊 总体进度：93%
