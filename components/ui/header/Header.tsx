'use client';
import React, { useState } from 'react';
import BlackBox from '../../icons/BlackBox';
import NavigationMenu from './NavigationMenu';
import Plus from '../../icons/Plus';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const plusVariants = {
    expanded: { rotate: 45 },
    collapsed: { rotate: 0 }
  };

  // Variants for the navigation menu animation
  const menuVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: {
        opacity: { duration: 0.2 },
        height: { duration: 0.3 }
      }
    },
    visible: {
      opacity: 1,
      height: 'auto', // Use 'auto' for a natural height based on content
      transition: {
        opacity: { duration: 0.3 },
        height: { duration: 0.4 }
      }
    }
  };

  return (
    <header className="fixed items-center flex flex-col flex-nowrap justify-start w-full p-5 z-50 aspect-auto gap-5">
      <div 
        className='flex flex-col justify-between w-full p-2.5 cursor-pointer max-w-[600px] z-50 bg-[#0E0E0E] border-[#ffffff]/5 border rounded-[20px]' 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='flex justify-between items-center w-full'>
          <div className="cursor-pointer block flex-none z-[999] relative p-1.5 rounded-[10px] bg-[#2B2B2B] border-[#ffffff]/5 border">
            <BlackBox />
          </div>
        
          <div className="cursor-pointer block flex-none z-[999] relative p-1.5 rounded-[10px] bg-[#2B2B2B] border-[#ffffff]/5 border">
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
