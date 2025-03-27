'use client';
'use strict';


import  EyeClosed from '@/src/components/icons/EyeClosed';
import  EyeOpen from '@/src/components/icons/EyeOpen';
import AuthSign from '@/src/components/ui/0auth-social/AuthSign';
import Button from '@/src/components/ui/Button';
import React, { useState } from 'react';
import Link from 'next/link';
import { signUp } from '@/src/utils/auth-helpers/server';
import { handleRequest } from '@/src/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import BlackBox from '@/src/components/icons/BlackBox';
import { MonaSans } from '@/src/styles/fonts/font';

interface SignUpProps {
  redirectMethod: string;
}

export default function SignUp({ redirectMethod }: SignUpProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true); // Disable the button while the request is being handled

    // Check if passwords match
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    if (redirectMethod === 'client') {
      await handleRequest(e, signUp, router);
    }
    setIsSubmitting(false);
  };

  return (
    <div className='my-10'>
      <form
        noValidate={true}
        className="mb-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-3">

          <div className='flex justify-center mb-3'>
            <BlackBox className="w-10 h-10 md:w-12 md:h-12" />
          </div>

          <div className='text-center'>
            <h1 className={`${MonaSans.className} text-3xl font-[900] uppercase`} style={{fontStretch: '125%'}}>Crie sua conta</h1>
          </div>

          <div className="grid gap-1">
            
          <div className='my-4'>
            <input
              id="email"
              placeholder="Email"
              type="email"
              name="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              className="w-full p-4 rounded-[15px] bg-[#161616] text-white placeholder:text-[#5F5F5F] focus:outline-none"
            />
            </div>

            <div className="relative mb-4">
              <input
                id="password"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                className="w-full p-4 rounded-[15px] bg-[#161616] text-white placeholder:text-[#5F5F5F] focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm">
                  {showPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
            </div>

            <div className="relative mb-4">
              <input
                id="confirm-password"
                placeholder="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="current-password"
                className="w-full p-4 rounded-[15px] bg-[#161616] text-white placeholder:text-[#5F5F5F] focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm">
                  {showPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
            </div>

            
          </div>
          <Button
            variant="slim"
            type="submit"
            className="my-4"
            loading={isSubmitting}
          >
            Sign up
          </Button>
        </div>
      </form>
      <p className='text-center font-base mt-3 mb-6'>
        Already have an account? {' '}
        <Link href="/0auth/password_signin" className="font-light text-blue-600">
          Log in
        </Link>
      </p>
      <div className="inline-flex items-center justify-center w-full">
        <hr className="w-[320px] h-px my-8 bg-gray-200 border-0 rounded-full"></hr>
        <span className="absolute px-3 font-medium text-white -translate-x-1/2 bg-white dark:bg-black left-1/2">OU</span>
      </div>      
      <div className='space-y-2 mt-3'>
        <AuthSign />
      </div>
    </div>
  );
}
