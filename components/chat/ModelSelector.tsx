// components/ModelSelector.tsx

import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { Model } from '@/types/chat';

// Define the props interface for the ModelSelector component
interface ModelSelectorProps {
  model: string;
  setModel: (model: string) => void;
}

const models: Model[] = [
  { id: 'gpt4', name: 'GPT-4' },
  { id: 'gemini', name: 'Gemini 1.5 Pro' },
  { id: 'claude', name: 'Claude 3 Sonnet' }
];

const ModelSelector: React.FC<ModelSelectorProps> = ({ model, setModel }) => {
  return (
    <Menu>
      <MenuButton className="inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500 transition-colors">
        {model ? models.find((m) => m.id === model)?.name : 'Select Model'}
        <ChevronDown className="w-4 h-4 ml-2" aria-hidden="true" />
      </MenuButton>
      <MenuItems className="absolute left-0 mt-2 w-56 origin-top-left rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
        {models.map((m) => (
          <MenuItem key={m.id}>
            {({ active }) => (
              <button
                onClick={() => setModel(m.id)}
                className={`${
                  active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'
                } block w-full text-left px-4 py-2 text-sm`}
              >
                {m.name}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
};

export default ModelSelector;
