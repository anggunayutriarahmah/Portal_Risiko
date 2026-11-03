export interface ImpactCriterionLevel {
  level: number;
  label: string; // e.g. "1 - Insignificant", "2 - Minor", etc.
  description: string;
}

export interface ImpactCriterionCategory {
  id: string;
  title: string;
  columnHeader: string;
  levels: ImpactCriterionLevel[];
}

export const KRITERIA_DAMPAK_RISIKO_DATA: ImpactCriterionCategory[] = [
  {
    id: 'k3',
    title: 'Kriteria Dampak Risiko terhadap K3',
    columnHeader: 'Dampak Kesehatan & Keselamatan Kerja',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Adanya 1 atau lebih karyawan yang mengalami luka ringan & cukup perawatan P3K.'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Karyawan yang mengalami luka ringan & perlu perawatan medis.'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Adanya 1 atau lebih karyawan yang mengalami luka sangat serius (luka berat/diopname kurang dari 1 bulan).'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Adanya 1 atau lebih karyawan yang mengalami luka sangat serius (luka berat/diopname lebih dari 1 bulan) atau mengalami cacat tetap.'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Terjadi kecelakaan kerja yang mengakibatkan 1 korban jiwa atau lebih.'
      }
    ]
  },
  {
    id: 'lingkungan',
    title: 'Kriteria Dampak Risiko terhadap Pencemaran Lingkungan',
    columnHeader: 'Dampak Pencemaran Lingkungan',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Melepaskan B3 (Bahan Kimia Berbahaya & Beracun), sehingga mencapai luas area penyebaran dengan radius sd 650 meter (dalam lingkungan pabrik saja).'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Melepaskan B3 (Bahan Kimia Berbahaya & Beracun), sehingga mencapai luas area penyebaran dengan radius mencapai 1000 meter (masih dalam lingkungan area kompleks PUSRI).'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Melepaskan B3 (Bahan Kimia Berbahaya & Beracun), sehingga mencapai luas area penyebaran yang cukup besar atau dengan radius mencapai 1500 meter.'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Melepaskan B3 (Bahan Kimia Berbahaya & Beracun), sehingga mencapai luas area penyebaran yang besar atau dengan radius mencapai 2000 meter.'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Melepaskan B3 (Bahan Kimia Berbahaya & Beracun), sehingga mencapai luas area penyebaran yang sangat luas atau dengan radius mencapai lebih dari 2000 meter.'
      }
    ]
  },
  {
    id: 'proyek',
    title: 'Kriteria Dampak Risiko terhadap Keterlambatan Proyek / Perbaikan Pabrik',
    columnHeader: 'Keterlambatan Perbaikan Pabrik & Proyek',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Terjadi keterlambatan perbaikan pabrik ≤2,5% dari waktu kontrak proyek | Tidak menyebabkan keterlambatan Progress Proyek dari jadwal Serah Terima'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Terjadi keterlambatan perbaikan pabrik <2,5% - ≤5% dari waktu kontrak proyek | Terjadi keterlambatan Progress Proyek <1% dari jadwal Serah Terima'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Terjadi keterlambatan perbaikan pabrik <5% - ≤10% dari waktu kontrak proyek | Terjadi keterlambatan Progress Proyek 1% - 2% dari jadwal Serah Terima'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Terjadi keterlambatan perbaikan pabrik <10% - ≤20% dari waktu kontrak proyek | Terjadi keterlambatan Progress Proyek 3% - 5% dari jadwal Serah Terima'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Terjadi keterlambatan perbaikan pabrik >20% dari waktu kontrak proyek | Terjadi keterlambatan Progress Proyek >5% dari jadwal Serah Terima'
      }
    ]
  },
  {
    id: 'kpi',
    title: 'Kriteria Dampak Risiko terhadap Pencapaian KPI',
    columnHeader: 'Dampak terhadap Pencapaian KPI',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Target KPI tidak tercapai < 4%'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Target KPI tidak tercapai ≥ 4% sampai < 6%'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Target KPI tidak tercapai ≥ 6% sampai < 8%'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Target KPI tidak tercapai ≥ 8% sampai < 10%'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Target KPI tidak tercapai ≥ 10%'
      }
    ]
  },
  {
    id: 'tuntutan_organisasi',
    title: 'Kriteria Dampak Risiko terhadap Tuntutan Organisasi',
    columnHeader: 'Dampak terhadap Tuntutan Organisasi',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Adanya keluhan dan tuntutan dari suatu kelompok dengan nilai sangat kecil (setara <1% Laba Bersih RKAP)'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Adanya keluhan dan tuntutan dari suatu kelompok dengan nilai kecil (setara >1% - ≤2% Laba Bersih RKAP)'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Adanya keluhan dan tuntutan dari suatu kelompok dengan nilai sedang (setara >2% - ≤3% Laba Bersih RKAP)'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Adanya keluhan dan tuntutan dari suatu kelompok dengan nilai besar (setara >3% - ≤4% Laba Bersih RKAP)'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Menimbulkan gejolak dan tuntutan dari masyarakat dengan nilai sangat besar (setara >4% Laba Bersih RKAP)'
      }
    ]
  },
  {
    id: 'komplain_karyawan',
    title: 'Kriteria Dampak Risiko terhadap Munculnya Komplain Karyawan',
    columnHeader: 'Moral/Motivasi',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Terdapat beberapa komplain dari karyawan.'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Karyawan banyak komplain sehingga menurunkan motivasi kerja.'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Sebagian kecil karyawan mogok kerja (< 100 orang) dan proses kerja tidak terhenti.'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Sebagian besar karyawan mogok kerja (> 100 orang) tetapi proses kerja tidak terhenti.'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Sebagian besar karyawan mogok kerja sehingga proses kerja terhenti.'
      }
    ]
  },
  {
    id: 'tuntutan_masyarakat',
    title: 'Kriteria Dampak Risiko terhadap Munculnya Tuntutan Masyarakat',
    columnHeader: 'Tuntutan Masyarakat',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Ada tuntutan dari masyarakat tetapi tidak berpengaruh terhadap keuangan (setara <1% Laba Bersih RKAP) dan reputasi.'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Ada tuntutan dari masyarakat tetapi berpengaruh kecil terhadap keuangan (setara >1% - 5.2% Laba Bersih RKAP) dan reputasi.'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Ada tuntutan dari masyarakat tetapi berpengaruh sedang terhadap keuangan (setara >2% - ≤3% Laba Bersih RKAP) dan reputasi.'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Ada tuntutan dari masyarakat tetapi berpengaruh cukup besar terhadap keuangan (setara >3% - ≤4% Laba Bersih RKAP) dan reputasi.'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Ada tuntutan dari masyarakat yang berdampak signifikan terhadap keuangan ( setara >4% Laba Bersih RKAP) dan reputasi.'
      }
    ]
  },
  {
    id: 'legal_kontrak',
    title: 'Kriteria Dampak Risiko terhadap Lemahnya Aspek Legal/Kontrak',
    columnHeader: 'Kerugian Keuangan Akibat Lemahnya Aspek Legal/Kontrak',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Ada cacat dalam legal/kontrak sehingga menimbulkan kerugian kecil (setara <1% Laba Bersih RKAP), tetapi bisa segera di ratifikasi.'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Ada cacat dalam legal/kontrak sehingga menimbulkan kerugian kecil (setara >1% - ≤2% Laba Bersih RKAP), yang tidak bisa segera di ratifikasi.'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Ada cacat dalam legal/kontrak sehingga menimbulkan kerugian besar (setara >2% - ≤3% Laba Bersih RKAP), yang tidak bisa segera di ratifikasi.'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Melanggar legal/kontrak sehingga menimbulkan kerugian besar (setara >3% - ≤4% Laba Bersih RKAP), yang tidak bisa segera di ratifikasi.'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Melanggar legal/kontrak sehingga menimbulkan kerugian keuangan sangat besar (>4% Laba Bersih RKAP), yang tidak bisa segera di ratifikasi atau pemutusan kontrak sepihak.'
      }
    ]
  },
  {
    id: 'ledakan',
    title: 'Kriteria Dampak Risiko Ledakan',
    columnHeader: 'Akibat Ledakan',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Kerusakan pada asesoris struktur bangunan - Kaca-kaca pecah - Tekanan 0 - 2 kPa'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: '10% jendela di area pabrik PUSRI pecah - Menimbulkan kerusakan kecil pada struktur bangunan - Tekanan 2 - 9 kPa'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Bahan/batang logam sampai bengkok - Bentuk bangunan/mobil/pipa-pipa sudah menyimpang - Tekanan 9 - 20 kPa'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Sebagian atap bangunan dan lebih dari 50% bagian gedung pecah/rusak - Mesin-mesin pabrik rusak - Menyebabkan kebakaran - Tekanan 20 - 70 kPa'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Kerusakan sudah pada tingkat dahsyat - Struktur bangunan runtuh total - Mesin pabrik hancur - Tekanan > 70 kPa'
      }
    ]
  },
  {
    id: 'ti',
    title: 'Kriteria Dampak Teknologi Informasi',
    columnHeader: 'Teknologi Informasi',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Gangguan sangat minor tanpa downtime signifikan, tidak berdampak pada operasional, hanya bersifat kosmetik atau intermittent ringan.'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Gangguan singkat < 1 jam yang berdampak kecil pada operasional, hanya menyebabkan perlambatan atau kebutuhan refresh sistem.'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Sistem down atau tidak reliabel selama 1–4 jam, memengaruhi beberapa fungsi operasional namun masih dapat ditangani dengan prosedur darurat.'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Sistem tidak tersedia selama 4–12 jam, mengganggu sebagian besar proses bisnis kritikal, menimbulkan backlog dan potensi keterlambatan layanan.'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Gangguan/ketidakter sediaan sistem terjadi > 12 jam atau berulang, menyebabkan terhentinya layanan utama, antrian proses bisnis, potensi kerugian finansial besar, dan kepercayaan pengguna menurun signifikan.'
      }
    ]
  },
  {
    id: 'finansial',
    title: 'Kriteria Dampak Finansial / Kerugian Keuangan',
    columnHeader: 'Kerugian Finansial Terhadap RKAP & Laba Bersih',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Kerugian keuangan ≤ 1% dari Total Aset, Total Pendapatan, EBIT, EBITDA, atau Laba Bersih RKAP.'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Kerugian keuangan > 1% - ≤ 2% dari Total Aset, Total Pendapatan, EBIT, EBITDA, atau Laba Bersih RKAP.'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Kerugian keuangan > 2% - ≤ 3% dari Total Aset, Total Pendapatan, EBIT, EBITDA, atau Laba Bersih RKAP.'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Kerugian keuangan > 3% - ≤ 4% dari Total Aset, Total Pendapatan, EBIT, EBITDA, atau Laba Bersih RKAP.'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Kerugian keuangan > 4% dari Total Aset, Total Pendapatan, EBIT, EBITDA, atau Laba Bersih RKAP.'
      }
    ]
  },
  {
    id: 'operasional',
    title: 'Kriteria Dampak Operasional Pabrik & Kontinuitas Produksi',
    columnHeader: 'Dampak Terhadap Kontinuitas Produksi Pabrik Pusri',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Gangguan teknis/operasional minor < 4 jam, tanpa penurunan target produksi pupuk harian.'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Gangguan operasional 4 - 12 jam atau penurunan volume produksi pupuk < 2% dari target harian.'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Pabrik trip / gangguan operasional 12 - 24 jam atau penurunan volume produksi 2% - ≤ 5%.'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Pabrik unplant shutdown selama 1 - 3 hari atau penurunan kapasitas produksi > 5% - ≤ 10%.'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Pabrik shutdown total > 3 hari berturut-turut atau kehilangan produksi pupuk > 10%, berpotensi mengganggu pasokan pupuk nasional.'
      }
    ]
  },
  {
    id: 'reputasi',
    title: 'Kriteria Dampak terhadap Reputasi & Citra Perusahaan',
    columnHeader: 'Pemberitaan Media & Persepsi Stakeholder',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Isu internal minor atau keluhan lokal dengan cakupan terbatas, tidak ada publikasi media massa.'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Pemberitaan di media lokal tanpa sentimen negatif berkepanjangan terhadap reputasi korporat Pusri.'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Pemberitaan di media massa regional dengan sentimen negatif dan memerlukan klarifikasi resmi dari manajemen.'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Pemberitaan nasional yang intensif dengan sorotan tajam publik dan desakan audit dari regulator/kementerian.'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Pemberitaan internasional dan nasional skala krisis yang merusak kredibilitas BUMN, memicu boikot atau intervensi hukum tingkat tinggi.'
      }
    ]
  },
  {
    id: 'regulasi_hukum',
    title: 'Kriteria Dampak terhadap Kepatuhan Hukum & Sanksi Regulator',
    columnHeader: 'Sanksi Hukum & Tindakan Regulator Pemerintah',
    levels: [
      {
        level: 1,
        label: '1 - Insignificant',
        description: 'Pelanggaran administratif sangat minor dengan teguran lisan tanpa penetapan sanksi denda.'
      },
      {
        level: 2,
        label: '2 - Minor',
        description: 'Surat teguran/peringatan tertulis pertama dari dinas/instansi terkait dengan batas pemenuhan standar.'
      },
      {
        level: 3,
        label: '3 - Moderate',
        description: 'Sanksi denda administratif ringan serta penetapan pengawasan berkala oleh otoritas regulator.'
      },
      {
        level: 4,
        label: '4 - Major',
        description: 'Sanksi pembekuan izin operasional fasilitas tertentu atau proses tuntutan hukum di pengadilan.'
      },
      {
        level: 5,
        label: '5 - Catastrophic',
        description: 'Pencabutan izin usaha operasional pabrik, sanksi pidana korporasi, atau gugatan hukum berskala besar.'
      }
    ]
  }
];
