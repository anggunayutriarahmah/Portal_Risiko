import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  RotateCcw, 
  Building2, 
  ArrowRight,
  Users,
  Edit2,
  Calculator
} from 'lucide-react';
import { PusriRisk, UserRole, UserAccount } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';
import { AccessDeniedBanner } from './AccessDeniedBanner';
import { getMasterRiskLevel, sortRisksNewestFirst } from '../../utils/riskMatrix';

interface ReviewVpViewProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  onSwitchRole?: (role: UserRole) => void;
  risks: PusriRisk[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onSelectRisk: (risk: PusriRisk) => void;
  onNavigateNext?: (nextTab: string, roleToSwitch?: UserRole) => void;
  onOpenUpdateRiskModal?: (risk: PusriRisk) => void;
}

export const ReviewVpView: React.FC<ReviewVpViewProps> = ({
  currentRole,
  currentUser,
  risks,
  onRiskUpdated,
  onSelectRisk,
  onNavigateNext,
  onOpenUpdateRiskModal
}) => {
  // Enforce RBAC
  if (currentRole === 'risk officer') {
    return (
      <AccessDeniedBanner
        moduleName="Review Risk Owner (VP)"
        requiredRole="risk owner"
        currentRole={currentRole}
        onBackToDashboard={() => onNavigateNext?.('dashboard')}
        onGoToIdentifikasi={() => onNavigateNext?.('identifikasi')}
      />
    );
  }

  const [filterMyDeptOnly, setFilterMyDeptOnly] = useState(false);

  const pendingRisks = risks.filter((r) => {
    if (
      r.statusWorkflow !== 'Menunggu_Approval_VP' ||
      (r.jenisPenanganan &&
        !['Mitigasi', 'Diterima', 'Dihindari', 'Transfer'].includes(r.jenisPenanganan))
    ) {
      return false;
    }
    // Jika bukan Admin (yaitu Risk Owner), wajib terisolasi ke departemennya (sinkron dengan input Risk Officer)
    if (currentRole !== 'risk admin' && currentUser?.unitKerja) {
      const uDept = currentUser.unitKerja.toLowerCase().trim();
      const uKode = (currentUser.kodeUnitKerja || '').toLowerCase().trim();
      const rDept = (r.namaOrganisasi || '').toLowerCase().trim();
      const rKode = (r.kodeOrganisasi || '').toLowerCase().trim();
      const isMatch = rDept.includes(uDept) || uDept.includes(rDept) || (uKode && rKode === uKode);
      if (!isMatch) return false;
    } else if (filterMyDeptOnly && currentUser?.unitKerja) {
      const match = r.namaOrganisasi.toLowerCase().includes(currentUser.unitKerja.toLowerCase()) ||
                    (currentUser.kodeUnitKerja && r.kodeOrganisasi.toLowerCase() === currentUser.kodeUnitKerja.toLowerCase());
      if (!match) return false;
    }
    return true;
  }).sort(sortRisksNewestFirst);

  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(pendingRisks[0] || null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const actorName = currentUser?.nama
    ? `${currentUser.nama} (Badge ${currentUser.badge || '0951'} - ${currentUser.jabatan || 'VP Departemen'})`
    : (currentRole === 'risk admin' ? 'Risk Admin' : 'VP Departemen (Risk Owner)');

  // Sync state whenever selectedRisk changes
  useEffect(() => {
    if (selectedRisk) {
      setNotes(selectedRisk.reviewNotesVp || '');
    }
  }, [selectedRisk]);

  // Keep selectedRisk in sync with risks prop whenever data updates
  useEffect(() => {
    if (selectedRisk) {
      const refreshed = pendingRisks.find((r) => r.id === selectedRisk.id);
      if (refreshed) {
        setSelectedRisk(refreshed);
      } else {
        setSelectedRisk(pendingRisks[0] || null);
      }
    } else if (pendingRisks.length > 0) {
      setSelectedRisk(pendingRisks[0]);
    }
  }, [risks]);

  // Mitigasi forwards to Admin Approval; non-mitigation strategies finish at VP.
  const handleApprove = async () => {
    if (!selectedRisk) return;
    const completesAtVp = selectedRisk.jenisPenanganan !== 'Mitigasi';
    setIsProcessing(true);
    try {
      const defaultNote = completesAtVp
        ? `Telah direview dan disetujui oleh ${actorName} (Strategi ${selectedRisk.jenisPenanganan} — persetujuan selesai di tingkat Atasan / VP).`
        : `Telah direview dan disetujui resmi oleh ${actorName} untuk eskalasi ke tahap Approval Korporat Admin.`;

      const updated = await PusriApiClient.submitVpDecision(
        selectedRisk.id,
        'approve',
        notes.trim() || defaultNote,
        '',
        '',
        actorName,
        currentRole
      );
      if (updated) {
        onRiskUpdated(updated);
        if (completesAtVp) {
          setActionNotice(
            `Risiko [${updated.kodeRisiko}] (Strategi ${updated.jenisPenanganan}) berhasil disetujui oleh ${currentUser?.nama || 'Atasan / VP'} dan selesai sampai tingkat Atasan / VP (tidak diteruskan ke Approval & Evaluasi Admin).`
          );
        } else {
          setActionNotice(
            `Risiko [${updated.kodeRisiko}] berhasil disetujui oleh ${currentUser?.nama || 'VP'} dan dialihkan ke antrean Approval Korporat Admin.`
          );
        }

        // Reset selected risk and notes so form is clean
        setSelectedRisk(null);
        setNotes('');

        if (!completesAtVp && currentRole === 'risk admin' && onNavigateNext) {
          setTimeout(() => {
            onNavigateNext('approval-admin');
          }, 1200);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // VP Request Revision back to Unit Kerja (Status: Revisi)
  const handleRequestRevision = async () => {
    if (!selectedRisk) return;
    setIsProcessing(true);
    const revisionNote = notes.trim() || `Mohon perbaiki uraian identifikasi risiko, akar penyebab, atau rencana penanganan mitigasi sesuai arahan evaluasi ${actorName} sebelum diajukan kembali.`;
    try {
      const updated = await PusriApiClient.submitVpDecision(
        selectedRisk.id,
        'revisi',
        revisionNote,
        '',
        '',
        actorName,
        currentRole
      );
      if (updated) {
        onRiskUpdated(updated);
        setActionNotice(`Risiko [${updated.kodeRisiko}] berhasil dikembalikan ke Risk Officer dengan status (Revisi). Catatan revisi telah terlampir.`);
        setSelectedRisk(null);
        setNotes('');
      }
    } catch (err: any) {
      console.error('Revision submission failed:', err);
      setActionNotice(`Gagal mengembalikan risiko: ${err.message || 'Terjadi kesalahan sistem.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      {/* Banner */}
      <div className="p-3.5 md:p-4 rounded-xl bg-gradient-to-r from-[#009fe3] to-[#0284c7] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-extrabold tracking-tight">
            Review & Validasi Usulan Risiko (Atasan / VP)
          </h2>
          <p className="text-xs text-sky-100 mt-0.5">
            VP Bertugas: <strong className="text-white font-bold">{currentUser?.nama || 'M DAVI RAMADHAN'}</strong> {currentUser?.badge ? `[Badge ${currentUser.badge}]` : ''} - {currentUser?.unitKerja || 'Departemen Operasi Pabrik Pusri IIB'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRole !== 'risk admin' && currentUser?.unitKerja ? (
            <div className="px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-bold border border-white/30 flex items-center gap-1.5">
              <span>Unit: {currentUser.unitKerja} (Sinkron)</span>
            </div>
          ) : currentUser?.unitKerja ? (
            <button
              type="button"
              onClick={() => setFilterMyDeptOnly(!filterMyDeptOnly)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                filterMyDeptOnly 
                  ? 'bg-yellow-400 text-slate-900 border-yellow-300 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              {filterMyDeptOnly ? `Unit Saya Aktif` : `Filter Unit Korporat`}
            </button>
          ) : null}
          <div className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-mono text-yellow-300 shrink-0">
            Antrean: <strong className="text-white font-bold">{pendingRisks.length} Usulan</strong>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#009fe3] shrink-0" />
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button type="button" onClick={() => setActionNotice(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Main Review Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Left Column: Queue of Pending Risks */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Daftar Usulan Menunggu Review ({pendingRisks.length})</span>
            <span className="text-[10px] font-mono text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              Antrean VP
            </span>
          </div>

          <div className="space-y-2">
            {pendingRisks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#009fe3] mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Semua Usulan Sudah Direview oleh VP
                </p>
                <p className="text-[11px] text-slate-500">
                  Tidak ada risiko pending dalam antrean review VP saat ini.
                </p>
              </div>
            ) : (
              pendingRisks.map((risk) => {
                const isSelected = selectedRisk?.id === risk.id;
                return (
                  <div
                    key={risk.id}
                    onClick={() => {
                      setSelectedRisk(risk);
                      setActionNotice(null);
                    }}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-xs ring-1 ring-amber-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-amber-800 dark:text-amber-400">
                        {risk.kodeRisiko}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                        Skor: {risk.inherentScore}
                      </span>
                    </div>

                    <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                      {risk.pernyataanRisiko}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 gap-1">
                      <span className="truncate">{risk.namaOrganisasi}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {risk.jenisPenanganan === 'Dihindari' && (
                          <span className="font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800 text-[9px]">
                            Dihindari
                          </span>
                        )}
                        <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 text-[9px]">
                          Tahap: Review VP
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Dossier, Individual PIC Assignment, & Review Action */}
        <div className="md:col-span-2 space-y-4">
          {selectedRisk ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
              
              {/* Header Dossier */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                      {selectedRisk.kodeRisiko}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Menunggu Approval VP
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Unit Pengusul: <strong>{selectedRisk.namaOrganisasi}</strong> • Tahun: <strong>{selectedRisk.tahun}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentRole === 'risk owner' && onOpenUpdateRiskModal && (
                    <button
                      type="button"
                      onClick={() => onOpenUpdateRiskModal(selectedRisk)}
                      className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-xs font-bold text-sky-800 dark:text-sky-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Buka formulir lengkap untuk mengedit data risiko oleh VP"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#009fe3]" />
                      <span>Edit Data Risiko</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectRisk(selectedRisk)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Lihat Berkas Lengkap
                  </button>
                </div>
              </div>

              {/* Statement */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase block">
                  Pernyataan Risiko yang Diajukan:
                </span>
                <p className="text-slate-900 dark:text-slate-100 font-bold text-xs leading-relaxed">
                  {selectedRisk.pernyataanRisiko}
                </p>
              </div>

              {/* Causes & Impacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Akar Masalah:</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedRisk.penyebabRisiko}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Dampak:</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedRisk.dampakRisiko}</p>
                </div>
              </div>

              {/* Assessment Score: Penilaian Matriks Risiko Awal (Inherent Risk) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#009fe3]" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Penilaian Matriks Risiko Awal (Inherent Risk)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                      Sesuai Data Identifikasi Risiko
                    </span>
                  </div>

                  {currentRole === 'risk owner' && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Gunakan tombol <strong className="text-sky-600 dark:text-sky-400">"Edit Data Risiko"</strong> di atas untuk mengubah isian
                    </span>
                  )}
                </div>

                {/* MATRIX DISPLAY CARDS */}
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-bold">Kemungkinan</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">{selectedRisk.kemungkinanAwal} / 5</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-bold">Dampak</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">{selectedRisk.dampakAwal} / 5</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-bold">Skor Inherent</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">{selectedRisk.inherentScore || (selectedRisk.kemungkinanAwal * selectedRisk.dampakAwal)}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 shadow-2xs">
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-bold">Tingkat</span>
                      <strong className="text-amber-800 dark:text-amber-300 font-mono text-sm">{selectedRisk.tingkatRisikoAwal || getMasterRiskLevel(selectedRisk.kemungkinanAwal, selectedRisk.dampakAwal)}</strong>
                    </div>
                  </div>

                  {selectedRisk.kriteriaDampakTitle && (
                    <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-800 dark:text-sky-300 flex items-center justify-between">
                      <span>Kriteria Dampak: <strong>{selectedRisk.kriteriaDampakTitle}</strong> (Level {selectedRisk.dampakAwal})</span>
                      <span className="text-[10px] text-slate-500 font-mono">Tersinkronisasi</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mitigation / Treatment Plan */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-sky-50/40 dark:bg-sky-950/20">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedRisk.jenisPenanganan === 'Dihindari'
                      ? 'Rencana Penanganan Risiko (Dihindari):'
                      : 'Rencana Mitigasi yang Diusulkan:'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    selectedRisk.jenisPenanganan === 'Dihindari'
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#009fe3] text-white'
                  }`}>
                    {selectedRisk.jenisPenanganan}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {selectedRisk.rencanaPenanganan}
                </p>
                {selectedRisk.jenisPenanganan !== 'Dihindari' && (
                  <div className="flex gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                    <span>Target: <strong>{selectedRisk.targetWaktuMitigasi}</strong></span>
                    <span>Estimasi Biaya: <strong>Rp {selectedRisk.biayaRencanaPengendalian.toLocaleString('id-ID')}</strong></span>
                  </div>
                )}
              </div>

              {/* VP Review Feedback Notes & Actions */}
              <div className="p-4 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20 space-y-3">
                <label className="block text-xs font-bold text-sky-900 dark:text-sky-200">
                  Catatan Verifikasi & Arahan Vice President (VP):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder=""
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs resize-none"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedRisk.jenisPenanganan !== 'Mitigasi' ? (
                      <>
                        Strategi <strong>{selectedRisk.jenisPenanganan}</strong>: Persetujuan selesai cukup sampai tahap <strong>Atasan / VP</strong> saja (tidak masuk ke Approval &amp; Evaluasi Admin).
                      </>
                    ) : (
                      <>
                        Setelah disetujui, usulan risiko resmi lanjut ke <strong>Approval Admin</strong>.
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleRequestRevision}
                      className="px-3.5 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembalikan ke Unit (Revisi)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleApprove}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#009fe3] to-[#0284c7] hover:from-[#008bc8] hover:to-[#0273af] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : selectedRisk.jenisPenanganan !== 'Mitigasi' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Setujui Penanganan (Selesai di VP)</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Setujui Usulan &amp; Teruskan ke Admin</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Pilih usulan risiko dari antrean di samping kiri untuk memulai proses review substansi risiko.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
