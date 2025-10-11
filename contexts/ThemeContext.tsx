import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { colorTokenList } from '../constants';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: { [key: string]: string };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [resolvedColors, setResolvedColors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(storedTheme || (prefersDark ? 'dark' : 'light'));
  }, []);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const rootStyle = getComputedStyle(document.documentElement);
    const newColors: { [key: string]: string } = {};
    for (const token of colorTokenList) {
        newColors[token] = rootStyle.getPropertyValue(token).trim();
    }
    setResolvedColors(newColors);

  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value = useMemo(() => ({ theme, toggleTheme, colors: resolvedColors }), [theme, resolvedColors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};