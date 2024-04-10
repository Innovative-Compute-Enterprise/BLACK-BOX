import { redirect } from 'next/navigation'
import React from 'react'
import { createClient } from '../../utils/supabase/server'
import  SignOut  from '../../components/ui/auth-components/SignOut';

export default async function PrivatePage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();


  return (
    <div> 
      {user ? (
        <div className='space-y-2'>
          <h1>Private Page</h1>
          <p>Welcome {user.email}</p>
          <SignOut pathName="/" />
        </div>
      ) : (
        redirect('/login')
      )}
    </div>
  );
}