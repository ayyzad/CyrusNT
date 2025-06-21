'use client';

import React from 'react';

export interface Article {
  id: string;
  title: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
  description?: string;
  tags?: string[];
}

const NewsCard: React.FC<{ article: Article }> = ({ article }) => {
  return (
    <div className="bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 border">
      {article.image_url && <img className="w-full h-48 object-cover" src={article.image_url} alt={article.title} />}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-foreground">{article.title}</h3>
        {article.description && <p className="text-foreground/90 my-4 text-sm">{article.description}</p>}
        <p className="text-muted-foreground text-sm mb-4">{new Date(article.pub_date).toLocaleDateString()} - {article.source}</p>
        <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Read More</a>
      </div>
    </div>
  );
};

export default NewsCard;
