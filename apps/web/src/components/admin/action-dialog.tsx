'use client';

import * as React from 'react';
import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel: string;
  variant?: 'default' | 'destructive';
  requireIdConfirmation?: string;
  fields?: Array<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'select';
    defaultValue?: string | number;
    options?: Array<{ label: string; value: string }>;
  }>;
  onConfirm: (data: { reason: string; payload: Record<string, unknown> }) => Promise<void>;
}

export function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  variant = 'default',
  requireIdConfirmation,
  fields = [],
  onConfirm,
}: ActionDialogProps) {
  const [reason, setReason] = useState('');
  const [typedId, setTypedId] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const f of fields) {
      initial[f.id] = f.defaultValue ?? '';
    }
    return initial;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    reason.trim().length >= 5 &&
    (!requireIdConfirmation || typedId === requireIdConfirmation);

  async function handleConfirm() {
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm({
        reason: reason.trim(),
        payload: {
          ...fieldValues,
          typedId: typedId.trim(),
        },
      });
      setReason('');
      setTypedId('');
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message || 'Terjadi kesalahan saat memproses tindakan.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{title}</DialogTitle>
          <DialogDescription className="text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {fields.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <Label htmlFor={f.id} className="text-xs font-medium">
                {f.label}
              </Label>
              {f.type === 'select' ? (
                <select
                  id={f.id}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  value={String(fieldValues[f.id] || '')}
                  onChange={(e) =>
                    setFieldValues((prev) => ({ ...prev, [f.id]: e.target.value }))
                  }
                >
                  {f.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={f.id}
                  type={f.type}
                  value={String(fieldValues[f.id] || '')}
                  onChange={(e) =>
                    setFieldValues((prev) => ({ ...prev, [f.id]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}

          {requireIdConfirmation && (
            <div className="space-y-1.5 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <Label htmlFor="id-confirm" className="text-xs font-semibold text-destructive">
                Ketik ID Pengguna untuk Konfirmasi: <span className="font-mono">{requireIdConfirmation}</span>
              </Label>
              <Input
                id="id-confirm"
                value={typedId}
                onChange={(e) => setTypedId(e.target.value)}
                placeholder="Salin/ketik ID pengguna di sini"
                className="font-mono text-xs"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="admin-reason" className="text-xs font-medium flex items-center justify-between">
              <span>Alasan Tindakan (Wajib Audit Log)</span>
              <span className="text-[10px] text-muted-foreground">Minimal 5 karakter</span>
            </Label>
            <Input
              id="admin-reason"
              placeholder="Contoh: Permintaan resmi tiket bantuan #420..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/15 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
            disabled={!canSubmit || isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
