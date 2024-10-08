// SkeletonLoader.tsx

import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {/* Skeleton for Drawer Header */}
      <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
      
      {/* Skeletons for Chat History Items */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3">
            {/* Placeholder for Chat Icon */}
            <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
            
            {/* Placeholder for Chat Details */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;
