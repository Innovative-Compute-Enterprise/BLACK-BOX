"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export enum Theme {
    light = 'light',
    dark = 'dark',
    system = 'system',
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeContextProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') as Theme;
            if (savedTheme && savedTheme !== Theme.system) {
                return savedTheme;
            }
            const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return prefersDarkScheme ? Theme.dark : Theme.light;
        }
        return Theme.light;
    });

    useEffect(() => {
        const applyTheme = (currentTheme: Theme) => {
            if (currentTheme === Theme.system) {
                const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.remove(Theme.light, Theme.dark);
                document.documentElement.classList.add(prefersDarkScheme ? Theme.dark : Theme.light);
            } else {
                document.documentElement.classList.remove(Theme.light, Theme.dark);
                document.documentElement.classList.add(currentTheme);
            }
        };

        applyTheme(theme);

        if (theme !== Theme.system) {
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            if (theme === Theme.system) {
                setTheme(e.matches ? Theme.dark : Theme.light);
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === Theme.light ? Theme.dark : Theme.light;
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
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