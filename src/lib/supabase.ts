import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
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