"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AiSummaryCard, { ComparativeAnalysis } from '@/components/AiSummaryCard';
import NewsCard, { Article } from '@/components/NewsCard';
import { SelectableBadge } from '@/components/ui/selectable-badge';
import { Button } from '@/components/ui/button';

interface HomepageClientProps {
  articles: Article[];
  analyses: ComparativeAnalysis[];
  tags: string[];
}

const INITIAL_ARTICLES_COUNT = 12;
const ARTICLES_LOAD_MORE_COUNT = 8;
const INITIAL_ANALYSES_COUNT = 3;
const ANALYSES_LOAD_MORE_COUNT = 2;

export function HomepageClient({ articles, analyses, tags }: HomepageClientProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [visibleArticlesCount, setVisibleArticlesCount] = useState(INITIAL_ARTICLES_COUNT);
  const [visibleAnalysesCount, setVisibleAnalysesCount] = useState(INITIAL_ANALYSES_COUNT);

  const filteredArticles = useMemo(() => {
    if (!selectedTag) return articles;
    return articles.filter(article => article.tags && article.tags.includes(selectedTag));
  }, [selectedTag, articles]);

  const visibleTags = showAllTags ? tags : tags.slice(0, 12);
  const displayedArticles = filteredArticles.slice(0, visibleArticlesCount);
  const displayedAnalyses = analyses.slice(0, visibleAnalysesCount);

  const handleLoadMoreArticles = () => {
    setVisibleArticlesCount(prev => prev + ARTICLES_LOAD_MORE_COUNT);
  };

  const handleLoadMoreAnalyses = () => {
    setVisibleAnalysesCount(prev => prev + ANALYSES_LOAD_MORE_COUNT);
  };

  // Reset article count when tag filter changes
  useEffect(() => {
    setVisibleArticlesCount(INITIAL_ARTICLES_COUNT);
  }, [selectedTag]);

  const renderArticleGrid = (articlesToRender: Article[]) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articlesToRender.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
      {filteredArticles.length > visibleArticlesCount && (
        <div className="flex justify-center">
          <Button 
            onClick={handleLoadMoreArticles}
            variant="outline"
            className="px-8 py-2"
          >
            Load More Articles ({filteredArticles.length - visibleArticlesCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );

  const renderAnalysesSection = (analysesToRender: ComparativeAnalysis[]) => (
    <div className="space-y-6">
      {analysesToRender.map((analysis) => (
        <AiSummaryCard key={analysis.id} analysis={analysis} />
      ))}
      {analyses.length > visibleAnalysesCount && (
        <div className="flex justify-center">
          <Button 
            onClick={handleLoadMoreAnalyses}
            variant="outline"
            size="sm"
            className="px-6"
          >
            Load More Summaries ({analyses.length - visibleAnalysesCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );

  const renderTags = () => (
    <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {visibleTags.map(tag => (
            <SelectableBadge
              key={tag}
              variant="selectable"
              selected={selectedTag === tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              {tag}
            </SelectableBadge>
          ))}
        </div>
        {tags.length > 12 && (
          <Button variant="link" onClick={() => setShowAllTags(!showAllTags)} className="mt-2 px-0">
            {showAllTags ? 'Show Less' : 'Show More'}
          </Button>
        )}
      </div>
  )

  return (
    <>
      {/* Desktop Layout: 3-column grid */}
      <main className="hidden lg:grid lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1">
          <h2 className="text-3xl font-bold mb-6 text-foreground flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-primary" />
            <span>Topic Summary</span>
          </h2>
          {renderAnalysesSection(displayedAnalyses)}
        </aside>

        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Latest News</h2>
          {renderTags()}
          {renderArticleGrid(displayedArticles)}
        </div>
      </main>

      {/* Mobile Layout: Tabs */}
      <div className="lg:hidden">
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analysis">AI Topic Summary</TabsTrigger>
            <TabsTrigger value="articles">Latest Articles</TabsTrigger>
          </TabsList>
          <TabsContent value="analysis">
            <div className="mt-6">
              {renderAnalysesSection(displayedAnalyses)}
            </div>
          </TabsContent>
          <TabsContent value="articles">
            <div className="mt-6">
              {renderTags()}
              {renderArticleGrid(displayedArticles)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
