import EmailForm from '@/components/ui/account/EmailForm';
import NameForm from '@/components/ui/account/NameForm';
import SignOut from '@/components/ui/auth-components/SignOut';
import CustomerPortalForm from '@/components/ui/account/CustomerPortalForm';
import Header from '@/components/ui/header/Header';
import Pricing from '@/components/ui/pricing/Pricing';
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

  const [user, userDetails, subscription, products] = await Promise.all([
    getUser(supabase),
    getUserDetails(supabase),
    getSubscription(supabase),
    getProducts(supabase)
  ]);

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