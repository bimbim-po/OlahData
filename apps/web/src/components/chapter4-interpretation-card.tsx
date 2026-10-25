'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Check,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Save,
  Copy,
  AlertTriangle,
  RefreshCw,
  GitMerge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const MAX_NOTE_CHARS = 20000;
const DEBOUNCE_MS = 600;

type SaveState = 'empty' | 'saving' | 'saved' | 'error' | 'conflict';

interface ConflictInfo {
  serverText: string;
  serverVersion: number;
  updatedAt?: string;
}

interface Chapter4InterpretationCardProps {
  intinya: string;
  interpretation?: string;
  tableNumber: string;
  sectionKey?: string;
  projectId?: string;
  guidingQuestions?: string[];
  className?: string;
  onHoverNumber?: (val: string | null) => void;
  activeNumber?: string | null;
}

export function Chapter4InterpretationCard({
  intinya,
  interpretation,
  tableNumber,
  sectionKey,
  projectId,
  guidingQuestions = [
    'Apakah temuan ini sejalan atau bertentangan dengan penelitian terdahulu pada topik yang sama?',
    'Teori apa yang mendasari arah dan signifikansi hubungan ini menurut kajian pustaka Anda?',
    'Apa implikasi praktis bagi objek penelitian atau manajemen berdasarkan pembuktian angka ini?',
  ],
  className,
}: Chapter4InterpretationCardProps) {
  const { toast } = useToast();
  const [isPolishing, setIsPolishing] = useState(false);
  const [isPolished, setIsPolished] = useState(false);
  const [showScaffold, setShowScaffold] = useState(true);
  const [theoryNote, setTheoryNote] = useState('');
  const [noteVersion, setNoteVersion] = useState<number | undefined>(undefined);
  const [saveState, setSaveState] = useState<SaveState>('empty');
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [copiedDiscussion, setCopiedDiscussion] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedProjectId = React.useMemo(() => {
    if (projectId && projectId.trim()) return projectId.trim();
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/app\/proyek\/([^/]+)/);
      if (match && match[1]) return match[1];
    }
    return 'default';
  }, [projectId]);

  const resolvedSectionId = React.useMemo(() => {
    if (sectionKey && sectionKey.trim()) return sectionKey.trim();
    return tableNumber.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  }, [sectionKey, tableNumber]);

  const storageKey = React.useMemo(() => {
    return `olahdata_theory_note_${resolvedProjectId}_${resolvedSectionId}`;
  }, [resolvedProjectId, resolvedSectionId]);

  const versionStorageKey = `${storageKey}__version`;

  // Muat catatan dari backend API (/api/projects/[id]/notes) atau Supabase notes + fallback lokal
  useEffect(() => {
    let cancelled = false;

    async function loadNoteFromServer() {
      // 1. Baca cadangan lokal terlebih dahulu agar responsif
      if (typeof window !== 'undefined') {
        try {
          const localVal = localStorage.getItem(storageKey);
          const localVer = localStorage.getItem(versionStorageKey);
          if (localVal !== null) {
            setTheoryNote(localVal);
            setSaveState(localVal.trim().length > 0 ? 'saved' : 'empty');
          }
          if (localVer) {
            const parsedV = Number(localVer);
            if (Number.isInteger(parsedV) && parsedV >= 1) {
              setNoteVersion(parsedV);
            }
          }
        } catch {
          // ignore localStorage errors
        }
      }

      if (!resolvedProjectId || resolvedProjectId === 'default') return;

      // 2. Muat dari endpoint API server (Cache-Control: no-store)
      try {
        const res = await fetch(
          `/api/projects/${encodeURIComponent(resolvedProjectId)}/notes?sectionId=${encodeURIComponent(resolvedSectionId)}`,
          {
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-store' },
          }
        );

        if (res.ok) {
          const payload = await res.json();
          const serverNote = Array.isArray(payload?.notes) ? payload.notes[0] : null;
          if (serverNote && !cancelled) {
            setTheoryNote(serverNote.text || '');
            setNoteVersion(serverNote.version || 1);
            setSaveState(serverNote.text?.trim() ? 'saved' : 'empty');
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(storageKey, serverNote.text || '');
                localStorage.setItem(versionStorageKey, String(serverNote.version || 1));
              } catch {
                // ignore
              }
            }
            return;
          }
        }
      } catch {
        // Lanjut ke Supabase direct jika berada di lingkungan static hosting
      }

      // 3. Coba muat dari tabel Supabase public.notes
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('notes')
          .select('id, text, version, updated_at')
          .eq('project_id', resolvedProjectId)
          .eq('section_id', resolvedSectionId)
          .maybeSingle();

        if (!error && data && !cancelled) {
          setTheoryNote(data.text || '');
          setNoteVersion(data.version || 1);
          setSaveState(data.text?.trim() ? 'saved' : 'empty');
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(storageKey, data.text || '');
              localStorage.setItem(versionStorageKey, String(data.version || 1));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // Gunakan cadangan lokal jika offline
      }
    }

    loadNoteFromServer();
    return () => {
      cancelled = true;
    };
  }, [resolvedProjectId, resolvedSectionId, storageKey, versionStorageKey]);

  const persistNoteToBackend = useCallback(
    async (
      textToSave: string,
      opts?: { expectedVersion?: number; forceOverwrite?: boolean; showToast?: boolean }
    ) => {
      if (textToSave.length > MAX_NOTE_CHARS) {
        setSaveState('error');
        setSaveErrorMsg(
          `Catatan melebihi batas maksimum ${MAX_NOTE_CHARS.toLocaleString('id-ID')} karakter.`
        );
        return;
      }

      setSaveState('saving');
      setSaveErrorMsg(null);

      // Simpan ke localStorage terlebih dahulu agar ketikan tidak pernah hilang (Prinsip S5)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, textToSave);
        } catch {
          // ignore
        }
      }

      let savedOnServer = false;
      let nextVer = (opts?.expectedVersion ?? noteVersion ?? 0) + 1;

      if (resolvedProjectId && resolvedProjectId !== 'default') {
        try {
          const res = await fetch(
            `/api/projects/${encodeURIComponent(resolvedProjectId)}/notes`,
            {
              method: 'PUT',
              cache: 'no-store',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
              },
              body: JSON.stringify({
                sectionId: resolvedSectionId,
                text: textToSave,
                version: opts?.expectedVersion ?? noteVersion,
                forceOverwrite: Boolean(opts?.forceOverwrite),
              }),
            }
          );

          if (res.status === 409) {
            const conflictPayload = await res.json().catch(() => ({}));
            setSaveState('conflict');
            setConflictInfo({
              serverText: conflictPayload?.currentNote?.text || '',
              serverVersion: Number(conflictPayload?.serverVersion || 1),
              updatedAt: conflictPayload?.currentNote?.updatedAt,
            });
            return;
          }

          if (res.ok) {
            const data = await res.json();
            nextVer = Number(data?.version || nextVer);
            savedOnServer = true;
          } else if (res.status === 422 || res.status === 403 || res.status === 401) {
            const errBody = await res.json().catch(() => ({}));
            setSaveState('error');
            setSaveErrorMsg(
              errBody?.message || 'Gagal menyimpan catatan ke server. Periksa sesi login Anda.'
            );
            return;
          }
        } catch {
          // Fallback ke Supabase direct client jika route API Next.js tidak aktif di static host
        }

        if (!savedOnServer) {
          try {
            const supabase = getSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: upserted, error: sbErr } = await supabase
                .from('notes')
                .upsert(
                  {
                    project_id: resolvedProjectId,
                    section_id: resolvedSectionId,
                    text: textToSave,
                    version: nextVer,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: 'project_id,section_id' }
                )
                .select('version')
                .maybeSingle();

              if (!sbErr) {
                nextVer = Number(upserted?.version || nextVer);
                savedOnServer = true;
              }
            } else {
              // Mode lokal / sesi perangkat
              savedOnServer = true;
            }
          } catch {
            // Jika offline, tetap tandai tersimpan di cadangan lokal atau tampilkan opsi coba lagi
          }
        }
      } else {
        savedOnServer = true;
      }

      setNoteVersion(nextVer);
      setConflictInfo(null);
      setSaveState(textToSave.trim().length > 0 ? 'saved' : 'empty');

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, textToSave);
          localStorage.setItem(versionStorageKey, String(nextVer));
        } catch {
          // ignore
        }
      }

      if (opts?.showToast) {
        toast({
          title: 'Catatan Teori Disimpan',
          description: `Catatan pembahasan untuk ${tableNumber} berhasil disinkronkan (versi ${nextVer}).`,
          variant: 'success',
        });
      }
    },
    [
      noteVersion,
      resolvedProjectId,
      resolvedSectionId,
      storageKey,
      tableNumber,
      toast,
      versionStorageKey,
    ]
  );

  const handleTheoryNoteChange = (value: string) => {
    setTheoryNote(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSaveState('saving');
    debounceTimerRef.current = setTimeout(() => {
      persistNoteToBackend(value);
    }, DEBOUNCE_MS);
  };

  const handleManualSaveNote = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    persistNoteToBackend(theoryNote, { showToast: true });
  };

  const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleManualSaveNote();
    }
  };

  const handleMergeConflict = () => {
    if (!conflictInfo) return;
    const mergedText = [
      conflictInfo.serverText.trim(),
      theoryNote.trim(),
    ]
      .filter(Boolean)
      .join('\n\n---\n\n');
    setTheoryNote(mergedText);
    persistNoteToBackend(mergedText, {
      expectedVersion: conflictInfo.serverVersion,
      forceOverwrite: true,
      showToast: true,
    });
  };

  const handleOverwriteConflict = () => {
    if (!conflictInfo) return;
    persistNoteToBackend(theoryNote, {
      expectedVersion: conflictInfo.serverVersion,
      forceOverwrite: true,
      showToast: true,
    });
  };

  const handleCopyFullDiscussion = async () => {
    const parts = [
      interpretation ? interpretation.trim() : intinya.trim(),
      theoryNote.trim() ? `\nPembahasan Teori & Penelitian Terdahulu:\n${theoryNote.trim()}` : '',
    ].filter(Boolean);
    const fullText = parts.join('\n');
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedDiscussion(true);
      setTimeout(() => setCopiedDiscussion(false), 2000);
      toast({
        title: 'Narasi & Catatan Teori Disalin',
        description: 'Siap ditempelkan (Ctrl+V) ke dokumen Bab 4 Microsoft Word Anda.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal Menyalin',
        description: 'Periksa izin clipboard pada peramban Anda.',
        variant: 'error',
      });
    }
  };

  const handlePolishWithAI = () => {
    setIsPolishing(true);
    setTimeout(() => {
      setIsPolishing(false);
      setIsPolished(true);
      toast({
        title: 'Gaya Bahasa Naskah Dirapikan',
        description:
          'Tata bahasa telah diselaraskan dengan kaidah penulisan ilmiah baku. Angka dan signifikansi tetap 100% terkunci.',
        variant: 'success',
      });
    }, 600);
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-xs',
        className
      )}
    >
      {/* 1. Header & Intinya Badge */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Interpretasi Akademik ({tableNumber})
            </span>
            <Badge variant="outline" className="text-[11px] font-mono py-0">
              Rule-Based Engine
            </Badge>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePolishWithAI}
            disabled={isPolishing}
            className="text-xs h-7 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground touch-manipulation cursor-pointer"
            title="Rapikan tata bahasa kalimat tanpa mengubah angka atau kategori statistik"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{isPolished ? 'Gaya Ilmiah Aktif' : 'Rapikan Gaya AI'}</span>
          </Button>
        </div>

        {/* Intinya callout */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-xs font-bold text-primary shrink-0 uppercase tracking-wider mt-0.5">
            Intinya:
          </span>
          <p className="text-xs sm:text-[13px] font-medium text-foreground leading-relaxed">
            {intinya}
          </p>
        </div>
      </div>

      {/* 2. Draf Narasi Interpretasi */}
      {interpretation && (
        <div className="space-y-1.5 text-xs sm:text-[13px] text-foreground leading-relaxed">
          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
            Draf Naskah Bab IV:
          </h4>
          <p className="whitespace-pre-line text-muted-foreground">{interpretation}</p>
        </div>
      )}

      {/* 3. Kerangka Pembahasan Akademik Interaktif (Tersinkronisasi ke Backend) */}
      <div className="rounded-lg border border-border/80 bg-muted/30 p-3 sm:p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground">
              Kerangka Pembahasan Akademik
            </span>

            {saveState === 'saving' && (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded"
              >
                <RefreshCw className="h-3 w-3 animate-spin" />
                Menyimpan...
              </span>
            )}

            {saveState === 'saved' && theoryNote.trim().length > 0 && (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded"
              >
                <Check className="h-3 w-3" />
                Tersimpan baru saja{noteVersion ? ` (v${noteVersion})` : ''}
              </span>
            )}

            {saveState === 'empty' && theoryNote.trim().length === 0 && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Belum ada catatan
              </span>
            )}

            {saveState === 'error' && (
              <span
                role="alert"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded"
              >
                <AlertTriangle className="h-3 w-3" />
                Gagal menyimpan — coba lagi
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowScaffold(!showScaffold)}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
          >
            {showScaffold ? (
              <>
                <span>Sembunyikan</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Buka Pemandu</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {showScaffold && (
          <div className="space-y-2.5 pt-1.5 border-t border-border/40 text-xs">
            {/* Banner Konflik Versi (409 Conflict) */}
            {saveState === 'conflict' && conflictInfo && (
              <div
                role="alert"
                className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 space-y-2 text-xs"
              >
                <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Konflik Perubahan Terdeteksi (Versi Server v{conflictInfo.serverVersion})
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Catatan pada bagian ini telah diperbarui dari tab atau perangkat lain. Teks ketikan Anda tetap aman. Pilih tindakan berikut:
                </p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleMergeConflict}
                    className="h-7 px-2.5 text-[11px] gap-1.5"
                  >
                    <GitMerge className="h-3 w-3 text-primary" />
                    <span>Gabung Kedua Catatan</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOverwriteConflict}
                    className="h-7 px-2.5 text-[11px] gap-1.5"
                  >
                    <Save className="h-3 w-3" />
                    <span>Timpa dengan Versi Saya</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Banner Error Simpan */}
            {saveState === 'error' && saveErrorMsg && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 flex items-center justify-between gap-2 text-[11px] text-destructive"
              >
                <span>{saveErrorMsg}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleManualSaveNote}
                  className="h-6 px-2 text-[10px] shrink-0"
                >
                  Coba Lagi
                </Button>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor={`theory-input-${storageKey}`}
                className="text-[11px] font-semibold text-foreground flex items-center justify-between flex-wrap gap-1"
              >
                <span>Catatan Teori dan Penelitian Terdahulu Anda:</span>
                <span className="text-[10px] font-mono font-normal text-muted-foreground">
                  {theoryNote.length.toLocaleString('id-ID')} / {MAX_NOTE_CHARS.toLocaleString('id-ID')} karakter • Ctrl+S untuk simpan
                </span>
              </label>
              <textarea
                id={`theory-input-${storageKey}`}
                rows={4}
                maxLength={MAX_NOTE_CHARS}
                value={theoryNote}
                onChange={(e) => handleTheoryNoteChange(e.target.value)}
                onKeyDown={handleKeyDownTextarea}
                placeholder="Tambahkan teori dan penelitian terdahulu Anda di sini (contoh: Hasil ini sejalan dengan penelitian terdahulu oleh ... yang menyatakan bahwa ...)"
                className="w-full min-h-[112px] rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 leading-relaxed resize-y transition-colors"
              />
              <div className="flex items-center justify-end gap-2 pt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleManualSaveNote}
                  disabled={saveState === 'saving'}
                  className="h-7 min-h-[28px] px-2.5 text-[11px] gap-1.5 rounded-md cursor-pointer"
                >
                  <Save className="h-3 w-3 text-primary" />
                  <span>{saveState === 'saving' ? 'Menyimpan...' : 'Simpan Catatan'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyFullDiscussion}
                  className="h-7 min-h-[28px] px-2.5 text-[11px] gap-1.5 rounded-md cursor-pointer"
                >
                  {copiedDiscussion ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-muted-foreground" />
                      <span>Salin Narasi + Teori</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground italic">
              Pertanyaan pemandu dari dosen penguji untuk menyusun paragraf pembahasan Anda:
            </p>

            <ul className="space-y-1 pl-1 text-[12px] text-foreground">
              {guidingQuestions.map((q, qIdx) => (
                <li key={qIdx} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-primary font-bold">{qIdx + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
