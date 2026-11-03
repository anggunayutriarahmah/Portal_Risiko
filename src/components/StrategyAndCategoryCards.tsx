import React from 'react';
import { Layers, PieChart, CheckCircle2, ShieldAlert } from 'lucide-react';

interface StrategyAndCategoryCardsProps {
  strategies: {
    Mitigasi: number;
    Diterima: number;
    Dihindari: number;
    Transfer: number;
    persentaseMitigasi: number;
    persentaseDiterima: number;
    persentaseDihindari: number;
    persentaseTransfer: number;
  };
  categories: {
    Operasional: number;
    Keuangan: number;
    Strategis: number;
    'Hukum & Kepatuhan': number;
  };
  activeCategory?: string | null;
  activeStrategy?: string | null;
  onFilterCategory?: (category: string | null) => void;
  onFilterStrategy?: (strategy: string | null) => void;
}

export const StrategyAndCategoryCards: React.FC<StrategyAndCategoryCardsProps> = ({
  strategies,
  categories,
  activeCategory,
  activeStrategy,
  onFilterCategory,
  onFilterStrategy
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Strategi Penanganan Risiko Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#009fe3]" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight uppercase">
              Strategi Penanganan Risiko (Pusri ERM)
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            Klik baris untuk memfilter tabel
          </span>
        </div>

        <div className="space-y-3">
          {/* Mitigasi */}
          <div 
            onClick={() => onFilterStrategy?.(activeStrategy === 'Mitigasi' ? null : 'Mitigasi')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              activeStrategy === 'Mitigasi'
                ? 'bg-sky-50 dark:bg-sky-950/50 border-[#009fe3] ring-2 ring-[#009fe3]/30 shadow-xs'
                : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={`font-semibold ${activeStrategy === 'Mitigasi' ? 'text-[#009fe3] font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                Mitigasi (Mitigate)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {strategies.Mitigasi} ({strategies.persentaseMitigasi}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#009fe3] rounded-full transition-all duration-500"
                style={{ width: `${strategies.persentaseMitigasi}%` }}
              />
            </div>
          </div>

          {/* Diterima */}
          <div 
            onClick={() => onFilterStrategy?.(activeStrategy === 'Diterima' ? null : 'Diterima')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              activeStrategy === 'Diterima'
                ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-400 ring-2 ring-sky-400/30 shadow-xs'
                : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={`font-semibold ${activeStrategy === 'Diterima' ? 'text-sky-600 dark:text-sky-300 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                Diterima (Accept)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {strategies.Diterima} ({strategies.persentaseDiterima}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${strategies.persentaseDiterima}%` }}
              />
            </div>
          </div>

          {/* Dihindari */}
          <div 
            onClick={() => onFilterStrategy?.(activeStrategy === 'Dihindari' ? null : 'Dihindari')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              activeStrategy === 'Dihindari'
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/30 shadow-xs'
                : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={`font-semibold ${activeStrategy === 'Dihindari' ? 'text-amber-600 dark:text-amber-300 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                Dihindari (Avoid)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {strategies.Dihindari} ({strategies.persentaseDihindari}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${strategies.persentaseDihindari}%` }}
              />
            </div>
          </div>

          {/* Transfer */}
          <div 
            onClick={() => onFilterStrategy?.(activeStrategy === 'Transfer' ? null : 'Transfer')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              activeStrategy === 'Transfer'
                ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-400 ring-2 ring-purple-400/30 shadow-xs'
                : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={`font-semibold ${activeStrategy === 'Transfer' ? 'text-purple-600 dark:text-purple-300 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                Transfer (Transfer)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {strategies.Transfer} ({strategies.persentaseTransfer}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${strategies.persentaseTransfer}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Distribusi Kategori Risiko Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#009fe3]" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight uppercase">
              Distribusi Kategori Taksonomi Risiko
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            Klik kotak untuk memfilter tabel
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Operasional */}
          <div 
            onClick={() => onFilterCategory?.(activeCategory === 'Operasional' ? null : 'Operasional')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeCategory === 'Operasional'
                ? 'bg-sky-50 dark:bg-sky-950/60 border-[#009fe3] ring-2 ring-[#009fe3]/30 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Operasional
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono my-0.5">
              {categories.Operasional}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Pabrik & Distribusi
            </div>
          </div>

          {/* Keuangan */}
          <div 
            onClick={() => onFilterCategory?.(activeCategory === 'Keuangan' ? null : 'Keuangan')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeCategory === 'Keuangan'
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Keuangan
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono my-0.5">
              {categories.Keuangan}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Arus Kas & Valas
            </div>
          </div>

          {/* Strategis */}
          <div 
            onClick={() => onFilterCategory?.(activeCategory === 'Strategis' ? null : 'Strategis')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeCategory === 'Strategis'
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Strategis
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono my-0.5">
              {categories.Strategis}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Pasar & Kebijakan
            </div>
          </div>

          {/* Hukum & Kepatuhan */}
          <div 
            onClick={() => onFilterCategory?.(activeCategory === 'Hukum & Kepatuhan' ? null : 'Hukum & Kepatuhan')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              activeCategory === 'Hukum & Kepatuhan'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Hukum & Kepatuhan
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono my-0.5">
              {categories['Hukum & Kepatuhan']}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Regulasi & Audit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
