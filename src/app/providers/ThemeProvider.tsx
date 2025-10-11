import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { colorTokenList } from '@/features/realm/config/constants';

interface ThemeContextType {
  colors: { [key: string]: string };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [resolvedColors, setResolvedColors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');

    const rootStyle = getComputedStyle(document.documentElement);
    const newColors: { [key: string]: string } = {};
    for (const token of colorTokenList) {
      newColors[token] = rootStyle.getPropertyValue(token).trim();
    }
    setResolvedColors(newColors);
  }, []);

  const value = useMemo(() => ({ colors: resolvedColors }), [resolvedColors]);

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
