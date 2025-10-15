# Stripe 支付集成指南

本项目已成功集成 Stripe 支付系统，支持套餐订阅和积分购买。

## 📋 目录
- [环境配置](#环境配置)
- [本地开发测试](#本地开发测试)
- [生产环境部署](#生产环境部署)
- [测试流程](#测试流程)
- [常见问题](#常见问题)

---

## 🔧 环境配置

### 1. 获取 Stripe API 密钥

前往 [Stripe Dashboard](https://dashboard.stripe.com/) 获取密钥：

1. 注册/登录 Stripe 账号
2. 确保右上角切换到 **Test mode**（测试模式）
3. 进入 **Developers → API keys**
4. 复制以下密钥：
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...) - 点击 "Reveal test key" 显示

### 2. 配置环境变量

在项目根目录的 `.env.local` 文件中添加：

```env
# 支付提供商选择（必须设置为 stripe）
NEXT_PUBLIC_PAYMENT_PROVIDER=stripe

# Stripe API 密钥（从 Dashboard 获取）
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Webhook 签名密钥（从 Stripe CLI 或 Dashboard 获取）
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# 公共基础 URL（用于支付回调）
PUBLIC_BASE_URL=http://localhost:3005
```

---

## 🚀 本地开发测试

### 方式一：使用 Stripe CLI（推荐）

#### 1. 安装 Stripe CLI

**Windows:**
```bash
# 下载安装包
# https://github.com/stripe/stripe-cli/releases/latest
# 下载 stripe_X.X.X_windows_x86_64.zip
# 解压后将 stripe.exe 添加到系统 PATH
```

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
# Debian/Ubuntu
sudo apt install stripe
```

#### 2. 登录 Stripe

```bash
stripe login
```

浏览器会打开授权页面，点击允许。

#### 3. 启动 Webhook 转发

**新开一个终端窗口**，运行：

```bash
stripe listen --forward-to localhost:3005/api/orders/pay/stripe/webhook
```

你会看到类似输出：
```
> Ready! Your webhook signing secret is whsec_1234567890abcdefghijklmnop
```

#### 4. 复制 Webhook Secret

将上面输出的 `whsec_...` 密钥复制到 `.env.local`：

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnop
```

#### 5. 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
npm run dev
```

#### 6. 测试支付

保持 Stripe CLI 运行，在浏览器中：
1. 访问 `http://localhost:3005/dashboard`
2. 选择套餐并点击购买
3. 在 Stripe Checkout 页面使用测试卡号：
   - **卡号**: `4242 4242 4242 4242`
   - **日期**: 任意未来日期（如 12/34）
   - **CVC**: 任意 3 位数（如 123）
   - **邮编**: 任意（如 12345）

4. 在 Stripe CLI 终端查看 webhook 日志

---

## 🌐 生产环境部署

### 1. 切换到生产模式

在 Stripe Dashboard 右上角切换到 **Live mode**（生产模式）

### 2. 获取生产密钥

进入 **Developers → API keys**，复制：
- **Publishable key** (pk_live_...)
- **Secret key** (sk_live_...)

### 3. 创建 Webhook Endpoint

1. 进入 **Developers → Webhooks**
2. 点击 **"Add endpoint"**
3. 填写配置：
   ```
   Endpoint URL: https://your-domain.com/api/orders/pay/stripe/webhook

   Events to send:
   ☑ checkout.session.completed
   ☑ payment_intent.payment_failed
   ☑ checkout.session.expired
   ```

4. 点击 **"Add endpoint"**
5. 在详情页面找到 **"Signing secret"**，点击 **"Reveal"**
6. 复制 `whsec_...` 密钥

### 4. 配置生产环境变量

在服务器或 Vercel/Netlify 等平台配置：

```env
NEXT_PUBLIC_PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_your_production_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
PUBLIC_BASE_URL=https://your-domain.com
```

---

## 🧪 测试流程

### 1. 启动服务

```bash
# 终端 1 - 开发服务器
npm run dev

# 终端 2 - Stripe CLI
stripe listen --forward-to localhost:3005/api/orders/pay/stripe/webhook
```

### 2. 完整支付流程测试

1. **创建订单**
   - 访问 `/dashboard`
   - 选择套餐点击购买
   - 系统创建订单

2. **支付流程**
   - 跳转到 Stripe Checkout 页面
   - 使用测试卡号完成支付

3. **Webhook 回调**
   - Stripe 发送 webhook 到本地
   - 系统验证签名并处理订单
   - 激活套餐/增加积分

4. **验证结果**
   - 返回 dashboard 查看积分变化
   - 检查订单状态

### 3. 测试卡号

| 场景 | 卡号 | 结果 |
|------|------|------|
| 成功支付 | 4242 4242 4242 4242 | 支付成功 |
| 需要 3D 验证 | 4000 0027 6000 3184 | 弹出验证页面 |
| 支付失败 | 4000 0000 0000 0002 | 卡片被拒绝 |
| 余额不足 | 4000 0000 0000 9995 | 余额不足 |

更多测试卡号：https://stripe.com/docs/testing

### 4. 查看 Webhook 日志

```bash
# 在 Stripe CLI 终端查看实时日志
# 或访问 Dashboard → Developers → Webhooks → [your endpoint] → Events
```

---

## ❓ 常见问题

### Q1: Webhook 签名验证失败

**错误**: `INVALID_SIGNATURE` 或 `Webhook signature verification failed`

**解决方案**:
1. 确认 `.env.local` 中的 `STRIPE_WEBHOOK_SECRET` 是最新的
2. 重启 Stripe CLI 获取新的 secret
3. 重启开发服务器

### Q2: 支付成功但订单未完成

**检查**:
1. Stripe CLI 是否正在运行
2. Webhook endpoint 是否正确
3. 查看服务器日志是否有错误

### Q3: 本地测试一切正常，生产环境失败

**检查**:
1. 是否使用了生产环境的密钥（pk_live, sk_live）
2. Webhook endpoint 是否配置正确（HTTPS）
3. 公网是否能访问 webhook URL
4. 生产环境的 `STRIPE_WEBHOOK_SECRET` 是否正确

### Q4: 如何切换回 Antom 支付

编辑 `.env.local`:
```env
NEXT_PUBLIC_PAYMENT_PROVIDER=antom
```

然后取消 `app/service/antom.ts` 和相关路由的注释。

---

## 📁 项目文件结构

```
koi/
├── app/
│   ├── service/
│   │   ├── stripe.ts                    # Stripe 服务层
│   │   └── antom.ts                     # Antom 服务层（已注释）
│   └── api/
│       └── orders/
│           └── pay/
│               ├── stripe/
│               │   ├── route.ts         # Stripe 支付创建
│               │   └── webhook/
│               │       └── route.ts     # Stripe Webhook 处理
│               └── antom/               # Antom 路由（已注释）
├── components/
│   └── dashboard/
│       ├── PlansContent.tsx             # 套餐购买页面
│       └── IndependentPackages.tsx      # 积分购买页面
├── .env.example                         # 环境变量示例
├── .env.local                           # 本地环境变量（不提交）
└── STRIPE_SETUP.md                      # 本文档
```

---

## 🔐 安全提醒

- ⚠️ **永远不要**将 `.env.local` 提交到 Git
- ⚠️ **永远不要**在前端代码中暴露 `STRIPE_SECRET_KEY`
- ⚠️ 生产环境的密钥要妥善保管
- ✅ 使用环境变量管理所有敏感信息
- ✅ 定期轮换 API 密钥

---

## 📚 相关资源

- [Stripe 官方文档](https://stripe.com/docs)
- [Stripe API 参考](https://stripe.com/docs/api)
- [Stripe Checkout 文档](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks 文档](https://stripe.com/docs/webhooks)
- [Stripe CLI 文档](https://stripe.com/docs/stripe-cli)

---

## 💬 技术支持

如遇问题：
1. 查看服务器日志
2. 查看 Stripe Dashboard 的事件日志
3. 查看 Stripe CLI 输出
4. 参考 Stripe 官方文档

---

**集成完成时间**: 2025-01-12
**维护者**: [Your Name]
**版本**: 1.0.0
