import React from 'react';

const LoadingSpinner: React.FC<{
  className?: string;
  dark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  performanceMode?: boolean;
}> = ({ className = '', dark = false, size = 'md', performanceMode = false }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div 
      role="status" 
      aria-live="polite"
      className={`absolute w-full h-full ${className}`}
    >
      <svg 
        className={`relative ${sizeMap[size]} ${
          performanceMode ? 'will-change-transform' : ''
        }`}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient 
            id="neuralGradient" 
            cx="50%" 
            cy="50%" 
            r="50%" 
            gradientTransform="rotate(45)"
          >
            <stop 
              offset="0%" 
              stopColor={dark ? 'rgba(59, 130, 246, 0.7)' : 'rgba(37, 99, 235, 0.9)'} 
            />
            <stop 
              offset="100%" 
              stopColor={dark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.2)'} 
            />
          </radialGradient>
          
          {/* Neural path pattern */}
          <pattern 
            id="neuralPath" 
            width="0.1" 
            height="0.1"
            patternContentUnits="objectBoundingBox"
          >
            <path 
              d="M0,0.05 L0.1,0.1" 
              stroke={dark ? '#3b82f6' : '#2563eb'} 
              strokeWidth="0.008"
            />
          </pattern>
        </defs>

        {/* Dynamic neural core */}
        <g className="animate-[neuralPulse_1.5s_ease-in-out_infinite]">
          <circle 
            cx="60" 
            cy="60" 
            r="12" 
            fill="url(#neuralGradient)"
            className="drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
          />
        </g>

        {/* Quantum-inspired connections */}
        <g className="animate-[neuralOrbit_2s_linear_infinite]">
          <circle 
            cx="60" 
            cy="60" 
            r="24" 
            stroke="url(#neuralGradient)" 
            strokeWidth="2" 
            fill="none"
            strokeDasharray="4 4"
          />
        </g>

        {/* Attention mechanism visualization */}
        {!performanceMode && (
          <g className="animate-[attentionFlow_3s_ease-in-out_infinite]">
            <path 
              d="M20,20 Q60,30 100,20" 
              stroke="url(#neuralPath)" 
              strokeWidth="1.5"
              opacity="0.4"
            />
            <path 
              d="M20,100 Q60,90 100,100" 
              stroke="url(#neuralPath)" 
              strokeWidth="1.5"
              opacity="0.4"
              className="delay-500"
            />
          </g>
        )}
      </svg>
    </div>
  );
};

export default LoadingSpinner;