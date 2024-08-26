'use client';

import { createClient } from '@/utils/supabase/client';
import { type Provider } from '@supabase/supabase-js';
import { getURL } from '@/utils/helpers';
import { redirectToPath } from './server';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getStatusRedirect, getErrorRedirect } from '@/utils/helpers'; // Adjust the import path as needed


export async function handleRequest(
  e: React.FormEvent<HTMLFormElement>,
  requestFunc: (formData: FormData) => Promise<string | null>,
  router: AppRouterInstance | null = null
): Promise<boolean | void | string> {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);
  
  try {
    const result = await requestFunc(formData);
    
    if (result === null) {
      return;
    }
    
    if (router) {
      return router.push(result);
    } else {
      // Otherwise, redirect server-side
      return await redirectToPath(result);
    }
  } catch (error) {
    console.error('Error in handleRequest:', error);
    // Return the error message so the component can handle it
    return error instanceof Error ? error.message : 'An unknown error occurred';
  }
}

export async function handleRequestWithoutRedirect(
  e: React.FormEvent<HTMLFormElement>,
  requestFunc: (formData: FormData) => Promise<string>,
  options: {
    successMessage?: string,
    errorMessage?: string,
    onSuccess?: (result: string) => void,
    onError?: (error: string) => void
  } = {}
): Promise<string | void> {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);
  
  try {
    const result = await requestFunc(formData);
    if (result === null) {
      return;
    }
    
    const currentPath = window.location.pathname;

    const toastPath = getStatusRedirect(currentPath, 'Success', options.successMessage);
    window.history.pushState({}, '', toastPath);
    
    if (options.onSuccess) options.onSuccess(options.successMessage || 'Operation successful');

    return result;
  } catch (error) {

    const errorMessage = error instanceof Error ? error.message : error;

    const currentPath = window.location.pathname;
    
    const toastPath = getErrorRedirect(currentPath, 'Error', errorMessage);
    window.history.pushState({}, '', toastPath);

    if (options.onError) options.onError(errorMessage);

    return errorMessage;
  }
}


export async function signInWithOAuth(e: React.FormEvent<HTMLFormElement>) {
  // Prevent default form submission refresh
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const provider = String(formData.get('provider')).trim() as Provider;

  // Create client-side supabase client and call signInWithOAuth
  const supabase = createClient();
  const redirectURL = getURL('/auth/callback');
  await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirectURL
    }
  });
}