import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Header from '@/components/ui/header/Header';

export default async function Chat() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();


  return (
    <main>
    <Header />
    <section className='flex justify-center items-center min-h-screen'>
    <div className='w-full'>
      {user ? (
        <div className='flex flex-col items-center text-center space-y-2'>
          <h1 className='text-3xl font-bold'>Chat</h1>
        </div>
      ) : (
        redirect('/0auth')
      )}
    </div>
    </section>
  </main>
  );
}