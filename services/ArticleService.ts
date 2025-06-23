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

export async function getLatestArticles(limit: number = 100): Promise<Article[]> {
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

  // Helper function to count words in description
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper function to validate image URLs
  const isValidImageUrl = async (url: string): Promise<boolean> => {
    try {
      // Basic URL validation
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // Check if URL has image extension
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => 
        urlObj.pathname.toLowerCase().includes(ext)
      );

      // If no extension, try to fetch headers to check content-type
      if (!hasImageExtension) {
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
          const contentType = response.headers.get('content-type');
          return contentType?.startsWith('image/') || false;
        } catch {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  };

  // Validate image URLs in parallel (with rate limiting)
  const validateImageUrls = async (articles: any[]): Promise<any[]> => {
    const validatedArticles = [];
    
    for (const article of articles) {
      if (article.image_url) {
        const isValid = await isValidImageUrl(article.image_url);
        validatedArticles.push({
          ...article,
          image_url: isValid ? article.image_url : null
        });
        // Small delay to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        validatedArticles.push(article);
      }
    }
    
    return validatedArticles;
  };

  // Filter and combine articles with their neutrality ratings
  const filteredArticles = articles
    ?.filter((article) => {
      // Only include articles with descriptions that have at least 10 words
      return article.description && getWordCount(article.description) >= 10;
    }) || [];

  // Validate image URLs
  const articlesWithValidatedImages = await validateImageUrls(filteredArticles);

  const articlesWithNeutrality: Article[] = articlesWithValidatedImages
    .map((article) => ({
      ...article,
      neutrality_rating: neutralityRatings[article.source] || null,
    }));

  return articlesWithNeutrality;
}
