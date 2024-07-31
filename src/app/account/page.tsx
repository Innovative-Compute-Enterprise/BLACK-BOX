import EmailForm from '@/components/ui/Account/EmailForm';
import NameForm from '@/components/ui/Account/NameForm';
import SignOut from '@/components/ui/Auth-components/SignOut';
import CustomerPortalForm from '@/components/ui/Account/CustomerPortalForm';
import Header from '@/components/ui/Header/Header';
import Pricing from '@/components/ui/Pricing/Pricing';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import {
  getUserDetails,
  getSubscription,
  getUser,
  getProducts
} from '@/utils/supabase/queries';

export default async function Account() {
  const supabase = createClient();

  /// TO BE REMOVED 2/3
  debugger

 /// fetch that concurrently from supabase queries
  const [user, userDetails, subscription, products] = await Promise.all([
    getUser(supabase),
    getUserDetails(supabase),
    getSubscription(supabase),
    getProducts(supabase)
  ]);

  // Log fetched data to identify issues
  console.log('User:', user);
  console.log('UserDetails:', userDetails);
  console.log('Subscription:', subscription);
  console.log('Products:', products);

  if (!user) {
    return redirect('/0auth');
  }

  return (
    <main className="antialiased">
      <Header />
      <section className="h-auto">
        <div className="max-w-[1440px] px-4 mx-auto mb-24 space-y-24">
          <Pricing
            user={user}
            products={products ?? []}
            subscription={subscription}
          />
          <CustomerPortalForm subscription={subscription} />
          <EmailForm userEmail={user?.email ?? ''} />
          <NameForm userName={userDetails?.full_name ?? ''} />
          <SignOut />
        </div>
      </section>
    </main>
  );
}