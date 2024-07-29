'use client';

import Button from '@/components/ui/Button';
import { updateEmail } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EmailForm({
  userEmail
}: {
  userEmail: string | undefined;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // Check if the new email is the same as the old email
    if (e.currentTarget.newEmail.value === userEmail) {
      e.preventDefault();
      setIsSubmitting(false);
      return;
    }
    handleRequest(e, updateEmail, router);
    setIsSubmitting(false);
  };

  return (
    <form id="emailForm" onSubmit={handleSubmit} className="flex flex-col items-center mt-8">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex justify-between items-center">
        <h1 className='text-xl font-bold'>Update E-mail</h1>
        </div>
        <input
          type="text"
          name="newEmail"
          className="form-input w-full p-4 focus-visible:outline-none rounded-[15px] dark:bg-[#161616] bg-[#E9E9E9] placeholder:text-[#A0A0A0] dark:text-white text-black dark:placeholder:text-[#5F5F5F]"
          placeholder={userEmail ?? ''}
          maxLength={64}
          disabled={isSubmitting} // Disable the input during submission
        />
        
         <Button
            variant="slim"
            type="submit"
            loading={isSubmitting}
            className="w-full" // Align button to the right
          >
            Update Email
          </Button>
      </div>
    </form>
  );
}


