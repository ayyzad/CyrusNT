'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge-source-url';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export interface ComparativeAnalysis {
  id: string;
  topic_summary: string;
  aggregate_summary: string;
  created_at: string;
  sources: { source: string; link: string; }[];
}

const AiSummaryCard: React.FC<{ analysis: ComparativeAnalysis }> = ({ analysis }) => {
  return (
    <div className="bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden border transform hover:scale-105 transition-transform duration-300">
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-foreground">{analysis.topic_summary}</h3>
        <p className="text-muted-foreground text-sm mb-4">Generated on: {new Date(analysis.created_at).toLocaleString()}</p>
        <p className="text-foreground/90 mb-4">{analysis.aggregate_summary}</p>

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
