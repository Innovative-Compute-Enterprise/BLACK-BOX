import React from 'react';
import Link from 'next/link';
import { Roboto } from "../../../src/app/fonts/font";

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Chat', href: '/chat' },
];

const NavigationMenu = () => {
  return (
    <nav className="w-full my-2"> {/* Adjust width as needed, w-full for full width */}
      {navigation.map((item) => (
        <Link className={`${Roboto.className} block w-full text-left pl-4 p-2 text-white hover:bg-gray-300/20 backdrop-blur-[8px] transition-colors duration-200 font-bold`} href={item.href} key={item.name} passHref>
            {item.name}
        </Link>
      ))}
    </nav>
  );
}

export default NavigationMenu;
