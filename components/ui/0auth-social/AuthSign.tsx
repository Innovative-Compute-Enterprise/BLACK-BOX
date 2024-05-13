'use client'
import { signInWithOAuth } from '@/utils/auth-helpers/client'; // Assuming correct import path
import { useState } from 'react';
import GitHub from '@/components/icons/Github';
import Google from '@/components/icons/Google'; 

type OAuthProvider = {
  name: string;
  displayName: string;
  icon: JSX.Element;
};

export default function AuthSign() {
  const oAuthProviders: OAuthProvider[] = [
    {
      name: 'google',
      displayName: 'Google',
      icon: <Google className="h-7 w-7" /> 
    },
    {
      name: 'github',
      displayName: 'GitHub',
      icon: <GitHub className="h-7 w-7" /> 
    }
    // Add other providers as needed 
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    await signInWithOAuth(e);
    setIsSubmitting(false);
  };
  return (
    <div>
      {oAuthProviders.map((provider) => (
        <form key={provider.name} onSubmit={(e) => handleSubmit(e)}>
        <input type="hidden" name="provider" value={provider.name} />
          <button className=' w-full justify-center flex gap-2 border hover:bg-white px-4 py-3 my-4 rounded-[10px] transition-colors duration-200 hover:text-black text-base' type="submit">
            {provider.icon}
            Sign up in with {provider.displayName}
          </button> 
        </form>
      ))}
    </div>
  );
}