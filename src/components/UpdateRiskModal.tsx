import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Shield, 
  RotateCcw, 
  Save, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Clock, 
  DollarSign, 
  FileText,
  Calculator,
  Info,
  Lock,
  Database
} from 'lucide-react';
import { PusriRisk, UserRole, RiskCategory, RiskHandlingStrategy, RiskLevel, UserAccount, SumberRisikoGroup } from '../types/pusri';
import { PusriApiClient } from '../services/api';
import { getMasterRiskLevel, getMasterMitigationRequirement } from '../utils/riskMatrix';
import { RiskLikelihoodConsequenceTable } from './RiskLikelihoodConsequenceTable';
import { MASTER_SUMBER_RISIKO_DATA, flattenSumberRisikoGroups } from '../data/sumberRisikoData';
import { KriteriaDampakSection } from './KriteriaDampakSection';
import { KRITERIA_DAMPAK_RISIKO_DATA } from '../data/kriteriaDampakData';

interface UpdateRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk: PusriRisk | null;
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  sumberRisikoGroups?: SumberRisikoGroup[];
  onOpenMasterSumberRisiko?: () => void;
}

export const UpdateRiskModal: React.FC<UpdateRiskModalProps> = ({
  isOpen,
  onClose,
  risk,
  currentRole,
  currentUser,
  onRiskUpdated,
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
  // Form State
  const [sumberRisiko, setSumberRisiko] = useState('');
  const [pernyataanRisiko, setPernyataanRisiko] = useState('');
  const [penyebabRisiko, setPenyebabRisiko] = useState('');
  const [dampakRisiko, setDampakRisiko] = useState('');
  const [pengendalianExisting, setPengendalianExisting] = useState('');
  const [kategoriRisiko, setKategoriRisiko] = useState<RiskCategory>('Operasional');
  const [kemungkinanAwal, setKemungkinanAwal] = useState<number>(3);
  const [dampakAwal, setDampakAwal] = useState<number>(3);
  const [kriteriaDampakKey, setKriteriaDampakKey] = useState<string>('');
  const [kriteriaDampakTitle, setKriteriaDampakTitle] = useState<string>('');
  const [jenisPenanganan, setJenisPenanganan] = useState<RiskHandlingStrategy>('Mitigasi');
  const [rencanaPenanganan, setRencanaPenanganan] = useState('');
  const [targetWaktuMitigasi, setTargetWaktuMitigasi] = useState('TW 2');
  const [biayaRencanaPengendalian, setBiayaRencanaPengendalian] = useState<number>(0);
  const [catatanPerbaikan, setCatatanPerbaikan] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Synchronize form values whenever `risk` changes
  useEffect(() => {
    if (risk) {
      setSumberRisiko(risk.sumberRisiko || '');
      setPernyataanRisiko(risk.pernyataanRisiko || '');
      setPenyebabRisiko(risk.penyebabRisiko || '');
      setDampakRisiko(risk.dampakRisiko || '');
      setPengendalianExisting(risk.pengendalianExisting || '');
      setKategoriRisiko(risk.kategoriRisiko || 'Operasional');
      setKemungkinanAwal(risk.kemungkinanAwal || 3);
      setDampakAwal(risk.dampakAwal || 3);

      let initialKey = risk.kriteriaDampakKey || '';
      let initialTitle = risk.kriteriaDampakTitle || '';

      if (!initialKey) {
        if (initialTitle) {
          const cat = KRITERIA_DAMPAK_RISIKO_DATA.find(
            (c) => c.title.toLowerCase().trim() === initialTitle.toLowerCase().trim() || c.id.toLowerCase() === initialTitle.toLowerCase()
          );
          if (cat) {
            initialKey = `${cat.id}_${risk.dampakAwal || 3}`;
            initialTitle = cat.title;
          }
        } else if (risk.dampakRisiko) {
          for (const cat of KRITERIA_DAMPAK_RISIKO_DATA) {
            for (const item of cat.levels) {
              if (item.description.trim() === risk.dampakRisiko.trim() || 
                  (item.level === risk.dampakAwal && risk.dampakRisiko.toLowerCase().includes(item.description.slice(0, 30).toLowerCase()))) {
                initialKey = `${cat.id}_${item.level}`;
                initialTitle = cat.title;
                break;
              }
            }
            if (initialKey) break;
          }
        }
      }

      setKriteriaDampakKey(initialKey);
      setKriteriaDampakTitle(initialTitle);
      setJenisPenanganan(risk.jenisPenanganan || 'Mitigasi');
      setRencanaPenanganan(risk.rencanaPenanganan || '');
      setTargetWaktuMitigasi(risk.targetWaktuMitigasi || 'TW 2');
      setBiayaRencanaPengendalian(risk.biayaRencanaPengendalian || 0);
      setCatatanPerbaikan('');
      setSuccessMessage(null);
      setErrorMessage(null);
      setValidationErrors([]);
    }
  }, [risk, isOpen]);

  if (!isOpen || !risk) return null;

  // Real-time matrix calculation directly from Master Data 5x5 Matrix
  const inherentScore = kemungkinanAwal * dampakAwal;
  const currentLevel = getMasterRiskLevel(kemungkinanAwal, dampakAwal);
  const mitigationAssessment = getMasterMitigationRequirement(kemungkinanAwal, dampakAwal);
  const isMitigationRequired = mitigationAssessment.isRequired;

  // Authorization check
  const isFinished = risk.statusWorkflow === 'Selesai';
  const isRevisi =
    risk.statusWorkflow === 'Revisi' ||
    (risk.statusWorkflow as string) === 'revisi' ||
    risk.statusWorkflow === 'Draft_Unit';
  const isUnitKerja = currentRole === 'risk officer';
  const isVp = currentRole === 'risk owner';

  const userDept = currentUser?.unitKerja?.toLowerCase() || '';
  const userKode = currentUser?.kodeUnitKerja?.toLowerCase() || '';
  const riskDept = risk.namaOrganisasi?.toLowerCase() || '';
  const riskKode = risk.kodeOrganisasi?.toLowerCase() || '';

  const isMyDepartment = !userDept || !riskDept ||
    riskDept.includes(userDept) ||
    userDept.includes(riskDept) ||
    (userKode && riskKode === userKode);

  const canEdit = !isFinished && (isVp || isUnitKerja) && isMyDepartment;

  const validateForm = (): boolean => {
    const errs: string[] = [];

    if (!sumberRisiko.trim()) {
      errs.push('Sumber risiko wajib dipilih berdasarkan data master.');
    }
    if (!pernyataanRisiko.trim() || pernyataanRisiko.trim().length < 5) {
      errs.push('Pernyataan risiko wajib diisi dengan jelas (minimal 5 karakter).');
    }
    if (!penyebabRisiko.trim() || penyebabRisiko.trim().length < 3) {
      errs.push('Akar masalah / penyebab risiko wajib diisi.');
    }
    if (!dampakRisiko.trim() || dampakRisiko.trim().length < 3) {
      errs.push('Uraian dampak risiko wajib diisi.');
    }
    if (kemungkinanAwal < 1 || kemungkinanAwal > 5 || dampakAwal < 1 || dampakAwal > 5) {
      errs.push('Skala kemungkinan dan dampak harus dalam rentang 1 - 5.');
    }
    if (!rencanaPenanganan.trim()) {
      errs.push('Rencana / keterangan tindakan penanganan wajib diisi.');
    }

    setValidationErrors(errs);
    return errs.length === 0;
  };

  const handleSaveUpdate = async (resubmitToVp = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const actorName = currentUser?.nama || (isVp ? 'Vice President Departemen' : isUnitKerja ? 'Risk Officer Unit' : 'Risk Admin Korporat');
      
      const res = await PusriApiClient.updateRiskData(
        risk.id,
        {
          sumberRisiko: sumberRisiko.trim(),
          pernyataanRisiko: pernyataanRisiko.trim(),
          penyebabRisiko: penyebabRisiko.trim(),
          dampakRisiko: dampakRisiko.trim(),
          pengendalianExisting: pengendalianExisting.trim(),
          kategoriRisiko,
          kemungkinanAwal,
          dampakAwal,
          kriteriaDampakKey: kriteriaDampakKey || undefined,
          kriteriaDampakTitle: kriteriaDampakTitle || undefined,
          kriteriaDampakLevel: dampakAwal,
          inherentScore,
          tingkatRisikoAwal: currentLevel,
          currentTingkatRisiko: currentLevel,
          jenisPenanganan,
          rencanaPenanganan: rencanaPenanganan.trim(),
          targetWaktuMitigasi,
          biayaRencanaPengendalian: Number(biayaRencanaPengendalian) || 0,
          catatanPerbaikan: catatanPerbaikan.trim() || undefined,
          resubmit: resubmitToVp,
          userUnitKerja: currentUser?.unitKerja,
          userKodeUnitKerja: currentUser?.kodeUnitKerja,
          diperbaruiOleh: actorName,
          userProgres: actorName
        },
        currentRole,
        actorName
      );

      if (res.success && res.data) {
        onRiskUpdated(res.data);
        setSuccessMessage(res.message || 'Data risiko berhasil diperbarui!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Gagal memperbarui data risiko.');
        if (res.errors) {
          setValidationErrors(res.errors);
        }
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Terjadi kesalahan sistem saat menyimpan perbaikan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl lg:max-w-5xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-6 text-slate-800 dark:text-slate-100 transition-colors">
        
        {/* Modal Header (Pusri Sky Blue) */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#009fe3] to-[#0284c7] text-white flex items-center justify-between border-b border-sky-300 dark:border-sky-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Shield className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-base tracking-tight">{risk.kodeRisiko}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-amber-900 border border-yellow-200 font-bold">
                  Tambah/Perbaharui Data Risiko
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 text-white font-mono font-semibold">
                  Tahun {risk.tahun}
                </span>
                {risk.statusWorkflow === 'Revisi' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-400 text-slate-900 font-bold font-mono">
                    (perlu revisi)
                  </span>
                )}
                {risk.statusWorkflow === 'Menunggu_Approval_VP' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500 text-white font-bold font-mono">
                    Review VP
                  </span>
                )}
                {risk.statusWorkflow === 'Menunggu_Approval_Admin' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white font-bold font-mono">
                    Approval Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-100 mt-0.5 font-medium">
                Departemen: <strong>{risk.namaOrganisasi} ({risk.kodeOrganisasi})</strong> • Akses Pengguna: <strong className="text-white underline">{currentRole}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Revisi Notification if rejected by VP / Admin */}
        {risk.statusWorkflow === 'Revisi' && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/40 border-b border-yellow-200 dark:border-yellow-900/60 text-amber-900 dark:text-yellow-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-yellow-200">
              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-yellow-400 shrink-0" />
              <span>Catatan Arahan Perbaikan dari Atasan / VP / Admin:</span>
            </div>
            <p className="italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-yellow-200 dark:border-yellow-900/60 font-medium text-slate-800 dark:text-slate-200">
              "{risk.reviewNotesVp || risk.approvalNotesAdmin || 'Harap perbaiki dan lengkapi deskripsi risiko, penilaian matriks, atau langkah mitigasi sebelum diajukan kembali.'}"
            </p>
            <div className="text-[11px] text-amber-800 dark:text-yellow-300 font-semibold flex items-center gap-1.5">
              <span>👉 Silakan perbaiki form di bawah ini lalu klik tombol <strong>"Simpan &amp; Ajukan Ulang ke VP"</strong> untuk mengajukan kembali risiko ke tahap review Atasan / VP.</span>
            </div>
          </div>
        )}

        {/* Feedback Banners */}
        {successMessage && (
          <div className="p-3.5 bg-sky-50 dark:bg-sky-950/60 border-b border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#009fe3] dark:text-sky-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border-b border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="p-3.5 bg-yellow-50 dark:bg-yellow-950/40 border-b border-yellow-300 dark:border-yellow-800 text-amber-900 dark:text-yellow-200 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Periksa Data Masukan Anda:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 space-y-5 text-xs max-h-[72vh] overflow-y-auto">
          {canEdit ? (
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#009fe3] text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser?.nama ? currentUser.nama.charAt(0) : 'U'}
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    Mengedit Data Risiko Atas Nama: {currentUser?.nama || 'Petugas Unit Kerja'}
                  </span>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    Departemen: <strong>{risk.namaOrganisasi}</strong> • Jabatan: <strong>{currentUser?.jabatan || currentRole}</strong>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 font-bold border border-sky-300 dark:border-sky-700">
                Otentikasi Pengguna Aktif
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                {isFinished 
                  ? 'Risiko ini telah berstatus Selesai (Closed) dan tersimpan permanen. Hanya dapat ditinjau (view-only).'
                  : !isMyDepartment 
                  ? `Akses Terbatas: Anda berstatus ${currentRole} dari ${currentUser?.unitKerja || 'unit lain'}. Anda hanya dapat mengedit daftar risiko milik departemen Anda sendiri.`
                  : 'Data risiko ini hanya dapat diubah oleh pejabat yang berwenang.'}
              </span>
            </div>
          )}

          {/* Section 1: Karakteristik & Pernyataan Risiko */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#009fe3] dark:text-sky-400" />
                <span>1. Uraian Identifikasi & Peristiwa Risiko</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Kode: {risk.kodeRisiko}</span>
            </div>

            {/* Sumber Risiko * (Menginput by data master) */}
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
                disabled={!canEdit}
                value={sumberRisiko}
                onChange={(e) => setSumberRisiko(e.target.value)}
                className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs cursor-pointer disabled:opacity-60"
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
                {sumberRisiko && !activeSumberFlat.includes(sumberRisiko) && (
                  <optgroup label="Data Terdaftar Lainnya">
                    <option value={sumberRisiko}>{sumberRisiko}</option>
                  </optgroup>
                )}
              </select>
            </div>

            {/* Nama Risiko * */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Nama Risiko *
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
                disabled={!canEdit}
                value={pernyataanRisiko}
                onChange={(e) => setPernyataanRisiko(e.target.value)}
                placeholder="Deskripsikan peristiwa risiko secara spesifik dan terukur..."
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Penyebab *
                  </label>
                  <span
                    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold cursor-help"
                    title="Akar penyebab / pemicu terjadinya risiko"
                  >
                    ⓘ
                  </span>
                </div>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={penyebabRisiko}
                  onChange={(e) => setPenyebabRisiko(e.target.value)}
                  placeholder="Faktor penyebab langsung maupun tidak langsung..."
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Deskripsi Dampak Risiko *
                  </label>
                  <span
                    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold cursor-help"
                    title="Uraian dampak terhadap operasional, keselamatan, finansial, reputasi"
                  >
                    ⓘ
                  </span>
                </div>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={dampakRisiko}
                  onChange={(e) => setDampakRisiko(e.target.value)}
                  placeholder="Dampak terhadap operasional, keselamatan, finansial, reputasi..."
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Pengendalian Risiko Existing *
                </label>
                <span
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold cursor-help"
                  title="Pengendalian yang saat ini sudah berjalan"
                >
                  ⓘ
                </span>
              </div>
              <input
                type="text"
                disabled={!canEdit}
                value={pengendalianExisting}
                onChange={(e) => setPengendalianExisting(e.target.value)}
                placeholder="Contoh: SOP Rutin, Inspeksi Berkala, Kalibrasi..."
                className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Section 2: Penilaian Inherent Risk & Matriks 5x5 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#009fe3] dark:text-sky-400" />
                <span>2. Penilaian Matriks Risiko Awal (Inherent Risk)</span>
              </span>
              {isVp ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  ✓ Wewenang Review VP: Akses Edit Matriks Terbuka
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  Matriks 5×5 Standar Pusri
                </span>
              )}
            </div>

            {/* Sinkronisasi Penilaian Dampak Risiko dari Identifikasi */}
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#009fe3] shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    Penilaian Dampak Risiko Tersinkronisasi dengan Data Identifikasi:
                  </span>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Level Terpilih: <strong className="text-slate-900 dark:text-white font-mono">Level {dampakAwal} / 5</strong>
                    {kriteriaDampakTitle && (
                      <span> • Kategori: <strong className="text-sky-700 dark:text-sky-300">{kriteriaDampakTitle}</strong></span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800">
                {kriteriaDampakTitle ? 'Kriteria Terpilih' : 'Tersinkronisasi'}
              </span>
            </div>

            {/* Kriteria Dampak Risiko Sesuai Data Master Pusri (Pilih 1 Level Kriteria) */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <KriteriaDampakSection
                selectedCriterionKey={kriteriaDampakKey}
                selectedLevel={dampakAwal}
                onSelectCriterion={(key, level, description, categoryTitle) => {
                  if (canEdit) {
                    setKriteriaDampakKey(key);
                    setKriteriaDampakTitle(categoryTitle);
                    setDampakAwal(level);
                    setDampakRisiko(description || '');
                  }
                }}
                onClearCriterion={() => {
                  if (canEdit) {
                    setKriteriaDampakKey('');
                    setKriteriaDampakTitle('');
                    setDampakAwal(0);
                  }
                }}
                namePrefix="update_risk_modal_kriteria"
              />
            </div>

            {/* Likelihood / Kemungkinan Matriks 5x5 (Bagian Consequences Keuangan Dihapus Sesuai Permintaan) */}
            <RiskLikelihoodConsequenceTable
              likelihood={kemungkinanAwal}
              consequence={dampakAwal}
              onChangeLikelihood={setKemungkinanAwal}
              disabled={!canEdit}
              showLikelihood={true}
              showConsequence={false}
              showScoreSummary={true}
              allowUnselectLikelihood={false}
              namePrefix="update_risk_modal_lik"
            />

            {/* Inherent Mitigation Rule Notice */}
            <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-center gap-2 ${
              isMitigationRequired 
                ? 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-800 text-amber-900 dark:text-yellow-200' 
                : 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200'
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 ${isMitigationRequired ? 'text-amber-600' : 'text-[#009fe3]'}`} />
              <span>
                {isMitigationRequired 
                  ? `Skor inherent ${inherentScore} (≥10) melebihi batas toleransi Pusri. Wajib menyusun rencana mitigasi dan memilih strategi 'Mitigasi'.`
                  : `Skor inherent ${inherentScore} (<10) berada dalam batas selera risiko korporat.`}
              </span>
            </div>
          </div>

          {/* Section 3: Rencana Tindakan Mitigasi & Anggaran */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#009fe3] dark:text-sky-400" />
                <span>3. Rencana Tindakan Mitigasi & Jadwal Triwulanan</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Mitigasi Terstruktur</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Strategi Penanganan Risiko *
                </label>
                <select
                  disabled={!canEdit}
                  value={jenisPenanganan}
                  onChange={(e) => setJenisPenanganan(e.target.value as RiskHandlingStrategy)}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-[#009fe3] dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all shadow-2xs cursor-pointer"
                >
                  <option value="Mitigasi">Mitigasi (Menurunkan Risiko)</option>
                  <option value="Diterima">Diterima (Accept Risk)</option>
                  <option value="Dihindari">Dihindari (Avoid Risk)</option>
                  <option value="Transfer">Transfer (Alihkan / Asuransi)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Triwulan Penyelesaian *
                </label>
                <select
                  disabled={!canEdit}
                  value={targetWaktuMitigasi}
                  onChange={(e) => setTargetWaktuMitigasi(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs cursor-pointer"
                >
                  <option value="TW 1">Triwulan I (TW 1: Jan - Mar)</option>
                  <option value="TW 2">Triwulan II (TW 2: Apr - Jun)</option>
                  <option value="TW 3">Triwulan III (TW 3: Jul - Sep)</option>
                  <option value="TW 4">Triwulan IV (TW 4: Okt - Des)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Estimasi Biaya Mitigasi (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={!canEdit}
                    value={biayaRencanaPengendalian > 0 ? biayaRencanaPengendalian.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const cleanDigits = e.target.value.replace(/[^0-9]/g, '');
                      setBiayaRencanaPengendalian(cleanDigits ? parseInt(cleanDigits, 10) : 0);
                    }}
                    placeholder="Contoh: 50.000.000"
                    className="w-full h-10 pl-10 pr-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Rencana Langkah Mitigasi / Penanganan Rinci *
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={rencanaPenanganan}
                onChange={(e) => setRencanaPenanganan(e.target.value)}
                placeholder="Langkah nyata penanganan risiko, pengadaan suku cadang, SOP modifikasi, dll..."
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 4: Catatan Pengajuan Kembali (Resubmit Note saat Revisi) */}
          {isRevisi && canEdit && (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-2.5">
              <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200">
                Catatan Perbaikan / Penjelasan Pengajuan Kembali ke Atasan / VP:
              </label>
              <textarea
                rows={2}
                value={catatanPerbaikan}
                onChange={(e) => setCatatanPerbaikan(e.target.value)}
                placeholder="Jelaskan ringkasan perbaikan yang telah dilakukan untuk bahan pertimbangan Atasan/VP..."
                className="w-full p-3 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none transition-all shadow-2xs resize-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <span>Perubahan data akan tersimpan langsung ke basis data terpusat PT Pupuk Sriwidjaja.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Tutup / Batal
            </button>

            {canEdit && (
              isRevisi ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveUpdate(true)}
                  className="px-5 py-2 bg-[#009fe3] hover:bg-[#0087c2] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Simpan Perbaikan & Ajukan Kembali ke Atasan / VP untuk Review"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Mengirim Ulang...' : 'Simpan & Ajukan Ulang ke VP'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveUpdate(false)}
                  className="px-5 py-2 bg-[#009fe3] hover:bg-[#0087c2] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Simpan Perubahan Data Risiko"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
