# CLAUDE.md

总是用中文回答我
使用Tailwind CSS作为CSS框架，但项目目前使用Bootstrap
目前是Linux系统服务器
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

这是一个 Claude Code 镜像站的控制台系统（包含Landing Page）。主要功能包括：
- 完整的用户认证系统（支持邮箱密码、Google、GitHub登录）
- 订阅管理和支付系统
- API密钥管理
- 积分系统
- 图片上传和分类管理（AWS S3）
- 博客内容管理
- 推广联盟系统
- 用户反馈系统
- **管理员面板**（用户管理、卡密管理、统计数据）

## Development Commands

```bash
# 开发服务器
npm run dev

# 生产构建 (包含Prisma生成)
npm run build

# 生产服务器
npm run start

# 代码检查
npm run lint

# Prisma相关
npm run prisma:generate    # 生成Prisma客户端
npm run prisma:migrate     # 数据库迁移
npm run prisma:push        # 推送schema到数据库
npm run studio            # 打开Prisma Studio

# 管理员管理
node scripts/manage-admin-users.js check           # 查看角色统计
node scripts/manage-admin-users.js list            # 列出管理员
node scripts/manage-admin-users.js add [email]     # 添加管理员
node scripts/manage-admin-users.js remove [email]  # 移除管理员
```

## Architecture

### Tech Stack
- **Next.js 14.2.1** with App Router
- **TypeScript** 严格模式
- **Prisma** ORM 使用 MySQL 数据库
- **NextAuth.js** 认证系统
- **Bootstrap 5.3.3** UI组件库
- **AWS S3** 文件存储
- **React 18** 函数式组件

### Database Models
- **User** - 用户系统，支持多种登录方式（包含角色管理：admin/user）
- **Order** - 订单管理，支持订阅模式
- **ApiKey** - API密钥管理
- **Credit** - 积分交易系统
- **Post** - 博客/内容管理
- **Image/Category** - 图片分类存储
- **Affiliate** - 推广联盟系统
- **Feedback** - 用户反馈
- **RedemptionCode** - 卡密系统（积分卡/套餐卡）

### Authentication System
- 支持Google、GitHub OAuth登录
- 邮箱密码登录
- Google One Tap登录
- NextAuth.js处理会话管理
- 中间件保护dashboard路由

### Project Structure

**App Router** (`/app`):
- `auth/` - 认证相关页面和配置
- `api/` - API路由（认证、注册、验证码）
  - `api/admin/` - 管理员API路由
- `models/` - Prisma模型定义
- `service/` - 业务逻辑层
- `lib/` - 工具函数（邮件、hash、存储等）
  - `lib/admin/` - 管理员工具函数
- `dashboard/` - 用户仪表板
- `types/` - TypeScript类型定义
  - `types/admin.ts` - 管理员相关类型

**Components** (`/components`):
- `dashboard/` - 仪表板组件（API密钥、计划、配置文件等）
  - `dashboard/admin/` - 管理员专用组件
- `debug/` - 调试面板组件
- `layout/` - 布局组件（Header、Footer、Menu）
- `sections/` - 页面区块组件
- `elements/` - 可复用UI组件

**Scripts** (`/scripts`):
- `manage-admin-users.js` - 管理员用户管理脚本
- `update-existing-users-to-admin.js` - 批量更新用户为管理员
- `verify-user-roles.js` - 验证用户角色设置

**Config** (`/config`):
- `debug.config.ts` - 调试面板配置

**Utilities** (`/util`):
- 动画Hook: `useTextAnimation2/3`, `useParallaxEffect`
- UI交互: `useAccordion`, `useOdometerCounter`
- Bootstrap初始化: `useBootstrap`

### Key Features
1. **用户认证和授权** - NextAuth.js + Prisma（支持角色管理）
2. **订阅管理** - 支持多种订阅模式
3. **API密钥管理** - 用户可创建和管理API密钥
4. **文件上传** - AWS S3集成，支持图片分类
5. **积分系统** - 完整的积分交易记录
6. **推广联盟** - 邀请码和佣金系统
7. **多语言支持** - 中英文本地化
8. **管理员面板** - 用户管理、卡密生成、数据统计

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

## Admin Panel

### 管理员功能
管理员登录后，侧边栏会显示额外的管理菜单：
- **Admin Panel** - 管理员仪表板（统计概览）
- **User Management** - 用户管理（查看、编辑、调整积分）
- **Code Management** - 卡密管理（生成、查看、导出）

### 管理员API接口
所有管理员API都在 `/api/admin/` 路径下，需要管理员权限：
- `GET /api/admin/users` - 用户列表
- `GET/PUT /api/admin/users/[uuid]` - 用户详情和更新
- `POST /api/admin/users/[uuid]/credits` - 积分调整
- `GET /api/admin/codes` - 卡密列表
- `POST /api/admin/codes/generate` - 批量生成卡密
- `PUT /api/admin/codes/[code]` - 更新卡密状态
- `GET /api/admin/stats` - 统计数据

### 用户角色管理
- **默认角色**：新注册用户自动为 `user`（普通用户）
- **管理员设置**：需要手动在数据库中设置 `role = 'admin'`
- **管理脚本**：
  ```bash
  # 查看用户角色统计
  node scripts/manage-admin-users.js check
  
  # 列出所有管理员
  node scripts/manage-admin-users.js list
  
  # 设置用户为管理员
  node scripts/manage-admin-users.js add user@example.com
  
  # 移除管理员权限
  node scripts/manage-admin-users.js remove user@example.com
  ```

### 卡密系统
- **卡密类型**：
  - 积分卡：用于增加用户积分
  - 套餐卡：用于升级用户套餐
- **卡密格式**：`PREFIX-XXXX-XXXX-XXXX-XXXX`
- **批量生成**：最多一次生成1000个卡密
- **导出功能**：支持CSV和文本格式导出

### 常见问题
- **Session角色缓存问题**：数据库角色更新后，需要重新登录刷新session
- **管理员菜单不显示**：检查用户role字段是否为'admin'，并重新登录

## Development Notes

### 重要注意事项
- **Prisma客户端生成**：构建前必须运行 `prisma generate`
- **路由保护**：middleware.ts 自动保护 `/dashboard` 路由，未登录会重定向到 `/auth/signin`
- **UUID标识**：所有用户相关记录使用UUID作为唯一标识符
- **条件加载**：OAuth提供商根据环境变量自动启用/禁用
- **邮件验证**：内置邮件验证码功能，支持注册和密码重置
- **图片处理**：上传图片自动生成缩略图，支持分类管理
- **会话管理**：使用NextAuth.js管理用户会话，支持JWT token
- **角色权限**：管理员功能需要 `role = 'admin'`，通过中间件验证

### 数据库设计原则
- 所有表使用单数命名（users, orders, credits等）
- 时间字段统一使用 `created_at`, `updated_at` 格式
- 外键关联使用 `user_uuid` 而非 `user_id`
- 所有重要字段都建立索引以提高查询性能
- 使用软删除策略（status字段）而非物理删除

### 安全最佳实践
- 密码使用 bcrypt 加密存储
- API密钥使用 UUID v4 生成
- 邮箱验证码6位数字，有效期10分钟
- 支持IP记录用于安全审计
- 敏感操作需要重新验证身份

### 前端开发规范
- 组件使用函数式组件 + TypeScript
- 样式使用Bootstrap 5（计划迁移到Tailwind CSS）
- 图表使用 ECharts
- 动画使用 AOS、GSAP、Swiper
- 表单验证使用原生HTML5 + 自定义验证

### API设计规范
- RESTful风格：GET查询、POST创建、PUT更新、DELETE删除
- 统一响应格式：`{ success: boolean, data?: any, error?: string }`
- 错误处理：使用标准HTTP状态码
- 分页参数：`page`, `limit`, `sort`, `order`
- 认证：Bearer token in Authorization header

### 性能优化建议
- 使用React.memo避免不必要的重渲染
- 图片使用Next.js Image组件优化加载
- API响应使用缓存策略
- 数据库查询使用Prisma的include和select优化
- 静态资源使用CDN加速

## 调试面板

### 功能介绍
项目集成了独立的调试面板模块，用于开发和调试时快速获取页面状态：
- 📋 一键复制所有页面数据（JSON格式）
- 🔍 实时显示用户状态、路径、session信息
- ⚠️ 自动捕获控制台错误（去重、限制20个）
- 📊 显示性能数据、内存使用、网络状态
- 🔒 自动过滤敏感信息（token、password、secret等）

### 使用方法
1. **显示面板**：
   - 点击右下角代码图标 `</>`
   - 快捷键 `Ctrl+Shift+D`
   - URL参数 `?debug=true`

2. **特殊功能**：
   - 错误清除按钮
   - 角色权限提示（检测session与数据库不一致）
   - 快速重新登录链接

### 配置文件
`/config/debug.config.ts`：
```typescript
{
  enabled: true,              // 是否启用
  developmentOnly: false,     // 仅开发环境
  allowUrlParam: true,        // URL参数控制
  hotkey: 'ctrl+shift+d',     // 快捷键
}
```

### 生产环境禁用
```typescript
// 方法1: 修改配置
// /config/debug.config.ts
enabled: false

// 方法2: 注释组件
// /app/layout.tsx
// <DebugProvider>{children}</DebugProvider>
```