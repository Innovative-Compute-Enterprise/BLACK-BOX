// src/context/ThemeContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

enum Theme {
    light = 'light',
    dark = 'dark'
}

interface ThemeContextProps {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') as Theme;
            if (savedTheme) {
                return savedTheme;
            }
            const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return prefersDarkScheme ? Theme.dark : Theme.light;
        }
        return Theme.light;
    });

    useEffect(() => {
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            const newTheme = e.matches ? Theme.dark : Theme.light;
            setTheme(newTheme);
            document.documentElement.classList.remove(Theme.light, Theme.dark);
            document.documentElement.classList.add(newTheme);
        };

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', handleSystemThemeChange);

        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, []);

    useEffect(() => {
        document.documentElement.classList.remove(Theme.light, Theme.dark);
        document.documentElement.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === Theme.light ? Theme.dark : Theme.light;
        setTheme(newTheme);
        document.documentElement.classList.remove(theme);
        document.documentElement.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextProps => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};