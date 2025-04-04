// app/account/page.tsx
import EmailForm from '@/src/components/ui/account/EmailForm';
import NameForm from '@/src/components/ui/account/NameForm';
import SignOut from '@/src/components/ui/auth-components/SignOut';
import CustomerPortalForm from '@/src/components/ui/account/CustomerPortalForm';
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
      <section className="flex flex-col justify-start items-center min-h-screen px-4 pt-20">
        <div className="w-full max-w-2xl space-y-6 mb-16">
        <div className="fixed top-4 left-4 z-10">
        <a 
          href="/" 
          className="flex items-center justify-center p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label="Return to home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
        </a>
      </div>
          
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