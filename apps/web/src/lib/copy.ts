import { APP_NAME } from './constants';

export const COPY = {
  // Navigation
  nav: {
    beranda: 'Beranda',
    harga: 'Harga',
    masuk: 'Masuk',
    daftar: 'Daftar',
    proyek: 'Proyek',
    panduan: 'Panduan',
    langganan: 'Langganan',
    pengaturan: 'Pengaturan',
    keluar: 'Keluar',
  },

  // Landing page
  hero: {
    title: 'Olah data kuesioner skripsi — tanpa SPSS, tanpa ribet',
    subtitle: `${APP_NAME} membantu mahasiswa tingkat akhir menganalisis data kuesioner skala Likert: uji validitas, reliabilitas, asumsi klasik, hingga regresi linier berganda. Hasilnya langsung dalam format tabel Bab 4.`,
    ctaPrimary: 'Coba gratis',
    ctaSecondary: 'Lihat contoh hasil',
  },

  // How it works
  howItWorks: {
    title: 'Cara kerja',
    steps: [
      {
        number: '1',
        title: 'Unggah data',
        description: 'Unggah file Excel atau CSV berisi respons kuesioner Anda.',
      },
      {
        number: '2',
        title: 'Validasi & petakan',
        description: 'Sistem memeriksa kualitas data dan Anda memetakan variabel ke konstruk penelitian.',
      },
      {
        number: '3',
        title: 'Pilih uji statistik',
        description: 'Pilih uji yang diperlukan — ada rekomendasi otomatis berdasarkan desain penelitian.',
      },
      {
        number: '4',
        title: 'Dapatkan hasil',
        description: 'Tabel hasil gaya jurnal, penjelasan bahasa Indonesia, siap salin ke Bab 4 skripsi.',
      },
    ],
  },

  // Available tests
  availableTests: {
    title: 'Uji statistik yang tersedia',
    tests: [
      { name: 'Statistik Deskriptif', description: 'Mean, median, standar deviasi, distribusi frekuensi' },
      { name: 'Uji Validitas', description: 'Korelasi item-total (r hitung vs r tabel)' },
      { name: 'Uji Reliabilitas', description: "Cronbach's Alpha per konstruk dan alpha jika item dihapus" },
      { name: 'Uji Normalitas', description: 'Kolmogorov-Smirnov untuk asumsi distribusi normal' },
      { name: 'Uji Multikolinearitas', description: 'Tolerance dan VIF antar variabel bebas' },
      { name: 'Uji Heteroskedastisitas', description: 'Uji Glejser untuk varians residual' },
      { name: 'Regresi Linier Berganda', description: 'Pengaruh simultan dan parsial variabel bebas terhadap variabel terikat' },
      { name: 'Uji t (Parsial)', description: 'Signifikansi pengaruh masing-masing variabel bebas' },
      { name: 'Uji F (Simultan)', description: 'Signifikansi pengaruh seluruh variabel bebas secara bersama-sama' },
      { name: 'Koefisien Determinasi', description: 'R² — proporsi varians yang dijelaskan model' },
      { name: 'Korelasi Pearson', description: 'Kekuatan dan arah hubungan antar variabel' },
      { name: 'ANOVA Satu Arah', description: 'Perbedaan rata-rata antar kelompok' },
    ],
  },

  // What we don't do
  notDoing: {
    title: 'Yang tidak kami lakukan',
    items: [
      {
        title: 'Tidak membuat data responden',
        description: 'Kami tidak membuat, mengisi, menyimulasikan, atau memanipulasi data responden. Data harus berasal dari kuesioner penelitian Anda yang sesungguhnya.',
      },
      {
        title: 'Tidak menulis skripsi',
        description: 'Kami menyediakan tabel dan penjelasan angka, bukan menulis Bab 4 Anda. Penjelasan adalah alat bantu interpretasi, bukan pengganti analisis mandiri.',
      },
      {
        title: 'Tidak menjamin kelulusan',
        description: 'Hasil analisis bergantung pada kualitas data dan desain penelitian. Konsultasikan dengan dosen pembimbing untuk interpretasi akhir.',
      },
    ],
  },

  // Pricing
  pricing: {
    title: 'Harga',
    subtitle: 'Pilih paket yang sesuai kebutuhan skripsi Anda',
    disclaimer: 'Harga contoh, belum final. Dapat berubah sebelum peluncuran.',
    campusNote: 'Untuk kampus/prodi: hubungi kami untuk paket institusi.',
    plans: [
      {
        id: 'free',
        name: 'Coba Gratis',
        price: 0,
        period: '',
        features: [
          '1 proyek aktif',
          'Maks. 50 responden',
          'Statistik deskriptif & validitas',
          'Ekspor dengan tanda air',
        ],
        cta: 'Mulai gratis',
        highlighted: false,
      },
      {
        id: 'monthly',
        name: 'Bulanan',
        price: 39000,
        period: '/bulan',
        features: [
          '5 proyek aktif',
          'Responden tidak terbatas',
          'Semua uji statistik',
          'Ekspor Word & PDF tanpa tanda air',
          'Pernyataan Penggunaan Alat',
        ],
        cta: 'Berlangganan',
        highlighted: true,
      },
      {
        id: 'thesis',
        name: 'Paket Skripsi',
        price: 99000,
        period: '/3 bulan',
        features: [
          'Proyek tidak terbatas',
          'Responden tidak terbatas',
          'Semua uji statistik',
          'Ekspor Word & PDF tanpa tanda air',
          'Pernyataan Penggunaan Alat',
          'Riwayat versi analisis',
        ],
        cta: 'Berlangganan',
        highlighted: false,
      },
    ],
  },

  // FAQ
  faq: {
    title: 'Pertanyaan yang sering diajukan',
    items: [
      {
        q: 'Apakah hasil analisis ini sah untuk skripsi?',
        a: `${APP_NAME} menggunakan rumus statistik standar yang sama dengan SPSS atau software statistik lainnya. Setiap hasil dilengkapi jejak hitung dan Pernyataan Penggunaan Alat yang bisa dilampirkan ke skripsi. Pastikan untuk berkonsultasi dengan dosen pembimbing mengenai kebijakan kampus Anda.`,
      },
      {
        q: 'Bagaimana jika dosen tidak mengizinkan penggunaan alat ini?',
        a: 'Setiap kampus memiliki kebijakan berbeda. Kami menyediakan Pernyataan Penggunaan Alat dan jejak hitung yang transparan. Diskusikan dengan dosen pembimbing sebelum menggunakan.',
      },
      {
        q: 'Apakah data saya aman?',
        a: 'Data Anda diproses secara lokal di peramban dan di server terenkripsi. Kami tidak membagikan data kepada pihak ketiga. Anda dapat menghapus semua data kapan saja.',
      },
      {
        q: 'Apa perbedaan angka yang dihitung mesin dan penjelasan AI?',
        a: 'Semua angka (koefisien, p-value, statistik uji) dihitung oleh mesin statistik menggunakan rumus matematika pasti — bukan AI. AI hanya membantu menulis kalimat penjelasan dari angka yang sudah dihitung tersebut. Setiap bagian diberi label yang jelas.',
      },
      {
        q: 'Format file apa yang didukung?',
        a: 'Excel (.xlsx, .xls) dan CSV. Pastikan data dalam format tabel dengan baris sebagai responden dan kolom sebagai item kuesioner.',
      },
    ],
  },

  // Badges
  badges: {
    computedByEngine: 'Dihitung oleh mesin statistik',
    writtenByAI: 'Penjelasan ditulis AI dari angka di tabel',
    sampleData: 'Data contoh, bukan data penelitian',
    draft: 'DRAF',
    samplePrice: 'Harga contoh, belum final',
    simulasi: 'Simulasi',
  },

  // Wizard
  wizard: {
    steps: [
      'Unggah Data',
      'Validasi Data',
      'Petakan Variabel',
      'Pilih Uji',
      'Ringkasan & Jalankan',
    ],
    upload: {
      title: 'Unggah file data kuesioner',
      description: 'Seret dan lepas file Excel atau CSV, atau klik untuk memilih file.',
      sampleButton: 'Pakai data contoh',
      sampleDescription: 'Muat dataset contoh 120 responden × 18 item (3 konstruk: Kualitas Layanan, Kepuasan, Loyalitas)',
      limits: 'Maks. 5 MB. Format: .xlsx, .xls, .csv',
    },
    validation: {
      title: 'Validasi data',
      description: 'Periksa kualitas data sebelum analisis.',
      noIssues: 'Tidak ditemukan masalah pada data.',
      deleteRow: 'Hapus baris ini dari analisis',
      reupload: 'Kembali unggah file',
      criticalError: 'Perbaiki galat kritis sebelum melanjutkan.',
    },
    mapping: {
      title: 'Petakan variabel',
      description: 'Kelompokkan item kuesioner ke konstruk penelitian dan tentukan peran variabel.',
      independent: 'Variabel Bebas (X)',
      dependent: 'Variabel Terikat (Y)',
      construct: 'Konstruk',
      addConstruct: 'Tambah konstruk',
    },
    testSelection: {
      title: 'Pilih uji statistik',
      description: 'Pilih uji yang akan dijalankan. Rekomendasi ditandai berdasarkan pemetaan variabel.',
      recommended: 'Direkomendasikan',
      prerequisite: 'Prasyarat',
    },
    summary: {
      title: 'Ringkasan & jalankan analisis',
      description: 'Periksa kembali pengaturan sebelum menjalankan analisis.',
      runButton: 'Jalankan analisis',
      running: 'Menjalankan analisis...',
    },
  },

  // Results
  results: {
    title: 'Hasil Analisis',
    copyTable: 'Salin tabel',
    copyExplanation: 'Salin penjelasan',
    copied: 'Tersalin!',
    export: 'Ekspor',
    traceTitle: 'Jejak Hitung',
    traceFields: {
      test: 'Uji',
      dataVersion: 'Versi dataset',
      respondents: 'Jumlah responden',
      parameters: 'Parameter',
      timestamp: 'Waktu',
      engineVersion: 'Versi mesin',
    },
  },

  // Export
  export: {
    title: 'Ekspor hasil',
    format: 'Format',
    sections: 'Bagian yang disertakan',
    includeStatement: 'Sertakan Pernyataan Penggunaan Alat',
    watermarkNote: 'Paket gratis: hasil akan memiliki tanda air. Upgrade untuk menghapus.',
    downloadButton: 'Unduh',
    upgradeButton: 'Upgrade paket',
  },

  // Tool usage statement
  toolStatement: {
    title: 'Pernyataan Penggunaan Alat',
    description: `Halaman ini menjelaskan cara melampirkan Pernyataan Penggunaan Alat ke skripsi Anda. Pernyataan ini bertujuan menjaga transparansi akademik.`,
    advice: 'Kami menyarankan untuk mengikuti pedoman kampus masing-masing terkait penggunaan alat bantu analisis data.',
    template: `Dalam penelitian ini, pengolahan data statistik dilakukan dengan bantuan perangkat lunak ${APP_NAME} (versi [VERSI]). Seluruh data berasal dari kuesioner yang disebarkan kepada responden secara langsung oleh peneliti. Perhitungan statistik (termasuk uji validitas, reliabilitas, asumsi klasik, dan regresi) dilakukan oleh mesin statistik ${APP_NAME} menggunakan rumus matematika standar. Penjelasan naratif atas hasil perhitungan dihasilkan dengan bantuan kecerdasan buatan dan telah diperiksa oleh peneliti. Hasil lengkap beserta jejak hitung tersedia di lampiran [NOMOR LAMPIRAN].`,
  },

  // Auth
  auth: {
    masuk: 'Masuk',
    daftar: 'Daftar',
    email: 'Alamat email',
    password: 'Kata sandi',
    name: 'Nama lengkap',
    university: 'Universitas',
    forgotPassword: 'Lupa kata sandi?',
    noAccount: 'Belum punya akun?',
    hasAccount: 'Sudah punya akun?',
    googleButton: 'Lanjut dengan Google',
    googleToast: 'Fitur login Google belum aktif.',
  },

  // Projects
  projects: {
    title: 'Proyek Saya',
    newProject: 'Proyek baru',
    search: 'Cari proyek...',
    empty: {
      title: 'Belum ada proyek',
      description: 'Mulai proyek baru untuk mengolah data kuesioner Anda, atau coba dengan data contoh.',
      ctaPrimary: 'Proyek baru',
      ctaSecondary: 'Coba data contoh',
    },
    status: {
      draft: 'Draf',
      analyzing: 'Sedang dianalisis',
      completed: 'Selesai',
    },
  },

  // Settings
  settings: {
    title: 'Pengaturan',
    profile: 'Profil',
    theme: 'Tema',
    themeOptions: {
      light: 'Terang',
      dark: 'Gelap',
      system: 'Ikuti sistem',
    },
    deleteData: 'Hapus data',
    deleteConfirm: 'Ketik nama proyek untuk mengonfirmasi penghapusan:',
    deleteWarning: 'Tindakan ini tidak dapat dibatalkan.',
  },

  // Subscription
  subscription: {
    title: 'Langganan',
    activePlan: 'Paket aktif',
    usage: 'Pemakaian',
    changePlan: 'Ganti paket',
    billingHistory: 'Riwayat tagihan',
  },

  // Footer
  footer: {
    tagline: `${APP_NAME} — Alat bantu analisis data kuesioner untuk skripsi kuantitatif.`,
    links: {
      product: 'Produk',
      legal: 'Hukum',
      support: 'Dukungan',
    },
  },

  // Common
  common: {
    loading: 'Memuat...',
    error: 'Terjadi kesalahan',
    retry: 'Coba lagi',
    cancel: 'Batal',
    save: 'Simpan',
    next: 'Selanjutnya',
    previous: 'Sebelumnya',
    close: 'Tutup',
    delete: 'Hapus',
    edit: 'Ubah',
    back: 'Kembali',
    confirm: 'Konfirmasi',
  },
} as const;
