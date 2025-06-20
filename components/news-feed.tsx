"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Calendar } from "lucide-react";
import { useState } from "react";
import { useArticles } from "@/hooks/useArticles";

interface Article {
  title: string;
  link: string;
  pub_date: string;
  description?: string | null;
  source: string;
  guid: string;
  category?: string;
}

export function NewsFeed() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Use the useArticles hook with auto-refresh
  const { articles, loading, error } = useArticles({
    limit: 100,
    category: selectedCategory || undefined,
    autoRefresh: true,
    refreshInterval: 60 // Auto-refresh every 60 seconds
  });

  // Get unique categories from articles
  const categories = Array.from(new Set(articles.map(article => article.category).filter((cat): cat is string => Boolean(cat))));

  // Filter articles based on selected category
  const filteredArticles = selectedCategory 
    ? articles.filter(article => article.category === selectedCategory)
    : articles;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const truncateDescription = (text: string | null | undefined, maxLength: number = 150) => {
    if (!text) return 'No description available';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Geopolitical News Tracker</h1>
        <p className="text-xl text-muted-foreground">
          Latest articles from trusted international news sources
        </p>
        <p className="text-sm text-muted-foreground">
          Articles are automatically updated via Supabase Edge Functions
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          className="mb-2"
        >
          All Articles ({filteredArticles.length})
        </Button>
        {categories.map((category) => {
          const count = articles.filter(article => article.category === category).length;
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="mb-2"
            >
              {category} ({count})
            </Button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Articles Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <Card key={`${article.guid}-${index}`} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader className="flex-none">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {article.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {article.source}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight line-clamp-2 min-h-[3.5rem]">
                    {article.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span className="truncate">{formatDate(article.pub_date)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <CardDescription className="text-sm line-clamp-3 min-h-[4.5rem] flex-1">
                  {truncateDescription(article.description)}
                </CardDescription>
                <div className="mt-4 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(article.link, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Read Article
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No articles found for the selected category.</p>
        </div>
      )}
    </div>
  );
}
