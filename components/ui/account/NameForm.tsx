'use client';

import Button from '@/components/ui/Button';
import { updateName } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NameForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // Check if the new name is the same as the old name
    if (e.currentTarget.fullName.value === userName) {
      e.preventDefault();
      setIsSubmitting(false);
      return;
    }
    handleRequest(e, updateName, router);
    setIsSubmitting(false);
  };

  return (
    <form id="nameForm" onSubmit={handleSubmit} className="flex flex-col items-center mt-8">
      <div className="w-full max-w-lg px-4 space-y-4">
        <div className="flex justify-between items-center">
        <h1 className='text-xl font-bold'>Update Name</h1>
        </div>
        <input
          id="fullName"
          type="text"
          name="fullName"
          className="form-input w-full p-3 rounded-md bg-zinc-800 text-white" // Ensure form-input is styled appropriately
          defaultValue={userName}
          placeholder="Your name"
          maxLength={24}
          disabled={isSubmitting}
        />  
        <label htmlFor="fullName" className="text-sm">
            24 characters maximum
        </label>
        <Button
            variant="slim"
            type="submit"
            loading={isSubmitting}
            className="w-full"
          >
            Update Name
          </Button>
        <p className="text-sm text-center mt-1">We will email you to verify the change.</p>
      </div>
    </form>
  );
}