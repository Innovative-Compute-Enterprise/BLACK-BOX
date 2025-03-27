'use client';
import type { Tables } from '@/types_db';
import { getStripe } from '@/src/utils/stripe/client';
import { checkoutWithStripe } from '@/src/utils/stripe/server';
import { createStripePortal } from '@/src/utils/stripe/server';
import { getErrorRedirect } from '@/src/utils/helpers';
import { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { MonaSans } from '@/src/styles/fonts/font';
import PricingCard from './PricingCard';

type Subscription = Tables<'subscriptions'>;
type Product = Tables<'products'>;
type Price = Tables<'prices'>;
interface ProductWithPrices extends Product {
  prices: Price[];
}
interface PriceWithProduct extends Price {
  products: Product | null;
}
interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null;
}

interface Props {
  user: User | null | undefined;
  products: ProductWithPrices[];
  subscription: SubscriptionWithProduct | null;
}

type BillingInterval = 'lifetime' | 'year' | 'month';

export default function Pricing({ user, products, subscription }: Props) {
  const intervals = Array.from(
    new Set(
      products.flatMap((product) =>
        product?.prices?.map((price) => price?.interval)
      )
    )
  );
  const router = useRouter();
  const [loadingPriceIds, setLoadingPriceIds] = useState<string[]>([]);
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('month');
  const currentPath = usePathname();

  const handleStripeCheckout = async (price: Price) => {
    setLoadingPriceIds(prev => [...prev, price.id]);

    if (!user) {
      setLoadingPriceIds(prev => prev.filter(id => id !== price.id));
      return router.push('/0auth/signup');
    }

    const { errorRedirect, sessionId } = await checkoutWithStripe(
      price,
      currentPath
    );

    if (errorRedirect) {
      setLoadingPriceIds(prev => prev.filter(id => id !== price.id));
      return router.push(errorRedirect);
    }

    if (!sessionId) {
      setLoadingPriceIds(prev => prev.filter(id => id !== price.id));
      return router.push(
        getErrorRedirect(
          currentPath,
          'An unknown error occurred.',
          'Please try again later or contact a system administrator.'
        )
      );
    }

    const stripe = await getStripe();
    
    if (stripe) {
      setLoadingPriceIds(prev => prev.filter(id => id !== price.id));
      
      const checkoutWindow = window.open('about:blank', '_blank');
      
      stripe.redirectToCheckout({ sessionId }).then(result => {
        if (result.error && checkoutWindow) {
          checkoutWindow.location.href = errorRedirect || '/';
        }
      });
    }
  };

  const handleManageSubscription = async (productId: string) => {
    setLoadingPriceIds(prev => [...prev, productId]);
    
    const redirectUrl = await createStripePortal(currentPath);
    
    setLoadingPriceIds(prev => prev.filter(id => id !== productId));
    
    window.open(redirectUrl, '_blank');
  };

  if (!products.length) {
    return (
      <section className="bg-black">
        <div className="max-w-3xl py-8 mx-auto sm:py-24">
          <div className="sm:flex sm:flex-col sm:align-center"></div>
          <p className="text-4xl font-extrabold text-white sm:text-center sm:text-5xl">
            No subscription pricing plans found
          </p>
        </div>
      </section>
    );
  } else {
    return (
      <section>
        <div className="max-w-3xl mx-auto mb-28">
          <div className="sm:flex sm:flex-col sm:align-center justify-center 
                place-content-center mt-8">
            <h1 className={`${MonaSans.className} text-3xl sm:text-3xl md:text-4xl font-[900] uppercase text-black dark:text-white sm:text-center`} style={{ fontStretch: '125%' }}>
              Conta e Planos
            </h1>
            <p className="max-w-xl m-auto my-6 text-sm sm:text-base text-black dark:text-white 
                opacity-60 sm:text-center font-normal tracking-wider text-balance">
              Desbloquei planos premium para obter acesso a recursos exclusivos, pagamento seguro através do Stripe.
            </p>
            <div className="relative self-center dark:bg-black bg-white rounded-[12px] 
                  p-0.5 flex border border-black/20 dark:border-white/20 max-w-xs">
              {intervals.includes('month') && (
                <button
                  onClick={() => setBillingInterval('month')}
                  type="button"
                  className={`${
                    billingInterval === 'month'
                      ? 'w-1/2 dark:bg-[#2B2B2B] bg-[#D4D4D4] text-black dark:text-white'
                      : ' w-1/2 text-zinc-500'
                  } rounded-md m-1 py-2 whitespace-nowrap sm:w-auto sm:px-8 dark:hover:bg-zinc-800 hover:bg-zinc-200 transition-all text-sm font-medium`}
                >
                  Mensal
                </button>
              )}
              {intervals.includes('year') && (
                <button
                  onClick={() => setBillingInterval('year')}
                  type="button"
                  className={`${
                    billingInterval === 'year'
                      ? 'w-1/2 dark:bg-[#2B2B2B] bg-[#D4D4D4] text-black dark:text-white'
                      : 'w-1/2 text-zinc-500'
                  } rounded-md m-1 py-2 whitespace-nowrap sm:w-auto sm:px-8 dark:hover:bg-zinc-800 hover:bg-zinc-200 transition-all text-sm font-medium`}
                >
                  Anual
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center place-items-center mt-10"> 
             {products.map((product) => {
              const price = product.prices.find((p) => p.interval === billingInterval);
              const priceString = price
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: price.currency!,
                    minimumFractionDigits: 0,
                  }).format((price.unit_amount || 0) / 100)
                : 'Contact us for pricing';
              return (
                
                <PricingCard
                  key={product.id}
                  product={product}
                  price={price}
                  priceString={priceString}
                  billingInterval={billingInterval}
                  isSubmitting={price ? loadingPriceIds.includes(price.id) : false}
                  subscription={subscription}
                  handleStripeCheckout={handleStripeCheckout}
                  handleManageSubscription={() => price && handleManageSubscription(price.id)}
                />

              );
            })}
          </div>
        </div>
      </section>
    );
  }
}
