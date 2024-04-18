import React from 'react';
import Link from 'next/link';
import { Roboto } from "../../../src/app/fonts/font";

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'V.0.1', href: '/chat' },
  { name: 'Account', href: '/account' }
];

const NavLinks = () => {
  return (
    <nav className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2 mt-6">
      <div>
        <h2 className="text-[15px] text-white my-1">Main</h2>
        {navigation.map((item, index) => {
          if (index === 0) { // Only show the Home link in the first column
            return (
              <Link key={item.name} href={item.href} passHref>
                <span className={`${Roboto.className} py-1 text-white hover:underline text-[15px] mb-2`}>
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
        <h2 className="text-[15px] text-white my-1">Chat</h2>
        {navigation.map((item, index) => {
          if (index === 1) { // Only show the Chat link in the second column
            return (
              <Link key={item.name} href={item.href} passHref>
                <span className={`${Roboto.className} py-1 text-white hover:underline text-[15px] mb-2`}>
                  {item.name} 
                </span>
              </Link>
            );
          }
          return null;
        })}
      </div>
      <div>
        <h2 className="text-[15px] text-white my-1">Settings</h2>
        {navigation.map((item, index) => {
          if (index === 2) { // Only show the Account link in the third column
            return (
              <Link key={item.name} href={item.href} passHref>
                <span className={`${Roboto.className} py-1 text-white hover:underline text-[15px] mb-2`}>
                  {item.name}
                </span>
              </Link>
            );
          }
          return null;
        })}
        {/* More links for column 3 */}
      </div>
    </nav>
  );
};

export default NavLinks;
