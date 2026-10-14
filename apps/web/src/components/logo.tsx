'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Komponen Ikon Logo OlahData: Matriks 10 lingkaran bertingkat (histogram data riset)
 * Gradasi 4 kolom: Cyan (#38B6FF) -> Vibrant Blue (#5170FF) -> Royal Blue (#004AAD) -> Ultramarine (#1800AD)
 */
export function LogoIcon({ size = 32, className, ...props }: LogoIconProps) {
  return (
    <svg
      viewBox="100 100 824 824"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none transition-transform duration-200', className)}
      aria-hidden="true"
      {...props}
    >
      {/* Kolom 1 (1 Lingkaran) - Cyan (#38B6FF) */}
      <circle cx="205" cy="826" r="94" fill="#38B6FF" />

      {/* Kolom 2 (2 Lingkaran) - Vibrant Blue (#5170FF) */}
      <circle cx="409" cy="622" r="94" fill="#5170FF" />
      <circle cx="409" cy="826" r="94" fill="#5170FF" />

      {/* Kolom 3 (3 Lingkaran) - Royal Blue (#004AAD) */}
      <circle cx="614" cy="418" r="94" fill="#004AAD" />
      <circle cx="614" cy="622" r="94" fill="#004AAD" />
      <circle cx="614" cy="826" r="94" fill="#004AAD" />

      {/* Kolom 4 (4 Lingkaran) - Ultramarine / Deep Indigo (#1800AD) */}
      <circle cx="818" cy="214" r="94" fill="#1800AD" />
      <circle cx="818" cy="418" r="94" fill="#1800AD" />
      <circle cx="818" cy="622" r="94" fill="#1800AD" />
      <circle cx="818" cy="826" r="94" fill="#1800AD" />
    </svg>
  );
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export function Logo({
  size = 'md',
  showText = true,
  className,
  textClassName,
}: LogoProps) {
  const sizeMap = {
    sm: { icon: 24, text: 'text-base', gap: 'gap-2' },
    md: { icon: 32, text: 'text-lg', gap: 'gap-2.5' },
    lg: { icon: 40, text: 'text-xl', gap: 'gap-3' },
    xl: { icon: 52, text: 'text-2xl', gap: 'gap-3.5' },
  };

  const config = sizeMap[size];

  return (
    <div className={cn('inline-flex items-center font-sans tracking-tight', config.gap, className)}>
      <LogoIcon size={config.icon} />
      {showText && (
        <span
          className={cn(
            'font-bold tracking-tight text-foreground transition-colors group-hover:text-primary',
            config.text,
            textClassName
          )}
        >
          {APP_NAME}
        </span>
      )}
    </div>
  );
}
