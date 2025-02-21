"use client";

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import MoonIcon from '../icons/MoonIcon';
import SunIcon from '../icons/SunIcon';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button onClick={handleThemeChange} className="p-4">
      {theme === 'dark' ? <SunIcon aria-label="Switch to light theme" /> : <MoonIcon aria-label="Switch to dark theme" />}
    </button>
  );
};

export default ThemeSwitcher;