import React, { useState, useMemo } from 'react';
import { 
  PusriRisk, 
  UserRole, 
  UserAccount,
  OrganizationMaster, 
  PelaksanaanTindakanRisiko, 
  ExecutionStatus, 
  ControlEffectiveness 
} from '../../types/pusri';
import { PusriApiClient } from '../../services/api';
import { AccessDeniedBanner } from './AccessDeniedBanner';
import { sortRisksNewestFirst } from '../../utils/riskMatrix';
import { 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  UserCheck, 
  DollarSign, 
  Percent, 
  Activity, 
  Eye, 
  Edit3, 
  Trash2, 
  Building2, 
  Lock, 
  Save, 
  X, 
  Filter, 
  ChevronRight, 
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
  User,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';

interface PelaksanaanRisikoViewProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  risks: PusriRisk[];
  departments: OrganizationMaster[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onSelectRisk: (risk: PusriRisk) => void;
  onNavigateNext?: (tab: string) => void;
  isPicDirectMenu?: boolean;
}

export const PelaksanaanRisikoView: React.FC<PelaksanaanRisikoViewProps> = ({
  currentRole,
  currentUser,
  risks,
  departments,
  onRiskUpdated,
  onSelectRisk,
  onNavigateNext,
  isPicDirectMenu
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'risiko-list' | 'riwayat-log'>('risiko-list');

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMyTasksOnly, setFilterMyTasksOnly] = useState<boolean>(false);

  // Modals state
  const [selectedRiskForAction, setSelectedRiskForAction] = useState<PusriRisk | null>(null);
  const [editingAction, setEditingAction] = useState<PelaksanaanTindakanRisiko | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActionDetail, setSelectedActionDetail] = useState<PelaksanaanTindakanRisiko | null>(null);
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  // Form State
  const [triwulanTarget, setTriwulanTarget] = useState<'TW 1' | 'TW 2' | 'TW 3' | 'TW 4'>('TW 1');
  const [tanggalPelaksanaan, setTanggalPelaksanaan] = useState<string>(new Date().toISOString().split('T')[0]);
  const [picPelaksana, setPicPelaksana] = useState<string>('');
  const [uraianTindakan, setUraianTindakan] = useState<string>('');
  const [progressPersen, setProgressPersen] = useState<number>(50);
  const [statusPelaksanaan, setStatusPelaksanaan] = useState<ExecutionStatus>('Sedang Berjalan');
  const [realisasiBiaya, setRealisasiBiaya] = useState<number>(0);
  const [efektivitas, setEfektivitas] = useState<ControlEffectiveness>('Efektif');
  const [kendalaDanHambatan, setKendalaDanHambatan] = useState<string>('');
  const [tindakLanjut, setTindakLanjut] = useState<string>('');
  const [nomorBuktiDokumen, setNomorBuktiDokumen] = useState<string>('');
  const [catatanAdmin, setCatatanAdmin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionToDelete, setActionToDelete] = useState<{ riskId: string; actionId: string } | null>(null);

  // Filter only active determined Mitigasi risks (Risiko yang sudah dinyatakan Selesai oleh Admin atau strategi non-mitigasi tidak ditampilkan di sini)
  const determinedRisks = useMemo(() => {
    return risks.filter((r) => 
      (r.jenisPenanganan === 'Mitigasi' || !r.jenisPenanganan) &&
      r.statusWorkflow !== 'Selesai' && 
      r.statusWorkflow !== 'Tercatat_Final' &&
      (r.statusWorkflow === 'Disetujui_Dalam_Pengendalian' || 
       (r.pelaksanaanTindakan && r.pelaksanaanTindakan.length > 0))
    ).sort(sortRisksNewestFirst);
  }, [risks]);

  // Filtered risks for display
  const filteredRisks = useMemo(() => {
    return determinedRisks.filter((r) => {
      if (filterMyTasksOnly) {
        const myName = (currentUser?.nama || 'syena').toLowerCase();
        const myBadge = (currentUser?.badge || currentUser?.nik || '0954').toLowerCase();
        const pic = (r.picPelaksana || '').toLowerCase();
        const matchMyTask = pic.includes(myName) || pic.includes(myBadge) || pic.includes('pic') || r.kodeOrganisasi === (currentUser?.kodeUnitKerja || 'OP-IIB');
        if (!matchMyTask) return false;
      }
      if (selectedDept !== 'ALL' && r.kodeOrganisasi !== selectedDept) return false;
      if (selectedStatus !== 'ALL') {
        const currentStatus = r.statusPelaksanaanTerakhir || 'Belum Dilaksanakan';
        if (currentStatus !== selectedStatus) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = r.kodeRisiko.toLowerCase().includes(q);
        const matchStatement = r.pernyataanRisiko.toLowerCase().includes(q);
        const matchPic = (r.picPelaksana || '').toLowerCase().includes(q);
        const matchPlan = (r.rencanaPenanganan || '').toLowerCase().includes(q);
        return matchCode || matchStatement || matchPic || matchPlan;
      }
      return true;
    }).sort(sortRisksNewestFirst);
  }, [determinedRisks, selectedDept, selectedStatus, searchTerm, filterMyTasksOnly, currentUser]);

  // All executed actions across determined risks for the Log Tab
  const allActionLogs = useMemo(() => {
    const logs: (PelaksanaanTindakanRisiko & { riskTitle?: string; deptName?: string })[] = [];
    determinedRisks.forEach((r) => {
      if (Array.isArray(r.pelaksanaanTindakan)) {
        r.pelaksanaanTindakan.forEach((act) => {
          logs.push({
            ...act,
            riskTitle: r.pernyataanRisiko,
            deptName: r.namaOrganisasi
          });
        });
      }
    });
    // Sort by date descending
    logs.sort((a, b) => new Date(b.tanggalPelaksanaan).getTime() - new Date(a.tanggalPelaksanaan).getTime());
    return logs;
  }, [determinedRisks]);

  // KPI Statistics
  const stats = useMemo(() => {
    const total = determinedRisks.length;
    let selesai = 0;
    let sedangBerjalan = 0;
    let terkendala = 0;
    let belum = 0;
    let totalBiaya = 0;
    let totalProg = 0;

    determinedRisks.forEach((r) => {
      const status = r.statusPelaksanaanTerakhir || 'Belum Dilaksanakan';
      if (status === 'Selesai Dilaksanakan') selesai++;
      else if (status === 'Sedang Berjalan') sedangBerjalan++;
      else if (status === 'Terkendala') terkendala++;
      else belum++;

      totalProg += (r.progressPelaksanaanTerakhir || 0);

      if (r.pelaksanaanTindakan) {
        r.pelaksanaanTindakan.forEach((act) => {
          totalBiaya += (act.realisasiBiaya || 0);
        });
      }
    });

    const avgProgress = total > 0 ? Math.round(totalProg / total) : 0;

    return {
      total,
      selesai,
      sedangBerjalan,
      terkendala,
      belum,
      totalBiaya,
      avgProgress
    };
  }, [determinedRisks]);

  // Helper: Cek apakah suatu Triwulan sudah di-ACC resmi oleh Admin
  const isQuarterAcc = (risk?: PusriRisk | null, tw?: string): boolean => {
    if (!risk || !risk.pengendalianTriwulan || !tw) return false;
    const qRecord = risk.pengendalianTriwulan.find((q) => q.triwulan === tw);
    return Boolean(qRecord?.isPicAcc || qRecord?.statusKeputusan);
  };

  // Helper: Tentukan triwulan berikutnya yang belum di-ACC oleh Admin secara otomatis
  const getNextAvailableQuarter = (risk?: PusriRisk | null): 'TW 1' | 'TW 2' | 'TW 3' | 'TW 4' => {
    const quarters: ('TW 1' | 'TW 2' | 'TW 3' | 'TW 4')[] = ['TW 1', 'TW 2', 'TW 3', 'TW 4'];
    if (!risk) return 'TW 1';
    for (const q of quarters) {
      if (!isQuarterAcc(risk, q)) {
        return q;
      }
    }
    // Jika semua triwulan telah di-ACC, tetap arahkan ke TW 4 (status terkunci)
    return 'TW 4';
  };

  // Open modal to add or edit action
  const handleOpenRecordModal = (risk: PusriRisk, action?: PelaksanaanTindakanRisiko) => {
    setSelectedRiskForAction(risk);
    if (action) {
      setEditingAction(action);
      const actTw = (action.triwulan as any) || (['TW 1', 'TW 2', 'TW 3', 'TW 4'].includes(risk.targetWaktuMitigasi) ? risk.targetWaktuMitigasi : 'TW 1');
      setTriwulanTarget(actTw);
      setTanggalPelaksanaan(action.tanggalPelaksanaan);
      setPicPelaksana(action.picPelaksana);
      setUraianTindakan(action.uraianTindakan);
      setProgressPersen(action.progressPersen);
      setStatusPelaksanaan(action.statusPelaksanaan);
      setRealisasiBiaya(action.realisasiBiaya);
      setEfektivitas(action.efektivitas);
      setKendalaDanHambatan(action.kendalaDanHambatan || '');
      setTindakLanjut(action.tindakLanjut || '');
      setNomorBuktiDokumen(action.nomorBuktiDokumen || '');
      setCatatanAdmin(action.catatanAdmin || '');
    } else {
      setEditingAction(null);
      // Otomatis ke TW berikutnya yang belum di-ACC oleh Admin
      const autoNextTw = getNextAvailableQuarter(risk);
      setTriwulanTarget(autoNextTw);
      setTanggalPelaksanaan(new Date().toISOString().split('T')[0]);
      const defaultPic = currentUser?.nama 
        ? `${currentUser.nama}${currentUser.nik || currentUser.badge ? ` (${currentUser.nik || currentUser.badge})` : ''}`
        : (currentRole === 'risk officer' ? 'FAUZAN AL GHANIYYU (0953)' : (risk.picPelaksana || 'PIC Departemen'));
      setPicPelaksana(defaultPic);
      setUraianTindakan(risk.rencanaPenanganan ? `Realisasi tindakan: ${risk.rencanaPenanganan}` : '');
      setProgressPersen(risk.progressPelaksanaanTerakhir !== undefined ? Math.min(100, risk.progressPelaksanaanTerakhir + 20) : 50);
      setStatusPelaksanaan(risk.statusPelaksanaanTerakhir || 'Sedang Berjalan');
      setRealisasiBiaya(risk.biayaRencanaPengendalian ? Math.round(risk.biayaRencanaPengendalian * 0.25) : 0);
      setEfektivitas('Efektif');
      setKendalaDanHambatan('');
      setTindakLanjut('');
      setNomorBuktiDokumen(`MEMO/PUSRI/${risk.kodeRisiko}/${new Date().getFullYear()}`);
      setCatatanAdmin('');
    }
    setIsModalOpen(true);
  };

  // Submit action recording to backend
  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRiskForAction) return;

    // KETENTUAN SISTEM: Apabila TW sudah di-ACC oleh Admin, maka TW tersebut terkunci dan tidak bisa diedit lagi
    if (isQuarterAcc(selectedRiskForAction, triwulanTarget)) {
      setFeedbackNotice({
        type: 'error',
        message: `Triwulan ${triwulanTarget} telah di-ACC resmi oleh Admin Manajemen Risiko Korporat dan terkunci. Data tidak dapat diedit lagi.`
      });
      return;
    }

    if (!uraianTindakan.trim() || uraianTindakan.trim().length < 5) {
      setFeedbackNotice({ type: 'error', message: 'Uraian tindakan pelaksanaan wajib diisi minimal 5 karakter.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackNotice(null);

    try {
      if (editingAction) {
        // Update existing action
        const result = await PusriApiClient.updatePelaksanaan(
          selectedRiskForAction.id,
          editingAction.id,
          {
            triwulan: triwulanTarget,
            tanggalPelaksanaan,
            picPelaksana: picPelaksana.trim(),
            uraianTindakan: uraianTindakan.trim(),
            progressPersen,
            statusPelaksanaan,
            realisasiBiaya,
            efektivitas,
            kendalaDanHambatan: kendalaDanHambatan.trim(),
            tindakLanjut: tindakLanjut.trim(),
            nomorBuktiDokumen: nomorBuktiDokumen.trim(),
            catatanAdmin: catatanAdmin.trim()
          },
          currentRole,
          picPelaksana.trim() || 'PIC Pelaksana'
        );

        if (result && result.risk) {
          onRiskUpdated(result.risk);
          setFeedbackNotice({
            type: 'success',
            message: `Catatan pelaksanaan [${editingAction.id}] berhasil diperbarui dan disinkronkan ke Pengendalian Triwulan (${triwulanTarget}) untuk di-ACC oleh Admin.`
          });
          setIsModalOpen(false);
        } else {
          throw new Error('Gagal memperbarui data pelaksanaan.');
        }
      } else {
        // Record new action
        const result = await PusriApiClient.recordPelaksanaan(
          selectedRiskForAction.id,
          {
            triwulan: triwulanTarget,
            tanggalPelaksanaan,
            picPelaksana: picPelaksana.trim(),
            uraianTindakan: uraianTindakan.trim(),
            progressPersen,
            statusPelaksanaan,
            realisasiBiaya,
            efektivitas,
            kendalaDanHambatan: kendalaDanHambatan.trim(),
            tindakLanjut: tindakLanjut.trim(),
            nomorBuktiDokumen: nomorBuktiDokumen.trim(),
            catatanAdmin: catatanAdmin.trim()
          },
          currentRole,
          picPelaksana.trim() || 'PIC Pelaksana'
        );

        if (result && result.risk) {
          onRiskUpdated(result.risk);
          setFeedbackNotice({
            type: 'success',
            message: `✅ Laporan pengendalian PIC untuk ${triwulanTarget} (${progressPersen}%) berhasil dicatat! Data telah masuk ke Pengendalian Triwulan (${triwulanTarget}) dan menunggu ACC Admin.`
          });
          setIsModalOpen(false);
        } else {
          throw new Error('Gagal mencatat pelaksanaan tindakan.');
        }
      }
    } catch (err: any) {
      setFeedbackNotice({
        type: 'error',
        message: err?.message || 'Terjadi kesalahan saat menyimpan pelaksanaan ke database.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete action (Admin only)
  const handleDeleteAction = async (riskId: string, actionId: string) => {
    try {
      const ok = await PusriApiClient.deletePelaksanaan(riskId, actionId, currentRole, 'Risk Admin Korporat');
      if (ok) {
        // Refetch or update locally
        const targetRisk = risks.find((r) => r.id === riskId);
        if (targetRisk && targetRisk.pelaksanaanTindakan) {
          const updatedActions = targetRisk.pelaksanaanTindakan.filter((a) => a.id !== actionId);
          const updatedRisk: PusriRisk = {
            ...targetRisk,
            pelaksanaanTindakan: updatedActions,
            statusPelaksanaanTerakhir: updatedActions.length > 0 ? updatedActions[0].statusPelaksanaan : 'Belum Dilaksanakan',
            progressPelaksanaanTerakhir: updatedActions.length > 0 ? updatedActions[0].progressPersen : 0
          };
          onRiskUpdated(updatedRisk);
        }
        setFeedbackNotice({
          type: 'success',
          message: `Catatan pelaksanaan [${actionId}] berhasil dihapus dari database.`
        });
      }
    } catch {
      setFeedbackNotice({ type: 'error', message: 'Gagal menghapus catatan pelaksanaan.' });
    } finally {
      setActionToDelete(null);
    }
  };

  const getStatusBadge = (status?: ExecutionStatus) => {
    switch (status) {
      case 'Selesai Dilaksanakan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selesai Dilaksanakan</span>
          </span>
        );
      case 'Sedang Berjalan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <PlayCircle className="w-3.5 h-3.5 text-[#009fe3]" />
            <span>Sedang Berjalan</span>
          </span>
        );
      case 'Terkendala':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Terkendala</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Belum Dilaksanakan</span>
          </span>
        );
    }
  };

  const getEffectivenessBadge = (eff?: ControlEffectiveness) => {
    switch (eff) {
      case 'Efektif':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">Efektif</span>;
      case 'Cukup Efektif':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">Cukup Efektif</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">Kurang Efektif</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* 2. Feedback Notification Banner */}
      {feedbackNotice && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-200 ${
          feedbackNotice.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2 font-semibold">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-xs font-bold underline hover:opacity-75 cursor-pointer ml-3 shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 3. KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
        {/* Total Risiko Ditentukan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold text-[11px]">Risiko Ditentukan</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl md:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-400">Siap dieksekusi PIC</div>
        </div>

        {/* Sedang Berjalan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
            <span className="font-bold text-[11px]">Sedang Berjalan</span>
            <PlayCircle className="w-4 h-4 text-[#009fe3]" />
          </div>
          <div className="text-xl md:text-2xl font-black font-mono text-[#009fe3] dark:text-sky-300">
            {stats.sedangBerjalan}
          </div>
          <div className="text-[10px] text-slate-400">Tindakan aktif berjalan</div>
        </div>

        {/* Selesai Dilaksanakan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="font-bold text-[11px]">Selesai Dilaksanakan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl md:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {stats.selesai}
          </div>
          <div className="text-[10px] text-slate-400">Mitigasi tuntas (100%)</div>
        </div>

        {/* Terkendala */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="font-bold text-[11px]">Terkendala</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl md:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
            {stats.terkendala}
          </div>
          <div className="text-[10px] text-slate-400">Butuh eskalasi / solusi</div>
        </div>

        {/* Rata-rata Progres Fisik */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-600 dark:text-yellow-400">
            <span className="font-bold text-[11px]">Rata-rata Progres</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl md:text-2xl font-black font-mono text-slate-900 dark:text-slate-100 flex items-baseline gap-1">
            <span>{stats.avgProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#009fe3] h-full rounded-full transition-all" style={{ width: `${stats.avgProgress}%` }} />
          </div>
        </div>

        {/* Total Realisasi Biaya */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold text-[11px]">Realisasi Anggaran</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm md:text-base font-black font-mono text-emerald-700 dark:text-emerald-400 truncate">
            Rp {(stats.totalBiaya / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt
          </div>
          <div className="text-[10px] text-slate-400 truncate">Total serapan tindakan</div>
        </div>
      </div>

      {/* 4. Controls & Navigation Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('risiko-list')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'risiko-list'
                ? 'bg-white dark:bg-slate-900 text-[#009fe3] dark:text-sky-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Daftar Risiko & Eksekusi Tindakan ({filteredRisks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('riwayat-log')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'riwayat-log'
                ? 'bg-white dark:bg-slate-900 text-[#009fe3] dark:text-sky-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Riwayat Log Tindakan ({allActionLogs.length})</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick toggle: Tugas Saya (Syena / PIC) */}
          <button
            type="button"
            onClick={() => setFilterMyTasksOnly(!filterMyTasksOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
              filterMyTasksOnly
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-600'
            }`}
            title="Tampilkan hanya risiko yang ditugaskan kepada saya"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Tugas Saya {currentUser?.nama ? `(${currentUser.nama})` : '(PIC)'}</span>
            {filterMyTasksOnly && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>

          {/* Department filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map((dept) => (
                <option key={dept.kode} value={dept.kode}>
                  {dept.kode} - {dept.nama.slice(0, 28)}...
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status Pelaksanaan</option>
              <option value="Sedang Berjalan">Sedang Berjalan</option>
              <option value="Selesai Dilaksanakan">Selesai Dilaksanakan</option>
              <option value="Terkendala">Terkendala</option>
              <option value="Belum Dilaksanakan">Belum Dilaksanakan</option>
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode/PIC/uraian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-none focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 5. TAB CONTENT: DAFTAR RISIKO & EKSEKUSI TINDAKAN */}
      {activeTab === 'risiko-list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-3.5 w-32">Kode & Level</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Pernyataan Risiko & Unit</th>
                  <th className="py-3 px-3.5 min-w-[220px]">Rencana Pengendalian & PIC</th>
                  <th className="py-3 px-3.5 w-36 text-center">Realisasi Biaya</th>
                  <th className="py-3 px-3.5 w-48 text-center">Progres & Status</th>
                  <th className="py-3 px-3.5 w-28 text-center">Tindakan</th>
                  <th className="py-3 px-3.5 w-40 text-center">Aksi Eksekusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRisks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-xs">Tidak ada data risiko yang sesuai kriteria filter.</p>
                        <p className="text-[11px] text-slate-400">Pastikan risiko telah melalui tahap persetujuan (Approval Admin).</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRisks.map((risk, idx) => {
                    const actionCount = risk.pelaksanaanTindakan?.length || 0;
                    const prog = risk.progressPelaksanaanTerakhir !== undefined ? risk.progressPelaksanaanTerakhir : (actionCount > 0 ? risk.pelaksanaanTindakan![0].progressPersen : 0);
                    const status = risk.statusPelaksanaanTerakhir || (actionCount > 0 ? risk.pelaksanaanTindakan![0].statusPelaksanaan : 'Belum Dilaksanakan');
                    
                    // Total realisasi biaya for this risk
                    const realCost = (risk.pelaksanaanTindakan || []).reduce((acc, curr) => acc + (curr.realisasiBiaya || 0), 0);

                    return (
                      <React.Fragment key={risk.id}>
                        <tr 
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                        {/* No */}
                        <td className="py-3.5 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Kode & Level */}
                        <td className="py-3.5 px-3.5">
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{risk.kodeRisiko}</span>
                          </div>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            risk.currentTingkatRisiko === 'High' 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : risk.currentTingkatRisiko === 'Mod to High'
                              ? 'bg-amber-100 text-amber-900 dark:bg-yellow-950/60 dark:text-yellow-300'
                              : risk.currentTingkatRisiko === 'Moderate'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {risk.currentTingkatRisiko} (Skor: {risk.inherentScore})
                          </span>
                        </td>

                        {/* Pernyataan & Unit Pemilik Risiko */}
                        <td className="py-3.5 px-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                            {risk.pernyataanRisiko}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">Unit Pemilik Risiko: <strong>{risk.namaOrganisasi}</strong></span>
                          </div>
                        </td>

                        {/* Rencana & Pelaksana Pengendalian yang Ditentukan Admin */}
                        <td className="py-3.5 px-3.5">
                          <p className="text-slate-700 dark:text-slate-300 line-clamp-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                            {risk.rencanaPenanganan || '(Belum ada rencana aksi terprogram)'}
                          </p>
                          <div className="mt-1 flex flex-col gap-0.5 text-[10px]">
                            <span className="font-bold text-[#009fe3] dark:text-sky-400 truncate" title={`Pelaksana Pengendalian (Ditugaskan Admin): ${risk.picDepartemen || risk.picPelaksana || risk.namaOrganisasi}`}>
                              Pelaksana Pengendalian (Ditugaskan Admin): {risk.picDepartemen || risk.picPelaksana || risk.namaOrganisasi}
                            </span>
                            <span className="font-mono text-slate-500 dark:text-slate-400">
                              Target Waktu: {risk.targetWaktuMitigasi || 'TW 2'}
                            </span>
                          </div>
                        </td>

                        {/* Realisasi Biaya */}
                        <td className="py-3.5 px-3.5 text-center">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            Rp {realCost.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Rencana: Rp {(risk.biayaRencanaPengendalian || 0).toLocaleString('id-ID')}
                          </div>
                        </td>

                        {/* Progres & Status */}
                        <td className="py-3.5 px-3.5 text-center">
                          <div className="space-y-1.5">
                            <div>{getStatusBadge(status)}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    prog >= 100 
                                      ? 'bg-emerald-500' 
                                      : prog >= 60 
                                      ? 'bg-[#009fe3]' 
                                      : prog >= 30 
                                      ? 'bg-amber-500' 
                                      : 'bg-slate-400'
                                  }`} 
                                  style={{ width: `${prog}%` }} 
                                />
                              </div>
                              <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300 w-8 text-right">
                                {prog}%
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Jumlah Tindakan & Toggle Detail */}
                        <td className="py-3.5 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedRiskId(expandedRiskId === risk.id ? null : risk.id)}
                            className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs transition-all cursor-pointer border ${
                              expandedRiskId === risk.id
                                ? 'bg-[#009fe3] text-white border-[#009fe3] shadow-xs'
                                : 'bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                            }`}
                            title="Klik untuk melihat/sembunyikan rincian proses & tindakan yang diinput PIC"
                          >
                            <span>{actionCount} Catatan</span>
                            <span className="ml-1 text-[10px]">{expandedRiskId === risk.id ? '▲' : '▼'}</span>
                          </button>
                        </td>

                        {/* Aksi Eksekusi */}
                        <td className="py-3.5 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenRecordModal(risk)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                              title="Input hasil pelaksanaan pengendalian risiko"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{currentRole === 'risk officer' ? 'Input Hasil Pengendalian' : 'Catat Aksi'}</span>
                              </button>

                            {/* Tombol Detail / Lihat Berkas */}
                            <button
                              type="button"
                              onClick={() => onSelectRisk(risk)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Detail Berkas Risiko"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Row: Laporan Proses & Tindakan yang Telah Di-input PIC */}
                      {expandedRiskId === risk.id && (
                        <tr className="bg-sky-50/50 dark:bg-slate-850/80 border-b border-sky-100 dark:border-slate-800 animate-fadeIn">
                          <td colSpan={7} className="p-4">
                            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-700 space-y-3 shadow-2xs">
                              <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-[#009fe3]" />
                                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                    Laporan Proses & Tindakan yang Telah Di-input PIC: <span className="font-mono text-[#009fe3]">{risk.kodeRisiko}</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-500 font-medium">Progres Terakhir:</span>
                                  <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    {prog}% Selesai
                                  </span>
                                  {getStatusBadge(status)}
                                </div>
                              </div>

                              {/* Catatan / Tindakan List */}
                              {risk.pelaksanaanTindakan && risk.pelaksanaanTindakan.length > 0 ? (
                                <div className="space-y-2">
                                  {risk.pelaksanaanTindakan.map((act, actIdx) => (
                                    <div
                                      key={act.id || actIdx}
                                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs"
                                    >
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-[#009fe3]">
                                            {act.id || `Tindakan #${actIdx + 1}`}
                                          </span>
                                          <span className="text-slate-400 font-mono text-[10px]">
                                            • {act.tanggalPelaksanaan}
                                          </span>
                                          <span className="text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                                            PIC: <strong className="text-slate-900 dark:text-slate-100">{act.picPelaksana}</strong>
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                                            {act.progressPersen}%
                                          </span>
                                          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-sky-50 text-[#009fe3] border border-sky-200">
                                            {act.statusPelaksanaan}
                                          </span>
                                          {isQuarterAcc(risk, act.triwulan) ? (
                                            <span
                                              className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded border border-emerald-300 dark:border-emerald-800 flex items-center gap-1"
                                              title="Laporan tindakan triwulan ini telah di-ACC oleh Admin dan tidak dapat diedit lagi"
                                            >
                                              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                              <span>Di-ACC (Terkunci)</span>
                                            </span>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenRecordModal(risk, act)}
                                              className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 cursor-pointer"
                                            >
                                              Edit
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                                        {act.uraianTindakan}
                                      </p>

                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-500 pt-0.5">
                                        {act.kendalaDanHambatan && act.kendalaDanHambatan !== '-' && (
                                          <div>
                                            <span className="font-bold text-rose-600">Kendala: </span>
                                            <span>{act.kendalaDanHambatan}</span>
                                          </div>
                                        )}
                                        {act.tindakLanjut && act.tindakLanjut !== '-' && (
                                          <div>
                                            <span className="font-bold text-sky-600">Tindak Lanjut: </span>
                                            <span>{act.tindakLanjut}</span>
                                          </div>
                                        )}
                                        {act.realisasiBiaya ? (
                                          <div>
                                            <span className="font-bold text-emerald-600">Serapan Biaya: </span>
                                            <span className="font-mono">Rp {act.realisasiBiaya.toLocaleString('id-ID')}</span>
                                          </div>
                                        ) : null}
                                        {act.nomorBuktiDokumen && (
                                          <div>
                                            <span className="font-bold">Bukti: </span>
                                            <span className="font-mono">{act.nomorBuktiDokumen}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3 text-center text-slate-400 text-xs">
                                  Belum ada catatan tindakan yang diinput oleh PIC untuk risiko ini. Klik tombol "+ Input Hasil Pengendalian" untuk mulai mencatat.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: RIWAYAT LOG PELAKSANAAN LENGKAP */}
      {activeTab === 'riwayat-log' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#009fe3]" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Log Lengkap Realisasi Tindakan Pengendalian (Audit Trail)
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total <strong>{allActionLogs.length}</strong> catatan eksekusi terekam di database
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="py-3 px-3.5 w-28">ID & Tgl</th>
                  <th className="py-3 px-3.5 w-32">Kode Risiko</th>
                  <th className="py-3 px-3.5 min-w-[220px]">Uraian Tindakan Dilaksanakan</th>
                  <th className="py-3 px-3.5 w-36">PIC Pelaksana</th>
                  <th className="py-3 px-3.5 w-32 text-center">Status & Progres</th>
                  <th className="py-3 px-3.5 w-28 text-center">Efektivitas</th>
                  <th className="py-3 px-3.5 w-32 text-center">Realisasi Biaya</th>
                  <th className="py-3 px-3.5 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allActionLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Belum ada catatan pelaksanaan tindakan yang direkam. Klik tombol "Catat Aksi" pada daftar risiko.
                    </td>
                  </tr>
                ) : (
                  allActionLogs.map((act) => {
                    const parentRisk = risks.find((r) => r.id === act.riskId);

                    return (
                      <tr key={act.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        {/* ID & Tanggal */}
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                            {act.id}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{act.tanggalPelaksanaan}</span>
                          </span>
                        </td>

                        {/* Kode Risiko */}
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold text-[#009fe3] dark:text-sky-400">
                            {act.kodeRisiko}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                            {act.deptName}
                          </span>
                        </td>

                        {/* Uraian Tindakan */}
                        <td className="py-3 px-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                            {act.uraianTindakan}
                          </p>
                          {act.kendalaDanHambatan && (
                            <p className="text-[11px] text-rose-600 dark:text-rose-400 line-clamp-1 mt-0.5 italic">
                              Hambatan: {act.kendalaDanHambatan}
                            </p>
                          )}
                          {act.nomorBuktiDokumen && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span className="font-mono">{act.nomorBuktiDokumen}</span>
                            </div>
                          )}
                        </td>

                        {/* PIC Pelaksana */}
                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                            {act.picPelaksana}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Oleh: {act.diperbaruiOleh}
                          </span>
                        </td>

                        {/* Status & Progres */}
                        <td className="py-3 px-3.5 text-center">
                          <div>{getStatusBadge(act.statusPelaksanaan)}</div>
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 mt-1 block">
                            {act.progressPersen}%
                          </span>
                        </td>

                        {/* Efektivitas */}
                        <td className="py-3 px-3.5 text-center">
                          {getEffectivenessBadge(act.efektivitas)}
                        </td>

                        {/* Realisasi Biaya */}
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Rp {(act.realisasiBiaya || 0).toLocaleString('id-ID')}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedActionDetail(act)}
                              className="p-1.5 text-slate-500 hover:text-[#009fe3] hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Detail Realisasi & Bukti Dokumen"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {parentRisk && (
                              isQuarterAcc(parentRisk, act.triwulan) ? (
                                <span
                                  className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center justify-center"
                                  title="Laporan tindakan triwulan ini telah di-ACC oleh Admin dan tidak dapat diedit lagi"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRecordModal(parentRisk, act)}
                                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Catatan Pelaksanaan Ini"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )
                            )}

                            {currentRole === 'risk admin' && (
                              actionToDelete?.actionId === act.id ? (
                                <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/70 p-1 rounded-lg border border-red-300">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAction(act.riskId, act.id)}
                                    className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-600 rounded hover:bg-red-700 cursor-pointer"
                                  >
                                    Ya
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActionToDelete(null)}
                                    className="px-1 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setActionToDelete({ riskId: act.riskId, actionId: act.id })}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Catatan (Khusus Admin)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )
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
      )}

      {/* 7. MODAL: CATAT / EDIT PELAKSANAAN TINDAKAN RISIKO */}
      {isModalOpen && selectedRiskForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            {/* Header Modal */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#009fe3] to-[#0284c7] text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  <PlayCircle className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingAction ? 'Edit Catatan Pelaksanaan Tindakan' : 'Catat Pelaksanaan Tindakan Pengendalian'}
                  </h3>
                  <p className="text-[11px] text-sky-100 font-mono">
                    Risiko: {selectedRiskForAction.kodeRisiko} • {selectedRiskForAction.namaOrganisasi}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Box */}
            <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-100 dark:border-sky-900/40 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Pernyataan Risiko:
              </div>
              <p className="text-slate-700 dark:text-slate-300 italic">
                "{selectedRiskForAction.pernyataanRisiko}"
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Rencana SOP: <strong>{selectedRiskForAction.rencanaPenanganan}</strong></span>
                <span className="font-mono">Anggaran: Rp {(selectedRiskForAction.biayaRencanaPengendalian || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAction} className="p-5 space-y-4 text-xs">
              {/* Pemilihan Triwulan Pelaporan */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                    Pilih Periode Triwulan Pengendalian (TW 1 - TW 4) *
                  </label>
                  <span className="font-mono text-xs font-bold text-[#009fe3]">
                    Fokus Laporan: {triwulanTarget}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['TW 1', 'TW 2', 'TW 3', 'TW 4'] as const).map((tw) => {
                    const isAcc = isQuarterAcc(selectedRiskForAction, tw);
                    const isSelected = triwulanTarget === tw;

                    return (
                      <button
                        key={tw}
                        type="button"
                        onClick={() => setTriwulanTarget(tw)}
                        className={`py-2 px-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer relative ${
                          isSelected
                            ? isAcc
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-[#009fe3] text-white border-[#009fe3] shadow-xs'
                            : isAcc
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{tw}</span>
                          {isAcc && <Lock className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <span className="text-[9px] block font-mono font-normal opacity-90 mt-0.5">
                          {isAcc ? 'Di-ACC Admin' : 'Dapat Diisi'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {isQuarterAcc(selectedRiskForAction, triwulanTarget) ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 mt-2">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="font-bold">Laporan {triwulanTarget} Telah Di-ACC Resmi oleh Admin</p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        Triwulan yang sudah di-ACC tidak dapat diedit lagi oleh PIC. Silakan pilih triwulan berikutnya yang belum di-ACC untuk melanjutkan pelaporan.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Data laporan fisik PIC ini otomatis masuk ke modul <strong>Pengendalian Triwulan ({triwulanTarget})</strong> untuk diverifikasi &amp; di-ACC resmi oleh Admin.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tanggal Pelaksanaan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Realisasi Pelaksanaan *
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalPelaksanaan}
                    onChange={(e) => setTanggalPelaksanaan(e.target.value)}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none"
                  />
                </div>

                {/* PIC Pelaksana */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PIC / Petugas Pelaksana *
                  </label>
                  <input
                    type="text"
                    required
                    value={picPelaksana}
                    onChange={(e) => setPicPelaksana(e.target.value)}
                    placeholder="Nama PIC / Jabatan Pelaksana"
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none"
                  />
                </div>
              </div>

              {/* Status Pelaksanaan & Efektivitas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Pelaksanaan *
                  </label>
                  <select
                    value={statusPelaksanaan}
                    onChange={(e) => {
                      const val = e.target.value as ExecutionStatus;
                      setStatusPelaksanaan(val);
                      if (val === 'Selesai Dilaksanakan' && progressPersen < 100) {
                        setProgressPersen(100);
                      }
                    }}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none cursor-pointer"
                  >
                    <option value="Sedang Berjalan">Sedang Berjalan (Dalam Proses Tindakan)</option>
                    <option value="Selesai Dilaksanakan">Selesai Dilaksanakan (Tuntas 100%)</option>
                    <option value="Terkendala">Terkendala (Ada Hambatan Lapangan)</option>
                    <option value="Belum Dilaksanakan">Belum Dilaksanakan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat Efektivitas Pengendalian *
                  </label>
                  <select
                    value={efektivitas}
                    onChange={(e) => setEfektivitas(e.target.value as ControlEffectiveness)}
                    className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none cursor-pointer"
                  >
                    <option value="Efektif">Efektif (Menurunkan potensi risiko sesuai target)</option>
                    <option value="Cukup Efektif">Cukup Efektif (Perlu pengawasan berkala)</option>
                    <option value="Kurang Efektif">Kurang Efektif (Perlu tindakan perbaikan ekstra)</option>
                  </select>
                </div>
              </div>

              {/* Progres Persen Slider & Biaya */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Input Progres Kemajuan Fisik PIC (%) *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={progressPersen}
                        onChange={(e) => {
                          const p = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setProgressPersen(p);
                          if (p >= 100) setStatusPelaksanaan('Selesai Dilaksanakan');
                          else if (p > 0 && statusPelaksanaan === 'Belum Dilaksanakan') setStatusPelaksanaan('Sedang Berjalan');
                        }}
                        className="w-16 h-7 px-1.5 text-center font-mono font-bold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:border-[#009fe3] outline-none"
                      />
                      <span className="font-bold text-xs text-[#009fe3]">%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressPersen}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setProgressPersen(p);
                      if (p >= 100) setStatusPelaksanaan('Selesai Dilaksanakan');
                      else if (p > 0 && statusPelaksanaan === 'Belum Dilaksanakan') setStatusPelaksanaan('Sedang Berjalan');
                    }}
                    className="w-full accent-[#009fe3] cursor-pointer"
                  />

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    <span className="text-[9px] text-slate-400 font-semibold mr-0.5">Preset:</span>
                    {[0, 25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setProgressPersen(val);
                          if (val >= 100) setStatusPelaksanaan('Selesai Dilaksanakan');
                          else if (val > 0 && statusPelaksanaan === 'Belum Dilaksanakan') setStatusPelaksanaan('Sedang Berjalan');
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                          progressPersen === val
                            ? 'bg-[#009fe3] text-white border-[#009fe3] shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                        }`}
                      >
                        {val === 100 ? '100% Selesai' : `${val}%`}
                      </button>
                    ))}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        progressPersen >= 100 ? 'bg-emerald-500' : progressPersen >= 50 ? 'bg-[#009fe3]' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progressPersen}%` }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Realisasi Biaya Tindakan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={realisasiBiaya}
                    onChange={(e) => setRealisasiBiaya(Number(e.target.value))}
                    placeholder="0"
                    className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Rp {realisasiBiaya.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Uraian Tindakan Dilaksanakan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Uraian Realisasi Tindakan Pengendalian yang Dilaksanakan *
                </label>
                <textarea
                  required
                  rows={3}
                  value={uraianTindakan}
                  onChange={(e) => setUraianTindakan(e.target.value)}
                  placeholder="Deskripsikan langkah konkrit, pekerjaan teknis, inspeksi, atau mitigasi operasional yang telah dilaksanakan di lapangan..."
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none resize-none"
                />
              </div>

              {/* Kendala & Solusi Tindak Lanjut */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kendala / Hambatan Lapangan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={kendalaDanHambatan}
                    onChange={(e) => setKendalaDanHambatan(e.target.value)}
                    placeholder="Misal: Keterlambatan vendor, cuaca ekstrem, spare part impor..."
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tindak Lanjut / Rekomendasi Solusi
                  </label>
                  <textarea
                    rows={2}
                    value={tindakLanjut}
                    onChange={(e) => setTindakLanjut(e.target.value)}
                    placeholder="Langkah antisipatif berikutnya..."
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Bukti Dokumen (Catatan Verifikasi Admin ditiadakan untuk role PIC) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor / Referensi Bukti Dokumen
                </label>
                <input
                  type="text"
                  value={nomorBuktiDokumen}
                  onChange={(e) => setNomorBuktiDokumen(e.target.value)}
                  placeholder="No Memo, Berita Acara, Foto Dokumentasi..."
                  className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none"
                />
              </div>

              {/* Footer actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Data otomatis tersimpan langsung ke database MySQL terpusat.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || isQuarterAcc(selectedRiskForAction, triwulanTarget)}
                    className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      isQuarterAcc(selectedRiskForAction, triwulanTarget)
                        ? 'bg-slate-400 text-white cursor-not-allowed'
                        : 'bg-[#009fe3] hover:bg-[#0284c7] text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan ke DB...</span>
                      </>
                    ) : isQuarterAcc(selectedRiskForAction, triwulanTarget) ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-white" />
                        <span>Triwulan Telah Di-ACC (Terkunci)</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-yellow-300" />
                        <span>{editingAction ? 'Perbarui Catatan Pelaksanaan' : 'Simpan Pelaksanaan Tindakan'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: LIHAT DETAIL LOG & BUKTI PENDUKUNG */}
      {selectedActionDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-[#009fe3] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-yellow-300" />
                <div>
                  <h4 className="font-bold text-sm">Detail Pelaksanaan [{selectedActionDetail.id}]</h4>
                  <p className="text-[10px] text-sky-100 font-mono">Kode Risiko: {selectedActionDetail.kodeRisiko}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActionDetail(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Tanggal Pelaksanaan</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedActionDetail.tanggalPelaksanaan}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Status & Progres</span>
                  <div className="mt-0.5">{getStatusBadge(selectedActionDetail.statusPelaksanaan)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">PIC Pelaksana</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedActionDetail.picPelaksana}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Realisasi Biaya</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    Rp {selectedActionDetail.realisasiBiaya.toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Uraian Realisasi Tindakan:
                </span>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed">
                  {selectedActionDetail.uraianTindakan}
                </p>
              </div>

              {selectedActionDetail.kendalaDanHambatan && (
                <div>
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1 block">
                    Hambatan & Kendala Lapangan:
                  </span>
                  <p className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 leading-relaxed">
                    {selectedActionDetail.kendalaDanHambatan}
                  </p>
                </div>
              )}

              {selectedActionDetail.tindakLanjut && (
                <div>
                  <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 mb-1 block">
                    Tindak Lanjut / Solusi:
                  </span>
                  <p className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-sky-900 dark:text-sky-200 leading-relaxed">
                    {selectedActionDetail.tindakLanjut}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold">Bukti / Dokumen:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedActionDetail.nomorBuktiDokumen || '(Tidak dicantumkan)'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold">Diperbarui Oleh:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedActionDetail.diperbaruiOleh}</span>
                </div>
              </div>

              {selectedActionDetail.catatanAdmin && (
                <div className="p-2.5 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 text-amber-900 dark:text-yellow-200 text-[11px]">
                  <strong>Catatan Verifikasi Admin:</strong> {selectedActionDetail.catatanAdmin}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedActionDetail(null)}
                  className="px-4 py-2 rounded-xl bg-[#009fe3] text-white font-bold text-xs hover:bg-[#0284c7] cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
