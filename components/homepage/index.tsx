import React from 'react';
import { getLatestArticles } from '@/services/ArticleService';
import { getLatestAnalyses } from '@/services/ComparativeAnalysisService';
import { HomepageClient } from './HomepageClient';

export async function HomePage() {
  const [articles, analyses] = await Promise.all([
    getLatestArticles(),
    getLatestAnalyses(),
  ]);

  const allTags = articles.flatMap(article => article.tags || []);
  const uniqueTags = [...new Set(allTags)].sort();

  return <HomepageClient articles={articles} analyses={analyses} tags={uniqueTags} />;
}
