'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/auth-store';

interface ProblemReportFormProps {
  diagnosticCode?: string;
  projectId?: string;
}

const CATEGORIES = [
  { id: 'tabel_format', label: 'Tampilan / Format Tabel Bab 4' },
  { id: 'pemetaan_butir', label: 'Pengelompokan Variabel & Butir' },
  { id: 'unggah_berkas', label: 'Kendala Unggah / Pembacaan Berkas' },
  { id: 'angka_kaidah', label: 'Pertanyaan Angka & Metodologi' },
  { id: 'ekspor', label: 'Ekspor Dokumen Word / PDF' },
  { id: 'lainnya', label: 'Pertanyaan atau Masalah Lain' },
];

export function ProblemReportForm({
  diagnosticCode = '',
  projectId,
}: ProblemReportFormProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || description.trim().length < 5) {
      toast({
        title: 'Deskripsi terlalu singkat',
        description: 'Tuliskan penjelasan kendala yang Anda alami minimal 5 karakter.',
        variant: 'error',
      });
      return;
    }

    if (!email || !email.includes('@')) {
      toast({
        title: 'Email tidak valid',
        description: 'Masukkan alamat email Anda agar tim kami dapat mengirimkan tanggapan.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label || category;
      const res = await fetch('/api/problem-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryLabel,
          email: email.trim(),
          subject: subject.trim() || `Laporan ${categoryLabel}`,
          description: description.trim(),
          diagnosticCode,
          projectId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirimkan laporan');
      }

      setSubmittedReportId(data.reportId);
      toast({
        title: 'Laporan Masalah Diterima',
        description: `Nomor laporan Anda: ${data.reportId}. Solusi akan dikirimkan ke email Anda.`,
        variant: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat mengirim laporan.';
      toast({
        title: 'Gagal Mengirim Laporan',
        description: msg,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedReportId(null);
    setSubject('');
    setDescription('');
  };

  if (submittedReportId) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            Laporan Berhasil Diterima
          </span>
          <h3 className="text-lg font-bold text-foreground">
            Nomor Tiket: <span className="font-mono text-primary">{submittedReportId}</span>
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Laporan telah tercatat pada basis data dukungan kami. Tim OlahData akan meninjau kendala teknis dan mengirimkan panduan penyelesaian ke <strong className="text-foreground">{email}</strong>.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2 text-xs font-medium min-h-[44px] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Kirim Laporan Lain</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Kategori Kendala */}
        <div className="space-y-1.5">
          <Label htmlFor="report-category" className="text-xs font-semibold text-foreground">
            Kategori Kendala
          </Label>
          <select
            id="report-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer disabled:opacity-50"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Email Kontak */}
        <div className="space-y-1.5">
          <Label htmlFor="report-email" className="text-xs font-semibold text-foreground">
            Email Anda (untuk balasan solusi)
          </Label>
          <Input
            id="report-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@kampus.ac.id"
            required
            disabled={isSubmitting}
            className="text-xs min-h-[40px]"
          />
        </div>
      </div>

      {/* Subjek Singkat */}
      <div className="space-y-1.5">
        <Label htmlFor="report-subject" className="text-xs font-semibold text-foreground">
          Ringkasan Masalah (Opsional)
        </Label>
        <Input
          id="report-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Contoh: Baris tabel 4.3 tergeser di ponsel"
          disabled={isSubmitting}
          className="text-xs min-h-[40px]"
        />
      </div>

      {/* Deskripsi Masalah */}
      <div className="space-y-1.5">
        <Label htmlFor="report-desc" className="text-xs font-semibold text-foreground">
          Deskripsi Lengkap Kendala
        </Label>
        <Textarea
          id="report-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Jelaskan apa yang sedang Anda lakukan, apa yang terjadi, dan bagian mana yang memerlukan bantuan..."
          rows={4}
          required
          disabled={isSubmitting}
          className="text-xs leading-relaxed"
        />
      </div>

      {/* Jaminan Privasi Data Responden */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px] sm:text-xs">
          <strong className="text-foreground">Kerahasiaan Data Terjamin:</strong> Formulir ini hanya mengirimkan deskripsi kendala dan kode peramban Anda. Isi data responden dan kuesioner Anda sama sekali <strong>tidak pernah disertakan atau disimpan</strong> dalam laporan masalah.
        </p>
      </div>

      {/* Tombol Kirim */}
      <div className="pt-1 flex items-center justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="gap-2 font-semibold text-xs px-5 min-h-[44px] h-11 rounded-lg w-full sm:w-auto cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengirimkan Laporan...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Kirim Laporan Masalah</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
