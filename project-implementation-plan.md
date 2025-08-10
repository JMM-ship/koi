# AstraX AI Solutions - 项目实施计划

## 一、项目现状分析

### ✅ 已完成的功能

#### 前端界面
- **公共页面**：首页、关于、服务、博客、定价、联系页面
- **认证页面**：登录/注册页面（支持邮箱验证码、Google登录）
- **Dashboard界面**：
  - 仪表盘主页（含图表、统计卡片）
  - 订阅管理页面
  - API Keys管理页面
  - 购买计划页面
  - 个人资料页面

#### 后端基础
- **认证系统**：NextAuth配置（Google、GitHub、邮箱）
- **数据库架构**：完整的表结构设计
- **基础API**：注册、登录、发送验证码

### ❌ 待完成的功能（MVP必需）

根据需求文档的P0优先级，以下功能必须在MVP版本中实现：

## 二、MVP版本核心功能清单（4周计划）

### 第1周：API接口开发

#### 1.1 积分管理API
```
POST   /api/credits/balance      - 获取用户积分余额
GET    /api/credits/history      - 获取积分历史记录
POST   /api/credits/consume      - 积分消费（内部调用）
POST   /api/credits/redeem       - 卡密兑换积分
GET    /api/credits/statistics   - 获取消耗统计数据
```

#### 1.2 API密钥管理
```
POST   /api/keys/create          - 创建新密钥
GET    /api/keys/list            - 获取密钥列表
DELETE /api/keys/:id             - 删除密钥
POST   /api/keys/:id/reset       - 重置密钥
POST   /api/keys/validate        - 验证密钥（供外部API调用）
GET    /api/keys/:id/usage       - 获取密钥使用统计
```

#### 1.3 订阅管理API
```
GET    /api/subscription/current    - 获取当前订阅信息
GET    /api/subscription/plans      - 获取可用套餐列表
POST   /api/subscription/redeem     - 兑换卡密
GET    /api/subscription/history    - 获取订阅历史
```

#### 1.4 统计数据API
```
GET    /api/dashboard/summary       - 获取仪表盘摘要数据
GET    /api/dashboard/chart         - 获取图表数据
GET    /api/dashboard/consumption   - 获取消耗趋势
```

### 第2周：前端功能对接

#### 2.1 Dashboard页面数据对接
- [ ] 连接真实的积分消耗统计
- [ ] 实现API调用次数统计
- [ ] 对接消耗趋势图表
- [ ] 显示真实的套餐信息

#### 2.2 订阅管理功能
- [ ] 实现卡密兑换功能
- [ ] 显示积分获取/消耗记录
- [ ] 套餐状态实时更新
- [ ] 添加积分余额显示

#### 2.3 API Keys管理
- [ ] 实现创建密钥功能
- [ ] 实现删除密钥功能
- [ ] 显示密钥使用统计
- [ ] 添加复制密钥提示

#### 2.4 个人设置
- [ ] 实现密码修改功能
- [ ] 邮箱绑定功能
- [ ] 个人信息更新

### 第3周：管理员功能 & 业务逻辑

#### 3.1 管理员页面（基础版）
```
/dashboard/admin              - 管理员仪表盘
/dashboard/admin/users        - 用户管理
/dashboard/admin/vouchers     - 卡密管理
```

#### 3.2 管理员API
```
GET    /api/admin/users          - 获取用户列表
PATCH  /api/admin/users/:id      - 更新用户状态
POST   /api/admin/users/:id/credits - 调整用户积分
POST   /api/admin/vouchers/generate - 批量生成卡密
GET    /api/admin/vouchers       - 获取卡密列表
PATCH  /api/admin/vouchers/:id   - 更新卡密状态
```

#### 3.3 业务逻辑实现
- [ ] 积分消费计算逻辑
- [ ] API调用计费机制
- [ ] 积分不足处理
- [ ] 套餐过期处理
- [ ] 卡密有效性验证

### 第4周：测试、优化与部署

#### 4.1 功能测试
- [ ] 用户注册登录流程测试
- [ ] 积分充值消费测试
- [ ] API密钥创建使用测试
- [ ] 管理员功能测试

#### 4.2 性能优化
- [ ] API响应时间优化
- [ ] 数据库查询优化
- [ ] 前端加载优化
- [ ] 缓存策略实施

#### 4.3 安全加固
- [ ] API限流实现
- [ ] 输入验证增强
- [ ] SQL注入防护
- [ ] XSS防护

#### 4.4 部署准备
- [ ] 环境变量配置
- [ ] 生产数据库迁移
- [ ] 错误监控配置
- [ ] 备份策略制定

## 三、技术实施细节

### 3.1 数据库操作

#### 需要创建的Model文件
```typescript
// models/credit.ts - 积分操作
- getUserCredits(userId)
- addCredits(userId, amount, reason)
- consumeCredits(userId, amount, service)
- getCreditHistory(userId, limit)

// models/apikey.ts - API密钥操作
- createApiKey(userId, name)
- getApiKeys(userId)
- deleteApiKey(keyId)
- validateApiKey(key)
- updateKeyUsage(keyId, usage)

// models/subscription.ts - 订阅操作
- getCurrentSubscription(userId)
- updateSubscription(userId, planId)
- getSubscriptionHistory(userId)

// models/voucher.ts - 卡密操作
- generateVouchers(count, credits, expiry)
- redeemVoucher(code, userId)
- getVoucherList(filter)
- updateVoucherStatus(voucherId, status)
```

### 3.2 中间件实现

```typescript
// middleware/auth.ts - 认证中间件
- requireAuth() - 需要登录
- requireAdmin() - 需要管理员权限

// middleware/rateLimit.ts - 限流中间件
- apiRateLimit() - API调用限流
- userRateLimit() - 用户操作限流

// middleware/validation.ts - 参数验证
- validateRequest() - 请求参数验证
```

### 3.3 工具函数

```typescript
// utils/credits.ts - 积分计算
- calculateConsumption(service, params)
- checkCreditBalance(userId, required)

// utils/statistics.ts - 统计计算
- calculateDailyStats(userId)
- calculateMonthlyStats(userId)
- generateTrendData(userId, days)
```

## 四、API调用流程示例

### 4.1 外部API调用流程
```
1. 客户端发送请求（携带API Key）
   ↓
2. 验证API Key有效性
   ↓
3. 检查用户积分余额
   ↓
4. 执行AI服务（调用实际的AI API）
   ↓
5. 扣除相应积分
   ↓
6. 记录API调用日志
   ↓
7. 返回结果给客户端
```

### 4.2 卡密兑换流程
```
1. 用户输入卡密
   ↓
2. 验证卡密有效性
   ↓
3. 检查卡密是否已使用
   ↓
4. 为用户增加积分
   ↓
5. 标记卡密为已使用
   ↓
6. 记录兑换日志
   ↓
7. 返回成功消息
```

## 五、数据库查询优化建议

### 5.1 需要添加的索引
```sql
-- 积分记录表索引
CREATE INDEX idx_credits_user_date ON credits(user_id, created_at DESC);

-- API调用日志索引
CREATE INDEX idx_api_logs_key_date ON api_logs(api_key_id, created_at DESC);
CREATE INDEX idx_api_logs_user ON api_logs(user_id);

-- 订单表索引
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
```

### 5.2 常用查询优化
```sql
-- 获取用户当日消耗（使用物化视图）
CREATE MATERIALIZED VIEW daily_consumption AS
SELECT 
    user_id,
    DATE(created_at) as date,
    SUM(amount) as total
FROM credits
WHERE type = 'consume'
GROUP BY user_id, DATE(created_at);
```

## 六、前端状态管理

### 6.1 需要管理的全局状态
```typescript
// stores/userStore.ts
- user: 用户信息
- credits: 积分余额
- subscription: 订阅信息

// stores/apiKeyStore.ts
- apiKeys: 密钥列表
- usage: 使用统计

// stores/dashboardStore.ts
- statistics: 统计数据
- charts: 图表数据
```

### 6.2 实时更新策略
- 使用WebSocket或轮询更新积分余额
- API调用后立即更新本地状态
- 定期同步服务器数据

## 七、测试用例清单

### 7.1 单元测试
- [ ] Model层函数测试
- [ ] 工具函数测试
- [ ] 中间件测试

### 7.2 集成测试
- [ ] API接口测试
- [ ] 认证流程测试
- [ ] 支付流程测试

### 7.3 E2E测试
- [ ] 用户注册到使用完整流程
- [ ] 管理员操作流程
- [ ] 异常情况处理

## 八、部署清单

### 8.1 环境变量
```env
# 数据库
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=

# 认证
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# 邮件
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# AI服务
OPENAI_API_KEY=
AI_SERVICE_URL=

# 支付（后续添加）
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
```

### 8.2 部署步骤
1. 配置生产环境变量
2. 运行数据库迁移
3. 构建生产版本
4. 配置反向代理
5. 设置SSL证书
6. 配置监控告警
7. 设置自动备份

## 九、监控指标

### 9.1 业务指标
- 日活跃用户数
- API调用量
- 积分消耗量
- 订阅转化率

### 9.2 技术指标
- API响应时间
- 错误率
- 数据库查询性能
- 服务器资源使用

## 十、风险管理

### 10.1 技术风险
- **风险**：API限流不当导致服务不可用
  **对策**：实施渐进式限流，监控调用模式

- **风险**：积分计算错误导致损失
  **对策**：添加事务处理，实施审计日志

### 10.2 业务风险
- **风险**：卡密被盗用
  **对策**：IP限制，异常检测

- **风险**：恶意用户消耗资源
  **对策**：用户行为分析，自动封禁机制

## 十一、后续优化计划（P1/P2功能）

### Phase 2（第5-8周）
- 邀请系统实现
- 支付网关集成
- 高级统计分析
- 批量操作功能

### Phase 3（第9-12周）
- AI服务扩展
- 多语言支持
- 移动端适配
- 高级管理功能

## 十二、每日检查清单

### Week 1 每日任务
- **Day 1-2**: 积分管理API开发
- **Day 3-4**: API密钥管理开发
- **Day 5**: 订阅管理API开发

### Week 2 每日任务
- **Day 1-2**: Dashboard数据对接
- **Day 3**: 订阅管理功能对接
- **Day 4-5**: API Keys功能对接

### Week 3 每日任务
- **Day 1-2**: 管理员页面开发
- **Day 3-4**: 业务逻辑实现
- **Day 5**: 集成测试

### Week 4 每日任务
- **Day 1-2**: 功能测试与修复
- **Day 3**: 性能优化
- **Day 4**: 安全加固
- **Day 5**: 部署上线

---

**最后更新时间**：2024-08-10
**负责人**：开发团队
**版本**：MVP 1.0