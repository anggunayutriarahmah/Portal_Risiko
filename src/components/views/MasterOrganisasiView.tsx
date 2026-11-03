import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  PlusCircle, 
  Trash2, 
  X, 
  Check, 
  Building2, 
  Users, 
  Plus, 
  AlertCircle,
  Lock
} from 'lucide-react';
import { OrganizationMaster, PersonnelItem, PusriRisk, UserRole } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';

interface MasterOrganisasiViewProps {
  currentRole: UserRole;
  departments: OrganizationMaster[];
  risks: PusriRisk[];
  onDownloadSql: () => void;
  onFilterDept?: (kode: string) => void;
  onNavigateTab?: (tab: string) => void;
  onUpdateDepartments?: (depts: OrganizationMaster[]) => void;
}

export const MasterOrganisasiView: React.FC<MasterOrganisasiViewProps> = ({
  currentRole,
  departments,
  risks,
  onDownloadSql,
  onFilterDept,
  onNavigateTab,
  onUpdateDepartments
}) => {
  const isAdmin = currentRole === 'risk admin';
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for Add Personnel Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetDept, setTargetDept] = useState<OrganizationMaster | null>(null);
  const [personnelType, setPersonnelType] = useState<'officer' | 'owner'>('officer');
  const [nikInput, setNikInput] = useState('');
  const [namaInput, setNamaInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    dept: OrganizationMaster;
    type: 'officer' | 'owner';
    person: PersonnelItem;
  } | null>(null);

  // State for Add Department Modal (Admin feature)
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [newDeptKode, setNewDeptKode] = useState('');
  const [newDeptNama, setNewDeptNama] = useState('');
  const [newDeptDirektorat, setNewDeptDirektorat] = useState('');
  const [newDeptKepala, setNewDeptKepala] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter departments based on search
  const filteredDepts = departments.filter((d) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const matchKode = d.kode.toLowerCase().includes(term);
    const matchNama = d.nama.toLowerCase().includes(term);
    const matchDirektorat = (d.direktorat || '').toLowerCase().includes(term);
    const matchOfficers = (d.officers || []).some(
      (o) => o.nik.toLowerCase().includes(term) || o.nama.toLowerCase().includes(term)
    );
    const matchOwners = (d.owners || []).some(
      (o) => o.nik.toLowerCase().includes(term) || o.nama.toLowerCase().includes(term)
    );
    return matchKode || matchNama || matchDirektorat || matchOfficers || matchOwners;
  });

  // Open modal to add personnel (Admin only)
  const handleOpenAddModal = (dept: OrganizationMaster, type: 'officer' | 'owner') => {
    if (!isAdmin) return;
    setTargetDept(dept);
    setPersonnelType(type);
    setNikInput('');
    setNamaInput('');
    setInputError('');
    setIsAddModalOpen(true);
  };

  // Submit adding personnel (Admin only)
  const handleSavePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !targetDept) return;

    const trimmedNik = nikInput.trim();
    const trimmedNama = namaInput.trim();

    if (!trimmedNik) {
      setInputError('Nomor Badge / NIK wajib diisi.');
      return;
    }
    if (!trimmedNama) {
      setInputError('Nama lengkap wajib diisi.');
      return;
    }

    // Check duplicate
    const currentList = personnelType === 'officer' ? targetDept.officers || [] : targetDept.owners || [];
    if (currentList.some((p) => p.nik === trimmedNik)) {
      setInputError(`Personel dengan NIK ${trimmedNik} sudah terdaftar di unit ini.`);
      return;
    }

    setIsSubmitting(true);
    const newPerson: PersonnelItem = { nik: trimmedNik, nama: trimmedNama };

    try {
      const savedDept = await PusriApiClient.addDepartmentPersonnel(targetDept.kode, personnelType, newPerson);
      if (!savedDept) {
        setInputError('Akses ditolak atau gagal menyimpan ke server (Khusus Risk Admin).');
        return;
      }

      const updatedDepartments = departments.map((d) => {
        if (d.kode === targetDept.kode) {
          return savedDept;
        }
        return d;
      });

      if (onUpdateDepartments) {
        onUpdateDepartments(updatedDepartments);
      }

      showToast(`Berhasil menambahkan ${personnelType === 'officer' ? 'Corporate Risk Officer' : 'Corporate Risk Owner'}: ${trimmedNama}`);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      setInputError('Gagal menyimpan personel. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete confirmation (Admin only)
  const handlePromptDelete = (
    dept: OrganizationMaster,
    type: 'officer' | 'owner',
    person: PersonnelItem
  ) => {
    if (!isAdmin) return;
    setDeleteTarget({ dept, type, person });
    setIsDeleteModalOpen(true);
  };

  // Execute delete personnel (Admin only)
  const handleConfirmDelete = async () => {
    if (!isAdmin || !deleteTarget) return;
    const { dept, type, person } = deleteTarget;

    try {
      const savedDept = await PusriApiClient.removeDepartmentPersonnel(dept.kode, type, person.nik);
      if (!savedDept) {
        showToast('Akses ditolak — Penghapusan Master Data khusus Risk Admin.');
        return;
      }

      const updatedDepartments = departments.map((d) => (d.kode === dept.kode ? savedDept : d));

      if (onUpdateDepartments) {
        onUpdateDepartments(updatedDepartments);
      }

      showToast(`Personel ${person.nama} (${person.nik}) berhasil dihapus.`);
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus personel.');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  // Handle Add New Department (Admin only)
  const handleSaveNewDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newDeptKode.trim() || !newDeptNama.trim()) {
      showToast('Kode dan Nama Organisasi wajib diisi.');
      return;
    }

    const newDept: OrganizationMaster = {
      kode: newDeptKode.trim().toUpperCase(),
      nama: newDeptNama.trim(),
      direktorat: newDeptDirektorat.trim() || 'Direktorat Terkait',
      kepalaUnit: newDeptKepala.trim() || 'Vice President',
      totalRisiko: 0,
      officers: [],
      owners: []
    };

    try {
      const savedDept = await PusriApiClient.updateDepartment(newDept);
      if (!savedDept) {
        showToast('Akses ditolak — Penambahan Organisasi khusus Risk Admin.');
        return;
      }
      const updated = [...departments.filter((d) => d.kode !== savedDept.kode), savedDept];
      if (onUpdateDepartments) {
        onUpdateDepartments(updated);
      }
      showToast(`Departemen ${savedDept.nama} (${savedDept.kode}) berhasil ditambahkan.`);
      setIsAddDeptModalOpen(false);
      setNewDeptKode('');
      setNewDeptNama('');
      setNewDeptDirektorat('');
      setNewDeptKepala('');
    } catch (err) {
      console.error(err);
      showToast('Gagal menambahkan departemen.');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto py-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
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
                Mode Terkunci — Input Data Master Organisasi Khusus Risk Admin
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Sesi aktif Anda saat ini adalah <strong className="uppercase">{currentRole}</strong>. Penambahan departemen serta pengaturan personel Officer/Owner dikunci dan hanya dapat diakses oleh <strong>Risk Admin</strong>.
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

      {/* Breadcrumb Navigation exact as in screenshot: 🏠 / Daftar Organisasi */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Home className="w-4 h-4 text-[#009fe3]" />
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">Daftar Organisasi</span>
      </div>

      {/* Main Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Top Bar: Search Bar with Attached Cyan/Teal Search Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() => isAdmin && setIsAddDeptModalOpen(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border ${
                isAdmin
                  ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 cursor-pointer'
                  : 'bg-slate-100/70 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-65'
              }`}
              title={isAdmin ? 'Tambah Organisasi Baru' : 'Terkunci — Khusus Risk Admin'}
            >
              {isAdmin ? <Plus className="w-3.5 h-3.5 text-[#009fe3]" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isAdmin ? 'Tambah Organisasi' : 'Input Dikunci (Admin)'}</span>
            </button>
            <span className="text-xs text-slate-500 font-mono">
              Total: <strong>{filteredDepts.length}</strong> Organisasi
            </span>
          </div>

          <div className="flex max-w-xs w-full">
            <input
              type="text"
              placeholder="Search.."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-l-md text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#009fe3] transition-all"
            />
            <button
              type="button"
              onClick={() => {}}
              className="px-3.5 bg-[#009fe3] hover:bg-[#0284c7] text-white rounded-r-md flex items-center justify-center transition-colors cursor-pointer border border-[#009fe3]"
              title="Cari Organisasi"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table layout matching the screenshot exact layout */}
        <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold">
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-12">
                  No
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-left w-36">
                  Kode Organisasi
                </th>
                <th className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 text-left min-w-[220px]">
                  Nama Organisasi
                </th>
                <th className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-700 text-center uppercase tracking-wide min-w-[240px]">
                  CORPORATE RISK OFFICER
                </th>
                <th className="py-2.5 px-4 text-center uppercase tracking-wide min-w-[240px]">
                  CORPORATE RISK OWNER
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data organisasi yang sesuai dengan pencarian "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredDepts.map((dept, idx) => (
                  <tr
                    key={dept.kode}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* No */}
                    <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-center text-slate-700 dark:text-slate-300 font-medium">
                      {idx + 1}
                    </td>

                    {/* Kode Organisasi */}
                    <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium font-mono">
                      {dept.kode}
                    </td>

                    {/* Nama Organisasi */}
                    <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                      {dept.nama}
                    </td>

                    {/* CORPORATE RISK OFFICER */}
                    <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 text-left align-top">
                      {isAdmin ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenAddModal(dept, 'officer')}
                            className="text-[#009fe3] hover:text-sky-700 dark:text-sky-400 font-medium text-xs inline-flex items-center gap-1 mb-1 transition-colors cursor-pointer group"
                          >
                            <PlusCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            <span>Tambah</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 inline-flex items-center gap-1 mb-1 font-mono">
                          <Lock className="w-3 h-3" />
                          <span>Terkunci</span>
                        </div>
                      )}

                      {/* List of Officers */}
                      <div className="space-y-1 mt-0.5">
                        {dept.officers && dept.officers.length > 0 ? (
                          dept.officers.map((officer) => (
                            <div
                              key={officer.nik}
                              className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs"
                            >
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handlePromptDelete(dept, 'officer', officer)}
                                  title={`Hapus ${officer.nama}`}
                                  className="text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <span>
                                {officer.nik} - {officer.nama}
                              </span>
                            </div>
                          ))
                        ) : null}
                      </div>
                    </td>

                    {/* CORPORATE RISK OWNER */}
                    <td className="py-3 px-4 text-left align-top">
                      {isAdmin ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenAddModal(dept, 'owner')}
                            className="text-[#009fe3] hover:text-sky-700 dark:text-sky-400 font-medium text-xs inline-flex items-center gap-1 mb-1 transition-colors cursor-pointer group"
                          >
                            <PlusCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            <span>Tambah</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 inline-flex items-center gap-1 mb-1 font-mono">
                          <Lock className="w-3 h-3" />
                          <span>Terkunci</span>
                        </div>
                      )}

                      {/* List of Owners */}
                      <div className="space-y-1 mt-0.5">
                        {dept.owners && dept.owners.length > 0 ? (
                          dept.owners.map((owner) => (
                            <div
                              key={owner.nik}
                              className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs"
                            >
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handlePromptDelete(dept, 'owner', owner)}
                                  title={`Hapus ${owner.nama}`}
                                  className="text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <span>
                                {owner.nik} - {owner.nama}
                              </span>
                            </div>
                          ))
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Personel (Officer / Owner) */}
      {isAddModalOpen && targetDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-[#009fe3] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">
                  Tambah Corporate Risk {personnelType === 'officer' ? 'Officer' : 'Owner'}
                </h4>
                <p className="text-[11px] text-sky-100 mt-0.5">
                  Unit: {targetDept.nama} ({targetDept.kode})
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

            <form onSubmit={handleSavePersonnel} className="p-5 space-y-4 text-xs">
              {inputError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{inputError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Badge / NIK <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 112128"
                  value={nikInput}
                  onChange={(e) => setNikInput(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:border-[#009fe3] focus:ring-1 focus:ring-[#009fe3]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ria Ramadi Kurniawan"
                  value={namaInput}
                  onChange={(e) => setNamaInput(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-[#009fe3] focus:ring-1 focus:ring-[#009fe3]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-[#009fe3] hover:bg-[#0284c7] text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Personel */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 bg-rose-600 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm">Konfirmasi Hapus</h4>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Apakah Anda yakin ingin menghapus{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  {deleteTarget.person.nama} ({deleteTarget.person.nik})
                </strong>{' '}
                dari daftar Corporate Risk{' '}
                {deleteTarget.type === 'officer' ? 'Officer' : 'Owner'} pada unit{' '}
                <strong>{deleteTarget.dept.nama}</strong>?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Organisasi Baru */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-[#009fe3] text-white flex items-center justify-between">
              <h4 className="font-bold text-sm">Tambah Organisasi / Departemen</h4>
              <button
                type="button"
                onClick={() => setIsAddDeptModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewDepartment} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Organisasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 50000270 atau DEPT-LOG"
                  value={newDeptKode}
                  onChange={(e) => setNewDeptKode(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs focus:outline-none focus:border-[#009fe3]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Organisasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DEPARTEMEN LOGISTIK & TRANSPORTASI"
                  value={newDeptNama}
                  onChange={(e) => setNewDeptNama(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-[#009fe3]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Direktorat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Direktorat Operasi & Produksi"
                  value={newDeptDirektorat}
                  onChange={(e) => setNewDeptDirektorat(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-[#009fe3]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kepala Unit (VP / GM)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Vice President Logistik"
                  value={newDeptKepala}
                  onChange={(e) => setNewDeptKepala(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-[#009fe3]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDeptModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#009fe3] hover:bg-[#0284c7] text-white font-semibold cursor-pointer"
                >
                  Simpan Organisasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
