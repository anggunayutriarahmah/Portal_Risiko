import React, { useState } from 'react';
import { X, Calendar, Activity, CheckCircle2, AlertTriangle, Plus, Save, Lock, CheckCircle } from 'lucide-react';
import { PusriRisk, QuarterlyControl, RiskLevel, UserRole } from '../types/pusri';
import { PusriApiClient } from '../services/api';
import { getMasterRiskLevel, getFirstFinishedQuarter, isQuarterLocked, TW_SEQUENCE } from '../utils/riskMatrix';

interface PengendalianTwModalProps {
  isOpen: boolean;
  onClose: () => void;
  risks: PusriRisk[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  currentRole?: UserRole;
}

export const PengendalianTwModal: React.FC<PengendalianTwModalProps> = ({
  isOpen,
  onClose,
  risks,
  onRiskUpdated,
  currentRole
}) => {
  const activeRisks = risks.filter(
    (r) => r.statusWorkflow === 'Disetujui_Dalam_Pengendalian' || 
           r.statusWorkflow === 'Selesai' || 
           r.statusWorkflow === 'Carry_Over' || 
           (r.pengendalianTriwulan && r.pengendalianTriwulan.length > 0)
  );
  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(activeRisks[0] || null);

  // New TW form state
  const [triwulan, setTriwulan] = useState<'TW 1' | 'TW 2' | 'TW 3' | 'TW 4'>('TW 2');
  const [realisasiKegiatan, setRealisasiKegiatan] = useState('');
  const [realisasiBiaya, setRealisasiBiaya] = useState(50000000);
  const [progressPersen, setProgressPersen] = useState(75);
  const [kemungkinanResidual, setKemungkinanResidual] = useState(2);
  const [dampakResidual, setDampakResidual] = useState(3);
  const [statusPengendalian, setStatusPengendalian] = useState<'On Track' | 'Delayed' | 'Completed'>('On Track');
  const [kendala, setKendala] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finishedTw = getFirstFinishedQuarter(selectedRisk);
  const isCurrentTwLocked = selectedRisk?.statusWorkflow === 'Carry_Over' ? false : isQuarterLocked(selectedRisk, triwulan);
  const existingTw = selectedRisk?.pengendalianTriwulan?.find((c) => c.triwulan === triwulan);
  const isTwAlreadyInputted = Boolean(existingTw);
  const isResidualLocked = isCurrentTwLocked || isTwAlreadyInputted;

  // Sync state whenever selectedRisk or triwulan changes
  React.useEffect(() => {
    if (!selectedRisk) return;
    const existing = selectedRisk.pengendalianTriwulan?.find((c) => c.triwulan === triwulan);
    if (existing) {
      setRealisasiKegiatan(existing.realisasiKegiatan || '');
      setRealisasiBiaya(existing.realisasiBiaya || 0);
      setProgressPersen(existing.progressPersen || 0);
      setKemungkinanResidual(existing.kemungkinanResidual);
      setDampakResidual(existing.dampakResidual);
      setStatusPengendalian(existing.statusPengendalian as any);
      setKendala(existing.kendalaDanTindakLanjut || '');
    } else {
      setRealisasiKegiatan('');
      setRealisasiBiaya(Math.round((selectedRisk.biayaRencanaPengendalian || 100000000) * 0.25));
      setProgressPersen(50);
      setKemungkinanResidual(Math.max(1, selectedRisk.kemungkinanAwal - 1));
      setDampakResidual(selectedRisk.dampakAwal);
      setStatusPengendalian('On Track');
      setKendala('');
    }
  }, [selectedRisk, triwulan]);

  if (!isOpen) return null;

  const handleAddQuarterly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisk || !realisasiKegiatan.trim() || isCurrentTwLocked) return;

    setIsSubmitting(true);
    // Nilai residual tidak dapat diubah jika TW telah diinput sebelumnya
    const finalK = existingTw ? existingTw.kemungkinanResidual : kemungkinanResidual;
    const finalD = existingTw ? existingTw.dampakResidual : dampakResidual;
    const tingkatResidual = existingTw ? existingTw.tingkatResidual : getMasterRiskLevel(finalK, finalD);
    const isFinished = tingkatResidual === 'Low' || statusPengendalian === 'Completed' || progressPersen >= 100;

    const newControl: QuarterlyControl = {
      triwulan,
      realisasiKegiatan,
      realisasiBiaya: Number(realisasiBiaya),
      progressPersen: Number(progressPersen),
      kemungkinanResidual: finalK,
      dampakResidual: finalD,
      tingkatResidual,
      statusPengendalian: isFinished ? 'Completed' : statusPengendalian,
      kendalaDanTindakLanjut: kendala,
      updatedAt: new Date().toISOString()
    };

    const existingControls = selectedRisk.pengendalianTriwulan || [];
    const updatedList = existingControls.filter((c) => c.triwulan !== triwulan);
    updatedList.push(newControl);

    const executionStatus = isFinished ? 'Selesai Dilaksanakan' : statusPengendalian === 'Delayed' ? 'Terkendala' : 'Sedang Berjalan';
    const actionId = `ACT-${selectedRisk.kodeRisiko}-${triwulan.replace(/\s+/g, '')}`;
    const existingActions = Array.isArray(selectedRisk.pelaksanaanTindakan) ? [...selectedRisk.pelaksanaanTindakan] : [];
    const actionIdx = existingActions.findIndex((a) => a.id === actionId);
    const actionRecord = {
      id: actionId,
      riskId: selectedRisk.id,
      kodeRisiko: selectedRisk.kodeRisiko,
      tanggalPelaksanaan: new Date().toISOString().slice(0, 10),
      picPelaksana: selectedRisk.picPelaksana || 'PIC Pelaksana',
      uraianTindakan: realisasiKegiatan.trim() || `Pelaksanaan mitigasi ${triwulan}: capaian fisik ${progressPersen}%.`,
      progressPersen: Number(progressPersen),
      statusPelaksanaan: executionStatus as any,
      realisasiBiaya: Number(realisasiBiaya) || 0,
      efektivitas: (progressPersen >= 80 ? 'Efektif' : progressPersen >= 50 ? 'Cukup Efektif' : 'Kurang Efektif') as any,
      kendalaDanHambatan: kendala || '-',
      tindakLanjut: kendala ? `Tindak lanjut: ${kendala}` : 'Pemantauan berkala',
      nomorBuktiDokumen: `DOC/PUSRI/${selectedRisk.kodeRisiko}/${triwulan.replace(/\s+/g, '')}`,
      catatanAdmin: `Input via Pengendalian Triwulan (${triwulan})`,
      diperbaruiOleh: 'PIC Pelaksana',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (actionIdx >= 0) {
      existingActions[actionIdx] = { ...existingActions[actionIdx], ...actionRecord };
    } else {
      existingActions.unshift(actionRecord);
    }

    try {
      const updated = await PusriApiClient.updateRisk(
        selectedRisk.id,
        {
          pengendalianTriwulan: updatedList,
          pelaksanaanTindakan: existingActions,
          progressPelaksanaanTerakhir: Number(progressPersen),
          statusPelaksanaanTerakhir: executionStatus as any,
          currentTingkatRisiko: tingkatResidual,
          statusWorkflow: selectedRisk.statusWorkflow === 'Carry_Over' ? 'Carry_Over' : (isFinished ? 'Selesai' : selectedRisk.statusWorkflow)
        },
        'PIC Pelaksana',
        'risk officer'
      );
      if (updated) {
        onRiskUpdated(updated);
        setSelectedRisk(updated);
        setRealisasiKegiatan('');
        setKendala('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#009fe3] to-[#0284c7] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-200" />
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Monitoring & Evaluasi Triwulan 
              </h3>
              <p className="text-xs text-sky-100 mt-0.5">
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Left: Risk selection */}
          <div className="md:col-span-1 border-r border-slate-200 pr-4 space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between mb-2">
              <span>Risiko Terdaftar ({activeRisks.length})</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono">
                TW Active
              </span>
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {activeRisks.map((risk) => {
                const isSelected = selectedRisk?.id === risk.id;
                const controlsCount = risk.pengendalianTriwulan?.length || 0;
                const isDone = risk.statusWorkflow === 'Selesai' || risk.currentTingkatRisiko === 'Low';
                return (
                  <div
                    key={risk.id}
                    onClick={() => setSelectedRisk(risk)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#009fe3] bg-sky-50/60 ring-2 ring-sky-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                      <span>{risk.kodeRisiko}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDone ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'}`}>
                        {isDone ? 'Selesai' : `${controlsCount} TW Update`}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700 mt-1 line-clamp-1">
                      {risk.namaOrganisasi}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                      {risk.pernyataanRisiko}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: History & Form */}
          <div className="md:col-span-2 space-y-4">
            {selectedRisk ? (
              <>
                {/* Risk summary banner */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{selectedRisk.kodeRisiko}</span>
                    <p className="text-[11px] text-slate-600 font-medium">{selectedRisk.pernyataanRisiko}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PIC Pelaksana: {selectedRisk.picPelaksana || '-'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 block">Tingkat Saat Ini</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded ${
                      selectedRisk.currentTingkatRisiko === 'Low' || selectedRisk.currentTingkatRisiko === 'Low to Mod'
                        ? 'bg-sky-100 text-sky-800'
                        : selectedRisk.currentTingkatRisiko === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : selectedRisk.currentTingkatRisiko === 'Mod to High'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedRisk.currentTingkatRisiko}
                    </span>
                  </div>
                </div>

                {/* Historical Quarterly Controls */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#009fe3]" />
                    <span>Riwayat Realisasi Pemantauan Triwulanan:</span>
                  </h4>

                  {(!selectedRisk.pengendalianTriwulan || selectedRisk.pengendalianTriwulan.length === 0) ? (
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                      Belum ada laporan triwulan yang diinput. Silakan input melalui formulir di bawah.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedRisk.pengendalianTriwulan.map((ctrl, i) => (
                        <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                              {ctrl.triwulan}
                            </span>
                            <span className="text-slate-600 text-[11px]">
                              Progress: <strong className="text-slate-900">{ctrl.progressPersen}%</strong> ({ctrl.statusPengendalian})
                            </span>
                            <span className="text-slate-600 text-[11px]">
                              Serapan: <strong>Rp {ctrl.realisasiBiaya.toLocaleString('id-ID')}</strong>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Residual: L{ctrl.kemungkinanResidual}×D{ctrl.dampakResidual} ({ctrl.tingkatResidual})
                            </span>
                          </div>
                          <p className="text-slate-800 text-[11px] pt-1">{ctrl.realisasiKegiatan}</p>
                          {ctrl.kendalaDanTindakLanjut && (
                            <p className="text-[10px] text-amber-700 bg-amber-50/60 p-1.5 rounded">
                              Kendala: {ctrl.kendalaDanTindakLanjut}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Warning if selected TW is locked */}
                {isCurrentTwLocked && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        Triwulan {triwulan} Terkunci (Risiko Telah Selesai)
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Risiko ini telah mencapai status <strong>Selesai / Low Risk</strong> pada pemantauan <strong>{finishedTw?.triwulan}</strong>. Sesuai ketentuan SOP Enterprise Risk Management PT Pupuk Sriwidjaja Palembang, pemantauan triwulan selanjutnya ({triwulan}) tidak dapat diinput lagi dikarenakan risiko sudah selesai.
                      </p>
                    </div>
                  </div>
                )}

                {/* Form to submit new quarterly progress */}
                <form onSubmit={handleAddQuarterly} className={`p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 ${isCurrentTwLocked ? 'opacity-60' : ''}`}>
                  <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-[#009fe3]" />
                      <span>Input Pemantauan Triwulan:</span>
                    </div>
                    {isCurrentTwLocked && (
                      <span className="text-[10px] text-amber-700 font-mono font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Input Dikunci
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Triwulan</label>
                      <select
                        value={triwulan}
                        onChange={(e) => setTriwulan(e.target.value as any)}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-[#009fe3] focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all cursor-pointer"
                      >
                        {TW_SEQUENCE.map((tw) => {
                          const locked = isQuarterLocked(selectedRisk, tw);
                          const isFinished = finishedTw?.triwulan === tw;
                          return (
                            <option key={tw} value={tw}>
                              {tw} {isFinished ? '(Selesai - Low Risk)' : locked ? '(Terkunci - Risiko Selesai)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Progress Fisik (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={isCurrentTwLocked}
                        value={progressPersen}
                        onChange={(e) => setProgressPersen(Number(e.target.value))}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Status Lapangan</label>
                      <select
                        value={statusPengendalian}
                        disabled={isCurrentTwLocked}
                        onChange={(e) => setStatusPengendalian(e.target.value as any)}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-[#009fe3] focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        <option value="On Track">On Track (Sesuai Jadwal)</option>
                        <option value="Delayed">Delayed (Terlambat)</option>
                        <option value="Completed">Completed (Tuntas / Low Risk)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Uraian Realisasi Tindakan Mitigasi *</label>
                    <textarea
                      rows={2}
                      required
                      disabled={isCurrentTwLocked}
                      value={realisasiKegiatan}
                      onChange={(e) => setRealisasiKegiatan(e.target.value)}
                      placeholder={isCurrentTwLocked ? "Triwulan ini telah terkunci karena risiko telah tuntas." : "Masukkan uraian realisasi tindakan mitigasi..."}
                      className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all resize-none leading-relaxed disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Serapan Biaya (Rp)</label>
                      <input
                        type="number"
                        disabled={isCurrentTwLocked}
                        value={realisasiBiaya}
                        onChange={(e) => setRealisasiBiaya(Number(e.target.value))}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Residual Kemungkinan (1-5)</span>
                        {isResidualLocked && <Lock className="w-3 h-3 text-slate-400" />}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        disabled={isResidualLocked}
                        value={kemungkinanResidual}
                        onChange={(e) => setKemungkinanResidual(Number(e.target.value))}
                        className={`w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all ${
                          isResidualLocked ? 'bg-slate-100 dark:bg-slate-900 cursor-not-allowed text-slate-500 opacity-75' : ''
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Residual Dampak (1-5)</span>
                        {isResidualLocked && <Lock className="w-3 h-3 text-slate-400" />}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        disabled={isResidualLocked}
                        value={dampakResidual}
                        onChange={(e) => setDampakResidual(Number(e.target.value))}
                        className={`w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all ${
                          isResidualLocked ? 'bg-slate-100 dark:bg-slate-900 cursor-not-allowed text-slate-500 opacity-75' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isTwAlreadyInputted && !isCurrentTwLocked && (
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[10px] text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        <strong>Nilai Residual Terkunci:</strong> Skor residual {triwulan} (K={existingTw?.kemungkinanResidual} × D={existingTw?.dampakResidual} = {(existingTw?.kemungkinanResidual || 1) * (existingTw?.dampakResidual || 1)} / {existingTw?.tingkatResidual}) telah terekam sebelumnya dan tidak dapat diubah lagi.
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting || isCurrentTwLocked}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all ${
                        isCurrentTwLocked
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'text-white bg-[#009fe3] hover:bg-[#0284c7] cursor-pointer'
                      }`}
                    >
                        {isCurrentTwLocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Terkunci (Risiko Selesai)</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pemantauan TW'}</span>
                          </>
                        )}
                      </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400">
                Pilih risiko di sebelah kiri untuk monitoring pengendalian.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
