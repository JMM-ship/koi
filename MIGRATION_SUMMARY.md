# 数据库迁移总结

## 迁移概览
成功从 MySQL 数据库迁移到 PostgreSQL (Supabase)

### Supabase 项目信息
- **项目 URL**: https://wbswuxclfayxxamozsaq.supabase.co
- **数据库**: PostgreSQL 15.x

## 主要变更

### 1. 数据库架构变更
- **主键类型**: Int (自增) → UUID (字符串)
- **字段命名**: 驼峰命名 → 下划线命名（在数据库层）
- **BigInt 处理**: 使用 BigInt 类型处理大数值

### 2. 模型变更

#### 核心模型保留
- ✅ User
- ✅ Wallet (替代 CreditBalance)
- ✅ CreditTransaction
- ✅ Order
- ✅ Package
- ✅ UserPackage
- ✅ ApiKey
- ✅ UsageRecord

#### 已移除模型（功能禁用）
- ❌ RedemptionCode (卡密功能)
- ❌ Affiliate (推荐功能)
- ❌ ModelUsage (由 UsageRecord 替代)
- ❌ ConsumptionTrend (由 CreditTransaction 聚合替代)

### 3. 字段映射

#### User 模型
- `uuid` → `id` (现在是主键)
- 移除: `signinType`, `inviteCode`, `invitedBy` 等

#### CreditBalance → Wallet
- `user_id` → `userId`
- `package_credits` → `packageTokensRemaining`
- `independent_credits` → `independentTokens`

#### ApiKey 模型
- `apiKey` → `keyHash`
- `userUuid` → `ownerUserId`
- `title` → `name`

#### UserPackage 模型
- `endDate` → `endAt`
- `startDate` → `startAt`
- `dailyCredits` → `dailyPoints`

### 4. API 路由更新

所有 API 路由已更新以适配新的数据库结构：

- `/api/admin/*` - 管理后台 API
- `/api/credits/*` - 积分管理 API
- `/api/dashboard/*` - 仪表板 API
- `/api/orders/*` - 订单 API
- `/api/packages/*` - 套餐 API
- `/api/apikeys/*` - API密钥管理

### 5. 认证系统更新

NextAuth 配置已更新：
- 使用 UUID 作为用户标识
- 兼容处理 `id` 和 `uuid` 字段
- 更新 session 和 JWT 令牌处理

## 环境变量

需要在 `.env` 文件中配置：

```env
# Supabase 数据库连接
DATABASE_URL="postgresql://postgres.wbswuxclfayxxamozsaq:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Direct URL (用于 Prisma 迁移)
DIRECT_URL="postgresql://postgres.wbswuxclfayxxamozsaq:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Supabase 项目配置
NEXT_PUBLIC_SUPABASE_URL="https://wbswuxclfayxxamozsaq.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_KEY]"
```

## 运行指南

### 1. 安装依赖
```bash
npm install
```

### 2. 生成 Prisma 客户端
```bash
npx prisma generate
```

### 3. 运行数据库迁移（如需要）
```bash
npx prisma migrate dev
```

### 4. 启动开发服务器
```bash
npm run dev
```

## 注意事项

1. **数据迁移**: 本次迁移未包含历史数据迁移，如需迁移历史数据，需要编写额外的迁移脚本

2. **禁用功能**:
   - 卡密功能 (RedemptionCode) 已禁用
   - 推荐功能 (Affiliate) 已禁用
   - 如需恢复这些功能，需要在 Prisma schema 中添加相应模型

3. **类型安全**: 所有 TypeScript 类型错误已修复，确保类型安全

4. **兼容性**: 保持了与前端的 API 兼容性，通过数据转换层实现

## 测试建议

1. 测试用户注册和登录
2. 测试积分系统（充值、消费、查询）
3. 测试套餐购买和续费
4. 测试 API 密钥管理
5. 测试管理后台功能

## 技术栈

- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma 5.x
- **框架**: Next.js 14
- **认证**: NextAuth.js
- **语言**: TypeScript

---

迁移完成时间: 2024