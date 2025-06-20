import { supabaseAdmin } from './supabase'

export interface Article {
  id?: string
  title: string
  link: string
  description?: string
  content?: string
  pub_date?: string
  category: string
  source: string
  guid?: string
  author?: string
  image_url?: string
  tags?: string[]
  word_count?: number
  reading_time?: number
  is_processed?: boolean
  sentiment_score?: number
  language_code?: string
  feed_id?: string
  created_at?: string
  updated_at?: string
}

export interface RSSFeed {
  id?: string
  name: string
  url: string
  category: string
  description?: string
  last_fetched?: string
  fetch_interval?: number
  is_active?: boolean
  error_count?: number
  last_error?: string
  created_at?: string
  updated_at?: string
}

export class ArticleService {
  /**
   * Save a single article to Supabase
   * Uses upsert to handle duplicates based on link
   */
  static async saveArticle(article: Omit<Article, 'id' | 'created_at' | 'updated_at'>): Promise<Article | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('articles')
        .upsert({
          title: article.title,
          link: article.link,
          description: article.description || null,
          content: article.content || null,
          pub_date: article.pub_date ? new Date(article.pub_date).toISOString() : null,
          category: article.category,
          source: article.source,
          guid: article.guid || article.link,
          author: article.author || null,
          image_url: article.image_url || null,
          tags: article.tags || null,
          language_code: article.language_code || 'en',
          feed_id: article.feed_id || null,
        }, {
          onConflict: 'link',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving article:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in saveArticle:', error)
      return null
    }
  }

  /**
   * Save multiple articles in batch
   * More efficient for processing RSS feeds
   */
  static async saveArticles(articles: Omit<Article, 'id' | 'created_at' | 'updated_at'>[]): Promise<Article[]> {
    try {
      console.log(`ArticleService: Processing ${articles.length} articles for batch save`);
      
      const articlesData = articles.map(article => ({
        title: article.title,
        link: article.link,
        description: article.description || null,
        content: article.content || null,
        pub_date: article.pub_date ? new Date(article.pub_date).toISOString() : null,
        category: article.category,
        source: article.source,
        guid: article.guid || article.link,
        author: article.author || null,
        image_url: article.image_url || null,
        tags: article.tags || null,
        language_code: article.language_code || 'en',
        feed_id: article.feed_id || null,
      }))

      console.log(`ArticleService: Mapped articles data, sample:`, JSON.stringify(articlesData[0], null, 2));

      const { data, error } = await supabaseAdmin
        .from('articles')
        .upsert(articlesData, {
          onConflict: 'link'
        })
        .select()

      if (error) {
        console.error('ArticleService: Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return []
      }

      console.log(`ArticleService: Successfully saved ${data?.length || 0} articles`);
      return data || []
    } catch (error) {
      console.error('ArticleService: Exception in saveArticles:', error)
      return []
    }
  }

  /**
   * Get articles with pagination and filtering
   */
  static async getArticles(options: {
    page?: number
    limit?: number
    category?: string
    source?: string
    search?: string
    feed_id?: string
    language?: string
  } = {}) {
    try {
      const { page = 1, limit = 20, category, source, search, feed_id, language } = options
      const offset = (page - 1) * limit

      let query = supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact' })
        .order('pub_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      if (source) {
        query = query.eq('source', source)
      }

      if (feed_id) {
        query = query.eq('feed_id', feed_id)
      }

      if (language) {
        query = query.eq('language_code', language)
      }

      if (search) {
        // Use the full-text search function we created
        const { data: searchResults, error: searchError } = await supabaseAdmin
          .rpc('search_articles', {
            search_query: search,
            limit_count: limit,
            offset_count: offset
          })

        if (searchError) {
          console.error('Error in search:', searchError)
          return { articles: [], count: 0 }
        }

        return { articles: searchResults || [], count: searchResults?.length || 0 }
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching articles:', error)
        return { articles: [], count: 0 }
      }

      return { articles: data || [], count: count || 0 }
    } catch (error) {
      console.error('Error in getArticles:', error)
      return { articles: [], count: 0 }
    }
  }

  /**
   * Get article by ID
   */
  static async getArticleById(id: string): Promise<Article | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching article:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getArticleById:', error)
      return null
    }
  }

  /**
   * Delete article by ID
   */
  static async deleteArticle(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('articles')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting article:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteArticle:', error)
      return false
    }
  }

  /**
   * Get unique categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('articles')
        .select('category')
        .not('category', 'is', null)

      if (error) {
        console.error('Error fetching categories:', error)
        return []
      }

      const categories = [...new Set(data?.map(item => item.category) || [])]
      return categories.sort()
    } catch (error) {
      console.error('Error in getCategories:', error)
      return []
    }
  }

  /**
   * Get unique sources
   */
  static async getSources(): Promise<string[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('articles')
        .select('source')
        .not('source', 'is', null)

      if (error) {
        console.error('Error fetching sources:', error)
        return []
      }

      const sources = [...new Set(data?.map(item => item.source) || [])]
      return sources.sort()
    } catch (error) {
      console.error('Error in getSources:', error)
      return []
    }
  }

  /**
   * RSS Feed Management Methods
   */
  
  /**
   * Get all RSS feeds
   */
  static async getRSSFeeds(): Promise<RSSFeed[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rss_feeds')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching RSS feeds:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getRSSFeeds:', error)
      return []
    }
  }

  /**
   * Add a new RSS feed
   */
  static async addRSSFeed(feed: Omit<RSSFeed, 'id' | 'created_at' | 'updated_at'>): Promise<RSSFeed | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rss_feeds')
        .insert(feed)
        .select()
        .single()

      if (error) {
        console.error('Error adding RSS feed:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in addRSSFeed:', error)
      return null
    }
  }

  /**
   * Update RSS feed
   */
  static async updateRSSFeed(id: string, updates: Partial<RSSFeed>): Promise<RSSFeed | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rss_feeds')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating RSS feed:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateRSSFeed:', error)
      return null
    }
  }

  /**
   * Delete RSS feed
   */
  static async deleteRSSFeed(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('rss_feeds')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting RSS feed:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteRSSFeed:', error)
      return false
    }
  }

  /**
   * Get articles by feed
   */
  static async getArticlesByFeed(feedId: string, options: { page?: number; limit?: number } = {}): Promise<{ articles: Article[]; count: number }> {
    return this.getArticles({ ...options, feed_id: feedId })
  }

  /**
   * Mark feed as fetched
   */
  static async markFeedFetched(feedId: string, errorMessage?: string): Promise<void> {
    try {
      if (errorMessage) {
        // First get current error count, then increment
        const { data: currentFeed } = await supabaseAdmin
          .from('rss_feeds')
          .select('error_count')
          .eq('id', feedId)
          .single()

        const newErrorCount = (currentFeed?.error_count || 0) + 1

        await supabaseAdmin
          .from('rss_feeds')
          .update({
            last_fetched: new Date().toISOString(),
            error_count: newErrorCount,
            last_error: errorMessage
          })
          .eq('id', feedId)
      } else {
        await supabaseAdmin
          .from('rss_feeds')
          .update({
            last_fetched: new Date().toISOString(),
            error_count: 0,
            last_error: null
          })
          .eq('id', feedId)
      }
    } catch (error) {
      console.error('Error marking feed as fetched:', error)
    }
  }
}
