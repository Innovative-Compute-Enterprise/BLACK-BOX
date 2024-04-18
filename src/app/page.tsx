import { redirect } from 'next/navigation'
import React from 'react'
import { createClient } from '../../utils/supabase/server'
import  SignOut  from '../../components/ui/auth-components/SignOut';
import Header from '@/components/ui/header/Header';

export default async function PrivatePage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();


  return (
    
    <main>
      <Header />
      <section className='flex justify-center items-center min-h-screen'>
      <div className='max-w-[1440px] w-full'>
        {user ? (
          <div className='flex flex-col items-center text-center space-y-2'>
            <h1 className='text-3xl font-bold'>Private Page</h1>
            <p className='text-xl'>Welcome {user.email}</p>
            <SignOut pathName="/" />
          </div>
        ) : (
          redirect('/login')
        )}
      </div>
      </section>
    </main>
  );
}