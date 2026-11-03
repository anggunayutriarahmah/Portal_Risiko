import React, { useState } from 'react';
import { X, GitBranch, CheckCircle2, ArrowRight, Play, Users, FileCheck } from 'lucide-react';
import { PUSRI_SOP_STAGES } from '../data/initialData';

interface SopWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SopWorkflowModal: React.FC<SopWorkflowModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState(1);
  const currentStage = PUSRI_SOP_STAGES.find((s) => s.step === activeStep) || PUSRI_SOP_STAGES[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="px-5 py-4 bg-[#009fe3] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-5 h-5 text-yellow-300" />
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Simulasi Alur Proses Bisnis & SOP 16 Tahapan Manajemen Risiko Pusri
              </h3>
              <p className="text-xs text-sky-100 mt-0.5">
                Pedoman Terpadu Enterprise Risk Management (ERM) PT Pupuk Sriwidjaja Palembang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Active Step Feature Box */}
          <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#009fe3] text-white font-bold text-xs flex items-center justify-center">
                  {currentStage.step}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentStage.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-950/70 text-amber-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800">
                  {currentStage.kategoriSOP}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                <Users className="w-3.5 h-3.5 text-[#009fe3]" />
                <span>Pelaksana: <strong>{currentStage.pic}</strong></span>
              </div>
            </div>

            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed mb-3">
              {currentStage.description}
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-sky-200/60 dark:border-sky-800/60 text-slate-700 dark:text-slate-300">
              <FileCheck className="w-4 h-4 text-[#009fe3]" />
              <span>Deliverable / Output Resmi: <strong className="text-slate-900 dark:text-slate-100">{currentStage.output}</strong></span>
            </div>
          </div>

          {/* 16 Steps Interactive Timeline Grid */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              Siklus 16 Tahapan Manajemen Risiko (Klik tahapan untuk melihat detail):
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {PUSRI_SOP_STAGES.map((stage) => {
                const isActive = stage.step === activeStep;
                return (
                  <button
                    key={stage.step}
                    onClick={() => setActiveStep(stage.step)}
                    className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                      isActive
                        ? 'border-[#009fe3] bg-[#009fe3] text-white shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        Tahap {stage.step}
                      </span>
                      <span className={`text-[9px] truncate max-w-[80px] ${
                        isActive ? 'text-yellow-200' : 'text-slate-400'
                      }`}>
                        {stage.kategoriSOP}
                      </span>
                    </div>
                    <div className="font-bold text-xs line-clamp-2 leading-tight">
                      {stage.title}
                    </div>
                    <div className={`text-[10px] mt-1 truncate ${
                      isActive ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      PIC: {stage.pic}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setActiveStep((prev) => (prev > 1 ? prev - 1 : 16))}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              ← Tahap Sebelumnya
            </button>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
              Tahap {activeStep} dari 16 Tahapan Pusri
            </span>
            <button
              onClick={() => setActiveStep((prev) => (prev < 16 ? prev + 1 : 1))}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#009fe3] hover:bg-[#0284c7] rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Tahap Selanjutnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
