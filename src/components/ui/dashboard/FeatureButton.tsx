import React, { ReactNode } from 'react';
import Link from 'next/link';

interface FeatureButtonProps {
  href?: string;
  icon: ReactNode;
  title: string;
  isDisabled?: boolean;
  subtitle?: string;
}

const FeatureButton: React.FC<FeatureButtonProps> = ({
  href,
  icon,
  title,
  isDisabled = false,
  subtitle
}) => {
  const ButtonContent = () => (
    <>
      <div className={`p-4 rounded-full dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 dark:border-[#ffffff]/10 border-black/10 border mb-3 transition-all duration-300 
        ${!isDisabled ? 'group-hover:border-gray-400 group-hover:bg-gray-200/70 group-hover:scale-105 group-hover:shadow-md dark:group-hover:border-[#ffffff]/20 dark:group-hover:bg-[#0E0E0E]/50' : ''}`}>
        {icon}
      </div>
      <span className={`text-gray-800 text-xl font-semibold tracking-wide dark:text-white 
        ${!isDisabled ? 'group-hover:scale-105 transition-transform duration-300' : ''}`}>
        {title}
      </span>
      {subtitle && <span className="text-gray-400 text-xs mt-1 dark:text-gray-600">{subtitle}</span>}
    </>
  );

  if (isDisabled) {
    return (
      <div className="flex flex-col justify-center items-center cursor-not-allowed opacity-80 hover:opacity-100 transition-all duration-300 dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 dark:opacity-80 dark:hover:opacity-100">
        <ButtonContent />
      </div>
    );
  }

  return (
    <Link 
      href={href || "#"} 
      className="flex flex-col justify-center items-center border-b dark:border-[#ffffff]/10 border-black/10 dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 hover:bg-gray-100/70 active:bg-gray-200 transition-all duration-300 cursor-pointer group dark:hover:bg-[#0E0E0E]/90 dark:active:bg-[#0E0E0E]"
    >
      <ButtonContent />
    </Link>
  );
};

export default FeatureButton; 