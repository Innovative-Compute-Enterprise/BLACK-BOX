import React from 'react';
import Link from 'next/link';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import { Roboto } from '@/styles/fonts/font';

const navigation = [
  { name: 'Chat', href: '/' },
  { name: 'Account', href: '/account' }
];

const NavLinks = () => {
  return (
    <nav className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2 mt-6 bg-transparent">
      <div>
        <h2 className="text-[15px] dark:text-white text-black my-1 opacity-50">Main</h2>
        {navigation.map((item, index) => {
          if (index === 0) { // Only show the Home link in the first column
            return (
              <Link key={item.name} href={item.href}>
                <span className={`${Roboto.className} py-1 dark:text-white text-black hover:underline text-[15px] mb-2`}>
                  {item.name}
                </span>
              </Link>
            );
          }
          return null;
        })}
        {/* More links for column 2 */}
      </div>
      <div>
        <h2 className="text-[15px] dark:text-white text-black my-1 opacity-50">Settings</h2>
        {navigation.map((item, index) => {
          if (index === 1) { // Only show the Account link in the third column
            return (
              <Link key={item.name} href={item.href}>
                <span className={`${Roboto.className} py-1 dark:text-white text-black hover:underline text-[15px] mb-2`}>
                  {item.name}
                </span>
              </Link>
            );
          }
          return null;
        })}
        {/* More links for column 3 */}
      </div>
      <ThemeSwitcher />
    </nav>
  );
};

export default NavLinks;
