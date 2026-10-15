import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      className={`relative inline-flex h-8 w-[60px] shrink-0 items-center rounded-full border border-line-strong bg-elevated p-1 transition-colors hover:border-accent/50 ${className}`}
    >
      <Sun className={`absolute left-2 h-3.5 w-3.5 transition-opacity ${isDark ? 'opacity-40 text-subtle' : 'opacity-0'}`} />
      <Moon className={`absolute right-2 h-3.5 w-3.5 transition-opacity ${isDark ? 'opacity-0' : 'opacity-40 text-subtle'}`} />
      <span
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow-md ring-1 ring-line-strong transition-transform duration-300 ease-out ${
          isDark ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-accent" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
};
