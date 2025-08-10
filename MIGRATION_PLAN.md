# Supabase到MySQL数据库迁移计划

## 项目概览

本文档详细说明了将当前项目从Supabase (PostgreSQL) 迁移到MySQL数据库的完整计划。

### 当前状态
- **当前数据库**: Supabase (PostgreSQL)
- **ORM**: 直接使用 @supabase/supabase-js 客户端
- **数据表数量**: 11个表
- **受影响的文件**: 14个Model文件 + 配置文件

### 目标状态
- **目标数据库**: MySQL 8.0+
- **ORM**: Prisma ORM
- **部署方式**: 支持本地开发（Navicat）和云端部署

## 迁移步骤详解

### 第一阶段：准备工作

#### 1.1 安装依赖包
```bash
# 安装Prisma和MySQL相关包
npm install @prisma/client prisma mysql2

# 移除Supabase依赖（迁移完成后执行）
# npm uninstall @supabase/supabase-js
```

#### 1.2 创建目录结构
```
prisma/
├── schema.prisma          # Prisma数据模型定义
├── mysql_init.sql         # MySQL初始化SQL
└── migrations/            # Prisma迁移文件（自动生成）
```

### 第二阶段：数据库结构迁移

#### 2.1 SQL文件创建
创建 `prisma/mysql_init.sql` 文件，包含所有表结构：

**主要的数据类型转换规则**：
- PostgreSQL `SERIAL` → MySQL `INT AUTO_INCREMENT`
- PostgreSQL `timestamptz` → MySQL `DATETIME`
- PostgreSQL `gen_random_uuid()` → MySQL `UUID()`
- PostgreSQL `TEXT` → MySQL `TEXT`
- PostgreSQL `VARCHAR` → MySQL `VARCHAR`

**表结构清单**：
1. `users` - 用户表
2. `orders` - 订单表
3. `apikeys` - API密钥表
4. `credits` - 积分交易表
5. `posts` - 文章/博客表
6. `affiliates` - 推广联盟表
7. `feedbacks` - 反馈表
8. `categories` - 图片分类表
9. `images` - 图片表
10. `email_verification_codes` - 邮箱验证码表

#### 2.2 Prisma Schema配置
创建 `prisma/schema.prisma` 文件，定义所有数据模型。

### 第三阶段：代码改造

#### 3.1 数据库连接层改造

**文件**: `app/models/db.ts`

**改造前**:
```typescript
import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
  // ...
  return createClient(supabaseUrl, supabaseKey);
}
```

**改造后**:
```typescript
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export function getPrismaClient() {
  return prisma;
}

// 兼容旧代码
export function getSupabaseClient() {
  return getPrismaClient();
}
```

#### 3.2 Model文件改造清单

需要改造的Model文件及其主要查询方法：

| 文件 | 主要方法 | 改造重点 |
|------|---------|---------|
| `user.ts` | insertUser, findUserByEmail, findUserByUuid, getUsers | Supabase查询改为Prisma查询 |
| `order.ts` | insertOrder, findOrderByOrderNo, updateOrderStatus | 处理订单CRUD操作 |
| `credit.ts` | insertCredit, getCreditsByUserUuid, getTotalCredits | 积分计算和查询 |
| `post.ts` | insertPost, getPostBySlug, getPosts | 博客文章管理 |
| `apikey.ts` | insertApiKey, findApiKeyByKey, getApiKeysByUserUuid | API密钥管理 |
| `affiliate.ts` | insertAffiliate, getAffiliateByUserUuid | 推广联盟管理 |
| `feedback.ts` | insertFeedback, getFeedbacks | 反馈管理 |
| `category.ts` | insertCategory, getCategoriesByUserId | 分类管理 |
| `image.ts` | insertImage, getImagesByUserId | 图片管理 |
| `verification.ts` | createVerificationCode, verifyCode | 验证码管理 |

#### 3.3 查询语法转换示例

**Supabase查询**:
```typescript
const { data, error } = await supabase
  .from("users")
  .select("*")
  .eq("email", email)
  .single();
```

**Prisma查询**:
```typescript
const data = await prisma.user.findFirst({
  where: { email }
});
```

### 第四阶段：环境配置

#### 4.1 环境变量更新

**.env.development 修改**:
```bash
# 移除Supabase配置
# SUPABASE_URL = "..."
# SUPABASE_ANON_KEY = "..."
# SUPABASE_SERVICE_ROLE_KEY = "..."

# 添加MySQL配置
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

#### 4.2 package.json scripts更新
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

### 第五阶段：数据迁移（如需保留现有数据）

#### 5.1 数据导出
从Supabase导出现有数据：
1. 使用Supabase Dashboard导出CSV
2. 或编写脚本导出为SQL INSERT语句

#### 5.2 数据导入
1. 使用Navicat导入CSV数据
2. 或执行SQL INSERT语句

### 第六阶段：测试验证

#### 6.1 功能测试清单
- [ ] 用户注册/登录
- [ ] 用户信息更新
- [ ] 订单创建和查询
- [ ] 积分系统
- [ ] API密钥管理
- [ ] 博客文章CRUD
- [ ] 图片上传和分类
- [ ] 邮箱验证码
- [ ] 推广联盟功能
- [ ] 反馈系统

#### 6.2 性能测试
- [ ] 查询性能对比
- [ ] 并发测试
- [ ] 索引优化

### 第七阶段：部署

#### 7.1 本地开发
1. 在Navicat中创建数据库
2. 执行 `mysql_init.sql` 创建表结构
3. 配置 `.env.development` 中的 `DATABASE_URL`
4. 运行 `npx prisma generate` 生成客户端
5. 启动开发服务器 `npm run dev`

#### 7.2 云端部署
1. 在云MySQL服务中创建数据库
2. 执行 `mysql_init.sql` 创建表结构
3. 配置生产环境的 `DATABASE_URL`
4. 部署应用

## 回滚计划

如果迁移出现问题，可以按以下步骤回滚：

1. 恢复 `package.json` 中的 Supabase 依赖
2. 恢复所有 Model 文件的备份
3. 恢复环境变量配置
4. 重新安装依赖 `npm install`

## 注意事项

### 重要提醒
1. **备份数据**: 迁移前务必备份所有数据
2. **逐步迁移**: 建议先在开发环境测试，再部署到生产环境
3. **兼容性**: 确保MySQL版本 >= 8.0，支持UUID函数
4. **字符集**: 使用 `utf8mb4` 字符集，支持emoji等特殊字符
5. **时区**: 注意时间字段的时区处理

### 可能的问题及解决方案

| 问题 | 解决方案 |
|------|---------|
| UUID生成不兼容 | MySQL 8.0+原生支持UUID()，低版本需要使用触发器 |
| 时区问题 | 统一使用UTC时间，应用层处理时区转换 |
| 事务处理差异 | Prisma提供统一的事务API |
| 全文搜索 | MySQL使用FULLTEXT索引替代PostgreSQL的文本搜索 |

## 时间估算

| 阶段 | 预计时间 |
|------|---------|
| 准备工作 | 0.5小时 |
| 数据库结构迁移 | 1小时 |
| 代码改造 | 3-4小时 |
| 测试验证 | 2小时 |
| 数据迁移（如需要） | 1-2小时 |
| **总计** | **7-9小时** |

## 检查清单

### 迁移前
- [ ] 备份Supabase数据
- [ ] 备份当前代码
- [ ] 确认MySQL版本和配置
- [ ] 准备测试环境

### 迁移中
- [ ] 创建MySQL数据库和表结构
- [ ] 配置Prisma
- [ ] 改造所有Model文件
- [ ] 更新环境变量
- [ ] 运行基础测试

### 迁移后
- [ ] 完整功能测试
- [ ] 性能测试
- [ ] 监控错误日志
- [ ] 准备回滚方案

## 联系支持

如遇到问题，可以参考：
- [Prisma官方文档](https://www.prisma.io/docs)
- [MySQL官方文档](https://dev.mysql.com/doc/)
- 项目Issues追踪

---

最后更新时间：2025-01-10