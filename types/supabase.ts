export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      article_chunks: {
        Row: {
          article_id: string
          chunk_index: number
          chunk_text: string
          created_at: string | null
          embedding: string | null
          embedding_generated: boolean | null
          embedding_generated_at: string | null
          id: string
          word_count: number
        }
        Insert: {
          article_id: string
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          embedding?: string | null
          embedding_generated?: boolean | null
          embedding_generated_at?: string | null
          id?: string
          word_count: number
        }
        Update: {
          article_id?: string
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          embedding?: string | null
          embedding_generated?: boolean | null
          embedding_generated_at?: string | null
          id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_chunks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_stats: {
        Row: {
          articles_by_category: Json | null
          articles_by_source: Json | null
          avg_sentiment: number | null
          created_at: string | null
          date: string
          id: string
          top_keywords: string[] | null
          total_articles: number | null
        }
        Insert: {
          articles_by_category?: Json | null
          articles_by_source?: Json | null
          avg_sentiment?: number | null
          created_at?: string | null
          date: string
          id?: string
          top_keywords?: string[] | null
          total_articles?: number | null
        }
        Update: {
          articles_by_category?: Json | null
          articles_by_source?: Json | null
          avg_sentiment?: number | null
          created_at?: string | null
          date?: string
          id?: string
          top_keywords?: string[] | null
          total_articles?: number | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          author: string | null
          category: string
          content: string | null
          created_at: string | null
          description: string | null
          embedding: string | null
          embedding_generated: boolean | null
          embedding_generated_at: string | null
          guid: string | null
          id: string
          image_url: string | null
          is_processed: boolean | null
          language_code: string | null
          link: string
          pub_date: string | null
          reading_time: number | null
          sentiment_score: number | null
          source: string
          tags: string[] | null
          title: string
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          author?: string | null
          category: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          embedding_generated?: boolean | null
          embedding_generated_at?: string | null
          guid?: string | null
          id?: string
          image_url?: string | null
          is_processed?: boolean | null
          language_code?: string | null
          link: string
          pub_date?: string | null
          reading_time?: number | null
          sentiment_score?: number | null
          source: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          author?: string | null
          category?: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          embedding_generated?: boolean | null
          embedding_generated_at?: string | null
          guid?: string | null
          id?: string
          image_url?: string | null
          is_processed?: boolean | null
          language_code?: string | null
          link?: string
          pub_date?: string | null
          reading_time?: number | null
          sentiment_score?: number | null
          source?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      comparative_analyses: {
        Row: {
          aggregate_summary: string
          analysis_timestamp: string | null
          article_ids: string[]
          created_at: string | null
          id: string
          similarity_threshold: number
          source_perspectives: Json
          topic_id: string
          topic_summary: string
          total_articles: number
        }
        Insert: {
          aggregate_summary: string
          analysis_timestamp?: string | null
          article_ids: string[]
          created_at?: string | null
          id?: string
          similarity_threshold: number
          source_perspectives: Json
          topic_id: string
          topic_summary: string
          total_articles: number
        }
        Update: {
          aggregate_summary?: string
          analysis_timestamp?: string | null
          article_ids?: string[]
          created_at?: string | null
          id?: string
          similarity_threshold?: number
          source_perspectives?: Json
          topic_id?: string
          topic_summary?: string
          total_articles?: number
        }
        Relationships: []
      }
      websites: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          last_scraped_at: string | null
          name: string | null
          scraping_enabled: boolean | null
          updated_at: string | null
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          last_scraped_at?: string | null
          name?: string | null
          scraping_enabled?: boolean | null
          updated_at?: string | null
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          last_scraped_at?: string | null
          name?: string | null
          scraping_enabled?: boolean | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      calculate_reading_time: {
        Args: {
          word_count: number
        }
        Returns: number
      }
      count_words: {
        Args: {
          content_text: string
        }
        Returns: number
      }
      get_recent_chunks_with_embeddings: {
        Args: {
          hours_back?: number
        }
        Returns: {
          id: string
          article_id: string
          chunk_index: number
          chunk_text: string
          word_count: number
          embedding: string
          article_title: string
          article_link: string
          article_source: string
          article_author: string
          article_pub_date: string
          article_content: string
        }[]
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      search_articles: {
        Args: {
          search_query: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          content: string
          link: string
          source: string
          category: string
          pub_date: string
          rank: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

