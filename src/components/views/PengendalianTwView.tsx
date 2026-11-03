import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  TrendingDown, 
  TrendingUp,
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  DollarSign, 
  Save, 
  Activity,
  Layers,
  ShieldAlert,
  Lock,
  CheckCircle,
  Building2,
  Search,
  RotateCcw,
  RotateCw,
  UserCheck,
  ArrowRight,
  UserPlus,
  Filter,
  ChevronRight,
  FileText,
  BadgeAlert,
  ClipboardList,
  PlayCircle,
  Edit3,
  Download,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { PusriRisk, QuarterlyControl, UserRole, Department, RiskLevel, UserAccount } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';
import { getMasterRiskLevel, getFirstFinishedQuarter, isQuarterLocked, sortRisksNewestFirst, isRiskAssignedToUserDept } from '../../utils/riskMatrix';
import { downloadQuarterlyControlPdf, downloadRiskControlExcelCsv } from '../../utils/downloadRiskReport';
import { AccessDeniedBanner } from './AccessDeniedBanner';
import { DEFAULT_PIC_PELAKSANA_OPTIONS } from './IdentifikasiView';
import { EvaluasiCarryOverView } from './EvaluasiCarryOverView';

interface PengendalianTwViewProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  risks: PusriRisk[];
  departments?: Department[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onSelectRisk: (risk: PusriRisk) => void;
  onNavigateNext?: (tab: string, riskId?: string) => void;
  initialSelectedRiskId?: string | null;
  initialMainTab?: 'pemantauan-tw' | 'evaluasi-akhir';
}

export const PengendalianTwView: React.FC<PengendalianTwViewProps> = ({
  currentRole,
  currentUser,
  risks,
  departments = [],
  onRiskUpdated,
  onSelectRisk,
  onNavigateNext,
  initialSelectedRiskId,
  initialMainTab = 'pemantauan-tw'
}) => {
  // Filter risks yang masuk ke dalam jalur mitigasi / pengendalian - Data baru selalu berada di atas (paling atas)
  // Risiko Dihindari, Diterima, dan Transfer tidak masuk ke Pengendalian & Evaluasi Admin
  const eligibleRisks = risks.filter(
    (r) =>
      (r.jenisPenanganan === 'Mitigasi' || !r.jenisPenanganan) &&
      r.statusWorkflow !== 'Tercatat_Final' &&
      (r.statusWorkflow === 'Disetujui_Dalam_Pengendalian' ||
        r.statusWorkflow === 'Selesai' ||
        r.statusWorkflow === 'Carry_Over' ||
        (r.pengendalianTriwulan && r.pengendalianTriwulan.length > 0))
  ).sort(sortRisksNewestFirst);

  // Fallback jika belum ada risiko disetujui: sertakan hanya risiko berjenis mitigasi yang sudah masuk alur pengendalian
  const mitigationRisks = (eligibleRisks.length > 0
    ? eligibleRisks
    : risks.filter(
        (r) =>
          (r.jenisPenanganan === 'Mitigasi' || !r.jenisPenanganan) &&
          r.statusWorkflow !== 'Tercatat_Final' &&
          r.statusWorkflow !== 'Menunggu_Approval_VP' &&
          r.statusWorkflow !== 'Menunggu_Approval_Admin'
      )).sort(sortRisksNewestFirst);

  // Sub-Modul Navigasi: 'pemantauan-tw' vs 'evaluasi-akhir' (Penggabungan Evaluasi Risiko ke Pengendalian TW)
  const [mainSectionTab, setMainSectionTab] = useState<'pemantauan-tw' | 'evaluasi-akhir'>(
    initialMainTab || 'pemantauan-tw'
  );
  const [carryOverRiskId, setCarryOverRiskId] = useState<string | null>(null);

  useEffect(() => {
    if (initialMainTab) {
      setMainSectionTab(initialMainTab);
    }
  }, [initialMainTab]);

  const handleNavigateFromEvaluasi = (tab: string, riskId?: string) => {
    if (tab === 'pengendalian-tw' || !tab) {
      setMainSectionTab('pemantauan-tw');
      setActiveQuarter('TW 1');
      if (riskId) {
        const match = risks.find((r) => r.id === riskId);
        if (match) setSelectedRisk(match);
      }
    } else {
      onNavigateNext?.(tab, riskId);
    }
  };

  // Filter Toolbar States
  const [filterTw, setFilterTw] = useState<'ALL' | 'TW 1' | 'TW 2' | 'TW 3' | 'TW 4'>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Aktif' | 'Belum_Selesai' | 'Selesai' | 'Carry_Over'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Aturan Khusus Role Risk Officer: Default memfilter hanya risiko yang di-assign ke departemennya
  const [filterMyDeptOnly, setFilterMyDeptOnly] = useState<boolean>(currentRole === 'risk officer');

  // Selected Risk in Queue - Prioritaskan risiko yang di-assign ke departemen pengguna untuk Risk Officer
  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(() => {
    if (initialSelectedRiskId) {
      const match = mitigationRisks.find((r) => r.id === initialSelectedRiskId);
      if (match) return match;
    }
    if (currentRole === 'risk officer') {
      const myMatch = mitigationRisks.find((r) => isRiskAssignedToUserDept(r, currentUser));
      if (myMatch) return myMatch;
    }
    return mitigationRisks[0] || null;
  });

  // Synchronize when initialSelectedRiskId changes from parent navigation
  useEffect(() => {
    if (initialSelectedRiskId) {
      const match = mitigationRisks.find((r) => r.id === initialSelectedRiskId);
      if (match) {
        setSelectedRisk(match);
        const finQuarter = getFirstFinishedQuarter(match);
        if (match.statusWorkflow === 'Selesai' && finQuarter) {
          setActiveQuarter(finQuarter.triwulan);
        } else {
          setActiveQuarter('TW 1');
        }
      }
    }
  }, [initialSelectedRiskId]);

  // Keep selectedRisk in sync with risks prop whenever data updates
  useEffect(() => {
    if (selectedRisk) {
      const refreshed = mitigationRisks.find((r) => r.id === selectedRisk.id);
      if (refreshed) {
        setSelectedRisk(refreshed);
      } else {
        setSelectedRisk(mitigationRisks[0] || null);
      }
    } else if (mitigationRisks.length > 0) {
      setSelectedRisk(mitigationRisks[0]);
    }
  }, [risks]);

  // Active Quarter tab in Workspace (TW 1 - TW 4)
  const [activeQuarter, setActiveQuarter] = useState<'TW 1' | 'TW 2' | 'TW 3' | 'TW 4'>('TW 1');

  // Form State: Realisasi Pengendalian Triwulan
  const [realisasiKegiatan, setRealisasiKegiatan] = useState('');
  const [progressPersen, setProgressPersen] = useState<number>(75);
  const [adminProgressPersen, setAdminProgressPersen] = useState<number>(75);
  const [statusRealisasi, setStatusRealisasi] = useState<'On Track' | 'Delayed' | 'Completed' | 'Pending'>('On Track');
  const [biayaTerpakai, setBiayaTerpakai] = useState<number>(50000000);
  const [kendalaDanTindakLanjut, setKendalaDanTindakLanjut] = useState('');
  const [isSavingRealization, setIsSavingRealization] = useState(false);

  // Form State: Usulan Tingkat Risiko Pasca-Pengendalian oleh Risk Officer (PIC)
  const [officerKemungkinanUsulan, setOfficerKemungkinanUsulan] = useState<number>(2);
  const [officerDampakUsulan, setOfficerDampakUsulan] = useState<number>(3);
  const [officerCatatanUsulan, setOfficerCatatanUsulan] = useState<string>('');

  // Form State: Evaluasi Hasil Pengendalian & Status Risiko oleh Admin
  const [evalKemungkinanRes, setEvalKemungkinanRes] = useState<number>(2);
  const [evalDampakRes, setEvalDampakRes] = useState<number>(3);
  const [evalCatatanAdmin, setEvalCatatanAdmin] = useState<string>('');
  const [adminKesimpulanPenilaian, setAdminKesimpulanPenilaian] = useState<'Sesuai_Usulan_Officer' | 'Disesuaikan_Lebih_Tinggi' | 'Disesuaikan_Lebih_Rendah' | 'Disetujui_Admin'>('Sesuai_Usulan_Officer');
  const [adminCatatanPenilaianRisiko, setAdminCatatanPenilaianRisiko] = useState<string>('');
  const [evalDecision, setEvalDecision] = useState<'Pengendalian_Lanjutan' | 'Selesai' | 'Carry_Over'>('Pengendalian_Lanjutan');

  // Form State: Penentuan Kembali PIC & Rencana Tindakan Lanjutan (Hanya Menentukan Departemen Sesuai Approval Admin)
  const [evalTargetTwLanjutan, setEvalTargetTwLanjutan] = useState<'TW 2' | 'TW 3' | 'TW 4' | 'Carry Over'>('TW 2');
  const [evalDeptPicBaru, setEvalDeptPicBaru] = useState<string>('');
  const [evalPengendalianLanjutanDesc, setEvalPengendalianLanjutanDesc] = useState<string>('');
  const [isCarryOverFormOpen, setIsCarryOverFormOpen] = useState(false);

  // Form State: Parameter Eskalasi Carry Over
  const [carryOverAlasan, setCarryOverAlasan] = useState<string>('');
  const [carryOverRekomendasi, setCarryOverRekomendasi] = useState<string>('');

  // Submit Feedback Notices
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);
  const [isAccSubmitting, setIsAccSubmitting] = useState(false);
  const [accNotes, setAccNotes] = useState('');
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);

  const twOrder = ['TW 1', 'TW 2', 'TW 3', 'TW 4'] as const;

  // Calculate default next quarter based on current active quarter
  const getNextQuarterName = (currentTw: 'TW 1' | 'TW 2' | 'TW 3' | 'TW 4'): 'TW 2' | 'TW 3' | 'TW 4' | 'Carry Over' => {
    switch (currentTw) {
      case 'TW 1': return 'TW 2';
      case 'TW 2': return 'TW 3';
      case 'TW 3': return 'TW 4';
      case 'TW 4': return 'Carry Over';
    }
  };

  const isCarryOverDecision =
    evalDecision === 'Carry_Over' ||
    (evalDecision === 'Pengendalian_Lanjutan' && evalTargetTwLanjutan === 'Carry Over');

  // Sync inputs whenever selectedRisk or activeQuarter changes
  useEffect(() => {
    if (!selectedRisk) return;
    const existingTw = selectedRisk.pengendalianTriwulan?.find((q) => q.triwulan === activeQuarter);
    const picReported = existingTw?.progressFisikPic ?? existingTw?.progressPersen ?? selectedRisk.progressPelaksanaanTerakhir ?? (selectedRisk.pelaksanaanTindakan?.[0]?.progressPersen ?? 0);

    // Set next quarter default
    const nextTw = getNextQuarterName(activeQuarter);
    setEvalTargetTwLanjutan(nextTw);

    if (existingTw) {
      setRealisasiKegiatan(existingTw.realisasiKegiatan || '');
      setProgressPersen(existingTw.progressFisikPic ?? existingTw.progressPersen ?? picReported);
      setAdminProgressPersen(existingTw.progresPengerjaanAdmin ?? existingTw.progressPersen ?? 75);
      setStatusRealisasi(existingTw.statusPengendalian || 'On Track');
      setBiayaTerpakai(existingTw.realisasiBiaya ?? Math.round(selectedRisk.biayaRencanaPengendalian * 0.25));
      setKendalaDanTindakLanjut(existingTw.kendalaDanTindakLanjut || '');

      const defaultOfficerK = existingTw.kemungkinanUsulanPic ?? existingTw.kemungkinanResidual ?? Math.max(1, selectedRisk.kemungkinanAwal - 1);
      const defaultOfficerD = existingTw.dampakUsulanPic ?? existingTw.dampakResidual ?? selectedRisk.dampakAwal;
      setOfficerKemungkinanUsulan(defaultOfficerK);
      setOfficerDampakUsulan(defaultOfficerD);
      setOfficerCatatanUsulan(existingTw.catatanUsulanPic || '');

      setEvalKemungkinanRes(existingTw.kemungkinanResidual ?? defaultOfficerK);
      setEvalDampakRes(existingTw.dampakResidual ?? defaultOfficerD);
      setAdminKesimpulanPenilaian(existingTw.kesimpulanPenilaianAdmin || 'Sesuai_Usulan_Officer');
      setAdminCatatanPenilaianRisiko(existingTw.catatanPenilaianRisikoAdmin || existingTw.catatanEvaluasiAdmin || '');
    } else {
      setRealisasiKegiatan(`Realisasi mitigasi ${activeQuarter}: kegiatan pemantauan dan mitigasi risiko.`);
      setProgressPersen(picReported || 50);
      setAdminProgressPersen(picReported || 75);
      setStatusRealisasi('On Track');
      setBiayaTerpakai(Math.round((selectedRisk.biayaRencanaPengendalian || 100000000) * 0.25));
      setKendalaDanTindakLanjut('');

      const defaultK = Math.max(1, selectedRisk.kemungkinanAwal - 1);
      const defaultD = Math.max(1, selectedRisk.dampakAwal - 1);
      setOfficerKemungkinanUsulan(defaultK);
      setOfficerDampakUsulan(defaultD);
      setOfficerCatatanUsulan(`Berdasarkan capaian mitigasi ${activeQuarter}, kami mengusulkan tingkat risiko disesuaikan menjadi ${getMasterRiskLevel(defaultK, defaultD)}.`);

      setEvalKemungkinanRes(defaultK);
      setEvalDampakRes(defaultD);
      setAdminKesimpulanPenilaian('Sesuai_Usulan_Officer');
      setAdminCatatanPenilaianRisiko('');
    }

    // Default decision based on risk state
    if (selectedRisk.statusWorkflow === 'Selesai') {
      setEvalDecision('Selesai');
    } else if (selectedRisk.statusWorkflow === 'Carry_Over') {
      setEvalDecision('Carry_Over');
    } else {
      setEvalDecision('Pengendalian_Lanjutan');
    }

    // Reset default PIC Lanjutan (Hanya Menentukan Departemen Sesuai Approval Admin)
    const initialDept = selectedRisk.picDepartemen || selectedRisk.picPelaksana || selectedRisk.namaOrganisasi || departments[0]?.nama || '';
    setEvalDeptPicBaru(initialDept);
    setEvalCatatanAdmin(`Evaluasi pemantauan hasil pengendalian risiko ${selectedRisk.kodeRisiko} pada periode ${activeQuarter}.`);
    setEvalPengendalianLanjutanDesc(`Tindak lanjut mitigasi percepatan untuk periode ${nextTw}.`);
    setCarryOverAlasan('Risiko operasional memerlukan mitigasi berkelanjutan lintas tahun buku operasional.');
    setCarryOverRekomendasi(`Direkomendasikan agar komite risiko memasukkan risiko ${selectedRisk.kodeRisiko} ke RKAP Risiko 2027.`);
    setNotice(null);
  }, [selectedRisk, activeQuarter]);

  // Cek apakah risiko yang dipilih saat ini di-assign ke departemen user yang login
  const isAssignedToUser = isRiskAssignedToUserDept(selectedRisk, currentUser, activeQuarter);

  // Cek penguncian triwulan jika sudah tercapai Low Risk di triwulan sebelumnya
  // KETENTUAN KHUSUS: Risiko Carry Over yang dimulai pengendalian kembali di tahun berikutnya TIDAK terkunci oleh riwayat lama
  const firstFinishedTw = getFirstFinishedQuarter(selectedRisk);
  const isTwLocked = selectedRisk?.statusWorkflow === 'Carry_Over'
    ? false
    : isQuarterLocked(selectedRisk, activeQuarter);
  const existingTwRecord = selectedRisk?.pengendalianTriwulan?.find((q) => q.triwulan === activeQuarter);

  // Cek apakah triwulan aktif ini sudah di-ACC oleh Admin
  const isQuarterAcced = Boolean(existingTwRecord?.isPicAcc || existingTwRecord?.statusKeputusan);

  // KETENTUAN KHUSUS RISK OFFICER:
  // Jika triwulan aktif telah di-ACC oleh Admin, maka Risk Officer TIDAK DAPAT menginput lagi TW itu dan harus lanjut ke TW selanjutnya
  const isOfficerQuarterLocked = currentRole === 'risk officer' && isQuarterAcced;
  const isOfficerInputDisabled = isTwLocked || !isAssignedToUser || isOfficerQuarterLocked;
  const nextTw = getNextQuarterName(activeQuarter);

  // Status selesai pengendalian triwulan: jika statusWorkflow 'Selesai', atau triwulan aktif 'Selesai' / 'Completed', atau ada triwulan terdahulu yang selesai (Low Risk)
  const isRiskControlFinished = selectedRisk
    ? selectedRisk.statusWorkflow === 'Selesai' ||
      existingTwRecord?.statusKeputusan === 'Selesai' ||
      existingTwRecord?.statusPengendalian === 'Completed' ||
      Boolean(firstFinishedTw)
    : false;

  // Formulir triwulan ini telah diselesaikan (Selesai Dikendalikan)
  // Memastikan unduh dokumen hanya tersedia pada form triwulan yang telah diselesaikan
  const isCurrentTwFinished = existingTwRecord
    ? (existingTwRecord.statusKeputusan === 'Selesai' || 
       existingTwRecord.statusPengendalian === 'Completed' ||
       (selectedRisk?.statusWorkflow === 'Selesai' && activeQuarter === firstFinishedTw?.triwulan))
    : false;

  // Memulai / mereset siklus triwulan tahun baru untuk risiko Carry Over
  const handleResetCycleForNewYear = async () => {
    if (!selectedRisk) return;
    const targetYear = selectedRisk.carryOverInfo?.targetTahun || selectedRisk.tahun || 2027;
    const existingQuarters = selectedRisk.pengendalianTriwulan || [];
    const archivedHistory = selectedRisk.carryOverInfo?.riwayatTahunSebelumnya || (existingQuarters.length > 0 ? existingQuarters : []);

    const freshTw1: QuarterlyControl = {
      triwulan: 'TW 1',
      realisasiKegiatan: `Pengendalian Ulang Periode RKAP ${targetYear} (Status: Carry Over). Memulai pemantauan mitigasi triwulan 1.`,
      realisasiBiaya: 0,
      progressPersen: 0,
      progressFisikPic: 0,
      progresPengerjaanAdmin: 0,
      kemungkinanResidual: selectedRisk.kemungkinanAwal,
      dampakResidual: selectedRisk.dampakAwal,
      tingkatResidual: selectedRisk.tingkatRisikoAwal,
      statusPengendalian: 'On Track',
      kendalaDanTindakLanjut: `Risiko Carry Over dilanjutkan ke siklus tahun ${targetYear}. Memulai pemantauan ulang triwulan 1.`,
      updatedAt: new Date().toISOString()
    };

    try {
      const updated = await PusriApiClient.updateRisk(
        selectedRisk.id,
        {
          tahun: targetYear,
          statusWorkflow: 'Carry_Over',
          isPengendalianUlangCarryOver: true,
          pengendalianTriwulan: [freshTw1],
          carryOverInfo: {
            targetTahun: targetYear,
            alasanCarryOver: selectedRisk.carryOverInfo?.alasanCarryOver || 'Pengendalian ulang Carry Over tahun berikutnya',
            rekomendasiKomite: selectedRisk.carryOverInfo?.rekomendasiKomite || 'Disetujui komite risiko untuk pengendalian ulang',
            approvalCarryOverBy: selectedRisk.carryOverInfo?.approvalCarryOverBy || (currentUser?.nama || 'Admin Korporat'),
            tanggalCarryOver: selectedRisk.carryOverInfo?.tanggalCarryOver || new Date().toISOString(),
            isPengendalianUlangActive: true,
            tahunPengendalianUlang: targetYear,
            tanggalMulaiPengendalianUlang: new Date().toISOString(),
            riwayatTahunSebelumnya: archivedHistory
          },
          targetWaktuMitigasi: 'TW 1',
          progressPelaksanaanTerakhir: 0
        },
        currentUser?.nama || 'Admin Korporat',
        currentRole
      );
      if (updated) {
        onRiskUpdated(updated);
        setSelectedRisk(updated);
        setActiveQuarter('TW 1');
        setNotice({
          type: 'success',
          text: `✅ Pengendalian ulang tahun ${targetYear} untuk risiko ${selectedRisk.kodeRisiko} berhasil dimulai dari TW 1 dengan status : Carry Over!`
        });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Gagal memulai siklus triwulan.' });
    }
  };

  // Progres fisik otentik dari PIC
  const picProgressPersen = React.useMemo(() => {
    if (!selectedRisk) return 0;
    const existing = selectedRisk.pengendalianTriwulan?.find((q) => q.triwulan === activeQuarter);
    return existing?.progressFisikPic ?? existing?.progressPersen ?? selectedRisk.progressPelaksanaanTerakhir ?? (selectedRisk.pelaksanaanTindakan?.[0]?.progressPersen ?? 0);
  }, [selectedRisk, activeQuarter]);

  // Hitung skor & level residual evaluasi resmi Admin
  const calculatedEvalScore = evalKemungkinanRes * evalDampakRes;
  const calculatedEvalLevel: RiskLevel = getMasterRiskLevel(evalKemungkinanRes, evalDampakRes);

  // Hitung usulan tingkat risiko dari Risk Officer
  const calculatedOfficerScore = officerKemungkinanUsulan * officerDampakUsulan;
  const calculatedOfficerLevel: RiskLevel = getMasterRiskLevel(officerKemungkinanUsulan, officerDampakUsulan);

  // Nilai usulan tingkat risiko yang berlaku pada triwulan aktif
  const activeTwProposedK = existingTwRecord?.kemungkinanUsulanPic ?? officerKemungkinanUsulan;
  const activeTwProposedD = existingTwRecord?.dampakUsulanPic ?? officerDampakUsulan;
  const activeTwProposedLevel: RiskLevel = existingTwRecord?.tingkatUsulanPic ?? getMasterRiskLevel(activeTwProposedK, activeTwProposedD);
  const activeTwProposedScore = activeTwProposedK * activeTwProposedD;
  const activeTwProposedNotes = existingTwRecord?.catatanUsulanPic || officerCatatanUsulan;

  // Tombol aksi cepat: Admin menyetujui sesuai usulan tingkat risiko Risk Officer
  const handleApplyOfficerProposalToAdmin = () => {
    setEvalKemungkinanRes(activeTwProposedK);
    setEvalDampakRes(activeTwProposedD);
    setAdminKesimpulanPenilaian('Sesuai_Usulan_Officer');
    const autoNote = `Penilaian Admin: Menyetujui usulan tingkat risiko dari Risk Officer (${activeTwProposedLevel}). Berdasarkan verifikasi kemajuan fisik (${picProgressPersen}%) dan efektivitas tindakan mitigasi lapangan, penurunan risiko ke tingkat ${activeTwProposedLevel} (Skor: ${activeTwProposedScore}) dinilai objektif dan valid.`;
    setAdminCatatanPenilaianRisiko(autoNote);
    if (!evalCatatanAdmin || evalCatatanAdmin.includes('Evaluasi pemantauan')) {
      setEvalCatatanAdmin(autoNote);
    }
  };

  // ACC Laporan PIC oleh Admin
  const handleAccPicReport = async (notes?: string) => {
    if (!selectedRisk) return;
    setIsAccSubmitting(true);
    setNotice(null);
    try {
      const res = await PusriApiClient.accPelaksanaanPic({
        riskId: selectedRisk.id,
        riskData: selectedRisk,
        triwulan: activeQuarter,
        catatanAdmin: notes || accNotes.trim() || 'Laporan pelaksanaan pengendalian dari PIC telah diverifikasi dan di-ACC resmi oleh Admin.',
        actor: currentUser?.nama || 'DAFFA ARI PRASETYA',
        role: 'risk admin'
      });
      if (res.success && res.data) {
        onRiskUpdated(res.data);
        setSelectedRisk(res.data);
        // After PIC approval, admin must approve the progress card before evaluation.
        setIsAccModalOpen(false);
        setAccNotes('');
        setNotice({
          type: 'success',
          text: `✅ Laporan pengendalian PIC ${activeQuarter} untuk risiko ${res.data.kodeRisiko} telah di-ACC. Selanjutnya, ACC progres pengerjaan ${activeQuarter} sebelum membuka evaluasi.`
        });

        // Direct admin to the next required step.
        setTimeout(() => {
          document.getElementById('progress-pengerjaan-admin')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
      } else {
        const errorText = res.message?.includes('<!doctype') || res.message?.includes('not valid JSON')
          ? 'Koneksi backend dialihkan ke penyimpanan lokal korporat.'
          : res.message;
        setNotice({
          type: 'error',
          text: errorText || 'Gagal melakukan ACC laporan pengendalian PIC.'
        });
      }
    } catch (err: any) {
      const errorText = err?.message?.includes('<!doctype') || err?.message?.includes('not valid JSON')
        ? 'Koneksi backend dialihkan ke penyimpanan lokal korporat.'
        : err?.message;
      setNotice({
        type: 'error',
        text: errorText || 'Terjadi kesalahan sistem saat melakukan ACC laporan PIC.'
      });
    } finally {
      setIsAccSubmitting(false);
    }
  };

  // Hitung jumlah risiko yang di-assign ke departemen user yang login
  const myAssignedRisksCount = mitigationRisks.filter((r) => isRiskAssignedToUserDept(r, currentUser)).length;

  // Filter list of risks based on toolbar filters
  const filteredRisks = mitigationRisks.filter((r) => {
    // Aturan RBAC: Untuk Risk Officer, jika opsi 'Hanya Departemen Saya' aktif, hanya tampilkan yang di-assign ke departemennya
    if (currentRole === 'risk officer' && filterMyDeptOnly) {
      if (!isRiskAssignedToUserDept(r, currentUser)) return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = r.kodeRisiko.toLowerCase().includes(q) ||
                    r.pernyataanRisiko.toLowerCase().includes(q) ||
                    r.namaOrganisasi.toLowerCase().includes(q) ||
                    (r.picDepartemen && r.picDepartemen.toLowerCase().includes(q)) ||
                    (r.picPelaksana && r.picPelaksana.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Filter department
    if (filterDept !== 'ALL' && r.kodeOrganisasi !== filterDept) {
      return false;
    }

    // Filter TW target or recorded
    if (filterTw !== 'ALL') {
      const isTarget = r.targetWaktuMitigasi === filterTw;
      const hasTw = r.pengendalianTriwulan?.some((q) => q.triwulan === filterTw);
      if (!isTarget && !hasTw) return false;
    }

    // Filter status
    if (filterStatus === 'Selesai' && r.statusWorkflow !== 'Selesai') return false;
    if (filterStatus === 'Carry_Over' && r.statusWorkflow !== 'Carry_Over') return false;
    if (filterStatus === 'Aktif' && r.statusWorkflow !== 'Disetujui_Dalam_Pengendalian') return false;
    if (filterStatus === 'Belum_Selesai') {
      if (r.statusWorkflow === 'Selesai') return false;
    }

    return true;
  }).sort(sortRisksNewestFirst);

  const handleSelectRisk = (risk: PusriRisk) => {
    setSelectedRisk(risk);
    // Jika risiko telah berstatus Selesai, arahkan langsung ke formulir Triwulan yang telah diselesaikan
    const finQuarter = getFirstFinishedQuarter(risk);
    if (risk.statusWorkflow === 'Selesai' && finQuarter) {
      setActiveQuarter(finQuarter.triwulan);
      return;
    }
    const quarters: ('TW 1' | 'TW 2' | 'TW 3' | 'TW 4')[] = ['TW 1', 'TW 2', 'TW 3', 'TW 4'];
    let targetTw: 'TW 1' | 'TW 2' | 'TW 3' | 'TW 4' = 'TW 1';

    if (currentRole === 'risk officer') {
      // Untuk Risk Officer: otomatis pilih triwulan pertama yang BELUM di-ACC oleh Admin agar langsung siap diisi
      for (const q of quarters) {
        const qRec = risk.pengendalianTriwulan?.find((c) => c.triwulan === q);
        if (!qRec?.isPicAcc) {
          targetTw = q;
          break;
        }
      }
    } else {
      // Untuk Risk Admin: prioritaskan triwulan yang belum selesai dievaluasi admin
      for (const q of quarters) {
        const qRec = risk.pengendalianTriwulan?.find((c) => c.triwulan === q);
        if (!qRec?.statusKeputusan) {
          targetTw = q;
          break;
        }
      }
    }
    setActiveQuarter(targetTw);
  };

  // Navigasi Tab Triwulan dengan validasi: harus mengisi evaluasi TW sebelumnya sebelum lanjut ke TW berikutnya
  const handleQuarterTabClick = (tw: 'TW 1' | 'TW 2' | 'TW 3' | 'TW 4') => {
    if (tw === activeQuarter) return;

    // Admin must complete every approval stage in earlier quarters before proceeding.
    if (currentRole === 'risk admin') {
      const targetIdx = twOrder.indexOf(tw);
      const pendingPrevTw = twOrder.slice(0, targetIdx).find((prevTw) => {
        const prevRec = selectedRisk?.pengendalianTriwulan?.find((q) => q.triwulan === prevTw);
        return !prevRec?.statusKeputusan;
      });

      if (pendingPrevTw) {
        const prevRec = selectedRisk?.pengendalianTriwulan?.find((q) => q.triwulan === pendingPrevTw);
        const nextStep = !prevRec?.isPicAcc
          ? 'ACC laporan PIC'
          : !prevRec.isAdminProgressAcc
          ? 'ACC progres pengerjaan Admin'
          : 'evaluasi Admin';
        setNotice({
          type: 'error',
          text: `⚠️ Tidak dapat langsung beralih ke ${tw}. Selesaikan tahap ${nextStep} pada ${pendingPrevTw} terlebih dahulu.`
        });
        document.getElementById(!prevRec?.isPicAcc
          ? 'status-acc-laporan-pic'
          : !prevRec.isAdminProgressAcc
          ? 'progress-pengerjaan-admin'
          : 'evaluasi-admin-form'
        )?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // Untuk Risk Officer: Tidak dapat melompati triwulan yang belum di-ACC oleh Admin
    if (currentRole === 'risk officer') {
      const targetIdx = twOrder.indexOf(tw);
      const unAccPrevTw = twOrder.slice(0, targetIdx).find((prevTw) => {
        const prevRec = selectedRisk?.pengendalianTriwulan?.find((q) => q.triwulan === prevTw);
        return !prevRec || !prevRec.isPicAcc;
      });

      if (unAccPrevTw) {
        setNotice({
          type: 'error',
          text: `⚠️ Tidak dapat membuka ${tw}. Pengendalian pada ${unAccPrevTw} belum selesai di-ACC oleh Admin. Silakan lengkapi atau tunggu persetujuan Admin pada ${unAccPrevTw} terlebih dahulu.`
        });
        return;
      }
    }

    setActiveQuarter(tw);
  };

  // Simpan / Perbarui Realisasi Triwulan Langsung
  const handleSaveRealizationOnly = async () => {
    if (!selectedRisk || isTwLocked) return;

    const existingTw = selectedRisk.pengendalianTriwulan?.find((q) => q.triwulan === activeQuarter);
    if (currentRole === 'risk admin' && !existingTw?.isPicAcc) {
      setNotice({
        type: 'error',
        text: `ACC laporan PIC ${activeQuarter} terlebih dahulu sebelum melakukan ACC progres pengerjaan.`
      });
      return;
    }

    // KETENTUAN: Apabila TW sudah di-ACC oleh Admin, maka TW tersebut tidak bisa diedit lagi
    if (existingTw?.isPicAcc && currentRole !== 'risk admin') {
      const nextQuarterName = getNextQuarterName(activeQuarter);
      setNotice({
        type: 'error',
        text: `Triwulan ${activeQuarter} telah di-ACC resmi oleh Admin dan tidak dapat diedit lagi. Silakan lanjut ke ${nextQuarterName}.`
      });
      return;
    }

    // Validasi Wewenang RBAC: Risk Officer HANYA melakukan pengendalian jika risiko diassign ke departemennya
    if (currentRole === 'risk officer' && !isAssignedToUser) {
      setNotice({
        type: 'error',
        text: `Akses ditolak: Sebagai Risk Officer dari ${currentUser?.unitKerja || 'departemen Anda'}, Anda hanya berwenang melakukan pengendalian risiko jika risiko diassign ke departemen Anda.`
      });
      return;
    }

    setIsSavingRealization(true);
    setNotice(null);

    const resolvedProgressFisik = currentRole === 'risk officer'
      ? progressPersen
      : (existingTw?.progressFisikPic ?? existingTw?.progressPersen ?? picProgressPersen);
    const resolvedAdminProgress = currentRole === 'risk admin'
      ? adminProgressPersen
      : (existingTw?.progresPengerjaanAdmin ?? resolvedProgressFisik);
    const overallProgress = currentRole === 'risk admin' ? adminProgressPersen : resolvedProgressFisik;
    const isNowFinished = statusRealisasi === 'Completed' || overallProgress >= 100;

    const officerLevel = getMasterRiskLevel(officerKemungkinanUsulan, officerDampakUsulan);

    const newControl: QuarterlyControl = {
      triwulan: activeQuarter,
      realisasiKegiatan: realisasiKegiatan.trim() || `Realisasi mitigasi ${activeQuarter}: capaian fisik ${resolvedProgressFisik}%, progres pengerjaan ${overallProgress}%.`,
      progressPersen: overallProgress,
      progressFisikPic: resolvedProgressFisik,
      progresPengerjaanAdmin: resolvedAdminProgress,
      isAdminProgressAcc: currentRole === 'risk admin'
        ? true
        : existingTw?.isAdminProgressAcc,
      adminProgressAccBy: currentRole === 'risk admin'
        ? (currentUser?.nama || 'Risk Admin Korporat')
        : existingTw?.adminProgressAccBy,
      adminProgressAccDate: currentRole === 'risk admin'
        ? new Date().toISOString()
        : existingTw?.adminProgressAccDate,
      realisasiBiaya: Number(biayaTerpakai) || 0,
      kemungkinanResidual: currentRole === 'risk admin' ? evalKemungkinanRes : (existingTw?.kemungkinanResidual ?? officerKemungkinanUsulan),
      dampakResidual: currentRole === 'risk admin' ? evalDampakRes : (existingTw?.dampakResidual ?? officerDampakUsulan),
      tingkatResidual: currentRole === 'risk admin' ? calculatedEvalLevel : (existingTw?.tingkatResidual ?? officerLevel),
      kemungkinanUsulanPic: currentRole === 'risk officer' ? officerKemungkinanUsulan : (existingTw?.kemungkinanUsulanPic ?? officerKemungkinanUsulan),
      dampakUsulanPic: currentRole === 'risk officer' ? officerDampakUsulan : (existingTw?.dampakUsulanPic ?? officerDampakUsulan),
      tingkatUsulanPic: currentRole === 'risk officer' ? officerLevel : (existingTw?.tingkatUsulanPic ?? officerLevel),
      catatanUsulanPic: currentRole === 'risk officer' ? officerCatatanUsulan : (existingTw?.catatanUsulanPic ?? officerCatatanUsulan),
      kesimpulanPenilaianAdmin: existingTw?.kesimpulanPenilaianAdmin,
      catatanPenilaianRisikoAdmin: existingTw?.catatanPenilaianRisikoAdmin,
      statusPengendalian: isNowFinished ? 'Completed' : statusRealisasi,
      kendalaDanTindakLanjut,
      reportedBy: existingTw?.reportedBy || (currentUser?.nama ? `${currentUser.nama} (${selectedRisk.picDepartemen || selectedRisk.namaOrganisasi})` : selectedRisk.picDepartemen || 'Risk Officer'),
      picDepartemenPelaksana: existingTw?.picDepartemenPelaksana ||
        (currentRole === 'risk officer'
          ? selectedRisk.picDepartemen || selectedRisk.picPelaksana || selectedRisk.namaOrganisasi
          : undefined),
      picReportDate: existingTw?.picReportDate || new Date().toISOString().split('T')[0],
      isPicAcc: existingTw?.isPicAcc || false,
      accBy: existingTw?.accBy,
      accDate: existingTw?.accDate,
      catatanAdminAcc: existingTw?.catatanAdminAcc,
      updatedAt: new Date().toISOString()
    };

    const updatedControls = [...(selectedRisk.pengendalianTriwulan || [])];
    const existingIndex = updatedControls.findIndex((q) => q.triwulan === activeQuarter);
    if (existingIndex >= 0) {
      updatedControls[existingIndex] = newControl;
    } else {
      updatedControls.push(newControl);
    }

    const actorName = currentUser?.nama || (currentRole === 'risk admin' ? 'Risk Admin Korporat' : 'Risk Officer');
    const roleName = currentRole;

    const executionStatus = isNowFinished 
      ? 'Selesai Dilaksanakan' 
      : statusRealisasi === 'Delayed' 
      ? 'Terkendala' 
      : 'Sedang Berjalan';

    let existingActions = Array.isArray(selectedRisk.pelaksanaanTindakan) ? [...selectedRisk.pelaksanaanTindakan] : [];

    // Jika role Risk Officer yang mencatat tindakan pelaksanaan fisik
    if (currentRole === 'risk officer') {
      const actionId = `ACT-${selectedRisk.kodeRisiko}-${activeQuarter.replace(/\s+/g, '')}`;
      const newActionIndex = existingActions.findIndex((a) => a.id === actionId || a.uraianTindakan?.includes(activeQuarter));
      
      const picIdentity = selectedRisk.picDepartemen || selectedRisk.picPelaksana || selectedRisk.namaOrganisasi || 'Departemen Terkait';

      const newActionRecord = {
        id: actionId,
        riskId: selectedRisk.id,
        kodeRisiko: selectedRisk.kodeRisiko,
        triwulan: activeQuarter,
        tanggalPelaksanaan: new Date().toISOString().slice(0, 10),
        picPelaksana: picIdentity,
        uraianTindakan: realisasiKegiatan.trim() || `Pelaksanaan tindakan pengendalian ${activeQuarter}: capaian fisik ${resolvedProgressFisik}%.`,
        progressPersen: resolvedProgressFisik,
        statusPelaksanaan: executionStatus as any,
        realisasiBiaya: Number(biayaTerpakai) || 0,
        efektivitas: (resolvedProgressFisik >= 80 ? 'Efektif' : resolvedProgressFisik >= 50 ? 'Cukup Efektif' : 'Kurang Efektif') as any,
        kendalaDanHambatan: kendalaDanTindakLanjut || 'Tidak ada kendala berarti',
        tindakLanjut: kendalaDanTindakLanjut ? `Tindak lanjut pemulihan: ${kendalaDanTindakLanjut}` : 'Melanjutkan pemantauan berkala',
        nomorBuktiDokumen: `DOC/PUSRI-ERM/${selectedRisk.kodeRisiko}/${activeQuarter.replace(/\s+/g, '')}`,
        catatanAdmin: `Laporan progres ${activeQuarter} terekam oleh ${actorName} (${roleName}). Usulan Tingkat Risiko: ${officerLevel}.`,
        diperbaruiOleh: `${actorName} (${roleName})`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (newActionIndex >= 0) {
        existingActions[newActionIndex] = { ...existingActions[newActionIndex], ...newActionRecord };
      } else {
        existingActions.unshift(newActionRecord);
      }
    }

    try {
      const updated = await PusriApiClient.updateRisk(
        selectedRisk.id,
        {
          pengendalianTriwulan: updatedControls,
          ...(currentRole === 'risk officer' ? {
            pelaksanaanTindakan: existingActions,
            progressPelaksanaanTerakhir: resolvedProgressFisik,
            statusPelaksanaanTerakhir: executionStatus as any
          } : {}),
          currentTingkatRisiko: currentRole === 'risk admin' ? calculatedEvalLevel : (existingTw?.tingkatResidual ?? officerLevel),
          statusWorkflow: selectedRisk.statusWorkflow === 'Carry_Over'
            ? 'Carry_Over'
            : (currentRole === 'risk admin' && isNowFinished ? 'Selesai' : selectedRisk.statusWorkflow)
        },
        actorName,
        roleName
      );
      if (updated) {
        onRiskUpdated(updated);
        setSelectedRisk(updated);
        setNotice({
          type: 'success',
          text: selectedRisk.statusWorkflow === 'Carry_Over'
            ? `✅ Pengendalian triwulan ${activeQuarter} untuk risiko Carry Over (${updated.kodeRisiko}) berhasil disimpan dengan status : CARRY OVER.`
            : (currentRole === 'risk admin'
              ? `✅ Progres pengerjaan ${activeQuarter} (${adminProgressPersen}%) berhasil disimpan oleh Risk Admin. Realisasi kemajuan fisik tetap terjaga pada ${resolvedProgressFisik}%.`
              : `✅ Progres kemajuan fisik ${activeQuarter} (${resolvedProgressFisik}%) dan Usulan Tingkat Risiko (${officerLevel}) berhasil disimpan oleh Risk Officer & disinkronkan ke Database.`)
        });
      }
    } catch (err: any) {
      const errorText = err?.message?.includes('<!doctype') || err?.message?.includes('not valid JSON')
        ? 'Koneksi backend dialihkan ke penyimpanan lokal korporat.'
        : err?.message;
      setNotice({ type: 'error', text: errorText || 'Gagal menyimpan realisasi triwulan.' });
    } finally {
      setIsSavingRealization(false);
    }
  };

  const handleAccAdminProgress = async () => {
    if (!selectedRisk || !existingTwRecord) return;
    if (!existingTwRecord.isPicAcc) {
      setNotice({
        type: 'error',
        text: `ACC laporan pengendalian PIC ${activeQuarter} terlebih dahulu sebelum melakukan ACC progres pengerjaan.`
      });
      return;
    }

    setIsSavingRealization(true);
    setNotice(null);
    const now = new Date().toISOString();
    const updatedControls = (selectedRisk.pengendalianTriwulan || []).map((control) =>
      control.triwulan === activeQuarter
        ? {
            ...control,
            isAdminProgressAcc: true,
            adminProgressAccBy: currentUser?.nama || 'Risk Admin Korporat',
            adminProgressAccDate: now,
            updatedAt: now
          }
        : control
    );

    try {
      const updated = await PusriApiClient.updateRisk(
        selectedRisk.id,
        { pengendalianTriwulan: updatedControls },
        currentUser?.nama || 'Risk Admin Korporat',
        'risk admin'
      );
      if (!updated) {
        throw new Error('Data risiko tidak ditemukan saat menyimpan ACC progres Admin.');
      }

      onRiskUpdated(updated);
      setSelectedRisk(updated);
      setNotice({
        type: 'success',
        text: `✅ Progres pengerjaan ${activeQuarter} berhasil di-ACC. Form evaluasi sekarang dapat diisi.`
      });
      setTimeout(() => {
        document.getElementById('evaluasi-admin-form')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err?.message || 'Gagal melakukan ACC progres pengerjaan Admin.'
      });
    } finally {
      setIsSavingRealization(false);
    }
  };

  // Submit Evaluasi Admin & Penentuan Kembali PIC Lanjutan
  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisk) return;
    const existingTw = selectedRisk.pengendalianTriwulan?.find((q) => q.triwulan === activeQuarter);
    if (!existingTw?.isPicAcc || !existingTw.isAdminProgressAcc) {
      setNotice({
        type: 'error',
        text: `ACC laporan PIC dan progres pengerjaan ${activeQuarter} terlebih dahulu sebelum mengisi evaluasi.`
      });
      return;
    }

    if (!evalCatatanAdmin.trim() || evalCatatanAdmin.trim().length < 5) {
      setNotice({ type: 'error', text: 'Catatan evaluasi admin wajib diisi minimal 5 karakter.' });
      return;
    }

    // Resolusi PIC Tunggal Lanjutan: Hanya Menentukan Departemen (Sesuai Form Approval Admin)
    const effectiveDept = evalDeptPicBaru.trim();
    const finalPicPelaksanaBaru = effectiveDept;
    const finalPicPengendaliBaru = `Vice President ${effectiveDept}`;

    if (evalDecision === 'Carry_Over' || isCarryOverFormOpen) {
      if (!effectiveDept) {
        setNotice({ type: 'error', text: 'Silakan pilih Departemen yang Ditugaskan Melaksanakan Pengendalian.' });
        return;
      }
    }

    if (evalDecision === 'Pengendalian_Lanjutan') {
      if (!evalPengendalianLanjutanDesc.trim()) {
        setNotice({ type: 'error', text: 'Catatan - Arahan Admin untuk Departemen Pelaksana Pengendalian wajib diisi.' });
        return;
      }
    }

    if (
      evalDecision === 'Pengendalian_Lanjutan' &&
      evalTargetTwLanjutan === 'Carry Over' &&
      !isCarryOverFormOpen
    ) {
      setIsCarryOverFormOpen(true);
      setEvalDecision('Carry_Over');
      setNotice({
        type: 'success',
        text: 'Lengkapi parameter Carry Over 2027, lalu simpan untuk melanjutkan ke Evaluasi Risiko & Penilaian Akhir.'
      });
      return;
    }

    setIsSubmittingEvaluation(true);
    setNotice(null);

    try {
      const res = await PusriApiClient.evaluateRiskQuarterly({
        riskId: selectedRisk.id,
        riskData: selectedRisk,
        triwulan: activeQuarter,
        catatanEvaluasiAdmin: evalCatatanAdmin.trim(),
        statusKeputusan: isCarryOverDecision ? 'Carry_Over' : evalDecision,
        kemungkinanResidual: evalKemungkinanRes,
        dampakResidual: evalDampakRes,
        tingkatResidual: calculatedEvalLevel,
        kemungkinanUsulanPic: activeTwProposedK,
        dampakUsulanPic: activeTwProposedD,
        tingkatUsulanPic: activeTwProposedLevel,
        catatanUsulanPic: activeTwProposedNotes,
        kesimpulanPenilaianAdmin: adminKesimpulanPenilaian,
        catatanPenilaianRisikoAdmin: adminCatatanPenilaianRisiko.trim() || evalCatatanAdmin.trim(),
        pengendalianLanjutanDesc: evalDecision === 'Pengendalian_Lanjutan' && !isCarryOverDecision ? evalPengendalianLanjutanDesc.trim() : undefined,
        picDepartemenBaru: evalDecision === 'Pengendalian_Lanjutan' || isCarryOverDecision ? effectiveDept : undefined,
        picPelaksanaBaru: evalDecision === 'Pengendalian_Lanjutan' || isCarryOverDecision ? finalPicPelaksanaBaru : undefined,
        picPengendaliBaru: evalDecision === 'Pengendalian_Lanjutan' || isCarryOverDecision ? finalPicPengendaliBaru : undefined,
        targetWaktuLanjutan: evalDecision === 'Pengendalian_Lanjutan' && !isCarryOverDecision ? evalTargetTwLanjutan : undefined,
        carryOverInfo: isCarryOverDecision ? {
          targetTahun: 2027,
          alasanCarryOver: carryOverAlasan.trim() || `Hasil evaluasi ${activeQuarter}: Memerlukan tindak lanjut mitigasi lintas tahun 2027.`,
          rekomendasiKomite: carryOverRekomendasi.trim() || evalCatatanAdmin.trim()
        } : undefined,
        actor: currentUser?.nama || 'DAFFA ARI PRASETYA',
        role: 'risk admin'
      });

      if (res.success && res.data) {
        onRiskUpdated(res.data);
        setSelectedRisk(res.data);
        
        if (evalDecision === 'Pengendalian_Lanjutan' && !isCarryOverDecision) {
          // Evaluasi telah selesai diisi oleh Admin, sekarang sistem resmi beralih ke triwulan lanjutan yang ditentukan
          if (evalTargetTwLanjutan && evalTargetTwLanjutan !== 'Carry Over') {
            setActiveQuarter(evalTargetTwLanjutan as 'TW 1' | 'TW 2' | 'TW 3' | 'TW 4');
          }
          setNotice({
            type: 'success',
            text: `✅ Evaluasi ${activeQuarter} berhasil disimpan! Karena risiko ${res.data.kodeRisiko} belum selesai, penugasan resmi dilanjutkan ke ${evalTargetTwLanjutan} dengan Departemen PIC: "${effectiveDept}". Sistem sekarang beralih ke periode ${evalTargetTwLanjutan}.`
          });
        } else if (evalDecision === 'Selesai') {
          setNotice({
            type: 'success',
            text: `✅ Risiko ${res.data.kodeRisiko} resmi ditetapkan sebagai "Selesai Dikendalikan". Target tercapai (Status: Selesai). Triwulan berikutnya otomatis ditutup.`
          });
        } else {
          setCarryOverRiskId(res.data.id);
          setMainSectionTab('evaluasi-akhir');
          setNotice({
            type: 'success',
            text: `✅ Risiko ${res.data.kodeRisiko} dialihkan ke Carry Over 2027 beserta penugasan Departemen ${effectiveDept}.`
          });
        }
      } else {
        const errorText = res.message?.includes('<!doctype') || res.message?.includes('not valid JSON')
          ? 'Koneksi backend dialihkan ke penyimpanan lokal korporat.'
          : res.message;
        setNotice({ type: 'error', text: errorText || 'Gagal menyimpan evaluasi triwulan.' });
      }
    } catch (err: any) {
      const errorText = err?.message?.includes('<!doctype') || err?.message?.includes('not valid JSON')
        ? 'Koneksi backend dialihkan ke penyimpanan lokal korporat.'
        : err?.message;
      setNotice({ type: 'error', text: errorText || 'Terjadi kesalahan sistem saat menyimpan evaluasi.' });
    } finally {
      setIsSubmittingEvaluation(false);
    }
  };

  // Stats Counters
  const countInControl = mitigationRisks.filter((r) => r.statusWorkflow === 'Disetujui_Dalam_Pengendalian').length;
  const countFinished = mitigationRisks.filter((r) => r.statusWorkflow === 'Selesai').length;
  const countCarryOver = mitigationRisks.filter((r) => r.statusWorkflow === 'Carry_Over').length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto py-2">
      {/* 1. Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#009fe3] via-sky-800 to-sky-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-300" />
            <h2 className="text-base md:text-lg font-extrabold tracking-tight">
              Pengendalian & Evaluasi Triwulanan (TW 1 - TW 4)
            </h2>
            {currentRole === 'risk owner' ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-mono text-[10px] font-extrabold">
                Akses Risk Owner (VP): Pemantauan Unit
              </span>
            ) : currentRole === 'risk officer' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-900 font-mono text-[10px] font-extrabold">
                Akses Risk Officer: Pengendalian Risiko Departemen ({currentUser?.kodeUnitKerja || 'Unit'})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-slate-900 font-mono text-[10px] font-extrabold">
                Evaluasi & ACC Risk Admin Korporat
              </span>
            )}
          </div>
          <p className="text-xs text-sky-100 mt-0.5">
            {currentRole === 'risk owner'
              ? 'Risk Owner (VP) memantau efektivitas pengendalian risiko triwulan (TW 1 - TW 4) pada unit kerja dan mengawasi target mitigasi.'
              : currentRole === 'risk officer'
              ? `Risk Officer melakukan identifikasi risiko dan pengendalian risiko jika risiko diassign ke departemennya (${currentUser?.unitKerja || 'Departemen Anda'}).`
              : 'Risk Admin melakukan verifikasi & ACC Laporan Pengendalian, evaluasi risiko residual, penugasan PIC Departemen lanjutan, penetapan Selesai, dan Carry Over.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-mono">
            Aktif: <strong className="text-white font-bold">{countInControl}</strong> • Selesai: <strong className="text-emerald-300 font-bold">{countFinished}</strong> • Carry Over: <strong className="text-yellow-300 font-bold">{countCarryOver}</strong>
          </div>
        </div>
      </div>

      {/* 2. Sub-Modul Segmented Switcher: Pemantauan Triwulanan (TW 1-4) vs Evaluasi Risiko & Keputusan Akhir */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setMainSectionTab('pemantauan-tw')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainSectionTab === 'pemantauan-tw'
              ? 'bg-[#009fe3] text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pemantauan & Pengendalian Triwulan (TW 1 - TW 4)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-mono font-bold">
            {countInControl} Risiko Aktif
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainSectionTab('evaluasi-akhir')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mainSectionTab === 'evaluasi-akhir'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Evaluasi Risiko & Keputusan Akhir (Selesai & Carry Over)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono font-bold">
            {countFinished + countCarryOver} Data
          </span>
        </button>
      </div>

      {mainSectionTab === 'evaluasi-akhir' ? (
        <EvaluasiCarryOverView
          currentRole={currentRole}
          currentUser={currentUser}
          risks={risks}
          onRiskUpdated={onRiskUpdated}
          onSelectRisk={onSelectRisk}
          onNavigateNext={handleNavigateFromEvaluasi}
          initialSubTab={carryOverRiskId ? 'carryover' : undefined}
          initialSelectedRiskId={carryOverRiskId}
        />
      ) : (
        <>
      {/* 3. Filter Toolbar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Quarter Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
            {(['ALL', 'TW 1', 'TW 2', 'TW 3', 'TW 4'] as const).map((tw) => (
              <button
                key={tw}
                type="button"
                onClick={() => setFilterTw(tw)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterTw === tw
                    ? 'bg-[#009fe3] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tw === 'ALL' ? 'Semua TW' : tw}
              </button>
            ))}
          </div>

          {/* Department, Status, Search Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status ({mitigationRisks.length})</option>
              <option value="Belum_Selesai">Belum Selesai (Perlu Lanjut TW)</option>
              <option value="Aktif">Sedang Berjalan</option>
              <option value="Selesai">Selesai Dikendalikan</option>
              <option value="Carry_Over">Carry Over</option>
            </select>

            {/* Department Filter */}
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer max-w-[200px]"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d.kode} value={d.kode}>{d.kode} - {d.nama.slice(0, 22)}...</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode/uraian/PIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-[#009fe3]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Global Notice Alert */}
      {notice && (
        <div className={`p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border ${
          notice.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2 font-semibold">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => setNotice(null)} className="text-xs font-bold hover:underline cursor-pointer px-1">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* 3. Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (4 Cols): Daftar Risiko untuk Pengendalian & Pemantauan */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pb-1">
            <span>Daftar Risiko ({filteredRisks.length})</span>
            <span className="font-mono text-[#009fe3]">{filterTw === 'ALL' ? 'TW 1 - TW 4' : filterTw}</span>
          </div>

          {/* Quick Filter Wewenang Risk Officer: Departemen Saya vs Semua Departemen */}
          {currentRole === 'risk officer' && (
            <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setFilterMyDeptOnly(true)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  filterMyDeptOnly
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Unit Saya ({myAssignedRisksCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMyDeptOnly(false)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  !filterMyDeptOnly
                    ? 'bg-[#009fe3] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Semua Unit ({mitigationRisks.length})
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredRisks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                {currentRole === 'risk officer' && filterMyDeptOnly
                  ? `Tidak ada risiko yang diassign ke departemen ${currentUser?.kodeUnitKerja || 'Anda'}. Klik 'Semua Unit' untuk melihat risiko departemen lain (Read-Only).`
                  : 'Tidak ada risiko yang sesuai dengan filter pencarian.'}
              </div>
            ) : (
              filteredRisks.map((r) => {
                const isSelected = selectedRisk?.id === r.id;
                const twCount = r.pengendalianTriwulan?.length || 0;
                const isFinished = r.statusWorkflow === 'Selesai';
                const isCarryOver = r.statusWorkflow === 'Carry_Over';
                const isCardAssigned = isRiskAssignedToUserDept(r, currentUser);

                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRisk(r)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#009fe3] bg-sky-50/70 dark:bg-sky-950/40 shadow-xs ring-2 ring-[#009fe3]'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {r.kodeRisiko}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isFinished
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCarryOver
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-yellow-200 border border-amber-300 dark:border-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {isCarryOver ? `Carry Over (${r.tahun})` : r.statusWorkflow.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 text-[11px] leading-snug">
                      {r.pernyataanRisiko}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500">
                      <span className="truncate max-w-[130px] font-medium">{r.namaOrganisasi}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-[#009fe3] font-bold">Target: {r.targetWaktuMitigasi}</span>
                        <span>•</span>
                        <span className="font-bold">{twCount}/4 TW</span>
                      </div>
                    </div>

                    <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>PIC: <strong className="text-slate-700 dark:text-slate-300">{r.picPelaksana || '-'}</strong></span>
                      <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">{r.currentTingkatRisiko}</span>
                    </div>

                    {/* Badge RBAC Wewenang Khusus Risk Officer */}
                    {currentRole === 'risk officer' && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        {isCardAssigned ? (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Diassign ke Unit Anda (Dapat Dikendalikan)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Unit Lain (Read-Only)</span>
                          </span>
                        )}
                      </div>
                    )}

                    {isFinished && (
                      <div className="mt-2 pt-1.5 border-t border-emerald-100 dark:border-emerald-950 flex items-center justify-between gap-1">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Selesai Pengendalian</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Buka Formulir
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (8 Cols): Workspace Pengendalian, Evaluasi & Alih PIC */}
        <div className="lg:col-span-8 space-y-4">
          {selectedRisk ? (
            <div className="space-y-4">
              {/* Header Card Risiko */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-base text-[#009fe3]">
                        {selectedRisk.kodeRisiko}
                      </span>
                      {selectedRisk.statusWorkflow === 'Carry_Over' ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-yellow-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 font-mono">
                          <RotateCw className="w-3 h-3 text-amber-600 dark:text-yellow-400" />
                          <span>STATUS : CARRY OVER (Tahun {selectedRisk.tahun})</span>
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedRisk.statusWorkflow === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-sky-100 text-[#009fe3]'
                        }`}>
                          {selectedRisk.statusWorkflow.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Inherent: {selectedRisk.tingkatRisikoAwal} (Skor {selectedRisk.inherentScore})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-[#009fe3]">
                        Posisi Saat Ini: {selectedRisk.currentTingkatRisiko}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                      {selectedRisk.namaOrganisasi} ({selectedRisk.kodeOrganisasi})
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-yellow-950/70 text-amber-900 dark:text-yellow-300 font-bold text-xs">
                        Target Saat Ini: {selectedRisk.targetWaktuMitigasi}
                      </span>
                      {isRiskControlFinished && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Selesai Dikendalikan</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Anggaran: Rp {selectedRisk.biayaRencanaPengendalian.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Info PIC Terpilih Saat Ini */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">PIC Pelaksana (Pilihan Admin):</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-xs">{selectedRisk.picPelaksana || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">PIC Pengendali:</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-xs">{selectedRisk.picPengendali || '-'}</strong>
                  </div>
                </div>

                {/* Uraian Program Mitigasi */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    Rencana Penanganan & Program Mitigasi:
                  </span>
                  <p className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 text-xs whitespace-pre-line border border-slate-200/60 dark:border-slate-700">
                    {selectedRisk.rencanaPenanganan}
                  </p>
                </div>
              </div>

              {/* BANNER KHUSUS PENGENDALIAN KEMBALI CARRY OVER DI TAHUN BERIKUTNYA */}
              {selectedRisk.statusWorkflow === 'Carry_Over' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/20 border-2 border-amber-400 dark:border-amber-600/80 text-amber-950 dark:text-yellow-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
                      <RotateCw className="w-5 h-5 animate-spin-reverse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-amber-950 dark:text-yellow-100">
                          Pengendalian Kembali di Tahun Berikutnya (RKAP {selectedRisk.tahun})
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-300 dark:bg-amber-900 text-amber-950 dark:text-yellow-200 font-mono font-extrabold text-[10px] border border-amber-500/50">
                          STATUS : CARRY OVER
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 dark:text-yellow-300 mt-1 leading-relaxed">
                        Risiko ini telah tercatat carry over dan sedang dimulai kembali pengendaliannya di bagian pengendalian triwulan dengan status resmi <strong>Carry Over</strong>. Seluruh laporan realisasi fisik, serapan anggaran, dan catatan evaluasi triwulan terekam dalam siklus RKAP {selectedRisk.tahun}.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetCycleForNewYear}
                      className="px-3.5 py-2 rounded-xl bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-950 dark:text-yellow-200 font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="Mulai ulang triwulan TW 1 untuk tahun berikutnya"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Mulai Ulang Siklus (TW 1)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TW Navigation Tabs */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Pilih Triwulan Pemantauan:</span>
                  <span className="text-[#009fe3] font-mono">Fokus: {activeQuarter}</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(['TW 1', 'TW 2', 'TW 3', 'TW 4'] as const).map((tw) => {
                    const twRecord = selectedRisk.pengendalianTriwulan?.find((q) => q.triwulan === tw);
                    const hasRecord = Boolean(twRecord);
                    const isAcced = Boolean(twRecord?.isPicAcc);
                    const isEvaluated = Boolean(twRecord?.statusKeputusan);
                    const isSelectedTw = activeQuarter === tw;
                    const isThisTwLocked = firstFinishedTw && twOrder.indexOf(tw) > twOrder.indexOf(firstFinishedTw.triwulan);
                    const isThisTheFinishedTw = firstFinishedTw?.triwulan === tw;

                    // Cek apakah ada triwulan sebelumnya yang sudah di-ACC tapi BELUM dievaluasi admin
                    const currentIdx = twOrder.indexOf(tw);
                    const pendingPrevTw = currentRole === 'risk admin' ? twOrder.slice(0, currentIdx).find((prevTw) => {
                      const prevRec = selectedRisk.pengendalianTriwulan?.find((q) => q.triwulan === prevTw);
                      return prevRec?.isPicAcc && !prevRec?.statusKeputusan;
                    }) : undefined;
                    const isBlockedByPendingEvaluation = Boolean(pendingPrevTw);

                    // Untuk Risk Officer: cek apakah triwulan sebelumnya belum selesai di-ACC oleh Admin
                    const isWaitingPreviousTwForOfficer = currentRole === 'risk officer' && twOrder.slice(0, currentIdx).some((prevTw) => {
                      const prevRec = selectedRisk.pengendalianTriwulan?.find((q) => q.triwulan === prevTw);
                      return !prevRec || !prevRec.isPicAcc;
                    });

                    let statusLabel = 'Belum Input';
                    let tabClass = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400';

                    if (isThisTwLocked) {
                      statusLabel = 'Terkunci (Selesai)';
                      tabClass = 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 opacity-60';
                    } else if (currentRole === 'risk officer' && isAcced) {
                      statusLabel = 'Di-ACC (Terkunci)';
                      tabClass = isSelectedTw
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300';
                    } else if (currentRole === 'risk officer' && isWaitingPreviousTwForOfficer) {
                      statusLabel = 'Menunggu TW Lalu';
                      tabClass = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 opacity-60 cursor-not-allowed';
                    } else if (isBlockedByPendingEvaluation) {
                      statusLabel = 'Perlu Eval Lalu';
                      tabClass = isSelectedTw
                        ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                        : 'border-amber-200 dark:border-yellow-900/60 bg-amber-50/50 dark:bg-yellow-950/20 text-amber-700/80 dark:text-yellow-400/80 opacity-75';
                    } else if (isAcced && isEvaluated) {
                      statusLabel = 'ACC & Evaluasi';
                      tabClass = isSelectedTw
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300';
                    } else if (isAcced && !isEvaluated) {
                      statusLabel = 'Perlu Evaluasi';
                      tabClass = isSelectedTw
                        ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                        : 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-yellow-200 ring-1 ring-amber-300';
                    } else if (isThisTheFinishedTw) {
                      statusLabel = 'Selesai (Low)';
                      tabClass = isSelectedTw
                        ? 'border-[#009fe3] bg-[#009fe3] text-white shadow-xs'
                        : 'border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-[#009fe3] dark:text-sky-300';
                    } else if (hasRecord) {
                      statusLabel = 'Menunggu ACC';
                      tabClass = isSelectedTw
                        ? 'border-[#009fe3] bg-[#009fe3] text-white shadow-xs'
                        : 'border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-[#009fe3] dark:text-sky-300';
                    } else {
                      statusLabel = currentRole === 'risk officer' ? 'Siap Input' : 'Belum Input';
                      tabClass = isSelectedTw
                        ? 'border-[#009fe3] bg-[#009fe3] text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400';
                    }

                    return (
                      <button
                        key={tw}
                        type="button"
                        onClick={() => handleQuarterTabClick(tw)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer relative ${tabClass}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{tw}</span>
                          {currentRole === 'risk officer' && isAcced && <CheckCircle className="w-2.5 h-2.5 text-emerald-300" />}
                          {currentRole === 'risk officer' && isWaitingPreviousTwForOfficer && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                          {currentRole !== 'risk officer' && isAcced && isEvaluated && <CheckCircle className="w-2.5 h-2.5 text-emerald-300" />}
                          {currentRole !== 'risk officer' && isAcced && !isEvaluated && <AlertCircle className="w-2.5 h-2.5 text-amber-300 animate-pulse" />}
                          {isThisTwLocked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                          {isBlockedByPendingEvaluation && !isThisTwLocked && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                          {isThisTheFinishedTw && !isAcced && <CheckCircle className="w-2.5 h-2.5 text-yellow-300" />}
                        </div>
                        <span className="text-[9px] font-mono block opacity-90 mt-0.5">
                          {statusLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Locked Notice if Finished in previous quarter */}
              {isTwLocked && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      Triwulan {activeQuarter} Terkunci (Risiko Telah Selesai Dikendalikan)
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                      Risiko ini telah mencapai status <strong>Selesai / Low Risk</strong> pada pemantauan <strong>{firstFinishedTw?.triwulan}</strong>. Sesuai ketentuan SOP Enterprise Risk Management PT Pupuk Sriwidjaja Palembang, pemantauan triwulan selanjutnya ({activeQuarter}) ditutup otomatis karena pengendalian risiko telah tuntas.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION: LAPORAN HASIL PENGERJAAN & CATATAN PROSES DARI PIC PELAKSANA */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[#009fe3]" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Laporan Pengendalian dari PIC Pelaksana ({activeQuarter})
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/70 text-[#009fe3] dark:text-sky-300 font-bold text-[10px]">
                      PIC: {selectedRisk.picPelaksana || 'PIC Terkait'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Kemajuan Fisik PIC:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {picProgressPersen}%
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      (selectedRisk.statusPelaksanaanTerakhir || 'Sedang Berjalan') === 'Selesai Dilaksanakan'
                        ? 'bg-emerald-100 text-emerald-800'
                        : (selectedRisk.statusPelaksanaanTerakhir || 'Sedang Berjalan') === 'Terkendala'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-sky-100 text-[#009fe3]'
                    }`}>
                      {selectedRisk.statusPelaksanaanTerakhir || 'Sedang Berjalan'}
                    </span>
                  </div>
                </div>

                {/* Progress bar visual indicator of PIC reported execution */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Realisasi Kemajuan Fisik yang Telah Di-input PIC:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {picProgressPersen}% Selesai (Otentik dari PIC)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#009fe3] h-full rounded-full transition-all duration-300"
                      style={{ width: `${picProgressPersen}%` }}
                    />
                  </div>
                </div>

                {/* HIGHLIGHT: USULAN TINGKAT RISIKO DARI RISK OFFICER */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 via-indigo-50/40 to-slate-50 dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-slate-850 border border-sky-200/80 dark:border-sky-800/60 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-[#009fe3]" />
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        Usulan Tingkat Risiko Pasca-Pengendalian dari Risk Officer ({activeQuarter}):
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">
                        K: <strong className="text-slate-800 dark:text-slate-200">{activeTwProposedK}</strong> • D: <strong className="text-slate-800 dark:text-slate-200">{activeTwProposedD}</strong>
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md font-bold font-mono text-[10px] ${
                        activeTwProposedLevel === 'High' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' :
                        activeTwProposedLevel === 'Mod to High' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' :
                        activeTwProposedLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' :
                        activeTwProposedLevel === 'Low to Mod' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' :
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      }`}>
                        Usulan: {activeTwProposedLevel} (Skor: {activeTwProposedScore})
                      </span>
                    </div>
                  </div>
                  {activeTwProposedNotes && (
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-sky-100 dark:border-sky-900/60 text-[11px] text-slate-700 dark:text-slate-300">
                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Catatan / Justifikasi Usulan dari Risk Officer:</span>
                      <p className="italic leading-relaxed">"{activeTwProposedNotes}"</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>Pelapor: <strong className="text-slate-600 dark:text-slate-300">{existingTwRecord?.reportedBy || selectedRisk.picPelaksana || 'Risk Officer Unit'}</strong></span>
                    <span>Tanggal Lapor: {existingTwRecord?.picReportDate || new Date().toISOString().split('T')[0]}</span>
                  </div>
                </div>

                {/* STATUS ACC DARI ADMIN */}
                <div id="status-acc-laporan-pic" className="pt-1 space-y-2.5">
                  {existingTwRecord?.isPicAcc ? (
                    <>
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs">Laporan Pengendalian PIC Telah Di-ACC oleh Admin</span>
                              <span className="px-2 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold text-[9px]">
                                ACC RESMI
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                              Diverifikasi oleh: <strong>{existingTwRecord.accBy || 'Admin ERM'}</strong> • {existingTwRecord.accDate ? new Date(existingTwRecord.accDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Terverifikasi'}
                              {existingTwRecord.catatanAdminAcc ? ` — Catatan: "${existingTwRecord.catatanAdminAcc}"` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Sequential workflow prompts */}
                      {!existingTwRecord.statusKeputusan ? (
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-yellow-950/50 dark:to-amber-950/40 border-2 border-amber-400 dark:border-yellow-600 flex items-center justify-between flex-wrap gap-3 animate-in fade-in">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-yellow-400 shrink-0 mt-0.5 animate-bounce" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-amber-950 dark:text-yellow-200">
                                  {existingTwRecord.isAdminProgressAcc
                                    ? `Tahap Wajib Selanjutnya: Evaluasi Admin (${activeQuarter})`
                                    : `Tahap Wajib Selanjutnya: ACC Progres Admin (${activeQuarter})`}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-yellow-200 font-extrabold text-[9px]">
                                  {existingTwRecord.isAdminProgressAcc ? 'LANJUT EVALUASI' : 'ACC PROGRES DAHULU'}
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-800 dark:text-yellow-300 mt-0.5 leading-relaxed">
                                {existingTwRecord.isAdminProgressAcc
                                  ? <>Progres pengerjaan Admin telah di-ACC. Admin dapat melanjutkan evaluasi untuk menetapkan status risiko sebelum menuju triwulan berikutnya.</>
                                  : <>Laporan PIC sudah di-ACC. Admin harus melakukan ACC progres pengerjaan pada kartu di bawah sebelum formulir evaluasi dibuka.</>}
                              </p>
                            </div>
                          </div>
                          {currentRole === 'risk admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                document.getElementById(existingTwRecord.isAdminProgressAcc
                                  ? 'evaluasi-admin-form'
                                  : 'progress-pengerjaan-admin'
                                )?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-yellow-200" />
                              <span>{existingTwRecord.isAdminProgressAcc ? 'Isi Evaluasi Sekarang ↓' : 'ACC Progres Sekarang ↓'}</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#009fe3] shrink-0" />
                            <div>
                              <span className="font-bold">
                                Evaluasi Admin Telah Selesai: {existingTwRecord.statusKeputusan.replace('_', ' ')}
                              </span>
                              <span className="text-[11px] text-sky-700 dark:text-sky-300 block">
                                Dievaluasi oleh: {existingTwRecord.dievaluasiOleh || 'Admin'} • {existingTwRecord.tanggalEvaluasi || ''}
                              </span>
                            </div>
                          </div>
                          {getNextQuarterName(activeQuarter) !== 'Carry Over' && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = getNextQuarterName(activeQuarter);
                                if (next !== 'Carry Over') {
                                  setActiveQuarter(next as any);
                                }
                              }}
                              className="px-3 py-1.5 bg-[#009fe3] hover:bg-[#0284c7] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>Buka {getNextQuarterName(activeQuarter)}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-yellow-950/40 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-yellow-200 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-5 h-5 text-amber-600 dark:text-yellow-400 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">Status: Menunggu ACC Admin</span>
                            <span className="px-2 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-yellow-200 font-bold text-[9px]">
                              MENUNGGU VERIFIKASI
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-800 dark:text-yellow-300 mt-0.5">
                            PIC telah melakukan laporan pelaksanaan pengendalian risiko ({picProgressPersen}%). Admin perlu melakukan ACC bahwa PIC sudah melakukan laporan pengendalian.
                          </p>
                        </div>
                      </div>
                      {currentRole === 'risk admin' ? (
                        <button
                          type="button"
                          disabled={isAccSubmitting}
                          onClick={() => setIsAccModalOpen(true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                          <span>{isAccSubmitting ? 'Memproses ACC...' : 'ACC Laporan Pengendalian PIC'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-yellow-400 italic">
                          Menunggu ACC dari Admin Korporat
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* List of actions/processes reported by PIC */}
                {selectedRisk.pelaksanaanTindakan && selectedRisk.pelaksanaanTindakan.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Rincian Tindakan Pengendalian yang Dilaporkan PIC:
                    </span>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedRisk.pelaksanaanTindakan.map((action, aIdx) => (
                        <div
                          key={action.id || aIdx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#009fe3] text-xs">
                                {action.id || `Tindakan #${aIdx + 1}`}
                              </span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                • {action.tanggalPelaksanaan}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                Progres Fisik: {action.progressPersen}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                action.statusPelaksanaan === 'Selesai Dilaksanakan'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : action.statusPelaksanaan === 'Terkendala'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-sky-100 text-[#009fe3] dark:bg-sky-950 dark:text-sky-300'
                              }`}>
                                {action.statusPelaksanaan}
                              </span>
                              {action.efektivitas && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {action.efektivitas}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-800 dark:text-slate-200 font-medium text-[11px] leading-relaxed">
                            {action.uraianTindakan}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                            {action.kendalaDanHambatan && action.kendalaDanHambatan !== '-' && (
                              <div>
                                <span className="font-semibold text-rose-600">Kendala: </span>
                                <span>{action.kendalaDanHambatan}</span>
                              </div>
                            )}
                            {action.tindakLanjut && action.tindakLanjut !== '-' && (
                              <div>
                                <span className="font-semibold text-sky-600">Tindak Lanjut: </span>
                                <span>{action.tindakLanjut}</span>
                              </div>
                            )}
                            {action.realisasiBiaya ? (
                              <div>
                                <span className="font-semibold text-emerald-600">Serapan Biaya: </span>
                                <span className="font-mono">Rp {action.realisasiBiaya.toLocaleString('id-ID')}</span>
                              </div>
                            ) : null}
                            {action.diperbaruiOleh && (
                              <div className="text-right sm:col-span-2 text-slate-400 font-mono text-[9px]">
                                Dilaporkan oleh: {action.diperbaruiOleh}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 text-[11px] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Belum ada catatan pelaksanaan tindakan yang dilaporkan oleh PIC untuk periode ini. PIC dapat menginput laporan pelaksanaan pada Modul Pelaksanaan PIC.
                    </span>
                  </div>
                )}
              </div>

              {/* CARD 1: FORM REALISASI & PROGRES PENGERJAAN TRIWULAN */}
              <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5 text-xs ${
                currentRole === 'risk admin' ? 'opacity-75' : ''
              }`}>
                <fieldset disabled={currentRole === 'risk admin'} className="contents">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#009fe3]" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Progres Pengerjaan Risiko ({activeQuarter})
                    </h4>
                    {currentRole === 'risk owner' ? (
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[10px] font-bold">
                        Akses Risk Owner (Read-Only)
                      </span>
                    ) : currentRole === 'risk officer' ? (
                      isOfficerQuarterLocked ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Triwulan Sudah Di-ACC (Terkunci)</span>
                        </span>
                      ) : isAssignedToUser ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-[10px] font-bold">
                          Akses Risk Officer: Input Realisasi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Bukan Departemen Anda (Read-Only)</span>
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-300 text-[10px] font-bold">
                        Evaluasi &amp; ACC Risk Admin
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[#009fe3] font-bold text-sm">
                    Kemajuan Fisik: {picProgressPersen}%
                  </span>
                </div>

                {/* Banner wewenang untuk Risk Owner */}
                {currentRole === 'risk owner' && (
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      <strong>Pemberitahuan Wewenang:</strong> Risk Owner (VP) mengawasi efektivitas pelaksanaan risiko dalam mode pemantauan. Penginputan realisasi fisik dilakukan oleh Risk Officer dan evaluasi residual oleh Risk Admin.
                    </span>
                  </div>
                )}

                {/* Banner wewenang untuk Risk Officer jika risiko BUKAN diassign ke departemennya */}
                {currentRole === 'risk officer' && !isAssignedToUser && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold flex items-center gap-2">
                        <span>Akses Pengendalian Dibatasi: Bukan Departemen Anda</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-mono font-bold">
                          Read-Only
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                        Sebagai <strong>Risk Officer ({currentUser?.unitKerja || currentUser?.kodeUnitKerja || 'Unit Anda'})</strong>, Anda hanya berwenang melakukan pengendalian risiko jika risiko diassign ke departemen Anda. Risiko <strong>{selectedRisk.kodeRisiko}</strong> ditugaskan kepada <strong>{selectedRisk.picDepartemen || selectedRisk.picPelaksana || selectedRisk.namaOrganisasi}</strong>, sehingga formulir pengendalian triwulan ini terkunci dalam mode baca saja (read-only).
                      </p>
                    </div>
                  </div>
                )}

                {/* Banner wewenang untuk Risk Officer jika triwulan SUDAH di-ACC oleh Admin (Terkunci & Wajib Lanjut ke TW Berikutnya) */}
                {isOfficerQuarterLocked && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-bold flex items-center gap-2">
                          <span>Triwulan {activeQuarter} Telah Selesai Di-ACC oleh Admin</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-mono font-bold">
                            Terkunci (Selesai)
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                          Laporan realisasi dan kemajuan fisik pada <strong>{activeQuarter}</strong> telah resmi diverifikasi dan di-ACC oleh Admin. Sesuai prosedur, data pada triwulan ini tidak dapat diinput atau diubah lagi. Silakan melanjutkan pelaporan ke triwulan selanjutnya (<strong>{nextTw}</strong>).
                        </p>
                      </div>
                    </div>
                    {nextTw && nextTw !== activeQuarter && (
                      <button
                        type="button"
                        onClick={() => handleQuarterTabClick(nextTw as any)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <span>Lanjut ke {nextTw}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* 1. BAGIAN REALISASI KEMAJUAN FISIK (TUGAS RISK OFFICER) */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        1. Realisasi Kemajuan Fisik ({activeQuarter})
                      </label>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        currentRole === 'risk officer' && !isAssignedToUser
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {currentRole === 'risk officer' && !isAssignedToUser ? 'Terkunci (Unit Lain)' : 'Input Risk Officer'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                      {picProgressPersen}% Fisik
                    </span>
                  </div>

                  {currentRole === 'risk officer' ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">
                        {isAssignedToUser
                          ? `Risk Officer menginput realisasi kemajuan fisik pelaksanaan mitigasi di lapangan (${activeQuarter}).`
                          : `Tampilan realisasi kemajuan fisik (${activeQuarter}). Penginputan hanya dapat dilakukan oleh Risk Officer dari departemen yang ditugaskan (${selectedRisk.picDepartemen || selectedRisk.picPelaksana || selectedRisk.namaOrganisasi}).`}
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          disabled={isOfficerInputDisabled}
                          value={progressPersen}
                          onChange={(e) => setProgressPersen(Number(e.target.value))}
                          className="flex-1 accent-emerald-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            disabled={isOfficerInputDisabled}
                            value={progressPersen}
                            onChange={(e) => setProgressPersen(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                            className="w-16 h-8 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-center text-xs disabled:bg-slate-100 dark:disabled:bg-slate-800"
                          />
                          <span className="font-bold text-xs">%</span>
                        </div>
                      </div>
                      {!isTwLocked && isAssignedToUser && !isOfficerQuarterLocked && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] text-slate-400 font-semibold mr-1">Preset:</span>
                          {[0, 25, 50, 75, 100].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                setProgressPersen(val);
                                if (val === 100) setStatusRealisasi('Completed');
                                else if (val > 0 && statusRealisasi === 'Pending') setStatusRealisasi('On Track');
                              }}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                progressPersen === val
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                              }`}
                            >
                              {val === 100 ? '100% (Tuntas)' : `${val}%`}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${picProgressPersen}%` }}
                        />
                      </div>

                      {/* INPUT USULAN TINGKAT RISIKO DARI RISK OFFICER */}
                      <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Usulan Tingkat Risiko Pasca-Mitigasi ({activeQuarter}) *</span>
                          </label>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            calculatedOfficerLevel === 'High' ? 'bg-rose-100 text-rose-800' :
                            calculatedOfficerLevel === 'Mod to High' ? 'bg-amber-100 text-amber-900' :
                            calculatedOfficerLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                            calculatedOfficerLevel === 'Low to Mod' ? 'bg-sky-100 text-sky-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            Usulan: {calculatedOfficerLevel} (Skor: {calculatedOfficerScore})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {isAssignedToUser
                            ? 'Sampaikan estimasi/usulan tingkat risiko setelah tindakan mitigasi ini dijalankan untuk dinilai dan diverifikasi oleh Risk Admin.'
                            : 'Usulan tingkat risiko dari Risk Officer departemen pelaksana.'}
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Kemungkinan Usulan:
                            </label>
                            <select
                              value={officerKemungkinanUsulan}
                              disabled={isOfficerInputDisabled}
                              onChange={(e) => setOfficerKemungkinanUsulan(Number(e.target.value))}
                              className="w-full h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                            >
                              <option value={1}>1 - Sangat Jarang</option>
                              <option value={2}>2 - Jarang</option>
                              <option value={3}>3 - Kadang-kadang</option>
                              <option value={4}>4 - Sering</option>
                              <option value={5}>5 - Hampir Pasti</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Dampak Usulan:
                            </label>
                            <select
                              value={officerDampakUsulan}
                              disabled={isOfficerInputDisabled}
                              onChange={(e) => setOfficerDampakUsulan(Number(e.target.value))}
                              className="w-full h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                            >
                              <option value={1}>1 - Tidak Signifikan</option>
                              <option value={2}>2 - Minor / Rendah</option>
                              <option value={3}>3 - Sedang / Moderate</option>
                              <option value={4}>4 - Signifikan / Berat</option>
                              <option value={5}>5 - Katastropik / Sangat Berat</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Alasan / Justifikasi Penurunan Tingkat Risiko:
                          </label>
                          <input
                            type="text"
                            value={officerCatatanUsulan}
                            disabled={isOfficerInputDisabled}
                            onChange={(e) => setOfficerCatatanUsulan(e.target.value)}
                            placeholder="Alasan mengapa menurut Anda tingkat risiko telah turun..."
                            className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Read-Only Display untuk Risk Admin & Risk Owner */
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Realisasi Kemajuan Fisik (Input Risk Officer):</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {picProgressPersen}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${picProgressPersen}%` }}
                        />
                      </div>
                      <div className="p-2.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/60 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Usulan Tingkat Risiko dari Risk Officer:
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 italic text-[11px]">
                            "{activeTwProposedNotes || 'Berdasarkan capaian pelaksanaan tindakan di lapangan'}"
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-md font-bold font-mono text-[10px] ${
                          activeTwProposedLevel === 'High' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' :
                          activeTwProposedLevel === 'Mod to High' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' :
                          activeTwProposedLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' :
                          activeTwProposedLevel === 'Low to Mod' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        }`}>
                          Usulan: {activeTwProposedLevel} (K:{activeTwProposedK} × D:{activeTwProposedD} = {activeTwProposedScore})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. BAGIAN PROGRES PENGERJAAN RISIKO (INPUT RISK ADMIN KORPORAT) */}
                <div
                  id="progress-pengerjaan-admin"
                  className={`p-3.5 rounded-xl border space-y-2.5 ${
                    currentRole === 'risk admin' && !existingTwRecord?.isPicAcc
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70'
                      : 'bg-sky-50/60 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        2. Progres Pengerjaan Risiko ({activeQuarter})
                      </label>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        currentRole === 'risk admin'
                          ? existingTwRecord?.isAdminProgressAcc
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
                            : existingTwRecord?.isPicAcc
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
                      }`}>
                        {currentRole === 'risk admin'
                          ? existingTwRecord?.isAdminProgressAcc
                            ? 'ACC Admin'
                            : existingTwRecord?.isPicAcc
                            ? 'Siap Di-ACC'
                            : 'Menunggu ACC PIC'
                          : 'Input Risk Admin'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#009fe3] dark:text-sky-300">
                      {(existingTwRecord?.progresPengerjaanAdmin ?? existingTwRecord?.progressPersen ?? picProgressPersen)}% Pengerjaan
                    </span>
                  </div>

                  {currentRole === 'risk admin' ? (
                      /* Tampilan progres Admin dalam mode baca */
                      <div className="space-y-2">
                        <p className="text-[10px] text-sky-800 dark:text-sky-300 leading-snug">
                          {!existingTwRecord?.isPicAcc
                            ? `ACC laporan pengendalian PIC ${activeQuarter} terlebih dahulu untuk membuka tahap ini.`
                            : existingTwRecord.isAdminProgressAcc
                            ? `Progres pengerjaan ${activeQuarter} telah di-ACC oleh ${existingTwRecord.adminProgressAccBy || 'Risk Admin'}.`
                            : `Laporan PIC telah di-ACC. Tekan tombol ACC Progres Admin untuk melanjutkan ke evaluasi. Realisasi fisik PIC: ${picProgressPersen}%.`}
                        </p>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs text-slate-600 dark:text-slate-300">
                            {existingTwRecord?.progresPengerjaanAdmin ?? existingTwRecord?.progressPersen ?? picProgressPersen}%
                          </span>
                          <div className="flex-1 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-slate-500 h-full rounded-full"
                              style={{ width: `${existingTwRecord?.progresPengerjaanAdmin ?? existingTwRecord?.progressPersen ?? picProgressPersen}%` }}
                            />
                          </div>
                        </div>

                      </div>
                    ) : (
                      /* Read-Only Display untuk non-Admin */
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                          <span>Status Pengerjaan Admin:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {existingTwRecord?.progresPengerjaanAdmin !== undefined
                              ? `${existingTwRecord.progresPengerjaanAdmin}%`
                              : `${picProgressPersen}% (Mengikuti Progres Lapangan)`}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#009fe3] h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                existingTwRecord?.progresPengerjaanAdmin !== undefined
                                  ? existingTwRecord.progresPengerjaanAdmin
                                  : picProgressPersen
                              }%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {currentRole === 'risk admin'
                        ? `Catatan Pengerjaan & Verifikasi Mitigasi Triwulan (${activeQuarter}) *`
                        : `Uraian Realisasi Tindakan & Kemajuan Mitigasi Fisik (${activeQuarter}) *`}
                    </label>
                    <textarea
                      rows={2}
                      disabled={isTwLocked || currentRole !== 'risk officer' || !isAssignedToUser || isOfficerQuarterLocked}
                      value={realisasiKegiatan}
                      onChange={(e) => setRealisasiKegiatan(e.target.value)}
                      placeholder={
                        currentRole === 'risk admin'
                          ? `Catatan Admin mengenai progres pengerjaan dan efektivitas untuk ${activeQuarter}...`
                          : (currentRole === 'risk officer' && !isAssignedToUser)
                          ? `Hanya dapat diisi oleh Risk Officer dari departemen yang ditugaskan (${selectedRisk.picDepartemen || selectedRisk.picPelaksana || selectedRisk.namaOrganisasi}).`
                          : (currentRole === 'risk officer' && isOfficerQuarterLocked)
                          ? `Triwulan ${activeQuarter} telah selesai di-ACC oleh Admin dan terkunci.`
                          : `Jelaskan capaian pelaksanaan mitigasi dan progres pengerjaan risiko untuk ${activeQuarter}...`
                      }
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-[#009fe3] resize-none disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:cursor-not-allowed leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Status Capaian Pengerjaan:
                      </label>
                      <select
                        value={statusRealisasi}
                        disabled={isTwLocked || currentRole !== 'risk officer' || !isAssignedToUser || isOfficerQuarterLocked}
                        onChange={(e) => setStatusRealisasi(e.target.value as any)}
                        className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        <option value="On Track">On Track (Sesuai Rencana)</option>
                        <option value="Delayed">Delayed (Mengalami Kendala)</option>
                        <option value="Completed">Completed (Tuntas)</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Serapan Biaya / Anggaran Terpakai (Rp):
                        </label>
                        <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Rp {Number(biayaTerpakai || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        step={1000000}
                        disabled={isTwLocked || currentRole !== 'risk officer' || !isAssignedToUser || isOfficerQuarterLocked}
                        value={biayaTerpakai}
                        onChange={(e) => setBiayaTerpakai(Number(e.target.value))}
                        className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kendala Lapangan & Rencana Tindak Lanjut:
                    </label>
                    <input
                      type="text"
                      disabled={isTwLocked || currentRole !== 'risk officer' || !isAssignedToUser || isOfficerQuarterLocked}
                      value={kendalaDanTindakLanjut}
                      onChange={(e) => setKendalaDanTindakLanjut(e.target.value)}
                      placeholder={
                        currentRole === 'risk officer' && !isAssignedToUser
                          ? "Pengendalian khusus departemen pelaksana (Read-Only)"
                          : (currentRole === 'risk officer' && isOfficerQuarterLocked)
                          ? `Triwulan ${activeQuarter} telah selesai di-ACC (Read-Only)`
                          : "Kendala spesifik atau catatan pelaksanaan mitigasi..."
                      }
                      className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>

                </fieldset>

                  {!isTwLocked && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Disimpan atas nama: <strong className="text-slate-700 dark:text-slate-300">{currentUser?.nama || currentRole}</strong>
                      </span>
                      {currentRole === 'risk admin' ? (
                        <button
                          type="button"
                          onClick={handleAccAdminProgress}
                          disabled={isSavingRealization || !existingTwRecord?.isPicAcc || !!existingTwRecord?.isAdminProgressAcc}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-3.5 h-3.5 text-yellow-300" />
                          <span>
                            {isSavingRealization
                              ? 'Memproses ACC...'
                              : existingTwRecord?.isAdminProgressAcc
                              ? 'Progres Admin Sudah Di-ACC'
                              : existingTwRecord?.isPicAcc
                              ? `ACC Progres Pengerjaan Admin (${existingTwRecord.progresPengerjaanAdmin ?? existingTwRecord.progressPersen ?? picProgressPersen}%)`
                              : 'Menunggu ACC Laporan PIC'}
                          </span>
                        </button>
                      ) : currentRole === 'risk owner' ? (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-[11px] italic bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Risk Owner (VP) memantau pelaksanaan mitigasi triwulan (Mode Pemantauan).</span>
                        </div>
                      ) : currentRole === 'risk officer' && !isAssignedToUser ? (
                        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold text-[11px] bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800">
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Pengendalian Terkunci: Risiko di luar departemen Anda ({currentUser?.unitKerja || currentUser?.kodeUnitKerja || 'Unit Anda'})</span>
                        </div>
                      ) : isOfficerQuarterLocked ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Triwulan {activeQuarter} Sudah Di-ACC (Terkunci)</span>
                          </div>
                          {nextTw && nextTw !== activeQuarter && (
                            <button
                              type="button"
                              onClick={() => handleQuarterTabClick(nextTw as any)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <span>Lanjut ke {nextTw}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSaveRealizationOnly}
                          disabled={isSavingRealization}
                          className="px-5 py-2 bg-[#009fe3] hover:bg-[#0284c7] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5 text-yellow-300" />
                          <span>
                            {isSavingRealization
                              ? 'Menyimpan...'
                              : `Simpan Realisasi Fisik (${progressPersen}%)`}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

              {/* CARD 2: BAGIAN EVALUASI HASIL PENGENDALIAN DAN STATUS RISIKO */}
              {currentRole === 'risk admin' ? (
                existingTwRecord?.isPicAcc && existingTwRecord.isAdminProgressAcc ? (
                <form 
                  id="evaluasi-admin-form"
                  onSubmit={handleSubmitEvaluation} 
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-2xs space-y-4 text-xs transition-all ${
                    existingTwRecord?.isPicAcc && !existingTwRecord?.statusKeputusan
                      ? 'border-2 border-amber-400 dark:border-yellow-500 ring-2 ring-amber-300/40'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#009fe3]" />
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100">
                      Evaluasi Hasil Pengendalian & Status Risiko (Admin Monitoring)
                    </h4>
                    {existingTwRecord?.isPicAcc && !existingTwRecord?.statusKeputusan && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-yellow-200 font-extrabold text-[9px] animate-pulse">
                        Wajib Diisi Sebelum Lanjut TW
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-[#009fe3] font-bold font-mono text-[11px]">
                    Evaluasi {activeQuarter}
                  </span>
                </div>

                {/* 1. PENILAIAN TINGKATAN RISIKO DARI RISK OFFICER & PENETAPAN RESIDUAL RESMI ADMIN */}
                <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-sky-200/60 dark:border-sky-900/40">
                    <div>
                      <span className="text-xs font-extrabold text-[#009fe3] dark:text-sky-300 flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4 text-[#009fe3]" />
                        <span>1. Penilaian Tingkatan Risiko dari Risk Officer & Penetapan Tingkat Residual Resmi Admin ({activeQuarter}):</span>
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Sebagai Risk Admin, Anda menilai objektivitas usulan tingkat risiko dari Risk Officer berdasarkan bukti kemajuan fisik lapangan ({picProgressPersen}%) dan menetapkan tingkat risiko residual resmi korporat.
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono shrink-0 ${
                      calculatedEvalLevel === 'High' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' :
                      calculatedEvalLevel === 'Mod to High' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' :
                      calculatedEvalLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' :
                      calculatedEvalLevel === 'Low to Mod' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' :
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    }`}>
                      Penetapan Admin: {calculatedEvalLevel} (Skor: {calculatedEvalScore})
                    </span>
                  </div>

                  {/* 3-COLUMN SIDE-BY-SIDE COMPARATIVE BOARD */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* KOLOM 1: TINGKAT RISIKO AWAL (INHERENT) */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          1. Tingkat Risiko Awal
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Inherent
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          selectedRisk.tingkatRisikoAwal === 'High' ? 'bg-rose-100 text-rose-800' :
                          selectedRisk.tingkatRisikoAwal === 'Mod to High' ? 'bg-amber-100 text-amber-900' :
                          selectedRisk.tingkatRisikoAwal === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                          selectedRisk.tingkatRisikoAwal === 'Low to Mod' ? 'bg-sky-100 text-sky-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {selectedRisk.tingkatRisikoAwal}
                        </span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                          Skor: {selectedRisk.inherentScore}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        <div>Kemungkinan: <strong className="text-slate-800 dark:text-slate-200">{selectedRisk.kemungkinanAwal}</strong></div>
                        <div>Dampak: <strong className="text-slate-800 dark:text-slate-200">{selectedRisk.dampakAwal}</strong></div>
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        Posisi risiko sebelum program mitigasi dijalankan.
                      </p>
                    </div>

                    {/* KOLOM 2: USULAN TINGKAT RISIKO DARI RISK OFFICER */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50/80 to-indigo-50/50 dark:from-sky-950/40 dark:to-indigo-950/30 border-2 border-sky-300 dark:border-sky-800 shadow-2xs space-y-2 relative">
                      <div className="flex items-center justify-between pb-1.5 border-b border-sky-200/60 dark:border-sky-900/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#009fe3]">
                          2. Usulan Risk Officer
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#009fe3]/20 text-[#009fe3]">
                          PIC Unit
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          activeTwProposedLevel === 'High' ? 'bg-rose-100 text-rose-800' :
                          activeTwProposedLevel === 'Mod to High' ? 'bg-amber-100 text-amber-900' :
                          activeTwProposedLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                          activeTwProposedLevel === 'Low to Mod' ? 'bg-sky-100 text-sky-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {activeTwProposedLevel}
                        </span>
                        <span className="font-mono font-bold text-[#009fe3] text-xs">
                          Skor Usulan: {activeTwProposedScore}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] pt-1 border-t border-sky-100 dark:border-sky-900/50 text-slate-600 dark:text-slate-400">
                        <div>Kemungkinan: <strong className="text-slate-800 dark:text-slate-200">{activeTwProposedK}</strong></div>
                        <div>Dampak: <strong className="text-slate-800 dark:text-slate-200">{activeTwProposedD}</strong></div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-sky-100 dark:border-sky-900/50 text-[10px] text-slate-600 dark:text-slate-400">
                        <span className="font-semibold block text-slate-500 mb-0.5">Alasan Usulan:</span>
                        <p className="italic line-clamp-2">"{activeTwProposedNotes || 'Berdasarkan capaian pelaksanaan tindakan di lapangan'}"</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyOfficerProposalToAdmin}
                        className="w-full py-1.5 px-2 bg-[#009fe3] hover:bg-[#0284c7] text-white rounded-lg text-[10px] font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                        title="Salin nilai kemungkinan dan dampak usulan Risk Officer ke penilaian Admin"
                      >
                        <CheckCircle2 className="w-3 h-3 text-yellow-300" />
                        <span>✓ Setujui Sesuai Usulan Officer</span>
                      </button>
                    </div>

                    {/* KOLOM 3: PENILAIAN & PENETAPAN RESMI RISK ADMIN */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-400 dark:border-emerald-700 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60 dark:border-emerald-900/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          3. Penilaian & Penetapan Admin
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                          Resmi
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          calculatedEvalLevel === 'High' ? 'bg-rose-100 text-rose-800' :
                          calculatedEvalLevel === 'Mod to High' ? 'bg-amber-100 text-amber-900' :
                          calculatedEvalLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                          calculatedEvalLevel === 'Low to Mod' ? 'bg-sky-100 text-sky-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {calculatedEvalLevel}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                          Skor Terverifikasi: {calculatedEvalScore}
                        </span>
                      </div>

                      {/* Dropdown Verifikasi Kemungkinan & Dampak oleh Admin */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-100 dark:border-emerald-900/50">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                            Kemungkinan (1-5):
                          </label>
                          <select
                            value={evalKemungkinanRes}
                            onChange={(e) => setEvalKemungkinanRes(Number(e.target.value))}
                            className="w-full h-7 px-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-md font-bold text-xs"
                          >
                            <option value={1}>1 - S. Jarang</option>
                            <option value={2}>2 - Jarang</option>
                            <option value={3}>3 - Kadang</option>
                            <option value={4}>4 - Sering</option>
                            <option value={5}>5 - Pasti</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                            Dampak (1-5):
                          </label>
                          <select
                            value={evalDampakRes}
                            onChange={(e) => setEvalDampakRes(Number(e.target.value))}
                            className="w-full h-7 px-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-md font-bold text-xs"
                          >
                            <option value={1}>1 - T. Signifikan</option>
                            <option value={2}>2 - Minor</option>
                            <option value={3}>3 - Moderate</option>
                            <option value={4}>4 - Signifikan</option>
                            <option value={5}>5 - Katastropik</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 pt-0.5">
                        {calculatedEvalScore < activeTwProposedScore ? (
                          <span className="text-emerald-600 font-semibold">Penilaian Admin menilai mitigasi lebih efektif dibanding estimasi Officer.</span>
                        ) : calculatedEvalScore > activeTwProposedScore ? (
                          <span className="text-amber-700 font-semibold">Penilaian Admin lebih konservatif/tinggi dari usulan Officer.</span>
                        ) : (
                          <span className="text-sky-700 font-semibold">Penilaian Admin selaras dengan usulan Officer.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* KESIMPULAN PENILAIAN TINGKAT RISIKO OLEH ADMIN */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Kesimpulan Penilaian Admin terhadap Usulan Risk Officer:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminKesimpulanPenilaian('Sesuai_Usulan_Officer');
                          handleApplyOfficerProposalToAdmin();
                        }}
                        className={`p-2 rounded-lg border text-left text-[11px] font-semibold transition-all cursor-pointer ${
                          adminKesimpulanPenilaian === 'Sesuai_Usulan_Officer'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-400'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Sesuai Usulan Officer</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Usulan penurunan tingkat risiko disetujui penuh.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdminKesimpulanPenilaian('Disesuaikan_Lebih_Tinggi')}
                        className={`p-2 rounded-lg border text-left text-[11px] font-semibold transition-all cursor-pointer ${
                          adminKesimpulanPenilaian === 'Disesuaikan_Lebih_Tinggi'
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Disesuaikan Lebih Tinggi</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Penilaian konservatif karena bukti mitigasi belum tuntas.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdminKesimpulanPenilaian('Disesuaikan_Lebih_Rendah')}
                        className={`p-2 rounded-lg border text-left text-[11px] font-semibold transition-all cursor-pointer ${
                          adminKesimpulanPenilaian === 'Disesuaikan_Lebih_Rendah'
                            ? 'bg-sky-50 dark:bg-sky-950/60 border-[#009fe3] text-sky-900 dark:text-sky-200 ring-1 ring-[#009fe3]'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1 text-[#009fe3]">
                          <TrendingDown className="w-3 h-3" />
                          <span>Disesuaikan Lebih Rendah</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Mitigasi sangat efektif melampaui estimasi awal.</p>
                      </button>
                    </div>

                    <div className="pt-1">
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Catatan Khusus Penilaian Tingkat Risiko oleh Admin:
                      </label>
                      <input
                        type="text"
                        value={adminCatatanPenilaianRisiko}
                        onChange={(e) => setAdminCatatanPenilaianRisiko(e.target.value)}
                        placeholder="Contoh: Usulan Officer dinilai valid karena pengujian fungsi telah sukses dan tidak ada deviasi teknis..."
                        className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* VISUAL MIGRATION PATH INDICATOR (PETA PERJALANAN TINGKAT RISIKO) */}
                  <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        Peta Migrasi Tingkat Risiko:
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-slate-800 dark:text-slate-200" title="Awal Inherent">
                          Awal: {selectedRisk.tingkatRisikoAwal} ({selectedRisk.inherentScore})
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#009fe3] font-bold" title="Usulan Officer">
                          Usulan Officer: {activeTwProposedLevel} ({activeTwProposedScore})
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          calculatedEvalLevel === 'Low' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' :
                          calculatedEvalLevel === 'Low to Mod' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' :
                          calculatedEvalLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' :
                          'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                        }`} title="Penilaian Resmi Admin">
                          Penetapan Admin: {calculatedEvalLevel} ({calculatedEvalScore})
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Delta Penurunan: {selectedRisk.inherentScore - calculatedEvalScore > 0 ? `-${selectedRisk.inherentScore - calculatedEvalScore} poin` : '0 poin'}
                    </span>
                  </div>
                </div>

                {/* 2. Catatan Evaluasi Admin */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    2. Uraian Catatan Evaluasi Efektivitas Pengendalian oleh Admin *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={evalCatatanAdmin}
                    onChange={(e) => setEvalCatatanAdmin(e.target.value)}
                    placeholder="Masukkan catatan penilaian objektivitas pengendalian risiko oleh Admin..."
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#009fe3] resize-none"
                  />
                </div>

                {/* 3. Penetapan Status Risiko Berdasarkan Hasil Evaluasi */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    3. Penetapan Status Risiko & Keputusan Evaluasi:
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                    {/* Opsi 1: Belum Selesai (Lanjut ke TW Selanjutnya & Tentukan PIC Baru) */}
                    <button
                      type="button"
                      onClick={() => setEvalDecision('Pengendalian_Lanjutan')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        evalDecision === 'Pengendalian_Lanjutan'
                          ? 'border-amber-500 bg-amber-50/70 dark:bg-yellow-950/40 ring-1 ring-amber-500 text-amber-950 dark:text-yellow-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-900 dark:text-yellow-300">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Belum Selesai (Lanjut TW)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Risiko belum tuntas dengan PIC lama. Alihkan ke TW berikutnya & input <strong>PIC baru</strong>.
                      </p>
                    </button>

                    {/* Opsi 2: Selesai Dikendalikan */}
                    <button
                      type="button"
                      onClick={() => setEvalDecision('Selesai')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        evalDecision === 'Selesai'
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500 text-emerald-950 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesai Dikendalikan</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tingkat residual sudah <strong>Low Risk</strong> atau mitigasi tuntas 100%. Tetapkan Selesai.
                      </p>
                    </button>

                    {/* Opsi 3: Carry Over */}
                    <button
                      type="button"
                      onClick={() => setEvalDecision('Carry_Over')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        evalDecision === 'Carry_Over'
                          ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 ring-1 ring-sky-500 text-sky-950 dark:text-sky-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-[#009fe3]">
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Carry Over (Tahun 2027)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Untuk risiko yang belum selesai di akhir TW 4 & membutuhkan mitigasi lintas tahun operasional.
                      </p>
                    </button>
                  </div>

                  {/* BAGIAN PENENTUAN KEMBALI PIC & RENCANA TINDAKAN LANJUTAN */}
                  {evalDecision === 'Pengendalian_Lanjutan' && !isCarryOverFormOpen && (
                    <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-yellow-950/30 border border-amber-300 dark:border-yellow-900 space-y-3.5 text-xs mt-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 dark:text-yellow-200 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-amber-600 dark:text-yellow-400" />
                          <span>Penentuan Kembali PIC & Rencana Tindakan Lanjutan:</span>
                        </span>
                        <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-yellow-200 px-2 py-0.5 rounded font-bold">
                          Lanjut ke {evalTargetTwLanjutan}
                        </span>
                      </div>

                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                        Apabila risiko belum selesai di triwulan yang ditentukan, Admin menugaskan <strong>1 Departemen PIC tunggal</strong> yang menjalankan fungsi Pelaksana Mitigasi sekaligus Pengendalian (VP Departemen Terkait) untuk triwulan selanjutnya ({evalTargetTwLanjutan}).
                      </p>

                      {/* 1. Target Triwulan Lanjutan */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Lanjut ke Triwulan Berikutnya *
                        </label>
                        <select
                          value={evalTargetTwLanjutan}
                          onChange={(e) => setEvalTargetTwLanjutan(e.target.value as any)}
                          className="w-full h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <option value="TW 2">TW 2 (Triwulan II 2026)</option>
                          <option value="TW 3">TW 3 (Triwulan III 2026)</option>
                          <option value="TW 4">TW 4 (Triwulan IV 2026)</option>
                          <option value="Carry Over">Carry Over (Tahun 2027)</option>
                        </select>
                      </div>

                      {!isCarryOverDecision && (
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-amber-200 dark:border-yellow-900/60 space-y-2.5">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Departemen yang Ditugaskan Melaksanakan Pengendalian *
                          </label>
                          <select
                            value={evalDeptPicBaru}
                            onChange={(e) => setEvalDeptPicBaru(e.target.value)}
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
                      )}

                      {/* Catatan arahan Admin untuk tindak lanjut */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Catatan - Arahan Admin untuk Departemen Pelaksana Pengendalian *
                        </label>
                        <textarea
                          rows={2}
                          value={evalPengendalianLanjutanDesc}
                          onChange={(e) => setEvalPengendalianLanjutanDesc(e.target.value)}
                          placeholder="Tuliskan arahan pelaksanaan tindakan pengendalian & target penyelesaian bagi departemen pelaksana..."
                          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  )}

                  {evalDecision === 'Selesai' && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Risiko akan resmi ditutup sebagai <strong>Selesai Dikendalikan</strong>. Skor residual dan target efektivitas telah terpenuhi, dan triwulan berikutnya otomatis ditutup.
                      </span>
                    </div>
                  )}

                  {(evalDecision === 'Carry_Over' || isCarryOverFormOpen) && (
                    <div className="p-3.5 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 space-y-2 text-xs">
                      <span className="font-bold text-[#009fe3] block">
                        Parameter Eskalasi Carry Over (Tahun 2027):
                      </span>
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-sky-200 dark:border-sky-800 space-y-2.5">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Departemen yang Ditugaskan Melaksanakan Pengendalian *
                        </label>
                        <select
                          value={evalDeptPicBaru}
                          onChange={(e) => setEvalDeptPicBaru(e.target.value)}
                          required
                          className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none cursor-pointer"
                        >
                          <option value="">-- Pilih Departemen Pelaksana Pengendalian --</option>
                          {departments.map((dept) => (
                            <option key={dept.kode} value={dept.nama}>
                              {dept.kode} - {dept.nama}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Departemen terpilih menjadi PIC pelaksana pengendalian untuk periode Carry Over 2027.
                        </p>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Alasan Carry Over ke Tahun Berikutnya:
                        </label>
                        <input
                          type="text"
                          value={carryOverAlasan}
                          onChange={(e) => setCarryOverAlasan(e.target.value)}
                          className="w-full h-8 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Rekomendasi Komite Manajemen Risiko:
                        </label>
                        <input
                          type="text"
                          value={carryOverRekomendasi}
                          onChange={(e) => setCarryOverRekomendasi(e.target.value)}
                          className="w-full h-8 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Decision Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Perubahan status, pemindahan triwulan, dan penugasan PIC baru langsung tersimpan di basis data terpusat.
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmittingEvaluation}
                    className="px-6 py-2.5 bg-[#009fe3] hover:bg-[#0284c7] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingEvaluation ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan Evaluasi...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-yellow-300" />
                        <span>
                          {evalDecision === 'Pengendalian_Lanjutan' && evalTargetTwLanjutan === 'Carry Over' && !isCarryOverFormOpen
                            ? 'Lanjut ke Form Carry Over 2027'
                            : isCarryOverDecision
                            ? 'Simpan Evaluasi & Lanjut ke Evaluasi Risiko & Penilaian Akhir'
                            : evalDecision === 'Pengendalian_Lanjutan'
                            ? `Simpan Evaluasi & Lanjut ke ${evalTargetTwLanjutan}`
                            : evalDecision === 'Selesai'
                            ? 'Simpan Evaluasi (Tetapkan Selesai Dikendalikan)'
                            : 'Simpan Evaluasi & Lanjut ke Carry Over 2027'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
                ) : (
                  <div
                    id="evaluasi-admin-form"
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <Lock className="w-4 h-4 text-slate-500" />
                      <span>Evaluasi {activeQuarter} masih terkunci</span>
                    </div>
                    <p>
                      {existingTwRecord?.statusKeputusan
                        ? `Evaluasi ${activeQuarter} telah selesai.`
                        : !existingTwRecord?.isPicAcc
                        ? `ACC laporan pengendalian PIC ${activeQuarter} terlebih dahulu.`
                        : `Laporan PIC telah di-ACC. Lakukan ACC Progres Pengerjaan Admin ${activeQuarter} terlebih dahulu untuk membuka evaluasi.`}
                    </p>
                  </div>
                )
              ) : (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#009fe3]" />
                      <span>Status Evaluasi & Keputusan Admin ERM Korporat ({activeQuarter})</span>
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                      Evaluasi {activeQuarter}
                    </span>
                  </div>

                  {existingTwRecord ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Posisi Risiko Residual Pasca-Pengendalian:</span>
                          <strong className="text-xs font-mono text-slate-800 dark:text-slate-200">
                            Likelihood: {existingTwRecord.kemungkinanResidual} • Dampak: {existingTwRecord.dampakResidual} (Skor: {existingTwRecord.kemungkinanResidual * existingTwRecord.dampakResidual})
                          </strong>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                          existingTwRecord.tingkatResidual === 'High' ? 'bg-rose-100 text-rose-800' :
                          existingTwRecord.tingkatResidual === 'Mod to High' ? 'bg-amber-100 text-amber-900' :
                          existingTwRecord.tingkatResidual === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          Tingkat Residual: {existingTwRecord.tingkatResidual}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Catatan & Evaluasi Efektivitas dari Admin:
                        </span>
                        <p className="text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed">
                          "{existingTwRecord.kendalaDanTindakLanjut || 'Progres telah terekam dan disinkronkan ke sistem manajemen risiko korporat.'}"
                        </p>
                      </div>

                      {/* DOKUMEN RESMI PENGENDALIAN SELESAI HANYA DI FORM YANG TELAH DISELESAIKAN */}
                      {isCurrentTwFinished && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/20 border-2 border-emerald-500 dark:border-emerald-600/80 text-emerald-950 dark:text-emerald-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                          <div className="flex items-start gap-2.5">
                            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 shadow-xs">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100">
                                  Formulir Pengendalian {activeQuarter} Telah Selesai
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-200 font-mono font-extrabold text-[10px] border border-emerald-400">
                                  SELESAI DIKENDALIKAN
                                </span>
                              </div>
                              <p className="text-[11px] text-emerald-900 dark:text-emerald-200 mt-1 leading-relaxed">
                                Formulir pengendalian {activeQuarter} ini telah tuntas diselesaikan dengan tingkat residual terkendali (<strong>{existingTwRecord.tingkatResidual}</strong>). Dokumen Berita Acara resmi serta Rekapitulasi Data siap diunduh di formulir yang telah diselesaikan ini.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => downloadQuarterlyControlPdf(selectedRisk, activeQuarter)}
                              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title={`Unduh Berita Acara & Laporan Resmi Pengendalian ${activeQuarter} (Format PDF Cetak)`}
                            >
                              <Download className="w-4 h-4 text-emerald-200" />
                              <span>Unduh Berita Acara (PDF)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadRiskControlExcelCsv(selectedRisk)}
                              className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title={`Unduh Rekapitulasi Data Pengendalian ${activeQuarter} ke Excel / CSV`}
                            >
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                              <span>Unduh Excel / CSV</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="font-bold">Menunggu Evaluasi & Verifikasi Admin Korporat</p>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                          Setelah PIC Pelaksana menyimpan laporan pengendalian triwulan di atas, Admin Manajemen Risiko Korporat akan melakukan ACC serta menginput progres pengerjaan dan evaluasi efektivitas untuk triwulan terkait.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CARD 3: RIWAYAT PEMANTAUAN & PERGANTIAN PIC TIAP TRIWULAN */}
              {selectedRisk.pengendalianTriwulan && selectedRisk.pengendalianTriwulan.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Rekam Jejak Evaluasi Triwulanan Terdahulu:</span>
                  </h4>

                  {/* INFORMASI HASIL INPUT FORM PENENTUAN DEPARTEMEN PELAKSANA AWAL (DARI APPROVAL ADMIN) */}
                  {(selectedRisk.picPelaksana || selectedRisk.picPengendali || selectedRisk.approvalNotesAdmin) && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50/50 dark:from-sky-950/40 dark:to-indigo-950/30 border border-sky-200 dark:border-sky-800/60 space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-sky-200/60 dark:border-sky-900/40">
                        <div className="flex items-center gap-1.5 font-bold text-sky-950 dark:text-sky-200 text-xs">
                          <UserCheck className="w-4 h-4 text-[#009fe3]" />
                          <span>Hasil Penentuan Departemen Pelaksana Pengendalian &amp; Arahan Awal (Approval Admin)</span>
                        </div>
                        <span className="text-[10px] bg-sky-200/80 dark:bg-sky-900 text-sky-950 dark:text-sky-200 px-2 py-0.5 rounded font-mono font-bold">
                          Penetapan Admin Korporat
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-lg bg-white/95 dark:bg-slate-900/90 border border-sky-100 dark:border-sky-950/80 shadow-2xs space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-semibold">
                            <UserCheck className="w-3.5 h-3.5 text-[#009fe3]" />
                            <span>Departemen Pelaksana Ditugaskan Admin:</span>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-xs pl-5">
                            {selectedRisk.picDepartemen || selectedRisk.picPelaksana || '-'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/95 dark:bg-slate-900/90 border border-sky-100 dark:border-sky-950/80 shadow-2xs space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Departemen Pengendali Ditugaskan (VP/Manajer):</span>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-xs pl-5">
                            {selectedRisk.picPengendali || selectedRisk.picDepartemen || '-'}
                          </p>
                        </div>
                      </div>
                      {selectedRisk.approvalNotesAdmin && (
                        <div className="p-2.5 rounded-lg bg-white/95 dark:bg-slate-900/90 border border-sky-100 dark:border-sky-950/80 text-[11px] space-y-0.5">
                          <span className="text-[10px] font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1">
                            <ClipboardList className="w-3 h-3 text-[#009fe3]" />
                            <span>Catatan - Arahan Penugasan Departemen dari Admin Korporat:</span>
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 italic pl-4 leading-relaxed">
                            "{selectedRisk.approvalNotesAdmin}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    {selectedRisk.pengendalianTriwulan.map((tw) => (
                      <div
                        key={tw.triwulan}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">
                              {tw.triwulan}
                            </span>
                            {tw.statusKeputusan && (
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                tw.statusKeputusan === 'Selesai'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : tw.statusKeputusan === 'Carry_Over'
                                  ? 'bg-sky-100 text-[#009fe3] dark:bg-sky-950 dark:text-sky-300'
                                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                              }`}>
                                {tw.statusKeputusan === 'Pengendalian_Lanjutan'
                                  ? `Lanjut ke ${tw.targetWaktuLanjutan || 'TW Lanjutan'}`
                                  : tw.statusKeputusan === 'Selesai'
                                  ? 'Selesai Dikendalikan'
                                  : 'Carry Over (2027)'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {tw.tingkatUsulanPic && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-100 text-[#009fe3] dark:bg-sky-950 dark:text-sky-300">
                                Usulan Officer: {tw.tingkatUsulanPic} (K={tw.kemungkinanUsulanPic || tw.kemungkinanResidual} × D={tw.dampakUsulanPic || tw.dampakResidual})
                              </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              tw.tingkatResidual === 'Low' ? 'bg-emerald-100 text-emerald-800' :
                              tw.tingkatResidual === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                              tw.tingkatResidual === 'Mod to High' ? 'bg-amber-100 text-amber-900' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              Penetapan Admin: {tw.tingkatResidual} (K={tw.kemungkinanResidual} × D={tw.dampakResidual})
                            </span>
                            {(tw.statusKeputusan === 'Selesai' || tw.statusPengendalian === 'Completed') && (
                              <button
                                type="button"
                                onClick={() => downloadQuarterlyControlPdf(selectedRisk, tw.triwulan)}
                                className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                title={`Unduh Berita Acara & Laporan Pengendalian Selesai ${tw.triwulan} (PDF)`}
                              >
                                <Download className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Unduh PDF</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Uraian Tindakan Realisasi Mitigasi */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">
                            Realisasi Pemantauan / Mitigasi Fisik:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                            {tw.realisasiKegiatan}
                          </p>
                        </div>

                        {/* Catatan Usulan Risk Officer */}
                        {tw.catatanUsulanPic && (
                          <div className="p-2.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 text-[11px] text-slate-700 dark:text-slate-300">
                            <span className="text-[10px] font-bold text-[#009fe3] block mb-0.5">Catatan Usulan Tingkat Risiko dari Risk Officer:</span>
                            <p className="italic leading-relaxed">"{tw.catatanUsulanPic}"</p>
                          </div>
                        )}

                        {/* Kendala Lapangan */}
                        {tw.kendalaDanTindakLanjut && (
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-line">
                            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Catatan Kendala &amp; Tindak Lanjut:</span>
                            {tw.kendalaDanTindakLanjut}
                          </div>
                        )}

                        {/* INFORMASI DARI HASIL INPUT FORM PENENTUAN PIC & KEPUTUSAN EVALUASI ADMIN */}
                        <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-yellow-950/30 border border-amber-200 dark:border-yellow-900/60 space-y-2.5">
                          <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60 dark:border-yellow-900/40">
                            <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-yellow-200 text-xs">
                              <UserCheck className="w-4 h-4 text-amber-600 dark:text-yellow-400" />
                              <span>Hasil Penentuan PIC &amp; Arahan Evaluasi Triwulanan ({tw.triwulan})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {tw.isPicAcc ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>ACC Resmi Admin</span>
                                </span>
                              ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-yellow-200 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-md font-bold">
                                  Menunggu ACC Admin
                                </span>
                              )}
                              {tw.targetWaktuLanjutan && (
                                <span className="text-[10px] bg-amber-200/90 dark:bg-amber-900 text-amber-950 dark:text-yellow-200 px-2 py-0.5 rounded-md font-bold font-mono">
                                  Lanjut ke {tw.targetWaktuLanjutan}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-white/95 dark:bg-slate-900/90 border border-amber-100 dark:border-yellow-950/80 shadow-2xs space-y-0.5">
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-semibold">
                                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                                <span>Departemen PIC {tw.picPelaksanaBaru ? 'Lanjutan' : 'Penanggung Jawab'}:</span>
                              </div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 text-xs pl-5">
                                {tw.picDepartemenBaru || tw.picPelaksanaBaru || selectedRisk.picDepartemen || selectedRisk.picPelaksana || 'PIC Unit Kerja'}
                              </p>
                            </div>

                            <div className="p-2 rounded-lg bg-white/95 dark:bg-slate-900/90 border border-amber-100 dark:border-yellow-950/80 shadow-2xs space-y-0.5">
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-semibold">
                                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                                <span>PIC Pengendali {tw.picPengendaliBaru ? 'Lanjutan (VP/Manajer)' : '(VP/Manajer Terkait)'}:</span>
                              </div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 text-xs pl-5">
                                {tw.picPengendaliBaru || selectedRisk.picPengendali || 'Vice President Terkait'}
                              </p>
                            </div>
                          </div>

                          {/* Status Verifikasi / Catatan ACC Admin */}
                          {tw.isPicAcc && (
                            <div className="p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-[11px] space-y-0.5">
                              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Status Verifikasi &amp; ACC Admin:</span>
                                </span>
                                <span className="font-mono">{tw.accBy ? `Oleh: ${tw.accBy}` : 'Admin ERM'} {tw.accDate ? `• ${new Date(tw.accDate).toLocaleDateString('id-ID')}` : ''}</span>
                              </div>
                              {tw.catatanAdminAcc && (
                                <p className="text-emerald-900 dark:text-emerald-200 italic pl-4 leading-relaxed">
                                  "{tw.catatanAdminAcc}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Catatan Arahan untuk PIC (Rencana Tindakan Lanjutan) */}
                          {(tw.pengendalianLanjutanDesc || tw.triwulan === 'TW 1' || selectedRisk.approvalNotesAdmin) && (
                            <div className="p-2.5 rounded-lg bg-white/95 dark:bg-slate-900/90 border border-amber-100 dark:border-yellow-950/80 shadow-2xs text-[11px] space-y-1">
                              <span className="text-[10px] font-bold text-amber-800 dark:text-yellow-300 flex items-center gap-1">
                                <ClipboardList className="w-3 h-3 text-amber-600" />
                                <span>Catatan - Arahan Rencana Tindakan untuk PIC:</span>
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed pl-4">
                                "{tw.pengendalianLanjutanDesc || (tw.triwulan === 'TW 1' ? selectedRisk.approvalNotesAdmin : undefined) || 'Laksanakan tindakan mitigasi sesuai SOP dan pantau progres secara berkala.'}"
                              </p>
                            </div>
                          )}

                          {/* Catatan Evaluasi Efektivitas Admin */}
                          {tw.catatanEvaluasiAdmin && (
                            <div className="p-2.5 rounded-lg bg-white/95 dark:bg-slate-900/90 border border-amber-100 dark:border-yellow-950/80 shadow-2xs text-[11px] space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-slate-400" />
                                <span>Catatan Evaluasi Admin Manajemen Risiko:</span>
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-4">
                                {tw.catatanEvaluasiAdmin}
                              </p>
                            </div>
                          )}

                          {/* Evaluator Footer */}
                          {(tw.dievaluasiOleh || tw.tanggalEvaluasi) && (
                            <div className="text-[10px] text-slate-400 text-right font-mono pt-0.5">
                              Ditetapkan oleh: {tw.dievaluasiOleh || 'Admin ERM'} {tw.tanggalEvaluasi ? `• ${tw.tanggalEvaluasi}` : ''}
                            </div>
                          )}
                        </div>

                        {/* Ringkasan Kemajuan Fisik & Biaya */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                          <span>Kemajuan Fisik PIC: <strong className="text-emerald-700 dark:text-emerald-300">{tw.progressFisikPic ?? tw.progressPersen}%</strong></span>
                          <span>Progres Admin: <strong className="text-slate-700 dark:text-slate-300">{tw.progresPengerjaanAdmin ?? tw.progressPersen}%</strong></span>
                          <span>Realisasi Biaya: Rp {(tw.realisasiBiaya || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              Pilih risiko dari daftar sebelah kiri untuk memantau, mengevaluasi hasil pengendalian, atau menugaskan PIC baru.
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* MODAL: ACC LAPORAN PENGENDALIAN PIC OLEH ADMIN */}
      {isAccModalOpen && selectedRisk && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-yellow-300" />
                <h3 className="font-bold text-sm">
                  Konfirmasi ACC Laporan Pengendalian PIC ({activeQuarter})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAccModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedRisk.kodeRisiko} - {selectedRisk.namaOrganisasi}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                    Kemajuan Fisik PIC: {picProgressPersen}%
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  PIC Pelaksana: <strong>{existingTwRecord?.reportedBy || selectedRisk.picPelaksana || 'PIC Unit Kerja'}</strong>
                </p>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/60 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Uraian Pelaksanaan PIC:</span>
                  "{existingTwRecord?.realisasiKegiatan || selectedRisk.pelaksanaanTindakan?.[0]?.uraianTindakan || `Pelaksanaan tindakan pengendalian risiko ${activeQuarter}`}"
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-yellow-950/40 border border-amber-300 dark:border-yellow-700 text-amber-900 dark:text-yellow-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Pemberitahuan Prosedur ERM:</strong> Setelah ACC disetujui, sistem <strong>tidak akan langsung berpindah ke triwulan berikutnya</strong>. Admin <strong>harus mengisi formulir Evaluasi Hasil Pengendalian ({activeQuarter}) terlebih dahulu</strong> untuk menetapkan tingkat risiko residual dan menentukan apakah risiko Selesai, Lanjut ke TW berikutnya dengan PIC baru, atau Carry Over.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Verifikasi / Persetujuan ACC Admin Korporat:
                </label>
                <textarea
                  rows={3}
                  value={accNotes}
                  onChange={(e) => setAccNotes(e.target.value)}
                  placeholder="Contoh: Laporan pelaksanaan pengendalian dari PIC telah diperiksa dan di-ACC resmi sesuai SOP ERM Pusri..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isAccSubmitting}
                  onClick={() => handleAccPicReport(accNotes)}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                  <span>{isAccSubmitting ? 'Memproses ACC...' : 'Setujui & ACC Laporan PIC (Lanjut Evaluasi)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
