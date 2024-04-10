'use client';

import { SignOut } from '@/utils/auth-helpers/server';
import Button from '../Button/Button';


export default function SignOutButton({ pathName = '/' }) {
  const handleSignOut = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Create a new FormData object
    const formData = new FormData();
    formData.append('pathName', pathName);

    await SignOut(formData);
  };

  return (
    <form className='sm:max-w-md' onSubmit={handleSignOut}>
      <Button 
       variant='slim'
        type="submit" 
      >
        Sign Out
      </Button>
    </form>
  );
}