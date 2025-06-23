'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import NumberLineIndicator from './NeutralityIndicator';

export interface Article {
  id: string;
  title: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
  description?: string;
  tags?: string[];
  neutrality_rating: number | null;
}

const NewsCard: React.FC<{ article: Article }> = ({ article }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 border flex flex-col">
      {article.image_url && !imageError && (
        <img 
          className="w-full h-48 object-cover"
          src={article.image_url} 
          alt={article.title}
          onError={handleImageError}
        />
      )}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2 text-foreground">{article.title}</h3>
        <div className="flex justify-between items-start text-muted-foreground text-sm mb-4">
          <div className="flex flex-col gap-1">
            <span className="font-medium">{article.source}</span>
            <NumberLineIndicator rating={article.neutrality_rating} />
          </div>
          <div className="text-right">
            <span className="text-xs">{formatDistanceToNow(new Date(article.pub_date), { addSuffix: true })}</span>
          </div>
        </div>
        {article.description && <p className="text-foreground/90 my-4 text-sm">{article.description}</p>}
        <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-auto self-end flex items-center">
          Read More
          <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </div>
    </div>
  );
};

export default NewsCard;
