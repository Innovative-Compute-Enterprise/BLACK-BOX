import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

export const getUser = cache(async (supabase: SupabaseClient) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
});

export const getSubscription = cache(async (supabase: SupabaseClient) => {
  const { data: subscription, error } = await supabase
  .from('subscriptions')
  .select('*, prices(*, products(*))')
  .in('status', ['trialing', 'active'])
  .order('current_period_end', { ascending: false })
  .limit(1)
  .single();

  return subscription;
});

export const getProducts = cache(async (supabase: SupabaseClient) => {
  const { data: products } = await supabase
  .from('products')
  .select('*, prices(*)')
  .eq('active', true)
  .eq('prices.active', true)
  .order('metadata->index')
  .order('unit_amount', { referencedTable: 'prices' });

  return products;
});

export const getUserDetails = cache(async (supabase: SupabaseClient) => {
  const { data: userDetails } = await supabase
  .from('users')
  .select('*')
  .single();

  return userDetails;
});