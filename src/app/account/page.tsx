import EmailForm from '@/components/ui/account/EmailForm';
import NameForm from '@/components/ui/account/NameForm';
import CustomerPortalForm from '@/components/ui/account/CustomerPortalForm';
import Header from '@/components/ui/header/Header';
import { createClient } from '@/utils/supabase/server';
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
    .maybeSingle();

  if (error) {
    console.log(error);
  }

  if (!user) {
    return redirect('/login');
  }

  return (
    <main>
    <Header />
    <section className='space-y-16 h-auto'>
      <div className="max-w-5xl pt-32 px-4 mx-auto">
        <div className="sm:align-center sm:flex sm:flex-col">
          <h1 className="text-5xl font-extrabold text-white text-center ">
            Account
          </h1>
          <p className="max-w-xl m-auto mt-2 text-lg text-[#CDCDCD] sm:text-center">
            We partnered with Stripe for a simplified billing.
          </p>
        </div>
      </div>
        <CustomerPortalForm subscription={subscription} />
        <NameForm userName={userDetails?.full_name ?? ''} />
        <EmailForm userEmail={user.email} />
    </section>
    </main>
  );
}