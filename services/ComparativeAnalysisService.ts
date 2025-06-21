import { createClient } from '@/utils/supabase/server';
import { ComparativeAnalysis } from '@/components/ai-summary-card';

export async function getLatestAnalyses(limit: number = 5): Promise<ComparativeAnalysis[]> {
  const supabase = await createClient();
    const { data, error } = await supabase
      .from('comparative_analyses')
      .select('id, topic_summary, aggregate_summary, created_at, article_ids')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching analyses:', error);
      return [];
    }

    const analysesWithSources = await Promise.all(
      data.map(async (analysis) => {
        if (!analysis.article_ids) {
          return { ...analysis, sources: [] };
        }

        const { data: articles, error: articlesError } = await supabase
          .from('articles')
          .select('source, link')
          .in('id', analysis.article_ids);

        if (articlesError) {
          console.error('Error fetching article sources:', articlesError);
          return { ...analysis, sources: [] };
        }

        const sources = articles ? articles.map(a => ({ source: a.source, link: a.link })) : [];
        return { ...analysis, sources };
      })
    );

    return analysesWithSources as ComparativeAnalysis[];
}
