'use client'
import { signInWithOAuth } from '../../../../../utils/auth-helpers/client'; // Assuming correct import path
import { useState } from 'react';
import GitHub from '../../icons/Github';

type OAuthProvider = {
  name: string;
  displayName: string;
  icon: JSX.Element;
};

export default function AuthSign() {
  const oAuthProviders: OAuthProvider[] = [
    {
      name: 'github',
      displayName: 'GitHub',
      icon: <GitHub className="h-5 w-5" /> // Assuming you have the Github icon
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
          <button className=' w-full justify-center flex gap-2 border hover:bg-gray-500 px-4 py-2 my-4 rounded-md' type="submit">
            {provider.icon}
            Sign in with {provider.displayName}
          </button> 
        </form>
      ))}
    </div>
  );
}