// 管理员相关类型定义

import { User } from "@prisma/client";

// 扩展的用户类型（包含管理员字段）
export interface AdminUser extends User {
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  planType: 'free' | 'basic' | 'pro' | 'enterprise';
  planExpiredAt: Date | null;
  totalCredits: number;
}

// 用户列表查询参数
export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'suspended' | 'deleted';
  planType?: 'free' | 'basic' | 'pro' | 'enterprise';
  sort?: 'createdAt' | 'email' | 'totalCredits';
  order?: 'asc' | 'desc';
}

// 用户详情（包含统计信息）
export interface UserDetail extends AdminUser {
  stats: {
    totalOrders: number;
    totalApiCalls: number;
    lastActiveAt: Date | null;
  };
}

// 积分调整请求
export interface CreditAdjustRequest {
  action: 'add' | 'subtract' | 'set';
  amount: number;
  reason: string;
  expiredAt?: string;
}

// 卡密类型
export interface RedemptionCode {
  id: number;
  code: string;
  codeType: 'credits' | 'plan';
  codeValue: string;
  validDays: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  batchId: string | null;
  createdAt: Date;
  usedAt: Date | null;
  usedBy: string | null;
  expiresAt: Date | null;
  notes: string | null;
}

// 卡密生成请求
export interface CodeGenerateRequest {
  codeType: 'credits' | 'plan';
  codeValue: string | number;
  quantity: number;
  validDays?: number;
  prefix?: string;
  notes?: string;
}

// 卡密列表查询参数
export interface CodeListQuery {
  page?: number;
  limit?: number;
  status?: 'active' | 'used' | 'expired' | 'cancelled';
  codeType?: 'credits' | 'plan';
  batchId?: string;
  search?: string;
}

// 管理员统计数据
export interface AdminStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
  };
  orders: {
    total: number;
    totalRevenue: number;
    todayRevenue: number;
    pending: number;
  };
  codes: {
    totalGenerated: number;
    totalUsed: number;
    active: number;
    expired: number;
  };
  credits: {
    totalIssued: number;
    totalConsumed: number;
  };
}

// API响应格式
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 错误码枚举
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
}