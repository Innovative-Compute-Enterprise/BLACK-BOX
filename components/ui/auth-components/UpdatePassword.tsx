'use client';
'use strict';


import Button from '@/components/ui/Button';
import { updatePassword } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import EyeClosed from '@/components/icons/EyeClosed';
import EyeOpen from '@/components/icons/EyeOpen';

interface UpdatePasswordProps {
  redirectMethod: string;
}

export default function UpdatePassword({
  redirectMethod
}: UpdatePasswordProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    if (redirectMethod === 'client') {
      await handleRequest(e, updatePassword, router);
    } else { 
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
      <div className="grid gap-3">

      <div className='text-center mt-20'>
            <h1 className='text-3xl font-bold'>Crie sua nova senha</h1>
          </div>

        <div className="grid gap-1 relative">

          <div className='my-4'>
          <input
            id="password"
            placeholder="Nova Senha"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            className="w-full p-4 rounded-[15px] bg-[#161616] text-white placeholder:text-[#5F5F5F] focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
          >
            {showPassword ? <EyeClosed /> : <EyeOpen />}
          </button>
          </div>
        </div>
        <div className="relative mb-4">
          <input
            id="passwordConfirm"
            placeholder="Confirmar Senha"
            type={showPassword ? 'text' : 'password'}
            name="passwordConfirm"
            autoComplete="new-password"
            className="w-full p-4 rounded-[15px] bg-[#161616] text-white placeholder:text-[#5F5F5F] focus:outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
          >
            {showPassword ? <EyeClosed /> : <EyeOpen />}
          </button>
        </div>
      </div>
      <Button
        variant="slim"
        type="submit"
        className="mt-1"
        loading={isSubmitting}
      >
        Update Password
      </Button>
    </form>
    </div>
  );
}