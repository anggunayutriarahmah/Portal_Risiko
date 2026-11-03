import React from 'react';
import { RiskHandlingStrategy, RiskCategory, PertanyaanInvestasiRutin } from '../types/pusri';
import { Info, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface MitigasiRiskFieldsProps {
  // Treatment selection
  jenisPenanganan: RiskHandlingStrategy;
  onChangeJenisPenanganan: (strategy: RiskHandlingStrategy) => void;

  // Text inputs
  keteranganRiskTreatment: string;
  onChangeKeteranganRiskTreatment: (val: string) => void;
  rencanaPengendalian: string;
  onChangeRencanaPengendalian: (val: string) => void;

  // Expected Matrix
  expectedLikelihood: number;
  onChangeExpectedLikelihood: (lvl: number) => void;
  expectedConsequence: number;
  onChangeExpectedConsequence: (lvl: number) => void;

  // Budget
  biaya: number;
  onChangeBiaya: (val: number) => void;
  jenisAnggaran: string;
  onChangeJenisAnggaran: (val: string) => void;

  // Pertanyaan Khusus Investasi Rutin
  pertanyaanInvestasi: PertanyaanInvestasiRutin;
  onChangePertanyaanInvestasi: (updated: PertanyaanInvestasiRutin) => void;

  // Bidang / Fungsi Risiko
  bidangFungsi: RiskCategory | string;
  onChangeBidangFungsi: (val: RiskCategory) => void;
  subBidang: string;
  onChangeSubBidang: (val: string) => void;
  bidangProyek: string;
  onChangeBidangProyek: (val: string) => void;

  // Radio button namespace for avoiding collisions
  namePrefix?: string;
}

// 1. Data Likelihood / Kemungkinan Expected
export const EXPECTED_LIKELIHOOD_DATA = [
  {
    level: 1,
    kualitatif: 'Hampir Tidak Mungkin Terjadi',
    persentase: '> 0% - 15%',
    frekuensi: 'Diperkirakan akan terjadi lebih dari dua tahun ke depan',
    kecepatan: 'Pernah terjadi 1 kali dalam lebih dari 5 tahun terakhir'
  },
  {
    level: 2,
    kualitatif: 'Kemungkinan Kecil Terjadi',
    persentase: '> 15% - 35%',
    frekuensi: 'Diperkirakan akan terjadi dalam 2 tahun ke depan',
    kecepatan: 'Pernah terjadi 1 kali dalam 2 sampai 5 tahun terakhir'
  },
  {
    level: 3,
    kualitatif: 'Kemungkinan Terjadi dan Tidak Sama Besar',
    persentase: '> 35% - 60%',
    frekuensi: 'Diperkirakan baru akan terjadi tahun depan',
    kecepatan: 'Pernah terjadi 1 kali dalam satu tahun terakhir'
  },
  {
    level: 4,
    kualitatif: 'Kemungkinan Besar Terjadi',
    persentase: '> 60% - 85%',
    frekuensi: 'Diperkirakan akan terjadi dalam tahun ini',
    kecepatan: 'Pernah terjadi 2 kali dalam satu tahun terakhir'
  },
  {
    level: 5,
    kualitatif: 'Hampir Pasti Terjadi',
    persentase: '> 85%',
    frekuensi: 'Diperkirakan akan segera terjadi (dalam 6 Bulan setelah risiko teridentifikasi)',
    kecepatan: 'Pernah terjadi lebih dari 2 kali dalam satu tahun terakhir'
  }
];

// 2. Data Dampak / Consequences Keuangan Expected
export const EXPECTED_FINANCIAL_CONSEQUENCES_DATA = [
  {
    level: 1,
    label: '1 - Insignificant',
    deskripsi: 'Kehilangan ≤1% dari Total Aset, atau dari Total Pendapatan, atau dari Pendapatan Subsidi, atau dari Pendapatan Usaha, atau dari EBIT, atau dari EBITDA, atau dari Laba Bersih.'
  },
  {
    level: 2,
    label: '2 - Minor',
    deskripsi: 'Kehilangan >1% - ≤2% dari Total Aset, atau dari Total Pendapatan, atau dari Pendapatan Subsidi, atau dari Pendapatan Usaha, atau dari EBIT, atau dari EBITDA, atau dari Laba Bersih.'
  },
  {
    level: 3,
    label: '3 - Moderate',
    deskripsi: 'Kehilangan >2% - ≤3% dari Total Aset, atau dari Total Pendapatan, atau dari Pendapatan Subsidi, atau dari Pendapatan Usaha, atau dari EBIT, atau dari EB1TDA, atau dari Laba Bersih.'
  },
  {
    level: 4,
    label: '4 - Major',
    deskripsi: 'Kehilangan >3% - ≤4% dari Total Aset, atau dari Total Pendapatan, atau dari Pendapatan Subsidi, atau dari Pendapatan Usaha, atau dari EBIT, atau dari EBITDA, atau dari Laba Bersih.'
  },
  {
    level: 5,
    label: '5 - Catastrophic',
    deskripsi: 'Kehilangan >4 % dari Total Aset, atau dari Total Pendapatan, atau dari Pendapatan Subsidi, atau dari Pendapatan Usaha, atau dari EBIT, atau dari EBITDA, atau dari Laba Bersih.'
  }
];

// 3. Data Bidang / Fungsi Risiko Pusri
export const BIDANG_FUNGSI_RISIKO_DATA: Array<{
  kategori: RiskCategory;
  keterangan: string;
}> = [
  {
    kategori: 'Operasional',
    keterangan: 'Risiko yang disebabkan karena tak berjalannya atau gagalnya proses internal, manusia dan sistem, serta oleh peristiwa eksternal'
  },
  {
    kategori: 'Keuangan',
    keterangan: 'Segala macam risiko yang berkaitan dengan keuangan'
  },
  {
    kategori: 'Strategis',
    keterangan: 'Risiko yang disebabkan oleh adanya pengambilan keputusan yang tidak tepat atau kegagalan dalam merespon perubahan-perubahan kondisi eksternal'
  },
  {
    kategori: 'Hukum & Kepatuhan',
    keterangan: 'Risiko yang timbul akibat tidak mematuhi dan atau tidak melaksanakan peraturan perundang-undangan dan ketentuan yang berlaku atau risiko yang timbul karena ketidakmampuan manajemen perusahaan dalam mengelola munculnya permasalahan hukum yang dapat menimbulkan kerugian atau kebangkrutan bagi perusahaan'
  }
];

// 4. Sub Bidang options
export const SUB_BIDANG_OPTIONS = [
  'Produksi & Proses Kimia',
  'Pemeliharaan & Keandalan Pabrik',
  'Pengadaan Barang & Jasa',
  'Logistik & Distribusi Pupuk',
  'Keselamatan Kerja & K3',
  'Pengelolaan Lingkungan Hidup (LH)',
  'Akuntansi, Pajak & Keuangan',
  'Treasury & Perbankan',
  'Perencanaan Korporat & Portofolio Bisnis',
  'Hukum, Regulasi & Tata Kelola (GCG)',
  'Sumber Daya Manusia (SDM)',
  'Teknologi Informasi & Otomasi Pabrik'
];

// 5. Bidang Proyek options
export const BIDANG_PROYEK_OPTIONS = [
  'Proyek Pusri IIIB / Revamping Kompartemen',
  'Proyek Transisi Energi & Dekarbonisasi Pabrik',
  'Proyek Otomasi DCS & Digital Plant',
  'Proyek Efisiensi Energi Gas Bumi',
  'Proyek Perluasan Gudang & Dermaga Pengantongan',
  'Turn Around (TA) Terjadwal Pabrik 1B / 2B',
  'Non-Proyek / Kegiatan Operasional Rutin'
];

export const MitigasiRiskFields: React.FC<MitigasiRiskFieldsProps> = ({
  jenisPenanganan,
  onChangeJenisPenanganan,
  keteranganRiskTreatment,
  onChangeKeteranganRiskTreatment,
  rencanaPengendalian,
  onChangeRencanaPengendalian,
  expectedLikelihood,
  onChangeExpectedLikelihood,
  expectedConsequence,
  onChangeExpectedConsequence,
  biaya,
  onChangeBiaya,
  jenisAnggaran,
  onChangeJenisAnggaran,
  pertanyaanInvestasi,
  onChangePertanyaanInvestasi,
  bidangFungsi,
  onChangeBidangFungsi,
  subBidang,
  onChangeSubBidang,
  bidangProyek,
  onChangeBidangProyek,
  namePrefix = 'mitigasi_field'
}) => {
  const isMitigasi = jenisPenanganan === 'Mitigasi';

  const updatePertanyaan = (key: keyof PertanyaanInvestasiRutin, value: string) => {
    onChangePertanyaanInvestasi({
      ...pertanyaanInvestasi,
      [key]: value
    });
  };

  return (
    <div className="space-y-4 pt-2">
      {/* 1. Baris Risk Treatment Dropdown */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Risk Treatment *
          </label>
          <span
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold cursor-help"
            title="Pilih strategi penanganan risiko: Mitigasi, Diterima, Dihindari, atau Ditransfer"
          >
            ⓘ
          </span>
        </div>
        <select
          value={jenisPenanganan}
          onChange={(e) => onChangeJenisPenanganan(e.target.value as RiskHandlingStrategy)}
          className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all cursor-pointer"
        >
          <option value="Mitigasi">Mitigasi</option>
          <option value="Diterima">Diterima</option>
          <option value="Dihindari">Dihindari</option>
          <option value="Transfer">Ditransfer</option>
        </select>
      </div>

      {/* JIKA BUKAN MITIGASI: HANYA MUNCUL DATA YANG DI ATAS (keterangan alasan penanganan) */}
      {!isMitigasi && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
            <Info className="w-4 h-4 shrink-0" />
            <span>Strategi Penanganan Non-Mitigasi Terpilih ({jenisPenanganan})</span>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
            Risiko dengan penanganan selain <strong>Mitigasi</strong> tidak memerlukan pengisian tabel Expected Likelihood/Dampak, rincian anggaran Investasi Rutin, dan Bidang Proyek. Cukup lengkapi data profil risiko dan alasan perlakuan di bawah.
          </p>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Keterangan Alasan Penanganan ({jenisPenanganan}) *
            </label>
            <textarea
              rows={2}
              value={keteranganRiskTreatment}
              onChange={(e) => onChangeKeteranganRiskTreatment(e.target.value)}
              placeholder={
                jenisPenanganan === 'Diterima'
                  ? 'Contoh: Risiko diterima dalam batas toleransi selera risiko operasional unit kerja...'
                  : jenisPenanganan === 'Dihindari'
                    ? 'Contoh: Menghentikan atau membatalkan aktivitas operasional penyebab risiko...'
                    : 'Contoh: Pengalihan risiko via klausul kontrak asuransi atau mitra kerja...'
              }
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none"
            />
          </div>
        </div>
      )}

      {/* JIKA MITIGASI: MUNCUL SEMUA DATA RINCIAN FORMULIR MITIGASI (PERSIS TAMPILAN GAMBAR) */}
      {isMitigasi && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* 2. Keterangan Risk Treatment * ⓘ */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Keterangan Risk Treatment *
              </label>
              <span
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold cursor-help"
                title="Deskripsi penjelasan mengenai strategi penanganan mitigasi"
              >
                ⓘ
              </span>
            </div>
            <textarea
              rows={2}
              required
              value={keteranganRiskTreatment}
              onChange={(e) => onChangeKeteranganRiskTreatment(e.target.value)}
              placeholder=""
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all resize-none leading-relaxed"
            />
          </div>

          {/* 3. Rencana Pengendalian * ⓘ */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Rencana Pengendalian *
              </label>
              <span
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold cursor-help"
                title="Langkah-langkah terperinci untuk mengendalikan atau memitigasi risiko"
              >
                ⓘ
              </span>
            </div>
            <textarea
              rows={2}
              required
              value={rencanaPengendalian}
              onChange={(e) => onChangeRencanaPengendalian(e.target.value)}
              placeholder=""
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all resize-none leading-relaxed"
            />
          </div>

          {/* 4. (EXPECTED) Likelihood / Kemungkinan * */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                (EXPECTED) Likelihood / Kemungkinan *
              </label>
              {expectedLikelihood > 0 && (
                <span className="text-[11px] font-bold text-[#009fe3] dark:text-sky-400">
                  Level {expectedLikelihood} Terpilih
                </span>
              )}
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <th className="py-2.5 px-3 text-center w-12 font-bold">Pilih</th>
                    <th className="py-2.5 px-3 min-w-[180px] font-bold">Probabilitas Kualitatif</th>
                    <th className="py-2.5 px-3 min-w-[90px] font-bold">Persentase</th>
                    <th className="py-2.5 px-3 min-w-[200px] font-bold">Frekuensi</th>
                    <th className="py-2.5 px-3 min-w-[200px] font-bold">Kecepatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {EXPECTED_LIKELIHOOD_DATA.map((row) => {
                    const isSelected = expectedLikelihood === row.level;
                    return (
                      <tr
                        key={row.level}
                        onClick={() => onChangeExpectedLikelihood(row.level)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-slate-100 font-semibold'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center align-middle">
                          <input
                            type="radio"
                            name={`${namePrefix}_expected_lik`}
                            checked={isSelected}
                            onChange={() => onChangeExpectedLikelihood(row.level)}
                            className="w-4 h-4 text-[#009fe3] focus:ring-[#009fe3] cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 align-middle font-medium">
                          {row.kualitatif}
                        </td>
                        <td className="py-2.5 px-3 align-middle font-mono font-medium text-slate-600 dark:text-slate-400">
                          {row.persentase}
                        </td>
                        <td className="py-2.5 px-3 align-middle text-slate-600 dark:text-slate-400">
                          {row.frekuensi}
                        </td>
                        <td className="py-2.5 px-3 align-middle text-slate-600 dark:text-slate-400">
                          {row.kecepatan}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. (EXPECTED) Consequences / Dampak * */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                (EXPECTED) Consequences / Dampak *
              </label>
              {expectedConsequence > 0 && (
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  Level {expectedConsequence} Terpilih
                </span>
              )}
            </div>
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Kriteria Dampak Risiko terhadap Keuangan
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <th className="py-2.5 px-3 text-center w-12 font-bold">Pilih</th>
                    <th className="py-2.5 px-3 min-w-[130px] font-bold">Level</th>
                    <th className="py-2.5 px-3 min-w-[340px] font-bold">Dampak Kerugian terhadap Keuangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {EXPECTED_FINANCIAL_CONSEQUENCES_DATA.map((row) => {
                    const isSelected = expectedConsequence === row.level;
                    return (
                      <tr
                        key={row.level}
                        onClick={() => onChangeExpectedConsequence(row.level)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100 font-semibold'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center align-middle">
                          <input
                            type="radio"
                            name={`${namePrefix}_expected_csq`}
                            checked={isSelected}
                            onChange={() => onChangeExpectedConsequence(row.level)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 align-middle font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {row.label}
                        </td>
                        <td className="py-2.5 px-3 align-middle text-slate-600 dark:text-slate-400 leading-relaxed">
                          {row.deskripsi}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Biaya Rencana Pengendalian ⓘ & Jenis Anggaran */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Biaya Rencana Pengendalian
                </label>
                <span
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold cursor-help"
                  title="Estimasi nominal biaya yang diperlukan untuk melaksanakan rencana pengendalian mitigasi"
                >
                  ⓘ
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Rp {(biaya || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={biaya > 0 ? biaya.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const cleanDigits = e.target.value.replace(/[^0-9]/g, '');
                  onChangeBiaya(cleanDigits ? parseInt(cleanDigits, 10) : 0);
                }}
                className="w-full h-10 pl-10 pr-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[0, 10000000, 25000000, 50000000, 100000000, 250000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => onChangeBiaya(amt)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-md border transition-colors cursor-pointer ${
                    biaya === amt
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {amt === 0 ? 'Rp 0' : `${amt / 1000000} Jt`}
                </button>
              ))}
            </div>

            {/* Jenis Anggaran */}
            <div className="pt-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  bila ada biaya, pilih jenis anggaran
                </label>
                <span
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold cursor-help"
                  title="Pilih klasifikasi jenis anggaran untuk biaya pengendalian risiko"
                >
                  ⓘ
                </span>
              </div>
              <select
                value={jenisAnggaran || 'Investasi Rutin'}
                onChange={(e) => onChangeJenisAnggaran(e.target.value)}
                className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all cursor-pointer"
              >
                <option value="Investasi Rutin">Investasi Rutin</option>
                <option value="Biaya Eksploitasi / OPEX">Biaya Eksploitasi / OPEX</option>
                <option value="Investasi Pengembangan">Investasi Pengembangan</option>
                <option value="Capex Proyek Khusus">Capex Proyek Khusus</option>
                <option value="Non-Anggaran / Prosedural">Non-Anggaran / Prosedural</option>
              </select>
              <p className="text-[10px] italic text-slate-400 dark:text-slate-500">
                * pilihan jenis anggaran tidak akan disimpan ke sistem bila tidak terdapat nilai biaya pengendaliannya
              </p>
            </div>
          </div>

          {/* 7. Pertanyaan Khusus Investasi Rutin (Muncul jika jenis anggaran = Investasi Rutin) */}
          {(jenisAnggaran === 'Investasi Rutin' || !jenisAnggaran) && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3.5">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Pertanyaan Khusus Investasi Rutin
                </h4>
                <p className="text-[11px] text-slate-500">
                  Kuesioner evaluasi kelayakan alokasi belanja investasi rutin unit kerja PT Pusri
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {/* 1. Sifat Investasi Rutin */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sifat Investasi Rutin adalah :
                  </label>
                  <select
                    value={pertanyaanInvestasi.sifatInvestasi || ''}
                    onChange={(e) => updatePertanyaan('sifatInvestasi', e.target.value)}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                  >
                    <option value="">- Sifat Investasi Rutin -</option>
                    <option value="Penggantian (Replacement)">Penggantian (Replacement)</option>
                    <option value="Peningkatan Keandalan Pabrik (Reliability)">Peningkatan Keandalan Pabrik (Reliability)</option>
                    <option value="Penambahan Fasilitas / Kapasitas">Penambahan Fasilitas / Kapasitas</option>
                    <option value="K3 & Lingkungan Hidup (K3LH Mandatori)">K3 & Lingkungan Hidup (K3LH Mandatori)</option>
                    <option value="Efisiensi Energi & Optimalisasi Biaya">Efisiensi Energi & Optimalisasi Biaya</option>
                    <option value="Pemenuhan Regulasi Pemerintah / SNI">Pemenuhan Regulasi Pemerintah / SNI</option>
                  </select>
                </div>

                {/* 2. Penggunaan Investasi Rutin */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Penggunaan Investasi Rutin ini adalah :
                  </label>
                  <select
                    value={pertanyaanInvestasi.penggunaanInvestasi || ''}
                    onChange={(e) => updatePertanyaan('penggunaanInvestasi', e.target.value)}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                  >
                    <option value="">- Penggunaan Investasi Rutin -</option>
                    <option value="Operasional Utama Pabrik (Pabrik 1B / 2B)">Operasional Utama Pabrik (Pabrik 1B / 2B)</option>
                    <option value="Peralatan Statis, Rotating, & Turbin">Peralatan Statis, Rotating, & Turbin</option>
                    <option value="Sistem Listrik, Distribusi & Instrumen Kontrol">Sistem Listrik, Distribusi & Instrumen Kontrol</option>
                    <option value="Perpipaan & Pengolahan Utilitas Pabrik">Perpipaan & Pengolahan Utilitas Pabrik</option>
                    <option value="Fasilitas Pengantongan, Dermaga & Pergudangan">Fasilitas Pengantongan, Dermaga & Pergudangan</option>
                    <option value="Laboratorium & Kontrol Kualitas Produk">Laboratorium & Kontrol Kualitas Produk</option>
                    <option value="Sistem IT, Jaringan & Keamanan Cyber">Sistem IT, Jaringan & Keamanan Cyber</option>
                  </select>
                </div>

                {/* 3. Dasar usulan Investasi Rutin */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dasar usulan Investasi Rutin ini adalah :
                  </label>
                  <select
                    value={pertanyaanInvestasi.dasarUsulan || ''}
                    onChange={(e) => updatePertanyaan('dasarUsulan', e.target.value)}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                  >
                    <option value="">- Dasar Usulan Investasi Rutin -</option>
                    <option value="Rekomendasi Hasil Audit / Inspeksi Teknis">Rekomendasi Hasil Audit / Inspeksi Teknis</option>
                    <option value="Lifetime / Umur Manfaat Peralatan Habis">Lifetime / Umur Manfaat Peralatan Habis</option>
                    <option value="Tingginya Frekuensi Breakdown / Gangguan Pabrik">Tingginya Frekuensi Breakdown / Gangguan Pabrik</option>
                    <option value="Program Turn Around (TA) / Overhaul Terencana">Program Turn Around (TA) / Overhaul Terencana</option>
                    <option value="Kepatuhan Mandatori Regulasi / K3LH">Kepatuhan Mandatori Regulasi / K3LH</option>
                    <option value="Rekomendasi Vendor / OEM Equipment">Rekomendasi Vendor / OEM Equipment</option>
                  </select>
                </div>

                {/* 4. Investasi yang diganti life timenya sudah berumur */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Investasi yang diganti life timenya sudah berumur :
                  </label>
                  <select
                    value={pertanyaanInvestasi.umurInvestasiDiganti || ''}
                    onChange={(e) => updatePertanyaan('umurInvestasiDiganti', e.target.value)}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                  >
                    <option value="">- Umur Life Time -</option>
                    <option value="< 5 Tahun">&lt; 5 Tahun</option>
                    <option value="5 - 10 Tahun">5 - 10 Tahun</option>
                    <option value="10 - 15 Tahun">10 - 15 Tahun</option>
                    <option value="15 - 20 Tahun">15 - 20 Tahun</option>
                    <option value="> 20 Tahun">&gt; 20 Tahun</option>
                  </select>
                </div>

                {/* 5. Stock Investasi yang diajukan anggarannya */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Investasi yang diajukan anggarannya :
                  </label>
                  <select
                    value={pertanyaanInvestasi.stockInvestasiDiajukan || ''}
                    onChange={(e) => updatePertanyaan('stockInvestasiDiajukan', e.target.value)}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                  >
                    <option value="">- Kondisi Stock Investasi -</option>
                    <option value="Kritis / Minimum Stock Sudah Habis (Zero Stock)">Kritis / Minimum Stock Sudah Habis (Zero Stock)</option>
                    <option value="Stock Cadangan Sangat Terbatas (Lead Time Panjang)">Stock Cadangan Sangat Terbatas (Lead Time Panjang)</option>
                    <option value="Belum Pernah Memiliki Stock Cadangan">Belum Pernah Memiliki Stock Cadangan</option>
                    <option value="Fast Moving Critical Sparepart">Fast Moving Critical Sparepart</option>
                    <option value="Non-Stock / Direct Consumable Purchase">Non-Stock / Direct Consumable Purchase</option>
                  </select>
                </div>

                {/* 6. Investasi Rutin ini diperlukan pada */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Investasi Rutin ini diperlukan pada :
                  </label>
                  <select
                    value={pertanyaanInvestasi.kebutuhanDiperlukanPada || ''}
                    onChange={(e) => updatePertanyaan('kebutuhanDiperlukanPada', e.target.value)}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                  >
                    <option value="">- Periode Kebutuhan -</option>
                    <option value="Segera / Mendesak (Triwulan 1)">Segera / Mendesak (Triwulan 1)</option>
                    <option value="Triwulan 2 (TW 2)">Triwulan 2 (TW 2)</option>
                    <option value="Triwulan 3 (TW 3)">Triwulan 3 (TW 3)</option>
                    <option value="Triwulan 4 (TW 4)">Triwulan 4 (TW 4)</option>
                    <option value="Turn Around (TA) / Shutdown Terjadwal">Turn Around (TA) / Shutdown Terjadwal</option>
                  </select>
                </div>

                {/* 7. Jika Investasi rutin ini tidak disetujui akan dilakukan */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jika Investasi rutin ini tidak disetujui akan dilakukan :
                  </label>
                  <select
                    value={pertanyaanInvestasi.jikaTidakDisetujui || ''}
                    onChange={(e) => updatePertanyaan('jikaTidakDisetujui', e.target.value)}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                  >
                    <option value="">- Tindakan Alternatif -</option>
                    <option value="Perbaikan Sementara / Patching Darurat">Perbaikan Sementara / Patching Darurat</option>
                    <option value="Penundaan Pengadaan & Pemantauan Intensif">Penundaan Pengadaan & Pemantauan Intensif</option>
                    <option value="Rekondisi Unit Eksisting / Kanibalisasi Komponen">Rekondisi Unit Eksisting / Kanibalisasi Komponen</option>
                    <option value="Penyesuaian Kapasitas Operasi Pabrik">Penyesuaian Kapasitas Operasi Pabrik</option>
                    <option value="Subkontrak Pihak Ketiga">Subkontrak Pihak Ketiga</option>
                  </select>
                </div>

                {/* 8. Konsekuensi/dampak risiko pengajuan Investasi rutin berakibat pada */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Konsekuensi/dampak risiko pengajuan Investasi rutin berakibat pada :
                  </label>
                  <select
                    value={pertanyaanInvestasi.konsekuensiDampak || ''}
                    onChange={(e) => updatePertanyaan('konsekuensiDampak', e.target.value)}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                  >
                    <option value="">- Konsekuensi / Dampak Risiko -</option>
                    <option value="Penghentian Pabrik / Shutdown Unplanned (Loss Production)">Penghentian Pabrik / Shutdown Unplanned (Loss Production)</option>
                    <option value="Penurunan Kapasitas Produksi Pupuk Urea / Amoniak">Penurunan Kapasitas Produksi Pupuk Urea / Amoniak</option>
                    <option value="Peningkatan Biaya Pemeliharaan Korektif / Breakdown">Peningkatan Biaya Pemeliharaan Korektif / Breakdown</option>
                    <option value="Potensi Kecelakaan Kerja / Insiden K3">Potensi Kecelakaan Kerja / Insiden K3</option>
                    <option value="Pelanggaran Baku Mutu Lingkungan Hidup (LH)">Pelanggaran Baku Mutu Lingkungan Hidup (LH)</option>
                    <option value="Deviasi Target Kinerja RKAP Korporat">Deviasi Target Kinerja RKAP Korporat</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 8. Bidang/Fungsi Risiko * */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Bidang/Fungsi Risiko *
            </label>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <th className="py-2.5 px-3 text-center w-12 font-bold">Pilih</th>
                    <th className="py-2.5 px-3 min-w-[150px] font-bold">Bidang/Fungsi Risiko</th>
                    <th className="py-2.5 px-3 min-w-[340px] font-bold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {BIDANG_FUNGSI_RISIKO_DATA.map((item) => {
                    const isSelected = bidangFungsi === item.kategori;
                    return (
                      <tr
                        key={item.kategori}
                        onClick={() => onChangeBidangFungsi(item.kategori)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-slate-100 font-semibold'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center align-middle">
                          <input
                            type="radio"
                            name={`${namePrefix}_bidang_fungsi`}
                            checked={isSelected}
                            onChange={() => onChangeBidangFungsi(item.kategori)}
                            className="w-4 h-4 text-[#009fe3] focus:ring-[#009fe3] cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 align-middle font-bold whitespace-nowrap text-slate-900 dark:text-slate-100">
                          {item.kategori}
                        </td>
                        <td className="py-2.5 px-3 align-middle text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.keterangan}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 9. Sub Bidang Risiko & 10. Bidang Proyek */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sub Bidang Risiko (bila ada)
              </label>
              <select
                value={subBidang || ''}
                onChange={(e) => onChangeSubBidang(e.target.value)}
                className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all cursor-pointer"
              >
                <option value="">- Sub Bidang -</option>
                {SUB_BIDANG_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bidang Proyek (bila ada)
              </label>
              <select
                value={bidangProyek || ''}
                onChange={(e) => onChangeBidangProyek(e.target.value)}
                className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all cursor-pointer"
              >
                <option value="">- Bidang Proyek -</option>
                {BIDANG_PROYEK_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
