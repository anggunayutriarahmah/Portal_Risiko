import React, { useState, useMemo } from 'react';
import {
  Database,
  Plus,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  Lock,
  Check,
  X,
  AlertCircle,
  Home
} from 'lucide-react';
import { SumberRisikoGroup, UserRole } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';

interface MasterSumberRisikoViewProps {
  currentRole: UserRole;
  sumberRisikoGroups: SumberRisikoGroup[];
  onUpdateSumberRisiko: (groups: SumberRisikoGroup[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const MasterSumberRisikoView: React.FC<MasterSumberRisikoViewProps> = ({
  currentRole,
  sumberRisikoGroups,
  onUpdateSumberRisiko,
  onNavigateTab
}) => {
  const isAdmin = currentRole === 'risk admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategoriFilter, setSelectedKategoriFilter] = useState<string>('ALL');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [kategoriMode, setKategoriMode] = useState<'existing' | 'new'>('existing');
  const [selectedKategori, setSelectedKategori] = useState<string>(
    sumberRisikoGroups[0]?.kategori || 'Material'
  );
  const [newKategoriInput, setNewKategoriInput] = useState('');
  const [newItemInput, setNewItemInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Item / Kategori Modal State
  const [editTarget, setEditTarget] = useState<{
    mode: 'item' | 'kategori';
    kategori: string;
    item?: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editKategoriForItem, setEditKategoriForItem] = useState('');

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    kategori: string;
    item?: string;
  } | null>(null);

  // Reset Confirmation Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const totalCategories = sumberRisikoGroups.length;
  const totalItems = useMemo(
    () => sumberRisikoGroups.reduce((acc, g) => acc + g.items.length, 0),
    [sumberRisikoGroups]
  );

  const filteredGroups = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return sumberRisikoGroups
      .filter((group) => selectedKategoriFilter === 'ALL' || group.kategori === selectedKategoriFilter)
      .map((group) => {
        if (!q) return group;
        const matchKategori = group.kategori.toLowerCase().includes(q);
        const matchedItems = matchKategori
          ? group.items
          : group.items.filter((item) => item.toLowerCase().includes(q));
        return {
          ...group,
          items: matchedItems
        };
      })
      .filter((group) => group.items.length > 0 || (!q && selectedKategoriFilter !== 'ALL'));
  }, [sumberRisikoGroups, searchTerm, selectedKategoriFilter]);

  const handleOpenAddModal = (presetKategori?: string) => {
    if (!isAdmin) return;
    setFormError(null);
    if (presetKategori) {
      setKategoriMode('existing');
      setSelectedKategori(presetKategori);
    } else if (sumberRisikoGroups.length > 0) {
      setKategoriMode('existing');
      setSelectedKategori(sumberRisikoGroups[0].kategori);
    } else {
      setKategoriMode('new');
    }
    setNewKategoriInput('');
    setNewItemInput('');
    setIsAddModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setFormError(null);

    const targetKategori =
      kategoriMode === 'new' ? newKategoriInput.trim() : selectedKategori.trim();
    const targetItem = newItemInput.trim();

    if (!targetKategori) {
      setFormError('Nama kategori sumber risiko wajib diisi atau dipilih.');
      return;
    }
    if (!targetItem) {
      setFormError('Nama / butir sumber risiko wajib diisi.');
      return;
    }

    setIsBusy(true);
    try {
      const res = await PusriApiClient.addMasterSumberRisiko(targetKategori, targetItem);
      if (res.success && res.data) {
        onUpdateSumberRisiko(res.data);
        setIsAddModalOpen(false);
        setNewItemInput('');
        setNewKategoriInput('');
        showToast('success', res.message);
      } else {
        setFormError(res.message);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleOpenEditKategori = (kategori: string) => {
    if (!isAdmin) return;
    setFormError(null);
    setEditTarget({ mode: 'kategori', kategori });
    setEditValue(kategori);
  };

  const handleOpenEditItem = (kategori: string, item: string) => {
    if (!isAdmin) return;
    setFormError(null);
    setEditTarget({ mode: 'item', kategori, item });
    setEditValue(item);
    setEditKategoriForItem(kategori);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editTarget) return;
    setFormError(null);

    const trimmed = editValue.trim();
    if (!trimmed) {
      setFormError('Nilai perubahan tidak boleh kosong.');
      return;
    }

    setIsBusy(true);
    try {
      const payload =
        editTarget.mode === 'kategori'
          ? { oldKategori: editTarget.kategori, newKategori: trimmed }
          : {
              oldKategori: editTarget.kategori,
              newKategori: editKategoriForItem || editTarget.kategori,
              oldItem: editTarget.item,
              newItem: trimmed
            };

      const res = await PusriApiClient.updateMasterSumberRisiko(payload);
      if (res.success && res.data) {
        onUpdateSumberRisiko(res.data);
        if (
          editTarget.mode === 'kategori' &&
          selectedKategoriFilter === editTarget.kategori
        ) {
          setSelectedKategoriFilter(trimmed);
        }
        setEditTarget(null);
        showToast('success', res.message);
      } else {
        setFormError(res.message);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!isAdmin || !deleteTarget) return;
    setIsBusy(true);
    try {
      const res = await PusriApiClient.deleteMasterSumberRisiko(deleteTarget);
      if (res.success && res.data) {
        onUpdateSumberRisiko(res.data);
        if (!deleteTarget.item && selectedKategoriFilter === deleteTarget.kategori) {
          setSelectedKategoriFilter('ALL');
        }
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    } finally {
      setIsBusy(false);
      setDeleteTarget(null);
    }
  };

  const handleConfirmReset = async () => {
    if (!isAdmin) return;
    setIsBusy(true);
    try {
      const res = await PusriApiClient.resetMasterSumberRisiko();
      if (res.success && res.data) {
        onUpdateSumberRisiko(res.data);
        setSelectedKategoriFilter('ALL');
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    } finally {
      setIsBusy(false);
      setIsResetModalOpen(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto py-2">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-lg text-xs font-medium shadow-xl flex items-center gap-2 border ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-950 text-rose-100 border-rose-800'
          }`}
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
                Mode Terkunci — Input Data Master Khusus Risk Admin
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Sesi aktif Anda saat ini adalah <strong className="uppercase">{currentRole}</strong>. Penambahan, perubahan, dan penghapusan Master Sumber Risiko dikunci dan hanya dapat diakses pada sesi <strong>Risk Admin</strong>.
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

      {/* Header Section */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#009fe3] shrink-0" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Master Data Sumber Risiko
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Referensi terpusat dropdown <strong>Sumber Risiko (By Data)</strong> pada formulir Identifikasi &amp; Pembaruan Risiko PT Pupuk Sriwidjaja Palembang.
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>{totalCategories} Kategori Taksonomi</span>
            <span aria-hidden="true">·</span>
            <span>{totalItems} Butir Sumber Risiko Terdaftar</span>
            <span aria-hidden="true">·</span>
            <span>{isAdmin ? 'Otoritas: Risk Admin (Akses Penuh)' : `Otoritas: ${currentRole} (Terkunci)`}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            disabled={!isAdmin || isBusy}
            onClick={() => isAdmin && setIsResetModalOpen(true)}
            className={`px-3.5 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              isAdmin
                ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
                : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed opacity-65'
            }`}
            title={isAdmin ? 'Kembalikan ke data standar Pusri' : 'Terkunci — Khusus Risk Admin'}
          >
            {isAdmin ? <RotateCcw className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Reset Standar</span>
          </button>

          <button
            type="button"
            disabled={!isAdmin || isBusy}
            onClick={() => handleOpenAddModal()}
            className={`px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
              isAdmin
                ? 'bg-[#009fe3] hover:bg-[#0284c7] text-white cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-70'
            }`}
            title={isAdmin ? 'Tambah kategori atau butir sumber risiko baru' : 'Terkunci — Khusus Risk Admin'}
          >
            {isAdmin ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isAdmin ? 'Tambah Sumber Risiko' : 'Input Dikunci (Admin)'}</span>
          </button>
        </div>
      </div>

      {/* Main Filter & Data Table Workspace */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Interactive Category Filter Control */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Filter Kategori:
            </label>
            <select
              value={selectedKategoriFilter}
              onChange={(e) => setSelectedKategoriFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] cursor-pointer"
            >
              <option value="ALL">Semua Kategori ({totalCategories})</option>
              {sumberRisikoGroups.map((group) => (
                <option key={group.kategori} value={group.kategori}>
                  {group.kategori} ({group.items.length})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kategori atau butir sumber risiko..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#009fe3]"
            />
          </div>
        </div>

        {/* Grouped Master Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 font-bold">
                <th className="py-3 px-3 text-center w-14">No</th>
                <th className="py-3 px-4 w-64">Kategori Sumber Risiko</th>
                <th className="py-3 px-4">Uraian / Butir Sumber Risiko (Dropdown Data)</th>
                <th className="py-3 px-4 text-center w-36">Aksi Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    Tidak ditemukan data Master Sumber Risiko yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group, groupIdx) => (
                  <React.Fragment key={group.kategori}>
                    {/* Category Subheader Row */}
                    <tr className="bg-sky-50/60 dark:bg-sky-950/25">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#009fe3] dark:text-sky-400">
                        {String(groupIdx + 1).padStart(2, '0')}
                      </td>
                      <td colSpan={2} className="py-2.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                            {group.kategori}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {group.items.length} butir data
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        {isAdmin ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAddModal(group.kategori)}
                              className="px-2 py-1 rounded text-[11px] font-semibold text-[#009fe3] hover:bg-sky-100/80 dark:hover:bg-sky-900/40 inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title={`Tambah butir baru pada kategori ${group.kategori}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Butir</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditKategori(group.kategori)}
                              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-[#009fe3] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                              title={`Ubah nama kategori ${group.kategori}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ kategori: group.kategori })}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                              title={`Hapus seluruh kategori ${group.kategori}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Lock className="w-3 h-3" />
                            <span>Terkunci</span>
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Items under Category */}
                    {group.items.map((item, itemIdx) => (
                      <tr
                        key={`${group.kategori}-${item}`}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                          {groupIdx + 1}.{itemIdx + 1}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                          {group.kategori}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                          {item}
                        </td>
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          {isAdmin ? (
                            <div className="inline-flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditItem(group.kategori, item)}
                                className="p-1 rounded text-[#009fe3] hover:text-[#0284c7] hover:bg-sky-50 dark:hover:bg-sky-950/50 cursor-pointer transition-colors"
                                title="Edit butir sumber risiko"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ kategori: group.kategori, item })}
                                className="p-1 rounded text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                                title="Hapus butir sumber risiko"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              <Lock className="w-3 h-3" />
                              <span>Terkunci</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: TAMBAH SUMBER RISIKO BARU (ADMIN ONLY) */}
      {isAdmin && isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 bg-[#009fe3] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Tambah Master Sumber Risiko</h3>
                <p className="text-[11px] text-sky-100 mt-0.5">
                  Otomatis tampil pada pilihan Sumber Risiko (By Data) di seluruh unit kerja
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Toggle Existing vs New Category */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Kategori Sumber Risiko <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setKategoriMode('existing')}
                    className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      kategoriMode === 'existing'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Pilih Kategori Ada
                  </button>
                  <button
                    type="button"
                    onClick={() => setKategoriMode('new')}
                    className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      kategoriMode === 'new'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    + Buat Kategori Baru
                  </button>
                </div>

                {kategoriMode === 'existing' ? (
                  <select
                    value={selectedKategori}
                    onChange={(e) => setSelectedKategori(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-[#009fe3]"
                  >
                    {sumberRisikoGroups.map((g) => (
                      <option key={g.kategori} value={g.kategori}>
                        {g.kategori}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: Teknologi Informasi & Siber"
                    value={newKategoriInput}
                    onChange={(e) => setNewKategoriInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#009fe3]"
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama / Butir Sumber Risiko Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Gangguan integrasi sensor IoT / DCS pabrik"
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#009fe3]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="px-4 py-2 rounded-lg bg-[#009fe3] hover:bg-[#0284c7] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isBusy ? 'Menyimpan...' : 'Simpan Data Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT KATEGORI / BUTIR SUMBER RISIKO (ADMIN ONLY) */}
      {isAdmin && editTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 bg-[#009fe3] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editTarget.mode === 'kategori'
                  ? 'Ubah Nama Kategori Sumber Risiko'
                  : 'Ubah Butir Sumber Risiko'}
              </h3>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {editTarget.mode === 'item' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kategori Sumber Risiko
                  </label>
                  <select
                    value={editKategoriForItem}
                    onChange={(e) => setEditKategoriForItem(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-[#009fe3]"
                  >
                    {sumberRisikoGroups.map((g) => (
                      <option key={g.kategori} value={g.kategori}>
                        {g.kategori}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {editTarget.mode === 'kategori' ? 'Nama Kategori Baru *' : 'Uraian Butir Sumber Risiko *'}
                </label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#009fe3]"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="px-4 py-2 rounded-lg bg-[#009fe3] hover:bg-[#0284c7] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isBusy ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS (ADMIN ONLY) */}
      {isAdmin && deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-3.5 bg-rose-600 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm">Konfirmasi Hapus Master Data</h4>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {deleteTarget.item ? (
                  <>
                    Apakah Anda yakin ingin menghapus butir sumber risiko{' '}
                    <strong className="text-slate-900 dark:text-slate-100">"{deleteTarget.item}"</strong> dari kategori{' '}
                    <strong>{deleteTarget.kategori}</strong>?
                  </>
                ) : (
                  <>
                    Apakah Anda yakin ingin menghapus seluruh kategori{' '}
                    <strong className="text-slate-900 dark:text-slate-100">"{deleteTarget.kategori}"</strong> beserta seluruh butir di dalamnya?
                  </>
                )}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isBusy ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI RESET STANDAR (ADMIN ONLY) */}
      {isAdmin && isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-3.5 bg-[#009fe3] text-white flex items-center justify-between">
              <h4 className="font-bold text-sm">Reset Master Sumber Risiko</h4>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Kembalikan daftar Master Sumber Risiko ke 7 kategori standar taksonomi PT Pupuk Sriwidjaja Palembang?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleConfirmReset}
                  className="px-4 py-2 rounded-lg bg-[#009fe3] hover:bg-[#0284c7] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isBusy ? 'Memproses...' : 'Ya, Reset Standar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
