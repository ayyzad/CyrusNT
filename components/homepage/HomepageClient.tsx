"use client";

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AiSummaryCard, { ComparativeAnalysis } from '@/components/ai-summary-card';
import NewsCard, { Article } from '@/components/news-card';
import { SelectableBadge } from '@/components/ui/selectable-badge';
import { Button } from '@/components/ui/button';

interface HomepageClientProps {
  articles: Article[];
  analyses: ComparativeAnalysis[];
  tags: string[];
}

export function HomepageClient({ articles, analyses, tags }: HomepageClientProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);

  const filteredArticles = useMemo(() => {
    if (!selectedTag) return articles;
    return articles.filter(article => article.tags && article.tags.includes(selectedTag));
  }, [selectedTag, articles]);

  const visibleTags = showAllTags ? tags : tags.slice(0, 12);

  const renderArticleGrid = (articlesToRender: Article[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {articlesToRender.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
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
          <h2 className="text-3xl font-bold mb-6 text-foreground">AI Topic Summary</h2>
          <div className="space-y-6">
            {analyses.map((analysis) => (
              <AiSummaryCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        </aside>

        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Latest Articles</h2>
          {renderTags()}
          {renderArticleGrid(filteredArticles)}
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
            <div className="space-y-6 mt-6">
              {analyses.map((analysis) => (
                <AiSummaryCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="articles">
            <div className="mt-6">
              {renderTags()}
              {renderArticleGrid(filteredArticles)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
