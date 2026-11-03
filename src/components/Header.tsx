import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sun,
  Moon,
  Download,
  Settings,
  LogOut,
  Calendar,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  PlusCircle
} from 'lucide-react';
import { UserRole, ThemeMode, UserAccount, PusriRisk, formatUserRole } from '../types/pusri';
import { PusriLogo } from './PusriLogo';
import { getMasterRiskLevel } from '../utils/riskMatrix';
import { downloadAnnualRecapPdf, downloadAnnualRecapCsv, YearlyRecapStat } from '../utils/downloadRiskReport';

interface HeaderProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  onLogout: (roleToSelect?: UserRole) => void;
  onRoleChange: (role: UserRole) => void;
  viewMode?: 'laptop' | 'mobile';
  onViewModeChange?: (mode: 'laptop' | 'mobile') => void;
  onOpenSop: () => void;
  onOpenSyncConsole: () => void;
  syncPulse: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onDownloadSql: () => void;
  onNavigateSettings: () => void;
  onNavigateProfile?: () => void;
  risks?: PusriRisk[];
  selectedRecapYear?: number | 'ALL';
  onSelectRecapYear?: (year: number | 'ALL') => void;
  activeTab?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
  onDownloadSql,
  onNavigateSettings,
  onNavigateProfile,
  risks = [],
  selectedRecapYear = 'ALL',
  onSelectRecapYear,
  activeTab
}) => {
  const [timeStr, setTimeStr] = useState('26 Oktober 2026 21:36:42');
  const [isRecapDropdownOpen, setIsRecapDropdownOpen] = useState(false);
  const [customMaxYear, setCustomMaxYear] = useState<number>(2028);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const day = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${day} ${month} ${year} ${hours}:${mins}:${secs}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsRecapDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hitung daftar tahun mulai dari 2024 dan seterusnya beserta statistik per tahun
  const risksFrom2024 = useMemo(
    () => risks.filter((r) => (Number(r.tahun) || 2026) >= 2024),
    [risks]
  );

  const availableYears = useMemo(() => {
    const yearSet = new Set<number>([2024, 2025, 2026, 2027, 2028]);
    for (let y = 2024; y <= customMaxYear; y++) {
      yearSet.add(y);
    }
    risksFrom2024.forEach((r) => {
      const y = Number(r.tahun) || 2026;
      if (y >= 2024) yearSet.add(y);
    });
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [risksFrom2024, customMaxYear]);

  const yearlyStats: YearlyRecapStat[] = useMemo(() => {
    return availableYears.map((yr) => {
      const yrRisks = risksFrom2024.filter((r) => (Number(r.tahun) || 2026) === yr);
      const total = yrRisks.length;
      const high = yrRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'High').length;
      const modToHigh = yrRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Mod to High').length;
      const moderate = yrRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Moderate').length;
      const lowToMod = yrRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Low to Mod').length;
      const low = yrRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Low').length;
      const selesai = yrRisks.filter((r) => r.statusWorkflow === 'Selesai').length;
      const carryOver = yrRisks.filter((r) => r.statusWorkflow === 'Carry_Over').length;
      const dalamPengendalian = yrRisks.filter((r) => r.statusWorkflow === 'Disetujui_Dalam_Pengendalian').length;
      const menungguApproval = yrRisks.filter(
        (r) =>
          r.statusWorkflow === 'Menunggu_Approval_VP' ||
          r.statusWorkflow === 'Menunggu_Approval_Admin' ||
          r.statusWorkflow === 'Draft_Unit' ||
          r.statusWorkflow === 'Revisi'
      ).length;

      let totalAnggaran = 0;
      let totalRealisasi = 0;
      let sumProgress = 0;
      let sumInherent = 0;
      let sumResidual = 0;

      yrRisks.forEach((r) => {
        const inh = r.inherentScore || (Number(r.kemungkinanAwal || 1) * Number(r.dampakAwal || 1));
        const lastTw = r.pengendalianTriwulan && r.pengendalianTriwulan.length > 0
          ? r.pengendalianTriwulan[r.pengendalianTriwulan.length - 1]
          : null;
        const resK = lastTw ? Number(lastTw.kemungkinanResidual || r.kemungkinanAwal) : Number(r.kemungkinanAwal || 1);
        const resD = lastTw ? Number(lastTw.dampakResidual || r.dampakAwal) : Number(r.dampakAwal || 1);
        const resScore = resK * resD;
        const realisasi = lastTw
          ? Number(lastTw.realisasiBiaya || 0)
          : Number(r.pelaksanaanTindakan?.[0]?.realisasiBiaya || 0);
        const prog = r.statusWorkflow === 'Selesai'
          ? 100
          : lastTw
            ? Number(lastTw.progressPersen ?? lastTw.progressFisikPic ?? 0)
            : Number(r.progressPelaksanaanTerakhir ?? 0);

        totalAnggaran += Number(r.biayaRencanaPengendalian || 0);
        totalRealisasi += realisasi;
        sumProgress += prog;
        sumInherent += inh;
        sumResidual += resScore;
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
  }, [availableYears, risksFrom2024]);

  const getInitials = () => {
    if (currentUser?.nama) {
      const parts = currentUser.nama.split(' ').filter(Boolean);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return currentUser.nama.slice(0, 2).toUpperCase();
    }
    if (currentRole === 'risk admin') return 'DA';
    if (currentRole === 'risk owner') return 'MD';
    return 'FA';
  };

  const getProfileTitle = () => {
    if (currentUser?.nama) return `${currentUser.nama} (${currentUser.badge ? `Badge ${currentUser.badge} - ` : ''}${formatUserRole(currentUser.role)})`;
    if (currentRole === 'risk admin') return 'DAFFA ARI PRASETYA (Badge 0952 - Risk Admin)';
    if (currentRole === 'risk owner') return 'M DAVI RAMADHAN (Badge 0951 - Risk Owner)';
    return 'FAUZAN AL GHANIYYU (Badge 0953 - Risk Officer)';
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-3 transition-colors">
      {/* Left zone: Brand Lockup */}
      <div className="flex items-center gap-3 md:gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <PusriLogo className="h-9 w-9 p-0.5 rounded-lg" withBg={true} />
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base font-sans">
                PORTAL RISIKO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
              PT Pupuk Sriwidjaja Palembang
            </p>
          </div>
        </div>
      </div>

      {/* Right zone: Minimalist Header Controls */}
      <div className="flex items-center gap-2">
        {/* Compact Rekap Data Tahunan Trigger */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsRecapDropdownOpen((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap border transition-all cursor-pointer ${
              activeTab === 'rekap-tahunan' || isRecapDropdownOpen
                ? 'bg-sky-50 dark:bg-sky-950/70 text-[#009fe3] dark:text-sky-300 border-[#009fe3]/50 ring-2 ring-[#009fe3]/15'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title="Rekap Data Portal Risiko Per Tahun (2024+)"
          >
            <Calendar className="w-3.5 h-3.5 text-[#009fe3] dark:text-sky-400 shrink-0" />
            <span className="hidden sm:inline">
              Rekap Tahunan{selectedRecapYear !== 'ALL' ? ` (${selectedRecapYear})` : ''}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                isRecapDropdownOpen ? 'rotate-180 text-[#009fe3]' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Rekap Data Tahunan (Mulai Tahun 2024 dan Seterusnya) */}
          {isRecapDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in duration-150">
              <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold tracking-tight flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>Rekap Data Portal Risiko Per Tahun</span>
                  </div>
                  <p className="text-[10px] text-sky-200/90 mt-0.5">
                    Data Historis &amp; RKAP Multi-Tahun (2024 s/d Seterusnya)
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-mono font-bold">
                  2024+
                </span>
              </div>

              <div className="p-2.5 max-h-80 overflow-y-auto space-y-1.5 text-xs">
                {/* Pilihan Semua Tahun (2024+) */}
                <div
                  onClick={() => {
                    onSelectRecapYear?.('ALL');
                    setIsRecapDropdownOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    activeTab === 'rekap-tahunan' && selectedRecapYear === 'ALL'
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-[#009fe3] text-slate-900 dark:text-white font-bold'
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:bg-sky-50/40 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Semua Tahun (2024 - {availableYears[availableYears.length - 1]})</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Gabungan seluruh rekapitulasi risiko multi-tahun
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[#009fe3] text-white font-mono text-[11px] font-bold">
                    {risksFrom2024.length} Risiko
                  </span>
                </div>

                {/* Daftar Per Tahun dari 2024 dan Seterusnya */}
                {yearlyStats.map((st) => {
                  const isSelected = activeTab === 'rekap-tahunan' && selectedRecapYear === st.tahun;
                  return (
                    <div
                      key={st.tahun}
                      onClick={() => {
                        onSelectRecapYear?.(st.tahun);
                        setIsRecapDropdownOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/60 border-[#009fe3] ring-1 ring-[#009fe3]/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                            Tahun {st.tahun}
                          </span>
                          {st.tahun === 2026 && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-bold">
                              Aktif
                            </span>
                          )}
                          {st.tahun < 2026 && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold">
                              Historis
                            </span>
                          )}
                          {st.tahun > 2026 && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[9px] font-bold">
                              Proyeksi RKAP
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            ✓ {st.selesai} Selesai
                          </span>
                          <span>•</span>
                          <span className="text-[#009fe3] dark:text-sky-400 font-semibold">
                            {st.dalamPengendalian + st.carryOver} Aktif/CO
                          </span>
                          <span>•</span>
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            H/MH: {st.high + st.modToHigh}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold">
                          {st.total} Data
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const yrRisks = risksFrom2024.filter((r) => (Number(r.tahun) || 2026) === st.tahun);
                            downloadAnnualRecapPdf([st], yrRisks, `Tahun RKAP ${st.tahun}`);
                          }}
                          className="p-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-[#009fe3] text-[#009fe3] hover:text-white transition-colors cursor-pointer"
                          title={`Unduh PDF Rekap Tahun ${st.tahun}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Tombol Tambah Tahun Proyeksi Berikutnya (2029, 2030, dst.) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCustomMaxYear((prev) => prev + 1);
                  }}
                  className="w-full py-1.5 px-3 rounded-xl border border-dashed border-sky-400/60 text-[#009fe3] dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Tambah Tahun Berikutnya ({customMaxYear + 1})</span>
                </button>
              </div>

              {/* Footer Dropdown: Tombol Buka Halaman Penuh & Ekspor */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectRecapYear?.(selectedRecapYear);
                    setIsRecapDropdownOpen(false);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-[#009fe3] hover:bg-[#0284c7] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                >
                  <span>Buka Halaman Rekap Tahunan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadAnnualRecapCsv(yearlyStats, risksFrom2024, 'Semua_Tahun_2024_Seterusnya');
                    setIsRecapDropdownOpen(false);
                  }}
                  className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="Unduh Excel / CSV Seluruh Rekap Tahunan (2024+)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Clock (Compact) */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
          <span>🕒</span>
          <span>{timeStr}</span>
        </div>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Ganti ke Tema Terang (Light Mode)' : 'Ganti ke Tema Gelap (Dark Mode)'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onNavigateSettings}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Pengaturan Aplikasi & Unduh Database SQL"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User avatar circle & info */}
        <div
          onClick={() => {
            if (onNavigateProfile) onNavigateProfile();
            else onNavigateSettings();
          }}
          className="cursor-pointer flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs"
          title={`Profil: ${getProfileTitle()} - Klik untuk lihat Ringkasan Pengguna`}
        >
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.nama || 'Foto profil'}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-sky-300 dark:ring-sky-700 shadow-xs"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#009fe3] text-white flex items-center justify-center font-bold text-xs ring-1 ring-sky-300 dark:ring-sky-700 shadow-xs">
              {getInitials()}
            </div>
          )}
          <div className="hidden md:block text-left text-[11px] leading-tight max-w-[125px] truncate">
            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
              {currentUser?.nama || (currentRole === 'risk admin' ? 'DAFFA ARI P.' : currentRole === 'risk owner' ? 'M DAVI R.' : 'FAUZAN AL G.')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {currentUser?.badge ? `[${currentUser.badge}] ` : ''}{formatUserRole(currentRole)}
            </span>
          </div>
        </div>

        {/* Tombol Keluar (Logout) */}
        <button
          type="button"
          onClick={() => onLogout()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 text-xs font-bold transition-all cursor-pointer"
          title="Keluar dari Portal (Kembali ke Halaman Login)"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
