import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[6px] border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-[#FDEEED] text-[#8E231C] dark:bg-[#381A18] dark:text-[#FFA8A3]',
        outline: 'text-foreground border-border bg-card',
        success:
          'border-transparent bg-[#BFEBD9] text-[#0E4331] dark:bg-[#1D4738] dark:text-[#A8F0D0]',
        mint:
          'border-transparent bg-[#BFEBD9] text-[#0E4331] dark:bg-[#1D4738] dark:text-[#A8F0D0]',
        warning:
          'border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
        coral:
          'border-transparent bg-[#FDEEED] text-[#8E231C] dark:bg-[#381A18] dark:text-[#FFA8A3]',
        highlighter:
          'border-transparent bg-[#FFE14D] text-[#243044] font-semibold',
        pine:
          'border-transparent bg-[#BFEBD9] text-[#0E4331] dark:bg-[#1D4738] dark:text-[#A8F0D0]',
        amber:
          'border-transparent bg-[#FFE14D] text-[#243044] font-medium',
        engine:
          'border-border bg-muted/60 text-muted-foreground',
        ai:
          'border-border bg-muted/60 text-muted-foreground',
        brand:
          'border-transparent bg-[#004AAD] text-white dark:bg-[#5D7CFF] dark:text-white font-semibold',
        cyan:
          'border-transparent bg-[#38B6FF]/15 text-[#004AAD] dark:bg-[#38B6FF]/20 dark:text-[#38B6FF] font-semibold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
