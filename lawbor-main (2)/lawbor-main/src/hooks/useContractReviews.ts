import { useState, useEffect, useCallback } from 'react';
import { supabase, ContractReviewRecord } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useContractReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ContractReviewRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户所有合同审查记录
  const fetchReviews = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('contract_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setReviews(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取审查记录失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 保存审查记录
  const saveReview = async (
    contractName: string,
    contractType: string,
    reviewResult: string
  ) => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('contract_reviews')
        .insert({
          user_id: user.id,
          contract_name: contractName,
          contract_type: contractType,
          review_result: reviewResult,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchReviews();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存审查记录失败');
      return null;
    }
  };

  // 删除审查记录
  const deleteReview = async (id: string) => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('contract_reviews')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchReviews();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除审查记录失败');
      return false;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    error,
    saveReview,
    deleteReview,
    refreshReviews: fetchReviews,
  };
};