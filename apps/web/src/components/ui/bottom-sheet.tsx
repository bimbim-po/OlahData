'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomSheet = DialogPrimitive.Root;
const BottomSheetTrigger = DialogPrimitive.Trigger;
const BottomSheetClose = DialogPrimitive.Close;
const BottomSheetPortal = DialogPrimitive.Portal;

const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
BottomSheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface BottomSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showHandle?: boolean;
}

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  BottomSheetContentProps
>(({ className, children, showHandle = true, ...props }, ref) => (
  <BottomSheetPortal>
    <BottomSheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Mobile: Bottom Sheet sliding up from bottom
        'fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[90vh] bg-card border-t border-border rounded-t-[20px] p-5 shadow-2xl transition-transform duration-300 ease-out focus:outline-none overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]',
        // Desktop / Tablet: Centered Modal Dialog
        'md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:rounded-[16px] md:border md:border-border md:p-6 md:pb-6',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom md:data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-from-bottom md:data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    >
      {/* Mobile Draggable Handle */}
      {showHandle && (
        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-3 shrink-0 md:hidden" aria-hidden="true" />
      )}

      {children}

      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-md p-1 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer touch-manipulation"
        aria-label="Tutup"
      >
        <X className="h-5 w-5" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </BottomSheetPortal>
));
BottomSheetContent.displayName = DialogPrimitive.Content.displayName;

const BottomSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-left mb-4', className)}
    {...props}
  />
);
BottomSheetHeader.displayName = 'BottomSheetHeader';

const BottomSheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-4 pt-3 border-t border-border',
      className
    )}
    {...props}
  />
);
BottomSheetFooter.displayName = 'BottomSheetFooter';

const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-bold tracking-tight text-foreground pr-8', className)}
    {...props}
  />
));
BottomSheetTitle.displayName = DialogPrimitive.Title.displayName;

const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground leading-relaxed', className)}
    {...props}
  />
));
BottomSheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  BottomSheet,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
};
