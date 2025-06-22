import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getWebsiteSources, WebsiteSource } from '@/services/WebsiteService';

const SourcesTable = async () => {
  const { data: sources, error } = await getWebsiteSources();

  if (error) {
    return <p className="text-red-500">Error loading sources: {error.message}</p>;
  }

  if (!sources || sources.length === 0) {
    return <p>No sources found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Source</TableHead>
            <TableHead className="w-[200px]">Ownership & Funding</TableHead>
            <TableHead className="w-[150px]">Neutrality (1-5)</TableHead>
            <TableHead>Justification for Bias Rating</TableHead>
            <TableHead>Stated Mission / About</TableHead>
            <TableHead>Key Features & Noteworthy Aspects</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source: WebsiteSource) => (
            <TableRow key={source.id}>
              <TableCell className="font-medium">
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {source.name}
                </a>
              </TableCell>
              <TableCell>{source.ownership_and_funding}</TableCell>
              <TableCell className="text-center">{source.neutrality_rating}</TableCell>
              <TableCell>{source.justification_for_bias_rating}</TableCell>
              <TableCell>{source.stated_mission}</TableCell>
              <TableCell>{source.noteworthy_aspects}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SourcesTable;
