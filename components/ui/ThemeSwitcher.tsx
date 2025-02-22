"use client"; // Mark as client component

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import MoonIcon from '../icons/MoonIcon';
import SunIcon from '../icons/SunIcon';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button onClick={toggleTheme} className="p-4">
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};

export default ThemeSwitcher;