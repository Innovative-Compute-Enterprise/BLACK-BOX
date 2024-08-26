'use client';

import Button from '@/components/ui/Button';
import Wallet from '@/components/icons/Wallet';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { createStripePortal } from '@/utils/stripe/server';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Tables } from '@/types_db';
import { time } from 'console';

type Subscription = Tables<'subscriptions'>;
type Price = Tables<'prices'>;
type Product = Tables<'products'>;

type SubscriptionWithPriceAndProduct = Subscription & {
  prices:
    | (Price & {
        products: Product | null;
      })
    | null;
};

interface Props {
  subscription: SubscriptionWithPriceAndProduct | null;
}

export default function CustomerPortalForm({ subscription }: Props) {
  const router = useRouter();
  const currentPath = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subscriptionPrice =
    subscription &&
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription?.prices?.currency!,
      minimumFractionDigits: 0
    }).format((subscription?.prices?.unit_amount || 0) / 100);

  const handleStripePortalRequest = async () => {
    setIsSubmitting(true);
    const redirectUrl = await createStripePortal(currentPath);
    setIsSubmitting(false);
    return router.push(redirectUrl);
  };

  return (
    <Card
      title="Seu Plano"
      description={
        subscription
          ? ` ${subscription?.prices?.products?.name} `
          : 'Free tier'
      }
      footer={
      <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <p className="pb-4 sm:pb-0 text-base dark:text-[#CDCDCD] text-[#323232]">
          Gerencia sua assinatura com Stripe
        </p>
        <Button
          variant="slim"
          className="group relative inline-flex items-center px-2 py-1"
          onClick={handleStripePortalRequest}
          loading={isSubmitting}
        >
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2">
            <Wallet className="group-hover:text-green-500 w-6 h-5" />
          </span>
          <span className="pl-6">Assinatura</span>
        </Button>
      </div>
      }
    >
      <div className="mt-2 mb-5 text-3xl font-bold text-zinc-400">
        {subscription ? (
          `${subscriptionPrice}/${subscription?.prices?.interval}`
        ) : (
          <Link href="/">Choose your plan</Link>
        )}
      </div>
    </Card>
  );
}