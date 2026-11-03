import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, RotateCcw, X, Lock, Home, Check, AlertCircle } from 'lucide-react';
import { UserRole } from '../../types/pusri';
import { PusriApiClient, type MasterLikelihoodConsequenceRow } from '../../services/api';

export type LikelihoodConsequenceRow = MasterLikelihoodConsequenceRow;

export const DEFAULT_MASTER_LC_ROWS: LikelihoodConsequenceRow[] = [
  {
    id: 'lc-1',
    likelihood: 1,
    keteranganEn: 'Almost Never',
    keteranganId: 'Sangat Rendah',
    c1: 'L',
    c2: 'L',
    c3: 'LM',
    c4: 'M',
    c5: 'H',
    status: 'Aktif'
  },
  {
    id: 'lc-2',
    likelihood: 2,
    keteranganEn: 'Unlikely',
    keteranganId: 'Rendah',
    c1: 'L',
    c2: 'LM',
    c3: 'LM',
    c4: 'MH',
    c5: 'H',
    status: 'Aktif'
  },
  {
    id: 'lc-3',
    likelihood: 3,
    keteranganEn: 'Possible',
    keteranganId: 'Sedang',
    c1: 'L',
    c2: 'LM',
    c3: 'M',
    c4: 'MH',
    c5: 'H',
    status: 'Aktif'
  },
  {
    id: 'lc-4',
    likelihood: 4,
    keteranganEn: 'Likely',
    keteranganId: 'Tinggi',
    c1: 'L',
    c2: 'LM',
    c3: 'M',
    c4: 'MH',
    c5: 'H',
    status: 'Aktif'
  },
  {
    id: 'lc-5',
    likelihood: 5,
    keteranganEn: 'Almost Certain',
    keteranganId: 'Sangat Tinggi',
    c1: 'LM',
    c2: 'M',
    c3: 'MH',
    c4: 'H',
    c5: 'H',
    status: 'Aktif'
  }
];

interface MasterLikelihoodConsequenceViewProps {
  currentRole?: UserRole;
  onNavigateTab?: (tab: string) => void;
}

export const MasterLikelihoodConsequenceView: React.FC<MasterLikelihoodConsequenceViewProps> = ({
  currentRole = 'risk officer',
  onNavigateTab
}) => {
  const isAdmin = currentRole === 'risk admin';
  const [rows, setRows] = useState<LikelihoodConsequenceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<LikelihoodConsequenceRow | null>(null);

  // Form states for Add / Edit modal
  const [formLikelihood, setFormLikelihood] = useState<number>(1);
  const [formKeteranganEn, setFormKeteranganEn] = useState('');
  const [formKeteranganId, setFormKeteranganId] = useState('');
  const [formC1, setFormC1] = useState('L');
  const [formC2, setFormC2] = useState('L');
  const [formC3, setFormC3] = useState('LM');
  const [formC4, setFormC4] = useState('M');
  const [formC5, setFormC5] = useState('H');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let active = true;
    PusriApiClient.getMasterLikelihoodConsequence()
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((error: unknown) => {
        if (active) {
          showToast('error', error instanceof Error ? error.message : 'Gagal memuat Master Likelihood dari database.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const saveRows = async (updatedRows: LikelihoodConsequenceRow[], reset = false): Promise<boolean> => {
    setIsBusy(true);
    try {
      const savedRows = await PusriApiClient.saveMasterLikelihoodConsequence(updatedRows, reset);
      setRows(savedRows);
      showToast('success', reset ? 'Master Likelihood berhasil direset.' : 'Master Likelihood berhasil disimpan ke database.');
      return true;
    } catch (error: unknown) {
      showToast('error', error instanceof Error ? error.message : 'Gagal menyimpan Master Likelihood ke database.');
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setEditingRow(null);
    const nextLikelihood = rows.length > 0 ? Math.max(...rows.map((r) => r.likelihood)) + 1 : 1;
    setFormLikelihood(nextLikelihood);
    setFormKeteranganEn('');
    setFormKeteranganId('');
    setFormC1('L');
    setFormC2('LM');
    setFormC3('M');
    setFormC4('MH');
    setFormC5('H');
    setFormStatus('Aktif');
    setModalOpen(true);
  };

  const handleOpenEdit = (row: LikelihoodConsequenceRow) => {
    if (!isAdmin) return;
    setEditingRow(row);
    setFormLikelihood(row.likelihood);
    setFormKeteranganEn(row.keteranganEn);
    setFormKeteranganId(row.keteranganId);
    setFormC1(row.c1);
    setFormC2(row.c2);
    setFormC3(row.c3);
    setFormC4(row.c4);
    setFormC5(row.c5);
    setFormStatus(row.status);
    setModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || isBusy) return;
    if (!formKeteranganEn.trim() && !formKeteranganId.trim()) return;

    let updatedRows: LikelihoodConsequenceRow[];
    if (editingRow) {
      updatedRows = rows.map((r) =>
        r.id === editingRow.id
          ? {
              ...r,
              likelihood: formLikelihood,
              keteranganEn: formKeteranganEn.trim(),
              keteranganId: formKeteranganId.trim(),
              c1: formC1,
              c2: formC2,
              c3: formC3,
              c4: formC4,
              c5: formC5,
              status: formStatus
            }
          : r
      );
    } else {
      const newRow: LikelihoodConsequenceRow = {
        id: `lc-${Date.now()}`,
        likelihood: formLikelihood,
        keteranganEn: formKeteranganEn.trim(),
        keteranganId: formKeteranganId.trim(),
        c1: formC1,
        c2: formC2,
        c3: formC3,
        c4: formC4,
        c5: formC5,
        status: formStatus
      };
      updatedRows = [...rows, newRow];
    }
    if (await saveRows(updatedRows)) setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin || isBusy) return;
    if (await saveRows(rows.filter((r) => r.id !== id))) setDeleteConfirmId(null);
  };

  const handleResetDefault = async () => {
    if (!isAdmin || isBusy) return;
    await saveRows(DEFAULT_MASTER_LC_ROWS, true);
  };

  // Filter rows by search term
  const filteredRows = rows.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const fullKeterangan = `${r.keteranganEn} ${r.keteranganId}`.toLowerCase();
    return (
      r.likelihood.toString().includes(q) ||
      fullKeterangan.includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 max-w-6xl mx-auto py-2">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-lg text-xs font-medium shadow-xl flex items-center gap-2 border ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-950 text-rose-100 border-rose-800'
          }`}
          role="status"
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
      {/* Lock Banner when accessed under Risk Officer or Risk Owner session */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                Mode Terkunci — Input Data Master Matriks Khusus Risk Admin
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Sesi aktif Anda saat ini adalah <strong className="uppercase">{currentRole}</strong>. Penambahan dan perubahan Master Likelihood &amp; Consequence dikunci dan hanya dapat diakses oleh <strong>Risk Admin</strong>.
              </p>
            </div>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-[#009fe3]" />
              <span>Kembali ke Dashboard</span>
            </button>
          )}
        </div>
      )}

      {/* Top Banner Header */}
      <div className="p-3.5 md:p-4 rounded-xl bg-gradient-to-r from-[#009fe3] via-sky-800 to-sky-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-extrabold tracking-tight">
            Master Data Likelihood &amp; Consequence
          </h2>
          <p className="text-xs text-sky-100 mt-0.5">
            Tabel Standar Matriks Kriteria Risiko Pusri (Tingkat Kemungkinan vs Konsekuensi Dampak 1–5)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={!isAdmin || isBusy || isLoading}
            onClick={handleResetDefault}
            className={`px-3 py-1.5 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isAdmin && !isBusy && !isLoading
                ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white cursor-pointer'
                : 'bg-white/5 border-white/15 text-white/60 cursor-not-allowed'
            }`}
            title={isAdmin ? 'Kembalikan tabel ke standar default Pusri' : 'Terkunci — Khusus Risk Admin'}
          >
            {isAdmin ? <RotateCcw className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isBusy ? 'Menyimpan...' : 'Reset Standar'}</span>
          </button>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5">
        {/* Top Control Bar: Tambah Button on Left, Cari Input on Right */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            disabled={!isAdmin || isBusy || isLoading}
            onClick={handleOpenAdd}
            className={`px-5 py-2 font-semibold text-sm rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 ${
              isAdmin && !isBusy && !isLoading
                ? 'bg-[#009fe3] hover:bg-[#0284c7] text-white cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-70'
            }`}
            title={isAdmin ? 'Tambah baris kriteria baru' : 'Terkunci — Khusus Risk Admin'}
          >
            {!isAdmin && <Lock className="w-3.5 h-3.5" />}
            <span>{isBusy ? 'Menyimpan...' : isAdmin ? 'Tambah' : 'Input Dikunci (Admin)'}</span>
          </button>

          <div className="relative">
            <input
              type="text"
              placeholder="Cari"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 sm:w-60 h-9 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#009fe3] transition-colors"
            />
          </div>
        </div>

        {/* The Exact Table matching the user's uploaded image */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <thead>
              {/* Row 1 of Header */}
              <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100">
                <th rowSpan={2} className="py-3 px-4 text-center align-middle whitespace-nowrap min-w-[110px]">
                  LIKELIHOOD
                </th>
                <th rowSpan={2} className="py-3 px-4 text-left align-middle min-w-[200px]">
                  Keterangan Level
                </th>
                <th colSpan={5} className="py-2 px-4 text-center font-bold uppercase tracking-wider">
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-1.5 mx-auto max-w-[280px]">
                    CONSEQUENCE
                  </div>
                </th>
                <th rowSpan={2} className="py-3 px-4 text-left align-middle min-w-[90px]">
                  Status
                </th>
                <th rowSpan={2} className="py-3 px-4 text-center align-middle w-24">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
              {/* Row 2 of Header (Consequence sub-numbers 1, 2, 3, 4, 5) */}
              <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100">
                <th className="py-2.5 px-3 text-center w-12 sm:w-16">1</th>
                <th className="py-2.5 px-3 text-center w-12 sm:w-16">2</th>
                <th className="py-2.5 px-3 text-center w-12 sm:w-16">3</th>
                <th className="py-2.5 px-3 text-center w-12 sm:w-16">4</th>
                <th className="py-2.5 px-3 text-center w-12 sm:w-16">5</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading || filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    {isLoading
                      ? 'Memuat master data dari database...'
                      : `Tidak ada data yang sesuai dengan pencarian "${searchTerm}".`}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* LIKELIHOOD Number */}
                    <td className="py-4 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                      {row.likelihood}
                    </td>

                    {/* Keterangan Level */}
                    <td className="py-4 px-4 font-normal text-slate-700 dark:text-slate-300 leading-snug">
                      <div>{row.keteranganEn} /</div>
                      <div>{row.keteranganId}</div>
                    </td>

                    {/* CONSEQUENCE 1 to 5 */}
                    <td className="py-4 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                      {row.c1}
                    </td>
                    <td className="py-4 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                      {row.c2}
                    </td>
                    <td className="py-4 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                      {row.c3}
                    </td>
                    <td className="py-4 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                      {row.c4}
                    </td>
                    <td className="py-4 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                      {row.c5}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-normal">
                      {row.status}
                    </td>

                    {/* Actions: Edit & Delete (Admin Only) */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {isAdmin ? (
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(row)}
                            className="text-[#009fe3] hover:text-[#0284c7] transition-colors cursor-pointer p-1 rounded hover:bg-sky-50 dark:hover:bg-sky-950/50"
                            title="Edit baris"
                          >
                            <Pencil className="w-4 h-4 stroke-[1.8]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(row.id)}
                            className="text-rose-500 hover:text-rose-600 transition-colors cursor-pointer p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-4 h-4 stroke-[1.8]" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
                          <Lock className="w-3 h-3" />
                          <span>Terkunci</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: TAMBAH / EDIT MASTER DATA */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#009fe3] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  {editingRow ? 'Edit Master Likelihood & Consequence' : 'Tambah Master Likelihood & Consequence'}
                </h3>
                <p className="text-xs text-sky-100 mt-0.5">
                  Konfigurasi matriks evaluasi kriteria kemungkinan dan konsekuensi risiko
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Level Likelihood (1–5) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formLikelihood}
                    onChange={(e) => setFormLikelihood(Number(e.target.value))}
                    required
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#009fe3]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#009fe3]"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Level (English) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Almost Never, Unlikely, Possible..."
                  value={formKeteranganEn}
                  onChange={(e) => setFormKeteranganEn(e.target.value)}
                  required
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#009fe3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Level (Bahasa Indonesia) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sangat Rendah, Rendah, Sedang, Tinggi, Sangat Tinggi..."
                  value={formKeteranganId}
                  onChange={(e) => setFormKeteranganId(e.target.value)}
                  required
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#009fe3]"
                />
              </div>

              {/* Consequence mappings 1 - 5 */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Pemetaan Consequence Level 1 s/d 5 (L / LM / M / MH / H):
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <span className="block text-[11px] text-center font-bold text-slate-500 mb-1">C 1</span>
                    <select
                      value={formC1}
                      onChange={(e) => setFormC1(e.target.value)}
                      className="w-full h-8 px-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                    >
                      <option value="L">L</option>
                      <option value="LM">LM</option>
                      <option value="M">M</option>
                      <option value="MH">MH</option>
                      <option value="H">H</option>
                    </select>
                  </div>
                  <div>
                    <span className="block text-[11px] text-center font-bold text-slate-500 mb-1">C 2</span>
                    <select
                      value={formC2}
                      onChange={(e) => setFormC2(e.target.value)}
                      className="w-full h-8 px-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                    >
                      <option value="L">L</option>
                      <option value="LM">LM</option>
                      <option value="M">M</option>
                      <option value="MH">MH</option>
                      <option value="H">H</option>
                    </select>
                  </div>
                  <div>
                    <span className="block text-[11px] text-center font-bold text-slate-500 mb-1">C 3</span>
                    <select
                      value={formC3}
                      onChange={(e) => setFormC3(e.target.value)}
                      className="w-full h-8 px-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                    >
                      <option value="L">L</option>
                      <option value="LM">LM</option>
                      <option value="M">M</option>
                      <option value="MH">MH</option>
                      <option value="H">H</option>
                    </select>
                  </div>
                  <div>
                    <span className="block text-[11px] text-center font-bold text-slate-500 mb-1">C 4</span>
                    <select
                      value={formC4}
                      onChange={(e) => setFormC4(e.target.value)}
                      className="w-full h-8 px-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                    >
                      <option value="L">L</option>
                      <option value="LM">LM</option>
                      <option value="M">M</option>
                      <option value="MH">MH</option>
                      <option value="H">H</option>
                    </select>
                  </div>
                  <div>
                    <span className="block text-[11px] text-center font-bold text-slate-500 mb-1">C 5</span>
                    <select
                      value={formC5}
                      onChange={(e) => setFormC5(e.target.value)}
                      className="w-full h-8 px-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3]"
                    >
                      <option value="L">L</option>
                      <option value="LM">LM</option>
                      <option value="M">M</option>
                      <option value="MH">MH</option>
                      <option value="H">H</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#009fe3] hover:bg-[#0284c7] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingRow ? 'Simpan Perubahan' : 'Tambahkan Baris'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Hapus Baris Master Data?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tindakan ini akan menghapus baris level kriteria ini dari tabel master data.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
