import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  TrendingDown,
  CheckCircle2,
  ShieldAlert,
  Building2,
  Search,
  Filter,
  Layers,
  DollarSign,
  ArrowRight,
  BarChart3,
  Eye,
  PlusCircle,
  Sparkles,
  Clock,
  RotateCcw
} from 'lucide-react';
import { PusriRisk, OrganizationMaster, UserRole, UserAccount } from '../../types/pusri';
import { getMasterRiskLevel, getRiskBadgeClasses, sortRisksNewestFirst } from '../../utils/riskMatrix';
import {
  downloadAnnualRecapPdf,
  downloadAnnualRecapCsv,
  downloadQuarterlyControlPdf,
  YearlyRecapStat
} from '../../utils/downloadRiskReport';

interface RekapTahunanViewProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  risks: PusriRisk[];
  departments: OrganizationMaster[];
  onSelectRisk: (risk: PusriRisk) => void;
  onNavigateTab?: (tab: string) => void;
  initialYear?: number | 'ALL';
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export const RekapTahunanView: React.FC<RekapTahunanViewProps> = ({
  currentRole,
  currentUser,
  risks,
  departments,
  onSelectRisk,
  onNavigateTab,
  initialYear = 'ALL'
}) => {
  // Hanya mengambil data mulai dari tahun 2024 dan seterusnya
  const risksFrom2024 = useMemo(() => {
    return risks.filter((r) => (Number(r.tahun) || 2026) >= 2024);
  }, [risks]);

  // Daftar tahun dinamis mulai 2024 dan seterusnya (2024, 2025, 2026, 2027, 2028, dst.)
  const [customMaxYear, setCustomMaxYear] = useState<number>(2028);
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([2024, 2025, 2026, 2027, 2028]);
    for (let y = 2024; y <= customMaxYear; y++) {
      yearSet.add(y);
    }
    risksFrom2024.forEach((r) => {
      const y = Number(r.tahun) || 2026;
      if (y >= 2024) yearSet.add(y);
      if (r.carryOverInfo?.targetTahun && r.carryOverInfo.targetTahun >= 2024) {
        yearSet.add(r.carryOverInfo.targetTahun);
      }
    });
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [risksFrom2024, customMaxYear]);

  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>(initialYear);

  useEffect(() => {
    setSelectedYear(initialYear);
  }, [initialYear]);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'komparasi-tahunan' | 'rekap-departemen' | 'register-tahunan'>('komparasi-tahunan');

  // Helper untuk menghitung skor dan realisasi per risiko
  const getRiskMetrics = (r: PusriRisk) => {
    const inherentScore = r.inherentScore || (Number(r.kemungkinanAwal || 1) * Number(r.dampakAwal || 1));
    const inherentLevel = getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal);
    const lastTw = r.pengendalianTriwulan && r.pengendalianTriwulan.length > 0
      ? r.pengendalianTriwulan[r.pengendalianTriwulan.length - 1]
      : null;
    const residualK = lastTw ? Number(lastTw.kemungkinanResidual || r.kemungkinanAwal) : Number(r.kemungkinanAwal || 1);
    const residualD = lastTw ? Number(lastTw.dampakResidual || r.dampakAwal) : Number(r.dampakAwal || 1);
    const residualScore = residualK * residualD;
    const residualLevel = lastTw ? lastTw.tingkatResidual : r.currentTingkatRisiko || inherentLevel;

    // Total / latest realisasi biaya & progres
    const realisasiBiaya = lastTw
      ? Number(lastTw.realisasiBiaya || 0)
      : Number(r.pelaksanaanTindakan?.[0]?.realisasiBiaya || 0);
    const progressPersen = r.statusWorkflow === 'Selesai'
      ? 100
      : lastTw
        ? Number(lastTw.progressPersen ?? lastTw.progressFisikPic ?? 0)
        : Number(r.progressPelaksanaanTerakhir ?? 0);

    return {
      inherentScore,
      inherentLevel,
      residualScore,
      residualLevel,
      realisasiBiaya,
      progressPersen
    };
  };

  // Hitung statistik rekapitulasi untuk setiap tahun (2024 dan seterusnya)
  const yearlyStats: YearlyRecapStat[] = useMemo(() => {
    return availableYears.map((yr) => {
      const yrRisks = risksFrom2024.filter((r) => {
        const matchYear = (Number(r.tahun) || 2026) === yr;
        const matchDept = selectedDept === 'ALL' || r.kodeOrganisasi === selectedDept;
        const matchCat = selectedCategory === 'ALL' || r.kategoriRisiko === selectedCategory;
        return matchYear && matchDept && matchCat;
      });

      const total = yrRisks.length;
      const high = yrRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'High').length;
      const modToHigh = yrRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Mod to High').length;
      const moderate = yrRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Moderate').length;
      const lowToMod = yrRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Low to Mod').length;
      const low = yrRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Low').length;

      const selesai = yrRisks.filter((r) => r.statusWorkflow === 'Selesai').length;
      const carryOver = yrRisks.filter((r) => r.statusWorkflow === 'Carry_Over').length;
      const menungguApproval = yrRisks.filter(
        (r) => r.statusWorkflow === 'Menunggu_Approval_VP' || r.statusWorkflow === 'Menunggu_Approval_Admin' || r.statusWorkflow === 'Draft_Unit' || r.statusWorkflow === 'Revisi'
      ).length;
      const dalamPengendalian = yrRisks.filter((r) => r.statusWorkflow === 'Disetujui_Dalam_Pengendalian').length;

      let totalAnggaran = 0;
      let totalRealisasi = 0;
      let sumProgress = 0;
      let sumInherent = 0;
      let sumResidual = 0;

      yrRisks.forEach((r) => {
        const m = getRiskMetrics(r);
        totalAnggaran += Number(r.biayaRencanaPengendalian || 0);
        totalRealisasi += m.realisasiBiaya;
        sumProgress += m.progressPersen;
        sumInherent += m.inherentScore;
        sumResidual += m.residualScore;
      });

      return {
        tahun: yr,
        total,
        high,
        modToHigh,
        moderate,
        lowToMod,
        low,
        selesai,
        dalamPengendalian,
        carryOver,
        menungguApproval,
        totalAnggaran,
        totalRealisasi,
        avgProgress: total > 0 ? Math.round(sumProgress / total) : 0,
        avgInherentScore: total > 0 ? sumInherent / total : 0,
        avgResidualScore: total > 0 ? sumResidual / total : 0
      };
    });
  }, [availableYears, risksFrom2024, selectedDept, selectedCategory]);

  // Data risiko yang terfilter sesuai pilihan Tahun, Departemen, Kategori, Level, Status, dan Pencarian
  const filteredRisks = useMemo(() => {
    return risksFrom2024.filter((r) => {
      const rYear = Number(r.tahun) || 2026;
      if (selectedYear !== 'ALL' && rYear !== selectedYear) return false;
      if (selectedDept !== 'ALL' && r.kodeOrganisasi !== selectedDept) return false;
      if (selectedCategory !== 'ALL' && r.kategoriRisiko !== selectedCategory) return false;

      const inherentLvl = getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal);
      if (selectedLevel !== 'ALL' && inherentLvl !== selectedLevel) return false;

      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'SELESAI' && r.statusWorkflow !== 'Selesai') return false;
        if (selectedStatus === 'AKTIF' && r.statusWorkflow !== 'Disetujui_Dalam_Pengendalian') return false;
        if (selectedStatus === 'CARRY_OVER' && r.statusWorkflow !== 'Carry_Over') return false;
        if (
          selectedStatus === 'APPROVAL' &&
          r.statusWorkflow !== 'Menunggu_Approval_VP' &&
          r.statusWorkflow !== 'Menunggu_Approval_Admin' &&
          r.statusWorkflow !== 'Draft_Unit'
        ) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = `${r.kodeRisiko} ${r.namaOrganisasi} ${r.kodeOrganisasi} ${r.pernyataanRisiko} ${r.sasaranRKAP} ${r.rencanaPenanganan} ${r.tahun}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    }).sort(sortRisksNewestFirst);
  }, [risksFrom2024, selectedYear, selectedDept, selectedCategory, selectedLevel, selectedStatus, searchQuery]);

  // Agregat KPI untuk pilihan saat ini
  const aggregateKpi = useMemo(() => {
    const total = filteredRisks.length;
    const selesai = filteredRisks.filter((r) => r.statusWorkflow === 'Selesai').length;
    const aktif = filteredRisks.filter((r) => r.statusWorkflow === 'Disetujui_Dalam_Pengendalian').length;
    const carryOver = filteredRisks.filter((r) => r.statusWorkflow === 'Carry_Over').length;
    const highAndModHigh = filteredRisks.filter((r) => {
      const lvl = getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal);
      return lvl === 'High' || lvl === 'Mod to High';
    }).length;

    let totalAnggaran = 0;
    let totalRealisasi = 0;
    let sumProgress = 0;
    let sumInherent = 0;
    let sumResidual = 0;

    filteredRisks.forEach((r) => {
      const m = getRiskMetrics(r);
      totalAnggaran += Number(r.biayaRencanaPengendalian || 0);
      totalRealisasi += m.realisasiBiaya;
      sumProgress += m.progressPersen;
      sumInherent += m.inherentScore;
      sumResidual += m.residualScore;
    });

    const avgProgress = total > 0 ? Math.round(sumProgress / total) : 0;
    const avgInherent = total > 0 ? sumInherent / total : 0;
    const avgResidual = total > 0 ? sumResidual / total : 0;
    const serapanPersen = totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 100) : 0;

    return {
      total,
      selesai,
      aktif,
      carryOver,
      highAndModHigh,
      totalAnggaran,
      totalRealisasi,
      avgProgress,
      avgInherent,
      avgResidual,
      serapanPersen
    };
  }, [filteredRisks]);

  // Rekapitulasi per Departemen untuk Tahun Terpilih
  const departmentRecap = useMemo(() => {
    const map = new Map<
      string,
      {
        kode: string;
        nama: string;
        direktorat: string;
        total: number;
        highModHigh: number;
        selesai: number;
        aktif: number;
        carryOver: number;
        anggaran: number;
        realisasi: number;
        sumProgress: number;
      }
    >();

    departments.forEach((d) => {
      map.set(d.kode, {
        kode: d.kode,
        nama: d.nama,
        direktorat: d.direktorat,
        total: 0,
        highModHigh: 0,
        selesai: 0,
        aktif: 0,
        carryOver: 0,
        anggaran: 0,
        realisasi: 0,
        sumProgress: 0
      });
    });

    filteredRisks.forEach((r) => {
      const m = getRiskMetrics(r);
      const existing = map.get(r.kodeOrganisasi) || {
        kode: r.kodeOrganisasi,
        nama: r.namaOrganisasi,
        direktorat: 'Direktorat Korporat',
        total: 0,
        highModHigh: 0,
        selesai: 0,
        aktif: 0,
        carryOver: 0,
        anggaran: 0,
        realisasi: 0,
        sumProgress: 0
      };

      existing.total += 1;
      if (m.inherentLevel === 'High' || m.inherentLevel === 'Mod to High') {
        existing.highModHigh += 1;
      }
      if (r.statusWorkflow === 'Selesai') existing.selesai += 1;
      if (r.statusWorkflow === 'Disetujui_Dalam_Pengendalian') existing.aktif += 1;
      if (r.statusWorkflow === 'Carry_Over') existing.carryOver += 1;
      existing.anggaran += Number(r.biayaRencanaPengendalian || 0);
      existing.realisasi += m.realisasiBiaya;
      existing.sumProgress += m.progressPersen;

      map.set(r.kodeOrganisasi, existing);
    });

    return Array.from(map.values())
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [departments, filteredRisks]);

  const selectedYearLabel = selectedYear === 'ALL'
    ? `Semua Tahun (2024 - ${availableYears[availableYears.length - 1]})`
    : `Tahun RKAP ${selectedYear}`;

  const handleResetFilters = () => {
    setSelectedYear('ALL');
    setSelectedDept('ALL');
    setSelectedCategory('ALL');
    setSelectedLevel('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Header Banner Rekap Data Portal Risiko Per Tahun (2024 & Seterusnya) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white border border-sky-800/60 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-[#009fe3] text-white text-[11px] font-mono font-bold uppercase tracking-wider">
                MULTI-YEAR ERM RECAP
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-mono font-bold">
                Periode 2024 s/d {availableYears[availableYears.length - 1]}+
              </span>
              {currentRole !== 'risk admin' && currentUser?.unitKerja && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-semibold">
                  Unit Kerja: {currentUser.unitKerja}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-400 shrink-0" />
              <span>Rekapitulasi Data Portal Risiko Per Tahun (Mulai Tahun 2024 &amp; Seterusnya)</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Pusat data historis, pemantauan tahun berjalan, dan proyeksi RKAP multi-tahun PT Pupuk Sriwidjaja Palembang.
              Pantau perbandingan profil risiko inherent vs residual, serapan anggaran mitigasi, dan status penyelesaian dari tahun 2024 hingga tahun-tahun mendatang.
            </p>
          </div>

          {/* Tombol Ekspor Laporan Rekap Tahunan (PDF & CSV/Excel) */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() =>
                downloadAnnualRecapPdf(
                  selectedYear === 'ALL' ? yearlyStats : yearlyStats.filter((s) => s.tahun === selectedYear),
                  filteredRisks,
                  selectedYearLabel
                )
              }
              className="px-3.5 py-2 rounded-xl bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Unduh PDF Rekap Tahunan</span>
            </button>

            <button
              type="button"
              onClick={() =>
                downloadAnnualRecapCsv(
                  selectedYear === 'ALL' ? yearlyStats : yearlyStats.filter((s) => s.tahun === selectedYear),
                  filteredRisks,
                  selectedYearLabel
                )
              }
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Excel / CSV (2024+)</span>
            </button>
          </div>
        </div>

        {/* Selector Tab Tahun (2024, 2025, 2026, 2027, 2028, dst.) */}
        <div className="mt-4 pt-4 border-t border-sky-800/60 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-sky-300 mr-1 uppercase tracking-wider">
              Pilih Tahun RKAP:
            </span>
            <button
              type="button"
              onClick={() => setSelectedYear('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedYear === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm ring-2 ring-sky-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
              }`}
            >
              <span>Semua Tahun (2024+)</span>
              <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 text-[10px]">
                {risksFrom2024.length}
              </span>
            </button>

            {availableYears.map((yr) => {
              const countForYr = risksFrom2024.filter((r) => (Number(r.tahun) || 2026) === yr).length;
              const isSelected = selectedYear === yr;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(isSelected ? 'ALL' : yr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#009fe3] text-white shadow-sm ring-2 ring-sky-300'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
                  }`}
                >
                  <span>Tahun {yr}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : countForYr > 0
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {countForYr}
                  </span>
                </button>
              );
            })}

            {/* Tombol Tambah Tahun Proyeksi Berikutnya (2029, 2030, dst.) */}
            <button
              type="button"
              onClick={() => setCustomMaxYear((prev) => prev + 1)}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold font-mono bg-slate-800/50 hover:bg-slate-800 text-sky-300 border border-dashed border-sky-600/60 transition-all cursor-pointer flex items-center gap-1"
              title="Tambahkan kolom tahun proyeksi berikutnya (2029, 2030, dan seterusnya)"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Tahun {customMaxYear + 1}</span>
            </button>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('identifikasi')}
              className="text-xs font-semibold text-sky-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>+ Input Data Risiko Baru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Ringkasan Rekapitulasi (6 Kartu Eksekutif) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            TOTAL RISIKO ({selectedYear === 'ALL' ? '2024+' : selectedYear})
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
            {aggregateKpi.total}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            High &amp; Mod-High: <strong className="text-red-600 dark:text-red-400 font-mono">{aggregateKpi.highAndModHigh}</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
          <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            SELESAI DIKENDALIKAN
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {aggregateKpi.selesai}
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">
            Rasio Tuntas: <strong className="font-mono">{aggregateKpi.total > 0 ? Math.round((aggregateKpi.selesai / aggregateKpi.total) * 100) : 0}%</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/60 shadow-2xs">
          <div className="text-[10px] font-bold text-[#009fe3] dark:text-sky-400 uppercase tracking-wider">
            DALAM PENGENDALIAN
          </div>
          <div className="text-2xl font-extrabold text-[#009fe3] dark:text-sky-400 font-mono mt-1">
            {aggregateKpi.aktif}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Carry Over: <strong className="text-amber-600 dark:text-amber-400 font-mono">{aggregateKpi.carryOver}</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            RATA-RATA PROGRES FISIK
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
            {aggregateKpi.avgProgress}%
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-[#009fe3] rounded-full transition-all"
              style={{ width: `${ Math.min(100, aggregateKpi.avgProgress) }%` }}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            PENURUNAN SKOR RISIKO
          </div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-1 flex items-center gap-1.5">
            <span className="text-red-500">{aggregateKpi.avgInherent.toFixed(1)}</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="text-emerald-600 dark:text-emerald-400">{aggregateKpi.avgResidual.toFixed(1)}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Inherent ke Residual
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            REALISASI BIAYA MITIGASI
          </div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-1.5 truncate" title={formatRupiah(aggregateKpi.totalRealisasi)}>
            {formatRupiah(aggregateKpi.totalRealisasi)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Dari Pagu {formatRupiah(aggregateKpi.totalAnggaran)} ({aggregateKpi.serapanPersen}%)
          </div>
        </div>
      </div>

      {/* Baris Filter Lanjutan & Sub-Tab Navigasi */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveSubTab('komparasi-tahunan')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'komparasi-tahunan'
                  ? 'bg-[#009fe3] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tabel &amp; Grafik Rekap Per Tahun (2024+)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('rekap-departemen')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'rekap-departemen'
                  ? 'bg-[#009fe3] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Rekap Per Departemen ({departmentRecap.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('register-tahunan')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'register-tahunan'
                  ? 'bg-[#009fe3] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Daftar Register Risiko Per Tahun ({filteredRisks.length})</span>
            </button>
          </div>

          {/* Reset Filter Button */}
          {(selectedYear !== 'ALL' ||
            selectedDept !== 'ALL' ||
            selectedCategory !== 'ALL' ||
            selectedLevel !== 'ALL' ||
            selectedStatus !== 'ALL' ||
            searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-[#009fe3] dark:text-sky-400 flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Pencarian */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode, pernyataan, sasaran..."
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none"
            />
          </div>

          {/* Filter Departemen */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none"
          >
            <option value="ALL">Semua Departemen / Unit Kerja</option>
            {departments.map((d) => (
              <option key={d.kode} value={d.kode}>
                {d.kode} - {d.nama}
              </option>
            ))}
          </select>

          {/* Filter Kategori */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none"
          >
            <option value="ALL">Semua Kategori Taksonomi</option>
            <option value="Operasional">Operasional</option>
            <option value="Keuangan">Keuangan</option>
            <option value="Strategis">Strategis</option>
            <option value="Hukum & Kepatuhan">Hukum &amp; Kepatuhan</option>
          </select>

          {/* Filter Tingkat Risiko */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none"
          >
            <option value="ALL">Semua Tingkat Risiko (Inherent)</option>
            <option value="High">High Risk (17-25)</option>
            <option value="Mod to High">Mod to High (12-16)</option>
            <option value="Moderate">Moderate (8-11)</option>
            <option value="Low to Mod">Low to Mod (4-7)</option>
            <option value="Low">Low Risk (1-3)</option>
          </select>

          {/* Filter Status Penyelesaian */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none"
          >
            <option value="ALL">Semua Status Penyelesaian</option>
            <option value="SELESAI">Selesai Dikendalikan (Tuntas)</option>
            <option value="AKTIF">Disetujui / Dalam Pengendalian</option>
            <option value="CARRY_OVER">Carry Over Multi-Tahun</option>
            <option value="APPROVAL">Tahap Review VP / Approval Admin</option>
          </select>
        </div>
      </div>

      {/* =====================================================================
          SUB-TAB 1: TABEL & GRAFIK KOMPARASI REKAPITULASI PER TAHUN (2024+)
         ===================================================================== */}
      {activeSubTab === 'komparasi-tahunan' && (
        <div className="space-y-4">
          {/* Tabel Rekapitulasi Per Tahun (2024 dan seterusnya) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#009fe3]" />
                  <span>Tabel Komparasi Rekap Data Portal Risiko Per Tahun (Mulai 2024 &amp; Seterusnya)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Klik pada baris tahun untuk memfilter detail risiko pada tahun anggaran tersebut.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Menampilkan {yearlyStats.length} Tahun Anggaran (2024 - {availableYears[availableYears.length - 1]})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold">
                    <th className="py-3 px-3.5">Tahun RKAP</th>
                    <th className="py-3 px-3 text-center">Total Risiko</th>
                    <th className="py-3 px-3 text-center">High</th>
                    <th className="py-3 px-3 text-center">Mod-High</th>
                    <th className="py-3 px-3 text-center">Moderate</th>
                    <th className="py-3 px-3 text-center">Low-Mod / Low</th>
                    <th className="py-3 px-3 text-center">Selesai Tuntas</th>
                    <th className="py-3 px-3 text-center">Aktif / Carry Over</th>
                    <th className="py-3 px-3 text-center">Rata Progres</th>
                    <th className="py-3 px-3 text-right">Pagu Anggaran</th>
                    <th className="py-3 px-3 text-right">Realisasi Biaya</th>
                    <th className="py-3 px-3 text-center">Skor (Inherent → Residual)</th>
                    <th className="py-3 px-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {yearlyStats.map((st) => {
                    const isSelectedRow = selectedYear === st.tahun;
                    const completionRate = st.total > 0 ? Math.round((st.selesai / st.total) * 100) : 0;
                    return (
                      <tr
                        key={st.tahun}
                        onClick={() => setSelectedYear(isSelectedRow ? 'ALL' : st.tahun)}
                        className={`transition-colors cursor-pointer ${
                          isSelectedRow
                            ? 'bg-sky-50/90 dark:bg-sky-950/50 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-[#009fe3]/10 text-[#009fe3] dark:text-sky-400 border border-[#009fe3]/30">
                              Tahun {st.tahun}
                            </span>
                            {st.tahun === 2026 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-sans font-bold">
                                Tahun Berjalan
                              </span>
                            )}
                            {st.tahun < 2026 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-sans font-semibold">
                                Historis
                              </span>
                            )}
                            {st.tahun > 2026 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-sans font-semibold">
                                RKAP Lanjutan
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                          {st.total}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded font-bold ${st.high > 0 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'text-slate-400'}`}>
                            {st.high}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded font-bold ${st.modToHigh > 0 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' : 'text-slate-400'}`}>
                            {st.modToHigh}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded font-bold ${st.moderate > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'text-slate-400'}`}>
                            {st.moderate}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-sky-600 dark:text-sky-400 font-bold">
                          {st.lowToMod + st.low}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
                            {st.selesai} ({completionRate}%)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[11px]">
                          <span className="text-[#009fe3] dark:text-sky-400 font-bold">{st.dalamPengendalian} Aktif</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">{st.carryOver} CO</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-14 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#009fe3] rounded-full"
                                style={{ width: `${Math.min(100, st.avgProgress)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-[11px]">{st.avgProgress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {formatRupiah(st.totalAnggaran)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          {formatRupiah(st.totalRealisasi)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono whitespace-nowrap">
                          {st.total > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              <strong className="text-red-500">{st.avgInherentScore.toFixed(1)}</strong>
                              <span>→</span>
                              <strong className="text-emerald-600 dark:text-emerald-400">{st.avgResidualScore.toFixed(1)}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedYear(st.tahun);
                              setActiveSubTab('register-tahunan');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#009fe3]/10 hover:bg-[#009fe3] text-[#009fe3] hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                          >
                            Buka Register {st.tahun}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visualisasi Tren Distribusi Risiko & Efektivitas Penurunan Risiko Per Tahun */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Kartu 1: Komposisi Tingkat Risiko Per Tahun (2024+) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#009fe3]" />
                  <span>Distribusi Tingkat Risiko Inherent Per Tahun (2024+)</span>
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />High</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />Mod-High</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Mod</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" />Low</span>
                </div>
              </div>

              <div className="space-y-3">
                {yearlyStats.map((st) => {
                  const safeTotal = st.total || 1;
                  const pHigh = Math.round((st.high / safeTotal) * 100);
                  const pModHigh = Math.round((st.modToHigh / safeTotal) * 100);
                  const pMod = Math.round((st.moderate / safeTotal) * 100);
                  const pLow = Math.max(0, 100 - pHigh - pModHigh - pMod);

                  return (
                    <div key={st.tahun} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                          Tahun {st.tahun} ({st.total} Risiko)
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          H:{st.high} • MH:{st.modToHigh} • M:{st.moderate} • L:{st.lowToMod + st.low}
                        </span>
                      </div>
                      {st.total > 0 ? (
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                          {st.high > 0 && (
                            <div style={{ width: `${pHigh}%` }} className="bg-red-500 h-full" title={`High: ${st.high}`} />
                          )}
                          {st.modToHigh > 0 && (
                            <div style={{ width: `${pModHigh}%` }} className="bg-orange-500 h-full" title={`Mod to High: ${st.modToHigh}`} />
                          )}
                          {st.moderate > 0 && (
                            <div style={{ width: `${pMod}%` }} className="bg-amber-400 h-full" title={`Moderate: ${st.moderate}`} />
                          )}
                          {(st.lowToMod + st.low) > 0 && (
                            <div style={{ width: `${pLow}%` }} className="bg-[#009fe3] h-full" title={`Low / Low to Mod: ${st.lowToMod + st.low}`} />
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[9px] text-slate-400 font-mono">
                          Belum ada data risiko terdaftar pada tahun {st.tahun}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kartu 2: Efektivitas Pengendalian & Serapan Biaya Per Tahun */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                  <span>Tren Efektivitas Pengendalian &amp; Realisasi Anggaran (2024+)</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-500">Inherent vs Residual</span>
              </div>

              <div className="space-y-3">
                {yearlyStats.map((st) => {
                  const reductionPct = st.avgInherentScore > 0
                    ? Math.round(((st.avgInherentScore - st.avgResidualScore) / st.avgInherentScore) * 100)
                    : 0;
                  const budgetPct = st.totalAnggaran > 0
                    ? Math.round((st.totalRealisasi / st.totalAnggaran) * 100)
                    : 0;

                  return (
                    <div
                      key={st.tahun}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white">
                            RKAP {st.tahun}
                          </span>
                          <span className="px-2 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                            Penurunan Skor: {reductionPct > 0 ? `-${reductionPct}%` : '0%'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Realisasi: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatRupiah(st.totalRealisasi)}</strong> dari {formatRupiah(st.totalAnggaran)} ({budgetPct}%)
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {st.selesai}/{st.total} Selesai
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Progres Fisik: {st.avgProgress}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: REKAPITULASI PER DEPARTEMEN / UNIT KERJA
         ===================================================================== */}
      {activeSubTab === 'rekap-departemen' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#009fe3]" />
                <span>Rekapitulasi Risiko Per Departemen / Unit Kerja ({selectedYearLabel})</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Distribusi jumlah risiko, tingkat keparahan, penyelesaian pengendalian, dan serapan anggaran per unit kerja.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold">
                  <th className="py-3 px-3.5">Kode &amp; Nama Departemen</th>
                  <th className="py-3 px-3">Direktorat</th>
                  <th className="py-3 px-3 text-center">Total Risiko</th>
                  <th className="py-3 px-3 text-center">High &amp; Mod-High</th>
                  <th className="py-3 px-3 text-center">Selesai Tuntas</th>
                  <th className="py-3 px-3 text-center">Aktif / Carry Over</th>
                  <th className="py-3 px-3 text-center">Rata Progres</th>
                  <th className="py-3 px-3 text-right">Pagu Anggaran</th>
                  <th className="py-3 px-3 text-right">Realisasi Biaya</th>
                  <th className="py-3 px-3.5 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {departmentRecap.map((dept) => {
                  const avgProg = dept.total > 0 ? Math.round(dept.sumProgress / dept.total) : 0;
                  return (
                    <tr key={dept.kode} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{dept.nama}</div>
                        <div className="font-mono text-[10px] text-[#009fe3] dark:text-sky-400">{dept.kode}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                        {dept.direktorat}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-sm">
                        {dept.total}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded font-bold ${dept.highModHigh > 0 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'text-slate-400'}`}>
                          {dept.highModHigh}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                          {dept.selesai}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px]">
                        <span className="text-[#009fe3] font-bold">{dept.aktif} Aktif</span> / <span className="text-amber-600 font-bold">{dept.carryOver} CO</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {avgProg}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {formatRupiah(dept.anggaran)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(dept.realisasi)}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDept(dept.kode);
                            setActiveSubTab('register-tahunan');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#009fe3] hover:text-white text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-all cursor-pointer"
                        >
                          Lihat Risiko
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: DAFTAR REGISTER RISIKO & RIWAYAT TW PER TAHUN (2024+)
         ===================================================================== */}
      {activeSubTab === 'register-tahunan' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#009fe3]" />
                <span>Daftar Register Risiko &amp; Evaluasi Pengendalian ({selectedYearLabel})</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Menampilkan {filteredRisks.length} data risiko terverifikasi beserta capaian triwulan (TW 1-4) dan status akhir.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold">
                  <th className="py-3 px-3">Tahun</th>
                  <th className="py-3 px-3">Kode &amp; Unit Kerja</th>
                  <th className="py-3 px-3">Pernyataan Risiko &amp; Sasaran RKAP</th>
                  <th className="py-3 px-3 text-center">Kategori</th>
                  <th className="py-3 px-3 text-center">Inherent</th>
                  <th className="py-3 px-3 text-center">Residual</th>
                  <th className="py-3 px-3 text-right">Pagu vs Realisasi</th>
                  <th className="py-3 px-3 text-center">Progres &amp; TW</th>
                  <th className="py-3 px-3 text-center">Status Akhir</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRisks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-500 dark:text-slate-400">
                      Tidak ada data risiko yang sesuai dengan filter pada {selectedYearLabel}.
                    </td>
                  </tr>
                ) : (
                  filteredRisks.map((r) => {
                    const m = getRiskMetrics(r);
                    const inhBadge = getRiskBadgeClasses(m.inherentLevel);
                    const resBadge = getRiskBadgeClasses(m.residualLevel);

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-[#009fe3] dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                            {r.tahun || 2026}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-[#009fe3] dark:text-sky-400">
                            {r.kodeRisiko}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 max-w-[180px] truncate" title={r.namaOrganisasi}>
                            {r.namaOrganisasi}
                          </div>
                        </td>
                        <td className="py-3 px-3 max-w-md">
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-2">
                            {r.pernyataanRisiko}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            <strong>Sasaran:</strong> {r.sasaranRKAP}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                            {r.kategoriRisiko}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${inhBadge.badge}`}>
                            {m.inherentLevel} ({m.inherentScore})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${resBadge.badge}`}>
                            {m.residualLevel} ({m.residualScore})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                          <div className="font-bold text-emerald-700 dark:text-emerald-400">
                            {formatRupiah(m.realisasiBiaya)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Pagu: {formatRupiah(r.biayaRencanaPengendalian)}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {m.progressPersen}%
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {r.pengendalianTriwulan?.length || 0} Laporan TW
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {r.statusWorkflow === 'Selesai' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                              ✓ Selesai Tuntas
                            </span>
                          ) : r.statusWorkflow === 'Carry_Over' ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                              ↪ Carry Over ({r.carryOverInfo?.targetTahun || (r.tahun || 2026) + 1})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-[#009fe3] dark:text-sky-300 font-bold text-[10px]">
                              ● Dalam Pengendalian
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectRisk(r)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#009fe3] hover:text-white text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                              title="Lihat Detail Risiko & Riwayat Triwulan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadQuarterlyControlPdf(r)}
                              className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-[#009fe3] text-[#009fe3] hover:text-white transition-all cursor-pointer"
                              title="Unduh Berita Acara PDF Risiko Ini"
                            >
                              <FileText className="w-3.5 h-3.5" />
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
      )}
    </div>
  );
};
