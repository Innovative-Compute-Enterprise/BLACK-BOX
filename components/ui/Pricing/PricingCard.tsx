import React from 'react';
import cn from 'classnames';
import Button from '@/components/ui/Button';
import PlanSVG from '@/components/icons/PlanSVG';
import type { Tables } from '@/types_db';

type Product = Tables<'products'>;
type Price = Tables<'prices'>;
interface ProductWithPrices extends Product {
  prices: Price[];
}
interface PriceWithProduct extends Price {
  products: Product | null;
}
interface SubscriptionWithProduct {
  prices: PriceWithProduct | null;
}

interface PricingCardProps {
  product: ProductWithPrices;
  price: Price | undefined;
  priceString: string;
  billingInterval: string;
  priceIdLoading: string | undefined;
  subscription: SubscriptionWithProduct | null;
  handleStripeCheckout: (price: Price) => void;
  handleManageSubscription: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
  product,
  price,
  priceString,
  billingInterval,
  priceIdLoading,
  subscription,
  handleStripeCheckout,
  handleManageSubscription,
}) => {
  return (
    <div
      key={product.id}
      className='flex flex-col divide-y rounded-[20px] shadow-sm
       dark:bg-[#0E0E0E] bg-[#F1F1F1] border dark:border-white/20 border-black/20 backdrop-blur
        flex-1 p-2 m-2 w-full max-w-xs h-full' 
    >
      <div className="p-6 flex-grow">

        <div className={cn(
          'flex flex-row size-fit gap-4 mb-6 dark:bg-[#2B2B2B] bg-[#D4D4D4] dark:border-white/5 border-black/5 border p-3 rounded-full',
          { 'border-white': subscription 
            ? product.name === subscription?.prices?.products?.name
            : product.name === 'Freelancer',
          }
          )} >

          <h2 className="text-2xl font-semibold leading-6 dark:text-white text-black">
            {product.name}
          </h2>

          <PlanSVG planName={product.name} />
        </div>

        <p className="my-3 dark:text-zinc-300 text-zinc-900 text-sm tracking-wider flex-grow">{product.description}</p>

        <p className="my-9 transition-all duration-500 ease-in-out">
          <span className="text-5xl font-extrabold dark:text-white text-black transition-all duration-500 ease-in-out">
            {price ? priceString : 'N/A'}
          </span>
        </p>
        <Button
          type="button"
          loading={priceIdLoading === price?.id}
          onClick={() => {
            if (price) {
              if (subscription && product.name === subscription?.prices?.products?.name) {
                handleManageSubscription();
              } else {
                handleStripeCheckout(price);
              }
            } else {
              console.error("No price found for this billing interval");
            }
          }}
          className="w-full"
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
};

export default PricingCard;