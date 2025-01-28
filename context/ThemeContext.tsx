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
}

const isTheme = (value: string | null): value is Theme => {
    return value !== null && Object.values(Theme).includes(value as Theme);
};

const applyThemeClasses = (theme: Theme) => {
    document.documentElement.classList.remove(Theme.light, Theme.dark);
    if (theme !== Theme.system) {
        document.documentElement.classList.add(theme);
    }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (isTheme(savedTheme)) {
                return savedTheme;
            }
            const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDarkScheme) return Theme.dark;
        }
        return Theme.light;
    });

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        if (newTheme === Theme.system) {
            localStorage.removeItem('theme');
        } else {
            localStorage.setItem('theme', newTheme);
        }
    }

    useEffect(() => {
        applyThemeClasses(theme);
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            if (theme === Theme.system) {
                const newTheme = e.matches ? Theme.dark : Theme.light;
                applyThemeClasses(newTheme);
            }
        };

        if (theme === Theme.system) {
            const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const newTheme = prefersDarkScheme ? Theme.dark : Theme.light;
            applyThemeClasses(newTheme);
        }

        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
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