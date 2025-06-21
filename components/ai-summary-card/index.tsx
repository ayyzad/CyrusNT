'use client';

import React from 'react';

export interface ComparativeAnalysis {
  id: string;
  topic_id: string;
  aggregate_summary: string;
  source_perspectives: any;
  created_at: string;
}

const AiSummaryCard: React.FC<{ analysis: ComparativeAnalysis }> = ({ analysis }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Comparative Analysis: {analysis.topic_id}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Generated on: {new Date(analysis.created_at).toLocaleString()}</p>
        <p className="text-gray-800 dark:text-gray-200 mb-4">{analysis.aggregate_summary}</p>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">Source Perspectives:</h4>
          <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {JSON.stringify(analysis.source_perspectives, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AiSummaryCard;
