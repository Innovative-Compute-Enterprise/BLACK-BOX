'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Listbox, ListboxOption, ListboxButton, ListboxOptions } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from "@/hooks/use-mobile"
import clsx from 'clsx';

interface ModelSelectorProps {
  model: string;
  setModel: (model: string) => void;
  isModelLocked: boolean;
}

const models = [
  // { id: 'gpt-4o-mini', name: 'GPT-4o', description: 'Exepcional para tarefas diarias.' },
  { id: 'gemini', name: 'Gemini 2.0', description: 'Feito para tarefas gigantes.' },
  // { id: 'claude-sonnet-3.5', name: 'Sonnet-3.5', description: 'Exelente para tarefas dificeis' },
];

const ModelSelector: React.FC<ModelSelectorProps> = ({ model, setModel, isModelLocked }) => {
   const router = useRouter();
   const isMobile = useIsMobile();


  // // Update the URL whenever the model changes
  // useEffect(() => {
  //   if (model) {
  //     const url = new URL(window.location.href);
  //     url.searchParams.set("model", model);
  //     router.replace(url.toString());
  //   }
  // }, [model, router]);
  
  const [selectedModel, setSelectedModel] = useState(model);

  useEffect(() => {
    setSelectedModel(model);
  }, [model]);

  const handleModelChange = (selectedModelId: string) => {
    if (!isModelLocked) {
      setSelectedModel(selectedModelId);
      setModel(selectedModelId);
    }
  };

  const selectedModelInfo = models.find((m) => m.id === selectedModel);

  return (
    <div className="relative inline-block text-center w-full max-w-fit z-20 ml-1.5">
      <Listbox
        value={selectedModel}
        onChange={handleModelChange} 
        disabled={isModelLocked}
        as="div"
        className="relative text-sm"
      >
        {({ open }) => (
          <>
            <ListboxButton
              className={clsx(
                'relative w-full rounded-md py-1 px-1.5',
                'text-gray-700 dark:text-gray-200 dark:bg-[#0E0E0E] bg-[#F1F1F1] dark:border-[#ffffff]/30 border-black/30 border focus:outline-none focus:ring-1',
                isModelLocked ? 'bg-gray-100 dark:bg-zinc-900 cursor-not-allowed' : 'cursor-pointer',
                'flex justify-between items-center'
              )}
            >
              <span className="block px-1 font-extrabold text-sm">{selectedModelInfo?.name}</span>
            </ListboxButton>

            <ListboxOptions
              className={clsx(
                'absolute mt-2 space-y-2 focus:outline-none w-[300px] rounded-xl text-left p-3 dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 dark:border-[#ffffff]/10 border-black/10 border backdrop-blur-lg',
                'max-h-120 overflow-auto focus:outline-none',
                isMobile ? 'left-1/2 -translate-x-1/2' : 'left-0'
              )}
            >
              <div>
                <div className="text-xs pl-2.5 mt-1 mb-3 font-semibold text-gray-500 dark:text-gray-400">Mais modelos em breve.</div>
              </div>
              {models.map((modelOption) => (
                <ListboxOption
                  key={modelOption.id}
                  value={modelOption.id}
                  className={({ focus }) =>
                    clsx(
                      'select-none relative py-3 pl-3 pr-3 rounded-lg hover:dark:bg-[#2B2B2B] hover:bg-[#D4D4D4] cursor-pointer',
                      focus ? '' : 'text-black dark:text-white'
                    )
                  }
                >
                  {({ selected, focus }) => (
                    <div className=''>
                      <span className={clsx('block truncate text-sm font-semibold', selected ? 'underline' : '')}>
                        {modelOption.name}
                      </span>
                      <span
                        className={clsx(
                          'block text-xs text-gray-500 dark:text-gray-400 mt-1',
                          focus ? '' : ''
                        )}
                      >
                        {modelOption.description}
                      </span>
                    </div>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </>
        )}
      </Listbox>
    </div>
  );
};

export default ModelSelector;
