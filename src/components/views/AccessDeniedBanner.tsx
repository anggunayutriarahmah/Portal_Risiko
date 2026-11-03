import React from 'react';
import { Lock, ArrowLeft, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { UserRole, formatUserRole } from '../../types/pusri';

interface AccessDeniedBannerProps {
  requiredRole: UserRole | string;
  currentRole: UserRole;
  onBackToDashboard?: () => void;
  onGoToIdentifikasi?: () => void;
  onBack?: () => void;
  moduleName: string;
  customActionLabel?: string;
}

export const AccessDeniedBanner: React.FC<AccessDeniedBannerProps> = ({
  requiredRole,
  currentRole,
  onBackToDashboard,
  onGoToIdentifikasi,
  onBack,
  moduleName,
  customActionLabel
}) => {
  const handleBack = onBack || onBackToDashboard;
  const formattedReq = formatUserRole(requiredRole);
  const formattedCurr = formatUserRole(currentRole);

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-md max-w-lg mx-auto my-10 space-y-6 text-center">
      {/* Icon Lock */}
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
        <Lock className="w-8 h-8" />
      </div>

      {/* Header Info */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold font-mono px-3 py-1 rounded-full bg-amber-100/80 dark:bg-amber-950 text-amber-800 dark:text-amber-300 uppercase tracking-wide border border-amber-200">
          Menu Khusus {formattedReq}
        </span>
        <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
          {moduleName}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Menu ini hanya dapat diakses oleh role <strong>{formattedReq}</strong>. Posisi aktif Anda saat ini: <strong>{formattedCurr}</strong>.
        </p>
      </div>

      {/* Simple Information Box */}
      <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-left space-y-2">
        <div className="flex items-center gap-2 text-[#009fe3] font-bold text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Informasi Hak Akses SOP Pusri:</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Tahapan ini merupakan wewenang khusus pejabat <strong>{formattedReq}</strong> untuk melakukan review, verifikasi tingkat risiko, penentuan PIC departemen, atau persetujuan korporat.
        </p>
      </div>

      {/* Clean Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        {onGoToIdentifikasi && (
          <button
            type="button"
            onClick={onGoToIdentifikasi}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#009fe3] hover:bg-[#0089c4] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{customActionLabel || 'Ke Identifikasi Risiko'}</span>
          </button>
        )}

        {handleBack && (
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{onBack ? 'Kembali' : 'Kembali ke Dashboard'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

