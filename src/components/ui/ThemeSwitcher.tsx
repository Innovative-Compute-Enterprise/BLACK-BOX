'use client'; 

import React, { useState, useEffect } from 'react';
import SunIcon from '@/src/components/icons/SunIcon';
import MoonIcon from '@/src/components/icons/MoonIcon';

const ThemeSwitcher: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  // Initialize theme state - assume 'light' as default for SSR/initial render
  // This initial state MUST match what the server renders by default
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Effect runs only on client after mount
  useEffect(() => {
    // Mark as mounted
    setMounted(true);

    // Determine the actual theme preference on the client
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialClientTheme = storedTheme || (prefersDark ? 'dark' : 'light');

    // Update state and apply class
    setTheme(initialClientTheme);
    document.documentElement.classList.toggle('dark', initialClientTheme === 'dark');

  }, []); // Empty dependency array ensures this runs only once on mount

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Render a consistent button structure, but conditionally render the icon based on mount status and theme
  const renderIcon = () => {
    // Before mount (SSR & initial client render): Render the icon for the DEFAULT theme ('light').
    // This assumes the button is meant to switch TO dark mode initially.
    // Use a class that the server would consistently render.
    if (!mounted) {
      // Render the Moon icon, styled appropriately for a button in light mode.
      // Adjust 'text-gray-700' if your light mode button needs a different icon color.
      return <SunIcon className="h-8 w-8 text-yellow-400 fill-current" />;
    }

    // After mount: Render based on the *current* client-side theme state
    if (theme === 'dark') {
      // In dark mode, show Sun icon to switch to light
      // The yellow color often works well in dark mode.
      return <MoonIcon className="h-8 w-8 text-white fill-current" />;
    } else {
      // In light mode, show Moon icon to switch to dark
      // Use the appropriate color for the Moon icon on your button in light mode.
      // The error mentioned 'text-white', maybe your light mode button is dark? Adjust as needed.
      // Let's use a common dark color for the icon on a light background.
      return <SunIcon className="h-8 w-8 text-yellow-400 fill-current" />;
    }
  };

  return (
    // Add a background/padding/border if you want the button itself to be visually distinct
    // Example: className="block p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
    <button
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        className="block py-3" // Keep existing class or adjust as needed for button base style
    >
      {renderIcon()}
    </button>
  );
};

export default ThemeSwitcher;