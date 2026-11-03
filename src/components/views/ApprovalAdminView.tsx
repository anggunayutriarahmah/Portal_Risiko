import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Trash2, 
  AlertTriangle, 
  Search, 
  Activity, 
  UserCheck
} from 'lucide-react';
import { PusriRisk, UserRole, OrganizationMaster, UserAccount } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';
import { AccessDeniedBanner } from './AccessDeniedBanner';
import { sortRisksNewestFirst } from '../../utils/riskMatrix';

interface ApprovalAdminViewProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  onSwitchRole?: (role: UserRole) => void;
  risks: PusriRisk[];
  departments?: OrganizationMaster[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onRiskDeleted: (riskId: string) => void;
  onNavigateNext?: (nextTab: string, roleToSwitch?: UserRole) => void;
}

export const ApprovalAdminView: React.FC<ApprovalAdminViewProps> = ({
  currentRole,
  currentUser,
  risks,
  departments = [],
  onRiskUpdated,
  onRiskDeleted,
  onNavigateNext
}) => {
  // Enforce RBAC (Risk Admin only)
  if (currentRole !== 'risk admin') {
    return (
      <AccessDeniedBanner
        moduleName="Approval & Evaluasi Admin"
        requiredRole="risk admin"
        currentRole={currentRole}
        onBackToDashboard={() => onNavigateNext?.('dashboard')}
        onGoToIdentifikasi={() => onNavigateNext?.('identifikasi')}
      />
    );
  }

  // Approval Admin View - Verifikasi usulan risiko & penugasan departemen pelaksana pengendalian
  const mitigationRisks = risks.filter((r) => r.jenisPenanganan === 'Mitigasi' || !r.jenisPenanganan).sort(sortRisksNewestFirst);
  const pendingRisks = mitigationRisks.filter((r) => r.statusWorkflow === 'Menunggu_Approval_Admin').sort(sortRisksNewestFirst);
  const controlledRisks = mitigationRisks.filter((r) => r.statusWorkflow === 'Disetujui_Dalam_Pengendalian').sort(sortRisksNewestFirst);

  const [filterMode, setFilterMode] = useState<'pending' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(pendingRisks[0] || mitigationRisks[0] || null);

  const [picDepartemen, setPicDepartemen] = useState(
    selectedRisk?.picDepartemen || selectedRisk?.namaOrganisasi || departments[0]?.nama || ''
  );
  const [approvalNotes, setApprovalNotes] = useState(selectedRisk?.approvalNotesAdmin || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  const displayList = (filterMode === 'pending' ? pendingRisks : mitigationRisks).filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.kodeRisiko.toLowerCase().includes(q) ||
      r.pernyataanRisiko.toLowerCase().includes(q) ||
      r.namaOrganisasi.toLowerCase().includes(q) ||
      (r.picPelaksana && r.picPelaksana.toLowerCase().includes(q))
    );
  }).sort(sortRisksNewestFirst);

  // Keep selectedRisk in sync with risks prop whenever data updates
  useEffect(() => {
    const currentPool = filterMode === 'pending' ? pendingRisks : mitigationRisks;
    if (selectedRisk) {
      const refreshed = currentPool.find((r) => r.id === selectedRisk.id);
      if (refreshed) {
        setSelectedRisk(refreshed);
      } else {
        setSelectedRisk(currentPool[0] || null);
      }
    } else if (currentPool.length > 0) {
      setSelectedRisk(currentPool[0]);
    }
  }, [risks, filterMode]);

  const handleSelectRisk = (risk: PusriRisk) => {
    setSelectedRisk(risk);
    const matchedDept = risk.picDepartemen || departments.find(
      (d) => d.kode === risk.kodeOrganisasi || d.nama === risk.namaOrganisasi
    )?.nama || risk.namaOrganisasi || departments[0]?.nama || '';

    setPicDepartemen(matchedDept);
    setApprovalNotes(risk.approvalNotesAdmin || '');
    setNotice(null);
    setConfirmReject(false);
  };

  const handleApproveWithPic = async () => {
    if (!selectedRisk) return;

    if (!picDepartemen.trim()) {
      setNotice({
        type: 'error',
        text: `Penentuan PIC Wajib: Silakan pilih Departemen PIC penanggung jawab risiko ${selectedRisk.kodeRisiko}.`
      });
      return;
    }

    const effectivePic = picDepartemen.trim();
    const effectiveNotes = approvalNotes.trim() || 'Telah disetujui resmi oleh Risk Admin Korporat dan penugasan PIC Departemen ditetapkan.';
    const adminActor = currentUser?.nama
      ? `${currentUser.nama} (Badge ${currentUser.badge || '0952'} - ${currentUser.jabatan || 'Risk Admin Korporat'})`
      : 'Risk Admin Korporat';

    setIsProcessing(true);
    try {
      const res = await PusriApiClient.approveRiskIndividual(
        selectedRisk.id,
        'approve',
        effectiveNotes,
        effectivePic,
        effectivePic,
        adminActor,
        'risk admin',
        effectivePic
      );

      if (res.success && res.data) {
        onRiskUpdated(res.data);
        setNotice({
          type: 'success',
          text: `Approval Berhasil: Risiko ${res.data.kodeRisiko} telah disetujui dengan PIC "${effectivePic}" dan disimpan ke database.`
        });

        setSelectedRisk(null);
        setPicDepartemen('');
        setApprovalNotes('');
      } else {
        setNotice({ type: 'error', text: res.message || 'Gagal memproses approval risiko.' });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Terjadi kesalahan sistem saat approval.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteReject = async () => {
    if (!selectedRisk) return;
    setIsProcessing(true);
    try {
      const res = await PusriApiClient.approveRiskIndividual(
        selectedRisk.id,
        'reject',
        approvalNotes.trim() || 'Usulan risiko ditolak oleh Admin Korporat.',
        undefined,
        undefined,
        currentUser?.nama || 'Risk Admin Korporat',
        'risk admin'
      );
      if (res.success && res.data) {
        onRiskUpdated(res.data);
        setNotice({
          type: 'success',
          text: `Usulan risiko ${res.data.kodeRisiko} telah dikembalikan / ditolak dan formulir telah di-reset.`
        });
        // Reset form & selectedRisk
        setSelectedRisk(null);
        setPicDepartemen('');
        setApprovalNotes('');
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Gagal memproses penolakan.' });
    } finally {
      setIsProcessing(false);
      setConfirmReject(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto py-2">
      {/* 1. Header Banner */}
      <div className="p-3.5 md:p-4 rounded-xl bg-gradient-to-r from-[#009fe3] via-sky-800 to-sky-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-extrabold tracking-tight">
            Approval Usulan Risiko & Penetapan Departemen Pelaksana Pengendalian (Admin)
          </h2>
          <p className="text-xs text-sky-100 mt-0.5">
            Admin Bertugas: <strong className="text-white font-bold">{currentUser?.nama || 'DAFFA ARI PRASETYA'}</strong> {currentUser?.badge ? `[Badge ${currentUser.badge}]` : ''} - {currentUser?.jabatan || 'Super Admin ERM Korporat'} • <span className="text-yellow-300 font-semibold">Alur SOP: Admin menentukan departemen pelaksana pengendalian</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-mono text-yellow-300">
            Pending: <strong className="text-white font-bold">{pendingRisks.length}</strong> • Aktif: <strong className="text-white font-bold">{controlledRisks.length}</strong>
          </div>
        </div>
      </div>

      {/* 2. Top Header in Admin */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-[#009fe3] text-white shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Approval & Penentuan Departemen Pelaksana</span>
            {pendingRisks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-yellow-400 text-slate-900 text-[10px] font-mono font-bold">
                {pendingRisks.length}
              </span>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Khusus Evaluasi TW & Alih PIC Risiko: Gunakan menu <strong className="text-[#009fe3]">Pengendalian & Pemantauan (TW 1-4)</strong> pada bilah navigasi
        </div>
      </div>

      {/* Main Single Stage Layout: Left List, Right Detail & PIC Assignment */}
      <div className="space-y-4">
        {/* Global Notice Alert Banner */}
        {notice && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            notice.type === 'success'
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#009fe3] shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notice.text}</span>
            </div>
            <button type="button" onClick={() => setNotice(null)} className="text-xs font-bold hover:underline cursor-pointer">
              ✕
            </button>
          </div>
        )}

          {/* Main Single Stage Layout: Left List, Right Detail & PIC Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Column: Daftar Risiko Individual */}
            <div className="md:col-span-1 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Daftar Risiko ({displayList.length})</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFilterMode('pending')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      filterMode === 'pending'
                        ? 'bg-[#009fe3] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Menunggu ({pendingRisks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-[#009fe3] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Semua ({mitigationRisks.length})
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode, pernyataan, PIC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-[#009fe3]"
                />
              </div>

              {/* List items */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {displayList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    Tidak ada usulan risiko dalam antrean.
                  </div>
                ) : (
                  displayList.map((r) => {
                    const isSelected = selectedRisk?.id === r.id;
                    const isPending = r.statusWorkflow === 'Menunggu_Approval_Admin';

                    return (
                      <div
                        key={r.id}
                        onClick={() => handleSelectRisk(r)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#009fe3] bg-sky-50/70 dark:bg-sky-950/40 shadow-xs ring-1 ring-[#009fe3]'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {r.kodeRisiko}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            isPending
                              ? 'bg-amber-100 text-amber-900 dark:bg-yellow-950/60 dark:text-yellow-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {isPending ? 'Menunggu Approval' : 'Disetujui'}
                          </span>
                        </div>
                        <p className="font-medium text-slate-700 dark:text-slate-300 line-clamp-2 text-[11px] leading-snug">
                          {r.pernyataanRisiko}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                          <span className="truncate max-w-[140px]">{r.namaOrganisasi}</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {r.currentTingkatRisiko} ({r.inherentScore})
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Detail & Penugasan PIC */}
            <div className="md:col-span-2">
              {selectedRisk ? (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#009fe3]">
                          {selectedRisk.kodeRisiko}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300">
                          Level: {selectedRisk.currentTingkatRisiko} (Skor: {selectedRisk.inherentScore})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedRisk.namaOrganisasi} • Tahun {selectedRisk.tahun}
                      </p>
                    </div>

                  </div>

                  {/* Uraian Risiko */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block">Pernyataan Risiko:</span>
                      <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                        {selectedRisk.pernyataanRisiko}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block">Penyebab:</span>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5 line-clamp-2">
                          {selectedRisk.penyebabRisiko}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block">Dampak:</span>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5 line-clamp-2">
                          {selectedRisk.dampakRisiko}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rencana Penanganan */}
                  <div className="p-3.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs space-y-1.5">
                    <span className="font-bold text-[#009fe3] dark:text-sky-400 block">
                      Rencana Tindakan Mitigasi Terprogram:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {selectedRisk.rencanaPenanganan}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Target: <strong>{selectedRisk.targetWaktuMitigasi || 'TW 2'}</strong></span>
                      <span>Anggaran: <strong>Rp {(selectedRisk.biayaRencanaPengendalian || 0).toLocaleString('id-ID')}</strong></span>
                    </div>
                  </div>

                  {/* INFORMASI & LAPORAN PROGRES PELAKSANAAN DARI PIC */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          Laporan & Progres Pelaksanaan dari PIC
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                          Progres: {selectedRisk.progressPelaksanaanTerakhir ?? (selectedRisk.pelaksanaanTindakan?.[0]?.progressPersen ?? 0)}%
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          (selectedRisk.statusPelaksanaanTerakhir || 'Sedang Berjalan') === 'Selesai Dilaksanakan'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : (selectedRisk.statusPelaksanaanTerakhir || 'Sedang Berjalan') === 'Terkendala'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-sky-100 text-[#009fe3] dark:bg-sky-950 dark:text-sky-300'
                        }`}>
                          {selectedRisk.statusPelaksanaanTerakhir || 'Sedang Berjalan'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Kemajuan Fisik Pelaksanaan oleh PIC:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {selectedRisk.progressPelaksanaanTerakhir ?? (selectedRisk.pelaksanaanTindakan?.[0]?.progressPersen ?? 0)}% Selesai
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${selectedRisk.progressPelaksanaanTerakhir ?? (selectedRisk.pelaksanaanTindakan?.[0]?.progressPersen ?? 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Detail PIC Aktif */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">Departemen PIC Penanggung Jawab:</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold text-xs">
                        {selectedRisk.picDepartemen || selectedRisk.picPelaksana || selectedRisk.namaOrganisasi || 'Belum Ditetapkan'}
                      </strong>
                    </div>

                    {/* Daftar Proses & Tindakan yang Telah Di-input PIC */}
                    {selectedRisk.pelaksanaanTindakan && selectedRisk.pelaksanaanTindakan.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Histori Proses Tindakan yang Di-input PIC ({selectedRisk.pelaksanaanTindakan.length} Catatan):
                        </span>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {selectedRisk.pelaksanaanTindakan.map((act, idx) => (
                            <div key={act.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                              <div className="flex items-center justify-between font-semibold flex-wrap gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-[#009fe3]">
                                    {act.id || `Tindakan #${idx + 1}`}
                                  </span>
                                  <span className="text-slate-400 font-mono text-[10px]">
                                    • {act.tanggalPelaksanaan}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                                    {act.progressPersen}%
                                  </span>
                                  <span className="text-[10px] px-2 py-0.2 rounded font-semibold bg-sky-50 text-[#009fe3] border border-sky-200">
                                    {act.statusPelaksanaan}
                                  </span>
                                </div>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                {act.uraianTindakan}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                                {act.kendalaDanHambatan && act.kendalaDanHambatan !== '-' && (
                                  <div>
                                    <span className="font-semibold text-rose-600">Kendala: </span>
                                    <span>{act.kendalaDanHambatan}</span>
                                  </div>
                                )}
                                {act.tindakLanjut && act.tindakLanjut !== '-' && (
                                  <div>
                                    <span className="font-semibold text-sky-600">Tindak Lanjut: </span>
                                    <span>{act.tindakLanjut}</span>
                                  </div>
                                )}
                                {act.nomorBuktiDokumen && (
                                  <div>
                                    <span className="font-semibold">Bukti: </span>
                                    <span className="font-mono">{act.nomorBuktiDokumen}</span>
                                  </div>
                                )}
                                {act.realisasiBiaya ? (
                                  <div>
                                    <span className="font-semibold text-emerald-600">Biaya: </span>
                                    <span className="font-mono">Rp {act.realisasiBiaya.toLocaleString('id-ID')}</span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] flex items-center justify-between">
                        <span>Belum ada catatan proses yang diinput oleh PIC untuk risiko ini.</span>
                        <span className="text-[10px] font-mono text-[#009fe3] font-bold">Menunggu Input PIC</span>
                      </div>
                    )}
                  </div>

                  {/* FORM PENETAPAN DEPARTEMEN PELAKSANA PENGENDALIAN (WEWENANG KHUSUS ADMIN) */}
                  <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-950 dark:text-sky-200">
                      <UserCheck className="w-4 h-4 text-[#009fe3]" />
                      <span>Penetapan Departemen Pelaksana Pengendalian (Wewenang Khusus Admin):</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Departemen yang Ditugaskan Melaksanakan Pengendalian *
                        </label>
                        <select
                          value={picDepartemen}
                          onChange={(e) => setPicDepartemen(e.target.value)}
                          className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none cursor-pointer"
                        >
                          <option value="">-- Pilih Departemen Pelaksana Pengendalian --</option>
                          {departments.map((dept) => (
                            <option key={dept.kode} value={dept.nama}>
                              {dept.kode} - {dept.nama}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Sesuai SOP ERM Pusri, Admin menentukan departemen mana yang akan melaksanakan pengendalian terhadap risiko yang ditentukan. Departemen terpilih bertanggung jawab melaksanakan tindakan mitigasi &amp; melaporkan kemajuan fisik triwulanan.
                        </p>
                      </div>

                      {/* Section Catatan - Arahan untuk Departemen Pelaksana */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Catatan - Arahan Admin untuk Departemen Pelaksana Pengendalian *
                        </label>
                        <textarea
                          rows={2}
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          placeholder="Tuliskan arahan pelaksanaan tindakan pengendalian & target penyelesaian bagi departemen pelaksana..."
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                    {confirmReject ? (
                      <div className="flex items-center gap-2 p-1.5 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-xl">
                        <span className="text-[11px] font-bold text-red-700 dark:text-red-300">
                          Yakin tolak usulan {selectedRisk.kodeRisiko}?
                        </span>
                        <button
                          type="button"
                          onClick={handleExecuteReject}
                          disabled={isProcessing}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? 'Memproses...' : 'Ya, Tolak'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReject(false)}
                          disabled={isProcessing}
                          className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmReject(true)}
                        disabled={isProcessing}
                        className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Tolak Usulan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleApproveWithPic}
                      disabled={isProcessing}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-sky-200" />
                      <span>{isProcessing ? 'Menyimpan...' : 'Simpan Penugasan Departemen & Setujui Risiko'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  Pilih risiko dari daftar di sebelah kiri untuk melihat rincian dan menentukan PIC.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};
