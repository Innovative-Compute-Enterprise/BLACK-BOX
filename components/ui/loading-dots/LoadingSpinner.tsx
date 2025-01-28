import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  isLoading: boolean;
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isLoading,
  size = 24,
}) => {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowCheck(true);
      const timer = setTimeout(() => setShowCheck(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Use conditional rendering based on dark mode */}
      {isLoading && (
        <svg
          className="animate-spin dark:hidden"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            strokeWidth="4"
            style={{ stroke: 'white' }} // Default: white (light mode)
          />
          <path
            className="opacity-75"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            style={{ fill: 'white' }} // Default: white (light mode)
          />
        </svg>
      )}

      {showCheck && (
        <svg
          className="absolute top-0 left-0 animate-scale-in"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 6L9 17L4 12"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: 'white' }} // Default: white (light mode)
          />
        </svg>
      )}

      {/* Dark mode styles applied conditionally using inline styles */}
      {isLoading && (
        <div className="dark dark:block hidden">
          <svg
            className="animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              strokeWidth="4"
              style={{ stroke: 'black' }} // Dark mode: black
            />
            <path
              className="opacity-75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              style={{ fill: 'black' }} // Dark mode: black
            />
          </svg>
        </div>
      )}

      {showCheck && (
        <div className="dark">
          <svg
            className="absolute top-0 left-0 animate-scale-in"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6L9 17L4 12"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ stroke: 'black' }} // Dark mode: black
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;