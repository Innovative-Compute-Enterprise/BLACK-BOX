'use client';

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

       <Tooltip content="Sair" className='px-2 bg-[#161616] rounded-md text-white text-sm'>
        <form onSubmit={handleSignOut}>
        <button
          className='w-16 h-16 rounded-full bg-[#0E0E0E] border-[#ffffff]/10 backdrop-blur flex justify-center items-center hover:bg-red-600 transition-colors duration-200 border'
          aria-label='Sair' 
          type="submit" 
        >
          <Logout />
        </button>
        </form>
       </Tooltip>


      <Tooltip content="Reportar Bug" className='px-2 bg-[#161616] rounded-md text-white text-sm'>
        <button
          className='w-16 h-16 rounded-full bg-[#0E0E0E] border-[#ffffff]/10 backdrop-blur flex justify-center items-center hover:bg-yellow-500 transition-colors duration-200 border' 
          aria-label='Reportar Bug'
        >
          <Report />
        </button>
      </Tooltip>
    </div>
  );
};


