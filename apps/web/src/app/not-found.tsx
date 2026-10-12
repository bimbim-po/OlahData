import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Halaman Tidak Ditemukan — OlahData',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 text-muted-foreground text-2xl font-serif font-bold">
        404
      </div>
      <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">
        Halaman Tidak Ditemukan
      </h1>
      <p className="text-muted-foreground max-w-md mb-8 text-sm">
        Halaman yang Anda tuju tidak tersedia, telah dipindahkan, atau alamat URL yang Anda masukkan salah.
      </p>
      <Button asChild variant="outline">
        <Link href="/" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </Button>
    </div>
  );
}
