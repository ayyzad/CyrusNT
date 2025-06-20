import { useState, useEffect } from 'react';
import { Article } from '@/lib/articleService';
import { supabase } from '@/lib/supabase';

interface UseArticlesOptions {
  page?: number;
  limit?: number;
  category?: string;
  source?: string;
  search?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

interface ArticlesResponse {
  articles: Article[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useArticles(options: UseArticlesOptions = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    source,
    search,
    autoRefresh = false,
    refreshInterval = 30
  } = options;

  const [articles, setArticles] = useState<Article[]>([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .order('pub_date', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (category) {
        query = query.eq('category', category);
      }
      if (source) {
        query = query.eq('source', source);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, count: totalCount, error: supabaseError } = await query;

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setArticles(data || []);
      setCount(totalCount || 0);
      setTotalPages(Math.ceil((totalCount || 0) / limit));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, limit, category, source, search]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchArticles, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    articles,
    loading,
    error,
    totalPages,
    count,
    refetch: fetchArticles,
  };
}
