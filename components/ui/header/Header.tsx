'use client';
import React, { useState } from 'react';
import Sidebar from './SideBar';
import BlackBox from '../../icons/BlackBox';

const Header: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const iconColorClass = isSidebarOpen ? "text-white/80 backdrop-blur-[8px]" : "text-black/80 backdrop-blur-[8px]";


  return (
    <header className="fixed top-0 left-0 right-0  bg-white justify-center my-3 mx-3 rounded-full z-[9999]">
      <div className='flex justify-between px-3 py-2'>
        
      <div className="cursor-pointer z-[9999] relative w-[36px] h-[36px]" onClick={toggleSidebar}>
          <BlackBox className={iconColorClass} />
        </div>
        
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>
    </header>
  );
};

export default Header;
