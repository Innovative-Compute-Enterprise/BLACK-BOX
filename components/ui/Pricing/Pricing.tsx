'use client';
import Button from '@/components/ui/Button';
import type { Tables } from '@/types_db';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { createStripePortal } from '@/utils/stripe/server';
import { getErrorRedirect } from '@/utils/helpers';
import { User } from '@supabase/supabase-js';
import cn from 'classnames';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('month');
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const currentPath = usePathname();

  const handleStripeCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);

    if (!user) {
      setPriceIdLoading(undefined);
      return router.push('/0auth/signup');
    }

    const { errorRedirect, sessionId } = await checkoutWithStripe(
      price,
      currentPath
    );

    if (errorRedirect) {
      setPriceIdLoading(undefined);
      return router.push(errorRedirect);
    }

    if (!sessionId) {
      setPriceIdLoading(undefined);
      return router.push(
        getErrorRedirect(
          currentPath,
          'An unknown error occurred.',
          'Please try again later or contact a system administrator.'
        )
      );
    }

    const stripe = await getStripe();
    stripe?.redirectToCheckout({ sessionId });

    setPriceIdLoading(undefined);
  };


  
  const handleManageSubscription = async () => {
    setIsSubmitting(true);
    const redirectUrl = await createStripePortal(currentPath);
    setIsSubmitting(false);
    return router.push(redirectUrl);
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
      <section className="bg-black">
        <div className="max-w-3xl px-4 py-6 mx-auto sm:pt-20 sm:pb-8 sm:px-6 lg:px-8">
          <div className="sm:flex sm:flex-col sm:align-center mt-12 md:mt-0">
            <h1 className="text-5xl font-bold text-white sm:text-center">
              Conta e Planos
            </h1>
            
            <p className="max-w-2xl m-auto mt-5 text-lg text-zinc-200 sm:text-center font-normal">
              Desbloquei planos premium para obter acesso a recursos exclusivos, pagamento seguro através do Stripe.
            </p>

            <div className="relative self-center mt-6 bg-zinc-900 rounded-lg p-0.5 flex sm:mt-8 border border-zinc-800">
              {intervals.includes('month') && (
                <button
                  onClick={() => setBillingInterval('month')}
                  type="button"
                  className={`${
                    billingInterval === 'month'
                      ? 'relative w-1/2 bg-zinc-700 border-zinc-800 shadow-sm text-white'
                      : 'ml-0.5 relative w-1/2 border border-transparent text-zinc-400'
                  } rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
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
                      ? 'relative w-1/2 bg-zinc-700 border-zinc-800 shadow-sm text-white'
                      : 'ml-0.5 relative w-1/2 border border-transparent text-zinc-400'
                  } rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
                >
                  Anual
                </button>
              )}
            </div>
          </div>


          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 flex flex-wrap justify-center gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
            {products.map((product) => {
              const price = product.prices.find((p) => p.interval === billingInterval);

              // Format the price if found, else set a default message
              const priceString = price
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: price.currency!,
                    minimumFractionDigits: 0
                  }).format((price.unit_amount || 0) / 100)
                : 'Contact us for pricing';

              return (
                <div
                key={product.id}
                className={cn(
                  'flex flex-col rounded-[15px] shadow-sm divide-y divide-zinc-600 bg-zinc-900',
                  {
                    'border border-blue-500': subscription
                      ? product.name === subscription?.prices?.products?.name
                      : product.name === 'Freelancer'
                  },
                  'flex-1', // This makes the flex item grow to fill the space
                  'basis-1/3', // Assuming you want each card to take up roughly a third of the container's width
                  'max-w-xs' // Sets a maximum width to the cards to prevent them from getting too large
                )}
              >
                  <div className="p-6">
                    <h2 className="text-2xl font-semibold leading-6 text-white">
                      {product.name}
                    </h2>
                    <p className="mt-4 text-zinc-300">{product.description}</p>
                    <p className="mt-8">
                      <span className="text-5xl font-extrabold white">
                        {price ? priceString : 'N/A'}
                      </span>
                      {price && (
                        <span className="text-base font-medium text-zinc-100">
                          /{billingInterval}
                        </span>
                      )}
                    </p>
                    <Button
                      variant="slim"
                      type="button"
                      loading={priceIdLoading === price?.id}
                      onClick={() => {
                        if (price) {
                          if (subscription && product.name === subscription?.prices?.products?.name) {
                            handleManageSubscription();
                          } else {
                            handleStripeCheckout(price); // Only call if price is defined
                          }
                        } else {
                          console.error("No price found for this billing interval");
                          // Optionally handle this case visually in UI
                        }
                      }}
                      className="block w-full py-2 mt-8 text-sm font-semibold text-center text-white rounded-md hover:bg-zinc-900"
                      disabled={!price}
                    >
                      {subscription ? (product.name === subscription?.prices?.products?.name ? 'Manage' : 'Update Plan') : 'Subscribe'}
                    </Button>

                    {!price && (
                      <p className="text-sm text-zinc-500 mt-2">
                        Please contact us for details on this plan.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }
}
