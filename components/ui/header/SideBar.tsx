import React from 'react';
import NavigationMenu from './NavigationMenu'; 

type SidebarProps = {
  isOpen: boolean;
  toggleSidebar: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <div className={`fixed top-0 left-0 h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out md:w-[25%] w-full ${isOpen ? 'translate-x-0 bg-[#161616] boder-r-[1px] backdrop-blur-[8px] shadow-md' : '-translate-x-full bg-transparent'}`}>
      <div className='w-full min-h-[72px]'>

      </div>
      <div className="flex flex-col w-full">
        <NavigationMenu />
      </div>
    </div>
  );
};

export default Sidebar;