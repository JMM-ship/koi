# 管理员面板开发规范

## 数据库设计规范

### 1. users 表扩展字段

```sql
-- 新增字段
role VARCHAR(20) DEFAULT 'user' COMMENT '用户角色: user | admin',
status VARCHAR(20) DEFAULT 'active' COMMENT '账户状态: active | suspended | deleted',
plan_type VARCHAR(50) DEFAULT 'free' COMMENT '套餐类型: free | basic | pro | enterprise',
plan_expired_at DATETIME NULL COMMENT '套餐到期时间',
total_credits INT DEFAULT 0 COMMENT '总积分余额'
```

### 2. redemption_codes 表结构

```sql
CREATE TABLE redemption_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(255) UNIQUE NOT NULL COMMENT '卡密编码',
  code_type VARCHAR(50) NOT NULL COMMENT '卡密类型: credits | plan',
  code_value VARCHAR(255) NOT NULL COMMENT '卡密值（积分数量或套餐类型）',
  valid_days INT DEFAULT 30 COMMENT '有效天数（仅套餐类型）',
  status VARCHAR(20) DEFAULT 'active' COMMENT '状态: active | used | expired | cancelled',
  batch_id VARCHAR(255) NULL COMMENT '批次ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME NULL COMMENT '使用时间',
  used_by VARCHAR(255) NULL COMMENT '使用者UUID',
  expires_at DATETIME NULL COMMENT '过期时间',
  notes TEXT NULL COMMENT '备注',
  
  INDEX idx_code (code),
  INDEX idx_status (status),
  INDEX idx_batch_id (batch_id),
  INDEX idx_created_at (created_at)
);
```

## API 接口规范

### 基础规范

1. **URL前缀**：所有管理员API统一使用 `/api/admin/` 前缀
2. **认证方式**：使用 NextAuth Session 认证，需验证用户角色为 admin
3. **响应格式**：统一JSON格式
4. **错误处理**：统一错误码和消息格式

### 响应格式定义

```typescript
// 成功响应
interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// 错误响应
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// 分页响应
interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 错误码定义

```typescript
enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',           // 未授权
  FORBIDDEN = 'FORBIDDEN',                 // 无权限
  NOT_FOUND = 'NOT_FOUND',                // 资源不存在
  BAD_REQUEST = 'BAD_REQUEST',            // 请求参数错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',      // 内部错误
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',    // 重复数据
}
```

## API 接口详细定义

### 1. 用户管理接口

#### 1.1 获取用户列表
```typescript
GET /api/admin/users

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- search?: string (邮箱或UUID搜索)
- status?: 'active' | 'suspended' | 'deleted'
- plan_type?: 'free' | 'basic' | 'pro' | 'enterprise'
- sort?: 'created_at' | 'email' | 'credits' (default: created_at)
- order?: 'asc' | 'desc' (default: desc)

Response: PaginatedResponse<User>
```

#### 1.2 获取用户详情
```typescript
GET /api/admin/users/[uuid]

Response: SuccessResponse<UserDetail>

interface UserDetail {
  uuid: string;
  email: string;
  nickname: string;
  avatar_url: string;
  role: string;
  status: string;
  plan_type: string;
  plan_expired_at: string;
  total_credits: number;
  created_at: string;
  updated_at: string;
  signin_provider: string;
  invite_code: string;
  invited_by: string;
  // 统计信息
  stats: {
    total_orders: number;
    total_api_calls: number;
    last_active_at: string;
  };
}
```

#### 1.3 更新用户信息
```typescript
PUT /api/admin/users/[uuid]

Body:
{
  status?: 'active' | 'suspended' | 'deleted';
  plan_type?: 'free' | 'basic' | 'pro' | 'enterprise';
  plan_expired_at?: string; // ISO 8601 格式
  role?: 'user' | 'admin';
  nickname?: string;
}

Response: SuccessResponse<User>
```

#### 1.4 调整用户积分
```typescript
POST /api/admin/users/[uuid]/credits

Body:
{
  action: 'add' | 'subtract' | 'set';
  amount: number;
  reason: string;
  expired_at?: string; // ISO 8601 格式，可选
}

Response: SuccessResponse<{
  user_uuid: string;
  new_balance: number;
  transaction_id: string;
}>
```

### 2. 卡密管理接口

#### 2.1 获取卡密列表
```typescript
GET /api/admin/codes

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- status?: 'active' | 'used' | 'expired' | 'cancelled'
- code_type?: 'credits' | 'plan'
- batch_id?: string
- search?: string (卡密编码搜索)

Response: PaginatedResponse<RedemptionCode>
```

#### 2.2 批量生成卡密
```typescript
POST /api/admin/codes/generate

Body:
{
  code_type: 'credits' | 'plan';
  code_value: string | number; // 积分数量或套餐类型
  quantity: number; // 生成数量 (1-1000)
  valid_days?: number; // 有效天数（套餐类型必填）
  prefix?: string; // 卡密前缀（可选）
  notes?: string; // 备注
}

Response: SuccessResponse<{
  batch_id: string;
  codes: string[];
  count: number;
}>
```

#### 2.3 更新卡密状态
```typescript
PUT /api/admin/codes/[code]

Body:
{
  status: 'active' | 'cancelled';
  notes?: string;
}

Response: SuccessResponse<RedemptionCode>
```

#### 2.4 导出卡密
```typescript
GET /api/admin/codes/export

Query Parameters:
- batch_id?: string
- status?: string
- format: 'csv' | 'json'

Response: 文件下载或JSON数据
```

### 3. 统计接口

#### 3.1 获取管理员仪表板统计
```typescript
GET /api/admin/stats

Response: SuccessResponse<{
  users: {
    total: number;
    active: number;
    new_today: number;
    new_this_week: number;
  };
  orders: {
    total: number;
    total_revenue: number;
    today_revenue: number;
    pending: number;
  };
  codes: {
    total_generated: number;
    total_used: number;
    active: number;
    expired: number;
  };
  credits: {
    total_issued: number;
    total_consumed: number;
  };
}>
```

## 前端组件命名规范

### 页面文件
```
/app/dashboard/admin/
├── page.tsx                    # 管理员仪表板
├── users/
│   ├── page.tsx                # 用户列表页
│   └── [uuid]/
│       └── page.tsx            # 用户详情页
└── codes/
    └── page.tsx                # 卡密管理页
```

### 组件命名
```typescript
// 管理员专用组件统一使用 Admin 前缀
AdminGuard              // 权限守卫
AdminLayout            // 管理员布局
AdminSidebar           // 管理员侧边栏
AdminUserTable         // 用户表格
AdminUserDetail        // 用户详情
AdminUserEditModal     // 用户编辑弹窗
AdminCreditAdjustForm  // 积分调整表单
AdminCodeTable         // 卡密表格
AdminCodeGenerateForm  // 卡密生成表单
AdminStatsCard         // 统计卡片
AdminDashboard         // 管理员仪表板
```

### 工具函数命名
```typescript
// /app/lib/admin/
isAdmin()              // 检查是否管理员
checkAdminPermission() // 检查管理员权限
formatUserStatus()     // 格式化用户状态
formatPlanType()       // 格式化套餐类型
generateRedemptionCode() // 生成卡密
validateCodeFormat()   // 验证卡密格式
```

## TypeScript 类型定义

### 用户相关类型
```typescript
// /app/types/admin.ts

export interface AdminUser extends User {
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  plan_type: 'free' | 'basic' | 'pro' | 'enterprise';
  plan_expired_at: Date | null;
  total_credits: number;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  plan_type?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
```

### 卡密相关类型
```typescript
export interface RedemptionCode {
  id: number;
  code: string;
  code_type: 'credits' | 'plan';
  code_value: string;
  valid_days: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  batch_id: string | null;
  created_at: Date;
  used_at: Date | null;
  used_by: string | null;
  expires_at: Date | null;
  notes: string | null;
}

export interface CodeGenerateRequest {
  code_type: 'credits' | 'plan';
  code_value: string | number;
  quantity: number;
  valid_days?: number;
  prefix?: string;
  notes?: string;
}
```

## 状态管理规范

### 使用 React State 和 Context
```typescript
// 管理员上下文
interface AdminContextType {
  isAdmin: boolean;
  adminStats: AdminStats | null;
  refreshStats: () => Promise<void>;
}

// 用户管理状态
interface UserManagementState {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  filters: UserListQuery;
}
```

## 样式规范

### CSS 类命名（Bootstrap 风格）
```css
.admin-panel { }
.admin-sidebar { }
.admin-content { }
.admin-table { }
.admin-card { }
.admin-badge { }
.admin-form { }
.admin-modal { }
```

### 颜色规范
```scss
// 管理员专用颜色
$admin-primary: #6366f1;    // 紫色，区别于用户界面
$admin-danger: #dc2626;     // 红色，危险操作
$admin-success: #16a34a;    // 绿色，成功状态
$admin-warning: #ca8a04;    // 黄色，警告信息
$admin-info: #0891b2;       // 蓝色，信息提示
```

## 权限验证规范

### 中间件实现
```typescript
// /app/lib/admin/middleware.ts
export async function withAdminAuth(handler: Function) {
  return async (req: Request) => {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return handler(req);
  };
}
```

### 前端权限守卫
```typescript
// /components/admin/AdminGuard.tsx
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, status]);
  
  if (status === 'loading') return <Loading />;
  if (!session || session.user.role !== 'admin') return null;
  
  return <>{children}</>;
}
```

## 日志记录规范

### 管理员操作日志
```typescript
interface AdminLog {
  admin_uuid: string;
  action: string;
  target_type: 'user' | 'code' | 'order' | 'credit';
  target_id: string;
  details: any;
  ip_address: string;
  created_at: Date;
}

// 记录操作
async function logAdminAction(action: AdminLog) {
  // 保存到数据库或日志服务
}
```

## 测试规范

### API 测试用例
```typescript
// /tests/admin/users.test.ts
describe('Admin User Management API', () => {
  test('should list users with pagination', async () => {});
  test('should filter users by status', async () => {});
  test('should update user plan', async () => {});
  test('should adjust user credits', async () => {});
  test('should reject non-admin access', async () => {});
});
```

## 更新记录

- 2024-12-12：创建API规范文档，定义所有接口和数据结构