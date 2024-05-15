'use client';

import Button from '@/components/ui/Button';
import { updateName } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function NameForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState(userName);

  useEffect(() => {
    if (userName) {
      setFullName(userName);
    }
  }, [userName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (fullName.trim() === userName) {
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set('fullName', fullName.trim());

    await handleRequest(e, () => updateName(formData), router);
    setIsSubmitting(false);
  };

  return (
    <form id="nameForm" onSubmit={handleSubmit} className="flex flex-col items-center mt-8">
      <div className="w-full max-w-lg px-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className='text-xl font-bold'>{userName ? 'Mudar Nome' : 'Definir Nome'}</h1>
        </div>
        <input
          id="fullName"
          type="text"
          name="fullName"
          className="form-input w-full p-4 rounded-[15px] bg-[#161616] text-white placeholder:text-[#5F5F5F]"
          defaultValue={fullName ?? ''}
          placeholder="Seu Nome"
          maxLength={24}
          disabled={isSubmitting}
          onChange={(e) => setFullName(e.target.value)}
        />
        <label htmlFor="fullName" className="text-sm text-[#5F5F5F]">
          24 caracteres máx
        </label>
        <Button
          variant="slim"
          type="submit"
          loading={isSubmitting}
          className="w-full rounded-[20px]"
        >
          Atualizar Nome
        </Button>
      </div>
    </form>
  );
}
