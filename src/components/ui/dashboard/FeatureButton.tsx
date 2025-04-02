import React, { ReactNode } from 'react';
import Link from 'next/link';
import { MonaSans } from '@/src/styles/fonts/font';

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
      <div className={`p-2 rounded-full dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 mb-2 transition-all duration-300 
        ${!isDisabled ? 'group-hover:bg-gray-200/70 group-hover:scale-105 group-hover:shadow-md dark:group-hover:bg-[#0E0E0E]/50' : ''}`}>
        {icon}
      </div>
      <span style={{ fontStretch: "125%" }} className={`${MonaSans.className}text-gray-800 text-xl uppercase font-[900] tracking-wide dark:text-white transition-transform duration-300`}>
        {title}
      </span>
      {subtitle && <span className="text-gray-400 text-xs mt-1 dark:text-gray-600">{subtitle}</span>}
    </>
  );

  if (isDisabled) {
    return (
      <div className="flex flex-col justify-center items-center p-3 rounded-lg border dark:border-[#ffffff]/10 border-black/10 dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 cursor-not-allowed opacity-60 dark:opacity-60 h-full">
        <ButtonContent />
      </div>
    );
  }

  return (
    <Link 
      href={href || "#"} 
      className="flex flex-col justify-center items-center rounded-lg border dark:border-[#ffffff]/10 border-black/10 dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 hover:bg-gray-100/70 active:bg-gray-200 transition-all duration-300 cursor-pointer group dark:hover:bg-[#0E0E0E]/90 dark:active:bg-[#0E0E0E] h-full"
    >
      <ButtonContent />
    </Link>
  );
};

export default FeatureButton; 