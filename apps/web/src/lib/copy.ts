import { APP_NAME } from './constants';

export const COPY = {
  // Navigasi Utama
  nav: {
    beranda: 'Beranda',
    harga: 'Harga',
    masuk: 'Masuk',
    daftar: 'Daftar',
    proyek: 'Meja Kerja',
    panduan: 'Panduan',
    langganan: 'Langganan',
    pengaturan: 'Pengaturan',
    keluar: 'Keluar',
  },

  // Beranda (Marketing & Landing)
  hero: {
    title: 'Olah data kuesioner skripsi langsung jadi tabel Bab 4',
    subtitle: `${APP_NAME} memandu mahasiswa tingkat akhir menganalisis data kuesioner skala Likert: validitas item-total, reliabilitas Cronbach's Alpha, asumsi klasik, hingga regresi linier. Setiap angka memiliki jejak hitung dan tersambung langsung ke sel tabel asalnya.`,
    ctaPrimary: 'Buka meja kerja gratis',
    ctaSecondary: 'Lihat contoh tabel Bab 4',
  },

  // Alur Kerja Meja Kerja
  howItWorks: {
    title: 'Alur kerja analisis',
    steps: [
      {
        number: '1',
        title: 'Unggah berkas kuesioner',
        description: 'Unggah lembar tabulasi kuesionermu dalam format Excel (.xlsx) atau CSV.',
      },
      {
        number: '2',
        title: 'Periksa data & petakan konstruk',
        description: 'Sistem memeriksa kelengkapan data responden, lalu kamu mengelompokkan item pertanyaan ke variabel penelitian.',
      },
      {
        number: '3',
        title: 'Pilih uji statistik',
        description: 'Pilih metode uji yang disyaratkan dosen pembimbing dengan rekomendasi terarah berdasarkan desain hipotesis.',
      },
      {
        number: '4',
        title: 'Peroleh tabel Bab 4 & jejak hitung',
        description: 'Tabel berstandar APA 7th dan narasi penjelasan angka tersambung siap kamu salin ke naskah skripsi.',
      },
    ],
  },

  // Daftar Uji Statistik
  availableTests: {
    title: 'Uji statistik yang didukung',
    tests: [
      { name: 'Statistik Deskriptif', description: 'Mean, median, deviasi standar, rentang skor, dan sebaran frekuensi' },
      { name: 'Uji Validitas', description: 'Korelasi Pearson Product Moment (r-hitung dibandingkan r-tabel)' },
      { name: 'Uji Reliabilitas', description: "Cronbach's Alpha per konstruk instrumen dan alpha if item deleted" },
      { name: 'Uji Normalitas', description: 'Kolmogorov-Smirnov untuk memeriksa sebaran residual' },
      { name: 'Uji Multikolinearitas', description: 'Nilai Tolerance dan VIF antar variabel independen' },
      { name: 'Uji Heteroskedastisitas', description: 'Uji Glejser untuk mendeteksi varians residual' },
      { name: 'Regresi Linier Berganda', description: 'Persamaan regresi, koefisien B, standard error, dan nilai beta' },
      { name: 'Uji t (Parsial)', description: 'Signifikansi pengaruh masing-masing variabel bebas' },
      { name: 'Uji F (Simultan)', description: 'Signifikansi pengaruh seluruh variabel bebas secara bersamaan' },
      { name: 'Koefisien Determinasi', description: 'Nilai R, R Square, dan Adjusted R Square model' },
      { name: 'Korelasi Pearson', description: 'Kekuatan dan arah hubungan linier antar variabel' },
      { name: 'ANOVA Satu Arah', description: 'Uji perbedaan nilai rata-rata antar kelompok sampel' },
    ],
  },

  // Batasan Etika Akademik
  notDoing: {
    title: 'Prinsip integritas akademik kami',
    items: [
      {
        title: 'Tidak memanipulasi data responden',
        description: 'Kami tidak membuat, mengubah, atau menyimulasikan data jawaban responden. Data harus murni dari lembar kuesioner penelitianmu.',
      },
      {
        title: 'Tidak menulis naskah skripsi',
        description: 'Kami menyediakan tabel baku dan penjelasan logika angka, bukan menyusun Bab 4 untukmu. Penjelasan berfungsi sebagai panduan agar kamu memahami makna angka saat sidang.',
      },
      {
        title: 'Tidak menjamin kelulusan sidang',
        description: 'Kebenaran hasil analisis bergantung pada kualitas instrumen dan metodologi penelitianmu. Selalu diskusikan tafsir hasil dengan dosen pembimbing.',
      },
    ],
  },

  // Harga & Paket
  pricing: {
    title: 'Pilihan paket meja kerja',
    subtitle: 'Pilih akses yang sesuai dengan tahapan penyusunan skripsimu',
    disclaimer: 'Tarif simulasi pra-rilis, dapat disesuaikan sebelum peluncuran resmi.',
    campusNote: 'Untuk kerja sama program studi atau laboratorium: hubungi kami untuk paket institusi.',
    plans: [
      {
        id: 'free',
        name: 'Coba Gratis',
        price: 0,
        period: '',
        features: [
          '1 proyek aktif',
          'Maksimal 50 data responden',
          'Statistik deskriptif & uji validitas',
          'Ekspor berpenanda air',
        ],
        cta: 'Mulai gratis',
        highlighted: false,
      },
      {
        id: 'monthly',
        name: 'Akses Bulanan',
        price: 39000,
        period: '/bulan',
        features: [
          '5 proyek aktif',
          'Data responden tanpa batas',
          'Seluruh uji statistik lengkap',
          'Ekspor Word & PDF tanpa tanda air',
          'Pernyataan Penggunaan Alat',
        ],
        cta: 'Pilih bulanan',
        highlighted: true,
      },
      {
        id: 'thesis',
        name: 'Paket Skripsi',
        price: 99000,
        period: '/3 bulan',
        features: [
          'Proyek tanpa batas',
          'Data responden tanpa batas',
          'Seluruh uji statistik lengkap',
          'Ekspor Word & PDF tanpa tanda air',
          'Pernyataan Penggunaan Alat',
          'Riwayat versi analisis',
        ],
        cta: 'Pilih paket skripsi',
        highlighted: false,
      },
    ],
  },

  // Pertanyaan Umum (FAQ)
  faq: {
    title: 'Pertanyaan yang sering diajukan',
    items: [
      {
        q: 'Apakah hasil analisis ini sah untuk sidang skripsi?',
        a: `${APP_NAME} menggunakan rumus statistik baku yang identik dengan perangkat lunak metodologi standar. Setiap hasil dilengkapi jejak hitung formula dan lembar Pernyataan Penggunaan Alat yang dapat kamu lampirkan ke naskah skripsi.`,
      },
      {
        q: 'Bagaimana jika dosen pembimbing menanyakan dari mana angka diperoleh?',
        a: 'Setiap angka pada kalimat penjelasan terhubung langsung ke sel tabel asalnya, dan panel Jejak Hitung merinci rumus matematika, derajat kebebasan (df), serta nilai pembanding tabel r/t/F.',
      },
      {
        q: 'Apakah kerahasiaan data kuesioner terjamin?',
        a: 'Data responden kamu disimpan dengan isolasi tingkat baris (Row-Level Security). Kami tidak pernah menjual atau membagikan data penelitianmu kepada pihak mana pun.',
      },
      {
        q: 'Apa perbedaan angka kalkulasi dan kalimat penjelasan?',
        a: 'Seluruh koefisien, nilai signifikansi, dan tabel dihitung oleh mesin statistik berbasis formula matematika pasti. Narasi penjelasan menyusun kalimat interpretasi baku sesuai format pelaporan Bab 4.',
      },
      {
        q: 'Format berkas apa yang dapat diunggah?',
        a: 'Format Excel (.xlsx, .xls) dan CSV. Pastikan data tersusun dalam bentuk matriks: baris mewakili nomor responden dan kolom mewakili item pertanyaan kuesioner.',
      },
    ],
  },

  // Penanda & Status (Badges)
  badges: {
    computedByEngine: 'Dihitung mesin statistik (rumus baku)',
    writtenByAI: 'Kaidah pelaporan Bab 4',
    sampleData: 'Dataset contoh simulasi',
    draft: 'Draf',
    samplePrice: 'Tarif simulasi',
    simulasi: 'Simulasi',
  },

  // Wizard Analisis
  wizard: {
    steps: [
      'Unggah Berkas',
      'Validasi Data',
      'Petakan Variabel',
      'Pilih Uji',
      'Ringkasan & Analisis',
    ],
    upload: {
      title: 'Unggah berkas kuesioner',
      description: 'Pilih lembar tabulasi kuesioner dalam format Excel atau CSV.',
      sampleButton: 'Gunakan data contoh',
      sampleDescription: 'Muat dataset simulasi 120 responden × 18 item pertanyaan (Konstruk: Kualitas Layanan, Kepuasan, Loyalitas)',
      limits: 'Maksimal 15 MB. Format: .xlsx, .xls, .csv',
    },
    validation: {
      title: 'Validasi data responden',
      description: 'Memeriksa kelengkapan respons sebelum perhitungan statistik dimulai.',
      noIssues: 'Seluruh data responden lengkap dan siap diolah.',
      deleteRow: 'Keluarkan baris responden ini dari analisis',
      reupload: 'Unggah ulang berkas',
      criticalError: 'Selesaikan catatan merah sebelum melanjutkan ke pemetaan variabel.',
    },
    mapping: {
      title: 'Petakan variabel & konstruk',
      description: 'Kelompokkan item pertanyaan kuesioner ke konstruk penelitian dan tentukan perannya.',
      independent: 'Variabel Bebas (X)',
      dependent: 'Variabel Terikat (Y)',
      construct: 'Konstruk',
      addConstruct: 'Tambah konstruk baru',
    },
    testSelection: {
      title: 'Pilih uji statistik',
      description: 'Pilih metode uji yang disyaratkan dalam hipotesis penelitianmu.',
      recommended: 'Sesuai desain hipotesis',
      prerequisite: 'Uji prasyarat',
    },
    summary: {
      title: 'Ringkasan & jalankan analisis',
      description: 'Periksa kembali parameter pengujian sebelum mesin menghitung hasil.',
      runButton: 'Mulai hitung statistik',
      running: 'Mesin sedang menghitung...',
    },
  },

  // Lembar Hasil
  results: {
    title: 'Lembar Hasil Analisis',
    copyTable: 'Salin format Word',
    copyExplanation: 'Salin narasi',
    copied: 'Tersalin',
    export: 'Ekspor naskah',
    traceTitle: 'Jejak Hitung',
    traceFields: {
      test: 'Uji',
      dataVersion: 'Versi dataset',
      respondents: 'Jumlah responden',
      parameters: 'Parameter uji',
      timestamp: 'Waktu hitung',
      engineVersion: 'Versi mesin',
    },
  },

  // Ekspor Dokumen
  export: {
    title: 'Ekspor lembar Bab 4',
    format: 'Format naskah',
    sections: 'Bagian yang disertakan',
    includeStatement: 'Sertakan Pernyataan Penggunaan Alat',
    watermarkNote: 'Paket gratis menyertakan tanda air pada lembar ekspor. Tingkatkan paket untuk naskah bersih.',
    downloadButton: 'Unduh berkas',
    upgradeButton: 'Pilih paket skripsi',
  },

  // Pernyataan Penggunaan Alat
  toolStatement: {
    title: 'Pernyataan Penggunaan Alat',
    description: 'Halaman ini menyajikan draf Pernyataan Penggunaan Alat untuk lampiran skripsimu demi menjaga transparansi akademik.',
    advice: 'Konsultasikan dengan dosen pembimbing mengenai format lampiran yang berlaku di program studimu.',
    template: `Dalam penelitian ini, pengolahan data statistik dilakukan dengan bantuan perangkat lunak ${APP_NAME} (versi [VERSI]). Seluruh data berasal dari lembar tabulasi kuesioner yang disebarkan kepada responden oleh peneliti. Perhitungan statistik (mencakup uji validitas, reliabilitas, asumsi klasik, dan regresi) dieksekusi oleh mesin statistik ${APP_NAME} menggunakan rumus matematika baku. Penjelasan interpretasi angka disusun berdasarkan kaidah pelaporan standar Bab 4 dan telah ditinjau langsung oleh peneliti. Jejak hitung formula lengkap dilampirkan pada Lampiran [NOMOR LAMPIRAN].`,
  },

  // Autentikasi
  auth: {
    masuk: 'Masuk',
    daftar: 'Daftar',
    email: 'Alamat email kampus atau pribadi',
    password: 'Kata sandi',
    name: 'Nama lengkap',
    university: 'Perguruan tinggi / Universitas',
    forgotPassword: 'Lupa kata sandi?',
    noAccount: 'Belum punya akun?',
    hasAccount: 'Sudah punya akun?',
    googleButton: 'Lanjut dengan Google',
    googleToast: 'Masuk dengan Google belum diaktifkan.',
  },

  // Manajemen Proyek
  projects: {
    title: 'Daftar Proyek Skripsi',
    newProject: 'Mulai proyek baru',
    search: 'Cari judul penelitian atau variabel...',
    empty: {
      title: 'Belum ada proyek penelitian',
      description: 'Mulai proyek baru untuk mengolah kuesionermu, atau coba pelajari dengan dataset simulasi.',
      ctaPrimary: 'Mulai proyek baru',
      ctaSecondary: 'Buka data simulasi',
    },
    status: {
      draft: 'Draf',
      analyzing: 'Sedang dihitung',
      completed: 'Selesai',
    },
  },

  // Pengaturan
  settings: {
    title: 'Pengaturan Meja Kerja',
    profile: 'Profil Mahasiswa',
    theme: 'Mode Tampilan',
    themeOptions: {
      light: 'Meja Kerja Terang (Kertas)',
      dark: 'Meja Kerja Malam',
      system: 'Ikuti preferensi sistem',
    },
    deleteData: 'Hapus data proyek',
    deleteConfirm: 'Ketik judul proyek untuk mengonfirmasi penghapusan permanen:',
    deleteWarning: 'Peringatan: Tindakan ini menghapus seluruh dataset dan riwayat uji secara permanen.',
  },

  // Langganan
  subscription: {
    title: 'Status Langganan',
    activePlan: 'Paket aktif',
    usage: 'Penggunaan kuota',
    changePlan: 'Ganti paket',
    billingHistory: 'Riwayat transaksi',
  },

  // Kaki Halaman (Footer)
  footer: {
    tagline: `${APP_NAME} — Meja kerja analisis data kuesioner untuk skripsi kuantitatif mahasiswa Indonesia.`,
    links: {
      product: 'Perangkat',
      legal: 'Etika & Privasi',
      support: 'Bantuan Metodologi',
    },
  },

  // Frasa Umum
  common: {
    loading: 'Memuat data...',
    error: 'Terjadi kendala',
    retry: 'Coba ulangi',
    cancel: 'Batal',
    save: 'Simpan',
    next: 'Lanjutkan',
    previous: 'Sebelumnya',
    close: 'Tutup',
    delete: 'Hapus',
    edit: 'Ubah',
    back: 'Kembali',
    confirm: 'Konfirmasi',
  },
} as const;

export type CopyDictionary = typeof COPY;
