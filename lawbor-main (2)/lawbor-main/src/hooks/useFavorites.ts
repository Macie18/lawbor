import { useState, useEffect, useCallback } from 'react';
import { supabase, KnowledgeCardFavorite } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<KnowledgeCardFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户所有收藏
  const fetchFavorites = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('knowledge_card_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setFavorites(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取收藏失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 检查卡片是否已收藏
  const isFavorited = (cardId: string) => {
    return favorites.some((fav) => fav.card_id === cardId);
  };

  // 添加收藏
  const addFavorite = async (cardId: string, cardTitle: string, cardCategory: string) => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('knowledge_card_favorites')
        .insert({
          user_id: user.id,
          card_id: cardId,
          card_title: cardTitle,
          card_category: cardCategory,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchFavorites();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加收藏失败');
      return null;
    }
  };

  // 移除收藏
  const removeFavorite = async (cardId: string) => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('knowledge_card_favorites')
        .delete()
        .eq('card_id', cardId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      await fetchFavorites();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除收藏失败');
      return false;
    }
  };

  // 切换收藏状态
  const toggleFavorite = async (cardId: string, cardTitle: string, cardCategory: string) => {
    if (isFavorited(cardId)) {
      return await removeFavorite(cardId);
    } else {
      return await addFavorite(cardId, cardTitle, cardCategory);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    error,
    isFavorited,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refreshFavorites: fetchFavorites,
  };
};