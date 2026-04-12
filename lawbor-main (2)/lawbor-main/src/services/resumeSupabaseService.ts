/**
 * 简历分析 Supabase 服务
 * 用于保存和获取用户的简历分析记录
 */

import { supabase } from '../lib/supabase';
import type { ResumeAnalysis } from './resumeAnalysisService';

export interface ResumeAnalysisRecord {
  id: string;
  user_id: string;
  file_name: string;
  analysis_result: ResumeAnalysis;
  resume_text?: string;
  created_at: string;
}

/**
 * 保存简历分析记录
 * @param fileName - 文件名
 * @param analysis - 分析结果
 * @param resumeText - 简历原始文本（可选）
 * @returns 保存的记录
 */
export async function saveResumeAnalysis(
  fileName: string,
  analysis: ResumeAnalysis,
  resumeText?: string
): Promise<ResumeAnalysisRecord | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    console.error('[ResumeSupabase] User not authenticated:', userError);
    return null;
  }

  const { data, error } = await supabase
    .from('resume_analyses')
    .insert([
      {
        user_id: userData.user.id,
        file_name: fileName,
        analysis_result: analysis,
        resume_text: resumeText,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[ResumeSupabase] Save error:', error);
    return null;
  }

  return data as ResumeAnalysisRecord;
}

/**
 * 获取用户的简历分析历史
 * @param limit - 限制数量（默认 10）
 * @returns 分析记录列表
 */
export async function getResumeAnalysisHistory(
  limit: number = 10
): Promise<ResumeAnalysisRecord[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    console.error('[ResumeSupabase] User not authenticated:', userError);
    return [];
  }

  const { data, error } = await supabase
    .from('resume_analyses')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ResumeSupabase] Fetch error:', error);
    return [];
  }

  return (data as ResumeAnalysisRecord[]) || [];
}

/**
 * 删除简历分析记录
 * @param id - 记录 ID
 * @returns 是否成功
 */
export async function deleteResumeAnalysis(id: string): Promise<boolean> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    console.error('[ResumeSupabase] User not authenticated:', userError);
    return false;
  }

  const { error } = await supabase
    .from('resume_analyses')
    .delete()
    .eq('id', id)
    .eq('user_id', userData.user.id);

  if (error) {
    console.error('[ResumeSupabase] Delete error:', error);
    return false;
  }

  return true;
}

/**
 * 获取单条简历分析记录
 * @param id - 记录 ID
 * @returns 分析记录
 */
export async function getResumeAnalysisById(
  id: string
): Promise<ResumeAnalysisRecord | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    console.error('[ResumeSupabase] User not authenticated:', userError);
    return null;
  }

  const { data, error } = await supabase
    .from('resume_analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', userData.user.id)
    .single();

  if (error) {
    console.error('[ResumeSupabase] Fetch by id error:', error);
    return null;
  }

  return data as ResumeAnalysisRecord;
}
