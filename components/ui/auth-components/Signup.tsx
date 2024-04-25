'use client';

import Button from '@/components/ui/Button';
import React from 'react';
import Link from 'next/link';
import { signUp } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SignUpProps {
  redirectMethod: string;
}

export default function SignUp({ redirectMethod }: SignUpProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    if (redirectMethod === 'client') {
      await handleRequest(e, signUp, router);
    } else {    
    setIsSubmitting(false);
  };
};

  return (
    <div className="my-8">
      <form
        noValidate={true}
        className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground mb-4"
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
            className="mt-2"
            loading={isSubmitting}
          >
            Sign up
          </Button>
        </div>
      </form>
      <p>Already have an account?</p>
      <p>
        <Link href="/login" className="font-light text-sm">
          Sign in with email and password
        </Link>
      </p>
    </div>
  );
}