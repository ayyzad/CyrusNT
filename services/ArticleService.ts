import { createClient } from '@/utils/supabase/server';
import { Article } from '@/components/news-card';

export async function getLatestArticles(limit: number = 20): Promise<Article[]> {
  const supabase = await createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, link, pub_date, source, image_url')
      .order('pub_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching articles:', error);
      return [];
    }

    return data as Article[];
}
