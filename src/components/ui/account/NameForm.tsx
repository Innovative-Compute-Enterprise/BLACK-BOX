'use client';

import Button from '@/src/components/ui/Button';
import { updateName } from '@/src/utils/auth-helpers/server';
import { handleRequestWithoutRedirect } from '@/src/utils/auth-helpers/client';
import { useState, useEffect } from 'react';

export default function NameForm({ userName }: { userName: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState(userName);

  useEffect(() => {
    if (userName) {
      setFullName(userName);
    }
  }, [userName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
  
    if (fullName.trim() === userName) {
      setIsSubmitting(false);
      return handleRequestWithoutRedirect(
        e,
        async () => {
          throw new Error('O nome é igual ao atual');
        }
      );
    }
    
    const formData = new FormData(e.currentTarget);
    formData.set('fullName', fullName.trim());
    

    await handleRequestWithoutRedirect(
      e,
      () => updateName(formData),
      {
        successMessage: 'Nome atualizado com sucesso',
        errorMessage: 'Erro ao atualizar o nome',
      }
    );
  
    setIsSubmitting(false);
  };

  return (
    <form id="nameForm" onSubmit={handleSubmit} className="flex flex-col items-center mt-8">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex justify-between items-center">
          <h1 className='text-xl font-bold'>{userName ? 'Mudar Nome' : 'Definir Nome'}</h1>
        </div>
        <input
          id="fullName"
          type="text"
          name="fullName"
          className=" autofill:bg-transparent form-input focus-visible:outline-none w-full p-4 rounded-[15px] dark:bg-[#161616] bg-[#E9E9E9] placeholder:text-[#A0A0A0] dark:text-white text-black dark:placeholder:text-[#5F5F5F]"
          placeholder={fullName ?? ''}
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