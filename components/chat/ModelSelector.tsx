import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

const ModelSelector = ({ model, setModel }) => (
  <div className="relative inline-block text-left">
    <Menu>
      <MenuButton className="inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500 transition-colors">
        Models
        <ChevronDown className="w-4 h-4 ml-2" aria-hidden="true" />
      </MenuButton>
      <MenuItems anchor="top" className="absolute left-0 mt-2 w-56 origin-top-left rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
        <MenuItem>
          {({ active }) => (
            <a 
              className={`${active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'} block px-4 py-2 text-sm`}
              href="/settings"
            >
              GPT-4o
            </a>
          )}
        </MenuItem>
        <MenuItem>
          {({ active }) => (
            <a 
              className={`${active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'} block px-4 py-2 text-sm`}
              href="/support"
            >
              Gemini 1.5 pro
            </a>
          )}
        </MenuItem>
        <MenuItem>
          {({ active }) => (
            <a 
              className={`${active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'} block px-4 py-2 text-sm`}
              href="/license"
            >
              Sonnet 3.5
            </a>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  </div>
);

export default ModelSelector;