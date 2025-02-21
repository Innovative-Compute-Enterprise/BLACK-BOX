"use client";

import { createContext, useContext, useState } from 'react';

// Define and export the Theme type
export type Theme = 'light' | 'dark' | 'system';

// Define the context shape
interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// ThemeProvider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};