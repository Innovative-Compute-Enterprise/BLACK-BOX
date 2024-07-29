'use client';
'use strict';

import { SignOut } from '@/utils/auth-helpers/server';
import Logout from '@/components/icons/LogOut';
import { Tooltip } from "@nextui-org/tooltip";
import Report from '@/components/icons/Report';
import React from 'react';

export default function SignOutButton({ pathName = '/0auth' }) {
  const handleSignOut = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('pathName', pathName);

    await SignOut(formData);
  };
  
  return (
    <div
    className="flex justify-center items-center h-auto gap-6">

       <Tooltip content="Sair" closeDelay={300} className='p-1.5 bg-[#2B2B2B]/70 backdrop-blur-xl rounded-md text-white text-sm'>
        <form onSubmit={handleSignOut} className='group'>
        <button
          className='w-16 h-16 rounded-full dark:bg-[#0E0E0E] bg-[#F1F1F1] dark:border-[#ffffff]/10 border-black/10 backdrop-blur flex justify-center items-center hover:bg-red-500 dark:hover:bg-red-600 transition-colors duration-200 border'
          aria-label='Sair' 
          type="submit" 
        >
          <Logout className='hover:text-white dark:hover:text-black'/>
        </button>
        </form>
       </Tooltip>


      <Tooltip content="Reportar Bug" closeDelay={300} className='p-1.5 bg-[#2B2B2B]/70 backdrop-blur-xl rounded-md text-white text-sm'>
        <button
          className='w-16 h-16 rounded-full dark:bg-[#0E0E0E] bg-[#F1F1F1] dark:border-[#ffffff]/10 border-black/10 backdrop-blur flex justify-center items-center dark:hover:bg-yellow-600 hover:bg-yellow-400 transition-colors duration-200 border' 
          aria-label='Reportar Bug'
        >
          <Report className='hover:text-white dark:hover:text-black' />
        </button>
      </Tooltip>
    </div>
  );
};


