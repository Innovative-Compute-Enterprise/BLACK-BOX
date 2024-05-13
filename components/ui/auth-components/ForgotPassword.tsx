'use client';

import Button from '@/components/ui/Button';
import Link from 'next/link';
import { requestPasswordUpdate } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ForgotPasswordProps {
  redirectMethod: string;
  disableButton?: boolean;
}

export default function ForgotPassword({
  redirectMethod,
  disableButton
}: ForgotPasswordProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    try {
      if (redirectMethod === 'client') {
        await handleRequest(e, requestPasswordUpdate, router);
      }
      // Other conditions for handling different redirect methods could go here
    } catch (error) {
      console.error(error);
      // Handle any errors here, such as displaying an error message to the user
    } finally {
      setIsSubmitting(false); // Re-enable the button after the request is handled
    }
  };

  return (
    <div className="my-8">
      <form
        noValidate={true}
        className="mb-4"
        onSubmit={(e) => handleSubmit(e)}
      >
        <div className="grid gap-3">

        <div className='text-center mt-20'>
            <h1 className='text-3xl font-bold'>Link de recuperaçao via email</h1>
          </div>

          <div className="grid gap-1">

            <div className='my-4'>
            <input
              id="email"
              placeholder={"Email da sua conta"}
              type="email"
              name="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              className="w-full p-4 rounded-[15px] bg-[#161616] text-white placeholder:text-[#5F5F5F] focus:outline-none"
            />
            </div>

          </div>
          <Button
            variant="slim"
            type="submit"
            className="mt-1"
            loading={isSubmitting}
            disabled={disableButton || isSubmitting} // Ensure both are booleans
            >
            Send Email
          </Button>
        </div>
      </form>
      <p className='text-center font-base'>
        Tem uma conta ?{' '}
        <Link href="/0auth/password_signin" className="font-light my-1 text-blue-600">
          Login 
        </Link>
      </p>
      <p className='text-center font-base'>
      Não tem uma conta?{' '}
        <Link href="/0auth/signup" className="font-light my-1 text-blue-600">
           Sign up
        </Link>
      </p>
    </div>
  );
}