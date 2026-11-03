import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Save, 
  Send, 
  Clock, 
  DollarSign, 
  Building2, 
  Calculator, 
  Info, 
  Check, 
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { PusriRisk, UserRole, RiskCategory, RiskHandlingStrategy, RiskLevel, OrganizationMaster } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';
import { getMasterRiskLevel, getMasterMitigationRequirement, sortRisksNewestFirst } from '../../utils/riskMatrix';

interface UpdateRisikoViewProps {
  currentRole: UserRole;
  currentUser?: { nama?: string; role?: UserRole; unitKerja?: string } | null;
  risks: PusriRisk[];
  departments?: OrganizationMaster[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onSelectRiskDetail: (risk: PusriRisk) => void;
  onNavigateNext?: (nextTab: string, roleToSwitch?: UserRole) => void;
  onOpenUpdateModal?: (risk: PusriRisk) => void;
}

export const UpdateRisikoView: React.FC<UpdateRisikoViewProps> = ({
  currentRole,
  currentUser,
  risks,
  departments = [],
  onRiskUpdated,
  onSelectRiskDetail,
  onNavigateNext,
  onOpenUpdateModal
}) => {
  // Filter eligible risks for update based on role
  // Unit Kerja can update unapproved risks (especially 'Revisi', 'Draft_Unit', or 'Menunggu_Approval_VP')
  // VP can update unapproved risks
  // Admin can update all
  const eligibleRisks = risks
    .filter((r) => {
      if (currentRole === 'risk admin') return true;
      return r.statusWorkflow !== 'Disetujui_Dalam_Pengendalian';
    })
    .sort(sortRisksNewestFirst);

  const revisiRisks = eligibleRisks.filter((r) => r.statusWorkflow === 'Revisi' || (r.statusWorkflow as string) === 'revisi');
  const draftRisks = eligibleRisks.filter((r) => r.statusWorkflow === 'Draft_Unit');
  const pendingVpRisks = eligibleRisks.filter((r) => r.statusWorkflow === 'Menunggu_Approval_VP');

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REVISI' | 'DRAFT' | 'PENDING_VP'>('ALL');
  
  // Selected risk to update
  const defaultSelected = revisiRisks[0] || eligibleRisks[0] || null;
  const [selectedRiskId, setSelectedRiskId] = useState<string>(defaultSelected?.id || '');

  // Active risk object
  const activeRisk = eligibleRisks.find((r) => r.id === selectedRiskId) || eligibleRisks[0] || null;

  // Form states
  const [pernyataanRisiko, setPernyataanRisiko] = useState('');
  const [penyebabRisiko, setPenyebabRisiko] = useState('');
  const [dampakRisiko, setDampakRisiko] = useState('');
  const [pengendalianExisting, setPengendalianExisting] = useState('');
  const [kategoriRisiko, setKategoriRisiko] = useState<RiskCategory>('Operasional');
  const [kemungkinanAwal, setKemungkinanAwal] = useState<number>(3);
  const [dampakAwal, setDampakAwal] = useState<number>(3);
  const [jenisPenanganan, setJenisPenanganan] = useState<RiskHandlingStrategy>('Mitigasi');
  const [rencanaPenanganan, setRencanaPenanganan] = useState('');
  const [targetWaktuMitigasi, setTargetWaktuMitigasi] = useState('TW 2');
  const [biayaRencanaPengendalian, setBiayaRencanaPengendalian] = useState<number>(0);
  const [picPelaksana, setPicPelaksana] = useState('');
  const [picPengendali, setPicPengendali] = useState('');
  const [catatanPerbaikan, setCatatanPerbaikan] = useState('');

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(true);

  // Sync form whenever activeRisk changes
  useEffect(() => {
    if (activeRisk) {
      setPernyataanRisiko(activeRisk.pernyataanRisiko || '');
      setPenyebabRisiko(activeRisk.penyebabRisiko || '');
      setDampakRisiko(activeRisk.dampakRisiko || '');
      setPengendalianExisting(activeRisk.pengendalianExisting || '');
      setKategoriRisiko(activeRisk.kategoriRisiko || 'Operasional');
      setKemungkinanAwal(activeRisk.kemungkinanAwal || 3);
      setDampakAwal(activeRisk.dampakAwal || 3);
      setJenisPenanganan(activeRisk.jenisPenanganan || 'Mitigasi');
      setRencanaPenanganan(activeRisk.rencanaPenanganan || '');
      setTargetWaktuMitigasi(activeRisk.targetWaktuMitigasi || 'TW 2');
      setBiayaRencanaPengendalian(activeRisk.biayaRencanaPengendalian || 0);
      setPicPelaksana(activeRisk.picPelaksana || '');
      setPicPengendali(activeRisk.picPengendali || '');
      setCatatanPerbaikan('');
      setFormErrors([]);
      setNotice(null);
    }
  }, [activeRisk?.id]);

  // Real-time matrix score calculation directly from Master Data 5x5 Matrix
  const inherentScore = kemungkinanAwal * dampakAwal;
  const calculatedLevel = getMasterRiskLevel(kemungkinanAwal, dampakAwal);
  const isMitigationRequired = getMasterMitigationRequirement(kemungkinanAwal, dampakAwal).isRequired;

  // Filtered list of risks for selection table
  const displayedRisks = eligibleRisks.filter((r) => {
    if (statusFilter === 'REVISI' && r.statusWorkflow !== 'Revisi') return false;
    if (statusFilter === 'DRAFT' && r.statusWorkflow !== 'Draft_Unit') return false;
    if (statusFilter === 'PENDING_VP' && r.statusWorkflow !== 'Menunggu_Approval_VP') return false;
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        r.kodeRisiko.toLowerCase().includes(q) ||
        r.pernyataanRisiko.toLowerCase().includes(q) ||
        r.namaOrganisasi.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!pernyataanRisiko.trim() || pernyataanRisiko.trim().length < 5) {
      errs.push('Pernyataan risiko wajib diisi dengan jelas (minimal 5 karakter).');
    }
    if (!penyebabRisiko.trim() || penyebabRisiko.trim().length < 3) {
      errs.push('Akar masalah / penyebab risiko wajib diisi (minimal 3 karakter).');
    }
    if (!dampakRisiko.trim() || dampakRisiko.trim().length < 3) {
      errs.push('Uraian konsekuensi / dampak risiko wajib diisi (minimal 3 karakter).');
    }
    if (kemungkinanAwal < 1 || kemungkinanAwal > 5 || dampakAwal < 1 || dampakAwal > 5) {
      errs.push('Skala kemungkinan dan dampak harus dalam rentang 1 - 5.');
    }
    if (jenisPenanganan === 'Mitigasi' && rencanaPenanganan.trim().length < 5) {
      errs.push('Rencana tindakan mitigasi wajib diisi minimal 5 karakter.');
    }

    setFormErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async (resubmitToVp = false) => {
    if (!activeRisk) {
      setNotice({ type: 'error', message: 'Silakan pilih data risiko terlebih dahulu.' });
      return;
    }

    if (!validate()) {
      setNotice({ type: 'error', message: 'Terdapat data wajib yang belum lengkap. Harap periksa tanda peringatan di bawah.' });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const actorName = currentUser?.nama || (currentRole === 'risk owner' ? 'Vice President Unit' : currentRole === 'risk admin' ? 'Risk Admin' : 'Risk Officer Unit');
      const res = await PusriApiClient.updateRiskData(
        activeRisk.id,
        {
          pernyataanRisiko: pernyataanRisiko.trim(),
          penyebabRisiko: penyebabRisiko.trim(),
          dampakRisiko: dampakRisiko.trim(),
          pengendalianExisting: pengendalianExisting.trim(),
          kategoriRisiko,
          kemungkinanAwal,
          dampakAwal,
          jenisPenanganan,
          rencanaPenanganan: rencanaPenanganan.trim(),
          targetWaktuMitigasi,
          biayaRencanaPengendalian: Number(biayaRencanaPengendalian) || 0,
          picPelaksana: picPelaksana.trim() || activeRisk.picPelaksana,
          picPengendali: picPengendali.trim() || activeRisk.picPengendali,
          catatanPerbaikan: catatanPerbaikan.trim() || undefined,
          resubmit: resubmitToVp
        },
        currentRole,
        actorName
      );

      if (res.success && res.data) {
        onRiskUpdated(res.data);
        setNotice({
          type: 'success',
          message: resubmitToVp
            ? `Risiko ${res.data.kodeRisiko} berhasil diperbaiki dan diajukan kembali ke antrean Review Atasan / VP!`
            : `Perubahan data risiko ${res.data.kodeRisiko} berhasil disimpan ke sistem dan database.`
        });
      } else {
        setNotice({
          type: 'error',
          message: res.message || 'Gagal menyimpan perubahan data risiko.'
        });
      }
    } catch (e: any) {
      setNotice({
        type: 'error',
        message: e?.message || 'Terjadi kesalahan komunikasi dengan server saat memperbarui data risiko.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      
      {/* 1. TOP HEADER BANNER (Warna Putih, Kuning Soft Polos & Biru Muda Pusri) */}
      <div className="p-5 md:p-6 rounded-2xl bg-white border border-sky-200 shadow-sm relative overflow-hidden">
        {/* Soft pastel yellow aura & light blue accent */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-yellow-100/60 via-sky-50/50 to-transparent pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-sky-100/50 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-[#009fe3] text-[11px] font-bold tracking-wide uppercase border border-sky-200">
                manajemen portal risiko pusri
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-100 text-amber-900 text-[11px] font-bold tracking-wide uppercase border border-yellow-200">
                Fitur Update Data Risiko
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Formulir & Manajemen Update Data Risiko
            </h1>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Perbaiki atau perbarui data risiko yang belum disetujui (Draft / Revisi) sebelum proses approval dilakukan. User Unit Kerja dapat memperbaiki risiko tidak disetujui untuk diajukan kembali ke VP, serta Atasan/VP dapat memodifikasi data risiko secara langsung.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>{showGuide ? 'Sembunyikan Panduan' : 'Lihat Cara Mengisi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PANDUAN CARA MENGISI FORM UPDATE DATA RISIKO (Jawaban Pertanyaan User) */}
      {showGuide && (
        <div className="p-4 sm:p-5 rounded-2xl bg-yellow-50/80 border border-yellow-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Panduan Lengkap: Cara Mengisi & Memperbarui Data Risiko (4 Langkah Mudah)</span>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-yellow-200/80 px-2 py-0.5 rounded-md">
              SOP Revisi Pusri
            </span>
          </div>

          <p className="text-xs text-amber-900/90 leading-relaxed">
            Jika form sebelumnya terlihat kosong, hal tersebut karena belum ada butir risiko yang dipilih. Ikuti alur berikut untuk memilih dan mengisi data pembaruan:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
            {/* Step 1 */}
            <div className="p-3 bg-white rounded-xl border border-yellow-200/80 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-sky-700">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-[11px] flex items-center justify-center font-mono">1</span>
                <span>Pilih Risiko</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Pilih risiko yang ingin diperbaiki dari kotak <strong>"Pilih Risiko"</strong> atau klik baris di tabel antrean di bawah.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-white rounded-xl border border-yellow-200/80 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-700">
                <span className="w-5 h-5 rounded-full bg-yellow-100 text-amber-800 text-[11px] flex items-center justify-center font-mono">2</span>
                <span>Baca Catatan Revisi</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Tinjau arahan catatan evaluasi dari Atasan/VP atau Admin di kotak kuning untuk mengetahui bagian yang wajib diperbaiki.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-white rounded-xl border border-yellow-200/80 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-sky-700">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-[11px] flex items-center justify-center font-mono">3</span>
                <span>Ubah Parameter</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Isi form: perbaiki uraian risiko, akar masalah, dampak, skor kemungkinan & dampak (1–5), serta rencana tindakan mitigasi.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-white rounded-xl border border-yellow-200/80 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-[#009fe3]">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-[#009fe3] text-[11px] flex items-center justify-center font-mono">4</span>
                <span>Simpan / Ajukan Ulang</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Klik <strong>"Simpan Perubahan"</strong> atau tombol biru <strong>"Perbaiki & Ajukan Kembali ke VP"</strong> untuk resubmit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. NOTICE ALERT BANNER */}
      {notice && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          notice.type === 'success'
            ? 'bg-sky-50 border-sky-300 text-sky-900'
            : 'bg-red-50 border-red-300 text-red-900'
        }`}>
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#009fe3] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-bold underline hover:opacity-75 cursor-pointer ml-3 shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 4. MAIN WORKSPACE: SELECTOR BAR + FORM DUA KOLOM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN (4 Cols): Selector & Queue of Risks to Update */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-xs text-slate-900">Pilih Data Risiko yang Akan Diperbarui</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-mono font-bold">
                {displayedRisks.length} Tersedia
              </span>
            </div>

            {/* Quick Dropdown Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Pilih Cepat dari Dropdown:
              </label>
              <select
                value={selectedRiskId}
                onChange={(e) => setSelectedRiskId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all cursor-pointer shadow-2xs"
              >
                {eligibleRisks.length === 0 ? (
                  <option value="">(Tidak ada risiko yang perlu diperbarui)</option>
                ) : (
                  eligibleRisks.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.kodeRisiko}] {r.statusWorkflow === 'Revisi' ? '⚠️ (Revisi) ' : ''}{r.pernyataanRisiko.slice(0, 45)}...
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode atau uraian risiko..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:border-sky-500 outline-none transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 text-[11px] flex-wrap pt-0.5">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({eligibleRisks.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('REVISI')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'REVISI'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                Revisi ({revisiRisks.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('DRAFT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'DRAFT'
                    ? 'bg-amber-600 text-white'
                    : 'bg-yellow-50 text-amber-800 hover:bg-yellow-100 border border-yellow-200'
                }`}
              >
                Draft ({draftRisks.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING_VP')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'PENDING_VP'
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                }`}
              >
                Menunggu VP ({pendingVpRisks.length})
              </button>
            </div>

            {/* List of cards */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 pt-1">
              {displayedRisks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Tidak ada data risiko yang sesuai filter.
                </div>
              ) : (
                displayedRisks.map((risk) => {
                  const isSelected = activeRisk?.id === risk.id;
                  const isRevisi = risk.statusWorkflow === 'Revisi' || (risk.statusWorkflow as string) === 'revisi';

                  return (
                    <div
                      key={risk.id}
                      onClick={() => setSelectedRiskId(risk.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/70 shadow-xs ring-2 ring-sky-300'
                          : isRevisi
                            ? 'border-rose-300 bg-rose-50/40 hover:bg-rose-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-slate-900">
                          {risk.kodeRisiko}
                        </span>
                        <div className="flex items-center gap-1">
                          {isRevisi ? (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-300">
                              (revisi)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                              {risk.statusWorkflow.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="font-semibold text-slate-800 line-clamp-2 leading-relaxed">
                        {risk.pernyataanRisiko}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{risk.namaOrganisasi}</span>
                        <span className="font-mono font-bold text-sky-700">
                          Skor: {risk.inherentScore} ({risk.currentTingkatRisiko})
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 Cols): The Active Update Form */}
        <div className="lg:col-span-8 space-y-4">
          {activeRisk ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
              
              {/* Form Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-200 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-slate-900">
                      {activeRisk.kodeRisiko}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      activeRisk.statusWorkflow === 'Revisi'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-yellow-100 text-amber-900 border border-yellow-300'
                    }`}>
                      Status: {activeRisk.statusWorkflow.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-mono border border-sky-200">
                      Tahun {activeRisk.tahun}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Unit Kerja: <strong>{activeRisk.namaOrganisasi} ({activeRisk.kodeOrganisasi})</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectRiskDetail(activeRisk)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    Lihat Berkas Detail
                  </button>
                  {currentRole !== 'risk admin' && onOpenUpdateModal && (
                    <button
                      type="button"
                      onClick={() => onOpenUpdateModal(activeRisk)}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-colors cursor-pointer"
                      title="Buka form dalam jendela popup"
                    >
                      Buka Pop-up
                    </button>
                  )}
                </div>
              </div>

              {/* Catatan Arahan Revisi (Bila Ada) */}
              {(activeRisk.reviewNotesVp || activeRisk.approvalNotesAdmin) && (
                <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-300 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-[11px] uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Catatan Arahan Evaluasi / Revisi dari Reviewer:</span>
                  </div>
                  <p className="text-amber-950 font-medium italic pl-6 leading-relaxed">
                    "{activeRisk.reviewNotesVp || activeRisk.approvalNotesAdmin}"
                  </p>
                </div>
              )}

              {/* Validation errors summary */}
              {formErrors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                  <span className="font-bold block">Mohon perbaiki data berikut:</span>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                    {formErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FORM FIELDS */}
              <div className="space-y-4 text-xs">
                
                {/* 1. Pernyataan Risiko */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Peristiwa / Pernyataan Risiko *
                  </label>
                  <input
                    type="text"
                    required
                    value={pernyataanRisiko}
                    onChange={(e) => setPernyataanRisiko(e.target.value)}
                    placeholder="Uraikan peristiwa atau kondisi yang dapat menimbulkan risiko..."
                    className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* 2. Kategori Risiko & Sumber Risiko */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Kategori Risiko *
                    </label>
                    <select
                      value={kategoriRisiko}
                      onChange={(e) => setKategoriRisiko(e.target.value as RiskCategory)}
                      className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="Operasional">Operasional</option>
                      <option value="Keuangan">Keuangan</option>
                      <option value="Strategis">Strategis</option>
                      <option value="Hukum & Kepatuhan">Hukum & Kepatuhan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Pengendalian Existing / Kontrol Saat Ini
                    </label>
                    <input
                      type="text"
                      value={pengendalianExisting}
                      onChange={(e) => setPengendalianExisting(e.target.value)}
                      placeholder="SOP operasi yang sudah berjalan..."
                      className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* 3. Matriks 5x5: Kemungkinan & Dampak (Kuning Soft & Biru Muda) */}
                <div className="p-4 rounded-xl bg-yellow-50/50 border border-yellow-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-yellow-200/80">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-amber-700" />
                      <span className="font-bold text-xs text-amber-950">
                        Penilaian Matriks Inherent Risk 5×5 Pusri
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-600">Hasil Kalkulasi:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                        inherentScore >= 16
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : inherentScore >= 10
                            ? 'bg-amber-100 text-amber-900 border border-yellow-300'
                            : 'bg-sky-100 text-sky-800 border border-sky-300'
                      }`}>
                        {calculatedLevel} (L{kemungkinanAwal} × D{dampakAwal} = {inherentScore})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Kemungkinan */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Level Kemungkinan (Likelihood: 1–5): <span className="font-mono text-sky-700 text-xs font-bold">{kemungkinanAwal}</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={kemungkinanAwal}
                        onChange={(e) => setKemungkinanAwal(Number(e.target.value))}
                        className="w-full accent-sky-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>1 (Sangat Jarang)</span>
                        <span>3 (Sedang)</span>
                        <span>5 (Hampir Pasti)</span>
                      </div>
                    </div>

                    {/* Dampak */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Level Dampak (Impact: 1–5): <span className="font-mono text-sky-700 text-xs font-bold">{dampakAwal}</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={dampakAwal}
                        onChange={(e) => setDampakAwal(Number(e.target.value))}
                        className="w-full accent-sky-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>1 (Ringan)</span>
                        <span>3 (Moderat)</span>
                        <span>5 (Bencana/Kritis)</span>
                      </div>
                    </div>
                  </div>

                  {isMitigationRequired && (
                    <div className="p-2.5 rounded-lg bg-yellow-100/80 border border-yellow-300 text-[11px] text-amber-900 flex items-center gap-2 font-medium">
                      <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        Skor inherent $\ge 10$ melebihi batas toleransi Pusri. Wajib memilih strategi <strong>Mitigasi</strong> dan merumuskan rencana tindakan penanganan.
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. Penyebab & Dampak Risiko */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Akar Masalah / Penyebab Risiko *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={penyebabRisiko}
                      onChange={(e) => setPenyebabRisiko(e.target.value)}
                      placeholder="Identifikasi akar penyebab terjadinya risiko..."
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Uraian Konsekuensi / Dampak Risiko *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={dampakRisiko}
                      onChange={(e) => setDampakRisiko(e.target.value)}
                      placeholder="Dampak potensial terhadap operasi, finansial, atau keselamatan..."
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* 5. Rencana Mitigasi & Strategi */}
                <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200/80">
                    <span className="font-bold text-xs text-sky-950">
                      Rencana Tindakan Penanganan & Mitigasi Risiko
                    </span>
                    <span className="text-[10px] text-sky-700 font-semibold">
                      SOP 16 Tahapan Pusri
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Rencana Tindakan Mitigasi *
                      </label>
                      <input
                        type="text"
                        required
                        value={rencanaPenanganan}
                        onChange={(e) => setRencanaPenanganan(e.target.value)}
                        placeholder="Rencana aksi konkrit untuk menurunkan level risiko..."
                        className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Jenis Strategi Penanganan
                      </label>
                      <select
                        value={jenisPenanganan}
                        onChange={(e) => setJenisPenanganan(e.target.value as RiskHandlingStrategy)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="Mitigasi">Mitigasi</option>
                        <option value="Diterima">Diterima (Accept)</option>
                        <option value="Dihindari">Dihindari (Avoid)</option>
                        <option value="Transfer">Ditransfer (Transfer)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Target Waktu Penyelesaian Mitigasi
                      </label>
                      <select
                        value={targetWaktuMitigasi}
                        onChange={(e) => setTargetWaktuMitigasi(e.target.value)}
                        className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:border-sky-500 outline-none transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="TW 1">TW 1 (Januari - Maret)</option>
                        <option value="TW 2">TW 2 (April - Juni)</option>
                        <option value="TW 3">TW 3 (Juli - September)</option>
                        <option value="TW 4">TW 4 (Oktober - Desember)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Estimasi Biaya Pengendalian (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={biayaRencanaPengendalian}
                        onChange={(e) => setBiayaRencanaPengendalian(Number(e.target.value))}
                        className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:border-sky-500 outline-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Catatan Tambahan Perbaikan Unit Kerja */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Catatan Rangkuman Perbaikan (Opsional untuk Atasan/VP):
                  </label>
                  <input
                    type="text"
                    value={catatanPerbaikan}
                    onChange={(e) => setCatatanPerbaikan(e.target.value)}
                    placeholder="Contoh: Telah menyempurnakan perkiraan biaya mitigasi dan detail akar penyebab."
                    className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:border-sky-500 outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* 7. Action Buttons Bar (Warna Biru Muda & Kuning/Hijau Elegan) */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    Posisi Anda: <strong className="text-slate-800">{currentRole}</strong> • Perubahan tersinkronisasi ke basis data MySQL.
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {activeRisk.statusWorkflow === 'Revisi' ||
                    (activeRisk.statusWorkflow as string) === 'revisi' ||
                    activeRisk.statusWorkflow === 'Draft_Unit' ? (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSave(true)}
                        className="px-6 py-2.5 rounded-xl bg-[#009fe3] hover:bg-[#0087c2] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 text-white" />
                        <span>{isSubmitting ? 'Mengirim...' : 'Simpan & Ajukan Ulang ke VP'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSave(false)}
                        className="px-6 py-2.5 rounded-xl bg-[#009fe3] hover:bg-[#0087c2] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 text-white" />
                        <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-yellow-100 text-amber-700 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Pilih Butir Risiko di Panel Kiri untuk Membuka Formulir
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Gunakan dropdown atau klik salah satu kartu risiko pada panel sebelah kiri untuk menampilkan dan mengedit data risiko.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
