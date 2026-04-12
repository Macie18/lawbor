import { useState, useEffect, useCallback } from 'react';
import { supabase, ConversationHistory, Message } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useConversationHistory = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户所有对话历史
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setConversations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取对话历史失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 创建新对话
  const createConversation = async (title: string, messages: Message[] = []) => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('conversation_history')
        .insert({
          user_id: user.id,
          title,
          messages,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchConversations();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建对话失败');
      return null;
    }
  };

  // 更新对话(添加消息)
  const updateConversation = async (id: string, messages: Message[]) => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('conversation_history')
        .update({ messages })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchConversations();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新对话失败');
      return false;
    }
  };

  // 删除对话
  const deleteConversation = async (id: string) => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('conversation_history')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchConversations();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除对话失败');
      return false;
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    refreshConversations: fetchConversations,
  };
};