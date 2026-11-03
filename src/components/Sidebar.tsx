import React, { useRef, useState } from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  CloudDownload,
  ChevronDown, 
  ChevronRight, 
  Building2,
  Sliders,
  Lock,
  ShieldCheck,
  User,
  Settings,
  LogOut,
  BookOpen,
  Database,
  Camera,
  Trash2
} from 'lucide-react';
import { UserRole, UserAccount } from '../types/pusri';

interface SidebarProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  activeTab: string;
  onSelectMenu: (menuId: string) => void;
  counts: {
    total: number;
    vpReview: number;
    adminApproval: number;
    carryOver: number;
  };
  onDownloadManual: () => void;
  onOpenSop: () => void;
  onNavigateProfile?: () => void;
  onNavigateSettings?: () => void;
  onUploadAvatar?: (file: File) => Promise<void>;
  onRemoveAvatar?: () => Promise<void>;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  currentUser,
  activeTab,
  onSelectMenu,
  onDownloadManual,
  onOpenSop,
  onNavigateProfile,
  onNavigateSettings,
  onUploadAvatar,
  onRemoveAvatar,
  onLogout
}) => {
  const [risikoOpen, setRisikoOpen] = useState(true);
  const [masterOpen, setMasterOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'corporate' | 'aplikasi'>('corporate');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Strict RBAC checks: Risk Officer cannot access Risk Owner / Admin; Risk Owner cannot access Admin
  const canAccessVp = currentRole === 'risk owner' || currentRole === 'risk admin';
  const canAccessAdmin = currentRole === 'risk admin';

  // Derive user profile details dynamically with realistic Pusri defaults
  const displayBadge =
    currentUser?.badge ||
    (currentRole === 'risk admin'
      ? '150706'
      : currentRole === 'risk owner'
        ? '0951'
        : '0953');

  const displayName =
    currentUser?.nama ||
    (currentRole === 'risk admin'
      ? 'Daffa Ari Prasetya'
      : currentRole === 'risk owner'
        ? 'M Davi Ramadhan'
        : 'Fauzan Al Ghaniyyu');

  const displayUnitKerja = (
    currentUser?.unitKerja ||
    (currentRole === 'risk admin'
      ? 'DEP. MITRA BISNIS & LAYANAN TI PSP'
      : 'DEP. MANAJEMEN RISIKO & KEPATUHAN PSP')
  ).toUpperCase();

  const roleLines =
    currentRole === 'risk admin'
      ? [
          'CORPORATE RISK ADMIN',
          'CORPORATE RISK OFFICER',
          'SUPERADMIN PORTAL RISIKO'
        ]
      : currentRole === 'risk owner'
        ? [
            'RISK OWNER (VP UNIT KERJA)',
            'VERIFIKATOR & APPROVAL RISIKO'
          ]
        : [
            'CORPORATE RISK OFFICER',
            'RISK OFFICER UNIT KERJA'
          ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto transition-colors">
      <div>
        {/* Top User Profile Card (Matching Corporate Portal Design) */}
        <div className="px-4 pt-4 pb-3">
          {/* Avatar + Selamat datang Row */}
          <div className="flex items-center gap-3 relative">
            <button
              type="button"
              onClick={() => setAvatarMenuOpen((open) => !open)}
              disabled={!onUploadAvatar || isUploadingAvatar}
              className="group relative w-15 h-15 rounded-full border-2 border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800 shadow-2xs shrink-0 overflow-hidden flex items-center justify-center cursor-pointer disabled:cursor-wait"
              title="Klik untuk mengatur foto profil"
              aria-label="Opsi foto profil"
              aria-expanded={avatarMenuOpen}
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                /* Employee Portrait Illustration in Khaki/Beige Uniform Shirt */
                <svg viewBox="0 0 80 80" className="w-full h-full rounded-full bg-[#f8f9fa]">
                  {/* Background circle */}
                  <circle cx="40" cy="40" r="40" fill="#f4f5f7" />
                  {/* Uniform Shoulders / Shirt (Khaki/Beige) */}
                  <path
                    d="M14 78 C16 58, 28 53, 40 53 C52 53, 64 58, 66 78 Z"
                    fill="#dcd3c6"
                  />
                  {/* Shirt Collar & Placket Details */}
                  <path d="M31 53 L40 64 L49 53" fill="#cfc4b4" />
                  <path d="M22 65 L34 65" stroke="#8c7f70" strokeWidth="1.5" />
                  <path d="M46 65 L58 65" stroke="#8c7f70" strokeWidth="1.5" />
                  <line x1="40" y1="64" x2="40" y2="78" stroke="#c2b6a6" strokeWidth="1.2" />
                  {/* Neck */}
                  <rect x="35" y="44" width="10" height="11" rx="3" fill="#e5b899" />
                  {/* Ears */}
                  <circle cx="27.5" cy="34" r="3" fill="#dca988" />
                  <circle cx="52.5" cy="34" r="3" fill="#dca988" />
                  {/* Head / Face */}
                  <ellipse cx="40" cy="33" rx="12" ry="14.5" fill="#ecc1a1" />
                  {/* Hair */}
                  <path
                    d="M27.5 31 C26.5 21, 32 16, 40 16 C48 16, 53.5 21, 52.5 31 C51 24, 46 21.5, 40 21.5 C34 21.5, 29 24, 27.5 31 Z"
                    fill="#1f1a17"
                  />
                  {/* Eyebrows */}
                  <path d="M33 29.5 Q35.5 28.5 38 29.5" stroke="#2c221e" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                  <path d="M42 29.5 Q44.5 28.5 47 29.5" stroke="#2c221e" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                  {/* Eyes */}
                  <circle cx="35.5" cy="32.5" r="1.4" fill="#1f1a17" />
                  <circle cx="44.5" cy="32.5" r="1.4" fill="#1f1a17" />
                  {/* Nose */}
                  <path d="M40 33 L39.2 37.2 L41 37.5" stroke="#c99576" strokeWidth="1.1" fill="none" strokeLinecap="round" />
                  {/* Smile */}
                  <path d="M36.5 40.5 Q40 42.5 43.5 40.5" stroke="#a66b56" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                </svg>
              )}
              {onUploadAvatar && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/55 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploadingAvatar
                    ? <span className="text-[9px] font-bold">...</span>
                    : <Camera className="w-4 h-4" />}
                </span>
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={async (event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                if (!file || !onUploadAvatar) return;
                setAvatarMenuOpen(false);
                setAvatarError(null);
                setIsUploadingAvatar(true);
                try {
                  await onUploadAvatar(file);
                } catch (error) {
                  setAvatarError(error instanceof Error ? error.message : 'Gagal mengunggah foto profil.');
                } finally {
                  setIsUploadingAvatar(false);
                }
              }}
            />
            {avatarMenuOpen && (
              <div className="absolute left-0 top-[4.25rem] z-40 w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 text-xs shadow-lg">
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5 text-[#009fe3]" />
                  <span>{currentUser?.avatarUrl ? 'Ganti Foto Profil' : 'Unggah Foto Profil'}</span>
                </button>
                {currentUser?.avatarUrl && onRemoveAvatar && (
                  <button
                    type="button"
                    disabled={isRemovingAvatar}
                    onClick={async () => {
                      setAvatarError(null);
                      setIsRemovingAvatar(true);
                      try {
                        await onRemoveAvatar();
                        setAvatarMenuOpen(false);
                      } catch (error) {
                        setAvatarError(error instanceof Error ? error.message : 'Gagal menghapus foto profil.');
                      } finally {
                        setIsRemovingAvatar(false);
                      }
                    }}
                    className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRemovingAvatar ? 'Menghapus foto...' : 'Hapus Foto Profil'}</span>
                  </button>
                )}
              </div>
            )}

            <div className="min-w-0">
              <div className="text-[12.5px] text-slate-600 dark:text-slate-400 leading-snug">
                Selamat datang
              </div>
              {avatarError && (
                <p role="alert" className="mt-1 text-[10px] text-rose-600 dark:text-rose-400">
                  {avatarError}
                </p>
              )}
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="inline-flex items-center gap-1 text-[13px] font-bold text-slate-800 dark:text-slate-100 hover:text-[#009fe3] dark:hover:text-sky-400 transition-colors cursor-pointer mt-0.5"
                title="Klik untuk menu profil pengguna"
              >
                <span>({displayBadge})</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400">▾</span>
              </button>
            </div>

            {/* Quick Profile Dropdown when clicking ({badge}) ▾ */}
            {profileMenuOpen && (
              <div className="absolute left-16 top-12 z-30 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 text-xs">
                {onNavigateProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onNavigateProfile();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-[#009fe3] cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Ringkasan Profil</span>
                  </button>
                )}
                {currentUser?.avatarUrl && onRemoveAvatar && (
                  <button
                    type="button"
                    disabled={isRemovingAvatar}
                    onClick={async () => {
                      setAvatarError(null);
                      setIsRemovingAvatar(true);
                      try {
                        await onRemoveAvatar();
                        setProfileMenuOpen(false);
                      } catch (error) {
                        setAvatarError(error instanceof Error ? error.message : 'Gagal menghapus foto profil.');
                      } finally {
                        setIsRemovingAvatar(false);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRemovingAvatar ? 'Menghapus foto...' : 'Hapus Foto Profil'}</span>
                  </button>
                )}
                {onNavigateSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onNavigateSettings();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-[#009fe3] cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Pengaturan</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer border-t border-slate-100 dark:border-slate-700/60 mt-0.5 pt-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar (Logout)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Name & Department */}
          <div className="mt-2.5 space-y-0.5">
            <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-snug">
              {displayName}
            </div>
            <div className="text-[12px] text-slate-700 dark:text-slate-300 uppercase leading-snug tracking-tight">
              {displayUnitKerja}
            </div>
          </div>

          {/* Role Details Block */}
          <div className="mt-3 text-[12px] text-slate-700 dark:text-slate-300 leading-[1.45]">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-100">Role:</span>{' '}
              {roleLines[0]}
            </div>
            {roleLines.slice(1).map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>

          {/* Download Panduan Button */}
          <div className="mt-3">
            <button
              type="button"
              onClick={onDownloadManual}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-[#009fe3] text-[#009fe3] dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded text-[12.5px] font-medium transition-colors cursor-pointer shadow-2xs"
              title="Unduh Buku Panduan Penggunaan Portal Risiko (PDF)"
            >
              <CloudDownload className="w-4 h-4 shrink-0" />
              <span>Download Panduan</span>
            </button>
          </div>
        </div>

        {/* Folder-style Navigation Tabs: Menu Corporate | Aplikasi */}
        <div className="px-2 pt-1 border-b border-slate-200 dark:border-slate-800 flex items-end gap-1">
          <button
            type="button"
            onClick={() => setSidebarTab('corporate')}
            className={`px-3.5 py-2 text-[12.5px] font-bold rounded-t-md transition-colors cursor-pointer ${
              sidebarTab === 'corporate'
                ? 'bg-white dark:bg-slate-900 text-[#005c99] dark:text-sky-400 border-t border-l border-r border-slate-200 dark:border-slate-800 -mb-px'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Menu Corporate
          </button>
          <button
            type="button"
            onClick={() => setSidebarTab('aplikasi')}
            className={`px-3.5 py-2 text-[12.5px] font-bold rounded-t-md transition-colors cursor-pointer ${
              sidebarTab === 'aplikasi'
                ? 'bg-white dark:bg-slate-900 text-[#005c99] dark:text-sky-400 border-t border-l border-r border-slate-200 dark:border-slate-800 -mb-px'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Aplikasi
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-3.5 space-y-3">
          {sidebarTab === 'corporate' ? (
            /* Navigation Items */
            <nav className="space-y-1">
              {/* Dashboard */}
              <button
                onClick={() => onSelectMenu('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#009fe3] text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              {/* RISIKO Group */}
              <div>
                <button
                  onClick={() => setRisikoOpen(!risikoOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-[#009fe3]">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">RISIKO</span>
                  </div>
                  {risikoOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {risikoOpen && (
                  <div className="pl-3 space-y-0.5 mt-0.5">
                    {/* 1. Identifikasi Risiko */}
                    <button
                      onClick={() => onSelectMenu('identifikasi')}
                      className={`w-full flex items-center px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                        activeTab === 'identifikasi'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 font-semibold border-l-2 border-[#009fe3]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">Identifikasi Risiko</span>
                    </button>

                    {/* 2. Review Risk Owner / VP */}
                    <button
                      onClick={() => canAccessVp && onSelectMenu('review-vp')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors ${
                        canAccessVp ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                      } ${
                        activeTab === 'review-vp'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-semibold border-l-2 border-amber-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      title={!canAccessVp ? 'Khusus Risk Owner (VP)' : undefined}
                    >
                      <span className="truncate">Review Risk Owner (VP)</span>
                      {!canAccessVp && <Lock className="w-3 h-3 text-amber-500/80 shrink-0" />}
                    </button>

                    {/* 3. Approval Risiko (Admin) */}
                    <button
                      type="button"
                      onClick={() => canAccessAdmin && onSelectMenu('approval-admin')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors ${
                        canAccessAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                      } ${
                        activeTab === 'approval-admin'
                          ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-300 font-semibold border-l-2 border-[#009fe3]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      title={!canAccessAdmin ? 'Khusus Risk Admin' : undefined}
                    >
                      <span className="truncate">Approval Risiko (Admin)</span>
                      {!canAccessAdmin && <Lock className="w-3 h-3 text-sky-600/80 shrink-0" />}
                    </button>

                    {/* 4. Pengendalian & Evaluasi Triwulanan (TW 1 - 4 & Evaluasi Selesai / Carry Over) */}
                    <button
                      type="button"
                      onClick={() => onSelectMenu('pengendalian-tw')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                        activeTab === 'pengendalian-tw' || activeTab === 'evaluasi-carryover'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 font-semibold border-l-2 border-[#009fe3]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      title={
                        currentRole === 'risk officer'
                          ? 'Pengendalian Triwulan (Khusus risiko yang diassign ke departemen Anda)'
                          : 'Pengendalian & Evaluasi Triwulanan (TW 1 - TW 4, Status Selesai, dan Carry Over)'
                      }
                    >
                      <span className="truncate">Pengendalian &amp; Evaluasi TW</span>
                      {currentRole === 'risk officer' && (
                        <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1 py-0.2 rounded font-mono font-bold" title="Hanya risiko unit Anda">
                          Unit Anda
                        </span>
                      )}
                      {currentRole === 'risk owner' && (
                        <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1 py-0.2 rounded font-mono font-bold">
                          Owner
                        </span>
                      )}
                      {currentRole === 'risk admin' && (
                        <span className="text-[9px] bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-1 py-0.2 rounded font-mono font-bold">
                          Admin
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Master Data & Matriks hanya tersedia untuk Risk Admin */}
              {canAccessAdmin && (
              <div>
                <button
                  type="button"
                  onClick={() => setMasterOpen(!masterOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Sliders className="w-4 h-4" />
                    <span className="text-slate-800 dark:text-slate-200">Master Data &amp; Matriks</span>
                  </div>
                  {masterOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {masterOpen && (
                  <div className="pl-3 space-y-0.5 mt-0.5">
                    <button
                      type="button"
                      onClick={() => canAccessAdmin && onSelectMenu('master-sumber-risiko')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                        activeTab === 'master-sumber-risiko'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      title="Kelola Master Data Sumber Risiko"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Database className="w-3.5 h-3.5 shrink-0 text-[#009fe3]" />
                        <span className="truncate">Master Sumber Risiko</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => canAccessAdmin && onSelectMenu('master-organisasi')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                        activeTab === 'master-organisasi'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      title="Kelola Master Organisasi & Departemen"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Daftar Departemen</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => canAccessAdmin && onSelectMenu('master-matriks')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                        activeTab === 'master-matriks'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      title="Kelola Master Likelihood & Consequence"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Sliders className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Master Likelihood &amp; Consequence</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => canAccessAdmin && onSelectMenu('iam-sso')}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                        activeTab === 'iam-sso'
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      title="Manajemen Akses Akun, RBAC & Single Sign-On"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#009fe3]" />
                        <span className="truncate">Manajemen Akses &amp; SSO</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
              )}
            </nav>
          ) : (
            /* Tab Aplikasi: Utilitas & Panduan Aplikasi */
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectMenu('profile')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#009fe3] text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Ringkasan Profil</span>
              </button>

              <button
                type="button"
                onClick={onOpenSop}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#009fe3]" />
                <span>Alur SOP 7 Tahap</span>
              </button>

              <button
                type="button"
                onClick={onDownloadManual}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <CloudDownload className="w-4 h-4 text-[#009fe3]" />
                <span>Download Panduan (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMenu('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#009fe3] text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan Aplikasi</span>
              </button>
            </nav>
          )}
        </div>
      </div>

    </aside>
  );
};
