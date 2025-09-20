export interface User {
  id: string;  // 现在是UUID字符串
  email: string;
  created_at?: string;
  nickname?: string;
  avatar_url?: string;
  locale?: string;
  updated_at?: string;
  role?: string;
  status?: string;

  // 兼容旧代码的字段（已废弃，但暂时保留以避免编译错误）
  uuid?: string;  // 现在等同于id
  signin_type?: string;
  signin_ip?: string;
  signin_provider?: string;
  signin_openid?: string;
  invite_code?: string;
  invited_by?: string;
  is_affiliate?: boolean;
  password?: string;
  planType?: string;
  planExpiredAt?: string;
  totalCredits?: number;
}