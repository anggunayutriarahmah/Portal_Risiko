import React from 'react';
import { Filter } from 'lucide-react';

interface KpiCardsProps {
  stats: {
    totalRisks: number;
    highRisk: number;
    modToHigh: number;
    moderate: number;
    lowToMod: number;
    lowRisk: number;
    approvalCount: number;
    carryOverCount: number;
  };
  activeFilter: string | null;
  onSelectFilter: (filterKey: string | null) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  stats,
  activeFilter,
  onSelectFilter
}) => {
  const cards = [
    {
      key: 'ALL',
      title: 'TOTAL RISIKO',
      value: stats.totalRisks,
      subtitle: 'Seluruh Unit Kerja',
      textColor: 'text-slate-900 dark:text-slate-100',
      bgColor: 'bg-white dark:bg-slate-900',
      borderColor: 'border-slate-200 dark:border-slate-800',
      ringColor: 'ring-slate-400 dark:ring-slate-500'
    },
    {
      key: 'High',
      title: 'HIGH RISK',
      value: stats.highRisk,
      subtitle: 'Skor 17 - 25',
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50/40 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-900/60',
      ringColor: 'ring-red-500'
    },
    {
      key: 'Mod to High',
      title: 'MOD TO HIGH',
      value: stats.modToHigh,
      subtitle: 'Skor 12 - 16',
      textColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50/40 dark:bg-orange-950/30',
      borderColor: 'border-orange-200 dark:border-orange-900/60',
      ringColor: 'ring-orange-500'
    },
    {
      key: 'Moderate',
      title: 'MODERATE',
      value: stats.moderate,
      subtitle: 'Skor 8 - 11',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50/40 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-900/60',
      ringColor: 'ring-amber-500'
    },
    {
      key: 'Low to Mod',
      title: 'LOW TO MOD',
      value: stats.lowToMod,
      subtitle: 'Skor 4 - 7',
      textColor: 'text-[#38bdf8] dark:text-sky-400',
      bgColor: 'bg-sky-50/40 dark:bg-sky-950/30',
      borderColor: 'border-sky-200 dark:border-sky-900/60',
      ringColor: 'ring-sky-400'
    },
    {
      key: 'Low',
      title: 'LOW RISK',
      value: stats.lowRisk,
      subtitle: 'Skor 1 - 3',
      textColor: 'text-[#0284c7] dark:text-sky-300',
      bgColor: 'bg-sky-50/40 dark:bg-sky-950/30',
      borderColor: 'border-sky-200 dark:border-sky-900/60',
      ringColor: 'ring-[#0284c7]'
    },
    {
      key: 'APPROVAL',
      title: 'APPROVAL',
      value: stats.approvalCount,
      subtitle: 'VP / Admin Review',
      textColor: 'text-[#009fe3] dark:text-sky-400',
      bgColor: 'bg-sky-50/40 dark:bg-sky-950/30',
      borderColor: 'border-sky-200 dark:border-sky-900/60',
      ringColor: 'ring-sky-500'
    },
    {
      key: 'CARRY_OVER',
      title: 'CARRY OVER',
      value: stats.carryOverCount,
      subtitle: 'Tahun 2027',
      textColor: 'text-amber-900 dark:text-yellow-200',
      bgColor: 'bg-yellow-50/60 dark:bg-yellow-950/30',
      borderColor: 'border-yellow-200 dark:border-yellow-900/60',
      ringColor: 'ring-yellow-500'
    }
  ];

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {cards.map((card) => {
          const isSelected = activeFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onSelectFilter(isSelected ? null : card.key)}
              title={`Klik untuk menampilkan data ${card.title} (${card.subtitle})`}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                card.bgColor
              } ${card.borderColor} ${
                isSelected 
                  ? `ring-2 ${card.ringColor} shadow-md scale-[1.02] bg-white dark:bg-slate-800` 
                  : 'hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]'
              }`}
            >
              {/* Title */}
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider truncate mb-1 uppercase flex items-center justify-between">
                <span>{card.title}</span>
                {isSelected && <Filter className="w-2.5 h-2.5 text-[#009fe3] dark:text-sky-400" />}
              </div>

              {/* Value */}
              <div className={`text-2xl font-extrabold ${card.textColor} font-mono tabular-nums leading-none tracking-tight`}>
                {card.value}
              </div>

              {/* Subtitle */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-1.5 leading-tight">
                {card.subtitle}
              </div>

              {/* Active Indicator bar */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#009fe3]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
