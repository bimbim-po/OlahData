'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ScrollableTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  className?: string;
}

export function ScrollableTabs({
  tabs,
  activeTab,
  onSelectTab,
  className,
}: ScrollableTabsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  // Auto-scroll active tab into view smoothly
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector<HTMLButtonElement>(`[data-tab-id="${activeTab}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    const timer = setTimeout(checkScroll, 120);
    return () => clearTimeout(timer);
  }, [activeTab, checkScroll]);

  const handleScrollBy = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = tabs[nextIndex];
      onSelectTab(nextTab.id);
      const nextBtn = scrollRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${nextTab.id}"]`);
      nextBtn?.focus();
    }
  };

  return (
    <div className={cn('relative w-full min-w-0 select-none', className)}>
      {/* Left Fade Gradient & Arrow */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-1">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-card via-card/80 to-transparent pointer-events-none rounded-l-[12px]" />
          <button
            type="button"
            onClick={() => handleScrollBy(-200)}
            className="relative z-30 h-8 w-8 rounded-full bg-card/95 shadow-md border border-border flex items-center justify-center text-foreground hover:bg-muted cursor-pointer transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Geser tab ke kiri"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Scrollable Container with scroll-snap and hidden scrollbar */}
      <div
        ref={scrollRef}
        role="tablist"
        aria-label="Daftar Uji Statistik Bab 4"
        className="w-full flex items-center gap-1.5 p-1.5 bg-card border border-border rounded-[14px] overflow-x-auto scroll-smooth [scroll-snap-type:x_proximity] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              data-tab-id={tab.id}
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[40px] text-[13px] sm:text-sm font-semibold rounded-[10px] shrink-0 whitespace-nowrap cursor-pointer transition-all [scroll-snap-align:center] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full shrink-0 transition-colors',
                  isActive ? 'bg-primary-foreground' : 'bg-emerald-500'
                )}
                aria-hidden="true"
              />
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="shrink-0 whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Fade Gradient & Arrow */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-end pr-1">
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-card via-card/80 to-transparent pointer-events-none rounded-r-[12px]" />
          <button
            type="button"
            onClick={() => handleScrollBy(200)}
            className="relative z-30 h-8 w-8 rounded-full bg-card/95 shadow-md border border-border flex items-center justify-center text-foreground hover:bg-muted cursor-pointer transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Geser tab ke kanan"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
