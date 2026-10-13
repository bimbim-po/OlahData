'use client';

import * as React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { COPY } from '@/lib/copy';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@/lib/api/types';

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export function ThemeToggle({ className, showLabels = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: 'light', label: COPY.settings.themeOptions.light, icon: Sun },
    { mode: 'dark', label: COPY.settings.themeOptions.dark, icon: Moon },
    { mode: 'system', label: COPY.settings.themeOptions.system, icon: Laptop },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={COPY.settings.theme}
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-secondary/50 p-1 text-muted-foreground',
        className
      )}
    >
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(mode)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] touch-manipulation',
              isActive
                ? 'bg-background text-foreground shadow-xs'
                : 'hover:text-foreground hover:bg-background/40'
            )}
          >
            <Icon className="h-4 w-4" />
            {showLabels && <span className="ml-1 text-xs">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
