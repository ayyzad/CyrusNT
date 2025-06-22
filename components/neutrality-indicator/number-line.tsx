import React from 'react';

interface NumberLineIndicatorProps {
  rating: number | null;
}

const NumberLineIndicator: React.FC<NumberLineIndicatorProps> = ({ rating }) => {
  if (rating === null) {
    return null;
  }

  const getScoreColor = (score: number, currentRating: number) => {
    if (score === currentRating) {
      // Highlighted score - use color based on rating
      if (currentRating <= 2) return 'bg-green-500 text-white';
      if (currentRating === 3) return 'bg-yellow-500 text-white';
      return 'bg-red-500 text-white';
    }
    // Non-highlighted scores
    return 'bg-gray-200 text-gray-600';
  };

  const getScoreSize = (score: number, currentRating: number) => {
    return score === currentRating ? 'w-6 h-6 text-sm font-bold' : 'w-4 h-4 text-xs';
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-card-foreground mr-2">Bias:</span>
      {[1, 2, 3, 4, 5].map((score) => (
        <div
          key={score}
          className={`
            flex items-center justify-center rounded-full transition-all duration-200
            ${getScoreColor(score, rating)}
            ${getScoreSize(score, rating)}
          `}
          title={`Rating: ${score}/5`}
        >
          {score}
        </div>
      ))}
      <span className="text-xs text-gray-500 ml-2">
        {rating <= 2 ? 'Neutral' : rating === 3 ? 'Moderate' : 'Biased'}
      </span>
    </div>
  );
};

export default NumberLineIndicator;
