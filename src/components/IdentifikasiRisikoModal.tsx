import React, { useState, useEffect, useMemo } from 'react';
import { X, ShieldCheck, AlertTriangle, Clock, Layers, Lock, Database } from 'lucide-react';
import { OrganizationMaster, MasterChecklistItem, RiskHandlingStrategy, RiskCategory, PusriRisk, UserAccount, PertanyaanInvestasiRutin, UserRole, SumberRisikoGroup } from '../types/pusri';
import { PusriApiClient } from '../services/api';
import { MASTER_SUMBER_RISIKO_DATA, flattenSumberRisikoGroups } from '../data/sumberRisikoData';
import { KriteriaDampakSection } from './KriteriaDampakSection';
import { RiskLikelihoodConsequenceTable } from './RiskLikelihoodConsequenceTable';
import { MitigasiRiskFields } from './MitigasiRiskFields';

interface IdentifikasiRisikoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole?: UserRole;
  currentUser?: UserAccount | null;
  departments: OrganizationMaster[];
  checklist: MasterChecklistItem[];
  onRiskCreated: (newRisk: PusriRisk) => void;
  sumberRisikoGroups?: SumberRisikoGroup[];
  onOpenMasterSumberRisiko?: () => void;
}

export const IdentifikasiRisikoModal: React.FC<IdentifikasiRisikoModalProps> = ({
  isOpen,
  onClose,
  currentRole = 'risk officer',
  currentUser,
  departments,
  checklist,
  onRiskCreated,
  sumberRisikoGroups,
  onOpenMasterSumberRisiko
}) => {
  const activeSumberGroups = useMemo(
    () => (sumberRisikoGroups && sumberRisikoGroups.length > 0 ? sumberRisikoGroups : MASTER_SUMBER_RISIKO_DATA),
    [sumberRisikoGroups]
  );
  const activeSumberFlat = useMemo(
    () => flattenSumberRisikoGroups(activeSumberGroups),
    [activeSumberGroups]
  );
  const matchedUserDept = departments.find(
    (d) =>
      (currentUser?.kodeUnitKerja && d.kode.toLowerCase() === currentUser.kodeUnitKerja.toLowerCase()) ||
      (currentUser?.unitKerja && (d.nama.toLowerCase() === currentUser.unitKerja.toLowerCase() || d.kode.toLowerCase() === currentUser.unitKerja.toLowerCase()))
  );
  const defaultOrg = matchedUserDept?.kode || currentUser?.kodeUnitKerja || departments[0]?.kode || 'OP-IIB';
  const [kodeOrg, setKodeOrg] = useState(defaultOrg);
  const [sasaranRKAP, setSasaranRKAP] = useState('');
  const [sasaranUnitKerja, setSasaranUnitKerja] = useState('');
  const [konteksEksternal, setKonteksEksternal] = useState('');
  const [konteksInternal, setKonteksInternal] = useState('');
  const [sumber, setSumber] = useState('');
  const [pernyataan, setPernyataan] = useState('');
  const [penyebab, setPenyebab] = useState('');
  const [dampakRisiko, setDampakRisiko] = useState('');
  const [pengendalianExisting, setPengendalianExisting] = useState('');
  
  // Single Criterion selection state (Hanya dapat memilih 1 level kriteria)
  const [kriteriaKey, setKriteriaKey] = useState<string | null>(null);
  const [kriteriaTitle, setKriteriaTitle] = useState<string>('');
  const [kriteriaLevel, setKriteriaLevel] = useState<number>(0);

  // Likelihood / Kemungkinan Matriks 5x5
  const [kemungkinanAwal, setKemungkinanAwal] = useState<number>(0);
  
  // Response Plan & Mitigasi
  const [jenisPenanganan, setJenisPenanganan] = useState<RiskHandlingStrategy>('Mitigasi');
  const [rencanaPenanganan, setRencanaPenanganan] = useState('');
  const [targetWaktu, setTargetWaktu] = useState('Risiko Awal');
  const [biaya, setBiaya] = useState(0);

  // Extended Mitigasi fields
  const [keteranganRiskTreatment, setKeteranganRiskTreatment] = useState('');
  const [rencanaPengendalian, setRencanaPengendalian] = useState('');
  const [expectedKemungkinan, setExpectedKemungkinan] = useState(0);
  const [expectedDampak, setExpectedDampak] = useState(0);
  const [jenisAnggaran, setJenisAnggaran] = useState('Investasi Rutin');
  const [pertanyaanInvestasi, setPertanyaanInvestasi] = useState<PertanyaanInvestasiRutin>({});
  const [bidangFungsi, setBidangFungsi] = useState<RiskCategory>('Operasional');
  const [subBidang, setSubBidang] = useState('');
  const [bidangProyek, setBidangProyek] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setKodeOrg(defaultOrg);
  }, [defaultOrg]);

  const resetModalForm = () => {
    setKodeOrg(defaultOrg);
    setSasaranRKAP('');
    setSasaranUnitKerja('');
    setKonteksEksternal('');
    setKonteksInternal('');
    setSumber('');
    setPernyataan('');
    setPenyebab('');
    setDampakRisiko('');
    setPengendalianExisting('');
    setKriteriaKey(null);
    setKriteriaTitle('');
    setKriteriaLevel(0);
    setKemungkinanAwal(0);
    setJenisPenanganan('Mitigasi');
    setRencanaPenanganan('');
    setTargetWaktu('Risiko Awal');
    setBiaya(0);
    setKeteranganRiskTreatment('');
    setRencanaPengendalian('');
    setExpectedKemungkinan(0);
    setExpectedDampak(0);
    setJenisAnggaran('Investasi Rutin');
    setPertanyaanInvestasi({});
    setBidangFungsi('Operasional');
    setSubBidang('');
    setBidangProyek('');
    setValidationError(null);
  };

  if (!isOpen) return null;

  const selectedDept = departments.find((d) => d.kode === kodeOrg);

  const isSasaranKonteksComplete = Boolean(
    sasaranRKAP.trim() &&
    sasaranUnitKerja.trim() &&
    konteksEksternal.trim() &&
    konteksInternal.trim()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!sasaranRKAP.trim()) {
      setValidationError('Sasaran RKAP wajib diisi terlebih dahulu sebelum menyimpan.');
      return;
    }
    if (!sasaranUnitKerja.trim()) {
      setValidationError('Sasaran Unit Kerja wajib diisi terlebih dahulu sebelum menyimpan.');
      return;
    }
    if (!konteksEksternal.trim()) {
      setValidationError('Konteks Eksternal wajib diisi terlebih dahulu sebelum menyimpan.');
      return;
    }
    if (!konteksInternal.trim()) {
      setValidationError('Konteks Internal wajib diisi terlebih dahulu sebelum menyimpan.');
      return;
    }

    if (!sumber.trim()) {
      setValidationError('Sumber risiko wajib dipilih berdasarkan data master.');
      return;
    }

    if (!pernyataan.trim()) {
      setValidationError('Pernyataan risiko wajib diisi.');
      return;
    }

    if (!penyebab.trim()) {
      setValidationError('Penyebab / akar masalah risiko wajib diisi.');
      return;
    }

    if (!dampakRisiko.trim()) {
      setValidationError('Uraian dampak risiko wajib diisi.');
      return;
    }

    if (kriteriaLevel < 1 || kriteriaLevel > 5) {
      setValidationError('Skala Kriteria Dampak Inherent (Level 1–5) wajib dipilih pada tabel kriteria dampak.');
      return;
    }

    if (kemungkinanAwal < 1 || kemungkinanAwal > 5) {
      setValidationError('Skala Kemungkinan Inherent (Level 1–5) wajib dipilih.');
      return;
    }

    let resolvedRencana = rencanaPengendalian.trim() || rencanaPenanganan.trim() || keteranganRiskTreatment.trim();
    if (!resolvedRencana) {
      if (jenisPenanganan === 'Mitigasi') {
        resolvedRencana = 'Pelaksanaan tindakan mitigasi terprogram sesuai SOP Pusri';
      } else if (jenisPenanganan === 'Diterima') {
        resolvedRencana = 'Risiko diterima dalam selera risiko & toleransi operasional';
      } else if (jenisPenanganan === 'Dihindari') {
        resolvedRencana = 'Menghindari / menghentikan aktivitas penyebab risiko';
      } else if (jenisPenanganan === 'Transfer') {
        resolvedRencana = 'Pengalihan risiko via skema asuransi / kontrak mitra kerja';
      }
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<PusriRisk> = {
        kodeOrganisasi: kodeOrg,
        namaOrganisasi: selectedDept?.nama || 'Unit Kerja Pabrik Pusri',
        tahun: 2026,
        sasaranRKAP: sasaranRKAP.trim(),
        sasaranUnitKerja: sasaranUnitKerja.trim(),
        konteksEksternal: konteksEksternal.trim(),
        konteksInternal: konteksInternal.trim(),
        kategoriRisiko: (bidangFungsi as RiskCategory) || 'Operasional',
        sumberRisiko: sumber || 'Operasional Pabrik',
        pernyataanRisiko: pernyataan,
        penyebabRisiko: penyebab || 'Faktor keandalan peralatan dan perubahan kondisi operasi',
        dampakRisiko: dampakRisiko || 'Penurunan performa produksi atau deviasi target',
        pengendalianExisting: pengendalianExisting || 'Inspeksi berkala dan SOP standar',
        kriteriaDampakKey: kriteriaKey || undefined,
        kriteriaDampakTitle: kriteriaTitle || undefined,
        kriteriaDampakLevel: kriteriaLevel || undefined,
        kemungkinanAwal: kemungkinanAwal,
        dampakAwal: kriteriaLevel || 0,
        jenisPenanganan: jenisPenanganan,
        rencanaPenanganan: resolvedRencana,
        targetWaktuMitigasi: targetWaktu,
        biayaRencanaPengendalian: biaya,
        picPelaksana: '',
        picPengendali: '',
        keteranganRiskTreatment: keteranganRiskTreatment || undefined,
        rencanaPengendalian: rencanaPengendalian || undefined,
        expectedKemungkinan: expectedKemungkinan || undefined,
        expectedDampak: expectedDampak || undefined,
        jenisAnggaran: jenisAnggaran || (biaya > 0 ? 'Investasi Rutin' : 'Non-Anggaran / Prosedural'),
        pertanyaanInvestasiRutin: pertanyaanInvestasi,
        bidangFungsiRisiko: bidangFungsi,
        subBidangRisiko: subBidang,
        bidangProyek: bidangProyek,
        createdBy: currentUser?.nama
          ? `${currentUser.nama} (Badge ${currentUser.badge || '0953'} - ${currentUser.jabatan || currentUser.role})`
          : 'FAUZAN AL GHANIYYU (Badge 0953 - Unit Kerja)'
      };

      const result = await PusriApiClient.createRisk(payload);
      if (result) {
        resetModalForm();
        onRiskCreated(result);
        onClose();
      }
    } catch (err: any) {
      setValidationError(err?.message || 'Gagal menyimpan usulan risiko ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl lg:max-w-5xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="px-5 py-4 bg-[#009fe3] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-yellow-300" />
              <h3 className="font-bold text-base tracking-tight">
                Formulir Identifikasi Risiko Unit Kerja (SOP Pusri 2026)
              </h3>
            </div>
            <p className="text-xs text-sky-100 mt-0.5">
              Pendaftaran risiko baru dan integrasi API ke MySQL Database
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Identitas Pengusul Risiko (Mengatasnamakan Akun Resmi) */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/30 border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-3 flex-wrap shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#009fe3] text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-sky-300 dark:ring-sky-700">
                {currentUser?.nama
                  ? currentUser.nama.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                  : 'FA'}
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#009fe3] dark:text-sky-400 uppercase tracking-wider block">
                  Pengusul Risiko (Mengatasnamakan Akun):
                </span>
                <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                  {currentUser?.nama || 'FAUZAN AL GHANIYYU'}
                  <span className="ml-2 font-mono text-[11px] font-bold text-sky-700 dark:text-sky-300">
                    [Badge {currentUser?.badge || '0953'}]
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {currentUser?.jabatan || 'Risk Officer Unit Kerja Pabrik'} • {currentUser?.unitKerja || selectedDept?.nama || 'Departemen Operasi Pabrik Pusri IIB'}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
              ● Sesi Resmi Aktif
            </span>
          </div>

          {/* Unit Kerja Pemilik Risiko - Otomatis sesuai departemen asal (Tanpa Dropdown) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Unit Kerja / Departemen Pemilik Risiko *
              </label>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                Otomatis Sesuai Departemen Asal
              </span>
            </div>
            <div className="w-full h-10 px-3.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-bold shadow-2xs select-none">
              <div className="flex items-center gap-2 truncate">
                <ShieldCheck className="w-4 h-4 text-[#009fe3] shrink-0" />
                <span className="truncate">
                  {selectedDept ? `${selectedDept.kode} - ${selectedDept.nama}` : `${kodeOrg} - ${currentUser?.unitKerja || 'Departemen Operasi Pabrik Pusri IIB'}`}
                </span>
              </div>
              <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400 font-mono font-normal">
                (Terkunci Sesuai Akun Pengusul)
              </span>
            </div>
          </div>

          {/* Sasaran RKAP, Sasaran Unit Kerja, Konteks Eksternal, Konteks Internal (Wajib diisi) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sasaran Strategis RKAP Korporat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sasaranRKAP}
                onChange={(e) => setSasaranRKAP(e.target.value)}
                placeholder="Masukkan sasaran strategis RKAP..."
                className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sasaran Unit Kerja Pemilik Risiko <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sasaranUnitKerja}
                onChange={(e) => setSasaranUnitKerja(e.target.value)}
                placeholder="Masukkan sasaran unit kerja..."
                className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Konteks Eksternal (Pasar, Vendor, Regulasi) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={konteksEksternal}
                onChange={(e) => setKonteksEksternal(e.target.value)}
                placeholder="Masukkan konteks eksternal..."
                className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Konteks Internal (SOP, Shift, Keandalan Mesin) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={konteksInternal}
                onChange={(e) => setKonteksInternal(e.target.value)}
                placeholder="Masukkan konteks internal..."
                className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500"
              />
            </div>
          </div>

          {/* Sumber Risiko * (By Data Master) */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Sumber Risiko *
                </label>
                <span
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold cursor-help"
                  title="Pilih sumber risiko dari Master Data Sumber Risiko"
                >
                  ⓘ
                </span>
              </div>
              {currentRole === 'risk admin' && onOpenMasterSumberRisiko ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMasterSumberRisiko();
                  }}
                  className="text-[11px] font-semibold text-[#009fe3] hover:text-[#0284c7] dark:text-sky-400 inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Database className="w-3 h-3" />
                  <span>+ Kelola / Tambah Master Sumber Risiko</span>
                </button>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Master Data (Input Baru Khusus Admin)</span>
                </span>
              )}
            </div>
            <select
              required
              value={sumber}
              onChange={(e) => setSumber(e.target.value)}
              className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all cursor-pointer"
            >
              <option value="">-- Pilih Sumber Risiko (By Data) --</option>
              {activeSumberGroups.map((group) => (
                <optgroup key={group.kategori} label={group.kategori}>
                  {group.items.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </optgroup>
              ))}
              {sumber && !activeSumberFlat.includes(sumber) && (
                <optgroup label="Data Terdaftar Lainnya">
                  <option value={sumber}>{sumber}</option>
                </optgroup>
              )}
            </select>
          </div>

          {/* Pernyataan Risiko */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Nama / Pernyataan Risiko *
              </label>
              <span
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold cursor-help"
                title="Peristiwa risiko spesifik yang berpotensi terjadi"
              >
                ⓘ
              </span>
            </div>
            <textarea
              rows={2}
              required
              value={pernyataan}
              onChange={(e) => setPernyataan(e.target.value)}
              placeholder="Deskripsikan peristiwa risiko secara spesifik..."
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
               Penyebab Risiko *
              </label>
              <textarea
                rows={2}
                required
                value={penyebab}
                onChange={(e) => setPenyebab(e.target.value)}
                placeholder=""
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
               Dampak Risiko *
              </label>
              <textarea
                rows={2}
                required
                value={dampakRisiko}
                onChange={(e) => setDampakRisiko(e.target.value)}
                placeholder=""
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Kriteria Dampak Risiko (Pusri Standard) - Memilih 1 Level Kriteria */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <KriteriaDampakSection
              selectedCriterionKey={kriteriaKey}
              selectedLevel={kriteriaLevel}
              onSelectCriterion={(key, level, description, categoryTitle) => {
                setKriteriaKey(key);
                setKriteriaTitle(categoryTitle);
                setKriteriaLevel(level);
                if (!dampakRisiko || dampakRisiko.trim().length === 0) {
                  setDampakRisiko(description || '');
                }
              }}
              onClearCriterion={() => {
                setKriteriaKey(null);
                setKriteriaTitle('');
                setKriteriaLevel(0);
              }}
              namePrefix="modal_identifikasi_quick"
            />
          </div>

          {/* Likelihood / Kemungkinan Terjadinya Risiko (Matriks Pusri 5x5) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#009fe3]" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Likelihood / Kemungkinan Terjadinya Risiko (Matriks 5x5)
                </h4>
              </div>
              <span className="text-[11px] font-bold text-[#009fe3] dark:text-sky-400">
                {kemungkinanAwal > 0 ? `Level ${kemungkinanAwal} Terpilih` : 'Pilih Level 1 - 5'}
              </span>
            </div>

            {/* Quick 5-Level Likelihood Buttons for instant selection */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { lvl: 1, label: 'Lvl 1 - Hampir Tdk Mungkin', sub: '>0% - 15%' },
                { lvl: 2, label: 'Lvl 2 - Kemungkinan Kecil', sub: '>15% - 35%' },
                { lvl: 3, label: 'Lvl 3 - Kemungkinan Sedang', sub: '>35% - 60%' },
                { lvl: 4, label: 'Lvl 4 - Kemungkinan Besar', sub: '>60% - 85%' },
                { lvl: 5, label: 'Lvl 5 - Hampir Pasti', sub: '>85%' }
              ].map((item) => (
                <button
                  key={item.lvl}
                  type="button"
                  onClick={() => setKemungkinanAwal(kemungkinanAwal === item.lvl ? 0 : item.lvl)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    kemungkinanAwal === item.lvl
                      ? 'bg-[#009fe3] text-white border-[#009fe3] shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-300'
                  }`}
                >
                  <div className="font-extrabold text-xs">Level {item.lvl}</div>
                  <div className="text-[9px] opacity-80 truncate">{item.sub}</div>
                </button>
              ))}
            </div>

            <RiskLikelihoodConsequenceTable
              likelihood={kemungkinanAwal}
              consequence={kriteriaLevel}
              onChangeLikelihood={(level) => setKemungkinanAwal(level)}
              showLikelihood={true}
              showConsequence={false}
              showScoreSummary={true}
              allowUnselectLikelihood={true}
              namePrefix="modal_identifikasi_quick_lik"
            />
          </div>

          {/* Mitigasi Risk Fields (Kondisional: jika MITIGASI maka tampil rincian lengkap; jika tidak maka tampil data atas) */}
          <MitigasiRiskFields
            jenisPenanganan={jenisPenanganan}
            onChangeJenisPenanganan={(strat) => setJenisPenanganan(strat)}
            keteranganRiskTreatment={keteranganRiskTreatment}
            onChangeKeteranganRiskTreatment={(val) => setKeteranganRiskTreatment(val)}
            rencanaPengendalian={rencanaPengendalian}
            onChangeRencanaPengendalian={(val) => setRencanaPengendalian(val)}
            expectedLikelihood={expectedKemungkinan}
            onChangeExpectedLikelihood={(lvl) => setExpectedKemungkinan(lvl)}
            expectedConsequence={expectedDampak}
            onChangeExpectedConsequence={(lvl) => setExpectedDampak(lvl)}
            biaya={biaya}
            onChangeBiaya={(amt) => setBiaya(amt)}
            jenisAnggaran={jenisAnggaran}
            onChangeJenisAnggaran={(val) => setJenisAnggaran(val)}
            pertanyaanInvestasi={pertanyaanInvestasi}
            onChangePertanyaanInvestasi={(updated) => setPertanyaanInvestasi(updated)}
            bidangFungsi={bidangFungsi}
            onChangeBidangFungsi={(cat) => setBidangFungsi(cat)}
            subBidang={subBidang}
            onChangeSubBidang={(val) => setSubBidang(val)}
            bidangProyek={bidangProyek}
            onChangeBidangProyek={(val) => setBidangProyek(val)}
            namePrefix="identifikasi_quick_modal"
          />

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Data langsung tersimpan di MySQL pusri_risk_db & siap direview oleh Atasan / VP
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isSasaranKonteksComplete}
                title={!isSasaranKonteksComplete ? 'Harap isi Sasaran RKAP, Sasaran Unit Kerja, Konteks Eksternal, dan Konteks Internal terlebih dahulu' : 'Simpan data risiko'}
                className="px-4 py-2 text-xs font-bold text-white bg-[#009fe3] hover:bg-[#0284c7] rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan & Sinkronisasi...' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
