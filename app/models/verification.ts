import { getSupabaseClient } from "./db";
import { getIsoTimestr } from "@/lib/time";

export interface EmailVerificationCode {
  id?: number;
  email: string;
  code: string;
  expires_at: string;
  created_at?: string;
  is_used: boolean;
}

export async function createVerificationCode(
  email: string,
  code: string,
  expiresInMinutes: number = 10
): Promise<EmailVerificationCode> {
  const supabase = getSupabaseClient();
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);
  
  const verification: EmailVerificationCode = {
    email,
    code,
    expires_at: getIsoTimestr(expiresAt),
    is_used: false,
    created_at: getIsoTimestr(now)
  };
  
  const { data, error } = await supabase
    .from("email_verification_codes")
    .insert(verification)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function findVerificationCode(
  email: string,
  code: string
): Promise<EmailVerificationCode | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from("email_verification_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .eq("is_used", false)
    .gte("expires_at", getIsoTimestr())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}

export async function markCodeAsUsed(id: number): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from("email_verification_codes")
    .update({ is_used: true })
    .eq("id", id);
  
  if (error) {
    throw error;
  }
}

export async function getLatestVerificationCode(
  email: string
): Promise<EmailVerificationCode | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from("email_verification_codes")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}

export async function cleanExpiredCodes(): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from("email_verification_codes")
    .delete()
    .lt("expires_at", getIsoTimestr());
  
  if (error) {
    throw error;
  }
}