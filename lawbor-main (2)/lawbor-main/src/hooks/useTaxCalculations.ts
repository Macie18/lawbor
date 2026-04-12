import { useState, useEffect, useCallback } from 'react';
import { supabase, TaxCalculationRecord } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useTaxCalculations = () => {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<TaxCalculationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户所有税务计算记录
  const fetchCalculations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('tax_calculations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCalculations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取计算记录失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 保存计算记录
  const saveCalculation = async (
    incomeType: string,
    grossIncome: number,
    deductions: number,
    taxAmount: number,
    netIncome: number
  ) => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('tax_calculations')
        .insert({
          user_id: user.id,
          income_type: incomeType,
          gross_income: grossIncome,
          deductions: deductions,
          tax_amount: taxAmount,
          net_income: netIncome,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchCalculations();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存计算记录失败');
      return null;
    }
  };

  // 删除计算记录
  const deleteCalculation = async (id: string) => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('tax_calculations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchCalculations();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除计算记录失败');
      return false;
    }
  };

  useEffect(() => {
    fetchCalculations();
  }, [fetchCalculations]);

  return {
    calculations,
    loading,
    error,
    saveCalculation,
    deleteCalculation,
    refreshCalculations: fetchCalculations,
  };
};