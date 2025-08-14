# Dashboard API 文档

## 概述

Dashboard 页面现已接入数据库，不再使用假数据。以下是相关的数据模型和 API 接口说明。

## 数据模型

### 1. ConsumptionTrend (消费趋势)
存储每日的积分、金钱、代币消费统计数据。

### 2. ModelUsage (模型使用记录)
记录每次 AI 模型的使用情况，包括模型名称、使用类型、消耗积分等。

### 3. CreditBalance (积分余额)
存储用户的套餐积分和独立积分余额。

### 4. CreditTransaction (积分流水)
记录所有积分的收入和支出流水。

## API 接口

### 1. GET /api/dashboard
获取 Dashboard 页面的综合数据。

**响应数据：**
- `consumptionTrends`: 最近7天的消费趋势
- `creditBalance`: 用户积分余额信息
- `modelUsages`: 最近的模型使用记录
- `userPackage`: 用户套餐信息
- `userInfo`: 用户基本信息
- `creditStats`: 积分消耗统计（今日/本周/本月）

### 2. GET /api/dashboard/consumption-trends
获取消费趋势数据。

**查询参数：**
- `days`: 天数（默认7天）
- `type`: 类型（points/money/tokens）

**响应数据：**
```json
{
  "data": [
    { "date": "12/18", "value": 1500 }
  ],
  "stats": {
    "total": 10500,
    "average": 1500,
    "increase": 500,
    "percentage": "+5%",
    "unit": "Points"
  }
}
```

### 3. GET /api/dashboard/model-usage
获取模型使用历史。

**查询参数：**
- `limit`: 返回条数（默认10）
- `offset`: 偏移量（默认0）

**响应数据：**
```json
{
  "data": [
    {
      "id": "xxx",
      "modelName": "GPT-4o",
      "usageType": "Text Generation",
      "credits": 150,
      "timestamp": "2024-12-18T10:00:00Z",
      "status": "completed"
    }
  ],
  "total": 100,
  "limit": 10,
  "offset": 0
}
```

### 4. POST /api/dashboard/model-usage
记录新的模型使用。

**请求体：**
```json
{
  "modelName": "GPT-4o",
  "usageType": "Text Generation",
  "credits": 150,
  "metadata": {}
}
```

## 数据初始化

运行以下命令进行数据库迁移和初始化测试数据：

```bash
# 1. 生成 Prisma Client
npx prisma generate

# 2. 运行数据库迁移
npx prisma migrate dev --name add_dashboard_models

# 3. 初始化测试数据
npx tsx scripts/seed-dashboard.ts
```

## 页面组件

以下组件已更新为使用真实数据：

1. **WorkSummaryChart**: 消费趋势图表
   - 从 `/api/dashboard/consumption-trends` 获取数据
   - 支持切换 Points/Money/Tokens 视图

2. **TeamMembers**: 模型使用详情（原积分消耗明细）
   - 从 `/api/dashboard/model-usage` 获取数据
   - 显示最近的 AI 模型使用记录

3. **ExchangeBalance**: 积分消耗统计
   - 从 `/api/dashboard` 获取统计数据
   - 显示今日/本周/本月的消耗和排名

4. **SatisfactionRate**: 积分余额仪表盘
   - 从 `/api/dashboard` 获取余额数据
   - 显示剩余积分和使用比例

5. **IndependentCredits**: 独立积分卡片
   - 从 `/api/dashboard` 获取独立积分数据
   - 显示购买记录和剩余积分

6. **VisitsByLocation** (CurrentPlan): 当前套餐信息
   - 从 `/api/dashboard` 获取套餐数据
   - 显示套餐状态和功能列表

## 注意事项

1. 所有 API 需要用户认证，通过 `getAuth` 函数获取当前用户信息
2. 数据库查询使用 Prisma ORM，确保已正确配置 DATABASE_URL
3. 页面组件包含加载状态处理和错误处理
4. 当真实数据不可用时，会显示默认数据或空状态