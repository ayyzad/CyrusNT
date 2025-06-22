import { createClient } from '@/utils/supabase/server';
import { Article } from '@/components/NewsCard';

async function getWebsiteNeutralityRatings(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('websites')
    .select('name, neutrality_rating');

  if (error) {
    console.error('Error fetching website neutrality ratings:', error);
    return {};
  }

  // Create a map of source name to neutrality rating
  const neutralityMap: Record<string, number> = {};
  data?.forEach((website) => {
    if (website.neutrality_rating !== null) {
      neutralityMap[website.name] = website.neutrality_rating;
    }
  });

  return neutralityMap;
}

export async function getLatestArticles(limit: number = 20): Promise<Article[]> {
  const supabase = await createClient();
  
  // Fetch articles
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, link, pub_date, source, image_url, description, tags')
    .order('pub_date', { ascending: false })
    .limit(limit);

  if (articlesError) {
    console.error('Error fetching articles:', articlesError);
    return [];
  }

  // Fetch neutrality ratings
  const neutralityRatings = await getWebsiteNeutralityRatings();

  // Combine articles with their neutrality ratings
  const articlesWithNeutrality: Article[] = articles?.map((article) => ({
    ...article,
    neutrality_rating: neutralityRatings[article.source] || null,
  })) || [];

  return articlesWithNeutrality;
}
