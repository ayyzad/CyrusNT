'use client';

import React from 'react';

export interface Article {
  id: string;
  title: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
}

const NewsCard: React.FC<{ article: Article }> = ({ article }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
      {article.image_url && <img className="w-full h-48 object-cover" src={article.image_url} alt={article.title} />}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{article.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{new Date(article.pub_date).toLocaleDateString()} - {article.source}</p>
        <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Read More</a>
      </div>
    </div>
  );
};

export default NewsCard;
