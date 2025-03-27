// app/account/page.tsx
import EmailForm from '@/src/components/ui/account/EmailForm';
import NameForm from '@/src/components/ui/account/NameForm';
import SignOut from '@/src/components/ui/auth-components/SignOut';
import CustomerPortalForm from '@/src/components/ui/account/CustomerPortalForm';
import Header from '@/src/components/ui/header/Header';
import Pricing from '@/src/components/ui/Pricing/Pricing';
import { redirect } from 'next/navigation';
import { createClient } from '@/src/utils/supabase/server';
import {
  getUserDetails,
  getSubscription,
  getUser,
  getProducts
} from '@/src/utils/supabase/queries';

export default async function Account() {
  const supabase = await createClient();

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
      <section className="flex flex-col justify-start items-center min-h-screen px-4 pt-20">
        <div className="w-full max-w-2xl space-y-6 mb-16">
          
          {/* Pricing section */}
          <Pricing
            user={user}
            products={products ?? []}
            subscription={subscription}
          />
          
            <div className="space-y-20">
              <CustomerPortalForm subscription={subscription} />
              <EmailForm userEmail={user?.email ?? ''} />
              <NameForm userName={userDetails?.full_name ?? ''} />
              <div className="pt-2">
                <SignOut />
              </div>
            </div>
          </div>
      </section>
    </main>
  );
}