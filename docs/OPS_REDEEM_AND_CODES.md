# KOI 兑换码与套餐卡密功能运维手册

本手册覆盖本次迭代交付的“Purchase Plans”页兑换码卡片、管理员卡密管理、默认管理员引导、数据库与测试、部署与回滚等运维要点。

## 概览
- 兑换码（用户侧）：在 `Purchase Plans` 标签页三张套餐卡片下方新增“Redeem Code”卡片，支持输入卡密兑换套餐或积分。
- 管理端卡密：Admin 面板中新增/启用“Code Management”模块，可生成、列表、作废/激活卡密。
- 默认管理员：首次使用预置邮箱和密码登录会自动创建管理员账号。
- 数据结构：新增 `redemption_codes` 表；恢复 `referral_meta` 表与邀请码索引。
- 展示统一：套餐展示名映射为 Plus（basic）/ Pro（pro）/ Max（enterprise）。

## 交付内容（代码路径）
- 用户兑换服务：`app/service/redemption.ts`
- 用户兑换 API：`app/api/codes/redeem/route.ts`
- 管理端卡密 API：
  - 列表：`app/api/admin/codes/route.ts`（GET）
  - 生成：`app/api/admin/codes/generate/route.ts`（POST）
  - 状态：`app/api/admin/codes/[code]/route.ts`（PUT）
- 展示层
  - 兑换卡片：`components/dashboard/RedeemCodeCard.tsx`
  - 购买页：`components/dashboard/PlansContent.tsx`
  - Admin 内容：`components/dashboard/admin/AdminCodeManagement.tsx`、`AdminCodeGenerateModal.tsx`、`AdminUserManagement.tsx`、`AdminUserEditModal.tsx`
- 工具/常量
  - 管理工具映射：`app/lib/admin/utils.ts`（planType → Plus/Pro/Max 映射）
- 默认管理员引导：`app/auth/config.ts`（Credentials authorize 内）
- DB 脚本
  - Prisma schema：`prisma/schema.prisma`（RedemptionCode）
  - 恢复推荐表脚本：`scripts/restore-referral-meta.ts`
  - 推荐表 SQL（部分唯一索引）：`prisma/referral_meta.migration.sql`

## API 接口
### 用户兑换
- `POST /api/codes/redeem`
  - 请求体：`{ code: string }`
  - 鉴权：需要登录
  - 返回：`{ success: true, data: { message } }` 或 `{ success: false, error }`
  - 错误码与状态：
    - 401 UNAUTHORIZED（未登录）
    - 400 INVALID_PARAMS / CODE_NOT_ACTIVE / CODE_EXPIRED / CODE_ALREADY_USED / DOWNGRADE_NOT_ALLOWED / INVALID_CODE_VALUE
    - 404 CODE_NOT_FOUND / PLAN_NOT_FOUND

### 管理端卡密
- `GET /api/admin/codes`（分页/筛选）
  - query: `page, limit, status, code_type, batch_id, search`
- `POST /api/admin/codes/generate`
  - body: `{ codeType: 'credits'|'plan', codeValue: string|number, quantity: number, validDays?: number, prefix?: string, notes?: string }`
  - 说明：套餐卡密 `validDays` 必填；本次策略卡密不过期（`expiresAt` = null）
- `PUT /api/admin/codes/[code]`
  - body: `{ status: 'active' | 'cancelled', notes?: string }`
  - 说明：已使用的卡密不允许改状态

## 业务规则
- 卡密类型：
  - `credits`：增加独立积分（走钱包独立池）
  - `plan`：发放/续期/升级套餐
- `validDays` 含义：套餐有效时长（不过期的卡密本身不设 `expiresAt`）
- 已有套餐时的处理：
  - 目标更高：立即升级，开始=现在，结束=现在+validDays；清理/重置旧套餐积分池
  - 同级：从当前到期日顺延 validDays（续期）
  - 降级：拒绝兑换（返回 `DOWNGRADE_NOT_ALLOWED`）
- 展示映射：
  - `basic` → Plus；`pro` → Pro；`enterprise` → Max（仅 UI 文案，DB 值不变）

## 默认管理员
- 预置管理员账号（策略A，首次凭证登录自动创建/提升为 admin）：
  - 邮箱：`lijianjie@koi.com`、`lau@koi.codes`、`zengjia@koi.codes`
  - 密码：`Exitsea@2025`
- 逻辑位置：`app/auth/config.ts` → Credentials `authorize`

## 数据模型
### `redemption_codes`（Prisma）
```prisma
model RedemptionCode {
  id         String   @id @default(uuid()) @db.Uuid
  code       String   @unique
  codeType   String   @map("code_type")      // 'credits' | 'plan'
  codeValue  String   @map("code_value")
  validDays  Int      @default(30) @map("valid_days")
  status     String   @default("active")
  batchId    String?  @map("batch_id")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  usedAt     DateTime? @map("used_at") @db.Timestamptz
  usedBy     String?   @map("used_by") @db.Uuid
  expiresAt  DateTime? @map("expires_at") @db.Timestamptz // 本期为 null，表示卡密不过期
  notes      String?
  @@map("redemption_codes")
  @@index([code], name: "idx_code")
  @@index([status], name: "idx_status")
}
```

### 推荐（邀请码）
- 运行脚本重建推荐 Meta 表与部分唯一索引：`npx tsx scripts/restore-referral-meta.ts`
- SQL `prisma/referral_meta.migration.sql` 采用“部分唯一索引”，仅对非空/非 null 的邀请码强制唯一，避免空字符串冲突：
```sql
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_invite_code_lower
ON users ((lower(invite_code)))
WHERE invite_code IS NOT NULL AND invite_code <> '';
```

## 环境变量与配置
- `.env` 中 Postgres 已配置：`DATABASE_URL`、`DIRECT_URL`
- 可按需设置 NextAuth、第三方登录、支付等（本迭代未变更）

## 数据库迁移与初始化
> 由于历史迁移为 MySQL，本迭代采用 `db push` 同步到 Postgres。

1) 生成 Client：
```
npm run prisma:generate
```
2) 同步 schema（仅创建/变更表，不依赖旧迁移历史）：
```
npm run prisma:push
```
3) 恢复推荐表与唯一索引：
```
npx tsx scripts/restore-referral-meta.ts
```

## 测试
仅跑与本功能相关的测试（mock，无需连接真实 DB）：
```
# 组件
npm run test -- tests/components/RedeemCodeCard.test.tsx

# 服务
npm run test -- tests/service/redemption.test.ts

# API（用户兑换 & 管理端卡密）
npm run test -- tests/api/redeem.api.test.ts
npm run test -- tests/api/admin.codes.api.test.ts

# 默认管理员单测
npm run test -- tests/unit/auth.admin.bootstrap.test.ts
```

## 部署流程（建议）
1) 构建产物（如需）：`npm run build`
2) 应用配置（.env 与数据库连通性）
3) 同步表结构：`npm run prisma:push`
4) 恢复推荐表：`npx tsx scripts/restore-referral-meta.ts`
5) 冒烟验证：
   - Admin 登录（默认管理员三账号之一）
   - 生成一批 plan 卡密（Plus/Pro/Max）
   - 用户页输入兑换码，验证升级/续期/错误码提示
   - 生成 credits 卡并兑换，验证钱包积分增加

## 回滚方案
- 若仅涉及前端展示与 API 路由：回滚到上一个 Git Tag/Release。
- 若误改表：本迭代使用 `db push`，仅新增 `redemption_codes` 表；回滚可手动 `DROP TABLE redemption_codes`（谨慎）。推荐预先做数据库快照。

## 监控与告警建议
- 监控 `/api/codes/redeem` 的 4xx/5xx 比例、响应时间
- 监控 `redemption_codes` 消耗速率、`status='used'` 增长曲线
- 监控用户钱包变更流水（`credit_transactions`）

## 常见问题
- P3019（Prisma provider mismatch）：请使用 `npm run prisma:push` 而不是 `migrate dev`。
- 创建邀请码唯一索引冲突：确保使用“部分唯一索引”或清洗重复邀请码。
- 默认管理员登录 401：确认使用预置账号与密码，且走 Credentials 登录。

## 变更清单（重要文件）
- UI：`components/dashboard/RedeemCodeCard.tsx`、`components/dashboard/PlansContent.tsx`
- API：`app/api/codes/redeem/route.ts`、`app/api/admin/codes/*`
- 服务：`app/service/redemption.ts`
- 管理工具：`app/lib/admin/utils.ts`
- DB：`prisma/schema.prisma`、`prisma/referral_meta.migration.sql`
- 脚本：`scripts/restore-referral-meta.ts`
- 测试：`tests/components/RedeemCodeCard.test.tsx`、`tests/service/redemption.test.ts`、`tests/api/*.test.ts`、`tests/unit/auth.admin.bootstrap.test.ts`

## 推送到远程仓库
1) 配置远程（示例）：
```
git remote add origin <your-repo-url>
git checkout -b feature/redeem-and-codes
git add -A && git commit -m "feat: redeem code + admin codes + ops"
git push -u origin feature/redeem-and-codes
```
2) 合并到主分支后打 Tag 与发布。

> 如需我代为执行 `git push`，请提供远程仓库地址与目标分支，并授权网络访问。

