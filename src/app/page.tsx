import { redirect } from 'next/navigation'
import React from 'react'
import { createClient } from '../../utils/supabase/server'
import Header from '@/components/ui/header/Header';
import Pricing from '@/components/ui/Pricing/Pricing';
export default async function PrivatePage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  if (error) {
    console.log(error);
  }

  const { data: products } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });


  return (
    
    <main>
      <Header />
      <section className='flex justify-center items-center min-h-screen'>
      <div className='max-w-[1440px] w-full'>
        {user ? (
          <div className='flex flex-col items-center text-center space-y-2'>
            <h1 className='text-3xl font-bold'>Home</h1>
            <p className='text-xl'>Hello {user.user_metadata.full_name}</p>
            <Pricing
            user={user}
            products={products ?? []}
            subscription={subscription}
          />          
          </div>
        ) : (
          redirect('/login')
        )}
      </div>
      </section>
    </main>
  );
}