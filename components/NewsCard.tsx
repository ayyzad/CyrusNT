'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';
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

  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      // Check for common malformed query parameters
      const params = urlObj.searchParams;
      if (params.has('auto') && params.get('auto') === 'formatl') {
        // Fix the malformed 'auto=formatl' parameter
        params.set('auto', 'format');
        return true;
      }
      return true;
    } catch {
      return false;
    }
  };

  const getCleanImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      if (params.has('auto') && params.get('auto') === 'formatl') {
        params.set('auto', 'format');
        return urlObj.toString();
      }
      return url;
    } catch {
      return undefined;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const pubDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 0) {
      // Future date
      const absDiff = Math.abs(diffInMinutes);
      if (absDiff < 60) return `${absDiff}m`;
      return `${Math.floor(absDiff / 60)}h`;
    }
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d`;
    }
  };

  return (
    <div className="bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 border flex flex-col">
      {article.image_url && isValidImageUrl(article.image_url) && !imageError && (
        <Image 
          className="w-full h-48 object-cover"
          src={getCleanImageUrl(article.image_url) || article.image_url} 
          alt={article.title}
          width={400}
          height={192}
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
            <span className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeAgo(article.pub_date)}
            </span>
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
