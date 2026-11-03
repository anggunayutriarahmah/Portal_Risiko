import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Edit2,
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  ShieldAlert, 
  Shield,
  ShieldOff,
  Calculator, 
  Save, 
  FileCheck, 
  ArrowRight, 
  Sliders, 
  Search,
  Layers,
  ChevronDown,
  ChevronUp,
  Database,
  Users,
  RotateCcw,
  Send,
  DollarSign,
  Clock,
  X,
  Lock
} from 'lucide-react';
import { PusriRisk, OrganizationMaster, MasterChecklistItem, RiskCategory, RiskHandlingStrategy, UserRole, UserAccount, PertanyaanInvestasiRutin, SumberRisikoGroup } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';
import { getMasterRiskLevel, getRiskBadgeClasses, sortRisksNewestFirst, isRiskAssignedToUserDept } from '../../utils/riskMatrix';
import { AccessDeniedBanner } from './AccessDeniedBanner';
import { RiskLikelihoodConsequenceTable } from '../RiskLikelihoodConsequenceTable';
import { MASTER_SUMBER_RISIKO_DATA, flattenSumberRisikoGroups } from '../../data/sumberRisikoData';
import { KriteriaDampakSection } from '../KriteriaDampakSection';
import { MitigasiRiskFields } from '../MitigasiRiskFields';

interface IdentifikasiViewProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  risks: PusriRisk[];
  departments: OrganizationMaster[];
  checklist?: MasterChecklistItem[];
  onRiskCreated: (newRisk: PusriRisk) => void;
  onRisksCreated?: (newRisks: PusriRisk[]) => void;
  onSelectRisk: (risk: PusriRisk) => void;
  onNavigateNext?: (nextTab: string, roleToSwitch?: UserRole) => void;
  onOpenUpdateRiskModal?: (risk: PusriRisk) => void;
  onRiskUpdated?: (updatedRisk: PusriRisk) => void;
  sumberRisikoGroups?: SumberRisikoGroup[];
  onOpenMasterSumberRisiko?: () => void;
}

export interface RiskDraftItem {
  tempId: string;
  kategoriRisiko: RiskCategory;
  sumberRisiko: string;
  pernyataanRisiko: string;
  penyebabRisiko: string;
  dampakRisiko: string;
  pengendalianExisting: string;
  kemungkinanAwal: number;
  dampakAwal: number;
  kriteriaDampakKey?: string;
  kriteriaDampakTitle?: string;
  jenisPenanganan: RiskHandlingStrategy;
  rencanaPenanganan: string;
  targetWaktuMitigasi: string;
  biayaRencanaPengendalian: number;
  picPelaksana: string;
  picPengendali: string;
  // Extended Mitigasi fields (Persis formulir perlakuan risiko Pusri)
  keteranganRiskTreatment?: string;
  rencanaPengendalian?: string;
  expectedKemungkinan?: number;
  expectedDampak?: number;
  jenisAnggaran?: string;
  pertanyaanInvestasiRutin?: PertanyaanInvestasiRutin;
  bidangFungsiRisiko?: RiskCategory | string;
  subBidangRisiko?: string;
  bidangProyek?: string;
}

export const DEFAULT_PIC_PELAKSANA_OPTIONS = [
  'DEP. MITRA BISNIS & LOGISTIK',
  'DEP. OPERASI PABRIK 1B',
  'DEP. OPERASI PABRIK 2B',
  'DEP. PEMELIHARAAN MEKANIKAL',
  'DEP. PEMELIHARAAN LISTRIK & INSTRUMEN',
  'DEP. K3 & LINGKUNGAN HIDUP (K3LH)',
  'DEP. PENGADAAN & SCM',
  'DEP. TEKNOLOGI INFORMASI',
  'DEP. KEUANGAN & ANGGARAN',
  'DEP. RISET, INOVASI & TEKNOLOGI',
  'DEP. MANAJEMEN RISIKO & KEPATUHAN',
  'DEP. SUMBER DAYA MANUSIA (SDM)',
  'Superintendent Shift Operasi Pabrik',
  'Superintendent Pemeliharaan Mesin & Turbin',
  'Supervisor K3 Lapangan & Keselamatan Kerja',
  'Lead Engineer Instrumen & Otomasi',
  'Staff Senior Pengadaan & SCM',
  'Risk Officer Unit Kerja'
];

export const IdentifikasiView: React.FC<IdentifikasiViewProps> = ({
  currentRole,
  currentUser,
  risks,
  departments,
  onRiskCreated,
  onRisksCreated,
  onSelectRisk,
  onNavigateNext,
  onOpenUpdateRiskModal,
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
  const [activeTab, setActiveTab] = useState<'form' | 'list' | 'non-mitigasi' | 'revisi'>('form');

  // Shared Context across the batch - default to user's unit kerja if available
  const initialDeptKode = currentUser?.kodeUnitKerja || departments[0]?.kode || 'OP-IIB';
  const [kodeOrganisasi, setKodeOrganisasi] = useState(initialDeptKode);
  const [tahun, setTahun] = useState(2026);
  const [sasaranRKAP, setSasaranRKAP] = useState('');
  const [sasaranUnitKerja, setSasaranUnitKerja] = useState('');
  const [konteksEksternal, setKonteksEksternal] = useState('');
  const [konteksInternal, setKonteksInternal] = useState('');

  // Dynamically synchronize department with the logged in user
  useEffect(() => {
    if (currentUser?.kodeUnitKerja) {
      const match = departments.find(
        (d) => d.kode.toLowerCase() === currentUser.kodeUnitKerja?.toLowerCase()
      );
      if (match) {
        setKodeOrganisasi(match.kode);
        return;
      }
    }
    if (currentUser?.unitKerja) {
      const match = departments.find(
        (d) =>
          d.nama.toLowerCase() === currentUser.unitKerja.toLowerCase() ||
          d.kode.toLowerCase() === currentUser.unitKerja.toLowerCase()
      );
      if (match) {
        setKodeOrganisasi(match.kode);
        return;
      }
    }
    if (currentUser?.kodeUnitKerja) {
      setKodeOrganisasi(currentUser.kodeUnitKerja);
    }
  }, [currentUser, departments]);

  const userDeptObj = useMemo(() => {
    if (currentUser?.kodeUnitKerja) {
      const found = departments.find((d) => d.kode.toLowerCase() === currentUser.kodeUnitKerja?.toLowerCase());
      if (found) return found;
    }
    if (currentUser?.unitKerja) {
      const found = departments.find(
        (d) =>
          d.nama.toLowerCase() === currentUser.unitKerja?.toLowerCase() ||
          d.kode.toLowerCase() === currentUser.unitKerja?.toLowerCase()
      );
      if (found) return found;
    }
    const byCode = departments.find((d) => d.kode === kodeOrganisasi);
    if (byCode) return byCode;
    return {
      kode: currentUser?.kodeUnitKerja || kodeOrganisasi || 'OP-IIB',
      nama: currentUser?.unitKerja || 'Departemen Operasi Pabrik Pusri IIB',
      direktorat: 'Direktorat Operasi & Produksi'
    };
  }, [currentUser, departments, kodeOrganisasi]);


  // Multi-Risk Drafts List initialized empty with completely blank fields
  const createNewDraftItem = (index?: number): RiskDraftItem => ({
    tempId: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    kategoriRisiko: 'Operasional',
    sumberRisiko: '',
    pernyataanRisiko: '',
    penyebabRisiko: '',
    dampakRisiko: '',
    pengendalianExisting: '',
    kemungkinanAwal: 0,
    dampakAwal: 0,
    kriteriaDampakKey: '',
    kriteriaDampakTitle: '',
    jenisPenanganan: 'Mitigasi',
    rencanaPenanganan: '',
    targetWaktuMitigasi: 'Risiko Awal',
    biayaRencanaPengendalian: 0,
    picPelaksana: '',
    picPengendali: '',
    keteranganRiskTreatment: '',
    rencanaPengendalian: '',
    expectedKemungkinan: 0,
    expectedDampak: 0,
    jenisAnggaran: 'Investasi Rutin',
    pertanyaanInvestasiRutin: {},
    bidangFungsiRisiko: 'Operasional',
    subBidangRisiko: '',
    bidangProyek: ''
  });

  const [riskDrafts, setRiskDrafts] = useState<RiskDraftItem[]>([]);

  // Modal State for Adding or Editing Risk Details
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);
  const [draftForm, setDraftForm] = useState<RiskDraftItem>(createNewDraftItem(1));
  const [isCustomPic, setIsCustomPic] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorList, setErrorList] = useState<string[]>([]);

  // Search & Department Filter State for Daftar Register Risiko Organisasi yang Tersimpan
  const [listSearchKeyword, setListSearchKeyword] = useState('');
  const [listDepartmentFilter, setListDepartmentFilter] = useState(() => {
    if (currentRole === 'risk officer' && currentUser?.kodeUnitKerja) {
      return currentUser.kodeUnitKerja;
    }
    return 'ALL';
  });

  // Synchronize listDepartmentFilter with current user if Risk Officer
  useEffect(() => {
    if (currentRole === 'risk officer' && currentUser?.kodeUnitKerja) {
      setListDepartmentFilter(currentUser.kodeUnitKerja);
    }
  }, [currentUser, currentRole]);

  // Filter khusus untuk tab Revisi sesuai otorisasi unit
  const revisiRisks = useMemo(() => {
    return risks
      .filter((r) => {
        const isRevisi = r.statusWorkflow === 'Revisi' || (r.statusWorkflow as string) === 'revisi' || r.statusWorkflow === 'Draft_Unit';
        if (!isRevisi) return false;
        if (currentRole === 'risk officer') {
          return isRiskAssignedToUserDept(r, currentUser);
        }
        return true;
      })
      .sort(sortRisksNewestFirst);
  }, [risks, currentRole, currentUser]);

  // Compact result summary of last saved batch (space-saving, non-wasteful)
  const [lastSavedBatch, setLastSavedBatch] = useState<{
    sasaran: string;
    sasaranRKAP: string;
    deptName: string;
    count: number;
    risks: PusriRisk[];
    timestamp: string;
  } | null>(null);

  // Helpers to calculate risk level and SOP rules directly from Master Data 5x5 Matrix
  const getRiskLevel = (k: number, d: number) => {
    const level = getMasterRiskLevel(k, d);
    if (level === 'High') return { level, levelLabel: 'High Risk', color: 'bg-red-500 text-white font-bold' };
    if (level === 'Mod to High') return { level, levelLabel: 'Mod to High Risk', color: 'bg-orange-500 text-white font-bold' };
    if (level === 'Moderate') return { level, levelLabel: 'Moderate Risk', color: 'bg-amber-500 text-white font-bold' };
    if (level === 'Low to Mod') return { level, levelLabel: 'Low to Mod Risk', color: 'bg-[#38bdf8] text-white font-bold' };
    return { level, levelLabel: 'Low Risk', color: 'bg-[#0284c7] text-white font-bold' };
  };

  const [draftModalError, setDraftModalError] = useState<string | null>(null);

  const resetIdentifikasiForm = () => {
    setTahun(2026);
    setSasaranRKAP('');
    setSasaranUnitKerja('');
    setKonteksEksternal('');
    setKonteksInternal('');
    setRiskDrafts([]);
    setDraftForm(createNewDraftItem());
    setEditingDraftIndex(null);
    setIsCustomPic(false);
    setDraftModalError(null);
    setErrorList([]);
    setSuccessMessage(null);
  };

  const handleOpenAddDraft = () => {
    setEditingDraftIndex(null);
    setDraftForm(createNewDraftItem());
    setIsCustomPic(false);
    setDraftModalError(null);
    setIsDraftModalOpen(true);
  };

  const handleResetDraftForm = () => {
    setDraftForm(createNewDraftItem());
    setIsCustomPic(false);
    setDraftModalError(null);
  };

  const handleOpenEditDraft = (index: number) => {
    setEditingDraftIndex(index);
    setDraftForm({ ...riskDrafts[index] });
    const isStandard = DEFAULT_PIC_PELAKSANA_OPTIONS.includes(riskDrafts[index].picPelaksana);
    setIsCustomPic(!isStandard && Boolean(riskDrafts[index].picPelaksana));
    setDraftModalError(null);
    setIsDraftModalOpen(true);
  };

  const handleSaveDraftModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftForm.sumberRisiko.trim()) {
      setDraftModalError('Sumber risiko wajib dipilih berdasarkan data master.');
      return;
    }
    if (!draftForm.pernyataanRisiko.trim()) {
      setDraftModalError('Peristiwa / Pernyataan risiko wajib diisi.');
      return;
    }
    if (!draftForm.penyebabRisiko.trim()) {
      setDraftModalError('Penyebab / akar masalah risiko wajib diisi.');
      return;
    }
    if (!draftForm.dampakRisiko.trim()) {
      setDraftModalError('Uraian dampak risiko wajib diisi.');
      return;
    }
    if (!draftForm.dampakAwal || draftForm.dampakAwal < 1 || draftForm.dampakAwal > 5) {
      setDraftModalError('Kriteria Dampak Inherent (Skala 1–5) wajib dipilih terlebih dahulu.');
      return;
    }
    if (!draftForm.kemungkinanAwal || draftForm.kemungkinanAwal < 1 || draftForm.kemungkinanAwal > 5) {
      setDraftModalError('Tingkat Kemungkinan Inherent (Skala 1–5) wajib dipilih terlebih dahulu.');
      return;
    }
    setDraftModalError(null);

    const preparedDraft: RiskDraftItem = {
      ...draftForm,
      rencanaPenanganan: draftForm.jenisPenanganan === 'Mitigasi'
        ? (draftForm.rencanaPengendalian?.trim() || draftForm.rencanaPenanganan?.trim() || draftForm.keteranganRiskTreatment?.trim() || 'Pelaksanaan tindakan mitigasi terprogram')
        : (draftForm.keteranganRiskTreatment?.trim() || draftForm.rencanaPenanganan?.trim() || `Risiko penanganan ${draftForm.jenisPenanganan}`),
      kategoriRisiko: (draftForm.bidangFungsiRisiko as RiskCategory) || draftForm.kategoriRisiko || 'Operasional'
    };

    if (editingDraftIndex !== null) {
      setRiskDrafts((prev) => {
        const copy = [...prev];
        copy[editingDraftIndex] = preparedDraft;
        return copy;
      });
    } else {
      setRiskDrafts((prev) => [{ ...preparedDraft, tempId: `draft-${Date.now()}` }, ...prev]);
    }

    setIsDraftModalOpen(false);
  };

  const handleRemoveRiskRow = (index: number) => {
    setRiskDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  // Mulai input risiko baru dengan form Sasaran & Konteks yang bersih
  const handleStartFreshInput = () => {
    resetIdentifikasiForm();
    setLastSavedBatch(null);
    setTimeout(() => {
      const el = document.getElementById('input-sasaran-rkap');
      el?.focus();
    }, 50);
  };

  const isSasaranKonteksComplete = Boolean(
    sasaranRKAP.trim() &&
    sasaranUnitKerja.trim() &&
    konteksEksternal.trim() &&
    konteksInternal.trim()
  );

  // Bulk Submit Handler
  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorList([]);
    setSuccessMessage(null);

    if (riskDrafts.length === 0) {
      setErrorList(['Belum ada butir risiko dalam draft. Silakan klik "+ Tambah Data Risiko (+)".']);
      return;
    }

    const errors: string[] = [];
    if (!sasaranRKAP.trim()) {
      errors.push('Sasaran Strategis RKAP Korporat wajib diisi terlebih dahulu sebelum menyimpan data risiko.');
    }
    if (!sasaranUnitKerja.trim()) {
      errors.push('Sasaran Unit Kerja Pemilik Risiko wajib diisi terlebih dahulu sebelum menyimpan data risiko.');
    }
    if (!konteksEksternal.trim()) {
      errors.push('Konteks Eksternal wajib diisi terlebih dahulu sebelum menyimpan data risiko.');
    }
    if (!konteksInternal.trim()) {
      errors.push('Konteks Internal wajib diisi terlebih dahulu sebelum menyimpan data risiko.');
    }

    riskDrafts.forEach((draft, idx) => {
      const num = idx + 1;
      if (!draft.sumberRisiko.trim()) {
        errors.push(`Risiko #${num}: Sumber risiko wajib dipilih berdasarkan Master Data.`);
      }
      if (!draft.pernyataanRisiko.trim()) {
        errors.push(`Risiko #${num}: Pernyataan risiko wajib diisi.`);
      }
      if (!draft.penyebabRisiko.trim()) {
        errors.push(`Risiko #${num}: Akar masalah / penyebab risiko wajib diisi.`);
      }
      if (!draft.dampakRisiko.trim()) {
        errors.push(`Risiko #${num}: Uraian dampak risiko wajib diisi.`);
      }
      if (!draft.dampakAwal || draft.dampakAwal < 1 || draft.dampakAwal > 5) {
        errors.push(`Risiko #${num}: Skala Dampak Inherent (1–5) wajib dipilih.`);
      }
      if (!draft.kemungkinanAwal || draft.kemungkinanAwal < 1 || draft.kemungkinanAwal > 5) {
        errors.push(`Risiko #${num}: Skala Kemungkinan Inherent (1–5) wajib dipilih.`);
      }

      // If user selected Mitigasi and left plan empty, provide alert or default
      if (draft.jenisPenanganan === 'Mitigasi' && !draft.rencanaPenanganan.trim()) {
        draft.rencanaPenanganan = 'Pelaksanaan rencana aksi mitigasi terprogram sesuai SOP Pusri';
      } else if (!draft.rencanaPenanganan.trim()) {
        if (draft.jenisPenanganan === 'Diterima') {
          draft.rencanaPenanganan = 'Risiko diterima dalam selera risiko & batas toleransi operasional';
        } else if (draft.jenisPenanganan === 'Dihindari') {
          draft.rencanaPenanganan = 'Menghindari atau menghentikan aktivitas penyebab risiko tinggi';
        } else if (draft.jenisPenanganan === 'Transfer' || (draft.jenisPenanganan as any) === 'Ditransfer') {
          draft.rencanaPenanganan = 'Pengalihan risiko melalui mekanisme asuransi / perjanjian kontrak pihak ketiga';
        }
      }
    });

    if (errors.length > 0) {
      setErrorList(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    const selectedDept = departments.find((d) => d.kode === kodeOrganisasi);
    const startIndex = risks.length + 1;
    const baseNowMs = Date.now();
    const savedSasaranUnit = sasaranUnitKerja.trim();
    const savedSasaranRkap = sasaranRKAP.trim();

    const payloadList: Partial<PusriRisk>[] = riskDrafts.map((draft, idx) => {
      const code = `RSK-2026-${String(startIndex + idx).padStart(3, '0')}`;
      const kVal = Number(draft.kemungkinanAwal) > 0 ? Number(draft.kemungkinanAwal) : 1;
      const dVal = Number(draft.dampakAwal) > 0 ? Number(draft.dampakAwal) : 1;
      const inherentScore = kVal * dVal;
      const levelInfo = getRiskLevel(kVal, dVal);
      const isMandatory = inherentScore >= 10;
      const itemTimestamp = new Date(baseNowMs + (riskDrafts.length - idx)).toISOString();

      const mitigationStatus = inherentScore >= 16
        ? 'Wajib Mitigasi Segera (High Risk)'
        : inherentScore >= 12
          ? 'Wajib Mitigasi Aktif (Mod to High)'
          : inherentScore >= 8
            ? 'Mitigasi Direkomendasikan (Moderate)'
            : 'Toleransi Terpenuhi (Dapat Diterima)';

      return {
        id: code,
        kodeRisiko: code,
        kodeOrganisasi,
        namaOrganisasi: selectedDept ? selectedDept.nama : 'Departemen Operasi Pabrik 1B',
        tahun,
        sasaranRKAP: savedSasaranRkap,
        sasaranUnitKerja: savedSasaranUnit,
        konteksEksternal: konteksEksternal.trim(),
        konteksInternal: konteksInternal.trim(),
        sumberRisiko: draft.sumberRisiko,
        pernyataanRisiko: draft.pernyataanRisiko,
        penyebabRisiko: draft.penyebabRisiko,
        dampakRisiko: draft.dampakRisiko,
        pengendalianExisting: draft.pengendalianExisting,
        kategoriRisiko: (draft.bidangFungsiRisiko as RiskCategory) || draft.kategoriRisiko || 'Operasional',
        kriteriaDampakKey: draft.kriteriaDampakKey || undefined,
        kriteriaDampakTitle: draft.kriteriaDampakTitle || undefined,
        kriteriaDampakLevel: draft.kriteriaDampakKey ? Number(draft.kriteriaDampakKey.split('_')[1]) || undefined : undefined,
        kemungkinanAwal: draft.kemungkinanAwal,
        dampakAwal: draft.dampakAwal,
        tingkatRisikoAwal: levelInfo.level as any,
        currentTingkatRisiko: levelInfo.level as any,
        inherentScore,
        jenisPenanganan: draft.jenisPenanganan,
        butuhMitigasi: isMandatory || draft.jenisPenanganan === 'Mitigasi',
        statusKebutuhanMitigasi: mitigationStatus,
        alasanKebutuhanMitigasi: isMandatory
          ? `Skor inherent ${inherentScore} (≥10) melebihi batas toleransi selera risiko Pusri. Wajib mitigasi.`
          : `Skor inherent ${inherentScore} (<10) dalam toleransi wajar.`,
        rencanaPenanganan: draft.rencanaPenanganan,
        targetWaktuMitigasi: draft.targetWaktuMitigasi,
        biayaRencanaPengendalian: Number(draft.biayaRencanaPengendalian) || 0,
        picPelaksana: draft.picPelaksana || 'DEP. MITRA BISNIS & LOGISTIK',
        picPengendali: draft.picPengendali || 'Vice President Departemen',
        jenisAnggaran: draft.jenisAnggaran || (draft.biayaRencanaPengendalian > 0 ? 'Investasi Rutin' : 'Non-Anggaran / Prosedural'),
        keteranganRiskTreatment: draft.keteranganRiskTreatment,
        rencanaPengendalian: draft.rencanaPengendalian || draft.rencanaPenanganan,
        expectedKemungkinan: draft.expectedKemungkinan,
        expectedDampak: draft.expectedDampak,
        pertanyaanInvestasiRutin: draft.pertanyaanInvestasiRutin,
        bidangFungsiRisiko: draft.bidangFungsiRisiko || 'Operasional',
        subBidangRisiko: draft.subBidangRisiko,
        bidangProyek: draft.bidangProyek,
        statusWorkflow: 'Menunggu_Approval_VP',
        createdDate: itemTimestamp,
        updatedDate: itemTimestamp,
        createdBy: currentUser?.nama
          ? `${currentUser.nama} (Badge ${currentUser.badge || '0953'} - ${currentUser.jabatan || currentRole})`
          : 'FAUZAN AL GHANIYYU (Badge 0953 - Risk Officer Unit Kerja)'
      };
    });

    const creatorIdentity = currentUser?.nama
      ? `${currentUser.nama} (Badge ${currentUser.badge || '0953'} - ${currentUser.jabatan || currentRole})`
      : 'FAUZAN AL GHANIYYU (Badge 0953 - Risk Officer Unit Kerja)';

    try {
      const createdRisks = await PusriApiClient.submitIdentifikasiForApproval({
        kodeOrganisasi,
        namaOrganisasi: selectedDept?.nama || 'Departemen Operasi Pabrik Pusri IIB',
        tahun,
        sasaranRKAP: savedSasaranRkap,
        sasaranUnitKerja: savedSasaranUnit,
        konteksEksternal: konteksEksternal.trim(),
        konteksInternal: konteksInternal.trim(),
        createdBy: creatorIdentity,
        risks: payloadList
      });

      if (createdRisks && createdRisks.length > 0) {
        if (onRisksCreated) {
          onRisksCreated(createdRisks);
        } else {
          createdRisks.forEach((r) => onRiskCreated(r));
        }

        const deptTitle = selectedDept ? selectedDept.nama : kodeOrganisasi;

        // Refresh / kosongkan seluruh isian Sasaran, Konteks, dan Draft setelah berhasil disimpan
        resetIdentifikasiForm();

        setLastSavedBatch({
          sasaran: savedSasaranUnit,
          sasaranRKAP: savedSasaranRkap,
          deptName: deptTitle,
          count: createdRisks.length,
          risks: createdRisks,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        });

        // Smooth scroll to top of form to see the sleek compact result banner
        const el = document.getElementById('result-summary-banner');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } catch (err: any) {
      setErrorList([err?.message || 'Gagal menyimpan usulan risiko ke database MySQL.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      {/* Header Banner */}
      <div className="p-3.5 md:p-4 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <h2 className="text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white">
          Formulir Identifikasi Risiko
        </h2>
      </div>

      {/* Tabs Switcher: Formulir Input Risiko vs Daftar Register Risiko Unit vs Risiko Perlu Perbaikan */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-3 text-xs font-bold flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'form'
                ? 'border-[#009fe3] text-[#009fe3] dark:text-sky-300 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Formulir Input Risiko</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'border-[#009fe3] text-[#009fe3] dark:text-sky-300 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Daftar Register Risiko (Mitigasi)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('non-mitigasi')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'non-mitigasi'
                ? 'border-amber-500 text-amber-800 dark:text-yellow-300 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <ShieldOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Daftar Risiko Diterima / Transfer / Hindari</span>
            {risks.filter((r) => r.jenisPenanganan === 'Diterima' || r.jenisPenanganan === 'Dihindari' || r.jenisPenanganan === 'Transfer' || (r.jenisPenanganan as any) === 'Ditransfer').length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-mono font-bold">
                {risks.filter((r) => r.jenisPenanganan === 'Diterima' || r.jenisPenanganan === 'Dihindari' || r.jenisPenanganan === 'Transfer' || (r.jenisPenanganan as any) === 'Ditransfer').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('revisi')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'revisi'
                ? 'border-amber-500 text-amber-800 dark:text-yellow-300 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Risiko Perlu Perbaikan (Revisi)</span>
            {revisiRisks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-yellow-400 text-slate-900 font-mono font-bold">
                {revisiRisks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Validation Errors Alert */}
      {errorList.length > 0 && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs space-y-1">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Validasi Data Risiko Belum Lengkap:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {errorList.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sleek Space-Saving Result Banner: "tanpa membuat boros tempat untuk hasil" */}
      {lastSavedBatch && (
        <div
          id="result-summary-banner"
          className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/95 via-slate-900 to-sky-950/90 border border-sky-500/50 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200"
        >
          {/* Left info: Compact */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  <span>{lastSavedBatch.count} Risiko Berhasil Terdata Langsung di Database MySQL (Tidak Ada Duplikasi)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold">
                  Status: Menunggu Review VP
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  Formulir Direset • Posisi Paling Atas
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {lastSavedBatch.timestamp} WIB
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 mt-0.5 truncate">
                <span className="text-zinc-400">Sasaran Tersimpan:</span>
                <strong className="text-yellow-300 font-semibold truncate">"{lastSavedBatch.sasaran}"</strong>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400 truncate">{lastSavedBatch.deptName}</span>
                <span className="text-zinc-500">|</span>
                <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
                  {lastSavedBatch.risks.map((r) => (
                    <span
                      key={r.id}
                      className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-900/90 border border-sky-500/30 text-sky-300"
                    >
                      {r.kodeRisiko}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleStartFreshInput}
              className="py-1.5 px-3 rounded-xl bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-950/50 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Input Risiko Baru</span>
            </button>

            {currentRole === 'risk officer' ? (
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-all cursor-pointer"
              >
                <span>Lihat Register Risiko Unit</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateNext) {
                    onNavigateNext('review-vp');
                  }
                }}
                className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-all cursor-pointer"
              >
                <span>Lanjut Review VP</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setLastSavedBatch(null)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800/80 cursor-pointer"
              title="Tutup Ringkasan"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Info status */}
      {successMessage && !lastSavedBatch && (
        <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#009fe3] shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-[#009fe3] hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* TAB CONTENT: FORMULIR MULTI-INPUT */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmitBatch} className="space-y-5">
          {/* Section 1: Konteks & Sasaran RKAP / Unit Kerja */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#009fe3] dark:text-sky-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Parameter Konteks & Sasaran Kerja
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {(sasaranRKAP || sasaranUnitKerja || konteksEksternal || konteksInternal || riskDrafts.length > 0) && (
                  <button
                    type="button"
                    onClick={resetIdentifikasiForm}
                    className="text-[11px] font-bold text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 px-2.5 py-0.5 rounded border border-slate-200 hover:border-rose-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Form</span>
                  </button>
                )}
                <span className="text-[11px] font-mono text-[#009fe3] dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                  Shared Objective
                </span>
              </div>
            </div>

            {/* Kartu Identitas Pengusul Risiko (Mengatasnamakan Akun Resmi) */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 via-sky-50/60 to-blue-50/40 dark:from-sky-950/40 dark:via-sky-950/20 dark:to-blue-950/20 border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#009fe3] text-white font-extrabold flex items-center justify-center text-sm shadow-xs ring-2 ring-sky-300 dark:ring-sky-700">
                  {currentUser?.nama
                    ? currentUser.nama.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                    : currentRole === 'risk admin' ? 'DA' : currentRole === 'risk owner' ? 'MD' : 'FA'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#009fe3] dark:text-sky-400 uppercase tracking-wider">
                      Pengusul Risiko (Mengatasnamakan Akun Resmi):
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                      ● Sesi Terverifikasi
                    </span>
                  </div>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <span>
                      {currentUser?.nama || (currentRole === 'risk admin' ? 'DAFFA ARI PRASETYA' : currentRole === 'risk owner' ? 'M DAVI RAMADHAN' : 'FAUZAN AL GHANIYYU')}
                    </span>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-[#009fe3] dark:text-sky-300">
                      Badge {currentUser?.badge || (currentRole === 'risk admin' ? '0952' : currentRole === 'risk owner' ? '0951' : '0953')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    <strong>{currentUser?.jabatan || `${currentRole} - Risk Officer Unit Kerja`}</strong> • {currentUser?.unitKerja || departments.find(d => d.kode === kodeOrganisasi)?.nama || 'Departemen Operasi Pabrik Pusri IIB'}
                  </div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">Otoritas Form:</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">SOP ERM Pusri 2026</span>
              </div>
            </div>

            {/* Structured 6-Column Precision Grid */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-xs">
              {/* Unit Kerja / Departemen Pemilik Risiko (4 cols) - Sesuai instruksi: Otomatis sesuai departemen asal (Tanpa Dropdown) */}
              <div className="md:col-span-4">
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
                    <Building2 className="w-4 h-4 text-[#009fe3] shrink-0" />
                    <span className="truncate">
                      {userDeptObj.kode} - {userDeptObj.nama}
                    </span>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400 font-mono font-normal">
                    (Terkunci Sesuai Akun Pengusul)
                  </span>
                </div>
              </div>

              {/* Tahun Anggaran RKAP (2 cols) - Mulai 2024 & Seterusnya */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Tahun Anggaran RKAP (2024+) *
                  </label>
                  <div className="flex items-center gap-1">
                    {[2024, 2025, 2026, 2027].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setTahun(yr)}
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                          tahun === yr
                            ? 'bg-[#009fe3] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-sky-100'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min={2024}
                  max={2099}
                  value={tahun}
                  onChange={(e) => setTahun(Math.max(2024, Number(e.target.value) || 2024))}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Sasaran Strategis RKAP (3 cols / 50%) */}
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Sasaran Strategis RKAP Korporat <span className="text-red-500">*</span>
                  </label>
                  {riskDrafts.length > 0 && !sasaranRKAP.trim() && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Wajib diisi sebelum simpan</span>
                  )}
                </div>
                <input
                  id="input-sasaran-rkap"
                  type="text"
                  required
                  placeholder="Masukkan sasaran strategis RKAP..."
                  value={sasaranRKAP}
                  onChange={(e) => setSasaranRKAP(e.target.value)}
                  className={`w-full h-10 px-3.5 bg-white dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs ${
                    riskDrafts.length > 0 && !sasaranRKAP.trim()
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              {/* Sasaran Unit Kerja (3 cols / 50%) */}
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Sasaran Unit Kerja Pemilik Risiko <span className="text-red-500">*</span>
                  </label>
                  {riskDrafts.length > 0 && !sasaranUnitKerja.trim() && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Wajib diisi sebelum simpan</span>
                  )}
                </div>
                <input
                  id="input-sasaran-unit"
                  type="text"
                  required
                  placeholder="Masukkan sasaran unit kerja..."
                  value={sasaranUnitKerja}
                  onChange={(e) => setSasaranUnitKerja(e.target.value)}
                  className={`w-full h-10 px-3.5 bg-white dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs ${
                    riskDrafts.length > 0 && !sasaranUnitKerja.trim()
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              {/* Konteks Eksternal (3 cols / 50%) */}
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Konteks Eksternal (Pasar, Vendor, Regulasi) <span className="text-red-500">*</span>
                  </label>
                  {riskDrafts.length > 0 && !konteksEksternal.trim() && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Wajib diisi sebelum simpan</span>
                  )}
                </div>
                <input
                  id="input-konteks-eksternal"
                  type="text"
                  required
                  placeholder="Masukkan konteks eksternal..."
                  value={konteksEksternal}
                  onChange={(e) => setKonteksEksternal(e.target.value)}
                  className={`w-full h-10 px-3.5 bg-white dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs ${
                    riskDrafts.length > 0 && !konteksEksternal.trim()
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>

              {/* Konteks Internal (3 cols / 50%) */}
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Konteks Internal (SOP, Shift, Keandalan Mesin) <span className="text-red-500">*</span>
                  </label>
                  {riskDrafts.length > 0 && !konteksInternal.trim() && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Wajib diisi sebelum simpan</span>
                  )}
                </div>
                <input
                  id="input-konteks-internal"
                  type="text"
                  required
                  placeholder="Masukkan konteks internal..."
                  value={konteksInternal}
                  onChange={(e) => setKonteksInternal(e.target.value)}
                  className={`w-full h-10 px-3.5 bg-white dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs ${
                    riskDrafts.length > 0 && !konteksInternal.trim()
                      ? 'border-rose-400 dark:border-rose-600 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: DATA RISIKO TABLE (Exact match to requested UI layout) */}
          <div id="risk-drafts-table-section" className="space-y-3">
            {/* Header: DATA RISIKO * (X butir risiko dalam draft) + button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 flex items-center justify-center text-[#009fe3] dark:text-sky-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    DATA RISIKO
                  </h3>
                  <span className="text-red-500 font-bold">*</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">
                    ({riskDrafts.length} butir risiko dalam draft)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddDraft}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-sky-600 dark:border-sky-500 text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Tambah Data Risiko</span>
              </button>
            </div>

            {/* The Draft Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/40">
                    <th className="py-3 px-3 text-center w-10 font-bold">NO</th>
                    <th className="py-3 px-3 min-w-[200px] font-bold">PERISTIWA RISIKO & SUMBER</th>
                    <th className="py-3 px-3 min-w-[170px] font-bold">PENYEBAB & DAMPAK</th>
                    <th className="py-3 px-3 text-center min-w-[110px] font-bold text-[#009fe3] dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20">
                      LIKELIHOOD (K)
                    </th>
                    <th className="py-3 px-3 text-center min-w-[110px] font-bold text-indigo-600 dark:text-indigo-400">
                      DAMPAK (D)
                    </th>
                    <th className="py-3 px-3 text-center min-w-[120px] font-bold">TINGKAT RISIKO</th>
                    <th className="py-3 px-3 text-right min-w-[140px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                      BIAYA ANGGARAN (RP)
                    </th>
                    <th className="py-3 px-3 min-w-[180px] font-bold">RENCANA MITIGASI</th>
                    <th className="py-3 px-3 text-center w-20 font-bold">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {riskDrafts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                            Belum ada butir risiko dalam draft
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Klik tombol <strong>"+ Tambah Data Risiko (+)"</strong> di atas untuk menambahkan risiko pertama.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    riskDrafts.map((draft, idx) => {
                      const score = draft.kemungkinanAwal * draft.dampakAwal;
                      const levelInfo = getRiskLevel(draft.kemungkinanAwal, draft.dampakAwal);

                      return (
                        <tr key={draft.tempId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          {/* 1. NO */}
                          <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300 align-top pt-3.5">
                            {idx + 1}
                          </td>

                          {/* 2. RISIKO & SUMBER */}
                          <td className="py-3 px-3 align-top space-y-1.5">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                              {draft.pernyataanRisiko || '(Belum Diisi - Klik Edit untuk Mengisi)'}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {draft.sumberRisiko && (
                                <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 text-[10px] font-semibold border border-sky-200 dark:border-sky-800" title={`Sumber Risiko: ${draft.sumberRisiko}`}>
                                  Sumber: {draft.sumberRisiko.length > 28 ? draft.sumberRisiko.slice(0, 28) + '...' : draft.sumberRisiko}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                                {draft.targetWaktuMitigasi || 'Risiko Awal'}
                              </span>
                            </div>
                          </td>

                          {/* 3. PENYEBAB & DAMPAK */}
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 align-top leading-relaxed text-xs space-y-1">
                            <div>
                              <strong className="text-slate-500 text-[10px] block uppercase">Penyebab:</strong>
                              {draft.penyebabRisiko || '-'}
                            </div>
                            <div>
                              <strong className="text-slate-500 text-[10px] block uppercase">Dampak:</strong>
                              {draft.dampakRisiko || '-'}
                            </div>
                          </td>

                          {/* 4. LIKELIHOOD (K) - KOLOM KHUSUS */}
                          <td className="py-3 px-3 align-top text-center bg-sky-50/30 dark:bg-sky-950/10">
                            {draft.kemungkinanAwal > 0 ? (
                              <div className="space-y-0.5">
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-[#009fe3] text-white font-extrabold text-xs shadow-2xs font-mono">
                                  Level {draft.kemungkinanAwal}
                                </span>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  {draft.kemungkinanAwal === 1 && '>0%-15%'}
                                  {draft.kemungkinanAwal === 2 && '>15%-35%'}
                                  {draft.kemungkinanAwal === 3 && '>35%-60%'}
                                  {draft.kemungkinanAwal === 4 && '>60%-85%'}
                                  {draft.kemungkinanAwal === 5 && '>85%'}
                                </div>
                              </div>
                            ) : (
                              <span className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-semibold border border-amber-200 dark:border-amber-800">
                                Belum dipilih
                              </span>
                            )}
                          </td>

                          {/* 5. DAMPAK (D) - KOLOM KHUSUS */}
                          <td className="py-3 px-3 align-top text-center">
                            {draft.dampakAwal > 0 ? (
                              <div className="space-y-0.5">
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-extrabold text-xs shadow-2xs font-mono">
                                  Level {draft.dampakAwal}
                                </span>
                                {draft.kriteriaDampakTitle && (
                                  <div className="text-[9px] text-slate-500 dark:text-slate-400 max-w-[120px] mx-auto truncate" title={draft.kriteriaDampakTitle}>
                                    {draft.kriteriaDampakTitle}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                                Belum dipilih
                              </span>
                            )}
                          </td>

                          {/* 6. TINGKAT RISIKO & SKOR INHERENT */}
                          <td className="py-3 px-3 align-top text-center">
                            {draft.kemungkinanAwal > 0 && draft.dampakAwal > 0 ? (
                              <div className="space-y-1">
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono shadow-2xs ${levelInfo.color}`}>
                                  {score} ({levelInfo.level})
                                </span>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  L{draft.kemungkinanAwal} × D{draft.dampakAwal}
                                </div>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px]">
                                Pending Matriks
                              </span>
                            )}
                          </td>

                          {/* 7. BIAYA ANGGARAN (RP) - KOLOM KHUSUS */}
                          <td className="py-3 px-3 align-top text-right bg-emerald-50/30 dark:bg-emerald-950/10">
                            <div className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                              Rp {(draft.biayaRencanaPengendalian || 0).toLocaleString('id-ID')}
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                              {Number(draft.biayaRencanaPengendalian) > 0 ? 'OPEX/CAPEX' : 'Non-Budget'}
                            </span>
                          </td>

                          {/* 8. RENCANA MITIGASI & TARGET */}
                          <td className="py-3 px-3 align-top space-y-1.5">
                            <div className="p-2 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/40 text-slate-800 dark:text-slate-200 text-[11px] leading-snug">
                              <strong className="font-bold text-[#009fe3] dark:text-sky-300 block mb-0.5">
                                {draft.jenisPenanganan || 'Mitigasi'}{draft.targetWaktuMitigasi && draft.targetWaktuMitigasi !== 'Risiko Awal' ? ` (Target ${draft.targetWaktuMitigasi})` : ''}:
                              </strong>
                              {draft.rencanaPenanganan || '(Belum ada rencana penanganan)'}
                            </div>
                            {draft.jenisPenanganan === 'Mitigasi' && (draft.expectedKemungkinan || draft.expectedDampak || draft.jenisAnggaran) && (
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                {draft.expectedKemungkinan ? (
                                  <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-mono font-semibold">
                                    Exp. K: Lvl {draft.expectedKemungkinan}
                                  </span>
                                ) : null}
                                {draft.expectedDampak ? (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-mono font-semibold">
                                    Exp. D: Lvl {draft.expectedDampak}
                                  </span>
                                ) : null}
                                {draft.jenisAnggaran && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                                    {draft.jenisAnggaran}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* 9. AKSI */}
                          <td className="py-3 px-3 text-center align-top pt-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const kVal = Number(draft.kemungkinanAwal) > 0 ? Number(draft.kemungkinanAwal) : 1;
                                  const dVal = Number(draft.dampakAwal) > 0 ? Number(draft.dampakAwal) : 1;
                                  const lv = getRiskLevel(kVal, dVal);
                                  onSelectRisk({
                                    id: draft.tempId,
                                    kodeRisiko: `DRAFT-${idx + 1}`,
                                    kodeOrganisasi,
                                    namaOrganisasi: userDeptObj.nama,
                                    tahun,
                                    sasaranRKAP: sasaranRKAP || '-',
                                    sasaranUnitKerja: sasaranUnitKerja || '-',
                                    konteksEksternal: konteksEksternal || '-',
                                    konteksInternal: konteksInternal || '-',
                                    sumberRisiko: draft.sumberRisiko || '-',
                                    pernyataanRisiko: draft.pernyataanRisiko || '-',
                                    penyebabRisiko: draft.penyebabRisiko || '-',
                                    dampakRisiko: draft.dampakRisiko || '-',
                                    pengendalianExisting: draft.pengendalianExisting || '-',
                                    kategoriRisiko: (draft.bidangFungsiRisiko as RiskCategory) || draft.kategoriRisiko || 'Operasional',
                                    bidangFungsiRisiko: draft.bidangFungsiRisiko || draft.kategoriRisiko || 'Operasional',
                                    subBidangRisiko: draft.subBidangRisiko || '-',
                                    bidangProyek: draft.bidangProyek || '-',
                                    kriteriaDampakKey: draft.kriteriaDampakKey,
                                    kriteriaDampakTitle: draft.kriteriaDampakTitle,
                                    kemungkinanAwal: kVal,
                                    dampakAwal: dVal,
                                    inherentScore: kVal * dVal,
                                    tingkatRisikoAwal: lv.level as any,
                                    currentTingkatRisiko: lv.level as any,
                                    jenisPenanganan: draft.jenisPenanganan,
                                    butuhMitigasi: draft.jenisPenanganan === 'Mitigasi',
                                    rencanaPenanganan: draft.rencanaPenanganan || draft.rencanaPengendalian || '-',
                                    rencanaPengendalian: draft.rencanaPengendalian,
                                    keteranganRiskTreatment: draft.keteranganRiskTreatment,
                                    expectedKemungkinan: draft.expectedKemungkinan,
                                    expectedDampak: draft.expectedDampak,
                                    jenisAnggaran: draft.jenisAnggaran || 'Investasi Rutin / OPEX',
                                    pertanyaanInvestasiRutin: draft.pertanyaanInvestasiRutin,
                                    targetWaktuMitigasi: draft.targetWaktuMitigasi,
                                    biayaRencanaPengendalian: draft.biayaRencanaPengendalian,
                                    picPelaksana: draft.picPelaksana || '-',
                                    picPengendali: draft.picPengendali || '-',
                                    statusWorkflow: 'Draft_Unit',
                                    pengendalianTriwulan: [],
                                    createdBy: currentUser?.nama || 'Unit Kerja',
                                    createdDate: new Date().toISOString(),
                                    updatedDate: new Date().toISOString()
                                  });
                                }}
                                className="px-2 py-1 text-[11px] font-bold text-[#009fe3] hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Lihat Detail Informasi Risiko Ini"
                              >
                                Detail
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditDraft(idx)}
                                className="p-1.5 text-slate-400 hover:text-[#009fe3] dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Ubah Data Risiko Ini"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRiskRow(idx)}
                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Data Risiko Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Bar & Multi-Risk Submission */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-3">
            {riskDrafts.length > 0 && !isSasaranKonteksComplete && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Data risiko baru sudah diinput ke dalam draf. Harap isi terlebih dahulu <strong>Sasaran RKAP</strong>, <strong>Sasaran Unit Kerja</strong>, <strong>Konteks Eksternal</strong>, dan <strong>Konteks Internal</strong> pada form di atas agar tombol Simpan aktif.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const firstEmptyId = !sasaranRKAP.trim()
                      ? 'input-sasaran-rkap'
                      : !sasaranUnitKerja.trim()
                      ? 'input-sasaran-unit'
                      : !konteksEksternal.trim()
                      ? 'input-konteks-eksternal'
                      : 'input-konteks-internal';
                    const el = document.getElementById(firstEmptyId);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.focus();
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer shrink-0 transition-colors"
                >
                  Isi Sasaran & Konteks Sekarang
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Total Draf: <strong className="text-[#009fe3] dark:text-sky-400 font-mono text-sm">{riskDrafts.length} Risiko</strong>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Semua butir risiko yang ada di tabel draf akan diteruskan ke tahap Review Atasan / VP setelah Sasaran & Konteks dilengkapi.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="submit"
                  disabled={isSubmitting || riskDrafts.length === 0 || !isSasaranKonteksComplete}
                  title={
                    riskDrafts.length === 0
                      ? 'Tambahkan minimal 1 data risiko terlebih dahulu'
                      : !isSasaranKonteksComplete
                      ? 'Harap lengkapi Sasaran RKAP, Sasaran Unit Kerja, Konteks Eksternal, dan Konteks Internal terlebih dahulu'
                      : 'Simpan data risiko'
                  }
                  className="px-6 py-2.5 bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-yellow-300" />
                      <span>Simpan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB CONTENT: DAFTAR REGISTER RISIKO */}
      {activeTab === 'list' && (() => {
        // Collect departments with count of registered risks
        const distinctDeptsMap = new Map<string, { kode: string; nama: string; count: number }>();
        departments.forEach((d) => {
          distinctDeptsMap.set(d.kode, { kode: d.kode, nama: d.nama, count: 0 });
        });
        risks.forEach((r) => {
          const key = r.kodeOrganisasi || 'OTHER';
          if (distinctDeptsMap.has(key)) {
            distinctDeptsMap.get(key)!.count += 1;
          } else {
            distinctDeptsMap.set(key, { kode: key, nama: r.namaOrganisasi || key, count: 1 });
          }
        });

        const registeredDeptOptions = Array.from(distinctDeptsMap.values())
          .filter((d) => d.count > 0 || departments.some((m) => m.kode === d.kode))
          .sort((a, b) => b.count - a.count || a.nama.localeCompare(b.nama));

        const mitigasiOnlyRisks = risks.filter((r) => r.statusWorkflow !== 'Selesai' && (r.jenisPenanganan === 'Mitigasi' || !r.jenisPenanganan));

        const filteredSavedRisks = mitigasiOnlyRisks.filter((r) => {
          if (listDepartmentFilter !== 'ALL') {
            if (r.kodeOrganisasi !== listDepartmentFilter && r.namaOrganisasi !== listDepartmentFilter) {
              return false;
            }
          }
          if (listSearchKeyword.trim()) {
            const q = listSearchKeyword.toLowerCase();
            const matchKode = r.kodeRisiko?.toLowerCase().includes(q);
            const matchPernyataan = r.pernyataanRisiko?.toLowerCase().includes(q);
            const matchOrganisasi = r.namaOrganisasi?.toLowerCase().includes(q) || r.kodeOrganisasi?.toLowerCase().includes(q);
            const matchSasaran = r.sasaranUnitKerja?.toLowerCase().includes(q) || r.sasaranRKAP?.toLowerCase().includes(q);
            const matchPic = r.picPelaksana?.toLowerCase().includes(q) || r.picPengendali?.toLowerCase().includes(q);
            const matchKategori = r.kategoriRisiko?.toLowerCase().includes(q);
            if (!matchKode && !matchPernyataan && !matchOrganisasi && !matchSasaran && !matchPic && !matchKategori) {
              return false;
            }
          }
          return true;
        }).sort(sortRisksNewestFirst);

        return (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#009fe3]" />
                  <span>Daftar Register Risiko Mitigasi</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-3.5 py-1.5 bg-[#009fe3] text-white rounded-xl text-xs font-bold hover:bg-[#0284c7] transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Input Risiko Baru</span>
              </button>
            </div>

            {/* Menu Search & Filter Risiko Berdasarkan Departemen */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
                {/* Search Keyword */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={listSearchKeyword}
                    onChange={(e) => setListSearchKeyword(e.target.value)}
                    placeholder="Cari kode risiko, uraian risiko, PIC, sasaran..."
                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs"
                  />
                  {listSearchKeyword && (
                    <button
                      type="button"
                      onClick={() => setListSearchKeyword('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Cari/Filter Departemen */}
                <div className="sm:w-80 relative">
                  <Building2 className="w-4 h-4 text-[#009fe3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={listDepartmentFilter}
                    onChange={(e) => setListDepartmentFilter(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-[#009fe3] focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs cursor-pointer appearance-none truncate"
                  >
                    <option value="ALL">Semua Departemen ({risks.length} Risiko)</option>
                    {registeredDeptOptions.map((dept) => (
                      <option key={dept.kode} value={dept.kode}>
                        {dept.nama} ({dept.count} risiko)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Status Hasil & Reset Button */}
              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
                <span className="text-slate-500 font-medium">
                  Menampilkan: <strong className="text-slate-900 dark:text-slate-100 font-bold">{filteredSavedRisks.length}</strong> dari {risks.length}
                </span>
                {(listSearchKeyword || listDepartmentFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setListSearchKeyword('');
                      setListDepartmentFilter('ALL');
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-[#009fe3] hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors cursor-pointer border border-sky-200 dark:border-sky-800"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-2.5 px-3">Kode & Unit</th>
                    <th className="py-2.5 px-3">Pernyataan Risiko</th>
                    <th className="py-2.5 px-3 text-center">Tingkat Risiko (Master Data)</th>
                    <th className="py-2.5 px-3">PIC Pelaksana</th>
                    <th className="py-2.5 px-3 text-center">Status Mitigasi</th>
                    <th className="py-2.5 px-3 text-center">Alur Workflow</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSavedRisks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ditemukan risiko untuk departemen atau kata kunci pencarian yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredSavedRisks.map((risk) => {
                      const k = risk.kemungkinanAwal;
                      const d = risk.dampakAwal;
                      const masterLevel = getMasterRiskLevel(k, d);
                      const inherentScore = k * d;
                      const badgeClasses = getRiskBadgeClasses(masterLevel);

                      return (
                        <tr key={risk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {risk.kodeRisiko}
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold">{risk.kodeOrganisasi}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 max-w-sm truncate">
                              {risk.pernyataanRisiko}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {risk.kategoriRisiko} • Sasaran: {risk.sasaranUnitKerja}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${badgeClasses.lightBg}`}>
                              {inherentScore} ({masterLevel})
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {risk.picPelaksana || '-'}
                            </div>
                            <div className="text-[10px] text-slate-400">Target: {risk.targetWaktuMitigasi}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              risk.statusKebutuhanMitigasi === 'Ditolak Admin'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                : risk.butuhMitigasi
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                            }`}>
                              {risk.statusKebutuhanMitigasi || (risk.butuhMitigasi ? 'Wajib Mitigasi' : 'Toleransi Wajar')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-[11px]">
                            {risk.statusKebutuhanMitigasi === 'Ditolak Admin' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                Ditolak Admin
                              </span>
                            ) : risk.statusWorkflow === 'Revisi' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                (revisi)
                              </span>
                            ) : (
                              <span className="text-slate-600 dark:text-slate-400">
                                {risk.statusWorkflow.replace(/_/g, ' ')}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onSelectRisk(risk)}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#009fe3] font-bold rounded-lg transition-colors cursor-pointer"
                                title="Lihat Detail Risiko"
                              >
                                Detail
                              </button>
                              {currentRole !== 'risk admin' && (risk.statusWorkflow === 'Revisi' || (risk.statusWorkflow as string) === 'revisi') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onOpenUpdateRiskModal) {
                                      onOpenUpdateRiskModal(risk);
                                    } else {
                                      onSelectRisk(risk);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 text-amber-900 dark:text-amber-200 font-bold rounded-lg transition-colors cursor-pointer border border-amber-300 dark:border-amber-700"
                                  title="Perbaiki / Edit Data Risiko (Revisi)"
                                >
                                  Update
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB CONTENT: RISIKO DITERIMA / TRANSFER / HINDARI (NON-MITIGASI) */}
      {activeTab === 'non-mitigasi' && (() => {
        const nonMitigasiRisks = risks.filter(
          (r) => r.statusWorkflow !== 'Selesai' && (r.jenisPenanganan === 'Diterima' || r.jenisPenanganan === 'Dihindari' || r.jenisPenanganan === 'Transfer' || (r.jenisPenanganan as any) === 'Ditransfer')
        );

        const filteredNonMitigasi = nonMitigasiRisks.filter((r) => {
          if (listDepartmentFilter !== 'ALL') {
            if (r.kodeOrganisasi !== listDepartmentFilter && r.namaOrganisasi !== listDepartmentFilter) {
              return false;
            }
          }
          if (listSearchKeyword.trim()) {
            const q = listSearchKeyword.toLowerCase();
            const matchKode = r.kodeRisiko?.toLowerCase().includes(q);
            const matchPernyataan = r.pernyataanRisiko?.toLowerCase().includes(q);
            const matchOrganisasi = r.namaOrganisasi?.toLowerCase().includes(q) || r.kodeOrganisasi?.toLowerCase().includes(q);
            const matchRencana = r.rencanaPenanganan?.toLowerCase().includes(q);
            if (!matchKode && !matchPernyataan && !matchOrganisasi && !matchRencana) {
              return false;
            }
          }
          return true;
        }).sort(sortRisksNewestFirst);

        return (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldOff className="w-4 h-4 text-amber-500" />
                  <span>Daftar Risiko Terdaftar: Diterima, Dihindari & Ditransfer</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-3.5 py-1.5 bg-[#009fe3] text-white rounded-xl text-xs font-bold hover:bg-[#0284c7] transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Input Risiko Baru</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                    <th className="py-2.5 px-3">Kode & Unit</th>
                    <th className="py-2.5 px-3">Pernyataan Risiko & Penyebab</th>
                    <th className="py-2.5 px-3 text-center">Matriks Inherent</th>
                    <th className="py-2.5 px-3">Strategi Penanganan</th>
                    <th className="py-2.5 px-3">Keterangan / Rencana</th>
                    <th className="py-2.5 px-3 text-center">Status Alur</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredNonMitigasi.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada data risiko dengan strategi Diterima / Dihindari / Ditransfer.
                      </td>
                    </tr>
                  ) : (
                    filteredNonMitigasi.map((risk) => (
                      <tr key={risk.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 align-top font-mono font-bold text-[#009fe3]">
                          <div>{risk.kodeRisiko}</div>
                          <div className="text-[10px] font-normal text-slate-500 font-sans">{risk.namaOrganisasi}</div>
                        </td>
                        <td className="py-3 px-3 align-top max-w-sm">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{risk.pernyataanRisiko}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Penyebab: {risk.penyebabRisiko}</div>
                        </td>
                        <td className="py-3 px-3 align-top text-center font-mono">
                          <span className="font-bold">L{risk.kemungkinanAwal} × D{risk.dampakAwal}</span>
                          <div className="text-[10px] text-slate-500">{risk.currentTingkatRisiko}</div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            risk.jenisPenanganan === 'Diterima' ? 'bg-blue-100 text-blue-800' :
                            risk.jenisPenanganan === 'Dihindari' ? 'bg-amber-100 text-amber-800' :
                            'bg-sky-100 text-sky-800'
                          }`}>
                            {risk.jenisPenanganan}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-top text-slate-600 dark:text-slate-300">
                          {risk.rencanaPenanganan || '-'}
                        </td>
                        <td className="py-3 px-3 align-top text-center">
                          {risk.statusWorkflow === 'Menunggu_Approval_VP' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-block">
                              Menunggu Review Atasan (VP)
                            </span>
                          ) : risk.statusWorkflow === 'Revisi' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 inline-block">
                              Perlu Revisi Unit
                            </span>
                          ) : risk.statusWorkflow === 'Tercatat_Final' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-block">
                              Disetujui Atasan / VP (Final)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 inline-block">
                              Final / Tercatat
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectRisk(risk)}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#009fe3] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Detail
                            </button>
                            {currentRole !== 'risk admin' && (risk.statusWorkflow === 'Revisi' || (risk.statusWorkflow as string) === 'revisi') && onOpenUpdateRiskModal && (
                              <button
                                type="button"
                                onClick={() => onOpenUpdateRiskModal(risk)}
                                className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 text-amber-900 dark:text-amber-200 font-bold rounded-lg transition-colors cursor-pointer border border-amber-300 dark:border-amber-700"
                                title="Perbaiki & Ajukan Ulang Risiko"
                              >
                                Perbaiki Data
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB CONTENT: RISIKO PERLU PERBAIKAN (REVISI) */}
      {activeTab === 'revisi' && (
        <div className="space-y-4">

          {/* Header Info Banner */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-500" />
                <span>Daftar Risiko Perlu Perbaikan (Revisi)</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950/70 text-amber-900 dark:text-yellow-200 text-[11px] font-bold border border-yellow-300 dark:border-yellow-800">
                {revisiRisks.length} Data Memerlukan Tindak Lanjut
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {revisiRisks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-9 h-9 text-[#009fe3] mx-auto opacity-70" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {currentRole === 'risk officer'
                    ? `Tidak ada risiko unit ${currentUser?.kodeUnitKerja || 'Anda'} yang membutuhkan perbaikan saat ini.`
                    : 'Tidak ada risiko yang membutuhkan perbaikan saat ini.'}
                </p>
                <p className="text-[11px] text-slate-500">Semua usulan risiko unit kerja telah diproses sesuai alur tata kelola Pusri.</p>
              </div>
            ) : (
              revisiRisks
                .sort(sortRisksNewestFirst)
                .map((risk) => {
                  const score = risk.inherentScore || ((risk.kemungkinanAwal || 1) * (risk.dampakAwal || 1));

                  return (
                    <div
                      key={risk.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs hover:border-[#009fe3] dark:hover:border-sky-700 transition-colors"
                    >
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            {risk.kodeRisiko}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border flex items-center gap-1 ${
                            risk.statusKebutuhanMitigasi === 'Ditolak Admin'
                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              : 'bg-yellow-100 dark:bg-yellow-950/70 text-amber-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800'
                          }`}>
                            <RotateCcw className={`w-3 h-3 ${risk.statusKebutuhanMitigasi === 'Ditolak Admin' ? 'text-rose-600' : 'text-amber-600 dark:text-yellow-400'}`} />
                            <span>{risk.statusKebutuhanMitigasi === 'Ditolak Admin' ? 'Ditolak Admin' : 'Perlu Perbaikan (Revisi)'}</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800">
                            {risk.namaOrganisasi}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                            Kategori: {risk.kategoriRisiko}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-yellow-50 dark:bg-yellow-950/50 text-amber-900 dark:text-yellow-200 font-bold border border-yellow-200 dark:border-yellow-800">
                            Inherent: {score} ({risk.tingkatRisikoAwal || 'Mod to High'})
                          </span>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {currentRole !== 'risk admin' && onOpenUpdateRiskModal && (
                            <button
                              type="button"
                              onClick={() => onOpenUpdateRiskModal(risk)}
                              className="px-4 py-2 bg-[#009fe3] hover:bg-[#0284c7] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              title="Buka Formulir untuk Memperbaiki & Mengajukan Ulang Risiko"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Perbaiki Data</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectRisk(risk)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                          >
                            Detail
                          </button>
                        </div>
                      </div>

                      {/* Catatan Arahan Revisi dari Reviewer / Approver */}
                      {(risk.reviewNotesVp || risk.approvalNotesAdmin) && (
                        <div className={`p-3.5 rounded-xl space-y-1 ${
                          risk.statusKebutuhanMitigasi === 'Ditolak Admin'
                            ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800'
                            : 'bg-yellow-50/90 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800/80'
                        }`}>
                        <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${
                          risk.statusKebutuhanMitigasi === 'Ditolak Admin'
                            ? 'text-rose-800 dark:text-rose-300'
                            : 'text-amber-900 dark:text-yellow-200'
                        }`}>
                            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${
                              risk.statusKebutuhanMitigasi === 'Ditolak Admin' ? 'text-rose-600' : 'text-amber-600 dark:text-yellow-400'
                            }`} />
                            <span>{risk.statusKebutuhanMitigasi === 'Ditolak Admin' ? 'Usulan Risiko Ditolak Admin:' : 'Catatan Arahan Perbaikan dari Reviewer / Approver:'}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 italic font-medium leading-relaxed pl-5 text-xs">
                            "{risk.reviewNotesVp || risk.approvalNotesAdmin}"
                          </p>
                        </div>
                      )}

                      {/* Rincian Lengkap Data yang Perlu Direvisi */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Pernyataan Risiko:</span>
                            <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug mt-0.5">{risk.pernyataanRisiko}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Akar Masalah / Penyebab:</span>
                            <p className="text-slate-700 dark:text-slate-300 mt-0.5">{risk.penyebabRisiko || '-'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">3. Uraian Dampak Risiko:</span>
                            <p className="text-slate-700 dark:text-slate-300 mt-0.5">{risk.dampakRisiko || '-'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">4. Pengendalian Existing:</span>
                            <p className="text-slate-700 dark:text-slate-300 mt-0.5">{risk.pengendalianExisting || '-'}</p>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">5. Rencana Tindakan Mitigasi:</span>
                            <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">{risk.rencanaPenanganan || '-'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Matriks:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                K: {risk.kemungkinanAwal} × D: {risk.dampakAwal} = {score}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Target Waktu:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{risk.targetWaktuMitigasi || 'TW 2'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Estimasi Biaya:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                Rp {Number(risk.biayaRencanaPengendalian || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">PIC Pelaksana:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block" title={risk.picPelaksana}>
                                {risk.picPelaksana || '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Status & Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Terakhir diperbarui: {new Date(risk.updatedDate || risk.createdDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {currentRole !== 'risk admin' && (
                          <span className="text-[10px] text-amber-700 dark:text-yellow-400 font-semibold italic">
                            Klik tombol &quot;Perbaiki Data&quot; di atas untuk memperbarui isian dan mengajukan ulang ke Atasan / VP
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / UBAH DATA RISIKO (WITH RICH PIC PELAKSANA SELECTION) */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl lg:max-w-5xl w-full p-5 sm:p-6 space-y-4 shadow-2xl my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#009fe3] dark:text-sky-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Tambah/Perbaharui Data Risiko
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Input sumber risiko berdasarkan data master, uraian peristiwa, penyebab, dampak, dan evaluasi matriks risiko.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDraftModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveDraftModal} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {draftModalError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                  {draftModalError}
                </div>
              )}

              {/* Identitas Pengusul Risiko (Mengatasnamakan Akun Resmi) */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/20 border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-3 flex-wrap shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#009fe3] text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-sky-300 dark:ring-sky-700">
                    {currentUser?.nama
                      ? currentUser.nama.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                      : currentRole === 'risk admin' ? 'DA' : currentRole === 'risk owner' ? 'MD' : 'FA'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#009fe3] dark:text-sky-400 uppercase tracking-wider block">
                      Mengatasnamakan Pengusul:
                    </span>
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                      {currentUser?.nama || (currentRole === 'risk admin' ? 'DAFFA ARI PRASETYA' : currentRole === 'risk owner' ? 'M DAVI RAMADHAN' : 'FAUZAN AL GHANIYYU')}
                      <span className="ml-1.5 font-mono text-[10px] text-sky-700 dark:text-sky-300">
                        [Badge {currentUser?.badge || (currentRole === 'risk admin' ? '0952' : currentRole === 'risk owner' ? '0951' : '0953')}]
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {currentUser?.jabatan || `${currentRole} - Risk Officer`}
                </span>
              </div>

              {/* 1. Sumber Risiko * (Menginput by data master sesuai taksonomi) */}
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
                        setIsDraftModalOpen(false);
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
                  value={draftForm.sumberRisiko}
                  onChange={(e) => setDraftForm({ ...draftForm, sumberRisiko: e.target.value })}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs cursor-pointer"
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
                  {draftForm.sumberRisiko && !activeSumberFlat.includes(draftForm.sumberRisiko) && (
                    <optgroup label="Data Terdaftar Lainnya">
                      <option value={draftForm.sumberRisiko}>{draftForm.sumberRisiko}</option>
                    </optgroup>
                  )}
                </select>
              </div>

              {/* 2. Nama Risiko * */}
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
                <input
                  type="text"
                  required
                  placeholder="Deskripsikan peristiwa risiko secara spesifik..."
                  value={draftForm.pernyataanRisiko}
                  onChange={(e) => setDraftForm({ ...draftForm, pernyataanRisiko: e.target.value })}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs"
                />
              </div>

              {/* 3. Penyebab * & 4. Deskripsi Dampak Risiko * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    rows={3}
                    required
                    placeholder="Uraikan faktor penyebab terjadinya risiko..."
                    value={draftForm.penyebabRisiko}
                    onChange={(e) => setDraftForm({ ...draftForm, penyebabRisiko: e.target.value })}
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
                      title="Uraian dampak operasional, finansial, keselamatan, reputasi"
                    >
                      ⓘ
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="Uraikan konsekuensi dampak jika risiko terjadi..."
                    value={draftForm.dampakRisiko}
                    onChange={(e) => setDraftForm({ ...draftForm, dampakRisiko: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* 5. Pengendalian Risiko Existing * */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Pengendalian Risiko Existing *
                  </label>
                  <span
                    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold cursor-help"
                    title="Langkah kontrol / SOP yang saat ini sudah berjalan"
                  >
                    ⓘ
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: Inspeksi harian, SOP berkala..."
                  value={draftForm.pengendalianExisting}
                  onChange={(e) => setDraftForm({ ...draftForm, pengendalianExisting: e.target.value })}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Likelihood / Kemungkinan Terjadinya Risiko (Matriks Pusri 5x5) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#009fe3]" />
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Likelihood / Kemungkinan Terjadinya Risiko (Matriks 5x5)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {draftForm.kemungkinanAwal > 0 ? `Level ${draftForm.kemungkinanAwal} Terpilih` : 'Dapat dipilih atau dikosongkan'}
                  </span>
                </div>
                <RiskLikelihoodConsequenceTable
                  likelihood={draftForm.kemungkinanAwal}
                  consequence={draftForm.dampakAwal}
                  onChangeLikelihood={(level) => setDraftForm(prev => ({ ...prev, kemungkinanAwal: level }))}
                  showLikelihood={true}
                  showConsequence={false}
                  showScoreSummary={true}
                  allowUnselectLikelihood={true}
                  namePrefix="identifikasi_draft_modal_lik"
                />
              </div>

              {/* Kriteria Dampak Risiko Sesuai Data Master Pusri (Pilih 1 Level Kriteria) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <KriteriaDampakSection
                  selectedCriterionKey={draftForm.kriteriaDampakKey}
                  selectedLevel={draftForm.kriteriaDampakKey ? Number(draftForm.kriteriaDampakKey.split('_')[1]) : undefined}
                  onSelectCriterion={(key, level, description, categoryTitle) => {
                    setDraftForm((prev) => ({
                      ...prev,
                      kriteriaDampakKey: key,
                      kriteriaDampakTitle: categoryTitle,
                      dampakAwal: level,
                      dampakRisiko: !prev.dampakRisiko || prev.dampakRisiko.trim().length === 0
                        ? description
                        : prev.dampakRisiko
                    }));
                  }}
                  onClearCriterion={() => {
                    setDraftForm((prev) => ({
                      ...prev,
                      kriteriaDampakKey: '',
                      kriteriaDampakTitle: '',
                      dampakAwal: 0
                    }));
                  }}
                  namePrefix="identifikasi_draft_modal"
                />
              </div>

              {/* Mitigasi Risk Fields (Kondisional: jika MITIGASI maka tampil rincian lengkap kuesioner & matriks expected; jika tidak maka tampil data atas) */}
              <MitigasiRiskFields
                jenisPenanganan={draftForm.jenisPenanganan}
                onChangeJenisPenanganan={(strat) => setDraftForm(prev => ({ ...prev, jenisPenanganan: strat }))}
                keteranganRiskTreatment={draftForm.keteranganRiskTreatment || ''}
                onChangeKeteranganRiskTreatment={(val) => setDraftForm(prev => ({ ...prev, keteranganRiskTreatment: val }))}
                rencanaPengendalian={draftForm.rencanaPengendalian || ''}
                onChangeRencanaPengendalian={(val) => setDraftForm(prev => ({ ...prev, rencanaPengendalian: val }))}
                expectedLikelihood={draftForm.expectedKemungkinan || 0}
                onChangeExpectedLikelihood={(lvl) => setDraftForm(prev => ({ ...prev, expectedKemungkinan: lvl }))}
                expectedConsequence={draftForm.expectedDampak || 0}
                onChangeExpectedConsequence={(lvl) => setDraftForm(prev => ({ ...prev, expectedDampak: lvl }))}
                biaya={draftForm.biayaRencanaPengendalian || 0}
                onChangeBiaya={(amt) => setDraftForm(prev => ({ ...prev, biayaRencanaPengendalian: amt }))}
                jenisAnggaran={draftForm.jenisAnggaran || 'Investasi Rutin'}
                onChangeJenisAnggaran={(val) => setDraftForm(prev => ({ ...prev, jenisAnggaran: val }))}
                pertanyaanInvestasi={draftForm.pertanyaanInvestasiRutin || {}}
                onChangePertanyaanInvestasi={(updated) => setDraftForm(prev => ({ ...prev, pertanyaanInvestasiRutin: updated }))}
                bidangFungsi={(draftForm.bidangFungsiRisiko as any) || 'Operasional'}
                onChangeBidangFungsi={(cat) => setDraftForm(prev => ({ ...prev, bidangFungsiRisiko: cat, kategoriRisiko: cat }))}
                subBidang={draftForm.subBidangRisiko || ''}
                onChangeSubBidang={(val) => setDraftForm(prev => ({ ...prev, subBidangRisiko: val }))}
                bidangProyek={draftForm.bidangProyek || ''}
                onChangeBidangProyek={(val) => setDraftForm(prev => ({ ...prev, bidangProyek: val }))}
                namePrefix="identifikasi_draft_modal"
              />

              {/* INFORMASI PENETAPAN PIC OLEH ADMIN */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <Users className="w-4 h-4 text-[#009fe3] dark:text-sky-400 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Penetapan PIC Pelaksana & PIC Pengendali:</strong> Ditentukan dan ditugaskan secara resmi oleh <strong>Admin Manajemen Risiko</strong> pada tahap persetujuan final korporat (bukan oleh Unit Kerja / VP).
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleResetDraftForm}
                  className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Bersihkan Form</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDraftModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Save changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
