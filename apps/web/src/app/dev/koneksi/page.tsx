'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Database,
  Lock,
  HardDrive,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CheckItem {
  id: string;
  name: string;
  category: 'env' | 'db' | 'auth' | 'storage';
  status: 'pending' | 'success' | 'failed' | 'warning';
  message: string;
  detail?: string;
}

export default function DevKoneksiPage() {
  const [isRunning, setIsRunning] = React.useState(false);
  const [lastChecked, setLastChecked] = React.useState<string | null>(null);
  const [checks, setChecks] = React.useState<CheckItem[]>([
    {
      id: 'env-url',
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      category: 'env',
      status: 'pending',
      message: 'Menunggu pemeriksaan...',
    },
    {
      id: 'env-anon',
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      category: 'env',
      status: 'pending',
      message: 'Menunggu pemeriksaan...',
    },
    {
      id: 'env-service',
      name: 'SUPABASE_SERVICE_ROLE_KEY (Server Only)',
      category: 'env',
      status: 'pending',
      message: 'Menunggu pemeriksaan server...',
    },
    {
      id: 'db-ping',
      name: 'Koneksi Basis Data (Database Engine)',
      category: 'db',
      status: 'pending',
      message: 'Menunggu pemeriksaan tabel...',
    },
    {
      id: 'auth-session',
      name: 'Status Autentikasi Pengguna',
      category: 'auth',
      status: 'pending',
      message: 'Menunggu pemeriksaan sesi...',
    },
    {
      id: 'storage-access',
      name: 'Akses Bucket Storage Privat (datasets)',
      category: 'storage',
      status: 'pending',
      message: 'Menunggu pemeriksaan bucket...',
    },
  ]);

  const runAllChecks = React.useCallback(async () => {
    setIsRunning(true);
    const updatedChecks: CheckItem[] = [...checks];

    // Helper update
    const update = (id: string, partial: Partial<CheckItem>) => {
      const idx = updatedChecks.findIndex((c) => c.id === id);
      if (idx !== -1) {
        updatedChecks[idx] = { ...updatedChecks[idx], ...partial };
      }
    };

    // 1. Cek NEXT_PUBLIC_SUPABASE_URL
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      update('env-url', {
        status: 'failed',
        message: 'Variabel belum diatur di .env.local',
        detail: 'Wajib diisi dengan URL https://<project-ref>.supabase.co',
      });
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      update('env-url', {
        status: 'failed',
        message: 'Format tidak valid (harus diawali https:// atau http://)',
        detail: 'Periksa kembali: jangan masukkan token publishable key ke dalam kolom URL.',
      });
    } else {
      update('env-url', {
        status: 'success',
        message: 'Terkonfigurasi dengan aman',
        detail: `Format valid (panjang: ${url.length} karakter, nilai disembunyikan)`,
      });
    }

    // 2. Cek NEXT_PUBLIC_SUPABASE_ANON_KEY
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anon) {
      update('env-anon', {
        status: 'failed',
        message: 'Variabel belum diatur di .env.local',
        detail: 'Wajib diisi dengan kunci anon publik dari Supabase Dashboard.',
      });
    } else if (anon.length < 20) {
      update('env-anon', {
        status: 'warning',
        message: 'Panjang kunci tampak mencurigakan',
        detail: 'Pastikan kunci anon disalin secara utuh.',
      });
    } else {
      update('env-anon', {
        status: 'success',
        message: 'Terkonfigurasi dengan aman',
        detail: `Format valid (panjang: ${anon.length} karakter, nilai disembunyikan)`,
      });
    }

    // 3. Cek SUPABASE_SERVICE_ROLE_KEY di server
    try {
      const res = await fetch('/api/dev/check-env', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.hasServiceRoleKey) {
          update('env-service', {
            status: 'success',
            message: 'Terkonfigurasi di server (terisolasi dari klien)',
            detail: 'Kunci service role tersedia untuk Route Handlers dan migrasi sistem.',
          });
        } else {
          update('env-service', {
            status: 'warning',
            message: 'Belum diisi di variabel server',
            detail: 'Diperlukan untuk worker antrean statistik & administrasi berhak tinggi.',
          });
        }
      } else {
        update('env-service', {
          status: 'warning',
          message: 'Pemeriksaan server dilewati (mode static build / 404)',
          detail: 'Hanya aktif di server runtime Next.js.',
        });
      }
    } catch {
      update('env-service', {
        status: 'warning',
        message: 'Tidak dapat menghubungi server dev',
        detail: 'Aplikasi kemungkinan sedang berjalan dalam mode peramban statis.',
      });
    }

    // 4. Cek Koneksi Basis Data Supabase
    try {
      const supabase = getSupabaseBrowserClient();
      const { error, status } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true });

      if (error) {
        // Cek jenis galat
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          update('db-ping', {
            status: 'warning',
            message: 'Terhubung ke Supabase, namun tabel belum dibuat',
            detail: 'Jalankan `supabase db push` untuk mengeksekusi migrasi dari folder supabase/migrations.',
          });
        } else {
          update('db-ping', {
            status: 'failed',
            message: `Koneksi ditolak: ${error.message}`,
            detail: `Kode status respons: ${status}. Periksa hak akses RLS atau kunci anon.`,
          });
        }
      } else {
        update('db-ping', {
          status: 'success',
          message: 'Terhubung dan tabel projects siap diakses',
          detail: 'Permintaan REST API Supabase berhasil dijawab oleh Postgres.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      update('db-ping', {
        status: 'failed',
        message: 'Koneksi gagal tersambung',
        detail: msg,
      });
    }

    // 5. Cek Status Autentikasi Pengguna
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        update('auth-session', {
          status: 'failed',
          message: `Gagal membaca status auth: ${error.message}`,
        });
      } else if (session && session.user) {
        update('auth-session', {
          status: 'success',
          message: `Terautentikasi sebagai: ${session.user.email || 'Pengguna'}`,
          detail: `ID Pengguna: ${session.user.id}`,
        });
      } else {
        update('auth-session', {
          status: 'success',
          message: 'Layanan auth aktif (status: tamu / belum login)',
          detail: 'Silakan masuk melalui halaman /masuk atau buat akun baru di /daftar.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      update('auth-session', {
        status: 'failed',
        message: 'Gagal menghubungi GoTrue Auth',
        detail: msg,
      });
    }

    // 6. Cek Akses Storage Privat (datasets)
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: bucket, error } = await supabase.storage.getBucket('datasets');

      if (error) {
        if (error.message.includes('not found') || error.message.includes('The resource was not found')) {
          update('storage-access', {
            status: 'warning',
            message: 'Bucket "datasets" belum dibuat di Supabase Storage',
            detail: 'Silakan buat bucket privat bernama "datasets" melalui dashboard Supabase atau jalankan migrasi 0003.',
          });
        } else {
          update('storage-access', {
            status: 'warning',
            message: `Pemeriksaan bucket mengembalikan: ${error.message}`,
            detail: 'Jika bucket privat, izin getBucket anon memang dibatasi oleh RLS storage.',
          });
        }
      } else if (bucket) {
        update('storage-access', {
          status: 'success',
          message: `Bucket "${bucket.name}" siap digunakan (${bucket.public ? 'Publik' : 'Privat'})`,
          detail: `Batas ukuran berkas: ${(bucket.file_size_limit || 10485760) / (1024 * 1024)} MB`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      update('storage-access', {
        status: 'warning',
        message: 'Pemeriksaan storage dilewati',
        detail: msg,
      });
    }

    setChecks([...updatedChecks]);
    setLastChecked(new Date().toLocaleTimeString('id-ID'));
    setIsRunning(false);
  }, [checks]);

  React.useEffect(() => {
    runAllChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSuccess = checks.filter((c) => c.status === 'success').length;
  const totalWarning = checks.filter((c) => c.status === 'warning').length;
  const totalFailed = checks.filter((c) => c.status === 'failed').length;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dasbor Aplikasi</span>
          </Link>
          <Badge variant="outline" className="font-mono text-xs">
            Lingkungan Pengembang (Dev Mode)
          </Badge>
        </div>

        {/* Page Header */}
        <div className="border border-border bg-card rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Pemeriksaan Koneksi Supabase
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Verifikasi integritas variabel lingkungan, basis data, autentikasi, dan penyimpanan privat.
              </p>
            </div>
            <Button
              onClick={runAllChecks}
              disabled={isRunning}
              className="gap-2 shrink-0 self-start sm:self-center font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Memeriksa...' : 'Uji Ulang Koneksi'}</span>
            </Button>
          </div>

          {/* Status summary pill */}
          <div className="pt-3 border-t border-border flex flex-wrap items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              Terakhir diperiksa: <strong className="text-foreground">{lastChecked || 'Memuat...'}</strong>
            </span>
            <span>•</span>
            <span className="text-success font-medium">Lulus: {totalSuccess}</span>
            <span>•</span>
            <span className="text-warning font-medium">Perhatian: {totalWarning}</span>
            <span>•</span>
            <span className="text-destructive font-medium">Gagal: {totalFailed}</span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/90 space-y-1">
            <p className="font-semibold text-foreground">
              Protokol Keamanan Aktif: Nilai Kunci Rahasia Disembunyikan
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Sesuai aturan keamanan produk, nilai kunci anon dan service role tidak pernah dicetak ke layar,
              log peramban, maupun kode frontend. Seluruh akses divalidasi melalui status koneksi dan panjang karakter.
            </p>
          </div>
        </div>

        {/* Checks Grid */}
        <div className="space-y-3">
          {checks.map((item) => (
            <Card key={item.id} className="border border-border bg-card shadow-xs">
              <CardContent className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-0.5 sm:mt-0 shrink-0">
                    {item.status === 'success' && (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    )}
                    {item.status === 'failed' && (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    {item.status === 'warning' && (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                    {item.status === 'pending' && (
                      <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs sm:text-sm font-semibold text-foreground">
                        {item.name}
                      </span>
                      {item.category === 'env' && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          Variabel
                        </Badge>
                      )}
                      {item.category === 'db' && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          Database
                        </Badge>
                      )}
                      {item.category === 'auth' && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          Auth
                        </Badge>
                      )}
                      {item.category === 'storage' && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          Storage
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.message}
                    </p>
                    {item.detail && (
                      <p className="text-[11px] text-muted-foreground/80 mt-1 font-mono">
                        {item.detail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {item.status === 'success' && (
                    <Badge variant="default" className="text-xs bg-success/15 text-success border-success/30">
                      Lulus
                    </Badge>
                  )}
                  {item.status === 'failed' && (
                    <Badge variant="destructive" className="text-xs">
                      Gagal
                    </Badge>
                  )}
                  {item.status === 'warning' && (
                    <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-400">
                      Perhatian
                    </Badge>
                  )}
                  {item.status === 'pending' && (
                    <Badge variant="secondary" className="text-xs">
                      Menguji...
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Tips */}
        <Card className="border border-border bg-card/50">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Petunjuk Menjalankan Migrasi ke Supabase Remote
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Jalankan perintah berikut di terminal komputer Anda untuk menerapkan seluruh skema database:
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-2 text-xs font-mono">
            <div className="p-3 bg-muted/60 rounded-lg border border-border text-foreground space-y-1">
              <p className="text-muted-foreground"># 1. Tautkan repositori lokal ke proyek Supabase:</p>
              <p className="text-primary font-semibold">npx supabase link --project-ref &lt;project-ref-anda&gt;</p>
              <p className="text-muted-foreground pt-1"># 2. Dorong semua migrasi skema tabel dan kebijakan RLS:</p>
              <p className="text-primary font-semibold">npx supabase db push</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
