import React from 'react';
import { BarChart3, FilterX } from 'lucide-react';
import { getMasterRiskLevel } from '../utils/riskMatrix';

interface RiskMatrix5x5Props {
  matrixCounts: Record<string, number>;
  selectedCell: string | null;
  onSelectCell: (cellKey: string | null) => void;
}

interface CellConfig {
  score: number;
  level: 'High' | 'Mod to High' | 'Moderate' | 'Low to Mod' | 'Low';
  bgClass: string;
  textClass: string;
}

export const RiskMatrix5x5: React.FC<RiskMatrix5x5Props> = ({
  matrixCounts,
  selectedCell,
  onSelectCell
}) => {
  // Determine standard Pusri 5x5 color & level according to corporate risk indicator:
  // High (17-25), Mod to High (12-16), Moderate (8-11), Low to Mod (4-7), Low (1-3)
  const getCellConfig = (k: number, d: number): CellConfig => {
    const score = k * d;
    const level = getMasterRiskLevel(k, d);

    if (level === 'High') {
      return { score, level, bgClass: 'bg-[#dc2626]', textClass: 'text-white' };
    }
    if (level === 'Mod to High') {
      return { score, level, bgClass: 'bg-[#ea580c]', textClass: 'text-white' };
    }
    if (level === 'Moderate') {
      return { score, level, bgClass: 'bg-[#f59e0b]', textClass: 'text-white' };
    }
    if (level === 'Low to Mod') {
      return { score, level, bgClass: 'bg-[#38bdf8]', textClass: 'text-white' };
    }
    // Low
    return { score, level, bgClass: 'bg-[#0284c7]', textClass: 'text-white' };
  };

  const rows = [5, 4, 3, 2, 1];
  const cols = [1, 2, 3, 4, 5];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 shadow-2xs transition-colors">
      {/* Title & Description */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#009fe3] dark:text-sky-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Peta Matriks Risiko Korporat (5x5)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Klik sel matriks untuk memfilter daftar risiko di bawah
          </p>
        </div>

        {selectedCell && (
          <button
            onClick={() => onSelectCell(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
          >
            <FilterX className="w-3 h-3" />
            <span>Reset Filter ({selectedCell})</span>
          </button>
        )}
      </div>

      {/* 5x5 Matrix Layout */}
      <div className="relative mt-2">
        {/* Y Axis Label */}
        <div className="flex">
          <div className="w-8 shrink-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase -rotate-90 select-none whitespace-nowrap">
              KEMUNGKINAN (LIKELIHOOD)
            </span>
          </div>

          <div className="flex-1 space-y-1.5">
            {rows.map((k) => (
              <div key={k} className="flex items-center gap-1.5">
                {/* Y-axis number */}
                <span className="w-4 text-xs font-bold text-slate-600 dark:text-slate-400 text-right font-mono select-none">
                  {k}
                </span>

                {/* 5 columns */}
                <div className="grid grid-cols-5 gap-1.5 flex-1">
                  {cols.map((d) => {
                    const cellKey = `L${k}xD${d}`;
                    const count = matrixCounts[cellKey] || 0;
                    const config = getCellConfig(k, d);
                    const isSelected = selectedCell === cellKey;

                    return (
                      <button
                        key={cellKey}
                        onClick={() => onSelectCell(isSelected ? null : cellKey)}
                        className={`h-11 sm:h-12 rounded-lg flex flex-col items-center justify-center text-white transition-all transform active:scale-95 cursor-pointer relative shadow-2xs ${
                          config.bgClass
                        } ${
                          isSelected
                            ? 'ring-3 ring-slate-950 dark:ring-white scale-102 z-10 shadow-md'
                            : 'hover:opacity-90 hover:brightness-105'
                        }`}
                        title={`${cellKey}: Skor ${config.score} (${config.level}) - ${count} Risiko`}
                      >
                        {/* Number count */}
                        <span className="text-sm sm:text-base font-extrabold font-mono leading-none">
                          {count > 0 ? count : '-'}
                        </span>

                        {/* Cell coordinate */}
                        <span className="text-[9px] opacity-80 font-medium tracking-tight mt-0.5">
                          L{k}×D{d}
                        </span>

                        {/* Visual indicator of active filter */}
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* X-axis numbers (1 to 5) */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-4"></span>
              <div className="grid grid-cols-5 gap-1.5 flex-1 text-center">
                {cols.map((d) => (
                  <span key={d} className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono select-none">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* X-axis label */}
            <div className="text-center pt-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase select-none">
                DAMPAK / KONSEKUENSI (CONSEQUENCE)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend at bottom matching standard Pusri matrix */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#dc2626]"></span>
          <span className="font-medium">High (17-25)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ea580c]"></span>
          <span className="font-medium">Mod to High (12-16)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span>
          <span className="font-medium">Moderate (8-11)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#38bdf8]"></span>
          <span className="font-medium">Low to Mod (4-7)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#0284c7]"></span>
          <span className="font-medium">Low (1-3)</span>
        </div>
      </div>
    </div>
  );
};
