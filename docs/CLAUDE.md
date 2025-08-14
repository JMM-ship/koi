# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference
总是用中文回答我

## Project Overview

这是一个 Claude Code 镜像站的控制台系统（包含Landing Page）。主要功能模块：
- 用户认证系统（邮箱密码、Google、GitHub OAuth）
- 套餐订阅和支付系统
- API密钥管理
- 积分系统（套餐积分、独立积分）
- 图片上传和分类管理（AWS S3）
- 博客内容管理
- 推广联盟系统
- 用户反馈系统
- 管理员面板（用户管理、卡密管理、统计数据）
- Toast通知系统（统一的用户交互反馈）

## Development Commands

```bash
# 开发服务器
npm run dev                # 启动开发服务器 (http://localhost:3000)

# 生产构建与部署
npm run build              # 生产构建 (自动运行 prisma generate)
npm run start              # 启动生产服务器

# 代码质量
npm run lint               # ESLint代码检查

# 数据库管理
npm run prisma:generate    # 生成Prisma客户端
npm run prisma:migrate     # 运行数据库迁移
npm run prisma:push        # 推送schema到数据库（不创建迁移记录）
npm run studio            # 打开Prisma Studio数据库GUI

# 管理员管理脚本
node scripts/manage-admin-users.js check           # 查看用户角色统计
node scripts/manage-admin-users.js list            # 列出所有管理员
node scripts/manage-admin-users.js add [email]     # 添加管理员权限
node scripts/manage-admin-users.js remove [email]  # 移除管理员权限

# 测试脚本
node scripts/test-prisma.js              # 测试数据库连接
node scripts/test-purchase.js            # 测试订单购买流程
node scripts/test-complete-purchase.js   # 测试完整购买流程
```

## Architecture

### Tech Stack
- **Next.js 14.2.1** with App Router
- **TypeScript** 严格模式
- **Prisma 6.13.0** ORM + MySQL数据库
- **NextAuth.js 4.24** 认证系统
- **React 18** 函数式组件
- **Bootstrap 5.3.3** UI框架（计划迁移到Tailwind CSS）
- **React Hot Toast** 通知系统
- **ECharts** 数据可视化
- **AWS S3** 文件存储

### Core Database Models
- **User** - 用户系统（role: admin/user, status: active/suspended）
- **Order** - 订单管理（orderType: package/credits）
- **Package** - 套餐配置（价格、积分、有效期）
- **UserPackage** - 用户套餐关联
- **CreditBalance** - 积分余额（套餐积分、独立积分）
- **CreditTransaction** - 积分流水记录
- **ApiKey** - API密钥管理
- **RedemptionCode** - 卡密系统（积分卡/套餐卡）
- **Post** - 博客内容管理
- **Image/Category** - 图片分类存储
- **Affiliate** - 推广联盟系统
- **Feedback** - 用户反馈

### High-Level Architecture

#### Authentication Flow
- NextAuth.js处理所有认证逻辑，支持邮箱密码、Google OAuth、GitHub OAuth
- Session存储在JWT中，包含用户UUID、角色、邮箱等关键信息
- middleware.ts保护/dashboard路由，未登录自动重定向到/auth/signin
- 管理员权限通过session.user.role === 'admin'判断

#### Service Layer Architecture
核心业务逻辑封装在service层，提供事务性操作：
- **creditManager.ts** - 积分管理（使用、购买、查询、重置）
- **orderProcessor.ts** - 订单处理（创建、支付、完成、退款）
- **packageManager.ts** - 套餐管理（激活、续费、查询）
- **user.ts** - 用户服务（创建、更新、查询）

#### API Design Pattern
所有API遵循统一模式：
1. 验证session身份：`const session = await auth()`
2. 参数验证和类型检查
3. 调用service层处理业务逻辑
4. 统一响应格式：`{ success: boolean, data?: any, error?: string }`
5. 错误使用标准HTTP状态码

#### Credit System Architecture
双积分体系设计：
- **套餐积分** - 每日重置，由用户套餐决定额度
- **独立积分** - 永久有效，通过购买或充值获得
- 使用优先级：优先消耗套餐积分，不足时使用独立积分
- 所有积分变动记录在credit_transactions表中

### Critical API Endpoints

#### Order System
- `POST /api/orders/create` - 创建订单（套餐或积分）
- `POST /api/orders/pay/mock` - 模拟支付（测试用）
- `GET /api/packages` - 获取所有套餐
- `GET /api/packages/active` - 获取用户当前套餐
- `POST /api/packages/[id]` - 购买指定套餐

#### Credit System  
- `GET /api/credits/balance` - 查询积分余额
- `POST /api/credits/use` - 使用积分

#### Admin APIs (需要role=admin)
- `GET /api/admin/users` - 用户列表（分页、搜索）
- `PUT /api/admin/users/[uuid]` - 更新用户信息
- `POST /api/admin/users/[uuid]/credits` - 调整用户积分
- `POST /api/admin/codes/generate` - 批量生成卡密
- `GET /api/admin/stats` - 统计数据

### Environment Variables Required
```env
# 数据库配置
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

# NextAuth认证配置
AUTH_SECRET="生成方式: openssl rand -base64 32"
NEXTAUTH_SECRET="${AUTH_SECRET}"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth配置
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED="true"
NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED="true"
NEXT_PUBLIC_AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_ID="${NEXT_PUBLIC_AUTH_GOOGLE_ID}"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# GitHub OAuth配置
NEXT_PUBLIC_AUTH_GITHUB_ENABLED="true"
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"

# AWS S3配置（文件上传）
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# 邮件服务配置（用于发送验证码）
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="${EMAIL_USER}"

# 项目配置
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
NEXT_PUBLIC_PROJECT_NAME="koi"
```

## Toast Notification System

项目使用react-hot-toast实现统一的用户交互反馈：

```typescript
// 在组件中使用
import { useToast } from '@/hooks/useToast';

const { showSuccess, showError, showLoading } = useToast();

// 成功提示
showSuccess('操作成功');

// 错误提示
showError('操作失败');

// 加载提示
const toastId = showLoading('处理中...');
// 完成后更新
toast.success('完成', { id: toastId });
```

## Important Implementation Details

### Database Transaction Pattern
使用Prisma事务确保数据一致性：
```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. 更新积分余额
  const balance = await tx.creditBalance.update({...});
  // 2. 创建流水记录
  const transaction = await tx.creditTransaction.create({...});
  // 3. 更新订单状态
  const order = await tx.order.update({...});
  return { balance, transaction, order };
});
```

### Session Role Caching
- 用户角色存储在NextAuth session中，数据库更新后需重新登录刷新
- 管理员权限检查：`if (session?.user?.role !== 'admin') return 403`
- Session包含：uuid、email、nickname、role、avatarUrl

### Credit Daily Reset Logic
套餐积分每日重置逻辑（在creditManager.ts中实现）：
1. 检查packageResetAt是否为今天之前
2. 如果需要重置，更新packageCredits为套餐每日额度
3. 创建reset类型的流水记录
4. 更新packageResetAt为今天

### Order Processing Flow
1. 创建订单（status: pending）
2. 用户支付
3. 调用processPayment完成订单
4. 根据orderType执行不同逻辑：
   - package: 激活套餐、重置积分
   - credits: 增加独立积分
5. 更新订单状态为completed

## Recent Fixes & Improvements (2025-01-13)

### Admin Panel Access Fix
- 修复了管理员面板权限验证问题
- 添加了 session 刷新机制 (`/api/auth/refresh-session`)
- 改进了 AdminGuard 组件，提供友好的权限提示界面
- 解决了数据库角色更新后需要重新登录的问题

### Clipboard API Compatibility
- 修复了非 HTTPS 环境下复制功能失败的问题
- 实现了多级降级方案（Clipboard API → execCommand → 手动复制）
- 改进了卡密生成后的复制体验

## Debug Panel

调试面板（位于右下角）提供开发时的实时状态监控：
- 快捷键：`Ctrl+Shift+D` 或 URL参数 `?debug=true`
- 自动捕获控制台错误（去重、限制20个）
- 显示session信息、性能数据、内存使用
- 生产环境通过 `/config/debug.config.ts` 禁用

## Known Issues & Solutions

### Session 权限缓存
- **问题**：数据库更新用户角色后，session 中的角色信息不会立即更新
- **解决**：点击"刷新权限"按钮或重新登录

### Clipboard API 限制
- **问题**：HTTP 环境下 `navigator.clipboard` 不可用
- **解决**：自动降级到 `document.execCommand` 或提供手动复制选项