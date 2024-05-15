import EmailForm from '@/components/ui/account/EmailForm';
import NameForm from '@/components/ui/account/NameForm';
import SignOut from '@/components/ui/auth-components/SignOut';
import CustomerPortalForm from '@/components/ui/account/CustomerPortalForm';
import Header from '@/components/ui/header/Header';
import { createClient } from '@/utils/supabase/server';
import Pricing from '@/components/ui/Pricing/Pricing';
import { redirect } from 'next/navigation';

export default async function Account() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: userDetails } = await supabase
    .from('users')
    .select('*')
    .single();


  const { data: subscription, error } = await supabase
  .from('subscriptions')
  .select('*, prices(*, products(*))')
  .in('status', ['trialing', 'active'])
  .order('current_period_end', { ascending: false })
  .limit(1)
  .single();

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


  if (!user) {
    return redirect('/0auth');
  }

  return (
    <main>
    <Header />
    <section className='h-auto'>
     <div className="max-w-3xl pt-16 px-4 mx-auto mb-20 space-y-28">
      <Pricing
            user={user}
            products={products ?? []}
            subscription={subscription}
          />    
        <CustomerPortalForm subscription={subscription} />
        <EmailForm userEmail={user.email} />
        <NameForm userName={userDetails?.full_name ?? ''} />
        <SignOut />
     </div>
    </section>
    </main>
  );
}