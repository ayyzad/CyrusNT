import React from 'react';
import SourcesTable from '@/components/SourcesTable';

const SourcesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">News Sources Analysis</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
        This page provides a transparent overview of the news sources used for aggregation and analysis. Understanding the origin, funding, and potential biases of each source is crucial for a comprehensive and critical reading of the news. The table below details each source&apos;s stated mission, noteworthy characteristics, and a neutrality rating to help contextualize the information presented throughout this site.
      </p>
      <SourcesTable />
    </div>
  );
};

export default SourcesPage;
