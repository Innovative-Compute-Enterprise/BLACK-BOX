'use client';

import React from 'react';

interface SendButtonProps {
  onClick: () => void;
  disabled: boolean;
}

function SendButton({ onClick, disabled }: SendButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Send message"
      className="flex-shrink-0 text-black dark:text-white bg-[#0E0E0E] dark:bg-[#F1F1F1] p-1 cursor-pointer min-w-8 rounded-full transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
              fill="currentColor" 
              className="size-[24px] fill-white dark:fill-black">
        <path fillRule="evenodd" 
        d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" 
        clipRule="evenodd" />
      </svg>

    </button>
  );
}

export default SendButton;
