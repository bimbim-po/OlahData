import * as React from 'react';
import { cn } from '@/lib/utils';
import { FileQuestion } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) {
      return <FileQuestion className="h-10 w-10 text-muted-foreground stroke-1" />;
    }

    if (React.isValidElement(icon)) {
      return icon;
    }

    if (typeof icon === 'function' || typeof icon === 'object') {
      const IconComp = icon as React.ComponentType<{ className?: string }>;
      return <IconComp className="h-10 w-10 text-muted-foreground stroke-1" />;
    }

    return null;
  };

  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-card/50 p-8 text-center transition-colors',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground mb-4">
        {renderIcon()}
      </div>
      <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex items-center gap-3">{action}</div>}
    </div>
  );
}
