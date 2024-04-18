// In your SVGs folder, create a file, e.g., BlackBox.tsx
import React from 'react';

interface BlackBoxProps {
  className?: string;
}

const BlackBox: React.FC<BlackBoxProps> = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      className={`w-[30px] h-[30px] fill-current text-white ${className}`}  
      fill="currentColor" viewBox="0 0 445 506"><path fill="currentColor"
      d="M222 228 2 114l-1.5-.707V390.5l223 115.5 221-116.5V114L222 228Z"/>
      <path fill="currentColor" d="M.5 113 222 228v277L0 390.5.5 113Z"/>
      <path fill="currentColor" d="M223 0 25 104l198 102 197.5-102.5L223 0Z"/>
      <path stroke="#fff"  d="m221.976 230 1.585 275.002"/>
          <defs>
           <linearGradient id="a" x1="20" x2="176" y1="156" y2="530.5" gradientUnits="userSpaceOnUse">
            <stop/><stop offset="1"/>
           </linearGradient>
          </defs>
    </svg>
  );
};

export default BlackBox;
