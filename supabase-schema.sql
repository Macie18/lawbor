-- =====================================================
-- Lawbor 用户认证和数据持久化 - 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- =====================================================

-- 1. 启用 UUID 扩展(如果未启用)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 用户对话历史表
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 合同审查记录表
CREATE TABLE IF NOT EXISTS contract_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_name VARCHAR(255) NOT NULL,
  contract_type VARCHAR(100),
  review_result TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 税务计算记录表
CREATE TABLE IF NOT EXISTS tax_calculations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  income_type VARCHAR(100) NOT NULL,
  gross_income DECIMAL(15, 2) NOT NULL,
  deductions DECIMAL(15, 2) DEFAULT 0,
  tax_amount DECIMAL(15, 2) NOT NULL,
  net_income DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 知识卡片收藏表
CREATE TABLE IF NOT EXISTS knowledge_card_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id VARCHAR(100) NOT NULL,
  card_title VARCHAR(255) NOT NULL,
  card_category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, card_id) -- 防止重复收藏
);

-- =====================================================
-- 创建索引以优化查询性能
-- =====================================================

CREATE INDEX idx_conversation_history_user_id ON conversation_history(user_id);
CREATE INDEX idx_conversation_history_updated_at ON conversation_history(updated_at DESC);

CREATE INDEX idx_contract_reviews_user_id ON contract_reviews(user_id);
CREATE INDEX idx_contract_reviews_created_at ON contract_reviews(created_at DESC);

CREATE INDEX idx_tax_calculations_user_id ON tax_calculations(user_id);
CREATE INDEX idx_tax_calculations_created_at ON tax_calculations(created_at DESC);

CREATE INDEX idx_knowledge_card_favorites_user_id ON knowledge_card_favorites(user_id);
CREATE INDEX idx_knowledge_card_favorites_created_at ON knowledge_card_favorites(created_at DESC);

-- =====================================================
-- 设置 Row Level Security (RLS) 策略
-- 确保用户只能访问自己的数据
-- =====================================================

-- 启用 RLS
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_card_favorites ENABLE ROW LEVEL SECURITY;

-- 对话历史表 RLS 策略
CREATE POLICY "Users can view own conversations"
  ON conversation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON conversation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversation_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversation_history FOR DELETE
  USING (auth.uid() = user_id);

-- 合同审查记录表 RLS 策略
CREATE POLICY "Users can view own contract reviews"
  ON contract_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contract reviews"
  ON contract_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contract reviews"
  ON contract_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- 税务计算记录表 RLS 策略
CREATE POLICY "Users can view own tax calculations"
  ON tax_calculations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax calculations"
  ON tax_calculations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax calculations"
  ON tax_calculations FOR DELETE
  USING (auth.uid() = user_id);

-- 知识卡片收藏表 RLS 策略
CREATE POLICY "Users can view own favorites"
  ON knowledge_card_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON knowledge_card_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON knowledge_card_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 创建触发器:自动更新 updated_at 字段
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 对话历史表触发器
CREATE TRIGGER update_conversation_history_updated_at
    BEFORE UPDATE ON conversation_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();