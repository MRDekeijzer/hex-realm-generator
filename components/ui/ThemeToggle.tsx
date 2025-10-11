import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Icon } from '../Icon';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors bg-[var(--color-surface-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <Icon name={theme === 'light' ? 'sun' : 'moon'} className="w-4 h-4" />
        </button>
    );
};
