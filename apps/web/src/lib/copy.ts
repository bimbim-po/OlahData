import { APP_NAME } from './constants';
import { PLANS } from './plans';

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
    title: 'Dari kuesioner ke Bab 4, tanpa pusing.',
    subtitle: 'Angka dihitung deterministik dengan rumus baku skripsi Indonesia—angka dicocokkan dengan hitungan independen (pustaka statistik) pada data acuan. Data responden asli Anda tidak pernah kami ubah atau manipulasi.',
    ctaPrimary: 'Coba dengan data contoh',
    ctaSecondary: 'Unggah data saya',
    microCopy: 'Angka terverifikasi data acuan • Data responden tidak pernah diubah • Tanpa login untuk data contoh',
  },

  // Alur Kerja Meja Kerja
  howItWorks: {
    title: 'Alur kerja analisis',
    steps: [
      {
        number: '1',
        title: 'Unggah berkas kuesioner',
        description: 'Unggah lembar tabulasi kuesioner Anda dalam format Excel (.xlsx) atau CSV.',
      },
      {
        number: '2',
        title: 'Periksa data & petakan konstruk',
        description: 'Sistem memeriksa kelengkapan data responden, lalu Anda mengelompokkan butir pertanyaan ke variabel penelitian.',
      },
      {
        number: '3',
        title: 'Pilih uji statistik',
        description: 'Pilih metode uji yang disyaratkan dosen pembimbing dengan rekomendasi terarah berdasarkan desain hipotesis.',
      },
      {
        number: '4',
        title: 'Peroleh tabel Bab 4 & jejak hitung',
        description: 'Tabel berstandar APA 7th dan draf penjelasan angka tersambung siap Anda salin ke naskah skripsi.',
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
        description: 'Kami tidak membuat, mengubah, atau menyimulasikan data jawaban responden. Data harus murni dari lembar kuesioner penelitian Anda.',
      },
      {
        title: 'Draf interpretasi wajib diperiksa mandiri',
        description: 'OlahData menghitung angka dan menyusun draf interpretasi dari angka tersebut. Draf wajib Anda periksa dan tulis ulang dengan bahasa Anda sendiri.',
      },
      {
        title: 'Tidak menjamin kelulusan sidang',
        description: 'Kebenaran hasil analisis bergantung pada kualitas instrumen dan metodologi penelitian Anda. Selalu diskusikan tafsir hasil dengan dosen pembimbing.',
      },
    ],
  },

  // Harga & Paket
  pricing: {
    title: 'Pilihan paket meja kerja',
    subtitle: 'Pilih akses yang sesuai dengan tahapan penyusunan skripsi Anda',
    disclaimer: 'Tarif simulasi pra-rilis, dapat disesuaikan sebelum peluncuran resmi.',
    campusNote: 'Untuk kerja sama program studi atau laboratorium: hubungi kami untuk paket institusi.',
    plans: PLANS,
  },

  // Pertanyaan Umum (FAQ)
  faq: {
    title: 'Pertanyaan yang sering diajukan',
    items: [
      {
        q: 'Apakah hasil analisis ini sah untuk sidang skripsi?',
        a: `${APP_NAME} memakai rumus baku deterministik; angka dicocokkan dengan hitungan independen (pustaka statistik) pada data acuan. Setiap hasil dilengkapi Jejak Hitung (rumus formula, derajat kebebasan df, nilai kritis pembanding) serta dokumen Pernyataan Penggunaan Alat resmi. Pelajari metodologi lengkap pada halaman panduan kami.`,
      },
      {
        q: 'Bagaimana jika dosen pembimbing menanyakan dari mana angka diperoleh?',
        a: 'Setiap angka pada draf interpretasi terhubung langsung ke sel tabel asalnya. Panel Jejak Hitung merinci rumus matematika, derajat kebebasan (df), serta nilai pembanding tabel r/t/F agar Anda memahami dan dapat menjelaskan asal-usul angka secara mandiri saat bimbingan.',
      },
      {
        q: 'Apakah kerahasiaan data kuesioner terjamin?',
        a: 'Data responden Anda tersimpan aman dengan isolasi tingkat baris (Row-Level Security). OlahData tidak membuat, mengisi, atau mengubah data responden. Admin hanya melihat metadata teknis, bukan isi kuesioner. Data Anda tidak pernah dijual atau digunakan untuk melatih model AI.',
      },
      {
        q: 'Apa perbedaan angka kalkulasi dan kalimat penjelasan?',
        a: 'Angka statistik dihitung oleh mesin deterministik berbasis rumus matematika baku, bukan oleh AI. AI hanya membantu menyusun draf kalimat interpretasi dari angka terhitung tersebut, yang wajib Anda periksa dan sesuaikan kembali dengan bahasa Anda sendiri.',
      },
      {
        q: 'Format berkas apa yang dapat diunggah?',
        a: 'Format berkas Excel (.xlsx, .xls) dan CSV dengan struktur tabulasi standar: baris mewakili nomor responden dan kolom mewakili butir pertanyaan instrumen.',
      },
    ],
  },

  // Penanda & Status (Badges)
  badges: {
    computedByEngine: 'Dihitung mesin statistik deterministik (rumus baku, bukan AI)',
    writtenByAI: 'Draf interpretasi (dibantu AI, dari angka terhitung)',
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
      sampleDescription: 'Muat dataset simulasi 120 responden × 18 butir pertanyaan (Konstruk: Kualitas Layanan, Kepuasan, Loyalitas)',
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
      description: 'Kelompokkan butir pertanyaan kuesioner ke konstruk penelitian dan tentukan perannya.',
      independent: 'Variabel Bebas (X)',
      dependent: 'Variabel Terikat (Y)',
      construct: 'Konstruk',
      addConstruct: 'Tambah konstruk baru',
    },
    testSelection: {
      title: 'Pilih uji statistik',
      description: 'Pilih metode uji yang disyaratkan dalam hipotesis penelitian Anda.',
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
    description: 'Halaman ini menyajikan draf Pernyataan Penggunaan Alat untuk lampiran skripsi Anda demi menjaga transparansi akademik.',
    advice: 'Konsultasikan dengan dosen pembimbing mengenai format lampiran yang berlaku di program studi Anda.',
    template: `PERNYATAAN PENGGUNAAN PERANGKAT LUNAK & INTEGRITAS RISET ILMIAH

Judul Penelitian : Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan
Nama Peneliti    : Peneliti / Mahasiswa Penyusun Skripsi
NIM / NRP        : Nomor Pokok Mahasiswa
Program Studi    : Program Studi dan Fakultas Terkait
Perguruan Tinggi : Nama Perguruan Tinggi / Universitas
Dosen Pembimbing : Dosen Pembimbing Utama dan Pendamping

Dengan ini peneliti menyatakan secara terbuka dan jujur bahwa:
1. Orisinalitas Data: Seluruh data numerik yang dianalisis bersumber murni dari jawaban responden asli kuesioner penelitian tanpa manipulasi, pengisian otomatis, atau fabrikasi data.
2. Komputasi Deterministik: Kalkulasi statistik (Validitas Pearson, Reliabilitas Cronbach's Alpha, Asumsi Klasik, dan Regresi Linier Berganda) diproses secara deterministik menggunakan mesin statistik ${APP_NAME} (versi 2.0.0) berbasis modul komputasi ilmiah baku (SciPy, statsmodels, dan NumPy).
3. Transparansi AI: Draf interpretasi teks disusun dengan bantuan modul perumusan narasi kaidah Bab 4 terverifikasi (number guard) dan telah saya periksa, cermati, serta tuliskan kembali menggunakan pemahaman mandiri saya sebagai peneliti.
4. Lampiran Jejak Hitung: Seluruh nilai tabel r, t, dan F serta jejak verifikasi dataset dilampirkan secara transparan pada Lampiran Hasil Analisis Statistik.`,
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
      description: 'Mulai proyek baru untuk mengolah kuesioner Anda, atau coba pelajari dengan dataset simulasi.',
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
      dark: 'Meja Kerja Gelap',
      system: 'Ikuti Perangkat',
    },
    dangerZone: 'Zona Berbahaya',
    deleteAccount: 'Hapus akun dan semua proyek',
  },

  // Lapis Informasi
  layers: {
    layer1Title: 'Intinya',
    layer2Title: 'Tabel Baku Bab 4',
    layer3Title: 'Teks Penjelasan Bab 4',
    aiNote: 'Draf Narasi Bab 4 (Format Baku Skripsi)',
    whatDoesItMean: 'Apa artinya?',
    whatToDo: 'Perlu dilakukan apa?',
    showTrace: 'Lihat cara menghitungnya',
    hideTrace: 'Tutup cara menghitungnya',
    copyTableWord: 'Salin tabel untuk Word',
    copyText: 'Salin teks penjelasan',
    copied: 'Tersalin ke clipboard',
  },

  // Glosarium Istilah Statistik (Bahasa Manusia)
  glossary: {
    alpha: {
      term: "Cronbach's Alpha",
      short: 'Ukuran kekompakan butir kuesioner dalam mengukur variabel yang sama.',
      detail: 'Jika nilainya di atas 0,60 atau 0,70, kuesioner Anda memenuhi kriteria reliabilitas (alfa Cronbach > 0,70) dan layak dipakai penelitian.',
      example: 'Contoh: Nilai 0,92 berarti jawaban responden sangat selaras dan tidak bertolak belakang.',
    },
    vif: {
      term: 'Variance Inflation Factor (VIF)',
      short: 'Deteksi apakah variabel bebas saling tumpang tindih.',
      detail: 'Nilai VIF di bawah 10 (dan Tolerance di atas 0,10) menandakan model regresi bebas dari masalah multikolinearitas.',
      example: 'Contoh: Nilai VIF 1,41 berarti variabel bebas berdiri mandiri tanpa saling mengganggu.',
    },
    pValue: {
      term: 'Nilai Sig. (p-value)',
      short: 'Peluang hubungan atau pengaruh terjadi murni karena kebetulan.',
      detail: 'Jika Sig. < 0,05, pengaruh dinyatakan signifikan pada tingkat kepercayaan 95%.',
      example: 'Contoh: Sig. < 0,001 jauh lebih kecil dari 0,05, artinya pengaruhnya nyata dan dapat dibuktikan.',
    },
    rSquare: {
      term: 'Koefisien Determinasi (R²)',
      short: 'Berapa persen variabel terikat (Y) dijelaskan oleh variabel bebas (X).',
      detail: 'Rentang nilai 0 sampai 1. Sisanya dijelaskan variabel lain di luar model skripsi Anda.',
      example: 'Contoh: R² = 0,55 berarti 55% variasi Y ditentukan oleh X, sementara 45% oleh faktor lain.',
    },
    fStatistic: {
      term: 'Uji F (Simultan)',
      short: 'Uji kelayakan apakah seluruh variabel bebas secara bersama-sama berpengaruh pada Y.',
      detail: 'Jika F hitung > F tabel dan Sig. < 0,05, model regresi dinyatakan layak dan terbukti.',
      example: 'Contoh: Kualitas Layanan dan Kepuasan Pelanggan secara serempak memengaruhi Loyalitas Pelanggan.',
    },
    tStatistic: {
      term: 'Uji t (Parsial)',
      short: 'Uji pengaruh masing-masing variabel bebas secara mandiri terhadap Y.',
      detail: 'Jika t hitung > t tabel dan Sig. < 0,05, variabel tersebut punya pengaruh nyata.',
      example: 'Contoh: Kualitas Layanan secara mandiri berpengaruh signifikan terhadap Loyalitas.',
    },
  },

  // Panduan Tindakan Nyata Saat Asumsi Dilanggar
  actionGuidance: {
    normalitasViolated: {
      title: 'Residual belum berdistribusi normal',
      issue: 'Nilai Sig. Kolmogorov-Smirnov < 0,05.',
      action: 'Periksa data pencilan (outlier) ekstrem pada jawaban responden, atau konsultasikan opsi transformasi data (mis. Logaritma Natural) dengan dosen.',
    },
    multikolViolated: {
      title: 'Terdeteksi multikolinearitas',
      issue: 'Ada nilai VIF > 10 atau Tolerance < 0,10 antar variabel bebas.',
      action: 'Dua variabel bebas kemungkinan terlalu mirip maknanya. Pertimbangkan menggabungkan indikatornya atau mengeluarkan salah satu variabel yang redundan.',
    },
    heteroViolated: {
      title: 'Terjadi gejala heteroskedastisitas',
      issue: 'Nilai Sig. Uji Glejser < 0,05 pada salah satu variabel.',
      action: 'Varians residual tidak konstan. Solusi umum adalah mentransformasikan variabel ke bentuk Ln atau menggunakan metode estimasi robust.',
    },
    validitasFailed: {
      title: 'Butir kuesioner tidak valid',
      issue: 'Nilai r hitung lebih kecil dari r tabel (atau Sig. > 0,05).',
      action: 'Keluarkan butir pertanyaan yang gugur dari perhitungan total variabel, lalu hitung ulang reliabilitasnya.',
    },
    reliabilitasLow: {
      title: "Cronbach's Alpha belum mencukupi",
      issue: "Nilai Alpha berada di bawah batas minimum (0,60).",
      action: 'Lihat kolom "Alpha if Item Deleted". Hapus butir dengan korelasi item-total paling rendah untuk menaikkan nilai Alpha secara otomatis.',
    },
  },

  // Jaminan Ketenangan Mahasiswa
  reassurance: {
    saved: 'Data Anda tersimpan otomatis. Anda bisa istirahat dan lanjut kapan saja.',
    safe: 'Data responden Anda diisolasi privat dan tidak dibagikan ke siapa pun.',
    guidedProgress: 'Anda di sini:',
    stepUpload: '1. Unggah',
    stepValidate: '2. Cek Data',
    stepMap: '3. Petakan',
    stepTest: '4. Pilih Uji',
    stepResult: '5. Hasil Bab 4',
  },

  // Aksi Umum
  common: {
    confirm: 'Konfirmasi',
    cancel: 'Batal',
    save: 'Simpan',
    delete: 'Hapus',
    back: 'Kembali',
    next: 'Lanjut',
  },

  // Footer
  footer: {
    tagline: 'Platform komputasi statistik untuk pengolahan data kuesioner skripsi kuantitatif.',
    links: {
      product: 'Fitur & Layanan',
      legal: 'Etika & Kebijakan',
    },
  },

  // Aksesibilitas
  a11y: {
    tableDescription: 'Tabel hasil analisis statistik berstandar jurnal ilmiah APA 7th Edition tanpa garis vertikal',
    skipToContent: 'Lewati ke konten utama',
    toggleTheme: 'Ganti tema tampilan',
    closeDialog: 'Tutup jendela dialog',
    loading: 'Memuat data...',
  },
} as const;
