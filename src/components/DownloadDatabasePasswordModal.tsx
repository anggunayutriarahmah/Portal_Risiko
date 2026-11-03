import React, { useState } from 'react';
import { Database, Lock, X, CheckCircle2, AlertCircle, Download, KeyRound } from 'lucide-react';
import { PusriApiClient } from '../services/api';

interface DownloadDatabasePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DownloadDatabasePasswordModal: React.FC<DownloadDatabasePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError('Silakan masukkan password administrator.');
      return;
    }

    setIsVerifying(true);
    try {
      if (password !== 'portal123') {
        const isValid = await PusriApiClient.verifyDownloadPassword(password);
        if (!isValid) {
          setError('Password salah! Akses download database ditolak.');
          setIsVerifying(false);
          return;
        }
      }

      // If valid, download SQL file with the password
      const ok = await PusriApiClient.downloadSqlFile(password);
      if (ok) {
        setPassword('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError('Gagal mengunduh file database. Pastikan koneksi server aktif.');
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-[#009fe3] text-white flex items-center justify-between border-b border-sky-600">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-yellow-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Otorisasi Unduh Basis Data</h3>
              <p className="text-[11px] text-sky-100">PT Pupuk Sriwidjaja Palembang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800/80 text-amber-900 dark:text-yellow-200 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Hak Akses Khusus Administrator</strong>
              <p className="mt-0.5 text-amber-800 dark:text-yellow-300">
                Skema & data database MySQL dilindungi kata sandi. Masukkan password otoritas untuk mengunduh arsip SQL.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Password Download Database:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Masukkan password"
                className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 font-mono shadow-2xs transition-all"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Petunjuk: Gunakan password resmi: <strong className="text-[#009fe3] dark:text-sky-400">portal123</strong>
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-2 bg-[#009fe3] hover:bg-[#0284c7] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Memverifikasi...' : 'Verifikasi & Unduh (.sql)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
