'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge-source-url';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface SourcePerspective {
  source_name: string;
  source_category: string;
  source_country: string;
  article_count: number;
  perspective_summary: string;
  key_themes: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface ComparativeAnalysis {
  id: string;
  topic_summary: string;
  aggregate_summary: string;
  source_perspectives?: SourcePerspective[];
  created_at: string;
  sources: { source: string; link: string; }[];
}

const AiSummaryCard: React.FC<{ analysis: ComparativeAnalysis }> = ({ analysis }) => {
  const [showPerspectives, setShowPerspectives] = useState(false);

  const getSentimentBadgeVariant = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'default';
      case 'negative': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden border transform hover:scale-105 transition-transform duration-300">
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-foreground">{analysis.topic_summary}</h3>
        <p className="text-muted-foreground text-sm mb-4">Generated on: {new Date(analysis.created_at).toLocaleString()}</p>
        <p className="text-foreground/90 mb-4">{analysis.aggregate_summary}</p>

        {analysis.source_perspectives && analysis.source_perspectives.length > 0 && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPerspectives(!showPerspectives)}
              className="w-full flex items-center justify-center gap-2"
            >
              {showPerspectives ? 'Hide' : 'Show'} Source Perspectives
              {showPerspectives ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showPerspectives && (
              <div className="mt-4 space-y-4">
                {analysis.source_perspectives.map((perspective, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{perspective.source_name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSentimentBadgeVariant(perspective.sentiment)}>
                          {perspective.sentiment}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {perspective.article_count} article{perspective.article_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      {perspective.source_category} • {perspective.source_country}
                    </div>
                    
                    <p className="text-sm text-foreground/90 mb-3">{perspective.perspective_summary}</p>
                    
                    {perspective.key_themes && perspective.key_themes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {perspective.key_themes.map((theme, themeIndex) => (
                          <Badge key={themeIndex} variant="outline" className="text-xs">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {analysis.sources && analysis.sources.length > 0 && (
          <div className="mt-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="sources">
                <AccordionTrigger className="text-sm font-semibold text-foreground">
                  Sources ({analysis.sources.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.sources.map((source, index) => {
                      const cleanUrl = source.link.replace(/^(?:https?|ftp):\/\/(?:www\.)?/, '').replace(/\/$/, '');
                      const parts = cleanUrl.split('/');
                      let truncatedUrl = parts[0];
                      if (parts[1]) {
                        truncatedUrl += `/${parts[1]}`;
                      }
                      if (cleanUrl.length > truncatedUrl.length) {
                        truncatedUrl += '...';
                      }
                      return (
                        <a key={index} href={source.link} target="_blank" rel="noopener noreferrer">
                          <Badge variant="secondary">{truncatedUrl}</Badge>
                        </a>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

      </div>
    </div>
  );
};

export default AiSummaryCard;
