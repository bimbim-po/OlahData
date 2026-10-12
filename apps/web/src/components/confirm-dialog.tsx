'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { COPY } from '@/lib/copy';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  matchText?: string;
  requireMatchText?: string;
  matchPlaceholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isDestructive?: boolean;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  matchText,
  requireMatchText,
  matchPlaceholder,
  confirmLabel = COPY.common.confirm,
  cancelLabel = COPY.common.cancel,
  onConfirm,
  isDestructive,
  variant = 'destructive',
  isLoading = false,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = React.useState('');
  
  const targetMatch = requireMatchText || matchText;
  const isDestructiveComputed = isDestructive !== undefined ? isDestructive : variant === 'destructive';
  const isMatch = targetMatch ? inputValue.trim() === targetMatch.trim() : true;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInputValue('');
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = async () => {
    if (!isMatch || isLoading) return;
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            {isDestructiveComputed && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="pt-2 text-left">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {targetMatch && (
          <div className="space-y-3 py-2 text-left">
            <p className="text-sm text-foreground">
              Ketik <span className="font-mono font-semibold select-all text-primary bg-secondary px-1.5 py-0.5 rounded text-xs">{targetMatch}</span> untuk mengonfirmasi:
            </p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={matchPlaceholder || targetMatch}
              autoFocus
              disabled={isLoading}
              className="font-mono text-sm"
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDestructiveComputed ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={!isMatch || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
