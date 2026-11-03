import type { PusriRisk, OrganizationMaster, MasterChecklistItem, SopStage } from '../types/pusri.ts';

export const INITIAL_RISKS: PusriRisk[] = [
  // 1. CONTOH TINGKAT RISIKO: HIGH (Skor 17 - 25)
  {
    id: 'RSK-2026-001',
    kodeRisiko: 'RSK-2026-001',
    kodeOrganisasi: 'OP-IIB',
    namaOrganisasi: 'Departemen Operasi Pabrik Pusri IIB',
    tahun: 2026,
    sasaranRKAP: 'Pencapaian Target Produksi Urea IIB Sebesar 570.000 Ton/Tahun',
    sasaranUnitKerja: 'Menjaga On-Stream Factor (OSF) Pabrik di Atas 92%',
    konteksEksternal: 'Fluktuasi Pasokan Gas Alam Kompresi dari Pipa Transmisi Sumatera Bagian Selatan',
    konteksInternal: 'Keandalan Reboiler 101-C & Kompresor Sintesis Gas Syn-Gas',
    sumberRisiko: 'Operasional Pabrik Pupuk & Pasokan Bahan Baku',
    pernyataanRisiko: 'Potensi Unplanned Shutdown Pabrik IIB Akibat Penurunan Tekanan Pasokan Gas Alam Di Bawah Ambang Kritis 24 Barg',
    penyebabRisiko: 'Gangguan teknis kompresor boosting booster station supplier gas dan endapan kondensat pipa',
    dampakRisiko: 'Hilangnya volume produksi Urea estimasi 1.700 Ton/hari dan kerugian operasional flaring gas',
    pengendalianExisting: 'Monitoring tekanan gas real-time di Central Control Room (CCR) dan SOP interlock safety trip',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'operasional_5',
    kriteriaDampakTitle: 'Kriteria Dampak Operasional Pabrik & Kontinuitas Produksi',
    kriteriaDampakLevel: 5,
    kemungkinanAwal: 4,
    dampakAwal: 5,
    inherentScore: 20,
    tingkatRisikoAwal: 'High',
    currentTingkatRisiko: 'High',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Pemasangan Dual-Line Pressure Regulating Skid & Perjanjian Service Level Agreement (SLA) Tekanan Gas dengan PGN',
    targetWaktuMitigasi: 'TW 2',
    biayaRencanaPengendalian: 450000000,
    picDepartemen: 'Departemen Operasi Pabrik Pusri IIB',
    picPelaksana: 'Departemen Operasi Pabrik Pusri IIB',
    picPengendali: 'Departemen Operasi Pabrik Pusri IIB',
    jenisAnggaran: 'Capex Proyek',
    statusWorkflow: 'Disetujui_Dalam_Pengendalian',
    pelaksanaanTindakan: [
      {
        id: 'ACT-RSK-2026-001-01',
        riskId: 'RSK-2026-001',
        kodeRisiko: 'RSK-2026-001',
        tanggalPelaksanaan: '2026-02-15',
        picPelaksana: 'Departemen Operasi Pabrik Pusri IIB',
        uraianTindakan: 'Pemasangan Dual-Line Pressure Regulating Skid & Perjanjian Service Level Agreement (SLA) Tekanan Gas dengan PGN',
        progressPersen: 65,
        statusPelaksanaan: 'Sedang Berjalan',
        realisasiBiaya: 120000000,
        efektivitas: 'Cukup Efektif',
        kendalaDanHambatan: 'Menunggu clearance Bea Cukai untuk impor valve regulator cadangan',
        tindakLanjut: 'Akselerasi perizinan dan koordinasi teknis vendor',
        nomorBuktiDokumen: 'MEMO/PUSRI/RSK-2026-001/2026',
        catatanAdmin: 'Telah diverifikasi Admin sesuai SOP Pusri 2026.',
        diperbaruiOleh: 'Departemen Operasi Pabrik Pusri IIB',
        createdAt: '2026-02-15T08:30:00Z',
        updatedAt: '2026-02-15T08:30:00Z'
      }
    ],
    statusPelaksanaanTerakhir: 'Sedang Berjalan',
    progressPelaksanaanTerakhir: 65,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Finalisasi engineering drawing PRS skid dan tender vendor fabrikasi',
        realisasiBiaya: 120000000,
        progressPersen: 65,
        kemungkinanResidual: 4,
        dampakResidual: 5,
        tingkatResidual: 'High',
        statusPengendalian: 'On Track',
        kendalaDanTindakLanjut: 'Pengiriman valve spesifik import masih menunggu clearance Bea Cukai Tanjung Api-Api',
        statusKeputusan: 'Pengendalian_Lanjutan',
        picDepartemenBaru: 'Departemen Pemeliharaan Listrik & Instrumen',
        picPelaksanaBaru: 'Departemen Pemeliharaan Listrik & Instrumen',
        picPengendaliBaru: 'Departemen Pemeliharaan Listrik & Instrumen',
        targetWaktuLanjutan: 'TW 2',
        pengendalianLanjutanDesc: 'Lakukan percepatan clearance Bea Cukai dan koordinasi fabrikasi skid bersama tim instrumentasi lapangan.',
        catatanEvaluasiAdmin: 'Kemajuan fisik TW 1 mencapai 65%, namun pengadaan katup impor masih berlangsung. Risiko dialihkan ke TW 2 dengan penugasan PIC Departemen baru.',
        tanggalEvaluasi: '2026-03-30',
        dievaluasiOleh: 'Risk Admin Korporat',
        updatedAt: '2026-03-30T10:00:00Z'
      }
    ],
    createdDate: '2026-01-10T08:00:00Z',
    updatedDate: '2026-03-30T10:00:00Z',
    createdBy: 'Officer Risk Pabrik IIB'
  },

  // 2. CONTOH TINGKAT RISIKO: MOD TO HIGH (Skor 12 - 16)
  {
    id: 'RSK-2026-002',
    kodeRisiko: 'RSK-2026-002',
    kodeOrganisasi: 'HAR-MEK',
    namaOrganisasi: 'Departemen Pemeliharaan Mekanikal',
    tahun: 2026,
    sasaranRKAP: 'Zero Unplanned Downtime Peralatan Kritis Pabrik Pupuk',
    sasaranUnitKerja: 'Mean Time Between Failures (MTBF) Rotating Equipment > 8.000 Jam',
    konteksEksternal: 'Lead Time Pengadaan Spare Parts Turbin dan Mechanical Seal dari Manufaktur Eropa > 6 Bulan',
    konteksInternal: 'Jadwal Turn Around (TA) Terjadwal Bulan Oktober 2026',
    sumberRisiko: 'Keterlambatan Suku Cadang Kritis Turn Around',
    pernyataanRisiko: 'Keterlambatan Pengiriman Rotor Turbin PKS-101 yang Berisiko Mengulur Durasi Turn Around (TA) Lebih dari 7 Hari',
    penyebabRisiko: 'Keterbatasan slot penerbangan cargo logistik internasional dan audit sertifikasi material ASME',
    dampakRisiko: 'Keterlambatan start-up pabrik pasca turnaround, biaya sewa crane dan overstay kontraktor harian',
    pengendalianExisting: 'Buffer stock sebagian seal kit dan monitoring tracking mingguan procurement',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'proyek_4',
    kriteriaDampakTitle: 'Kriteria Dampak Risiko terhadap Keterlambatan Proyek / Perbaikan Pabrik',
    kriteriaDampakLevel: 4,
    kemungkinanAwal: 4,
    dampakAwal: 4,
    inherentScore: 16,
    tingkatRisikoAwal: 'Mod to High',
    currentTingkatRisiko: 'Mod to High',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Akselerasi Purchase Order dengan Klausul Penalty Late Delivery dan Expediting On-Site Inspector di Workshop Manufaktur',
    targetWaktuMitigasi: 'TW 3',
    biayaRencanaPengendalian: 180000000,
    picDepartemen: 'Departemen Pemeliharaan Mekanikal',
    picPelaksana: 'Departemen Pemeliharaan Mekanikal',
    picPengendali: 'Departemen Pemeliharaan Mekanikal',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Disetujui_Dalam_Pengendalian',
    pelaksanaanTindakan: [
      {
        id: 'ACT-RSK-2026-002-01',
        riskId: 'RSK-2026-002',
        kodeRisiko: 'RSK-2026-002',
        tanggalPelaksanaan: '2026-02-20',
        picPelaksana: 'Departemen Pemeliharaan Mekanikal',
        uraianTindakan: 'Inspector PT Surveyor Indonesia diberangkatkan untuk Factory Acceptance Inspection',
        progressPersen: 40,
        statusPelaksanaan: 'Sedang Berjalan',
        realisasiBiaya: 75000000,
        efektivitas: 'Cukup Efektif',
        kendalaDanHambatan: 'Proses machining rotor mencapai 80%, menunggu jadwal kapal kargo',
        tindakLanjut: 'Monitoring tracking logistik mingguan',
        nomorBuktiDokumen: 'MEMO/PUSRI/RSK-2026-002/2026',
        catatanAdmin: 'Telah disetujui monitoring berkala.',
        diperbaruiOleh: 'Departemen Pemeliharaan Mekanikal',
        createdAt: '2026-02-20T09:00:00Z',
        updatedAt: '2026-02-20T09:00:00Z'
      }
    ],
    statusPelaksanaanTerakhir: 'Sedang Berjalan',
    progressPelaksanaanTerakhir: 40,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Inspector PT Surveyor Indonesia diberangkatkan untuk Factory Acceptance Inspection',
        realisasiBiaya: 75000000,
        progressPersen: 40,
        progressFisikPic: 40,
        progresPengerjaanAdmin: 40,
        kemungkinanResidual: 3,
        dampakResidual: 4,
        tingkatResidual: 'Mod to High',
        kemungkinanUsulanPic: 3,
        dampakUsulanPic: 3,
        tingkatUsulanPic: 'Moderate',
        catatanUsulanPic: 'Berdasarkan pengawasan langsung inspektur di workshop manufaktur, kendala sertifikasi ASME teratasi dan pengapian rotor selesai 80%. Kami mengusulkan penurunan tingkat risiko menjadi Moderate (Kemungkinan 3, Dampak 3).',
        statusPengendalian: 'On Track',
        reportedBy: 'Departemen Pemeliharaan Mekanikal',
        picReportDate: '2026-02-20',
        kendalaDanTindakLanjut: 'Progres machining rotor mencapai 80%, ETA pelabuhan Boom Baru Palembang Agustus 2026',
        updatedAt: '2026-03-25T14:30:00Z'
      }
    ],
    createdDate: '2026-01-15T09:15:00Z',
    updatedDate: '2026-03-25T14:30:00Z',
    createdBy: 'Officer Risk Pemeliharaan'
  },

  // 3. CONTOH TINGKAT RISIKO: MODERATE (Skor 8 - 11)
  {
    id: 'RSK-2026-003',
    kodeRisiko: 'RSK-2026-003',
    kodeOrganisasi: 'K3',
    namaOrganisasi: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
    tahun: 2026,
    sasaranRKAP: 'Zero Incident Fatality dan Penerapan Budaya K3 Berkelanjutan',
    sasaranUnitKerja: 'Inspeksi Integritas Jalur Pipa Bahan Berbahaya & Beracun (B3) 100%',
    konteksEksternal: 'Pengawasan Kepatuhan Keselamatan Kerja Kimia oleh Kementerian Ketenagakerjaan',
    konteksInternal: 'Kepadatan Fasilitas Tangki Amoniak dan Jalur Distribusi Tekanan Tinggi',
    sumberRisiko: 'Keselamatan Kerja & Pengendalian Bahan Kimia Berbahaya',
    pernyataanRisiko: 'Potensi Paparan Gas Amonia pada Area Tangki Penyimpanan Akibat Penurunan Integritas Gasket Flange Pipa Distribusi',
    penyebabRisiko: 'Degradasi material gasket akibat paparan cuaca tropis ekstrem dan vibrasi sirkulasi pompa pengisi',
    dampakRisiko: 'Potensi iritasi saluran pernapasan pekerja lapangan, penghentian sementara pekerjaan transfer, dan laporan insiden near-miss',
    pengendalianExisting: 'Detektor gas amonia terpasang di 6 perimeter dan ketersediaan breathing apparatus mandiri',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'k3_3',
    kriteriaDampakTitle: 'Kriteria Dampak Risiko terhadap K3',
    kriteriaDampakLevel: 3,
    kemungkinanAwal: 3,
    dampakAwal: 3,
    inherentScore: 9,
    tingkatRisikoAwal: 'Moderate',
    currentTingkatRisiko: 'Moderate',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Penggantian Rutin Gasket Spiral Wound Tahan Kimia dan Kalibrasi Sensor Deteksi Dini Amonia Multi-Titik',
    targetWaktuMitigasi: 'TW 2',
    biayaRencanaPengendalian: 85000000,
    picDepartemen: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
    picPelaksana: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
    picPengendali: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Disetujui_Dalam_Pengendalian',
    pelaksanaanTindakan: [
      {
        id: 'ACT-RSK-2026-003-01',
        riskId: 'RSK-2026-003',
        kodeRisiko: 'RSK-2026-003',
        tanggalPelaksanaan: '2026-02-25',
        picPelaksana: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
        uraianTindakan: 'Penggantian 40 set gasket jalur manifold amoniak dan re-kalibrasi sensor alarm',
        progressPersen: 50,
        statusPelaksanaan: 'Sedang Berjalan',
        realisasiBiaya: 40000000,
        efektivitas: 'Efektif',
        kendalaDanHambatan: 'Jadwal pergantian harus sinkron dengan window transfer amoniak',
        tindakLanjut: 'Koordinasi shift harian dermaga',
        nomorBuktiDokumen: 'MEMO/PUSRI/RSK-2026-003/2026',
        catatanAdmin: 'Terpantau baik.',
        diperbaruiOleh: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
        createdAt: '2026-02-25T10:00:00Z',
        updatedAt: '2026-02-25T10:00:00Z'
      }
    ],
    statusPelaksanaanTerakhir: 'Sedang Berjalan',
    progressPelaksanaanTerakhir: 50,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Penggantian 40 set gasket jalur manifold amoniak dan re-kalibrasi sensor alarm',
        realisasiBiaya: 40000000,
        progressPersen: 50,
        progressFisikPic: 50,
        progresPengerjaanAdmin: 50,
        kemungkinanResidual: 2,
        dampakResidual: 3,
        tingkatResidual: 'Low to Mod',
        kemungkinanUsulanPic: 2,
        dampakUsulanPic: 3,
        tingkatUsulanPic: 'Low to Mod',
        catatanUsulanPic: 'Penggantian 40 set gasket berhasil diselesaikan dan tes kebocoran helium mencapai zero ppm gas leak. Kami mengusulkan tingkatan risiko turun ke Low to Mod (Kemungkinan 2, Dampak 3).',
        statusPengendalian: 'On Track',
        reportedBy: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
        picReportDate: '2026-02-25',
        kendalaDanTindakLanjut: 'Pengujian kebocoran helium test menunjukkan zero ppm gas leak.',
        updatedAt: '2026-03-26T10:00:00Z'
      }
    ],
    createdDate: '2026-01-18T10:00:00Z',
    updatedDate: '2026-03-26T10:00:00Z',
    createdBy: 'Officer Risk K3'
  },

  // 4. CONTOH TINGKAT RISIKO: LOW TO MOD (Skor 4 - 7)
  {
    id: 'RSK-2026-004',
    kodeRisiko: 'RSK-2026-004',
    kodeOrganisasi: 'TI',
    namaOrganisasi: 'Departemen Teknologi Informasi',
    tahun: 2026,
    sasaranRKAP: 'Keandalan Infrastruktur Enterprise Resource Planning (ERP) & Otomasi Pabrik',
    sasaranUnitKerja: 'Ketersediaan Jaringan Backbone Antar Fasilitas Pabrik > 99.9%',
    konteksEksternal: 'Aktivitas Pekerjaan Konstruksi dan Penggalian Infrastruktur di Kompleks Pabrik',
    konteksInternal: 'Konektivitas Fiber Optic Antara Gedung Utama dan DCS Pabrik Pupuk',
    sumberRisiko: 'Infrastruktur Jaringan dan Komunikasi Data',
    pernyataanRisiko: 'Potensi Latensi Jaringan Fiber Optic Antar Pabrik Akibat Kerusakan Fisik Kabel Bawah Tanah Saat Pekerjaan Konstruksi Sipil',
    penyebabRisiko: 'Pekerjaan galian drainase tanpa koordinasi rute utilitas kabel transmisi bawah tanah',
    dampakRisiko: 'Penurunan kecepatan transfer data monitoring proses dan ketergantungan sementara pada jalur wireless backup',
    pengendalianExisting: 'Peta rute kabel bawah tanah dan penandaan patok jalur kabel',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'ti_3',
    kriteriaDampakTitle: 'Kriteria Dampak Teknologi Informasi',
    kriteriaDampakLevel: 3,
    kemungkinanAwal: 2,
    dampakAwal: 3,
    inherentScore: 6,
    tingkatRisikoAwal: 'Low to Mod',
    currentTingkatRisiko: 'Low to Mod',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Penerapan Jalur Redundan Ring FO Sekunder dan Prosedur Izin Penggalian Terpadu (Permit to Dig)',
    targetWaktuMitigasi: 'TW 2',
    biayaRencanaPengendalian: 65000000,
    picDepartemen: 'Departemen Teknologi Informasi',
    picPelaksana: 'Departemen Teknologi Informasi',
    picPengendali: 'Departemen Teknologi Informasi',
    jenisAnggaran: 'Investasi Rutin',
    statusWorkflow: 'Disetujui_Dalam_Pengendalian',
    pelaksanaanTindakan: [
      {
        id: 'ACT-RSK-2026-004-01',
        riskId: 'RSK-2026-004',
        kodeRisiko: 'RSK-2026-004',
        tanggalPelaksanaan: '2026-02-28',
        picPelaksana: 'Departemen Teknologi Informasi',
        uraianTindakan: 'Pemasangan penanda beton rute FO dan pengaktifan modul auto-failover link sekunder',
        progressPersen: 60,
        statusPelaksanaan: 'Sedang Berjalan',
        realisasiBiaya: 30000000,
        efektivitas: 'Efektif',
        kendalaDanHambatan: 'Koordinasi perizinan penggalian dengan pihak sipil',
        tindakLanjut: 'Pemberian plang rambu utilitas bawah tanah',
        nomorBuktiDokumen: 'MEMO/PUSRI/RSK-2026-004/2026',
        catatanAdmin: 'Sesuai prosedur proteksi TI.',
        diperbaruiOleh: 'Departemen Teknologi Informasi',
        createdAt: '2026-02-28T11:00:00Z',
        updatedAt: '2026-02-28T11:00:00Z'
      }
    ],
    statusPelaksanaanTerakhir: 'Sedang Berjalan',
    progressPelaksanaanTerakhir: 60,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Pemasangan penanda beton rute FO dan pengaktifan modul auto-failover link sekunder',
        realisasiBiaya: 30000000,
        progressPersen: 60,
        kemungkinanResidual: 1,
        dampakResidual: 3,
        tingkatResidual: 'Low',
        statusPengendalian: 'On Track',
        kendalaDanTindakLanjut: 'Failover testing sukses dengan waktu pemulihan koneksi di bawah 1 detik.',
        updatedAt: '2026-03-24T15:30:00Z'
      }
    ],
    createdDate: '2026-01-22T11:00:00Z',
    updatedDate: '2026-03-24T15:30:00Z',
    createdBy: 'Officer Risk TI'
  },

  // 5. CONTOH TINGKAT RISIKO: LOW (Skor 1 - 3)
  {
    id: 'RSK-2026-005',
    kodeRisiko: 'RSK-2026-005',
    kodeOrganisasi: 'SDM-ORG',
    namaOrganisasi: 'Departemen Pengembangan SDM & Organisasi',
    tahun: 2026,
    sasaranRKAP: 'Peningkatan Kompetensi dan Sertifikasi Tenaga Kerja Pusri',
    sasaranUnitKerja: 'Ketercapaian Mandays Training Karyawan > 4 Hari/Orang/Tahun',
    konteksEksternal: 'Pembaruan Standar Kompetensi Kerja Nasional Indonesia (SKKNI) Bidang Industri Pupuk',
    konteksInternal: 'Jadwal Giliran Shift Regu Operasional Pabrik yang Padat',
    sumberRisiko: 'Pengelolaan Pelatihan & Pengembangan Karyawan',
    pernyataanRisiko: 'Keterlambatan Pembaruan Sertifikasi Kompetensi Operator Pabrik Akibat Benturan Jadwal Giliran Shift Operasional',
    penyebabRisiko: 'Kebutuhan kehadiran penuh operator di pos kontrol saat beban produksi tinggi',
    dampakRisiko: 'Penundaan jadwal uji sertifikasi berkala dan administrasi perpanjangan lisensi operator',
    pengendalianExisting: 'Penyusunan kalender training tahunan dan sistem modul self-paced learning',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'komplain_karyawan_2',
    kriteriaDampakTitle: 'Kriteria Dampak Risiko terhadap Munculnya Komplain Karyawan',
    kriteriaDampakLevel: 2,
    kemungkinanAwal: 1,
    dampakAwal: 2,
    inherentScore: 2,
    tingkatRisikoAwal: 'Low',
    currentTingkatRisiko: 'Low',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: false,
    rencanaPenanganan: 'Penerapan Sistem Pembelajaran Daring (E-Learning LMS Pusri) Mandiri dan Matriks Rotasi Training Fleksibel',
    targetWaktuMitigasi: 'TW 1',
    biayaRencanaPengendalian: 25000000,
    picDepartemen: 'Departemen Pengembangan SDM & Organisasi',
    picPelaksana: 'Departemen Pengembangan SDM & Organisasi',
    picPengendali: 'Departemen Pengembangan SDM & Organisasi',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Disetujui_Dalam_Pengendalian',
    pelaksanaanTindakan: [
      {
        id: 'ACT-RSK-2026-005-01',
        riskId: 'RSK-2026-005',
        kodeRisiko: 'RSK-2026-005',
        tanggalPelaksanaan: '2026-03-01',
        picPelaksana: 'Departemen Pengembangan SDM & Organisasi',
        uraianTindakan: 'Peluncuran modul mikro LMS interaktif dapat diakses mandiri lewat perangkat mobile',
        progressPersen: 80,
        statusPelaksanaan: 'Sedang Berjalan',
        realisasiBiaya: 20000000,
        efektivitas: 'Efektif',
        kendalaDanHambatan: 'Sosialisasi aplikasi kepada pekerja shift malam',
        tindakLanjut: 'Pemberian sesi tutorial singkat 15 menit',
        nomorBuktiDokumen: 'MEMO/PUSRI/RSK-2026-005/2026',
        catatanAdmin: 'Program inovasi SDM berjalan baik.',
        diperbaruiOleh: 'Departemen Pengembangan SDM & Organisasi',
        createdAt: '2026-03-01T08:00:00Z',
        updatedAt: '2026-03-01T08:00:00Z'
      }
    ],
    statusPelaksanaanTerakhir: 'Sedang Berjalan',
    progressPelaksanaanTerakhir: 80,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Peluncuran modul mikro LMS interaktif dapat diakses mandiri lewat perangkat mobile',
        realisasiBiaya: 20000000,
        progressPersen: 80,
        kemungkinanResidual: 1,
        dampakResidual: 1,
        tingkatResidual: 'Low',
        statusPengendalian: 'On Track',
        kendalaDanTindakLanjut: 'Tingkat kelulusan tes pemahaman mandiri operator mencapai 96%.',
        updatedAt: '2026-03-22T09:00:00Z'
      }
    ],
    createdDate: '2026-01-25T14:00:00Z',
    updatedDate: '2026-03-22T09:00:00Z',
    createdBy: 'Officer Risk SDM'
  },

  // 6. CONTOH KATEGORI KEUANGAN: VOLATILITAS KURS VALAS (Mod to High / Moderate)
  {
    id: 'RSK-2026-006',
    kodeRisiko: 'RSK-2026-006',
    kodeOrganisasi: 'KEU-AKUN',
    namaOrganisasi: 'Departemen Keuangan & Akuntansi',
    tahun: 2026,
    sasaranRKAP: 'Optimalisasi Cash Flow & Manajemen Risiko Finansial Korporat',
    sasaranUnitKerja: 'Efisiensi Beban Pokok Penjualan dan Manajemen Valuta Asing (Hedging > 85%)',
    konteksEksternal: 'Volatilitas Kurs Dollar AS (USD/IDR) terhadap Pembelian Gas Bumi Komersial dan Katalis Impor',
    konteksInternal: 'Kebutuhan Likuiditas Valas untuk Pembayaran Tagihan Bahan Baku Berkala',
    sumberRisiko: 'Volatilitas Nilai Tukar Valuta Asing & Inflasi Global',
    pernyataanRisiko: 'Potensi Pembengkakan Biaya Pembelian Gas Alam dan Katalis Impor Akibat Pelemahan Nilai Tukar Rupiah Terhadap USD Melebihi Asumsi RKAP Rp 16.200/USD',
    penyebabRisiko: 'Kenaikan suku bunga global dan ketidakpastian geopolitik rantai pasok energi dunia',
    dampakRisiko: 'Peningkatan Beban Pokok Produksi (HPP) pupuk dan penurunan margin laba operasional',
    pengendalianExisting: 'Monitoring harian kurs Bank Indonesia dan negosiasi fasilitas hedging treasury perbankan BUMN',
    kategoriRisiko: 'Keuangan',
    kriteriaDampakKey: 'finansial_4',
    kriteriaDampakTitle: 'Kriteria Dampak Finansial / Kerugian Keuangan',
    kriteriaDampakLevel: 4,
    kemungkinanAwal: 3,
    dampakAwal: 4,
    inherentScore: 12,
    tingkatRisikoAwal: 'Mod to High',
    currentTingkatRisiko: 'Moderate',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Eksekusi Transaksi Forward Hedging Lindung Nilai Kurs dengan Bank Himbara dan Percepatan Pencairan Piutang Ekspor Valas',
    targetWaktuMitigasi: 'TW 2',
    biayaRencanaPengendalian: 150000000,
    picDepartemen: 'Departemen Keuangan & Akuntansi',
    picPelaksana: 'Departemen Keuangan & Akuntansi',
    picPengendali: 'Departemen Keuangan & Akuntansi',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Disetujui_Dalam_Pengendalian',
    pelaksanaanTindakan: [
      {
        id: 'ACT-RSK-2026-006-01',
        riskId: 'RSK-2026-006',
        kodeRisiko: 'RSK-2026-006',
        tanggalPelaksanaan: '2026-02-18',
        picPelaksana: 'Departemen Keuangan & Akuntansi',
        uraianTindakan: 'Eksekusi transaksi hedging forward contract senilai USD 15 Juta pada rate lindung nilai kompetitif',
        progressPersen: 70,
        statusPelaksanaan: 'Sedang Berjalan',
        realisasiBiaya: 75000000,
        efektivitas: 'Efektif',
        kendalaDanHambatan: 'Volatilitas harian pasar valas spot',
        tindakLanjut: 'Review berkala bersama komite treasury korporat',
        nomorBuktiDokumen: 'MEMO/PUSRI/RSK-2026-006/2026',
        catatanAdmin: 'Hedging lindung nilai berjalan baik.',
        diperbaruiOleh: 'Departemen Keuangan & Akuntansi',
        createdAt: '2026-02-18T09:00:00Z',
        updatedAt: '2026-02-18T09:00:00Z'
      }
    ],
    statusPelaksanaanTerakhir: 'Sedang Berjalan',
    progressPelaksanaanTerakhir: 70,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Eksekusi transaksi hedging forward contract senilai USD 15 Juta pada rate lindung nilai kompetitif',
        realisasiBiaya: 75000000,
        progressPersen: 70,
        kemungkinanResidual: 2,
        dampakResidual: 4,
        tingkatResidual: 'Moderate',
        statusPengendalian: 'On Track',
        kendalaDanTindakLanjut: 'Risiko fluktuasi kurs terkendali dalam batas toleransi anggaran belanja bahan baku.',
        updatedAt: '2026-03-27T11:00:00Z'
      }
    ],
    createdDate: '2026-01-26T10:00:00Z',
    updatedDate: '2026-03-27T11:00:00Z',
    createdBy: 'Officer Risk Keuangan'
  },

  // 7. CONTOH KATEGORI HUKUM & KEPATUHAN: SENGKETA DISTRIBUSI SUBSIDI (Moderate -> Low to Mod)
  {
    id: 'RSK-2026-007',
    kodeRisiko: 'RSK-2026-007',
    kodeOrganisasi: 'HUKUM',
    namaOrganisasi: 'Departemen Hukum (Corporate Legal)',
    tahun: 2026,
    sasaranRKAP: 'Kepatuhan Tata Kelola Hukum (Good Corporate Governance) dan Zero Dispute',
    sasaranUnitKerja: 'Penyelesaian dan Mitigasi Risiko Sengketa Kontrak Kerjasama Distribusi 100%',
    konteksEksternal: 'Penerapan Regulasi Ketat Pengawasan Penyaluran Pupuk Bersubsidi oleh BPK dan Satgas Pangan',
    konteksInternal: 'Digitalisasi Surat Perjanjian Jual Beli (SPJB) Distributor dan Kios Pengecer Lengkap (KPL)',
    sumberRisiko: 'Kepatuhan Regulasi Distribusi & Sengketa Kontrak Mitra Niaga',
    pernyataanRisiko: 'Potensi Tuntutan Hukum dan Sengketa Klaim Penyaluran Pupuk Bersubsidi Akibat Ketidaksesuaian Data e-Verval Kios dengan Alokasi Resmi Dinas Pertanian',
    penyebabRisiko: 'Keterlambatan pembaruan data e-Alokasi petani dan keterbatasan literasi digital kios di daerah terpencil',
    dampakRisiko: 'Penundaan pencairan verifikasi subsidi pupuk dari pemerintah dan risiko audit kepatuhan eksternal',
    pengendalianExisting: 'Standarisasi draft SPJB berbadan hukum, pendampingan legal review, dan rekonsiliasi data mingguan',
    kategoriRisiko: 'Hukum & Kepatuhan',
    kriteriaDampakKey: 'regulasi_hukum_3',
    kriteriaDampakTitle: 'Kriteria Dampak terhadap Kepatuhan Hukum & Sanksi Regulator',
    kriteriaDampakLevel: 3,
    kemungkinanAwal: 3,
    dampakAwal: 3,
    inherentScore: 9,
    tingkatRisikoAwal: 'Moderate',
    currentTingkatRisiko: 'Low to Mod',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Audit Kepatuhan Lapangan Sampling Distributor KPL dan Penyempurnaan Klausal Kontrak Digital Terintegrasi dengan Tanda Tangan Elektronik Tersertifikasi BSrE',
    targetWaktuMitigasi: 'TW 2',
    biayaRencanaPengendalian: 80000000,
    picDepartemen: 'Departemen Hukum (Corporate Legal)',
    picPelaksana: 'Departemen Hukum (Corporate Legal)',
    picPengendali: 'Departemen Hukum (Corporate Legal)',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Disetujui_Dalam_Pengendalian',
    pelaksanaanTindakan: [
      {
        id: 'ACT-RSK-2026-007-01',
        riskId: 'RSK-2026-007',
        kodeRisiko: 'RSK-2026-007',
        tanggalPelaksanaan: '2026-02-22',
        picPelaksana: 'Departemen Hukum (Corporate Legal)',
        uraianTindakan: 'Sosialisasi klausul mitigasi kepatuhan hukum pada kontrak SPJB distributor di 5 rayon pemasaran utama',
        progressPersen: 60,
        statusPelaksanaan: 'Sedang Berjalan',
        realisasiBiaya: 45000000,
        efektivitas: 'Efektif',
        kendalaDanHambatan: 'Penyesuaian jadwal verifikasi dokumen legal',
        tindakLanjut: 'Penyediaan template checklist digital',
        nomorBuktiDokumen: 'MEMO/PUSRI/RSK-2026-007/2026',
        catatanAdmin: 'Compliance legal tervalidasi.',
        diperbaruiOleh: 'Departemen Hukum (Corporate Legal)',
        createdAt: '2026-02-22T10:00:00Z',
        updatedAt: '2026-02-22T10:00:00Z'
      }
    ],
    statusPelaksanaanTerakhir: 'Sedang Berjalan',
    progressPelaksanaanTerakhir: 60,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Sosialisasi klausul mitigasi kepatuhan hukum pada kontrak SPJB distributor di 5 rayon pemasaran utama',
        realisasiBiaya: 45000000,
        progressPersen: 60,
        kemungkinanResidual: 2,
        dampakResidual: 3,
        tingkatResidual: 'Low to Mod',
        statusPengendalian: 'On Track',
        kendalaDanTindakLanjut: '98% distributor telah menandatangani pakta integritas dan addendum perlindungan hukum.',
        updatedAt: '2026-03-28T14:00:00Z'
      }
    ],
    createdDate: '2026-01-27T11:00:00Z',
    updatedDate: '2026-03-28T14:00:00Z',
    createdBy: 'Officer Risk Legal'
  },

  // 8. CONTOH KATEGORI OPERASIONAL / LINGKUNGAN: BAKU MUTU EFFLUENT IPAL (Moderate -> Low to Mod)
  {
    id: 'RSK-2026-008',
    kodeRisiko: 'RSK-2026-008',
    kodeOrganisasi: 'LH',
    namaOrganisasi: 'Departemen Lingkungan Hidup',
    tahun: 2026,
    sasaranRKAP: 'Pertahankan Predikat PROPER Emas Kementerian LHK dan Zero Environmental Incident',
    sasaranUnitKerja: 'Kepatuhan Baku Mutu Air Limbah dan Emisi Udara Pabrik 100% Sesuai Permen LHK',
    konteksEksternal: 'Batas Baku Mutu Emisi Industri Kimia & Amonia Sesuai Regulasi Terkini KLHK',
    konteksInternal: 'Kapasitas Aerasi dan Kolam Ekualisasi IPAL Pabrik saat Beban Operasional Maksimum',
    sumberRisiko: 'Pengelolaan Lingkungan Hidup & Baku Mutu Emisi/Limbah',
    pernyataanRisiko: 'Potensi Fluktuasi Parameter COD dan Amonia Total pada Effluent Air Limbah Melebihi Baku Mutu Saat Start-Up Unit Pabrik Urea-Amoniak Pasca Overhaul',
    penyebabRisiko: 'Lonjakan beban organik sesaat ke IPAL dan waktu adaptasi bakteri aerob di kolam pengolahan biologi',
    dampakRisiko: 'Teguran administratif dinas lingkungan hidup dan risiko penurunan penilaian skor PROPER tahun berjalan',
    pengendalianExisting: 'Emergency Retention Basin penampung sementara effluent dan dosing mikroba pengurai harian',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'lingkungan_4',
    kriteriaDampakTitle: 'Kriteria Dampak Risiko terhadap Pencemaran Lingkungan',
    kriteriaDampakLevel: 4,
    kemungkinanAwal: 2,
    dampakAwal: 4,
    inherentScore: 8,
    tingkatRisikoAwal: 'Moderate',
    currentTingkatRisiko: 'Low to Mod',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Optimalisasi Aerator Submersible Tambahan di Kolam Ekualisasi dan Kalibrasi Sensor Online Monitoring SPARING-KLHK',
    targetWaktuMitigasi: 'TW 3',
    biayaRencanaPengendalian: 110000000,
    picDepartemen: 'Departemen Lingkungan Hidup',
    picPelaksana: 'Departemen Lingkungan Hidup',
    picPengendali: 'Departemen Lingkungan Hidup',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Disetujui_Dalam_Pengendalian',
    pelaksanaanTindakan: [
      {
        id: 'ACT-RSK-2026-008-01',
        riskId: 'RSK-2026-008',
        kodeRisiko: 'RSK-2026-008',
        tanggalPelaksanaan: '2026-02-26',
        picPelaksana: 'Departemen Lingkungan Hidup',
        uraianTindakan: 'Penggantian membran diffuser aerasi kolam aerasi 2 dan kalibrasi rutin analyser pH/amonia online SPARING',
        progressPersen: 55,
        statusPelaksanaan: 'Sedang Berjalan',
        realisasiBiaya: 50000000,
        efektivitas: 'Efektif',
        kendalaDanHambatan: 'Koordinasi pengosongan parsial bak aerasi',
        tindakLanjut: 'Pemasangan blower cadangan portabel',
        nomorBuktiDokumen: 'MEMO/PUSRI/RSK-2026-008/2026',
        catatanAdmin: 'Pemantauan baku mutu berjalan optimal.',
        diperbaruiOleh: 'Departemen Lingkungan Hidup',
        createdAt: '2026-02-26T14:00:00Z',
        updatedAt: '2026-02-26T14:00:00Z'
      }
    ],
    statusPelaksanaanTerakhir: 'Sedang Berjalan',
    progressPelaksanaanTerakhir: 55,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Penggantian membran diffuser aerasi kolam aerasi 2 dan kalibrasi rutin analyser pH/amonia online SPARING',
        realisasiBiaya: 50000000,
        progressPersen: 55,
        kemungkinanResidual: 2,
        dampakResidual: 3,
        tingkatResidual: 'Low to Mod',
        statusPengendalian: 'On Track',
        kendalaDanTindakLanjut: 'Kualitas effluent air buangan memenuhi ambang batas parameter Permen LHK 100%.',
        updatedAt: '2026-03-29T16:00:00Z'
      }
    ],
    createdDate: '2026-01-28T14:00:00Z',
    updatedDate: '2026-03-29T16:00:00Z',
    createdBy: 'Officer Risk Lingkungan Hidup'
  },

  // 9. CONTOH RISIKO STATUS CARRY OVER (RKAP 2027)
  {
    id: 'RSK-2026-009',
    kodeRisiko: 'RSK-2026-009',
    kodeOrganisasi: 'RP-PROD',
    namaOrganisasi: 'Departemen Rencana & Pengendalian Produksi',
    tahun: 2026,
    sasaranRKAP: 'Penyusunan Roadmap Efisiensi Energi Spesifik Pabrik Amoniak & Urea',
    sasaranUnitKerja: 'Pengurangan Intensitas Konsumsi Energi Spesifik (MMBTU/Ton) Sebesar 3.5%',
    konteksEksternal: 'Target Dekarbonisasi dan Kebijakan Nilai Ekonomi Karbon Nasional',
    konteksInternal: 'Studi Kelayakan Multi-Tahun Integrasi Heat Recovery Steam Generator (HRSG)',
    sumberRisiko: 'Transisi Energi & Proyek Rekayasa Efisiensi Multi-Tahun',
    pernyataanRisiko: 'Potensi Keterlambatan Realisasi Proyek Revamping HRSG Akibat Negosiasi Skema Pendanaan Transisi Energi Multi-Tahun',
    penyebabRisiko: 'Proses kajian tekno-ekonomi dan persetujuan skema pembiayaan sindikasi multi-tahun',
    dampakRisiko: 'Penundaan jadwal start-up integrasi recovery panas dan target efisiensi energi tergeser ke tahun berikutnya',
    pengendalianExisting: 'Monitoring komite dekarbonisasi korporat dan audit energi berkala',
    kategoriRisiko: 'Strategis',
    kriteriaDampakKey: 'proyek_4',
    kriteriaDampakTitle: 'Kriteria Dampak Risiko terhadap Keterlambatan Proyek / Perbaikan Pabrik',
    kriteriaDampakLevel: 4,
    kemungkinanAwal: 3,
    dampakAwal: 4,
    inherentScore: 12,
    tingkatRisikoAwal: 'Mod to High',
    currentTingkatRisiko: 'Mod to High',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Pengalihan Pelaksanaan Studi Detail Desain & EPC HRSG ke RKAP 2027 Melalui Skema Carry Over Multi-Tahun',
    targetWaktuMitigasi: 'TW 1',
    biayaRencanaPengendalian: 350000000,
    picDepartemen: 'Departemen Rencana & Pengendalian Produksi',
    picPelaksana: 'Departemen Rencana & Pengendalian Produksi',
    picPengendali: 'Departemen Rencana & Pengendalian Produksi',
    jenisAnggaran: 'Capex Multi-Tahun',
    statusWorkflow: 'Carry_Over',
    carryOverInfo: {
      targetTahun: 2027,
      alasanCarryOver: 'Program mitigasi multi-tahun membutuhkan finalisasi paket EPC dan pendanaan sindikasi di RKAP 2027.',
      rekomendasiKomite: 'Disetujui Komite Manajemen Risiko Korporat untuk dilanjutkan dan dikendalikan kembali pada RKAP 2027.',
      approvalCarryOverBy: 'Komite Manajemen Risiko & Direktur Operasi',
      tanggalCarryOver: '2026-03-31T00:00:00.000Z'
    },
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Penyelesaian feasibility study tahap 1 dan penyiapan usulan Carry Over multi-tahun',
        realisasiBiaya: 50000000,
        progressPersen: 45,
        kemungkinanResidual: 3,
        dampakResidual: 4,
        tingkatResidual: 'Mod to High',
        statusPengendalian: 'On Track',
        kendalaDanTindakLanjut: 'Perlu dilanjutkan pemantauan dan pengendalian di tahun 2027 dengan status Carry Over.',
        statusKeputusan: 'Carry_Over',
        updatedAt: '2026-03-31T10:00:00Z'
      }
    ],
    createdDate: '2026-01-20T08:00:00Z',
    updatedDate: '2026-03-31T10:00:00Z',
    createdBy: 'Officer Risk RP-PROD'
  },

  // =========================================================================
  // DATA HISTORIS & REKAP TAHUNAN: TAHUN 2024
  // =========================================================================
  {
    id: 'RSK-2024-001',
    kodeRisiko: 'RSK-2024-001',
    kodeOrganisasi: 'OP-IIB',
    namaOrganisasi: 'Departemen Operasi Pabrik Pusri IIB',
    tahun: 2024,
    sasaranRKAP: 'Pencapaian Target Produksi Amoniak & Urea Pabrik IIB Tahun 2024 Sebesar 560.000 Ton',
    sasaranUnitKerja: 'Keandalan Operasi Sintesis Loop dan Minimalisasi Unplanned Shutdown < 3 Hari/Tahun',
    konteksEksternal: 'Kualitas Pasokan Gas Bumi dan Cuaca Ekstrem Musim Hujan Sumatera Selatan 2024',
    konteksInternal: 'Performa Katalis High Temperature Shift Converter (HTS) Menjelang Akhir Umur Pakai',
    sumberRisiko: 'Degradasi Performa Katalis & Keandalan Reaktor Pabrik',
    pernyataanRisiko: 'Penurunan Konversi Gas CO pada Unit High Temperature Shift (HTS) Akibat Deaktivasi Termal Katalis Fe-Cr',
    penyebabRisiko: 'Usia pakai katalis mendekati 4 tahun operasi kontinu dan fluktuasi rasio Steam-to-Carbon',
    dampakRisiko: 'Kenaikan konsumsi energi spesifik sebesar 0.4 MMBTU/Ton dan penurunan produksi amoniak harian',
    pengendalianExisting: 'Monitoring profil temperatur bed katalis harian dan analisis laboratorium gas proses',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'operasional_4',
    kriteriaDampakTitle: 'Kriteria Dampak Operasional Pabrik & Kontinuitas Produksi',
    kriteriaDampakLevel: 4,
    kemungkinanAwal: 4,
    dampakAwal: 4,
    inherentScore: 16,
    tingkatRisikoAwal: 'Mod to High',
    currentTingkatRisiko: 'Low',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Penggantian Katalis HTS Baru Berkinerja Tinggi Saat Turn Around 2024 dan Optimalisasi Guard Bed',
    targetWaktuMitigasi: 'TW 4',
    biayaRencanaPengendalian: 620000000,
    picDepartemen: 'Departemen Operasi Pabrik Pusri IIB',
    picPelaksana: 'Departemen Operasi Pabrik Pusri IIB',
    picPengendali: 'Departemen Operasi Pabrik Pusri IIB',
    jenisAnggaran: 'Capex Proyek',
    statusWorkflow: 'Selesai',
    statusPelaksanaanTerakhir: 'Selesai Dilaksanakan',
    progressPelaksanaanTerakhir: 100,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Pengadaan dan penerimaan drum katalis HTS di gudang material Pusri',
        realisasiBiaya: 250000000,
        progressPersen: 40,
        kemungkinanResidual: 3,
        dampakResidual: 4,
        tingkatResidual: 'Mod to High',
        statusPengendalian: 'On Track',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        kendalaDanTindakLanjut: 'Material katalis telah lulus uji sertifikasi CoA.',
        updatedAt: '2024-03-29T10:00:00Z'
      },
      {
        triwulan: 'TW 2',
        realisasiKegiatan: 'Persiapan peralatan unloading katalis vakum dan jadwal skedul TA',
        realisasiBiaya: 380000000,
        progressPersen: 70,
        kemungkinanResidual: 2,
        dampakResidual: 3,
        tingkatResidual: 'Low to Mod',
        statusPengendalian: 'On Track',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        kendalaDanTindakLanjut: 'Kesiapan kontraktor spesialis catalyst handling 100%.',
        updatedAt: '2024-06-28T14:00:00Z'
      },
      {
        triwulan: 'TW 3',
        realisasiKegiatan: 'Pelaksanaan loading katalis baru, aktivasi reduksi, dan performance test',
        realisasiBiaya: 595000000,
        progressPersen: 100,
        kemungkinanResidual: 1,
        dampakResidual: 2,
        tingkatResidual: 'Low',
        statusPengendalian: 'Completed',
        statusKeputusan: 'Selesai',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        catatanEvaluasiAdmin: 'Penggantian katalis selesai 100% pada TW 3 2024, konversi CO kembali optimal >99.2%. Risiko ditutup.',
        tanggalEvaluasi: '2024-09-30',
        dievaluasiOleh: 'DAFFA ARI PRASETYA',
        kendalaDanTindakLanjut: 'Kinerja reaktor HTS stabil dan memenuhi garansi vendor.',
        updatedAt: '2024-09-30T16:00:00Z'
      }
    ],
    createdDate: '2024-01-12T08:00:00Z',
    updatedDate: '2024-09-30T16:00:00Z',
    createdBy: 'Officer Risk Pabrik IIB'
  },
  {
    id: 'RSK-2024-002',
    kodeRisiko: 'RSK-2024-002',
    kodeOrganisasi: 'HAR-MEK',
    namaOrganisasi: 'Departemen Pemeliharaan Mekanikal',
    tahun: 2024,
    sasaranRKAP: 'Keandalan Mekanikal Peralatan Rotating & Static Pabrik Pupuk Tahun 2024',
    sasaranUnitKerja: 'Penurunan Vibrasi Kompresor Amoniak Refrigerasi 105-J di Bawah 2.5 mm/s',
    konteksEksternal: 'Ketersediaan Tenaga Ahli Overhaul Turbin dan Sparepart Bearing Presisi',
    konteksInternal: 'Indikasi Kenaikan Vibrasi Radial pada Journal Bearing Kompresor 105-J',
    sumberRisiko: 'Keausan Mekanis Rotating Equipment Kritis',
    pernyataanRisiko: 'Potensi Kerusakan Journal Bearing Kompresor Amoniak 105-J Akibat Oil Whip dan Ketidakseimbangan Rotor',
    penyebabRisiko: 'Clearance tilting pad bearing mulai melebar setelah 32.000 jam operasi kontinu',
    dampakRisiko: 'Trip mendadak unit refrigerasi amoniak dan biaya perbaikan darurat Rp 1,2 Miliar',
    pengendalianExisting: 'Condition monitoring vibrasi online Bently Nevada dan analisis pelumas bulanan',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'operasional_5',
    kriteriaDampakTitle: 'Kriteria Dampak Operasional Pabrik & Kontinuitas Produksi',
    kriteriaDampakLevel: 5,
    kemungkinanAwal: 4,
    dampakAwal: 5,
    inherentScore: 20,
    tingkatRisikoAwal: 'High',
    currentTingkatRisiko: 'Low',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Overhaul Terjadwal Kompresor 105-J, Penggantian Tilting Pad Bearing Baru, dan High-Speed Dynamic Balancing',
    targetWaktuMitigasi: 'TW 3',
    biayaRencanaPengendalian: 380000000,
    picDepartemen: 'Departemen Pemeliharaan Mekanikal',
    picPelaksana: 'Departemen Pemeliharaan Mekanikal',
    picPengendali: 'Departemen Pemeliharaan Mekanikal',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Selesai',
    statusPelaksanaanTerakhir: 'Selesai Dilaksanakan',
    progressPelaksanaanTerakhir: 100,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Inspeksi spektrum vibrasi dan pemesanan set tilting pad bearing OEM',
        realisasiBiaya: 150000000,
        progressPersen: 50,
        kemungkinanResidual: 3,
        dampakResidual: 4,
        tingkatResidual: 'Mod to High',
        statusPengendalian: 'On Track',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        kendalaDanTindakLanjut: 'Bearing tiba tepat waktu di workshop mekanikal.',
        updatedAt: '2024-03-28T11:00:00Z'
      },
      {
        triwulan: 'TW 2',
        realisasiKegiatan: 'Penggantian bearing, laser alignment kopling, dan uji jalan beban penuh',
        realisasiBiaya: 365000000,
        progressPersen: 100,
        kemungkinanResidual: 1,
        dampakResidual: 2,
        tingkatResidual: 'Low',
        statusPengendalian: 'Completed',
        statusKeputusan: 'Selesai',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        catatanEvaluasiAdmin: 'Vibrasi kompresor turun menjadi 1.1 mm/s (sangat aman). Risiko selesai dikendalikan pada TW 2 2024.',
        tanggalEvaluasi: '2024-06-29',
        dievaluasiOleh: 'DAFFA ARI PRASETYA',
        kendalaDanTindakLanjut: 'Selesai tuntas tanpa kendala.',
        updatedAt: '2024-06-29T15:00:00Z'
      }
    ],
    createdDate: '2024-01-18T09:00:00Z',
    updatedDate: '2024-06-29T15:00:00Z',
    createdBy: 'Officer Risk Pemeliharaan'
  },
  {
    id: 'RSK-2024-003',
    kodeRisiko: 'RSK-2024-003',
    kodeOrganisasi: 'KEU-AKUN',
    namaOrganisasi: 'Departemen Keuangan & Akuntansi',
    tahun: 2024,
    sasaranRKAP: 'Ketahanan Likuiditas Kas & Efisiensi Biaya Pendanaan Tahun 2024',
    sasaranUnitKerja: 'Kolektibilitas Piutang Niaga Pupuk Komersial Tepat Waktu > 97%',
    konteksEksternal: 'Fluktuasi Harga Komoditas Perkebunan Sawit yang Mempengaruhi Daya Beli Mitra NPK Komersial',
    konteksInternal: 'Kebijakan Kredit Komersial Penjualan Pupuk Non-Subsidi Sektor Korporasi',
    sumberRisiko: 'Risiko Kredit & Keterlambatan Pembayaran Mitra Niaga',
    pernyataanRisiko: 'Potensi Keterlambatan Pelunasan Piutang Penjualan Pupuk Komersial Sektor Perkebunan Melebihi Tenor 60 Hari',
    penyebabRisiko: 'Siklus panen perkebunan mitra mundur akibat dampak El Nino semester awal 2024',
    dampakRisiko: 'Peningkatan biaya modal kerja (cost of fund) dan pencadangan penurunan nilai piutang',
    pengendalianExisting: 'Verifikasi plafon kredit distributor dan jaminan Bank Garansi (BG)',
    kategoriRisiko: 'Keuangan',
    kriteriaDampakKey: 'finansial_3',
    kriteriaDampakTitle: 'Kriteria Dampak Finansial / Kerugian Keuangan',
    kriteriaDampakLevel: 3,
    kemungkinanAwal: 3,
    dampakAwal: 3,
    inherentScore: 9,
    tingkatRisikoAwal: 'Moderate',
    currentTingkatRisiko: 'Low',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Penerapan Skema Pembayaran SKBDN / Bank Garansi Wajib 100% dan Early Payment Discount bagi Distributor Komersial',
    targetWaktuMitigasi: 'TW 4',
    biayaRencanaPengendalian: 95000000,
    picDepartemen: 'Departemen Keuangan & Akuntansi',
    picPelaksana: 'Departemen Keuangan & Akuntansi',
    picPengendali: 'Departemen Keuangan & Akuntansi',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Selesai',
    statusPelaksanaanTerakhir: 'Selesai Dilaksanakan',
    progressPelaksanaanTerakhir: 100,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Revisi SOP kredit komersial dan rekonsiliasi aging schedule piutang',
        realisasiBiaya: 35000000,
        progressPersen: 50,
        kemungkinanResidual: 2,
        dampakResidual: 3,
        tingkatResidual: 'Low to Mod',
        statusPengendalian: 'On Track',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        kendalaDanTindakLanjut: 'Seluruh kontrak baru wajib dilampiri Bank Garansi.',
        updatedAt: '2024-03-30T10:00:00Z'
      },
      {
        triwulan: 'TW 4',
        realisasiKegiatan: 'Evaluasi tutup buku piutang tahunan 2024 dengan rasio kolektibilitas 99.1%',
        realisasiBiaya: 88000000,
        progressPersen: 100,
        kemungkinanResidual: 1,
        dampakResidual: 2,
        tingkatResidual: 'Low',
        statusPengendalian: 'Completed',
        statusKeputusan: 'Selesai',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        catatanEvaluasiAdmin: 'Rasio kolektibilitas piutang 2024 mencapai 99.1% tanpa kredit macet. Dinyatakan selesai.',
        tanggalEvaluasi: '2024-12-20',
        dievaluasiOleh: 'DAFFA ARI PRASETYA',
        kendalaDanTindakLanjut: 'Target RKAP 2024 tercapai penuh.',
        updatedAt: '2024-12-20T15:00:00Z'
      }
    ],
    createdDate: '2024-02-02T08:30:00Z',
    updatedDate: '2024-12-20T15:00:00Z',
    createdBy: 'Officer Risk Keuangan'
  },
  {
    id: 'RSK-2024-004',
    kodeRisiko: 'RSK-2024-004',
    kodeOrganisasi: 'TI',
    namaOrganisasi: 'Departemen Teknologi Informasi',
    tahun: 2024,
    sasaranRKAP: 'Penguatan Keamanan Siber & Kepatuhan ISO 27001 Infrastruktur Digital Pusri 2024',
    sasaranUnitKerja: 'Zero Major Cyber Security Breach pada Jaringan Enterprise & Aplikasi Korporat',
    konteksEksternal: 'Meningkatnya Ancaman Serangan Ransomware dan Phishing terhadap Infrastruktur BUMN',
    konteksInternal: 'Integrasi Akses Aplikasi Portal Internal dan Cloud Hybrid Pusri',
    sumberRisiko: 'Ancaman Keamanan Siber & Kerentanan Aplikasi',
    pernyataanRisiko: 'Potensi Gangguan Layanan Sistem Informasi Korporat Akibat Serangan Malware / Ransomware pada Endpoint Pengguna',
    penyebabRisiko: 'Upaya infiltrasi phishing email eksternal dan celah keamanan patch sistem operasi',
    dampakRisiko: 'Gangguan operasional administrasi ERP dan risiko kebocoran data internal',
    pengendalianExisting: 'Firewall perimeter generasi terbaru dan antivirus terpusat',
    kategoriRisiko: 'Strategis',
    kriteriaDampakKey: 'ti_4',
    kriteriaDampakTitle: 'Kriteria Dampak Teknologi Informasi',
    kriteriaDampakLevel: 4,
    kemungkinanAwal: 3,
    dampakAwal: 4,
    inherentScore: 12,
    tingkatRisikoAwal: 'Mod to High',
    currentTingkatRisiko: 'Low',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Implementasi Endpoint Detection & Response (EDR) 24/7 SOC dan Simulasi Phishing Awareness Seluruh Karyawan',
    targetWaktuMitigasi: 'TW 3',
    biayaRencanaPengendalian: 290000000,
    picDepartemen: 'Departemen Teknologi Informasi',
    picPelaksana: 'Departemen Teknologi Informasi',
    picPengendali: 'Departemen Teknologi Informasi',
    jenisAnggaran: 'Investasi Rutin',
    statusWorkflow: 'Selesai',
    statusPelaksanaanTerakhir: 'Selesai Dilaksanakan',
    progressPelaksanaanTerakhir: 100,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 2',
        realisasiKegiatan: 'Deployment agen EDR pada 1.850 perangkat kerja dan server produksi',
        realisasiBiaya: 210000000,
        progressPersen: 75,
        kemungkinanResidual: 2,
        dampakResidual: 3,
        tingkatResidual: 'Low to Mod',
        statusPengendalian: 'On Track',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        kendalaDanTindakLanjut: 'Integrasi SOC 24/7 berjalan efektif.',
        updatedAt: '2024-06-25T11:00:00Z'
      },
      {
        triwulan: 'TW 3',
        realisasiKegiatan: 'Sertifikasi surveilans ISO/IEC 27001:2022 dan pentest eksternal tanpa temuan kritikal',
        realisasiBiaya: 280000000,
        progressPersen: 100,
        kemungkinanResidual: 1,
        dampakResidual: 2,
        tingkatResidual: 'Low',
        statusPengendalian: 'Completed',
        statusKeputusan: 'Selesai',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        catatanEvaluasiAdmin: 'Seluruh endpoint terproteksi EDR dan audit ISO 27001 lulus 100%.',
        tanggalEvaluasi: '2024-09-28',
        dievaluasiOleh: 'DAFFA ARI PRASETYA',
        kendalaDanTindakLanjut: 'Zero cyber incident sepanjang tahun 2024.',
        updatedAt: '2024-09-28T16:00:00Z'
      }
    ],
    createdDate: '2024-01-25T09:00:00Z',
    updatedDate: '2024-09-28T16:00:00Z',
    createdBy: 'Officer Risk TI'
  },
  {
    id: 'RSK-2024-005',
    kodeRisiko: 'RSK-2024-005',
    kodeOrganisasi: 'LH',
    namaOrganisasi: 'Departemen Lingkungan Hidup',
    tahun: 2024,
    sasaranRKAP: 'Pencapaian PROPER Emas KLHK & Pengelolaan Limbah B3 Terpadu Tahun 2024',
    sasaranUnitKerja: 'Zero Non-Compliance Baku Mutu Emisi Udara & Limbah Cair Pabrik',
    konteksEksternal: 'Audit Lapangan Dewan Pertimbangan PROPER Kementerian LHK Tahun 2024',
    konteksInternal: 'Optimalisasi Unit Scrubber dan Sistem Pemantauan Emisi Kontinu (CEMS)',
    sumberRisiko: 'Kepatuhan Regulasi Lingkungan Hidup & Emisi Cerobong',
    pernyataanRisiko: 'Potensi Gangguan Transmisi Data Telemetry CEMS ke Server KLHK Akibat Kerusakan Modul Data Logger Saat Cuaca Buruk',
    penyebabRisiko: 'Induksi petir di area cerobong prilling tower dan fluktuasi catu daya sensor',
    dampakRisiko: 'Diskontinuitas pelaporan data harian SISPEK KLHK dan risiko penalti penilaian kepatuhan teknis',
    pengendalianExisting: 'Pengecekan harian status koneksi DAS CEMS oleh operator lingkungan',
    kategoriRisiko: 'Hukum & Kepatuhan',
    kriteriaDampakKey: 'lingkungan_3',
    kriteriaDampakTitle: 'Kriteria Dampak Risiko terhadap Pencemaran Lingkungan',
    kriteriaDampakLevel: 3,
    kemungkinanAwal: 3,
    dampakAwal: 3,
    inherentScore: 9,
    tingkatRisikoAwal: 'Moderate',
    currentTingkatRisiko: 'Low',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Pemasangan Surge Arrester Proteksi Petir Bertingkat, UPS Industrial Dedicated, dan Buffer Memory Otomatis pada DAS CEMS',
    targetWaktuMitigasi: 'TW 3',
    biayaRencanaPengendalian: 115000000,
    picDepartemen: 'Departemen Lingkungan Hidup',
    picPelaksana: 'Departemen Lingkungan Hidup',
    picPengendali: 'Departemen Lingkungan Hidup',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Selesai',
    statusPelaksanaanTerakhir: 'Selesai Dilaksanakan',
    progressPelaksanaanTerakhir: 100,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 3',
        realisasiKegiatan: 'Instalasi surge arrester, UPS dedicated, dan validasi konektivitas SISPEK KLHK 99.9%',
        realisasiBiaya: 108000000,
        progressPersen: 100,
        kemungkinanResidual: 1,
        dampakResidual: 2,
        tingkatResidual: 'Low',
        statusPengendalian: 'Completed',
        statusKeputusan: 'Selesai',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        catatanEvaluasiAdmin: 'Transmisi data CEMS ke KLHK mencapai 100% dan Pusri berhasil mempertahankan PROPER Emas 2024.',
        tanggalEvaluasi: '2024-10-15',
        dievaluasiOleh: 'DAFFA ARI PRASETYA',
        kendalaDanTindakLanjut: 'Selesai dan efektif.',
        updatedAt: '2024-10-15T14:00:00Z'
      }
    ],
    createdDate: '2024-02-10T10:00:00Z',
    updatedDate: '2024-10-15T14:00:00Z',
    createdBy: 'Officer Risk Lingkungan Hidup'
  },

  // =========================================================================
  // DATA HISTORIS & REKAP TAHUNAN: TAHUN 2025
  // =========================================================================
  {
    id: 'RSK-2025-001',
    kodeRisiko: 'RSK-2025-001',
    kodeOrganisasi: 'OP-IIB',
    namaOrganisasi: 'Departemen Operasi Pabrik Pusri IIB',
    tahun: 2025,
    sasaranRKAP: 'Pencapaian Target Produksi Urea IIB Tahun 2025 Sebesar 565.000 Ton & Efisiensi Energi',
    sasaranUnitKerja: 'Menjaga Keandalan Kolom CO2 Absorber dan Pompa Larutan Benfield',
    konteksEksternal: 'Tuntutan Efisiensi Rasio Konsumsi Gas Bumi per Ton Produk Pupuk Tahun 2025',
    konteksInternal: 'Potensi Foaming pada Kolom Absorber CO2 Unit Pemurnian Gas Sintesis',
    sumberRisiko: 'Gangguan Proses Absorpsi CO2 & Kualitas Larutan Karbonat',
    pernyataanRisiko: 'Potensi Fenomena Foaming pada Packed Column CO2 Absorber 101-E yang Menyebabkan Carry-Over Larutan dan Penurunan Beban Pabrik',
    penyebabRisiko: 'Akumulasi partikulat hidrokarbon berat dan degradasi mekanis karbon aktif filter larutan',
    dampakRisiko: 'Pembatasan rate produksi amoniak hingga 85% kapasitas selama 5 hari pemulihan',
    pengendalianExisting: 'Injeksi antifoam terukur dan analisis kejernihan larutan Benfield per shift',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'operasional_4',
    kriteriaDampakTitle: 'Kriteria Dampak Operasional Pabrik & Kontinuitas Produksi',
    kriteriaDampakLevel: 4,
    kemungkinanAwal: 4,
    dampakAwal: 4,
    inherentScore: 16,
    tingkatRisikoAwal: 'Mod to High',
    currentTingkatRisiko: 'Low',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Upgrading Sistem Filtrasi Mekanis Dual-Cartridge Larutan Benfield & Penggantian Media Carbon Filter Berkala',
    targetWaktuMitigasi: 'TW 3',
    biayaRencanaPengendalian: 310000000,
    picDepartemen: 'Departemen Operasi Pabrik Pusri IIB',
    picPelaksana: 'Departemen Operasi Pabrik Pusri IIB',
    picPengendali: 'Departemen Operasi Pabrik Pusri IIB',
    jenisAnggaran: 'Investasi Rutin',
    statusWorkflow: 'Selesai',
    statusPelaksanaanTerakhir: 'Selesai Dilaksanakan',
    progressPelaksanaanTerakhir: 100,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Pengadaan housing dual-cartridge filter dan media karbon aktif spesifikasi tinggi',
        realisasiBiaya: 120000000,
        progressPersen: 45,
        kemungkinanResidual: 3,
        dampakResidual: 4,
        tingkatResidual: 'Mod to High',
        statusPengendalian: 'On Track',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        kendalaDanTindakLanjut: 'Pengadaan sesuai jadwal.',
        updatedAt: '2025-03-28T09:00:00Z'
      },
      {
        triwulan: 'TW 2',
        realisasiKegiatan: 'Tie-in jalur bypass filter baru tanpa menghentikan operasi pabrik',
        realisasiBiaya: 230000000,
        progressPersen: 80,
        kemungkinanResidual: 2,
        dampakResidual: 3,
        tingkatResidual: 'Low to Mod',
        statusPengendalian: 'On Track',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        kendalaDanTindakLanjut: 'Parameter differential pressure kolom 101-E sangat stabil.',
        updatedAt: '2025-06-30T11:00:00Z'
      },
      {
        triwulan: 'TW 3',
        realisasiKegiatan: 'Komisioning penuh sistem filtrasi ganda dan evaluasi 90 hari bebas foaming',
        realisasiBiaya: 298000000,
        progressPersen: 100,
        kemungkinanResidual: 1,
        dampakResidual: 2,
        tingkatResidual: 'Low',
        statusPengendalian: 'Completed',
        statusKeputusan: 'Selesai',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        catatanEvaluasiAdmin: 'Sistem filtrasi Benfield beroperasi optimal, zero foaming sepanjang 2025. Risiko ditutup.',
        tanggalEvaluasi: '2025-09-29',
        dievaluasiOleh: 'DAFFA ARI PRASETYA',
        kendalaDanTindakLanjut: 'Target efisiensi penyerapan CO2 tercapai 100%.',
        updatedAt: '2025-09-29T15:30:00Z'
      }
    ],
    createdDate: '2025-01-08T08:00:00Z',
    updatedDate: '2025-09-29T15:30:00Z',
    createdBy: 'Officer Risk Pabrik IIB'
  },
  {
    id: 'RSK-2025-002',
    kodeRisiko: 'RSK-2025-002',
    kodeOrganisasi: 'HAR-ELINS',
    namaOrganisasi: 'Departemen Pemeliharaan Listrik & Instrumen',
    tahun: 2025,
    sasaranRKAP: 'Keandalan Sistem Kelistrikan & Instrumentasi Kontrol Pabrik Tahun 2025',
    sasaranUnitKerja: 'Zero Unplanned Trip Akibat Kegagalan Power Supply Modul I/O DCS Pabrik',
    konteksEksternal: 'Penghentian Dukungan (End-of-Life) Beberapa Komponen Power Supply Generasi Lama dari Vendor',
    konteksInternal: 'Keandalan Redundansi Power Supply Kabinet Marshalling DCS Pabrik III & IV',
    sumberRisiko: 'Penuaan Modul Elektronik & Sistem Otomasi Industri',
    pernyataanRisiko: 'Potensi Kegagalan Redundant Power Supply Module pada Kabinet Kontrol DCS yang Berisiko Memicu Spurious Trip Unit Operasi',
    penyebabRisiko: 'Degradasi kapasitor elektrolit pada modul power supply setelah 10 tahun operasi',
    dampakRisiko: 'Gangguan pembacaan sinyal transmitter kritis dan potensi false interlock trip pabrik',
    pengendalianExisting: 'Inspeksi thermography infrared bulanan pada panel kabinet DCS',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'operasional_5',
    kriteriaDampakTitle: 'Kriteria Dampak Operasional Pabrik & Kontinuitas Produksi',
    kriteriaDampakLevel: 5,
    kemungkinanAwal: 4,
    dampakAwal: 5,
    inherentScore: 20,
    tingkatRisikoAwal: 'High',
    currentTingkatRisiko: 'Low',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Peremajaan (Preventive Replacement) Seluruh Modul Redundant Power Supply DCS secara Hot-Swap Bertahap',
    targetWaktuMitigasi: 'TW 4',
    biayaRencanaPengendalian: 420000000,
    picDepartemen: 'Departemen Pemeliharaan Listrik & Instrumen',
    picPelaksana: 'Departemen Pemeliharaan Listrik & Instrumen',
    picPengendali: 'Departemen Pemeliharaan Listrik & Instrumen',
    jenisAnggaran: 'Investasi Rutin',
    statusWorkflow: 'Selesai',
    statusPelaksanaanTerakhir: 'Selesai Dilaksanakan',
    progressPelaksanaanTerakhir: 100,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 2',
        realisasiKegiatan: 'Penggantian 24 unit power supply hot-swap pada kabinet kontrol utama',
        realisasiBiaya: 240000000,
        progressPersen: 60,
        kemungkinanResidual: 2,
        dampakResidual: 4,
        tingkatResidual: 'Moderate',
        statusPengendalian: 'On Track',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        kendalaDanTindakLanjut: 'Proses hot-swap berjalan aman tanpa gangguan operasi.',
        updatedAt: '2025-06-27T13:00:00Z'
      },
      {
        triwulan: 'TW 4',
        realisasiKegiatan: 'Penyelesaian penggantian seluruh 40 unit modul power supply DCS dan uji redundansi',
        realisasiBiaya: 405000000,
        progressPersen: 100,
        kemungkinanResidual: 1,
        dampakResidual: 2,
        tingkatResidual: 'Low',
        statusPengendalian: 'Completed',
        statusKeputusan: 'Selesai',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        catatanEvaluasiAdmin: 'Peremajaan modul power supply DCS tuntas 100% pada TW 4 2025. Tingkat risiko turun ke Low.',
        tanggalEvaluasi: '2025-12-15',
        dievaluasiOleh: 'DAFFA ARI PRASETYA',
        kendalaDanTindakLanjut: 'Keandalan sistem kontrol mencapai 100%.',
        updatedAt: '2025-12-15T10:00:00Z'
      }
    ],
    createdDate: '2025-01-14T09:00:00Z',
    updatedDate: '2025-12-15T10:00:00Z',
    createdBy: 'Officer Risk Elins'
  },
  {
    id: 'RSK-2025-003',
    kodeRisiko: 'RSK-2025-003',
    kodeOrganisasi: 'PENGADAAN',
    namaOrganisasi: 'Departemen Pengadaan Barang & Jasa',
    tahun: 2025,
    sasaranRKAP: 'Ketepatan Waktu Pengadaan Material Strategis & Efisiensi Biaya SCM Tahun 2025',
    sasaranUnitKerja: 'Service Level Agreement (SLA) Penyelesaian Tender Material Pabrik < 25 Hari Kerja',
    konteksEksternal: 'Disrupsi Rantai Pasok Kapal Kargo Internasional dan Fluktuasi Tarif Freight Kontainer',
    konteksInternal: 'Kebutuhan Pengadaan Kantong Pupuk (Woven Bag) dan Bahan Kimia Water Treatment',
    sumberRisiko: 'Ketergantungan Vendor & Fluktuasi Lead Time Pengiriman',
    pernyataanRisiko: 'Potensi Keterlambatan Pasokan Bahan Kimia Water Treatment & Antiscalant Akibat Gangguan Jadwal Pengapalan Vendor',
    penyebabRisiko: 'Antrean bongkar muat pelabuhan transshipment regional dan keterbatasan stok buffer vendor tunggal',
    dampakRisiko: 'Penurunan cadangan stok bahan kimia di bawah batas minimum 14 hari operasi',
    pengendalianExisting: 'Reorder point otomatis di sistem SAP MM dan pemantauan stok mingguan',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'operasional_3',
    kriteriaDampakTitle: 'Kriteria Dampak Operasional Pabrik & Kontinuitas Produksi',
    kriteriaDampakLevel: 3,
    kemungkinanAwal: 3,
    dampakAwal: 4,
    inherentScore: 12,
    tingkatRisikoAwal: 'Mod to High',
    currentTingkatRisiko: 'Low',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Penerapan Kontrak Payung (Blanket Order) Multi-Vendor dan Sistem Vendor Managed Inventory (VMI) di Gudang Pusri',
    targetWaktuMitigasi: 'TW 3',
    biayaRencanaPengendalian: 75000000,
    picDepartemen: 'Departemen Pengadaan Barang & Jasa',
    picPelaksana: 'Departemen Pengadaan Barang & Jasa',
    picPengendali: 'Departemen Pengadaan Barang & Jasa',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Selesai',
    statusPelaksanaanTerakhir: 'Selesai Dilaksanakan',
    progressPelaksanaanTerakhir: 100,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 3',
        realisasiKegiatan: 'Penandatanganan kontrak VMI dengan 3 produsen bahan kimia nasional dan buffer stok 30 hari di lokasi Pusri',
        realisasiBiaya: 68000000,
        progressPersen: 100,
        kemungkinanResidual: 1,
        dampakResidual: 2,
        tingkatResidual: 'Low',
        statusPengendalian: 'Completed',
        statusKeputusan: 'Selesai',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        catatanEvaluasiAdmin: 'Skema VMI berhasil mengamankan stok minimum 30 hari tanpa biaya penyimpanan tambahan.',
        tanggalEvaluasi: '2025-09-25',
        dievaluasiOleh: 'DAFFA ARI PRASETYA',
        kendalaDanTindakLanjut: 'Tuntas dilaksanakan.',
        updatedAt: '2025-09-25T14:00:00Z'
      }
    ],
    createdDate: '2025-01-20T10:00:00Z',
    updatedDate: '2025-09-25T14:00:00Z',
    createdBy: 'Officer Risk Pengadaan'
  },
  {
    id: 'RSK-2025-004',
    kodeRisiko: 'RSK-2025-004',
    kodeOrganisasi: 'K3',
    namaOrganisasi: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
    tahun: 2025,
    sasaranRKAP: 'Pencapaian Zero Accident & Peningkatan Jam Kerja Aman Tahun 2025',
    sasaranUnitKerja: 'Kepatuhan Prosedur Permit-to-Work (PTW) Pekerjaan Panas & Ruang Terbatas 100%',
    konteksEksternal: 'Standar Keselamatan Proses Industri Petrokimia (Process Safety Management) Nasional',
    konteksInternal: 'Tingginya Aktivitas Pekerjaan Konstruksi Mitra Kontraktor di Area Pabrik Eksisting',
    sumberRisiko: 'Keselamatan Pekerja Kontraktor & Izin Kerja Area Berbahaya',
    pernyataanRisiko: 'Potensi Insiden Keselamatan Kerja pada Pekerjaan Ruang Terbatas (Confined Space) Saat Perbaikan Vessel Pabrik',
    penyebabRisiko: 'Kelelahan pekerja kontraktor dan potensi akumulasi sisa gas inert di dalam vessel',
    dampakRisiko: 'Gangguan kesehatan/keselamatan personel, penghentian pekerjaan, dan sanksi regulasi K3',
    pengendalianExisting: 'Pengukuran gas detector sebelum masuk vessel dan penempatan standby watchman',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'k3_4',
    kriteriaDampakTitle: 'Kriteria Dampak Risiko terhadap K3',
    kriteriaDampakLevel: 4,
    kemungkinanAwal: 2,
    dampakAwal: 4,
    inherentScore: 8,
    tingkatRisikoAwal: 'Moderate',
    currentTingkatRisiko: 'Low',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Implementasi Digital e-Permit to Work Terintegrasi Sensor Multi-Gas Portable Real-Time dan Sertifikasi Wajib Confined Space Entry',
    targetWaktuMitigasi: 'TW 3',
    biayaRencanaPengendalian: 135000000,
    picDepartemen: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
    picPelaksana: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
    picPengendali: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Selesai',
    statusPelaksanaanTerakhir: 'Selesai Dilaksanakan',
    progressPelaksanaanTerakhir: 100,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 3',
        realisasiKegiatan: 'Penerapan e-PTW penuh dan pengadaan 15 unit multi-gas detector bluetooth real-time',
        realisasiBiaya: 130000000,
        progressPersen: 100,
        kemungkinanResidual: 1,
        dampakResidual: 2,
        tingkatResidual: 'Low',
        statusPengendalian: 'Completed',
        statusKeputusan: 'Selesai',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        catatanEvaluasiAdmin: 'Zero Lost Time Injury (LTI) tercapai sepanjang tahun 2025.',
        tanggalEvaluasi: '2025-10-10',
        dievaluasiOleh: 'DAFFA ARI PRASETYA',
        kendalaDanTindakLanjut: 'Terkendali penuh.',
        updatedAt: '2025-10-10T11:00:00Z'
      }
    ],
    createdDate: '2025-02-01T08:00:00Z',
    updatedDate: '2025-10-10T11:00:00Z',
    createdBy: 'Officer Risk K3'
  },
  {
    id: 'RSK-2025-005',
    kodeRisiko: 'RSK-2025-005',
    kodeOrganisasi: 'RP-PROD',
    namaOrganisasi: 'Departemen Rencana & Pengendalian Produksi',
    tahun: 2025,
    sasaranRKAP: 'Pengembangan Proyek Dekarbonisasi & Green Ammonia Pilot Plant 2025-2026',
    sasaranUnitKerja: 'Penyelesaian Basic Engineering Design (BED) Integrasi Elektroliser Hidrogen Hijau',
    konteksEksternal: 'Dinamika Regulasi Insentif Energi Baru Terbarukan dan Ketersediaan Pasokan Listrik Hijau PLN',
    konteksInternal: 'Sinkronisasi Desain Tie-in Hidrogen Hijau ke Unit Sintesis Amoniak Eksisting',
    sumberRisiko: 'Transisi Energi & Kompleksitas Rekayasa Multi-Tahun',
    pernyataanRisiko: 'Keterlambatan Finalisasi Skema Komersial Offtake Green Ammonia yang Mempengaruhi Jadwal FID Proyek Multi-Tahun',
    penyebabRisiko: 'Penyesuaian standar sertifikasi karbon internasional dan negosiasi tarif listrik hijau',
    dampakRisiko: 'Pergeseran tahapan eksekusi konstruksi pilot project dari akhir 2025 ke tahun anggaran 2026',
    pengendalianExisting: 'Joint working group bersama Holding Pupuk Indonesia dan mitra strategis',
    kategoriRisiko: 'Strategis',
    kriteriaDampakKey: 'proyek_4',
    kriteriaDampakTitle: 'Kriteria Dampak Risiko terhadap Keterlambatan Proyek / Perbaikan Pabrik',
    kriteriaDampakLevel: 4,
    kemungkinanAwal: 3,
    dampakAwal: 4,
    inherentScore: 12,
    tingkatRisikoAwal: 'Mod to High',
    currentTingkatRisiko: 'Low to Mod',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Penyelesaian Kajian Tekno-Ekonomi Tahap Akhir dan Pengalihan Tahap Eksekusi ke RKAP 2026',
    targetWaktuMitigasi: 'TW 4',
    biayaRencanaPengendalian: 220000000,
    picDepartemen: 'Departemen Rencana & Pengendalian Produksi',
    picPelaksana: 'Departemen Rencana & Pengendalian Produksi',
    picPengendali: 'Departemen Rencana & Pengendalian Produksi',
    jenisAnggaran: 'Capex Multi-Tahun',
    statusWorkflow: 'Carry_Over',
    carryOverInfo: {
      targetTahun: 2026,
      alasanCarryOver: 'Dokumen BED telah selesai 85%, tahapan pengadaan dilanjutkan pada RKAP 2026.',
      rekomendasiKomite: 'Disetujui Carry Over dari RKAP 2025 ke RKAP 2026 untuk pemantauan lanjutan.',
      approvalCarryOverBy: 'Komite Manajemen Risiko Pusri',
      tanggalCarryOver: '2025-12-28T00:00:00.000Z'
    },
    pengendalianTriwulan: [
      {
        triwulan: 'TW 4',
        realisasiKegiatan: 'Finalisasi studi kelayakan dan persetujuan prinsip alokasi listrik EBT',
        realisasiBiaya: 185000000,
        progressPersen: 85,
        kemungkinanResidual: 2,
        dampakResidual: 3,
        tingkatResidual: 'Low to Mod',
        statusPengendalian: 'On Track',
        statusKeputusan: 'Carry_Over',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        kendalaDanTindakLanjut: 'Dilanjutkan pada program strategis RKAP 2026.',
        updatedAt: '2025-12-28T16:00:00Z'
      }
    ],
    createdDate: '2025-02-12T09:00:00Z',
    updatedDate: '2025-12-28T16:00:00Z',
    createdBy: 'Officer Risk RP-PROD'
  },

  // =========================================================================
  // DATA PROYEKSI & RKAP MULTI-TAHUN: TAHUN 2027 (DAN SETERUSNYA)
  // =========================================================================
  {
    id: 'RSK-2027-001',
    kodeRisiko: 'RSK-2027-001',
    kodeOrganisasi: 'OP-IIB',
    namaOrganisasi: 'Departemen Operasi Pabrik Pusri IIB',
    tahun: 2027,
    sasaranRKAP: 'Komisioning & Integrasi Utilitas Pabrik Pusri IIIB serta Optimalisasi Operasi IIB Tahun 2027',
    sasaranUnitKerja: 'Kesiapan Interkoneksi Jaringan Steam & Power Antar-Pabrik Tanpa Gangguan Operasi',
    konteksEksternal: 'Target Peningkatan Kapasitas Produksi Pupuk Nasional dan Efisiensi Konsumsi Gas Bumi 2027',
    konteksInternal: 'Sinkronisasi Sistem Utilitas Steam Header Tekanan Tinggi saat Fase Tie-In Proyek Baru',
    sumberRisiko: 'Integrasi Fasilitas Baru & Keseimbangan Utilitas Pabrik',
    pernyataanRisiko: 'Potensi Fluktuasi Tekanan Header Steam High Pressure (HP) Saat Pengujian Interkoneksi Utilitas Lintas Pabrik Tahun 2027',
    penyebabRisiko: 'Transien beban uap saat pengujian katup kontrol otomatis interkoneksi header utama',
    dampakRisiko: 'Gangguan kestabilan putaran turbin kompresor proses dan potensi penurunan beban operasi sesaat',
    pengendalianExisting: 'Simulasi proses dinamis (Dynamic Process Simulation) dan SOP isolasi bertahap',
    kategoriRisiko: 'Operasional',
    kriteriaDampakKey: 'operasional_4',
    kriteriaDampakTitle: 'Kriteria Dampak Operasional Pabrik & Kontinuitas Produksi',
    kriteriaDampakLevel: 4,
    kemungkinanAwal: 3,
    dampakAwal: 4,
    inherentScore: 12,
    tingkatRisikoAwal: 'Mod to High',
    currentTingkatRisiko: 'Moderate',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Pemasangan Fast-Acting Pressure Control Valve Otomatis & Penyusunan Prosedur Commissioning Tie-In Terpadu RKAP 2027',
    targetWaktuMitigasi: 'TW 2',
    biayaRencanaPengendalian: 480000000,
    picDepartemen: 'Departemen Operasi Pabrik Pusri IIB',
    picPelaksana: 'Departemen Operasi Pabrik Pusri IIB',
    picPengendali: 'Departemen Operasi Pabrik Pusri IIB',
    jenisAnggaran: 'Capex Proyek',
    statusWorkflow: 'Disetujui_Dalam_Pengendalian',
    statusPelaksanaanTerakhir: 'Sedang Berjalan',
    progressPelaksanaanTerakhir: 35,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Penyelesaian HAZOP study interkoneksi steam header dan pemesanan katup kontrol cepat',
        realisasiBiaya: 160000000,
        progressPersen: 35,
        kemungkinanResidual: 2,
        dampakResidual: 4,
        tingkatResidual: 'Moderate',
        statusPengendalian: 'On Track',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        kendalaDanTindakLanjut: 'Engineering review selesai, persiapan instalasi TW 2.',
        updatedAt: '2026-03-31T11:00:00Z'
      }
    ],
    createdDate: '2026-02-01T08:00:00Z',
    updatedDate: '2026-03-31T11:00:00Z',
    createdBy: 'Officer Risk Pabrik IIB'
  },
  {
    id: 'RSK-2027-002',
    kodeRisiko: 'RSK-2027-002',
    kodeOrganisasi: 'MR-CORP',
    namaOrganisasi: 'Departemen Manajemen Risiko Korporat',
    tahun: 2027,
    sasaranRKAP: 'Peningkatan Maturitas Enterprise Risk Management (ERM) Pusri ke Level 4.5 (ISO 31000) Tahun 2027',
    sasaranUnitKerja: 'Integrasi Prediktif Key Risk Indicator (KRI) Otomatis Seluruh Kompartemen & Pabrik',
    konteksEksternal: 'Standar Kepatuhan Manajemen Risiko BUMN Kementerian BUMN & Pupuk Indonesia Holding',
    konteksInternal: 'Harmonisasi Parameter Early Warning System Risiko Operasional, Finansial, dan Strategis',
    sumberRisiko: 'Tata Kelola Risiko Korporat & Integrasi Data KRI',
    pernyataanRisiko: 'Potensi Keterlambatan Respons Dini Mitigasi Lintas Fungsi Apabila Threshold Key Risk Indicator (KRI) Belum Terhubung Real-Time',
    penyebabRisiko: 'Variasi frekuensi pembaruan parameter operasional dan finansial antar unit kerja',
    dampakRisiko: 'Keputusan eskalasi mitigasi komite risiko menjadi kurang responsif terhadap dinamika pasar',
    pengendalianExisting: 'Rapat evaluasi triwulanan komite manajemen risiko dan pelaporan portal ERM Pusri',
    kategoriRisiko: 'Strategis',
    kriteriaDampakKey: 'regulasi_hukum_3',
    kriteriaDampakTitle: 'Kriteria Dampak terhadap Kepatuhan Hukum & Sanksi Regulator',
    kriteriaDampakLevel: 3,
    kemungkinanAwal: 3,
    dampakAwal: 3,
    inherentScore: 9,
    tingkatRisikoAwal: 'Moderate',
    currentTingkatRisiko: 'Low to Mod',
    jenisPenanganan: 'Mitigasi',
    butuhMitigasi: true,
    rencanaPenanganan: 'Implementasi Dashboard KRI Early Warning Otomatis Multi-Tahun (2024-2027+) pada Portal Risiko Pusri',
    targetWaktuMitigasi: 'TW 2',
    biayaRencanaPengendalian: 140000000,
    picDepartemen: 'Departemen Manajemen Risiko Korporat',
    picPelaksana: 'Departemen Manajemen Risiko Korporat',
    picPengendali: 'Departemen Manajemen Risiko Korporat',
    jenisAnggaran: 'Operasional / OPEX',
    statusWorkflow: 'Disetujui_Dalam_Pengendalian',
    statusPelaksanaanTerakhir: 'Sedang Berjalan',
    progressPelaksanaanTerakhir: 50,
    pengendalianTriwulan: [
      {
        triwulan: 'TW 1',
        realisasiKegiatan: 'Standarisasi 45 parameter KRI korporat dan integrasi modul rekapitulasi multi-tahun 2024+',
        realisasiBiaya: 70000000,
        progressPersen: 50,
        kemungkinanResidual: 2,
        dampakResidual: 3,
        tingkatResidual: 'Low to Mod',
        statusPengendalian: 'On Track',
        isPicAcc: true,
        accBy: 'Risk Admin Korporat',
        kendalaDanTindakLanjut: 'Integrasi KRI seluruh unit kerja berjalan sesuai target RKAP 2027.',
        updatedAt: '2026-03-31T14:00:00Z'
      }
    ],
    createdDate: '2026-02-02T09:00:00Z',
    updatedDate: '2026-03-31T14:00:00Z',
    createdBy: 'Risk Admin Korporat'
  }
];


export const MASTER_DEPARTMENTS: OrganizationMaster[] = [
  {
    kode: '50095068',
    nama: 'Departemen Pengel. Transformasi Bisnis',
    direktorat: 'Direktorat Transformasi Bisnis',
    kepalaUnit: 'Vice President Pengelolaan Transformasi Bisnis',
    totalRisiko: 0,
    officers: [],
    owners: []
  },
  {
    kode: 'JD300000',
    nama: 'DEPARTEMEN ANGGARAN',
    direktorat: 'Direktorat Keuangan & Umum',
    kepalaUnit: 'Vice President Anggaran',
    totalRisiko: 0,
    officers: [
      { nik: '112128', nama: 'Ria Ramadi Kurniawan' }
    ],
    owners: [
      { nik: '080268', nama: 'Livia Sarlita' }
    ]
  },
  {
    kode: '50000252',
    nama: 'KOMPARTEMEN SEKRETARIS PERUSAHAAN',
    direktorat: 'Sekretariat Perusahaan',
    kepalaUnit: 'SVP / Sekretaris Perusahaan',
    totalRisiko: 0,
    officers: [
      { nik: '070665', nama: 'Andika Putra' }
    ],
    owners: [
      { nik: '040981', nama: 'Indah Irmayani' }
    ]
  },
  {
    kode: '50000253',
    nama: 'KOMPARTEMEN SATUAN PENGAWASAN INTERN',
    direktorat: 'Satuan Pengawasan Intern',
    kepalaUnit: 'Kepala Satuan Pengawasan Intern (SVP)',
    totalRisiko: 0,
    officers: [
      { nik: '040478', nama: 'Firman Ajie Rayotomo' }
    ],
    owners: [
      { nik: '040866', nama: 'DIAN PERMATASARI' }
    ]
  },
  {
    kode: '50000259',
    nama: 'DEPARTEMEN KOMUNIKASI & ADMINISTRASI KORPORAT',
    direktorat: 'Sekretariat Perusahaan',
    kepalaUnit: 'Vice President Komunikasi & Administrasi Korporat',
    totalRisiko: 0,
    officers: [
      { nik: '153068', nama: 'Glory Liani Putri' },
      { nik: '140701', nama: 'Wildan Muttaqin' },
      { nik: '111104', nama: 'M Iqbal Akbar' }
    ],
    owners: [
      { nik: '930011', nama: 'Rustam Effendi' }
    ]
  },
  {
    kode: '50000260',
    nama: 'DEPARTEMEN MANAJEMEN RISIKO',
    direktorat: 'Direktorat Utama',
    kepalaUnit: 'Vice President Manajemen Risiko',
    totalRisiko: 0,
    officers: [
      { nik: '140088', nama: 'Ade Lia Diani Safitri' },
      { nik: '080557', nama: 'Nurhadi' },
      { nik: '080482', nama: 'Arimeldi Adrian' },
      { nik: '122424', nama: 'Heru Presetio' },
      { nik: '090061', nama: 'Khoiril Anwar' }
    ],
    owners: [
      { nik: '930116', nama: 'Amir Hamzah' }
    ]
  },
  {
    kode: 'OP-IIB',
    nama: 'Departemen Operasi Pabrik Pusri IIB',
    direktorat: 'Direktorat Operasi & Produksi',
    kepalaUnit: 'Bambang Irawan, S.T. (VP)',
    totalRisiko: 1,
    officers: [
      { nik: '132109', nama: 'M. Ridwan Fadli' }
    ],
    owners: [
      { nik: '050112', nama: 'Bambang Irawan, S.T.' }
    ]
  },
  {
    kode: 'OP-III',
    nama: 'Departemen Operasi Pabrik Pusri III',
    direktorat: 'Direktorat Operasi & Produksi',
    kepalaUnit: 'Ir. Ahmad Subari (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '133201', nama: 'Hendra Saputra' }
    ],
    owners: [
      { nik: '040811', nama: 'Ir. Ahmad Subari' }
    ]
  },
  {
    kode: 'OP-IV',
    nama: 'Departemen Operasi Pabrik Pusri IV',
    direktorat: 'Direktorat Operasi & Produksi',
    kepalaUnit: 'Kurniawan Pratama, S.T. (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '142318', nama: 'Fajar Nugraha' }
    ],
    owners: [
      { nik: '061022', nama: 'Kurniawan Pratama, S.T.' }
    ]
  },
  {
    kode: 'OP-V',
    nama: 'Departemen Operasi Pabrik Pusri V',
    direktorat: 'Direktorat Operasi & Produksi',
    kepalaUnit: 'M. Rizky Ramadhan, S.T. (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '150419', nama: 'Ilham Syahputra' }
    ],
    owners: [
      { nik: '070933', nama: 'M. Rizky Ramadhan, S.T.' }
    ]
  },
  {
    kode: 'RP-PROD',
    nama: 'Departemen Rencana & Pengendalian Produksi',
    direktorat: 'Direktorat Operasi & Produksi',
    kepalaUnit: 'Faisal Akbar, M.T. (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '130776', nama: 'Ilham Ramadhan' }
    ],
    owners: [
      { nik: '070114', nama: 'Faisal Akbar, M.T.' }
    ]
  },
  {
    kode: 'HAR-MEK',
    nama: 'Departemen Pemeliharaan Mekanikal',
    direktorat: 'Direktorat Operasi & Produksi',
    kepalaUnit: 'Ir. Hendra Kusuma (VP)',
    totalRisiko: 1,
    officers: [
      { nik: '121990', nama: 'Reza Pratama' }
    ],
    owners: [
      { nik: '060877', nama: 'Ir. Hendra Kusuma' }
    ]
  },
  {
    kode: 'HAR-ELINS',
    nama: 'Departemen Pemeliharaan Listrik & Instrumen',
    direktorat: 'Direktorat Operasi & Produksi',
    kepalaUnit: 'Agung Wicaksono, S.T. (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '138812', nama: 'Satria Dewa' }
    ],
    owners: [
      { nik: '061245', nama: 'Agung Wicaksono, S.T.' }
    ]
  },
  {
    kode: 'INSP-TEK',
    nama: 'Departemen Inspeksi Teknik',
    direktorat: 'Direktorat Operasi & Produksi',
    kepalaUnit: 'Ir. Wahyu Hidayat (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '129983', nama: 'Doni Prasetya' }
    ],
    owners: [
      { nik: '050412', nama: 'Ir. Wahyu Hidayat' }
    ]
  },
  {
    kode: 'K3',
    nama: 'Departemen Keselamatan & Kesehatan Kerja (K3)',
    direktorat: 'Direktorat Operasi & Produksi',
    kepalaUnit: 'Agus Setiawan, S.T., M.Env. (VP)',
    totalRisiko: 1,
    officers: [
      { nik: '141205', nama: 'Bayu Wicaksono' }
    ],
    owners: [
      { nik: '070334', nama: 'Agus Setiawan, S.T., M.Env.' }
    ]
  },
  {
    kode: 'LH',
    nama: 'Departemen Lingkungan Hidup',
    direktorat: 'Direktorat Operasi & Produksi',
    kepalaUnit: 'Dr. Ir. Ratna Sari (VP)',
    totalRisiko: 1,
    officers: [
      { nik: '150881', nama: 'Dewi Anggraini' }
    ],
    owners: [
      { nik: '040119', nama: 'Dr. Ir. Ratna Sari' }
    ]
  },
  {
    kode: 'SDM-ORG',
    nama: 'Departemen Pengembangan SDM & Organisasi',
    direktorat: 'Direktorat SDM & Umum',
    kepalaUnit: 'Nurul Hidayati, S.Psi., M.M. (VP)',
    totalRisiko: 1,
    officers: [
      { nik: '130456', nama: 'Taufik Hidayat' }
    ],
    owners: [
      { nik: '080321', nama: 'Nurul Hidayati, S.Psi., M.M.' }
    ]
  },
  {
    kode: 'DIKLAT',
    nama: 'Departemen Pendidikan & Pelatihan (Diklat)',
    direktorat: 'Direktorat SDM & Umum',
    kepalaUnit: 'Budi Santoso, S.Pd., M.M. (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '141872', nama: 'Ahmad Syafiq' }
    ],
    owners: [
      { nik: '071109', nama: 'Budi Santoso, S.Pd., M.M.' }
    ]
  },
  {
    kode: 'REM-HI',
    nama: 'Departemen Remunerasi & Hubungan Industrial',
    direktorat: 'Direktorat SDM & Umum',
    kepalaUnit: 'Indra Gunawan, S.H. (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '139044', nama: 'Roni Iskandar' }
    ],
    owners: [
      { nik: '061988', nama: 'Indra Gunawan, S.H.' }
    ]
  },
  {
    kode: 'SAR-UMUM',
    nama: 'Departemen Sarana & Umum',
    direktorat: 'Direktorat SDM & Umum',
    kepalaUnit: 'Drs. Heru Prasetyo (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '128834', nama: 'Dedi Sunardi' }
    ],
    owners: [
      { nik: '051120', nama: 'Drs. Heru Prasetyo' }
    ]
  },
  {
    kode: 'SEKURITI',
    nama: 'Departemen Keamanan / Sekuriti',
    direktorat: 'Direktorat SDM & Umum',
    kepalaUnit: 'Mayor (Purn) Darmawan (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '134590', nama: 'Eko Wahyudi' }
    ],
    owners: [
      { nik: '060134', nama: 'Mayor (Purn) Darmawan' }
    ]
  },
  {
    kode: 'TJSL',
    nama: 'Departemen Tanggung Jawab Sosial & Lingkungan (TJSL)',
    direktorat: 'Direktorat Keuangan & Umum',
    kepalaUnit: 'Dra. Sri Wahyuni, M.M. (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '145612', nama: 'Intan Permata' }
    ],
    owners: [
      { nik: '062201', nama: 'Dra. Sri Wahyuni, M.M.' }
    ]
  },
  {
    kode: 'PENGADAAN',
    nama: 'Departemen Pengadaan Barang & Jasa',
    direktorat: 'Direktorat Keuangan & Umum',
    kepalaUnit: 'Arief Budiman, S.T. (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '141098', nama: 'Rahmat Hidayat' }
    ],
    owners: [
      { nik: '061145', nama: 'Arief Budiman, S.T.' }
    ]
  },
  {
    kode: 'HUMAS',
    nama: 'Departemen Hubungan Masyarakat (Humas)',
    direktorat: 'Sekretariat Perusahaan',
    kepalaUnit: 'Rustam Effendi, S.Sos. (VP)',
    totalRisiko: 0,
    officers: [
      { nik: '139981', nama: 'Nadia Safitri' }
    ],
    owners: [
      { nik: '050212', nama: 'Rustam Effendi, S.Sos.' }
    ]
  },
  {
    kode: 'HUKUM',
    nama: 'Departemen Hukum (Corporate Legal)',
    direktorat: 'Sekretariat Perusahaan',
    kepalaUnit: 'Maya Lestari, S.H., M.Kn. (VP)',
    totalRisiko: 1,
    officers: [
      { nik: '160204', nama: 'Nadia Salsabila' }
    ],
    owners: [
      { nik: '050789', nama: 'Maya Lestari, S.H., M.Kn.' }
    ]
  },
  {
    kode: 'KEU-AKUN',
    nama: 'Departemen Keuangan & Akuntansi',
    direktorat: 'Direktorat Keuangan & Umum',
    kepalaUnit: 'Ahmad Fauzi, S.E., Ak. (VP)',
    totalRisiko: 1,
    officers: [
      { nik: '140992', nama: 'Fajar Siddiq' }
    ],
    owners: [
      { nik: '060445', nama: 'Ahmad Fauzi, S.E., Ak.' }
    ]
  },
  {
    kode: 'TI',
    nama: 'Departemen Teknologi Informasi',
    direktorat: 'Direktorat Transformasi Bisnis',
    kepalaUnit: 'Ir. Dedi Kurniawan, M.Kom. (VP)',
    totalRisiko: 1,
    officers: [
      { nik: '150117', nama: 'Dimas Arya' }
    ],
    owners: [
      { nik: '050998', nama: 'Ir. Dedi Kurniawan, M.Kom.' }
    ]
  },
  {
    kode: 'MR-CORP',
    nama: 'Departemen Manajemen Risiko Korporat',
    direktorat: 'Direktorat Utama',
    kepalaUnit: 'Vice President Manajemen Risiko Korporat',
    totalRisiko: 0,
    officers: [
      { nik: '140088', nama: 'Ade Lia Diani Safitri' },
      { nik: '080482', nama: 'Arimeldi Adrian' }
    ],
    owners: [
      { nik: '930116', nama: 'Amir Hamzah' }
    ]
  }
];

export const MASTER_CHECKLIST: MasterChecklistItem[] = [
  {
    id: 'MC-OP-01',
    kategori: 'Operasional',
    jenisRisiko: 'Unplanned Shutdown Pabrik Akibat Masalah Utilitas / Energi',
    deskripsiStandar: 'Risiko kegagalan pasokan gas alam, listrik PLN, steam boiler, atau air pendingin (cooling water) yang memicu trip peralatan utama pabrik.',
    faktorPemicuUmum: 'Peralatan tua, tekanan pipa drop, kavitasi pompa, lonjakan voltase transmisi.',
    rekomendasiPengendalian: 'Sistem UPS ganda, interlock proteksi otomatis, kontrak SLA tekanan bahan baku, predictive vibration analysis.'
  },
  {
    id: 'MC-OP-02',
    kategori: 'Operasional',
    jenisRisiko: 'Keterlambatan Pasokan Suku Cadang Kritis & Material Turn Around',
    deskripsiStandar: 'Risiko lead time impor spare parts spesifik (impeller, catalyst, turbine rotor) melebihi batas waktu eksekusi jadwal perawatan.',
    faktorPemicuUmum: 'Geopolitik logistik pelayaran internasional, izin ekspor impor, custom clearance.',
    rekomendasiPengendalian: 'Purchase order minimal 9 bulan sebelum TA, klausul penalti delivery, multi-vendor sourcing lokal terakreditasi.'
  },
  {
    id: 'MC-OP-03',
    kategori: 'Operasional',
    jenisRisiko: 'Hambatan Alur Pelayaran & Angkutan Pupuk Jalur Sungai Musi',
    deskripsiStandar: 'Risiko pendangkalan sedimentasi alur perairan sungai yang menghambat draft kapal pupuk curah/kantong.',
    faktorPemicuUmum: 'Sedimentasi musim kemarau, pasang surut air laut muara Sungai Musi.',
    rekomendasiPengendalian: 'Pengerukan alur berkala bersama KSOP, pemanfaatan terminal transit multimoda terpadu.'
  },
  {
    id: 'MC-OP-04',
    kategori: 'Operasional',
    jenisRisiko: 'Kegagalan Integritas Bejana Tekan & Perpipaan Bahan Kimia Berbahaya',
    deskripsiStandar: 'Risiko kebocoran gas amoniak/reformer bertekanan tinggi akibat korosi, retak pengelasan, atau kelelahan material.',
    faktorPemicuUmum: 'Stress corrosion cracking, vibrasi pipa, degradasi pelapis anti korosi.',
    rekomendasiPengendalian: 'Program Risk-Based Inspection (RBI) berkala, ultrasonic phased array mapping, peremajaan insulasi pipa.'
  },
  {
    id: 'MC-KEU-01',
    kategori: 'Keuangan',
    jenisRisiko: 'Volatilitas Nilai Tukar Valuta Asing (Kurs USD)',
    deskripsiStandar: 'Risiko pembengkakan biaya impor gas bumi/amoniak/sparepart dalam mata uang Dollar AS melampaui asumsi kurs RKAP.',
    faktorPemicuUmum: 'Kebijakan moneter global, inflasi, ketidakstabilan neraca perdagangan.',
    rekomendasiPengendalian: 'Hedging lindung nilai forward kontrak bank BUMN, matching pendapatan ekspor valas.'
  },
  {
    id: 'MC-KEU-02',
    kategori: 'Keuangan',
    jenisRisiko: 'Keterlambatan Penagihan Piutang Subsidi Pupuk & Likuiditas Kas',
    deskripsiStandar: 'Risiko perlambatan verifikasi penagihan subsidi pupuk dari pemerintah yang berdampak pada cash flow operasional.',
    faktorPemicuUmum: 'Audit kelengkapan dokumen penyaluran berjenjang, rekonsiliasi e-Verval kios.',
    rekomendasiPengendalian: 'Percepatan digitalisasi e-Verval, fasilitas SCF (Supply Chain Financing) perbankan Himbara.'
  },
  {
    id: 'MC-KEU-03',
    kategori: 'Keuangan',
    jenisRisiko: 'Eskalasi Biaya Capex Proyek Modernisasi Pabrik (Cost Overrun)',
    deskripsiStandar: 'Risiko pembengkakan realisasi biaya proyek pembangunan/revamping melampaui anggaran pagu RKAP.',
    faktorPemicuUmum: 'Kenaikan harga material baja global, variasi order pekerjaan tak terduga, perpanjangan masa konstruksi.',
    rekomendasiPengendalian: 'Value engineering review, klausul kontrak lump sum turn-key, pengawasan milestone proyek ketat.'
  },
  {
    id: 'MC-STRAT-01',
    kategori: 'Strategis',
    jenisRisiko: 'Kepatuhan Regulasi Pajak Karbon & Target Dekarbonisasi BUMN',
    deskripsiStandar: 'Risiko beban penalti kuota emisi gas rumah kaca cerobong industri kimia melampaui alokasi yang ditetapkan pemerintah.',
    faktorPemicuUmum: 'Penerapan Permen LHK batas emisi industri pupuk, lambatnya adopsi teknologi CCUS.',
    rekomendasiPengendalian: 'Audit energi ISO 50001, studi kelayakan CCUS, elektrifikasi motor penggerak.'
  },
  {
    id: 'MC-STRAT-02',
    kategori: 'Strategis',
    jenisRisiko: 'Kesenjangan Kompetensi SDM Menghadapi Digitalisasi & Pabrik Baru',
    deskripsiStandar: 'Risiko ketidaksiapan tenaga kerja terampil bersertifikasi dalam mengoperasikan teknologi otomasi pabrik modern.',
    faktorPemicuUmum: 'Pensiun alami tenaga ahli senior, pesatnya transformasi teknologi DCS/SCADA.',
    rekomendasiPengendalian: 'Pusri Talent Factory, program mentoring intensif, sertifikasi BNSP petrokimia.'
  },
  {
    id: 'MC-STRAT-03',
    kategori: 'Strategis',
    jenisRisiko: 'Perubahan Kebijakan Alokasi & Tata Kelola Pupuk Bersubsidi Nasional',
    deskripsiStandar: 'Risiko pergeseran jenis komoditas tanaman sasaran dan kuota pupuk subsidi yang mempengaruhi serapan pasar.',
    faktorPemicuUmum: 'Kebijakan Kementerian Pertanian, dinamika anggaran fiskal APBN.',
    rekomendasiPengendalian: 'Ekspansi pasar pupuk non-subsidi komersial (retail & perkebunan), diversifikasi produk NPK custom.'
  },
  {
    id: 'MC-HKM-01',
    kategori: 'Hukum & Kepatuhan',
    jenisRisiko: 'Sengketa Tata Kelola Penyaluran Pupuk Bersubsidi & e-Alokasi',
    deskripsiStandar: 'Risiko ketidaksesuaian administrasi penyaluran pupuk bersubsidi pada kios pengecer resmi yang memicu temuan audit BPK/APIP.',
    faktorPemicuUmum: 'Kendala sinyal digitalisasi petani, perbedaan data NIK Dukcapil & Simluhtan.',
    rekomendasiPengendalian: 'Integrasi API real-time, audit kepatuhan sampling acak distributor, hotline aduan terpadu.'
  },
  {
    id: 'MC-HKM-02',
    kategori: 'Hukum & Kepatuhan',
    jenisRisiko: 'Ketidakpatuhan Baku Mutu Lingkungan Hidup & Pengelolaan Limbah (Proper)',
    deskripsiStandar: 'Risiko parameter limbah cair/udara/B3 melebihi ambang batas toleransi dinas lingkungan hidup.',
    faktorPemicuUmum: 'Fluktuasi beban IPAL saat start-up, gangguan dosing kimia penetralisir.',
    rekomendasiPengendalian: 'Continuous Emission Monitoring System (CEMS) online KLHK, emergency retention pond buffer ganda.'
  }
];

export const PUSRI_SOP_STAGES: SopStage[] = [
  { step: 1, title: 'Penetapan Konteks & Sasaran', pic: 'Semua Unit Kerja', description: 'Menetapkan konteks eksternal, internal, dan sasaran strategis sesuai RKAP Pusri 2026.', output: 'Form Formulir Konteks Risiko Unit', kategoriSOP: 'Perencanaan' },
  { step: 2, title: 'Identifikasi Pernyataan Risiko', pic: 'Risk Officer', description: 'Mengidentifikasi peristiwa risiko potensial menggunakan pendekatan akar masalah (root cause).', output: 'Draft Daftar Risiko (Register)', kategoriSOP: 'Identifikasi & Analisis' },
  { step: 3, title: 'Analisis Kemungkinan (Likelihood)', pic: 'Risk Officer', description: 'Menentukan skala kemungkinan terjadinya risiko (Skala 1 - Sangat Jarang s/d 5 - Sangat Sering).', output: 'Skor Kemungkinan', kategoriSOP: 'Identifikasi & Analisis' },
  { step: 4, title: 'Analisis Dampak (Consequence)', pic: 'Risk Officer', description: 'Menentukan tingkat keparahan finansial, operasional, reputasi, dan hukum (Skala 1 - Ringan s/d 5 - Bencana).', output: 'Skor Dampak', kategoriSOP: 'Identifikasi & Analisis' },
  { step: 5, title: 'Evaluasi & Penetapan Matriks (5x5)', pic: 'Risk Officer & Risk Owner', description: 'Memetakan nilai inherent score ke dalam Peta Matriks Risiko Korporat PT Pupuk Sriwidjaja.', output: 'Status Tingkat Risiko (High, Mod to High, Moderate, Low)', kategoriSOP: 'Identifikasi & Analisis' },
  { step: 6, title: 'Penetapan Strategi Penanganan', pic: 'Risk Officer', description: 'Memilih strategi penanganan: Mitigasi, Diterima, Dihindari, atau Ditransfer sesuai batas toleransi.', output: 'Strategi Penanganan Terpilih', kategoriSOP: 'Evaluasi & Respon' },
  { step: 7, title: 'Penyusunan Rencana Tindak Mitigasi', pic: 'Risk Officer & Departemen PIC', description: 'Menyusun aksi konkret, estimasi kebutuhan biaya (OPEX/CAPEX), dan target waktu penyelesaian (TW 1-4).', output: 'Action Plan Mitigasi', kategoriSOP: 'Evaluasi & Respon' },
  { step: 8, title: 'Review & Persetujuan Risk Owner (VP)', pic: 'Risk Owner (VP Unit)', description: 'Risk Owner unit kerja menelaah relevansi risiko, kecukupan mitigasi, dan usulan anggaran sebelum diajukan ke korporat.', output: 'Status Approved by Risk Owner', kategoriSOP: 'Evaluasi & Respon' },
  { step: 9, title: 'Verifikasi & Approval Risk Admin Korporat', pic: 'Risk Admin Korporat', description: 'Departemen Manajemen Risiko melakukan harmonisasi, registrasi resmi, dan penetapan Departemen PIC resmi.', output: 'Registrasi Resmi Korporat & Penugasan Departemen PIC', kategoriSOP: 'Evaluasi & Respon' },
  { step: 10, title: 'Eksekusi & Pemantauan Triwulan I (TW 1)', pic: 'Risk Officer (Departemen PIC)', description: 'Pelaksanaan tindakan pengendalian dan pelaporan realisasi fisik (%) serta serapan biaya TW 1.', output: 'Laporan Monitoring TW 1 & Skor Residual TW 1', kategoriSOP: 'Monitoring & Review' },
  { step: 11, title: 'Eksekusi & Pemantauan Triwulan II (TW 2)', pic: 'Risk Officer (Departemen PIC)', description: 'Evaluasi kemajuan mitigasi tengah tahun dan penyesuaian strategi bila terdapat kendala lapangan.', output: 'Laporan Monitoring TW 2 & Skor Residual TW 2', kategoriSOP: 'Monitoring & Review' },
  { step: 12, title: 'Eksekusi & Pemantauan Triwulan III (TW 3)', pic: 'Risk Officer (Departemen PIC)', description: 'Monitoring akselerasi mitigasi menjelang kuartal akhir penutupan buku tahun berjalan.', output: 'Laporan Monitoring TW 3 & Skor Residual TW 3', kategoriSOP: 'Monitoring & Review' },
  { step: 13, title: 'Eksekusi & Pemantauan Triwulan IV (TW 4)', pic: 'Risk Officer (Departemen PIC)', description: 'Finalisasi realisasi program mitigasi tahun 2026 dan pengukuran efektivitas pengendalian residual.', output: 'Laporan Penutupan Tahunan TW 4', kategoriSOP: 'Monitoring & Review' },
  { step: 14, title: 'Evaluasi Efektivitas Pengendalian', pic: 'Risk Admin Korporat', description: 'Menilai apakah risiko berhasil diturunkan ke selera risiko (risk appetite) yang dapat diterima korporat.', output: 'Pernyataan Selesai / Terkendali Baik', kategoriSOP: 'Monitoring & Review' },
  { step: 15, title: 'Evaluasi Usulan Carry Over', pic: 'Risk Admin & Komite Risiko', description: 'Untuk risiko proyek jangka panjang yang belum tuntas, disusun kajian Carry Over ke RKAP tahun berikutnya.', output: 'Berita Acara Carry Over (Target 2027)', kategoriSOP: 'Monitoring & Review' },
  { step: 16, title: 'Pelaporan Komite & Direksi PT Pupuk Sriwidjaja', pic: 'Direksi & Dewan Komisaris', description: 'Penyampaian laporan profil risiko komprehensif kepada Direksi dan Pemegang Saham Holding Pupuk Indonesia.', output: 'Laporan Tahunan Profil Risiko Korporat', kategoriSOP: 'Monitoring & Review' }
];
