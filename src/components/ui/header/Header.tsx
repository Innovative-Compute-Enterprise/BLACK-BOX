'use client';
import React from 'react';
import Link from 'next/link';
import Dashboard from '@/src/components/icons/Dashboard';
import UserIcon from '@/src/components/icons/UserIcon';


const Header = () => {
  const navigation = [
    { name: 'Home', href: '/', icon: <Dashboard className="size-5" /> },
    { name: 'Account', href: '/account', icon: <UserIcon className="size-5" /> }
  ];

  return (
    <header className="fixed backdrop-blur-sm top-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center py-2 z-10 w-full">
      <div className="flex justify-center w-full">
        <div className="flex gap-4 items-center py-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <div className={` flex items-center px-2 py-1.5 gap-2 rounded-full 
                dark:hover:bg-white/10 hover:bg-black/10 
                dark:text-zinc-300 text-zinc-800
                dark:hover:text-white hover:text-black
                font-extrabold
                border border-transparent 
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