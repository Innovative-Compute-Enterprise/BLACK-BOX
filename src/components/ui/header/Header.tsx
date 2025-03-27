'use client';
import React from 'react';
import Link from 'next/link';
import BlackBox from '@/src/components/icons/BlackBox';
import ChatIcon from '@/src/components/icons/ChatIcon';
import Settings from '@/src/components/icons/Settings';
import { Roboto } from '@/src/styles/fonts/font';

const Header = () => {
  const navigation = [
    { name: 'Home', href: '/', icon: <ChatIcon className="size-4 mr-2" /> },
    { name: 'Account', href: '/account', icon: <Settings className="size-4 mr-2" /> }
  ];

  return (
    <header className="fixed backdrop-blur-sm top-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center py-1 z-10 w-full">
      <div className="flex justify-center w-full">
        <div className="flex gap-4 items-center py-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <div className={` flex items-center px-4 py-2 rounded-full 
                dark:hover:bg-white/10 hover:bg-black/10 
                dark:text-white text-black
                font-extrabold
                border border-transparent dark:hover:border-white/10 hover:border-black/10
                transition-all duration-200 text-sm`}>
                {item.icon}
                <span>{item.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;