# 订单系统初步设置指南

## ✅ 已完成的功能

1. **套餐页面已更新** - `/components/dashboard/PlansContent.tsx`
   - 从数据库获取套餐数据
   - 显示当前用户套餐状态
   - 点击购买显示确认弹框
   - 确认后直接完成购买（模拟支付）

2. **API接口已创建**
   - `/api/packages` - 获取套餐列表
   - `/api/orders/create` - 创建订单
   - `/api/orders/pay/mock` - 模拟支付成功

3. **数据模型已完成**
   - 套餐模型
   - 订单模型
   - 积分管理模型
   - 用户套餐模型

## 🚀 快速启动步骤

### 1. 安装依赖（可选，用于更好的用户体验）
```bash
# 如果想要更好的通知效果，安装toast
npm install react-toastify

# 如果已经安装了uuid库，跳过
npm install uuid
npm install --save-dev @types/uuid
```

### 2. 确保数据库已更新
```bash
# 同步数据库结构
npx prisma db push

# 生成Prisma Client
npx prisma generate
```

### 3. 插入测试套餐数据
在数据库中执行以下SQL插入示例套餐：

```sql
-- 插入测试套餐数据
INSERT INTO packages (id, name, name_en, version, description, price, daily_credits, valid_days, is_active, is_recommended, sort_order, currency) VALUES
(UUID(), '基础套餐', 'Basic', '1.0.0', '适合个人用户', 39900, 10800, 30, true, false, 1, 'CNY'),
(UUID(), '专业套餐', 'Professional', '1.0.0', '适合专业用户', 69900, 30000, 30, true, true, 2, 'CNY'),
(UUID(), '企业套餐', 'Enterprise', '1.0.0', '适合企业团队', 179900, 100000, 30, true, false, 3, 'CNY');
```

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 访问套餐页面
打开浏览器访问：`http://localhost:3000/dashboard/plans`

## 📝 使用说明

### 购买套餐流程：
1. 用户登录系统
2. 进入套餐页面 `/dashboard/plans`
3. 选择需要的套餐，点击"选择此套餐"
4. 在确认弹框中点击"确认购买"
5. 系统自动完成以下操作：
   - 创建订单
   - 模拟支付成功
   - 激活用户套餐
   - 分配套餐积分
   - 显示成功提示

### 注意事项：
- 当前使用模拟支付，无需真实付款
- 套餐积分每日重置（需配置定时任务）
- 用户只能同时拥有一个活跃套餐
- 购买新套餐会替换当前套餐

## 🔧 可选优化

### 1. 添加Toast通知（推荐）
如果已安装 `react-toastify`，可以在 `PlansContent.tsx` 中恢复toast：

```typescript
// 1. 取消注释导入
import { toast } from "react-toastify";

// 2. 将所有 alert() 替换为 toast.success() 或 toast.error()

// 3. 在主布局文件中添加 ToastContainer
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 在布局中添加
<ToastContainer position="top-right" theme="dark" />
```

### 2. 配置每日积分重置（可选）
创建定时任务文件 `app/jobs/resetCredits.ts`：

```typescript
import { dailyResetTask } from '@/app/service/packageManager';

// 使用node-cron或其他调度器
// 每天凌晨0点执行
export async function runDailyReset() {
  const result = await dailyResetTask();
  console.log('Daily reset result:', result);
}
```

### 3. 添加支付集成（未来）
当需要真实支付时：
1. 集成Stripe/支付宝/微信支付
2. 修改 `paymentMethod` 从 'mock' 改为实际支付方式
3. 实现支付回调处理

## ❓ 常见问题

### Q: 为什么看不到套餐？
A: 确保数据库中有套餐数据，执行上面的SQL插入语句。

### Q: 购买失败怎么办？
A: 检查以下内容：
1. 用户是否已登录
2. 数据库连接是否正常
3. Prisma Client是否已生成
4. 检查浏览器控制台错误信息

### Q: 如何查看购买的套餐？
A: 购买成功后，页面会自动刷新显示当前套餐。也可以访问积分页面查看。

### Q: 如何测试积分使用？
A: 调用 `/api/credits/use` 接口，传入使用数量。

## 📊 系统状态检查

运行以下命令检查系统状态：
```bash
# 检查系统完整性
node order-system-check.js

# 测试数据库连接
node test-prisma.js
```

## 🎉 完成！

现在你的订单系统已经可以初步运行了。用户可以：
- 查看套餐列表
- 购买套餐（模拟支付）
- 查看当前套餐状态
- 自动获得套餐积分

后续可以根据需要添加：
- 真实支付集成
- 定时任务
- 更多套餐类型
- 优惠券系统
- 推荐奖励