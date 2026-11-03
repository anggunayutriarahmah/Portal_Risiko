import React, { useMemo } from 'react';
import { Calendar, ArrowRight, CheckCircle2, ShieldAlert, TrendingDown, FileSpreadsheet } from 'lucide-react';
import { PusriRisk } from '../types/pusri';
import { getMasterRiskLevel } from '../utils/riskMatrix';

interface AnnualRecapSummaryCardProps {
  risks: PusriRisk[];
  selectedDashboardYear: number | 'ALL';
  onSelectDashboardYear: (year: number | 'ALL') => void;
  onOpenFullAnnualRecap: (year?: number | 'ALL') => void;
}

function formatShortRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${Math.round(amount / 1_000_000)} Jt`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export const AnnualRecapSummaryCard: React.FC<AnnualRecapSummaryCardProps> = ({
  risks,
  selectedDashboardYear,
  onSelectDashboardYear,
  onOpenFullAnnualRecap
}) => {
  const yearCards = useMemo(() => {
    const yearSet = new Set<number>([2024, 2025, 2026, 2027]);
    risks.forEach((r) => {
      const y = Number(r.tahun) || 2026;
      if (y >= 2024) yearSet.add(y);
    });
    const sortedYears = Array.from(yearSet).sort((a, b) => a - b);

    return sortedYears.map((yr) => {
      const yrRisks = risks.filter((r) => (Number(r.tahun) || 2026) === yr);
      const total = yrRisks.length;
      const selesai = yrRisks.filter((r) => r.statusWorkflow === 'Selesai').length;
      const aktif = yrRisks.filter((r) => r.statusWorkflow !== 'Selesai').length;
      const highModHigh = yrRisks.filter((r) => {
        const lvl = getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal);
        return lvl === 'High' || lvl === 'Mod to High';
      }).length;

      let totalAnggaran = 0;
      let totalRealisasi = 0;
      yrRisks.forEach((r) => {
        totalAnggaran += Number(r.biayaRencanaPengendalian || 0);
        const lastTw = r.pengendalianTriwulan && r.pengendalianTriwulan.length > 0
          ? r.pengendalianTriwulan[r.pengendalianTriwulan.length - 1]
          : null;
        totalRealisasi += lastTw
          ? Number(lastTw.realisasiBiaya || 0)
          : Number(r.pelaksanaanTindakan?.[0]?.realisasiBiaya || 0);
      });

      return {
        tahun: yr,
        total,
        selesai,
        aktif,
        highModHigh,
        totalAnggaran,
        totalRealisasi
      };
    });
  }, [risks]);

  const totalSince2024 = useMemo(
    () => risks.filter((r) => (Number(r.tahun) || 2026) >= 2024).length,
    [risks]
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-[#009fe3] dark:text-sky-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                Rekap Data Portal Risiko Per Tahun (Mulai 2024 &amp; Seterusnya)
              </h3>
              <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-[#009fe3] dark:text-sky-300 text-[10px] font-mono font-bold">
                {totalSince2024} Total Data (2024+)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pilih tahun anggaran di bawah untuk memfilter Dashboard atau buka halaman Rekap Tahunan lengkap.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedDashboardYear !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectDashboardYear('ALL')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer transition-all"
            >
              Tampilkan Semua Tahun
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenFullAnnualRecap(selectedDashboardYear)}
            className="px-3 py-1.5 rounded-xl bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Buka Rekap Tahunan Lengkap (2024+)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Kartu Rekap Per Tahun (2024, 2025, 2026, 2027, dst.) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {yearCards.map((yc) => {
          const isSelected = selectedDashboardYear === yc.tahun;
          return (
            <div
              key={yc.tahun}
              onClick={() => onSelectDashboardYear(isSelected ? 'ALL' : yc.tahun)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-sky-50/70 dark:bg-sky-950/50 border-[#009fe3] ring-2 ring-[#009fe3]/30 shadow-sm'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                    RKAP {yc.tahun}
                  </span>
                  {yc.tahun === 2026 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold uppercase">
                      Aktif
                    </span>
                  )}
                  {yc.tahun < 2026 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                      Arsip
                    </span>
                  )}
                  {yc.tahun > 2026 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold uppercase">
                      Proyeksi
                    </span>
                  )}
                </div>
                <span className="font-mono text-lg font-extrabold text-[#009fe3] dark:text-sky-400">
                  {yc.total} <span className="text-[10px] font-sans font-semibold text-slate-500">Risiko</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px] py-1.5 border-y border-slate-200/70 dark:border-slate-700/70 my-1.5">
                <div>
                  <span className="text-slate-400 block">Selesai</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400 text-xs">{yc.selesai}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Aktif/CO</span>
                  <strong className="font-mono text-sky-600 dark:text-sky-400 text-xs">{yc.aktif}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">High/M-H</span>
                  <strong className="font-mono text-red-600 dark:text-red-400 text-xs">{yc.highModHigh}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                <span>Realisasi Mitigasi:</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">
                  {formatShortRupiah(yc.totalRealisasi)} / {formatShortRupiah(yc.totalAnggaran)}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
