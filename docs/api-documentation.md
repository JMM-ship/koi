# API接口文档

## 1. 接口概述

### 1.1 基础信息
- **基础URL**: `https://api.koi.ai/api`
- **协议**: HTTPS
- **数据格式**: JSON
- **认证方式**: JWT Token / API Key

### 1.2 通用响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### 1.3 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### 1.4 认证方式
请求头添加：
```
Authorization: Bearer <token>
```
或
```
X-API-Key: <api-key>
```

## 2. 套餐管理接口

### 2.1 获取套餐列表
**接口**: `GET /api/packages`

**描述**: 获取所有可用套餐列表

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| active | boolean | 否 | 是否只返回激活套餐 |
| currency | string | 否 | 货币类型(CNY/USD) |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "pkg_001",
        "name": "基础套餐",
        "nameEn": "Basic Plan",
        "version": "1.0.0",
        "description": "适合个人用户使用",
        "price": 39900,
        "originalPrice": 59900,
        "currency": "CNY",
        "dailyCredits": 10800,
        "validDays": 30,
        "features": [
          "每日10,800积分",
          "全速响应",
          "技术支持"
        ],
        "limitations": {
          "maxRequests": 1000,
          "maxFileSize": "10MB"
        },
        "tag": "HOT",
        "isRecommended": true
      }
    ],
    "total": 3
  }
}
```

### 2.2 获取套餐详情
**接口**: `GET /api/packages/:id`

**描述**: 获取指定套餐详细信息

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 套餐ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "pkg_001",
    "name": "基础套餐",
    "nameEn": "Basic Plan",
    "version": "1.0.0",
    "description": "适合个人用户使用",
    "price": 39900,
    "originalPrice": 59900,
    "currency": "CNY",
    "dailyCredits": 10800,
    "validDays": 30,
    "features": [
      "每日10,800积分",
      "全速响应",
      "技术支持"
    ],
    "limitations": {
      "maxRequests": 1000,
      "maxFileSize": "10MB"
    },
    "tag": "HOT",
    "isRecommended": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

### 2.3 获取用户当前套餐
**接口**: `GET /api/packages/active`

**描述**: 获取当前用户的活跃套餐

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "userPackage": {
      "id": "up_001",
      "packageId": "pkg_001",
      "packageName": "基础套餐",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z",
      "dailyCredits": 10800,
      "remainingDays": 16,
      "isAutoRenew": false,
      "packageSnapshot": {
        "name": "基础套餐",
        "price": 39900,
        "features": ["每日10,800积分"]
      }
    },
    "creditBalance": {
      "packageCredits": 8500,
      "independentCredits": 2000,
      "totalAvailable": 10500
    }
  }
}
```

## 3. 订单管理接口

### 3.1 创建订单
**接口**: `POST /api/orders/create`

**描述**: 创建新订单

**请求体**:
```json
{
  "orderType": "package",  // package | credits
  "packageId": "pkg_001",  // 套餐订单必填
  "creditAmount": 10000,   // 积分订单必填
  "paymentMethod": "stripe",
  "couponCode": "DISCOUNT20"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "order": {
      "orderNo": "ORD20240115001",
      "orderType": "package",
      "amount": 39900,
      "discountAmount": 7980,
      "finalAmount": 31920,
      "currency": "CNY",
      "status": "pending",
      "paymentUrl": "https://checkout.stripe.com/session/xxx",
      "expiresAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 3.2 获取订单列表
**接口**: `GET /api/orders/list`

**描述**: 获取用户订单列表

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码(默认1) |
| pageSize | integer | 否 | 每页数量(默认20) |
| status | string | 否 | 订单状态 |
| orderType | string | 否 | 订单类型 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderNo": "ORD20240115001",
        "orderType": "package",
        "packageName": "基础套餐",
        "amount": 39900,
        "status": "paid",
        "createdAt": "2024-01-15T10:00:00Z",
        "paidAt": "2024-01-15T10:05:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### 3.3 获取订单详情
**接口**: `GET /api/orders/:orderNo`

**描述**: 获取订单详细信息

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderNo | string | 是 | 订单号 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "orderNo": "ORD20240115001",
    "orderType": "package",
    "packageId": "pkg_001",
    "packageName": "基础套餐",
    "packageSnapshot": {
      "name": "基础套餐",
      "price": 39900,
      "dailyCredits": 10800,
      "validDays": 30
    },
    "amount": 39900,
    "discountAmount": 7980,
    "finalAmount": 31920,
    "currency": "CNY",
    "status": "paid",
    "paymentMethod": "stripe",
    "couponCode": "DISCOUNT20",
    "createdAt": "2024-01-15T10:00:00Z",
    "paidAt": "2024-01-15T10:05:00Z",
    "startDate": "2024-01-15T00:00:00Z",
    "endDate": "2024-02-14T23:59:59Z"
  }
}
```

### 3.4 支付回调
**接口**: `POST /api/orders/pay/callback`

**描述**: 支付平台回调接口

**请求体**: 根据支付平台不同而不同

**Stripe回调示例**:
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_xxx",
      "metadata": {
        "order_no": "ORD20240115001"
      },
      "payment_status": "paid",
      "customer_email": "user@example.com"
    }
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "Payment processed successfully"
}
```

## 4. 积分管理接口

### 4.1 获取积分余额
**接口**: `GET /api/credits/balance`

**描述**: 获取当前用户积分余额

**响应示例**:
```json
{
  "success": true,
  "data": {
    "balance": {
      "packageCredits": 8500,
      "independentCredits": 2000,
      "totalAvailable": 10500,
      "totalUsed": 5300,
      "packageResetAt": "2024-01-16T00:00:00Z"
    },
    "usage": {
      "todayUsed": 2300,
      "monthUsed": 45000,
      "dailyLimit": 10800
    }
  }
}
```

### 4.2 获取积分流水
**接口**: `GET /api/credits/transactions`

**描述**: 获取积分交易流水

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码(默认1) |
| pageSize | integer | 否 | 每页数量(默认20) |
| type | string | 否 | 交易类型(income/expense/reset) |
| creditType | string | 否 | 积分类型(package/independent) |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "trans_001",
        "transNo": "T20240115001",
        "type": "expense",
        "creditType": "package",
        "amount": 100,
        "beforeBalance": 10500,
        "afterBalance": 10400,
        "description": "AI对话服务",
        "createdAt": "2024-01-15T10:00:00Z"
      },
      {
        "id": "trans_002",
        "transNo": "T20240115002",
        "type": "income",
        "creditType": "independent",
        "amount": 5000,
        "beforeBalance": 10400,
        "afterBalance": 15400,
        "description": "购买独立积分",
        "orderNo": "ORD20240115002",
        "createdAt": "2024-01-15T11:00:00Z"
      },
      {
        "id": "trans_003",
        "transNo": "T20240116001",
        "type": "reset",
        "creditType": "package",
        "amount": 10800,
        "beforeBalance": 2100,
        "afterBalance": 10800,
        "description": "每日积分重置",
        "createdAt": "2024-01-16T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 156,
      "totalPages": 8
    }
  }
}
```

### 4.3 购买积分
**接口**: `POST /api/credits/purchase`

**描述**: 购买独立积分

**请求体**:
```json
{
  "amount": 10000,
  "paymentMethod": "stripe"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "order": {
      "orderNo": "ORD20240115003",
      "orderType": "credits",
      "creditAmount": 10000,
      "amount": 9900,
      "currency": "CNY",
      "status": "pending",
      "paymentUrl": "https://checkout.stripe.com/session/yyy"
    }
  }
}
```

### 4.4 使用积分
**接口**: `POST /api/credits/use`

**描述**: 扣减用户积分

**请求体**:
```json
{
  "amount": 100,
  "service": "chat",
  "metadata": {
    "model": "gpt-4",
    "tokens": 1500
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "transaction": {
      "transNo": "T20240115003",
      "amount": 100,
      "creditType": "package",
      "beforeBalance": 10500,
      "afterBalance": 10400,
      "description": "AI对话服务"
    },
    "balance": {
      "packageCredits": 8400,
      "independentCredits": 2000,
      "totalAvailable": 10400
    }
  }
}
```

## 5. 统计分析接口

### 5.1 获取使用统计
**接口**: `GET /api/stats/usage`

**描述**: 获取积分使用统计

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| period | string | 否 | 统计周期(day/week/month) |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsed": 45000,
      "totalPurchased": 50000,
      "averageDaily": 1500
    },
    "byService": {
      "chat": 30000,
      "image": 10000,
      "code": 5000
    },
    "trend": [
      {
        "date": "2024-01-01",
        "used": 1500,
        "purchased": 0
      },
      {
        "date": "2024-01-02",
        "used": 1800,
        "purchased": 10000
      }
    ]
  }
}
```

### 5.2 获取订单统计
**接口**: `GET /api/stats/orders`

**描述**: 获取订单统计数据

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| period | string | 否 | 统计周期(day/week/month/year) |
| groupBy | string | 否 | 分组方式(date/type/status) |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 156,
      "totalRevenue": 6234500,
      "averageOrderValue": 39900,
      "conversionRate": 0.65
    },
    "byType": {
      "package": {
        "count": 89,
        "revenue": 3551100
      },
      "credits": {
        "count": 67,
        "revenue": 2683400
      }
    },
    "trend": [
      {
        "date": "2024-01-01",
        "orders": 5,
        "revenue": 199500
      }
    ]
  }
}
```

## 6. Webhook通知

### 6.1 订单状态变更
**事件**: `order.status.changed`

**推送数据**:
```json
{
  "event": "order.status.changed",
  "timestamp": "2024-01-15T10:05:00Z",
  "data": {
    "orderNo": "ORD20240115001",
    "oldStatus": "pending",
    "newStatus": "paid",
    "userUuid": "user_123"
  }
}
```

### 6.2 套餐即将到期
**事件**: `package.expiring`

**推送数据**:
```json
{
  "event": "package.expiring",
  "timestamp": "2024-01-29T00:00:00Z",
  "data": {
    "userUuid": "user_123",
    "packageId": "pkg_001",
    "packageName": "基础套餐",
    "endDate": "2024-01-31T23:59:59Z",
    "daysRemaining": 3
  }
}
```

### 6.3 积分不足
**事件**: `credits.low`

**推送数据**:
```json
{
  "event": "credits.low",
  "timestamp": "2024-01-15T15:00:00Z",
  "data": {
    "userUuid": "user_123",
    "currentBalance": 500,
    "threshold": 1000
  }
}
```

## 7. 错误代码

| 错误代码 | HTTP状态码 | 说明 |
|---------|-----------|------|
| AUTH_REQUIRED | 401 | 需要认证 |
| AUTH_INVALID | 401 | 认证失败 |
| PERMISSION_DENIED | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| PACKAGE_NOT_FOUND | 404 | 套餐不存在 |
| ORDER_NOT_FOUND | 404 | 订单不存在 |
| INVALID_PARAMS | 400 | 参数错误 |
| INSUFFICIENT_CREDITS | 400 | 积分不足 |
| ORDER_EXPIRED | 400 | 订单已过期 |
| PAYMENT_FAILED | 400 | 支付失败 |
| DUPLICATE_ORDER | 409 | 订单重复 |
| SERVER_ERROR | 500 | 服务器错误 |
| SERVICE_UNAVAILABLE | 503 | 服务暂时不可用 |

## 8. 限流策略

### 8.1 API限流
- **认证用户**: 1000次/小时
- **API Key**: 10000次/小时
- **未认证用户**: 100次/小时

### 8.2 限流响应
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 1000,
      "remaining": 0,
      "resetAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

响应头：
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705316400
```

## 9. 测试环境

### 9.1 测试环境地址
- **基础URL**: `https://test-api.koi.ai/api`
- **支付测试**: 使用Stripe测试卡号

### 9.2 测试卡号
| 卡号 | 场景 |
|------|------|
| 4242 4242 4242 4242 | 成功 |
| 4000 0000 0000 0002 | 拒绝 |
| 4000 0000 0000 9995 | 余额不足 |

### 9.3 测试账号
```json
{
  "email": "test@koi.ai",
  "password": "Test123456",
  "apiKey": "test_key_xxx"
}
```

## 10. SDK支持

### 10.1 JavaScript/TypeScript
```typescript
import { KoiClient } from '@koi/sdk';

const client = new KoiClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.koi.ai'
});

// 获取套餐列表
const packages = await client.packages.list();

// 创建订单
const order = await client.orders.create({
  orderType: 'package',
  packageId: 'pkg_001'
});

// 获取积分余额
const balance = await client.credits.getBalance();
```

### 10.2 Python
```python
from koi_sdk import KoiClient

client = KoiClient(
    api_key='your_api_key',
    base_url='https://api.koi.ai'
)

# 获取套餐列表
packages = client.packages.list()

# 创建订单
order = client.orders.create(
    order_type='package',
    package_id='pkg_001'
)

# 获取积分余额
balance = client.credits.get_balance()
```

### 10.3 cURL示例
```bash
# 获取套餐列表
curl -X GET https://api.koi.ai/api/packages \
  -H "Authorization: Bearer <token>"

# 创建订单
curl -X POST https://api.koi.ai/api/orders/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "package",
    "packageId": "pkg_001"
  }'
```

## 11. 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0.0 | 2024-01-15 | 初始版本发布 |
| v1.1.0 | - | 添加优惠券功能 |
| v1.2.0 | - | 支持多币种 |
| v1.3.0 | - | 添加Webhook通知 |