import React from 'react';
import { Calculator, CheckCircle2 } from 'lucide-react';
import { getMasterRiskLevel } from '../utils/riskMatrix';

export interface LikelihoodOption {
  level: number;
  probabilitas: string;
  persentase: string;
  frekuensi: string;
  kecepatan: string;
}

export interface ConsequenceOption {
  level: number;
  label: string;
  kerugianHighlight: string;
  kerugianDesc: string;
}

export const LIKELIHOOD_OPTIONS: LikelihoodOption[] = [
  {
    level: 1,
    probabilitas: '1 - Hampir Tidak Mungkin Terjadi',
    persentase: '> 0% - 15%',
    frekuensi: 'Diperkirakan akan terjadi lebih dari dua tahun ke depan',
    kecepatan: 'Pernah terjadi 1 kali dalam lebih dari 5 tahun terakhir'
  },
  {
    level: 2,
    probabilitas: '2 - Kemungkinan Kecil Terjadi',
    persentase: '> 15% - 35%',
    frekuensi: 'Diperkirakan akan terjadi dalam 2 tahun ke depan',
    kecepatan: 'Pernah terjadi 1 kali dalam 2 sampai 5 tahun terakhir'
  },
  {
    level: 3,
    probabilitas: '3 - Kemungkinan Terjadi dan Tidak Sama Besar',
    persentase: '> 35% - 60%',
    frekuensi: 'Diperkirakan baru akan terjadi tahun depan',
    kecepatan: 'Pernah terjadi 1 kali dalam satu tahun terakhir'
  },
  {
    level: 4,
    probabilitas: '4 - Kemungkinan Besar Terjadi',
    persentase: '> 60% - 85%',
    frekuensi: 'Diperkirakan akan terjadi dalam tahun ini',
    kecepatan: 'Pernah terjadi 2 kali dalam satu tahun terakhir'
  },
  {
    level: 5,
    probabilitas: '5 - Hampir Pasti Terjadi',
    persentase: '> 85%',
    frekuensi: 'Diperkirakan akan segera terjadi (dalam 6 Bulan setelah risiko teridentifikasi)',
    kecepatan: 'Pernah terjadi lebih dari 2 kali dalam satu tahun terakhir'
  }
];

export const CONSEQUENCE_OPTIONS: ConsequenceOption[] = [
  {
    level: 1,
    label: '1 - Insignificant',
    kerugianHighlight: 'Kehilangan ≤1%',
    kerugianDesc: 'dari Total Aset, atau dari Total Pendapatan, atau dari Pendapatan Subsidi, atau dari Pendapatan Usaha, atau dari EBIT, atau dari EBITDA, atau dari Laba Bersih.'
  },
  {
    level: 2,
    label: '2 - Minor',
    kerugianHighlight: 'Kehilangan >1% - ≤2%',
    kerugianDesc: 'dari Total Aset, atau dari Total Pendapatan, atau dari Pendapatan Subsidi, atau dari Pendapatan Usaha, atau dari EBIT, atau dari EBITDA, atau dari Laba Bersih.'
  },
  {
    level: 3,
    label: '3 - Moderate',
    kerugianHighlight: 'Kehilangan >2% - ≤3%',
    kerugianDesc: 'dari Total Aset, atau dari Total Pendapatan, atau dari Pendapatan Subsidi, atau dari Pendapatan Usaha, atau dari EBIT, atau dari EBITDA, atau dari Laba Bersih.'
  },
  {
    level: 4,
    label: '4 - Major',
    kerugianHighlight: 'Kehilangan >3% - ≤4%',
    kerugianDesc: 'dari Total Aset, atau dari Total Pendapatan, atau dari Pendapatan Subsidi, atau dari Pendapatan Usaha, atau dari EBIT, atau dari EBITDA, atau dari Laba Bersih.'
  },
  {
    level: 5,
    label: '5 - Catastrophic',
    kerugianHighlight: 'Kehilangan >4%',
    kerugianDesc: 'dari Total Aset, atau dari Total Pendapatan, atau dari Pendapatan Subsidi, atau dari Pendapatan Usaha, atau dari EBIT, atau dari EBITDA, atau dari Laba Bersih.'
  }
];

export interface RiskLikelihoodConsequenceTableProps {
  likelihood: number;
  consequence: number;
  onChangeLikelihood: (level: number) => void;
  onChangeConsequence?: (level: number) => void;
  disabled?: boolean;
  showScoreSummary?: boolean;
  namePrefix?: string;
  showLikelihood?: boolean;
  showConsequence?: boolean;
  allowUnselectLikelihood?: boolean;
  allowUnselectConsequence?: boolean;
}

export const RiskLikelihoodConsequenceTable: React.FC<RiskLikelihoodConsequenceTableProps> = ({
  likelihood,
  consequence,
  onChangeLikelihood,
  onChangeConsequence,
  disabled = false,
  showScoreSummary = true,
  namePrefix,
  showLikelihood = true,
  showConsequence = true,
  allowUnselectLikelihood = true,
  allowUnselectConsequence = true
}) => {
  const instanceId = React.useId();
  const radioPrefix = namePrefix || instanceId;
  const isComplete = (likelihood || 0) > 0 && (consequence || 0) > 0;
  const score = isComplete ? (likelihood * consequence) : 0;
  const riskLevel = isComplete ? getMasterRiskLevel(likelihood, consequence) : 'Pending';

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Score & Level Summary Bar */}
      {showScoreSummary && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#009fe3]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Penilaian Matriks Risiko Awal (Inherent Risk)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {isComplete ? (
              <>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  Skor: <strong className="text-slate-900 dark:text-slate-100">{likelihood}</strong> × <strong className="text-slate-900 dark:text-slate-100">{consequence}</strong> =
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                    riskLevel === 'High'
                      ? 'bg-red-500 text-white'
                      : riskLevel === 'Mod to High'
                      ? 'bg-yellow-500 text-slate-900'
                      : riskLevel === 'Moderate'
                      ? 'bg-yellow-400 text-slate-900'
                      : 'bg-sky-400 text-white'
                  }`}
                >
                  {score} ({riskLevel})
                </span>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Kemungkinan: <strong className="text-slate-800 dark:text-slate-200">{likelihood > 0 ? `Lvl ${likelihood}` : 'Belum diisi'}</strong> | Dampak: <strong className="text-slate-800 dark:text-slate-200">{consequence > 0 ? `Lvl ${consequence}` : 'Belum diisi'}</strong>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Menunggu Kelengkapan
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. LIKELIHOOD / KEMUNGKINAN SECTION */}
      {showLikelihood && (
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Left Column Label */}
          <div className="md:w-56 shrink-0 pt-2">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              Likelihood /<br />
              Kemungkinan
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Tingkat kemungkinan / frekuensi risiko terjadi
            </p>
            {likelihood > 0 && allowUnselectLikelihood && !disabled && (
              <button
                type="button"
                onClick={() => onChangeLikelihood(0)}
                className="mt-1.5 text-[11px] text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:underline font-medium block"
              >
                ✕ Kosongkan pilihan
              </button>
            )}
          </div>

          {/* Right Column Table */}
          <div className="flex-1 min-w-0 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
            <table className="w-full border-collapse text-left text-xs text-slate-700 dark:text-slate-200">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[200px] border-r border-slate-200 dark:border-slate-700">
                    Pilih Probabilitas Kualitatif
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[90px] border-r border-slate-200 dark:border-slate-700">
                    Persentase
                  </th>
                  <th className="py-2.5 px-3 min-w-[220px] border-r border-slate-200 dark:border-slate-700">
                    Frekuensi
                  </th>
                  <th className="py-2.5 px-3 min-w-[200px]">
                    Kecepatan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                {LIKELIHOOD_OPTIONS.map((item) => {
                  const isSelected = likelihood === item.level;
                  return (
                    <tr
                      key={item.level}
                      onClick={() => {
                        if (disabled) return;
                        if (allowUnselectLikelihood && isSelected) {
                          onChangeLikelihood(0);
                        } else {
                          onChangeLikelihood(item.level);
                        }
                      }}
                      className={`transition-colors cursor-pointer select-none ${
                        isSelected
                          ? 'bg-sky-50/80 dark:bg-sky-950/40 text-slate-900 dark:text-white font-medium'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                      } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {/* Probabilitas with radio */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="pt-0.5">
                            <input
                              type="radio"
                              name={`${radioPrefix}_likelihood`}
                              checked={isSelected}
                              disabled={disabled}
                              onChange={() => {
                                if (allowUnselectLikelihood && isSelected) {
                                  onChangeLikelihood(0);
                                } else {
                                  onChangeLikelihood(item.level);
                                }
                              }}
                              className="w-4 h-4 text-[#009fe3] border-slate-300 dark:border-slate-600 focus:ring-[#009fe3] cursor-pointer"
                            />
                          </div>
                          <span className={`leading-snug ${isSelected ? 'font-bold text-[#009fe3] dark:text-sky-400' : ''}`}>
                            {item.probabilitas}
                          </span>
                        </div>
                      </td>

                      {/* Persentase */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-top whitespace-nowrap font-medium">
                        {item.persentase}
                      </td>

                      {/* Frekuensi */}
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-top leading-relaxed">
                        {item.frekuensi}
                      </td>

                      {/* Kecepatan */}
                      <td className="py-2.5 px-3 align-top leading-relaxed">
                        {item.kecepatan}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CONSEQUENCES / DAMPAK SECTION */}
      {showConsequence && onChangeConsequence && (
        <div className="flex flex-col md:flex-row md:items-start gap-4 pt-2">
          {/* Left Column Label */}
          <div className="md:w-56 shrink-0 pt-2">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              Consequences / Dampak <br />
              <span className="text-red-500 font-bold">*</span>
            </label>
            {consequence > 0 && allowUnselectConsequence && !disabled && (
              <button
                type="button"
                onClick={() => onChangeConsequence(0)}
                className="mt-1.5 text-[11px] text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:underline font-medium block"
              >
                ✕ Kosongkan pilihan
              </button>
            )}
          </div>

          {/* Right Column Table */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Subtitle above table: Kriteria Dampak Risiko terhadap Keuangan */}
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
              Kriteria Dampak Risiko terhadap Keuangan
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <table className="w-full border-collapse text-left text-xs text-slate-700 dark:text-slate-200">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px] border-r border-slate-200 dark:border-slate-700">
                      Pilih Level
                    </th>
                    <th className="py-2.5 px-3 min-w-[320px]">
                      Dampak Kerugian terhadap Keuangan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                  {CONSEQUENCE_OPTIONS.map((item) => {
                    const isSelected = consequence === item.level;
                    return (
                      <tr
                        key={item.level}
                        onClick={() => {
                          if (disabled) return;
                          if (allowUnselectConsequence && isSelected) {
                            onChangeConsequence(0);
                          } else {
                            onChangeConsequence(item.level);
                          }
                        }}
                        className={`transition-colors cursor-pointer select-none ${
                          isSelected
                            ? 'bg-sky-50/80 dark:bg-sky-950/40 text-slate-900 dark:text-white font-medium'
                            : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                        } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {/* Level with radio */}
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 align-top">
                          <div className="flex items-start gap-2.5">
                            <div className="pt-0.5">
                              <input
                                type="radio"
                                name={`${radioPrefix}_consequence`}
                                checked={isSelected}
                                disabled={disabled}
                                onChange={() => {
                                  if (allowUnselectConsequence && isSelected) {
                                    onChangeConsequence(0);
                                  } else {
                                    onChangeConsequence(item.level);
                                  }
                                }}
                                className="w-4 h-4 text-[#009fe3] border-slate-300 dark:border-slate-600 focus:ring-[#009fe3] cursor-pointer"
                              />
                            </div>
                            <span className={`leading-snug ${isSelected ? 'font-bold text-[#009fe3] dark:text-sky-400' : ''}`}>
                              {item.label}
                            </span>
                          </div>
                        </td>

                        {/* Dampak Kerugian terhadap Keuangan */}
                        <td className="py-2.5 px-3 align-top leading-relaxed text-slate-700 dark:text-slate-300">
                          <strong className="font-bold text-slate-900 dark:text-white">
                            {item.kerugianHighlight}
                          </strong>{' '}
                          <span>{item.kerugianDesc}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
