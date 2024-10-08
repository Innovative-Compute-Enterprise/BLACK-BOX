'use client';
import React, { useState } from 'react';
import BlackBox from '@/components/icons/BlackBox';
import NavigationMenu from './NavigationMenu';
import Plus from '@/components/icons/Plus';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const plusVariants = {
    expanded: { rotate: 45 },
    collapsed: { rotate: 0 }
  };

  const menuVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: {
        opacity: { duration: 0.4 },
        height: { duration: 0.4 }
      }
    },
    visible: {
      opacity: 1,
      height: 'auto', 
      transition: {
        opacity: { duration: 0.7 },
        height: { duration: 0.4 }
      }
    }
  };

  return (
    <header className="fixed top-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center pt-2 px-2 pb-0 z-10 w-full">
      <div 
        className='flex flex-col justify-between w-full sm:max-w-[40%] 2xl:max-w-[30%] p-2 cursor-pointer dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 dark:border-[#ffffff]/10 border-black/10 border rounded-[20px] backdrop-blur-lg' 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='flex justify-between items-center w-full'>
          <div className="cursor-pointer block flex-none z-[999] relative p-1.5 rounded-[10px] dark:bg-[#2B2B2B] bg-[#D4D4D4] dark:border-[#ffffff]/5 border-black/5 border">
            <BlackBox />
          </div>  
          <div className="cursor-pointer block flex-none z-[999] relative p-1.5 rounded-[10px] dark:bg-[#2B2B2B] bg-[#D4D4D4] dark:border-[#ffffff]/5 border-black/5 border">
            <motion.div
              variants={plusVariants}
              animate={isExpanded ? 'expanded' : 'collapsed'}>
              <Plus />
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={menuVariants}>
              <NavigationMenu />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;