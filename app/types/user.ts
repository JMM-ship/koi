export interface User {
  id?: number;
  uuid: string;
  email: string;
  created_at?: string;
  nickname?: string;
  avatar_url?: string;
  locale?: string;
  signin_type?: string;
  signin_ip?: string;
  signin_provider?: string;
  signin_openid?: string;
  invite_code?: string;
  updated_at?: string;
  invited_by?: string;
  is_affiliate?: boolean;
  password?: string;
}