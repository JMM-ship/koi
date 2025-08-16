# 套餐积分每日重置功能指南

## 功能概述

套餐积分每日重置功能允许系统自动或手动重置用户的套餐积分，确保用户每天都能获得套餐规定的积分额度。**独立积分不会被重置**，只有套餐积分会每日刷新。

## 核心特性

- ✅ **套餐积分每日重置**: 自动将套餐积分恢复到每日额度
- ✅ **独立积分保持不变**: 购买的独立积分不受重置影响
- ✅ **智能检查机制**: 避免重复重置，每天只重置一次
- ✅ **套餐到期处理**: 自动检测并处理过期套餐
- ✅ **详细日志记录**: 记录所有重置操作和积分流水
- ✅ **手动/自动触发**: 支持定时任务和手动API调用

## 文件结构

```
app/
├── service/
│   ├── creditResetService.ts    # 积分重置核心服务
│   ├── cronJobs.ts              # 定时任务管理
│   └── packageManager.ts        # 套餐管理（含到期处理）
├── api/
│   ├── admin/credits/reset/     # 管理员重置API
│   └── credits/check-reset/     # 用户自动检查API
└── models/
    ├── creditBalance.ts          # 积分余额模型
    └── creditTransaction.ts      # 积分流水模型

scripts/
├── cron-scheduler.ts            # 定时任务调度器
└── reset-credits.ts             # 手动重置测试脚本
```

## 使用方法

### 1. 自动定时重置（推荐）

#### 启动定时任务调度器

```bash
# 启动定时任务（持续运行）
npm run cron

# 或使用 node-cron 包
npx tsx scripts/cron-scheduler.ts
```

默认执行时间：
- **积分重置**: 每天 0:00
- **套餐到期检查**: 每天 1:00  
- **过期订单清理**: 每天 2:00

#### 配置环境变量

在 `.env` 文件中添加：

```env
# 启用定时任务
ENABLE_CRON_JOBS=true

# 时区设置（默认：Asia/Shanghai）
TZ=Asia/Shanghai

# 启动时立即执行一次
RUN_ON_START=false
```

### 2. 手动触发重置

#### 使用测试脚本

```bash
# 重置特定用户
npm run reset:credits -- --user <用户UUID>

# 重置所有用户
npm run reset:credits -- --all

# 检查重置状态
npm run reset:credits -- --check

# 显示帮助
npm run reset:credits -- --help
```

#### 使用管理员API

```typescript
// 重置所有用户
POST /api/admin/credits/reset
{
  "resetAll": true
}

// 重置特定用户
POST /api/admin/credits/reset
{
  "userUuid": "user-uuid-here"
}

// 获取重置状态
GET /api/admin/credits/reset
GET /api/admin/credits/reset?userUuid=xxx
```

### 3. 用户端自动检查

当用户访问系统时，可以调用检查API自动重置积分：

```typescript
// 检查并重置当前用户积分
GET /api/credits/check-reset

// 响应示例
{
  "success": true,
  "data": {
    "wasReset": true,
    "creditInfo": {
      "balance": {
        "packageCredits": 10800,
        "independentCredits": 5000,
        "totalAvailable": 15800
      }
    },
    "message": "Credits have been reset for today"
  }
}
```

### 4. 在前端集成

在 Dashboard 或其他页面加载时自动检查：

```typescript
// components/dashboard/DashboardContent.tsx
useEffect(() => {
  const checkAndResetCredits = async () => {
    try {
      const response = await fetch('/api/credits/check-reset');
      const data = await response.json();
      
      if (data.data.wasReset) {
        // 积分已重置，刷新显示
        showToast('积分已刷新！', 'success');
        refreshCreditDisplay();
      }
    } catch (error) {
      console.error('Failed to check credits:', error);
    }
  };
  
  checkAndResetCredits();
}, []);
```

## 重置逻辑说明

### 重置流程

1. **检查用户套餐状态**
   - 是否有活跃套餐
   - 套餐是否已过期
   - 今天是否已重置

2. **执行重置操作**
   - 将套餐积分设置为每日额度
   - 独立积分保持不变
   - 更新重置时间戳

3. **记录流水**
   - 创建积分变动记录
   - 记录重置前后余额
   - 保存操作元数据

### 积分计算规则

```typescript
// 重置前
总积分 = 套餐积分(可能已用部分) + 独立积分

// 重置后  
总积分 = 套餐每日额度 + 独立积分(不变)
```

**示例**：
- 用户套餐：10800积分/天
- 重置前：套餐积分 2000，独立积分 5000
- 重置后：套餐积分 10800，独立积分 5000

## 监控和日志

### 查看重置日志

```bash
# 查看今日重置统计
npm run reset:credits -- --check

# 输出示例
╔════════════════════════════════════════════════╗
║ Reset Status                                    ║
╠════════════════════════════════════════════════╣
║ Users reset today: 156                         ║
║ Active packages: 200                           ║
║ Expired packages (need cleanup): 5             ║
╚════════════════════════════════════════════════╝
```

### 查看积分流水

在数据库中查询 `credit_transactions` 表：

```sql
-- 查看今日重置记录
SELECT * FROM credit_transactions 
WHERE type = 'reset' 
  AND DATE(created_at) = CURDATE()
ORDER BY created_at DESC;

-- 统计重置情况
SELECT 
  DATE(created_at) as reset_date,
  COUNT(*) as reset_count,
  SUM(amount) as total_credits_reset
FROM credit_transactions
WHERE type = 'reset'
GROUP BY DATE(created_at)
ORDER BY reset_date DESC;
```

## 故障排查

### 常见问题

1. **积分没有重置**
   - 检查用户是否有活跃套餐
   - 检查套餐是否已过期
   - 查看上次重置时间
   - 确认定时任务是否运行

2. **重复重置**
   - 检查 `package_reset_at` 时间戳
   - 确认时区设置正确
   - 查看是否有多个调度器实例

3. **独立积分被重置**
   - 这不应该发生，检查代码是否被修改
   - 查看积分流水记录

### 调试命令

```bash
# 测试数据库连接
npx tsx -e "import {prisma} from './app/models/db'; prisma.$connect().then(()=>console.log('Connected')).catch(console.error)"

# 查看特定用户状态
npx tsx scripts/reset-credits.ts --user <UUID>

# 执行一次所有定时任务
npm run cron:once
```

## 性能优化

### 批量处理

系统使用批量操作优化性能：

- 批量查询活跃套餐
- 批量更新积分余额
- 批量创建流水记录

### 建议配置

对于大量用户（>10000）：

1. **分批处理**：修改 `resetAllPackageCredits` 实现分批
2. **异步队列**：使用 Bull/BullMQ 等队列系统
3. **数据库索引**：确保相关字段有索引

```sql
-- 推荐索引
CREATE INDEX idx_user_packages_active_end ON user_packages(is_active, end_date);
CREATE INDEX idx_credit_balances_reset ON credit_balances(package_reset_at);
```

## 安全注意事项

1. **权限控制**
   - 管理员API需要验证 `role === 'admin'`
   - 用户只能重置自己的积分

2. **并发控制**
   - 使用乐观锁防止并发问题
   - 避免同时运行多个调度器

3. **审计日志**
   - 所有重置操作都记录在 `credit_transactions`
   - 保留操作元数据用于审计

## 部署建议

### 开发环境

```bash
# 手动测试
npm run reset:credits -- --check
npm run reset:credits -- --user test-user-uuid
```

### 生产环境

1. **使用进程管理器**（PM2）

```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'koi-cron',
    script: './scripts/cron-scheduler.ts',
    interpreter: 'tsx',
    env: {
      NODE_ENV: 'production',
      ENABLE_CRON_JOBS: 'true',
      TZ: 'Asia/Shanghai'
    }
  }]
};

# 启动
pm2 start ecosystem.config.js
```

2. **使用 Docker**

```dockerfile
# 在 Dockerfile 中添加
CMD ["npm", "run", "cron"]
```

3. **使用 Kubernetes CronJob**

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: credit-reset
spec:
  schedule: "0 0 * * *"  # 每天0点
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: credit-reset
            image: your-app:latest
            command: ["npm", "run", "cron:once"]
```

## 总结

套餐积分每日重置功能已完全实现，支持：

- ✅ 自动定时重置
- ✅ 手动触发重置
- ✅ 用户访问时自动检查
- ✅ 独立积分不受影响
- ✅ 完整的日志和流水记录
- ✅ 套餐到期自动处理

建议在生产环境使用定时任务自动执行，确保用户每天都能获得应有的套餐积分。