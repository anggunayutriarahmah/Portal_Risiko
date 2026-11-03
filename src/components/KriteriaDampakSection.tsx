import React, { useState } from 'react';
import { KRITERIA_DAMPAK_RISIKO_DATA, ImpactCriterionCategory } from '../data/kriteriaDampakData';
import { Layers, CheckCircle2, RotateCcw } from 'lucide-react';

export interface KriteriaDampakSectionProps {
  selectedCriterionKey?: string | null; // format: `${categoryId}_${level}`, e.g. 'k3_3'
  selectedLevel?: number;
  onSelectCriterion?: (
    key: string,
    level: number,
    description: string,
    categoryTitle: string,
    categoryId: string
  ) => void;
  onSelectLevel?: (level: number, description: string) => void;
  onClearCriterion?: () => void;
  showAllInitially?: boolean;
  namePrefix?: string;
}

export const KriteriaDampakSection: React.FC<KriteriaDampakSectionProps> = ({
  selectedCriterionKey,
  selectedLevel,
  onSelectCriterion,
  onSelectLevel,
  onClearCriterion,
  showAllInitially = false,
  namePrefix = 'kriteria_radio'
}) => {
  // If a key is selected, extract its category to show that category by default
  const initialCategory = selectedCriterionKey
    ? selectedCriterionKey.split('_')[0]
    : KRITERIA_DAMPAK_RISIKO_DATA[0].id;

  const [activeCategoryId, setActiveCategoryId] = useState<string>(initialCategory);
  const [viewMode, setViewMode] = useState<'single' | 'all'>(showAllInitially ? 'all' : 'single');

  // Synchronize activeCategoryId when selectedCriterionKey changes
  React.useEffect(() => {
    if (selectedCriterionKey) {
      const catId = selectedCriterionKey.split('_')[0];
      if (KRITERIA_DAMPAK_RISIKO_DATA.some((c) => c.id === catId)) {
        setActiveCategoryId(catId);
      }
    }
  }, [selectedCriterionKey]);

  const currentCategory =
    KRITERIA_DAMPAK_RISIKO_DATA.find((c) => c.id === activeCategoryId) ||
    KRITERIA_DAMPAK_RISIKO_DATA[0];

  // Find info of currently selected criterion across all categories
  let selectedInfo: { categoryTitle: string; itemLabel: string; description: string; level: number } | null = null;
  if (selectedCriterionKey) {
    for (const cat of KRITERIA_DAMPAK_RISIKO_DATA) {
      for (const item of cat.levels) {
        if (`${cat.id}_${item.level}` === selectedCriterionKey) {
          selectedInfo = {
            categoryTitle: cat.title,
            itemLabel: item.label,
            description: item.description,
            level: item.level
          };
          break;
        }
      }
      if (selectedInfo) break;
    }
  }

  const renderTable = (category: ImpactCriterionCategory) => (
    <div
      key={category.id}
      className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs"
    >
      <div className="bg-slate-100/80 dark:bg-slate-800/80 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#009fe3]" />
          <span>{category.title}</span>
        </h4>
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
          Pilih 1 Level (1 - 5)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-bold">
              <th className="py-2.5 px-3.5 w-36 sm:w-44 text-slate-700 dark:text-slate-200">
                Pilih Level
              </th>
              <th className="py-2.5 px-3.5 text-slate-700 dark:text-slate-200">
                {category.columnHeader}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {category.levels.map((item) => {
                const rowKey = `${category.id}_${item.level}`;
                const isChecked = selectedCriterionKey
                  ? selectedCriterionKey === rowKey
                  : (selectedLevel === item.level && activeCategoryId === category.id);

                const triggerSelect = () => {
                  onSelectCriterion?.(rowKey, item.level, item.description, category.title, category.id);
                  onSelectLevel?.(item.level, item.description);
                };

                return (
                  <tr
                    key={item.level}
                    onClick={triggerSelect}
                    className={`cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-950 dark:text-sky-100 font-semibold'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3.5 align-top">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name={`${namePrefix}_kriteria_dampak_selection`}
                          value={rowKey}
                          checked={isChecked}
                          onChange={triggerSelect}
                          className="w-4 h-4 text-[#009fe3] border-slate-300 focus:ring-[#009fe3] cursor-pointer"
                        />
                        <span className={`text-xs ${isChecked ? 'text-[#009fe3] dark:text-sky-400 font-bold' : 'font-medium'}`}>
                          {item.label}
                        </span>
                      </label>
                    </td>
                    <td className="py-2.5 px-3.5 align-top leading-relaxed text-xs">
                      {item.description}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Category selector & View switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#009fe3] dark:text-sky-400 shrink-0" />
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
            Kriteria Dampak Risiko
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            (Pilih tepat 1 level kriteria yang paling relevan)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'single' && (
            <select
              value={activeCategoryId}
              onChange={(e) => setActiveCategoryId(e.target.value)}
              className="h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none transition-all cursor-pointer"
            >
              {KRITERIA_DAMPAK_RISIKO_DATA.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'single' ? 'all' : 'single')}
            className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {viewMode === 'single' ? 'Tampilkan Semua Kriteria' : 'Tampilkan Per Kategori'}
          </button>
        </div>
      </div>

      {/* Selected indicator summary banner */}
      {selectedInfo && (
        <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-[#009fe3] shrink-0" />
            <div className="text-[11px] text-sky-900 dark:text-sky-200 truncate">
              <span className="font-bold text-[#009fe3] dark:text-sky-300">{selectedInfo.categoryTitle}:</span>{' '}
              <strong className="underline">{selectedInfo.itemLabel}</strong>
              <span className="text-slate-500 dark:text-slate-400 ml-1.5 hidden sm:inline truncate">
                — {selectedInfo.description}
              </span>
            </div>
          </div>
          {onClearCriterion && (
            <button
              type="button"
              onClick={onClearCriterion}
              className="text-[11px] font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer shrink-0 flex items-center gap-1"
              title="Reset pilihan kriteria dampak"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}

      {/* Tables Display */}
      {viewMode === 'single' ? (
        renderTable(currentCategory)
      ) : (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {KRITERIA_DAMPAK_RISIKO_DATA.map((cat) => renderTable(cat))}
        </div>
      )}
    </div>
  );
};
