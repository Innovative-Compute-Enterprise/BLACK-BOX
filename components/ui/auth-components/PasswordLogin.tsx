'use client';

import Button from '../Button/Button';
import Link from 'next/link';
import { signInWithPassword } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import AuthSign from '../0auth-social/AuthSign';

// Define prop type with allowEmail boolean
interface PasswordSignInProps {
  allowEmail: boolean;
  redirectMethod: string;
}

export default function PasswordSignIn({
  redirectMethod
}: PasswordSignInProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true); 
    if (redirectMethod === 'client') {
      await handleRequest(e, signInWithPassword, router);
    } else { // Disable the button while the request is being handled
    setIsSubmitting(false);
  };
}

  return (
    <div className="my-8">
      <form
        noValidate={true}
        className="mb-4"
        onSubmit={(e) => handleSubmit(e)}
      >
        <div className="grid gap-2">
          <div className="grid gap-1">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              placeholder={"name@example.com"}
              type="email"
              name="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              className="w-full p-3 rounded-md bg-zinc-800"
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              placeholder={"Password"}
              type="password"
              name="password"
              autoComplete="current-password"
              className="w-full p-3 rounded-md bg-zinc-800"
            />
          </div>
          <Button
            variant="slim"
            type="submit"
            className="mt-1"
            loading={isSubmitting}
          >
            Sign in
          </Button>
        </div>
      </form>
      <AuthSign />
      <p>
        <Link href="/login/forgot_password" className="font-light text-sm">
          Forgot your password?
        </Link>
      </p>
      <p>
        <Link href="/login/signup" className="font-light text-sm">
          Don&apos;t have an account? Sign up
        </Link>
      </p>
    </div>
  );
}