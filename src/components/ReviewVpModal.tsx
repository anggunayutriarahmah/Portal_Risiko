import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight, UserCheck, Calculator, Edit2 } from 'lucide-react';
import { PusriRisk, UserRole } from '../types/pusri';
import { PusriApiClient } from '../services/api';
import { getMasterRiskLevel } from '../utils/riskMatrix';

interface ReviewVpModalProps {
  isOpen: boolean;
  onClose: () => void;
  risks: PusriRisk[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
}

export const ReviewVpModal: React.FC<ReviewVpModalProps> = ({
  isOpen,
  onClose,
  risks,
  onRiskUpdated
}) => {
  const pendingRisks = risks.filter((r) => r.statusWorkflow === 'Menunggu_Approval_VP');
  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(pendingRisks[0] || null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!selectedRisk) return;
    const completesAtVp = selectedRisk.jenisPenanganan !== 'Mitigasi';
    setIsProcessing(true);
    try {
      const updated = await PusriApiClient.submitVpDecision(
        selectedRisk.id,
        'approve',
        reviewNotes || selectedRisk.reviewNotesVp || (completesAtVp
          ? `Telah direview dan disetujui oleh Atasan / VP (Strategi ${selectedRisk.jenisPenanganan} — selesai di tingkat Atasan / VP).`
          : 'Telah disetujui oleh Atasan / VP dan diteruskan ke Risk Admin.'),
        '',
        '',
        'M DAVI RAMADHAN',
        'risk owner'
      );
      if (updated) {
        onRiskUpdated(updated);
        setSelectedRisk(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedRisk) return;
    setIsProcessing(true);
    try {
      const updated = await PusriApiClient.submitVpDecision(
        selectedRisk.id,
        'revisi',
        reviewNotes || 'Mohon perbaiki uraian identifikasi risiko sesuai arahan Atasan / VP.',
        '',
        '',
        'M DAVI RAMADHAN',
        'risk owner'
      );
      if (updated) {
        onRiskUpdated(updated);
        setSelectedRisk(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-5 py-3.5 bg-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-200" />
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Review & Approval Atasan / VP Unit Kerja
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Tahap 8 SOP Pusri: Validasi usulan risiko unit kerja sebelum diajukan ke Risk Admin Korporat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Left list: Pending reviews */}
          <div className="md:col-span-1 border-r border-slate-200 pr-4 space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between mb-2">
              <span>Menunggu Review ({pendingRisks.length})</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                VP Queue
              </span>
            </div>

            {pendingRisks.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-50 text-slate-400 text-center">
                Semua usulan risiko unit kerja telah direview.
              </div>
            ) : (
              pendingRisks.map((risk) => {
                const isSelected = selectedRisk?.id === risk.id;
                return (
                  <div
                    key={risk.id}
                    onClick={() => setSelectedRisk(risk)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                      <span>{risk.kodeRisiko}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                        {risk.kategoriRisiko}
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
              })
            )}
          </div>

          {/* Right side: Selected Risk Details & Actions */}
          <div className="md:col-span-2 space-y-3.5">
            {selectedRisk ? (
              <>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {selectedRisk.kodeRisiko}
                      </span>
                      <p className="text-slate-500 text-[11px]">
                        Unit: {selectedRisk.namaOrganisasi} ({selectedRisk.kodeOrganisasi})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Skor Matriks Inherent</span>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200 inline-block mt-0.5">
                        L{selectedRisk.kemungkinanAwal} × D{selectedRisk.dampakAwal} = {selectedRisk.inherentScore || (selectedRisk.kemungkinanAwal * selectedRisk.dampakAwal)} ({selectedRisk.tingkatRisikoAwal || getMasterRiskLevel(selectedRisk.kemungkinanAwal, selectedRisk.dampakAwal)})
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">Pernyataan Risiko:</span>
                    <p className="text-slate-900 font-medium mt-0.5">{selectedRisk.pernyataanRisiko}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-700">Akar Penyebab:</span>
                      <p className="text-slate-600">{selectedRisk.penyebabRisiko}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Dampak:</span>
                      <p className="text-slate-600">{selectedRisk.dampakRisiko}</p>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">Rencana Mitigasi & Anggaran:</span>
                    <p className="text-slate-900 mt-0.5">{selectedRisk.rencanaPenanganan || '-'}</p>
                    <div className="flex gap-4 mt-1 text-[11px] text-slate-600">
                      <span>Estimasi: <strong>Rp {selectedRisk.biayaRencanaPengendalian.toLocaleString('id-ID')}</strong></span>
                      <span>Target: <strong>{selectedRisk.targetWaktuMitigasi}</strong></span>
                      <span>Jenis: <strong>{selectedRisk.jenisAnggaran}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Review Notes */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan / Rekomendasi VP Unit:
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder=""
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleRequestRevision}
                    disabled={isProcessing}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kembalikan untuk Revisi</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isProcessing
                        ? 'Memproses...'
                        : selectedRisk.jenisPenanganan !== 'Mitigasi'
                          ? 'Setujui (Selesai di Atasan / VP)'
                          : 'Setujui & Teruskan ke Admin Risk'}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400">
                Pilih risiko di sebelah kiri untuk menelaah dan menyetujui.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
