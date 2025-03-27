// app/page.tsx
import React from 'react';
import { createClient } from '@/src/utils/supabase/server';
import Header from '@/src/components/ui/header/Header';
import { redirect } from 'next/navigation';
import Dashboard from '@/src/components/ui/dashboard/Dashboard';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw redirect('/0auth'); 
  }

  // Fetch subscription info
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, prices(*)')
    .eq('user_id', user.id)
    .single();

  // Get user details
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const userName = userData?.full_name || 'User';
  const subStatus = subscription ? subscription.status : 'none';

  return (
    <main className="antialiased">
      <Header />
      <section className="flex flex-col justify-start items-center min-h-screen px-4 pt-[10%]">
        <Dashboard 
          userName={userName}
          subscriptionStatus={subStatus}
        />
      </section>
    </main>
  );
}