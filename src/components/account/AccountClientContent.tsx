'use client';

import React from 'react';
import { User } from '@supabase/supabase-js';
import { Tables } from '@/types_db'; // Import base types
import { SubscriptionWithProduct, ProductWithPrices, PriceWithProduct } from '@/src/types/types'; // Import combined types from correct path

// Import the components that need client-side logic
import Pricing from '@/src/components/ui/Pricing/Pricing';
import CustomerPortalForm from '@/src/components/ui/account/CustomerPortalForm';
import EmailForm from '@/src/components/ui/account/EmailForm';
import NameForm from '@/src/components/ui/account/NameForm';
import SignOut from '@/src/components/ui/auth-components/SignOut';

// Define local types based on search results
type Product = Tables<'products'>;
type Price = Tables<'prices'>;
type Subscription = Tables<'subscriptions'>;
type UserDetails = Tables<'users'>;

// Define the specific type needed by CustomerPortalForm locally
type SubscriptionWithPriceAndProduct = Subscription & {
  prices: (Price & { products: Product | null; }) | null;
};

interface AccountClientContentProps {
  user: User | null; 
  userDetails: UserDetails | null;
  // Use the correct combined types expected by child components
  subscription: SubscriptionWithProduct | SubscriptionWithPriceAndProduct | null;
  products: ProductWithPrices[];
}

const AccountClientContent: React.FC<AccountClientContentProps> = ({
  user,
  userDetails,
  subscription,
  products
}) => {
  // This component can now use hooks like useState, useEffect, etc.
  
  // We need to cast the subscription type for CustomerPortalForm if it's not null
  const customerPortalSubscription = subscription as SubscriptionWithPriceAndProduct | null;
  // Pricing expects SubscriptionWithProduct
  const pricingSubscription = subscription as SubscriptionWithProduct | null;

  return (
    <>
      {/* Pricing section */}
      <Pricing
        user={user}
        products={products ?? []} // Pricing expects ProductWithPrices[]
        subscription={pricingSubscription} // Pass the correctly cast type
      />
      
      <div className="space-y-20">
        {/* Pass the correctly cast type */}
        <CustomerPortalForm subscription={customerPortalSubscription} />
        <EmailForm userEmail={user?.email ?? ''} />
        <NameForm userName={userDetails?.full_name ?? ''} />
        <div className="pt-2">
          <SignOut />
        </div>
      </div>
    </>
  );
};

export default AccountClientContent; 