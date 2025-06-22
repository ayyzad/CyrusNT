import React from 'react';

const WhyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Why This Project Exists</h1>
      
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          We were frustrated with the overwhelming number of disparate news sources covering the Middle East, 
          each with their own biases, agendas, and perspectives. It became increasingly difficult to get a 
          clear, unbiased view of what was actually happening in this critical region.
        </p>

        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          Every news outlet seemed to have their own spin - some leaning heavily toward one side or another, 
          others pushing specific political narratives. We found ourselves constantly questioning: 
          <em>"What's the real story? What are we missing? How biased is this source?"</em>
        </p>

        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          The geopolitical situation in the Middle East is complex and rapidly evolving, affecting millions 
          of lives and global stability. We needed a way to monitor multiple perspectives simultaneously, 
          understand the bias levels of different sources, and get a more complete picture of events as they unfold.
        </p>

        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          So we built <strong>Cyrus News Tracker</strong> - a simple yet powerful application that:
        </p>

        <ul className="text-lg text-gray-700 dark:text-gray-300 mb-6 space-y-2">
          <li>• Aggregates news from multiple Middle Eastern and international sources</li>
          <li>• Provides transparency about source bias and neutrality ratings</li>
          <li>• Offers comparative analysis to highlight different perspectives on the same events</li>
          <li>• Delivers a clean, uncluttered interface focused on the facts</li>
        </ul>

        <p className="text-lg text-gray-700 dark:text-gray-300">
          Our goal is simple: to help people stay informed about Middle Eastern geopolitics with greater 
          awareness of source bias and multiple perspectives, enabling more informed decision-making in 
          an increasingly complex world.
        </p>
      </div>
    </div>
  );
};

export default WhyPage;
