import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  DollarSign, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  Save,
  Check,
  UserCheck,
  Building2,
  Lock
} from 'lucide-react';
import { PusriRisk, UserRole, RiskCategory, RiskHandlingStrategy, RiskLevel, SumberRisikoGroup } from '../types/pusri';
import { PusriApiClient } from '../services/api';
import { getMasterRiskLevel } from '../utils/riskMatrix';
import { RiskLikelihoodConsequenceTable, LIKELIHOOD_OPTIONS, CONSEQUENCE_OPTIONS } from './RiskLikelihoodConsequenceTable';
import { KRITERIA_DAMPAK_RISIKO_DATA } from '../data/kriteriaDampakData';
import { MASTER_SUMBER_RISIKO_DATA } from '../data/sumberRisikoData';

interface RiskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk: PusriRisk | null;
  currentRole: UserRole;
  sumberRisikoGroups?: SumberRisikoGroup[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onRiskDeleted: (id: string) => void;
  onOpenUpdateModal?: (risk: PusriRisk) => void;
}

export const RiskDetailModal: React.FC<RiskDetailModalProps> = ({
  isOpen,
  onClose,
  risk,
  currentRole,
  sumberRisikoGroups = MASTER_SUMBER_RISIKO_DATA,
  onRiskUpdated,
  onRiskDeleted,
  onOpenUpdateModal
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const canEditRisk = currentRole !== 'risk admin';

  // Editable fields state
  const [sasaranRKAP, setSasaranRKAP] = useState('');
  const [sasaranUnitKerja, setSasaranUnitKerja] = useState('');
  const [konteksEksternal, setKonteksEksternal] = useState('');
  const [konteksInternal, setKonteksInternal] = useState('');
  const [sumberRisiko, setSumberRisiko] = useState('');
  const [bidangFungsiRisiko, setBidangFungsiRisiko] = useState('');
  const [subBidangRisiko, setSubBidangRisiko] = useState('');
  const [bidangProyek, setBidangProyek] = useState('');
  const [pernyataanRisiko, setPernyataanRisiko] = useState('');
  const [penyebabRisiko, setPenyebabRisiko] = useState('');
  const [dampakRisiko, setDampakRisiko] = useState('');
  const [pengendalianExisting, setPengendalianExisting] = useState('');
  const [kemungkinanAwal, setKemungkinanAwal] = useState(3);
  const [dampakAwal, setDampakAwal] = useState(3);
  const [jenisPenanganan, setJenisPenanganan] = useState<RiskHandlingStrategy>('Mitigasi');
  const [rencanaPenanganan, setRencanaPenanganan] = useState('');
  const [targetWaktuMitigasi, setTargetWaktuMitigasi] = useState('TW 2');
  const [biayaRencanaPengendalian, setBiayaRencanaPengendalian] = useState(0);
  const [picPelaksana, setPicPelaksana] = useState('');
  const [picPengendali, setPicPengendali] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state with risk prop
  useEffect(() => {
    if (risk) {
      setSasaranRKAP(risk.sasaranRKAP || '');
      setSasaranUnitKerja(risk.sasaranUnitKerja || '');
      setKonteksEksternal(risk.konteksEksternal || '');
      setKonteksInternal(risk.konteksInternal || '');
      setSumberRisiko(risk.sumberRisiko || '');
      setBidangFungsiRisiko(risk.bidangFungsiRisiko || risk.kategoriRisiko || 'Operasional');
      setSubBidangRisiko(risk.subBidangRisiko || '');
      setBidangProyek(risk.bidangProyek || '');
      setPernyataanRisiko(risk.pernyataanRisiko || '');
      setPenyebabRisiko(risk.penyebabRisiko || '');
      setDampakRisiko(risk.dampakRisiko || '');
      setPengendalianExisting(risk.pengendalianExisting || '');
      setKemungkinanAwal(risk.kemungkinanAwal || 3);
      setDampakAwal(risk.dampakAwal || 3);
      setJenisPenanganan(risk.jenisPenanganan || 'Mitigasi');
      setRencanaPenanganan(risk.rencanaPenanganan || '');
      setTargetWaktuMitigasi(risk.targetWaktuMitigasi || 'TW 2');
      setBiayaRencanaPengendalian(risk.biayaRencanaPengendalian || 0);
      setPicPelaksana(risk.picPelaksana || '');
      setPicPengendali(risk.picPengendali || '');
      setIsEditing(false);
      setSaveSuccess(false);
      setConfirmDelete(false);
      setModalFeedback(null);
    }
  }, [risk]);

  if (!isOpen || !risk) return null;

  // Inherent calculation directly from Master Data 5x5 Matrix
  const inherentScore = kemungkinanAwal * dampakAwal;
  const currentLevel = getMasterRiskLevel(kemungkinanAwal, dampakAwal);

  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    setModalFeedback(null);
    try {
      await PusriApiClient.deleteRisk(risk.id, currentRole);
      onRiskDeleted(risk.id);
      onClose();
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err?.message || 'Gagal menghapus risiko dari database.' });
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    setModalFeedback(null);
    try {
      const updated = await PusriApiClient.updateRisk(
        risk.id,
        {
          sasaranRKAP: sasaranRKAP.trim(),
          sasaranUnitKerja: sasaranUnitKerja.trim(),
          konteksEksternal: konteksEksternal.trim(),
          konteksInternal: konteksInternal.trim(),
          sumberRisiko: sumberRisiko.trim(),
          bidangFungsiRisiko: bidangFungsiRisiko.trim() || 'Operasional',
          kategoriRisiko: (bidangFungsiRisiko.trim() as RiskCategory) || risk.kategoriRisiko || 'Operasional',
          subBidangRisiko: subBidangRisiko.trim(),
          bidangProyek: bidangProyek.trim(),
          pernyataanRisiko: pernyataanRisiko.trim(),
          penyebabRisiko: penyebabRisiko.trim(),
          dampakRisiko: dampakRisiko.trim(),
          pengendalianExisting: pengendalianExisting.trim(),
          kemungkinanAwal,
          dampakAwal,
          inherentScore,
          tingkatRisikoAwal: currentLevel,
          currentTingkatRisiko: currentLevel,
          jenisPenanganan,
          rencanaPenanganan: rencanaPenanganan.trim(),
          targetWaktuMitigasi,
          biayaRencanaPengendalian: Number(biayaRencanaPengendalian) || 0,
          picPelaksana: picPelaksana.trim(),
          picPengendali: picPengendali.trim()
        },
        `${currentRole} - Risk Editor`,
        currentRole
      );

      if (updated) {
        onRiskUpdated(updated);
        setSaveSuccess(true);
        setIsEditing(false);
        setModalFeedback({ type: 'success', text: `Perubahan data risiko [${updated.kodeRisiko}] berhasil disimpan.` });
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err?.message || 'Gagal menyimpan perubahan risiko.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResubmitToVp = async () => {
    setIsSaving(true);
    setModalFeedback(null);
    try {
      const updated = await PusriApiClient.updateRisk(
        risk.id,
        {
          sasaranRKAP: sasaranRKAP.trim(),
          sasaranUnitKerja: sasaranUnitKerja.trim(),
          konteksEksternal: konteksEksternal.trim(),
          konteksInternal: konteksInternal.trim(),
          sumberRisiko: sumberRisiko.trim(),
          bidangFungsiRisiko: bidangFungsiRisiko.trim() || 'Operasional',
          kategoriRisiko: (bidangFungsiRisiko.trim() as RiskCategory) || risk.kategoriRisiko || 'Operasional',
          subBidangRisiko: subBidangRisiko.trim(),
          bidangProyek: bidangProyek.trim(),
          pernyataanRisiko: pernyataanRisiko.trim(),
          penyebabRisiko: penyebabRisiko.trim(),
          dampakRisiko: dampakRisiko.trim(),
          pengendalianExisting: pengendalianExisting.trim(),
          kemungkinanAwal,
          dampakAwal,
          inherentScore,
          tingkatRisikoAwal: currentLevel,
          currentTingkatRisiko: currentLevel,
          jenisPenanganan,
          rencanaPenanganan: rencanaPenanganan.trim(),
          targetWaktuMitigasi,
          biayaRencanaPengendalian: Number(biayaRencanaPengendalian) || 0,
          picPelaksana: picPelaksana.trim(),
          picPengendali: picPengendali.trim(),
          statusWorkflow: 'Menunggu_Approval_VP'
        },
        `${currentRole} - Resubmit Revisi ke VP`,
        currentRole
      );

      if (updated) {
        onRiskUpdated(updated);
        setSaveSuccess(true);
        setIsEditing(false);
        setModalFeedback({ type: 'success', text: `Risiko [${risk.kodeRisiko}] berhasil diperbaiki dan diajukan ulang ke antrean Review Atasan / VP!` });
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err?.message || 'Gagal mengirim ulang usulan revisi ke VP.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl lg:max-w-5xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-8 text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header - Matching Detail Informasi design */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-100 tracking-tight">
              Detail Informasi
            </h3>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {risk.kodeRisiko} • {risk.namaOrganisasi} ({risk.tahun})
            </span>
            {risk.statusWorkflow === 'Revisi' && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-white font-bold font-mono">
                (revisi)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save success banner */}
        {saveSuccess && (
          <div className="bg-sky-50 dark:bg-sky-950/80 border-b border-sky-200 dark:border-sky-800 px-6 py-2.5 text-xs text-sky-800 dark:text-sky-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#009fe3] dark:text-sky-400" />
            <span>Perubahan risiko berhasil disimpan dan disinkronkan ke basis data.</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs max-h-[78vh] overflow-y-auto">
          {/* Status Revisi Alert Banner */}
          {risk.statusWorkflow === 'Revisi' && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Perlu Perbaikan / Revisi Berdasarkan Catatan Atasan (VP):</span>
                </div>
                {!isEditing && canEditRisk && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Mulai Perbaiki</span>
                  </button>
                )}
              </div>
              <p className="text-xs italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900 text-slate-800 dark:text-slate-200 font-medium">
                "{risk.reviewNotesVp || risk.approvalNotesAdmin || 'Harap lengkapi dan perbaiki data risiko sesuai arahan SOP sebelum diajukan kembali.'}"
              </p>
              <div className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                <span>👉 Setelah memperbaiki form, klik tombol <strong>"Kirim Ulang ke VP / Atasan (Resubmit)"</strong> di bagian bawah modal.</span>
              </div>
            </div>
          )}

          {isEditing && canEditRisk ? (
            /* ================= EDIT MODE ================= */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between">
                <span className="font-semibold">Mode Edit Data Risiko: Ubah informasi dan klik Simpan Perubahan / Kirim Ulang.</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-amber-800 dark:text-amber-400 underline font-bold cursor-pointer"
                >
                  Batal Edit
                </button>
              </div>

              {/* Sasaran & Konteks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sasaran RKAP *
                  </label>
                  <input
                    type="text"
                    value={sasaranRKAP}
                    onChange={(e) => setSasaranRKAP(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#009fe3] outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sasaran Unit Kerja *
                  </label>
                  <input
                    type="text"
                    value={sasaranUnitKerja}
                    onChange={(e) => setSasaranUnitKerja(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#009fe3] outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Konteks Eksternal *
                  </label>
                  <input
                    type="text"
                    value={konteksEksternal}
                    onChange={(e) => setKonteksEksternal(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#009fe3] outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Konteks Internal *
                  </label>
                  <input
                    type="text"
                    value={konteksInternal}
                    onChange={(e) => setKonteksInternal(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#009fe3] outline-none text-xs"
                  />
                </div>
              </div>

              {/* Bidang, Sub Bidang, Bidang Proyek, Sumber */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bidang
                  </label>
                  <select
                    value={bidangFungsiRisiko}
                    onChange={(e) => setBidangFungsiRisiko(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="Strategis">Strategis</option>
                    <option value="Hukum & Kepatuhan">Hukum & Kepatuhan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sub Bidang
                  </label>
                  <input
                    type="text"
                    value={subBidangRisiko}
                    onChange={(e) => setSubBidangRisiko(e.target.value)}
                    placeholder="-"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bidang Proyek
                  </label>
                  <input
                    type="text"
                    value={bidangProyek}
                    onChange={(e) => setBidangProyek(e.target.value)}
                    placeholder="-"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Sumber Risiko *
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <Lock className="w-2.5 h-2.5" /> Master Admin
                    </span>
                  </div>
                  <select
                    value={sumberRisiko}
                    onChange={(e) => setSumberRisiko(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  >
                    <option value="">-- Pilih Sumber Risiko (By Data) --</option>
                    {sumberRisiko &&
                      !sumberRisikoGroups.some((g) => g.items.includes(sumberRisiko)) && (
                        <optgroup label="Data Tersimpan">
                          <option value={sumberRisiko}>{sumberRisiko}</option>
                        </optgroup>
                      )}
                    {sumberRisikoGroups.map((group) => (
                      <optgroup key={group.kategori} label={group.kategori}>
                        {group.items.map((item) => (
                          <option key={`${group.kategori}-${item}`} value={item}>
                            {item}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pernyataan Risiko */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Risiko (Risk Event) *
                </label>
                <textarea
                  value={pernyataanRisiko}
                  onChange={(e) => setPernyataanRisiko(e.target.value)}
                  placeholder=""
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#009fe3] dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs resize-none leading-relaxed text-xs"
                />
              </div>

              {/* Akar Penyebab & Dampak */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Penyebab *
                  </label>
                  <textarea
                    value={penyebabRisiko}
                    onChange={(e) => setPenyebabRisiko(e.target.value)}
                    placeholder=""
                    rows={2}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#009fe3] dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs resize-none leading-relaxed text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Dampak *
                  </label>
                  <textarea
                    value={dampakRisiko}
                    onChange={(e) => setDampakRisiko(e.target.value)}
                    placeholder=""
                    rows={2}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#009fe3] dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs resize-none leading-relaxed text-xs"
                  />
                </div>
              </div>

              {/* Pengendalian Existing */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Existing Control
                </label>
                <input
                  type="text"
                  value={pengendalianExisting}
                  onChange={(e) => setPengendalianExisting(e.target.value)}
                  placeholder=""
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#009fe3] dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs text-xs"
                />
              </div>

              {/* Kemungkinan & Dampak Matriks (Terbuka untuk Risk Owner) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Penilaian Matriks Risiko Awal (Inherent Risk)
                  </span>
                  {currentRole === 'risk owner' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      ✓ Akses Edit Aktif ({currentRole})
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Terkunci (Hanya Risk Owner)
                    </span>
                  )}
                </div>
                <RiskLikelihoodConsequenceTable
                  likelihood={kemungkinanAwal}
                  consequence={dampakAwal}
                  onChangeLikelihood={setKemungkinanAwal}
                  onChangeConsequence={setDampakAwal}
                  disabled={currentRole !== 'risk owner'}
                  showScoreSummary={true}
                  namePrefix="detail_modal_edit"
                />
              </div>

              {/* Rencana Penanganan / Mitigasi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rencana Langkah Mitigasi / Penanganan *
                </label>
                <textarea
                  value={rencanaPenanganan}
                  onChange={(e) => setRencanaPenanganan(e.target.value)}
                  placeholder=""
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed text-xs"
                />
              </div>

              {/* Target & Anggaran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Strategi Penanganan
                  </label>
                  <select
                    value={jenisPenanganan}
                    onChange={(e) => setJenisPenanganan(e.target.value as any)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs cursor-pointer text-xs"
                  >
                    <option value="Mitigasi">Mitigasi</option>
                    <option value="Diterima">Diterima</option>
                    <option value="Dihindari">Dihindari</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Waktu Mitigasi
                  </label>
                  <select
                    value={targetWaktuMitigasi}
                    onChange={(e) => setTargetWaktuMitigasi(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs cursor-pointer text-xs"
                  >
                    <option value="TW 1">TW 1 (Jan - Mar)</option>
                    <option value="TW 2">TW 2 (Apr - Jun)</option>
                    <option value="TW 3">TW 3 (Jul - Sep)</option>
                    <option value="TW 4">TW 4 (Okt - Des)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Biaya Rencana (Rp)
                  </label>
                  <input
                    type="number"
                    value={biayaRencanaPengendalian}
                    onChange={(e) => setBiayaRencanaPengendalian(Number(e.target.value))}
                    placeholder=""
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ================= VIEW MODE: DETAIL INFORMASI (Sesuai Desain Gambar) ================= */
            <div className="space-y-4 text-[13px]">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Sasaran RKAP</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.sasaranRKAP || '-'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Sasaran Unit Kerja</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.sasaranUnitKerja || '-'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Konteks Eksternal</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.konteksEksternal || '-'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Konteks Internal</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.konteksInternal || '-'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Risiko</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.pernyataanRisiko || '-'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Bidang</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.bidangFungsiRisiko || risk.kategoriRisiko || '-'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Sub Bidang</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.subBidangRisiko || '-'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Bidang Proyek</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.bidangProyek || '-'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Sumber</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.sumberRisiko || '-'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Penyebab</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.penyebabRisiko || '-'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Dampak</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.dampakRisiko || '-'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Existing Control</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                  {risk.pengendalianExisting || '-'}
                </p>
              </div>

              {/* Informasi Matriks & Rencana Pengendalian */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 block">Penilaian Risiko Awal (Inherent Risk)</span>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                    Kemungkinan (K): Level {risk.kemungkinanAwal} • Dampak (D): Level {risk.dampakAwal} • Skor: {risk.inherentScore || (risk.kemungkinanAwal * risk.dampakAwal)} ({risk.tingkatRisikoAwal || risk.currentTingkatRisiko})
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 block">Strategi & Rencana Pengendalian</span>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                    [{risk.jenisPenanganan || 'Mitigasi'}] {risk.rencanaPengendalian || risk.rencanaPenanganan || '-'}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 block">Target Waktu & Anggaran</span>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                    {risk.targetWaktuMitigasi || '-'} • Rp {(risk.biayaRencanaPengendalian || 0).toLocaleString('id-ID')} ({risk.jenisAnggaran || (risk.biayaRencanaPengendalian > 0 ? 'Investasi Rutin' : 'Non-Anggaran')})
                  </p>
                </div>

                {currentRole !== 'risk owner' && risk.statusWorkflow !== 'Menunggu_Approval_VP' && (risk.picPelaksana || risk.picPengendali) && (
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">PIC Pelaksana & PIC Pengendali</span>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      PIC Pelaksana: {risk.picPelaksana || '-'} • PIC Pengendali: {risk.picPengendali || '-'}
                    </p>
                  </div>
                )}

                {risk.reviewNotesVp && (
                  <div>
                    <span className="font-bold text-amber-700 dark:text-amber-400 block">Catatan Review Atasan / VP</span>
                    <p className="text-amber-600 dark:text-amber-300 leading-relaxed mt-0.5">
                      {risk.reviewNotesVp}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quarterly Monitoring Logs */}
          {risk.pengendalianTriwulan && risk.pengendalianTriwulan.length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                Histori Pengendalian Triwulan (TW 1 - TW 4):
              </span>
              <div className="space-y-2">
                {/* Penentuan PIC Awal dari Approval Admin (Dihilangkan pada tahap Review Risk Owner VP) */}
                {currentRole !== 'risk owner' && risk.statusWorkflow !== 'Menunggu_Approval_VP' && (risk.picPelaksana || risk.picPengendali || risk.approvalNotesAdmin) && (
                  <div className="p-3 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 text-xs space-y-1">
                    <span className="font-bold text-sky-950 dark:text-sky-200 text-[11px] block">
                      Hasil Penentuan PIC Awal (Approval Admin):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-0.5">
                      <div>PIC Pelaksana: <strong>{risk.picPelaksana || '-'}</strong></div>
                      <div>PIC Pengendali: <strong>{risk.picPengendali || '-'}</strong></div>
                    </div>
                    {risk.approvalNotesAdmin && (
                      <div className="italic text-slate-600 dark:text-slate-300 text-[10px] pt-0.5">
                        Arahan: "{risk.approvalNotesAdmin}"
                      </div>
                    )}
                  </div>
                )}

                {risk.pengendalianTriwulan.map((tw, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-950/70 text-amber-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800 text-[10px] font-bold">
                          {tw.triwulan}
                        </span>
                        {tw.isPicAcc ? (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[9px]">
                            ACC Admin
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-yellow-200 font-bold text-[9px]">
                            Menunggu ACC
                          </span>
                        )}
                        {tw.statusKeputusan && (
                          <span className="px-2 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950 text-[#009fe3] dark:text-sky-300 font-bold text-[9px]">
                            {tw.statusKeputusan === 'Pengendalian_Lanjutan' ? `Lanjut: ${tw.targetWaktuLanjutan || 'TW Lanjutan'}` : tw.statusKeputusan}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">Progress: {tw.progressPersen}% ({tw.statusPengendalian})</span>
                      <span className="text-slate-700 dark:text-slate-300">Residual: L{tw.kemungkinanResidual}×D{tw.dampakResidual} ({tw.tingkatResidual})</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px]">{tw.realisasiKegiatan}</p>
                    
                    {/* Hasil Penentuan PIC & Arahan */}
                    <div className="p-2 rounded bg-amber-50/70 dark:bg-yellow-950/40 border border-amber-200/80 dark:border-yellow-900 text-[11px] space-y-1">
                      <span className="font-bold text-amber-900 dark:text-yellow-200 text-[10px] block">
                        Hasil Penentuan PIC & Arahan ({tw.triwulan}):
                      </span>
                      <div className="text-slate-800 dark:text-slate-200">
                        • PIC Pelaksana: <strong>{tw.picPelaksanaBaru || risk.picPelaksana || 'PIC Unit'}</strong>
                      </div>
                      <div className="text-slate-800 dark:text-slate-200">
                        • PIC Pengendali: <strong>{tw.picPengendaliBaru || risk.picPengendali || 'VP Terkait'}</strong>
                      </div>
                      {(tw.pengendalianLanjutanDesc || tw.catatanAdminAcc || risk.approvalNotesAdmin) && (
                        <div className="italic text-slate-600 dark:text-slate-300 pt-0.5">
                          "{tw.pengendalianLanjutanDesc || tw.catatanAdminAcc || (tw.triwulan === 'TW 1' ? risk.approvalNotesAdmin : undefined) || 'Pengendalian berjalan sesuai arahan'}"
                        </div>
                      )}
                      {tw.accBy && (
                        <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                          Di-ACC oleh: {tw.accBy} {tw.accDate ? `(${new Date(tw.accDate).toLocaleDateString('id-ID')})` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Realisasi Pelaksanaan Tindakan Pengendalian (PIC & Admin) */}
          {risk.pelaksanaanTindakan && risk.pelaksanaanTindakan.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Histori Pelaksanaan Tindakan Pengendalian oleh PIC ({risk.pelaksanaanTindakan.length} Catatan):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Tersimpan di Database</span>
              </div>
              <div className="space-y-2">
                {risk.pelaksanaanTindakan.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl border border-sky-200/70 dark:border-sky-800/70 bg-sky-50/40 dark:bg-sky-950/20 text-xs space-y-2">
                    <div className="flex items-center justify-between font-semibold flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded bg-[#009fe3] text-white text-[10px] font-mono font-bold">
                        {act.id} • {act.tanggalPelaksanaan}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                        PIC: <strong className="text-slate-900 dark:text-slate-100">{act.picPelaksana}</strong>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        act.statusPelaksanaan === 'Selesai Dilaksanakan' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                          : act.statusPelaksanaan === 'Sedang Berjalan'
                          ? 'bg-sky-100 text-[#009fe3] dark:bg-sky-900/60 dark:text-sky-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                      }`}>
                        {act.statusPelaksanaan} ({act.progressPersen}%)
                      </span>
                    </div>

                    <p className="text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                      {act.uraianTindakan}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-600 dark:text-slate-400 pt-1">
                      <div>
                        <span>Realisasi Biaya: </span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                          Rp {(act.realisasiBiaya || 0).toLocaleString('id-ID')}
                        </strong>
                      </div>
                      <div>
                        <span>Efektivitas: </span>
                        <strong className="text-slate-800 dark:text-slate-200">{act.efektivitas}</strong>
                      </div>
                      <div>
                        <span>Bukti Dokumen: </span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200">{act.nomorBuktiDokumen || '-'}</strong>
                      </div>
                    </div>

                    {act.kendalaDanHambatan && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 italic">
                        Kendala: {act.kendalaDanHambatan}
                      </p>
                    )}

                    {act.catatanAdmin && (
                      <p className="text-[10px] text-amber-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/40 p-1.5 rounded border border-yellow-200 dark:border-yellow-800">
                        Catatan Admin: {act.catatanAdmin}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Banner */}
          {modalFeedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
              modalFeedback.type === 'success'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              <span>{modalFeedback.text}</span>
              <button
                type="button"
                onClick={() => setModalFeedback(null)}
                className="font-bold hover:underline cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            {currentRole === 'risk admin' && (
              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-2 p-1.5 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-xl">
                    <span className="text-[11px] font-bold text-red-700 dark:text-red-300">
                      Hapus risiko {risk.kodeRisiko}?
                    </span>
                    <button
                      type="button"
                      onClick={handleExecuteDelete}
                      disabled={isDeleting}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={isDeleting}
                      className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Risiko</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {isEditing && canEditRisk ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  {canEditRisk && risk.statusWorkflow === 'Revisi' ? (
                    <button
                      type="button"
                      onClick={handleResubmitToVp}
                      disabled={isSaving}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#009fe3] hover:bg-[#0284c7] rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Mengirim...' : 'Kirim Ulang ke VP / Atasan (Resubmit)'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#009fe3] hover:bg-[#0284c7] rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5 text-yellow-300" />
                      <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {risk.statusWorkflow === 'Revisi' ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-[#009fe3] hover:bg-[#0284c7] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Perbaiki & Kirim Ulang ke VP</span>
                    </button>
                  ) : canEditRisk && currentRole !== 'risk officer' ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-2 text-xs font-bold text-sky-900 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-300 dark:border-sky-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#009fe3]" />
                      <span>Edit Data</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
