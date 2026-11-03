import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ExternalLink, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  ArrowUpDown,
  Building2,
  User,
  Edit2,
  Shield
} from 'lucide-react';
import { PusriRisk, UserRole, UserAccount } from '../types/pusri';
import { getMasterRiskLevel, sortRisksNewestFirst } from '../utils/riskMatrix';

// Helper function untuk mendapatkan nama user yang melakukan progres setiap risiko
export function getRiskProgressUser(risk: PusriRisk): { nama: string; label: string; progress: number } {
  // 1. Cek dari tindakan pelaksanaan terbaru yang diinput
  if (risk.pelaksanaanTindakan && risk.pelaksanaanTindakan.length > 0) {
    const lastAction = risk.pelaksanaanTindakan[risk.pelaksanaanTindakan.length - 1];
    if (lastAction.diperbaruiOleh || lastAction.picPelaksana) {
      return {
        nama: lastAction.diperbaruiOleh || lastAction.picPelaksana,
        label: lastAction.triwulan ? `Pelaksana ${lastAction.triwulan}` : 'Pelaksana Tindakan',
        progress: lastAction.progressPersen ?? risk.progressPelaksanaanTerakhir ?? 0
      };
    }
  }

  // 2. Cek dari pengendalian triwulan yang memiliki progress atau reportedBy
  if (risk.pengendalianTriwulan && risk.pengendalianTriwulan.length > 0) {
    const reportedTw = [...risk.pengendalianTriwulan].reverse().find(
      (q) => q.reportedBy || (q.progressFisikPic !== undefined && q.progressFisikPic > 0) || q.progressPersen > 0
    );
    if (reportedTw) {
      return {
        nama: reportedTw.reportedBy || reportedTw.dievaluasiOleh || risk.picPelaksana || 'PIC Unit Kerja',
        label: `Laporan ${reportedTw.triwulan}`,
        progress: reportedTw.progressFisikPic ?? reportedTw.progressPersen ?? risk.progressPelaksanaanTerakhir ?? 0
      };
    }
  }

  // 3. Cek dari userProgres / diperbaruiOleh
  if (risk.userProgres) {
    return {
      nama: risk.userProgres,
      label: 'Update Terakhir',
      progress: risk.progressPelaksanaanTerakhir || 0
    };
  }
  if (risk.diperbaruiOleh) {
    return {
      nama: risk.diperbaruiOleh,
      label: 'Update Terakhir',
      progress: risk.progressPelaksanaanTerakhir || 0
    };
  }

  // 4. Default ke PIC Pelaksana atau Pembuat (createdBy)
  return {
    nama: risk.picPelaksana || risk.createdBy || 'Petugas Unit Kerja',
    label: risk.picPelaksana ? 'PIC Pelaksana' : 'Inisiator Unit',
    progress: risk.progressPelaksanaanTerakhir || 0
  };
}

interface RiskTableProps {
  risks: PusriRisk[];
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  onOpenNewRisk: () => void;
  onSelectRisk: (risk: PusriRisk) => void;
  onOpenUpdateRiskModal?: (risk: PusriRisk) => void;
  selectedMatrixCell: string | null;
  onClearMatrixCell: () => void;
  onTriggerSync?: () => void;
}

export const RiskTable: React.FC<RiskTableProps> = ({
  risks,
  currentRole,
  currentUser,
  onOpenNewRisk,
  onSelectRisk,
  onOpenUpdateRiskModal,
  selectedMatrixCell,
  onClearMatrixCell,
  onTriggerSync
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [filterMyUnitOnly, setFilterMyUnitOnly] = useState(false);

  // Filter logic: Exclude risks declared Selesai by Admin (only viewable in Evaluasi Risiko & Carry Over)
  const filtered = risks.filter((r) => {
    if (r.statusWorkflow === 'Selesai') {
      return false;
    }

    const uDept = currentUser?.unitKerja?.toLowerCase().trim() || '';
    const uKode = currentUser?.kodeUnitKerja?.toLowerCase().trim() || '';
    const rDept = (r.namaOrganisasi || '').toLowerCase().trim();
    const rKode = (r.kodeOrganisasi || '').toLowerCase().trim();
    const rPicDept = (r.picDepartemen || r.picPelaksana || r.picPengendali || '').toLowerCase().trim();
    const isMyDept = !uDept || rDept.includes(uDept) || uDept.includes(rDept) || (uKode && rKode === uKode) || rPicDept.includes(uDept) || (uKode && rPicDept.includes(uKode));

    // Aturan RBAC: Hanya Risk Admin yang dapat melihat seluruh risiko perusahaan.
    // Pada role Risk Owner dan Risk Officer, disinkronkan apa yang dapat dilihat (hanya data departemennya)
    if (currentRole !== 'risk admin') {
      if (!isMyDept) return false;
    } else if (filterMyUnitOnly && currentUser?.unitKerja) {
      if (!isMyDept) return false;
    }

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        r.kodeRisiko.toLowerCase().includes(q) ||
        r.pernyataanRisiko.toLowerCase().includes(q) ||
        r.namaOrganisasi.toLowerCase().includes(q) ||
        (r.picPelaksana && r.picPelaksana.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    // Category
    if (selectedCategory !== 'ALL' && r.kategoriRisiko !== selectedCategory) {
      return false;
    }

    // Status
    if (selectedStatus !== 'ALL' && r.statusWorkflow !== selectedStatus) {
      return false;
    }

    // Matrix cell filter
    if (selectedMatrixCell) {
      const cellKey = `L${r.kemungkinanAwal}xD${r.dampakAwal}`;
      if (cellKey !== selectedMatrixCell) return false;
    }

    return true;
  }).sort(sortRisksNewestFirst);

  const getStatusBadge = (status: string, jenisPenanganan?: string) => {
    switch (status) {
      case 'Draft_Unit':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Draft Unit
          </span>
        );
      case 'Revisi':
      case 'revisi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <RotateCcw className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            (revisi)
          </span>
        );
      case 'Menunggu_Approval_VP':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Review Atasan / VP
          </span>
        );
      case 'Menunggu_Approval_Admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <AlertTriangle className="w-3 h-3 text-[#009fe3] dark:text-sky-400" />
            Approval Admin
          </span>
        );
      case 'Disetujui_Dalam_Pengendalian':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <CheckCircle2 className="w-3 h-3 text-[#009fe3] dark:text-sky-400" />
            Monitoring TW 1-4
          </span>
        );
      case 'Tercatat_Final':
        return jenisPenanganan !== 'Mitigasi' ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Disetujui Atasan / VP
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Final / Tercatat
          </span>
        );
      case 'Carry_Over':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <RotateCcw className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            Carry Over
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            Terkendali / Selesai
          </span>
        );
      default:
        return <span className="text-xs text-slate-600 dark:text-slate-400">{status}</span>;
    }
  };

  const getRiskScoreBadge = (k: number, d: number, score: number, _level: string) => {
    const level = getMasterRiskLevel(k, d);
    let bg = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    if (level === 'High') bg = 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900 font-bold';
    else if (level === 'Mod to High') bg = 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900 font-bold';
    else if (level === 'Moderate') bg = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900 font-semibold';
    else if (level === 'Low to Mod') bg = 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-900';
    else if (level === 'Low') bg = 'bg-sky-100 dark:bg-sky-900/60 text-[#009fe3] dark:text-sky-300 border-sky-300 dark:border-sky-800';

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${bg}`}>
        <span>L{k}×D{d} = {score}</span>
        <span className="text-[10px] opacity-75">({level})</span>
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden mt-4 transition-colors">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Daftar Register Risiko Korporat & Unit Kerja</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Database tersinkronisasi via REST API Golang & Database MySQL InnoDB
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {selectedMatrixCell && (
            <button
              onClick={onClearMatrixCell}
              className="px-2.5 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Matriks: {selectedMatrixCell}</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold ml-1">×</span>
            </button>
          )}

          <button
            onClick={onOpenNewRisk}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#009fe3] hover:bg-[#0284c7] rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Input Risiko</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-3 bg-slate-50/70 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2.5 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all"
          />
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 cursor-pointer shadow-2xs transition-all"
        >
          <option value="ALL">Semua Kategori</option>
          <option value="Operasional">Operasional</option>
          <option value="Keuangan">Keuangan</option>
          <option value="Strategis">Strategis</option>
          <option value="Hukum & Kepatuhan">Hukum & Kepatuhan</option>
        </select>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 cursor-pointer shadow-2xs transition-all"
        >
          <option value="ALL">Semua Status (Aktif)</option>
          <option value="Revisi">(revisi)</option>
          <option value="Menunggu_Approval_VP">Review Atasan / VP</option>
          <option value="Menunggu_Approval_Admin">Approval Admin</option>
          <option value="Disetujui_Dalam_Pengendalian">Monitoring TW 1-4</option>
          <option value="Carry_Over">Carry Over</option>
        </select>

        {/* Badge Isolasi Unit Kerja untuk Risk Owner & Risk Officer (Data Sinkron) / Mode Super Admin */}
        {currentRole !== 'risk admin' && currentUser?.unitKerja ? (
          <div className="h-9 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-[#009fe3]" />
            <span>Unit: {currentUser.unitKerja} (Data Terisolasi & Sinkron)</span>
          </div>
        ) : currentUser?.unitKerja ? (
          <div className="flex items-center gap-2">
            <div className="h-9 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5">
              <span>Mode Super Admin: Seluruh Unit Kerja</span>
            </div>
            <button
              type="button"
              onClick={() => setFilterMyUnitOnly(!filterMyUnitOnly)}
              className={`h-9 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                filterMyUnitOnly
                  ? 'bg-[#009fe3] border-[#009fe3] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#009fe3]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{filterMyUnitOnly ? 'Unit Saya Aktif' : 'Filter Unit Korporat'}</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
              <th className="py-2.5 px-3.5 whitespace-nowrap">Kode & Departemen</th>
              <th className="py-2.5 px-3.5">Pernyataan Risiko & Tindakan Mitigasi</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Kategori</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Skor Matriks</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Strategi</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">User Progres</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Status Alur SOP</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400 dark:text-slate-500">
                  Tidak ada data risiko yang sesuai dengan kriteria filter.
                </td>
              </tr>
            ) : (
              filtered.map((risk) => {
                const progressUser = getRiskProgressUser(risk);
                const isUnfinished = risk.statusWorkflow !== 'Selesai';
                const uDept = currentUser?.unitKerja?.toLowerCase().trim() || '';
                const uKode = currentUser?.kodeUnitKerja?.toLowerCase().trim() || '';
                const rDept = (risk.namaOrganisasi || '').toLowerCase().trim();
                const rKode = (risk.kodeOrganisasi || '').toLowerCase().trim();
                const rPicDept = (risk.picDepartemen || risk.picPelaksana || risk.picPengendali || '').toLowerCase().trim();
                const isMyDept = !uDept || rDept.includes(uDept) || uDept.includes(rDept) || (uKode && rKode === uKode) || rPicDept.includes(uDept) || (uKode && rPicDept.includes(uKode));

                // Risk Admin hanya melakukan approval; Risk Owner & Risk Officer hanya mengedit risiko unitnya.
                const canEditRisk = isUnfinished && (
                  ((currentRole === 'risk owner' || currentRole === 'risk officer') && isMyDept)
                );

                return (
                  <tr
                    key={risk.id}
                    onClick={() => onSelectRisk(risk)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    {/* Kode & Unit */}
                    <td className="py-3 px-3.5 whitespace-nowrap align-top">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#009fe3] dark:group-hover:text-sky-400 transition-colors">
                        {risk.kodeRisiko}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[170px]">
                        {risk.namaOrganisasi}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 flex items-center justify-between">
                        <span>PIC: {risk.picPelaksana || '-'}</span>
                      </div>
                    </td>

                    {/* Pernyataan Risiko & Rencana */}
                    <td className="py-3 px-3.5 max-w-[320px] align-top">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                        {risk.pernyataanRisiko}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Mitigasi:</span> {risk.rencanaPenanganan || 'Belum ada mitigasi'}
                      </p>
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-3.5 whitespace-nowrap align-top">
                      <span className="inline-block px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                        {risk.kategoriRisiko}
                      </span>
                    </td>

                    {/* Inherent Matrix Score */}
                    <td className="py-3 px-3.5 whitespace-nowrap align-top">
                      {getRiskScoreBadge(
                        risk.kemungkinanAwal,
                        risk.dampakAwal,
                        risk.inherentScore,
                        risk.currentTingkatRisiko
                      )}
                    </td>

                    {/* Strategi */}
                    <td className="py-3 px-3.5 whitespace-nowrap align-top">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        risk.jenisPenanganan === 'Mitigasi' 
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 border border-sky-200 dark:border-sky-800' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {risk.jenisPenanganan}
                      </span>
                    </td>

                    {/* Kolom User Progres */}
                    <td className="py-3 px-3.5 whitespace-nowrap align-top">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <User className="w-3.5 h-3.5 text-[#009fe3] shrink-0" />
                        <span className="truncate max-w-[150px]" title={progressUser.nama}>{progressUser.nama}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {progressUser.label}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5" title={`Capaian progres: ${progressUser.progress}%`}>
                        <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              progressUser.progress >= 100 
                                ? 'bg-emerald-500' 
                                : progressUser.progress >= 50 
                                ? 'bg-[#009fe3]' 
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, progressUser.progress))}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#009fe3] dark:text-sky-400">
                          {progressUser.progress}%
                        </span>
                      </div>
                    </td>

                    {/* Status Workflow */}
                    <td className="py-3 px-3.5 whitespace-nowrap align-top">
                      {getStatusBadge(risk.statusWorkflow, risk.jenisPenanganan)}
                    </td>

                    {/* Action button */}
                    <td className="py-3 px-3.5 whitespace-nowrap align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRisk(risk);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-sky-800 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 border border-sky-300 dark:border-sky-800 rounded-md transition-colors cursor-pointer"
                          title="Buka Detail Risiko"
                        >
                          Detail
                        </button>

                        {onOpenUpdateRiskModal && canEditRisk && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenUpdateRiskModal(risk);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-[#009fe3] hover:bg-[#0284c7] border border-[#009fe3] rounded-md transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                            title={`Edit data risiko ini atas nama ${currentUser?.nama || 'Pengguna'}`}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Data</span>
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
};
