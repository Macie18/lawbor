import { createClient } from '@supabase/supabase-js';

/** 未配置 Supabase 时使用占位，避免整站白屏；登录/云端功能不可用，直至填入 .env.local */
const PLACEHOLDER_URL = 'http://127.0.0.1:54321';
const PLACEHOLDER_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim() || PLACEHOLDER_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim() || PLACEHOLDER_ANON_KEY;

if (
  !import.meta.env.VITE_SUPABASE_URL?.trim() ||
  !import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
) {
  console.warn(
    '[Lawbor] 未配置 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，已使用本地占位；请在 .env.local 填入 Supabase 以启用登录与云端数据。',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 类型定义
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface ConversationHistory {
  id: string;
  user_id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ContractReviewRecord {
  id: string;
  user_id: string;
  contract_name: string;
  contract_type: string;
  review_result: string;
  created_at: string;
}

export interface TaxCalculationRecord {
  id: string;
 user_id: string;
  income_type: string;
  gross_income: number;
  deductions: number;
  tax_amount: number;
  net_income: number;
  created_at: string;
}

export interface KnowledgeCardFavorite {
  id: string;
  user_id: string;
  card_id: string;
  card_title: string;
  card_category: string;
  created_at: string;
}