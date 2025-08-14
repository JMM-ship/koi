# Dashboard 数据库集成设置指南

## 快速开始

### 1. 设置数据库

运行以下命令或双击批处理文件：

```bash
# Windows 用户
setup-dashboard-db.bat

# 或手动执行
npx prisma generate
npx prisma db push
npx tsx scripts/seed-dashboard.ts
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问 Dashboard

打开浏览器访问 `http://localhost:3000/dashboard`

## 功能说明

Dashboard 页面现已接入真实数据库，包含以下功能：

1. **消费趋势图表** - 显示最近7天的积分/金钱/代币消费趋势
2. **模型使用记录** - 显示 AI 模型的使用历史
3. **积分统计** - 显示今日/本周/本月的积分消耗
4. **积分余额** - 显示当前积分余额
5. **独立积分** - 显示独立积分信息
6. **当前套餐** - 显示用户当前的订阅套餐

## 认证说明

系统支持两种认证模式：

1. **生产模式**：使用 NextAuth 进行真实用户认证
2. **开发模式**：如果未配置 NextAuth，将自动使用模拟认证

在开发环境下，系统会自动创建一个测试用户用于测试。

## 文件结构

```
├── lib/
│   ├── auth.ts          # 认证函数
│   ├── auth-mock.ts     # 模拟认证（开发用）
│   └── prisma.ts        # Prisma 客户端
├── app/api/dashboard/
│   ├── route.ts         # 主 API 端点
│   ├── consumption-trends/
│   │   └── route.ts     # 消费趋势 API
│   └── model-usage/
│       └── route.ts     # 模型使用 API
├── components/dashboard/
│   ├── WorkSummaryChart.tsx    # 消费趋势图表
│   ├── TeamMembers.tsx         # 模型使用记录
│   ├── ExchangeBalance.tsx     # 积分统计
│   ├── SatisfactionRate.tsx    # 积分余额
│   ├── IndependentCredits.tsx  # 独立积分
│   └── VisitsByLocation.tsx    # 当前套餐
└── scripts/
    └── seed-dashboard.ts        # 测试数据初始化脚本
```

## 故障排除

### 问题：Module not found 错误

确保运行了 `npx prisma generate` 生成 Prisma Client。

### 问题：数据库连接失败

检查 `.env` 文件中的 `DATABASE_URL` 是否正确配置。

### 问题：页面显示 "Loading..."

1. 检查控制台是否有错误信息
2. 确保数据库已正确迁移
3. 运行测试数据初始化脚本

### 问题：认证失败

在开发环境下，系统会自动使用模拟认证。如果需要真实认证，请配置 NextAuth。

## 测试数据

运行以下命令初始化测试数据：

```bash
npx tsx scripts/seed-dashboard.ts
```

这将创建：
- 最近7天的消费趋势数据
- 20条模型使用记录
- 积分余额信息
- 30天的积分交易记录