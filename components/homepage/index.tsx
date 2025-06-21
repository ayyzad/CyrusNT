import React from 'react';
import { getLatestArticles } from '@/services/ArticleService';
import { getLatestAnalyses } from '@/services/ComparativeAnalysisService';
import NewsCard, { Article } from '@/components/news-card';
import AiSummaryCard, { ComparativeAnalysis } from '@/components/ai-summary-card';

export async function HomePage() {
  const [articles, analyses] = await Promise.all([
    getLatestArticles(),
    getLatestAnalyses(),
  ]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center my-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Cyrus News Tracker</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Your source for aggregated and analyzed news on Iran.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Latest Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article: Article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">AI-Powered Analysis</h2>
            <div className="space-y-6">
              {analyses.map((analysis: ComparativeAnalysis) => (
                <AiSummaryCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
