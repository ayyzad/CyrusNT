import { createClient } from '@/utils/supabase/server';
import { ComparativeAnalysis } from '@/components/ai-summary-card';

export async function getLatestAnalyses(limit: number = 5): Promise<ComparativeAnalysis[]> {
  const supabase = await createClient();
    const { data, error } = await supabase
      .from('comparative_analyses')
      .select('id, topic_id, aggregate_summary, source_perspectives, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching analyses:', error);
      return [];
    }

    return data as ComparativeAnalysis[];
}
