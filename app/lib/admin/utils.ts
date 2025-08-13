/**
 * 管理员工具函数
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * 生成卡密编码
 * @param prefix 前缀
 * @param length 长度（不包含前缀）
 */
export function generateRedemptionCode(prefix: string = 'KOI', length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix ? `${prefix}-` : '';
  
  for (let i = 0; i < length; i++) {
    if (i > 0 && i % 4 === 0) {
      code += '-';
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * 生成批次ID
 */
export function generateBatchId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `BATCH-${year}${month}${day}-${random}`;
}

/**
 * 格式化用户状态
 */
export function formatUserStatus(status: string): {
  label: string;
  color: string;
} {
  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: '正常', color: 'success' },
    suspended: { label: '暂停', color: 'warning' },
    deleted: { label: '已删除', color: 'danger' },
  };
  
  return statusMap[status] || { label: status, color: 'secondary' };
}

/**
 * 格式化套餐类型
 */
export function formatPlanType(planType: string): {
  label: string;
  color: string;
} {
  const planMap: Record<string, { label: string; color: string }> = {
    free: { label: '免费版', color: 'secondary' },
    basic: { label: '基础版', color: 'info' },
    pro: { label: '专业版', color: 'primary' },
    enterprise: { label: '企业版', color: 'success' },
  };
  
  return planMap[planType] || { label: planType, color: 'secondary' };
}

/**
 * 格式化卡密状态
 */
export function formatCodeStatus(status: string): {
  label: string;
  color: string;
} {
  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: '未使用', color: 'success' },
    used: { label: '已使用', color: 'secondary' },
    expired: { label: '已过期', color: 'warning' },
    cancelled: { label: '已作废', color: 'danger' },
  };
  
  return statusMap[status] || { label: status, color: 'secondary' };
}

/**
 * 格式化卡密类型
 */
export function formatCodeType(codeType: string): string {
  const typeMap: Record<string, string> = {
    credits: '积分卡',
    plan: '套餐卡',
  };
  
  return typeMap[codeType] || codeType;
}

/**
 * 验证卡密格式
 */
export function validateCodeFormat(code: string): boolean {
  // 卡密格式：PREFIX-XXXX-XXXX-XXXX-XXXX
  const pattern = /^[A-Z0-9]+(-[A-Z0-9]{4})+$/;
  return pattern.test(code);
}

/**
 * 计算过期时间
 */
export function calculateExpiryDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * 检查是否过期
 */
export function isExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiry < new Date();
}