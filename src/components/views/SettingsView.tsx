import React, { useState, useEffect } from 'react';
import { 
  User, 
  Moon, 
  Sun, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  Cpu, 
  Key, 
  Lock, 
  RefreshCw, 
  Table, 
  AlertCircle, 
  Server, 
  HardDrive, 
  Terminal, 
  Save, 
  Users, 
  UserCheck, 
  Shield, 
  Eye, 
  EyeOff,
  UserCog,
  Sparkles
} from 'lucide-react';
import { UserRole, ThemeMode, UserProfile, UserAccount, formatUserRole } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';

interface SettingsViewProps {
  mode?: 'settings' | 'profile';
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  onLogout?: (roleToSelect?: UserRole) => void;
  onRoleChange?: (role: UserRole) => void;
  onUpdateUserProfile?: (updated: Partial<UserAccount>) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onDownloadSql: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  mode = 'settings',
  currentRole,
  currentUser,
  onLogout,
  onRoleChange,
  onUpdateUserProfile,
  theme,
  onThemeChange,
  onDownloadSql
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Active sub-section within Akun & Profil
  const [accountSubTab, setAccountSubTab] = useState<'profile' | 'password' | 'role'>('profile');

  // Edit Profil Form State
  const [namaAkun, setNamaAkun] = useState('');
  const [nikAkun, setNikAkun] = useState('');
  const [emailAkun, setEmailAkun] = useState('');
  const [jabatanAkun, setJabatanAkun] = useState('');
  const [unitKerjaAkun, setUnitKerjaAkun] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Ganti Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Role Change Success State
  const [roleChangeMsg, setRoleChangeMsg] = useState<string | null>(null);

  // MySQL State (Admin)
  const [mysqlStatus, setMysqlStatus] = useState<any>({
    isConnected: false,
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'pusri_risk_db',
    lastError: null,
    configLocation: {
      tsBackend: 'server/mysql.ts',
      envFile: '.env',
      goBackend: 'server/backend_go/main.go (baris 43)',
      schemaSql: 'server/backend_go/schema.sql'
    }
  });
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connMessage, setConnMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [activeTable, setActiveTable] = useState<'pusri_risks' | 'pengendalian_triwulan' | 'pelaksanaan_tindakan' | 'carry_over' | 'master_organisasi' | 'master_sumber_risiko' | 'master_likelihood_consequence' | 'user_accounts' | 'audit_log_risiko' | 'sync_event_modul'>('pusri_risks');
  const [tableData, setTableData] = useState<{ columns: string[]; rows: any[]; total: number; isLiveMySql?: boolean } | null>(null);
  const [loadingTable, setLoadingTable] = useState(false);

  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  // Load profile & sync with logged in user (currentUser)
  useEffect(() => {
    const fetchProfile = async () => {
      let data: UserProfile | null = null;
      try {
        data = await PusriApiClient.getUserProfile(currentUser?.role || currentRole);
      } catch (err) {
        console.warn('Failed to fetch user profile, using fallback', err);
      }

      const effectiveRole = currentUser?.role || currentRole;
      const defaultNama = currentUser?.nama || data?.nama || (effectiveRole === 'risk admin' ? 'DAFFA ARI PRASETYA' : effectiveRole === 'risk owner' ? 'M DAVI RAMADHAN' : 'FAUZAN AL GHANIYYU');
      const defaultNik = currentUser?.badge || currentUser?.nik || data?.badge || data?.nik || (effectiveRole === 'risk admin' ? '0952' : effectiveRole === 'risk owner' ? '0951' : '0953');
      const defaultEmail = currentUser?.email || data?.email || `${(currentUser?.username || defaultNama.toLowerCase().replace(/\s+/g, '.')).toLowerCase()}@pusri.co.id`;
      const defaultJabatan = currentUser?.jabatan || data?.jabatan || (effectiveRole === 'risk admin' ? 'Super Admin Enterprise Risk Management Korporat' : effectiveRole === 'risk owner' ? 'Vice President Operasi Pabrik Pusri IIB' : 'Risk Officer Unit Kerja Pabrik');
      const defaultUnit = currentUser?.unitKerja || data?.unitKerja || (effectiveRole === 'risk admin' ? 'Departemen Manajemen Risiko' : 'Departemen Operasi Pabrik Pusri IIB');
      const defaultKodeUnit = currentUser?.kodeUnitKerja || data?.kodeUnitKerja || (effectiveRole === 'risk admin' ? 'MR-CORP' : 'OP-IIB');

      // Compute avatar initials from effective name
      let avatarInitials = 'PU';
      if (defaultNama) {
        const parts = defaultNama.trim().split(' ').filter(Boolean);
        if (parts.length >= 2) avatarInitials = `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        else avatarInitials = defaultNama.slice(0, 2).toUpperCase();
      }

      const mergedProfile: UserProfile = {
        nik: defaultNik,
        badge: defaultNik,
        nama: defaultNama,
        email: defaultEmail,
        jabatan: defaultJabatan,
        unitKerja: defaultUnit,
        kodeUnitKerja: defaultKodeUnit,
        role: effectiveRole,
        avatarUrl: currentUser?.avatarUrl || data?.avatarUrl,
        avatarInitials,
        terakhirLogin: data?.terakhirLogin || 'Hari ini (Sesi Aktif)',
        hakAkses: data?.hakAkses && data.hakAkses.length > 0 ? data.hakAkses : [
          effectiveRole === 'risk admin' ? 'Hak Akses Penuh: Konfigurasi, Approval Risiko, Penetapan PIC & Carry Over' :
          effectiveRole === 'risk owner' ? 'Review & Rekomendasi/Approval Risiko Unit Kerja' :
          'Identifikasi Risiko, Usulan Mitigasi & Pelaporan Realisasi TW Unit Kerja'
        ]
      };

      setProfile(mergedProfile);
      setNamaAkun(defaultNama);
      setNikAkun(defaultNik);
      setEmailAkun(defaultEmail);
      setJabatanAkun(defaultJabatan);
      setUnitKerjaAkun(defaultUnit);
    };

    fetchProfile();
  }, [currentRole, currentUser]);

  useEffect(() => {
    if (currentRole === 'risk admin') {
      loadMysqlStatus();
      loadTableData('pusri_risks');
    }
  }, [currentRole]);

  const loadMysqlStatus = async () => {
    const status = await PusriApiClient.getMySqlConnectionStatus();
    if (status) setMysqlStatus(status);
  };

  const loadTableData = async (tbl: any) => {
    setLoadingTable(true);
    try {
      const res = await PusriApiClient.getTableData(tbl);
      if (res && res.success) {
        setTableData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleTestConnect = async () => {
    setIsTestingConn(true);
    setConnMessage(null);
    try {
      const res = await PusriApiClient.testMySqlConnection({
        host: mysqlStatus.host || 'localhost',
        port: mysqlStatus.port || 3306,
        user: mysqlStatus.user || 'root',
        database: mysqlStatus.database || 'pusri_risk_db'
      });
      if (res.data) setMysqlStatus(res.data);
      setConnMessage({
        text: res.message,
        isError: !res.success
      });
    } catch (e: any) {
      setConnMessage({
        text: e.message || 'Gagal menghubungi server.',
        isError: true
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSyncAllToMysql = async () => {
    setIsSyncingAll(true);
    setSyncResultMsg(null);
    try {
      const res = await PusriApiClient.syncAllToMySql();
      if (res && res.success) {
        setSyncResultMsg(res.message);
        loadTableData(activeTable);
        loadMysqlStatus();
      } else {
        setSyncResultMsg(res?.message || 'Gagal sinkronisasi data ke MySQL.');
      }
    } catch (e: any) {
      setSyncResultMsg(e.message || 'Gagal mengeksekusi sinkronisasi.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownloadSql();
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const copyConnectionSnippet = () => {
    const snippet = `-- Cara Import Database ke MySQL Server Lokal:
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pusri_risk_db;"
mysql -u root -p pusri_risk_db < pusri_risk_db_2026.sql`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Handle Simpan Perubahan Profil
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);

    setTimeout(() => {
      const updatedData: Partial<UserAccount> = {
        nama: namaAkun.trim() || profile?.nama,
        nik: nikAkun.trim() || profile?.nik,
        email: emailAkun.trim() || profile?.email,
        jabatan: jabatanAkun.trim() || profile?.jabatan,
        unitKerja: unitKerjaAkun.trim() || profile?.unitKerja
      };

      if (onUpdateUserProfile) {
        onUpdateUserProfile(updatedData);
      }

      if (profile) {
        setProfile({
          ...profile,
          ...updatedData,
          avatarInitials: (updatedData.nama || profile.nama)
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        } as UserProfile);
      }

      setIsSavingProfile(false);
      setProfileSuccessMsg('Profil akun dinas berhasil disimpan dan diperbarui.');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    }, 400);
  };

  // 2. Handle Ganti Password Terverifikasi Server SSO IAM
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ text: 'Masukkan kata sandi SSO saat ini untuk verifikasi kepemilikan akun.', isError: true });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'Kata sandi baru minimal harus terdiri dari 8 karakter.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Konfirmasi kata sandi baru tidak cocok.', isError: true });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await PusriApiClient.changeOwnPassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordMsg({ text: res.message || 'Kata sandi SSO berhasil diperbarui secara kriptografis.', isError: false });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ text: res.message || 'Gagal memperbarui kata sandi SSO.', isError: true });
      }
    } catch {
      setPasswordMsg({ text: 'Gagal menghubungi server IAM Pusri.', isError: true });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // 3. Handle Ganti Role (HARUS LOGIN ULANG)
  const handleSelectRole = (newRole: UserRole) => {
    if (newRole === currentRole) return;
    if (onLogout) {
      onLogout(newRole);
    }
  };

  // Mode Profile: HANYA menampilkan Ringkasan Pengguna
  if (mode === 'profile') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-2">
        {/* Top Banner */}
        <div className="p-3.5 md:p-4 rounded-xl bg-gradient-to-r from-[#009fe3] to-[#0284c7] text-white shadow-md flex items-center justify-between">
          <h2 className="text-base md:text-lg font-extrabold tracking-tight">
            Ringkasan Pengguna
          </h2>
        </div>

        {/* Ringkasan Pengguna Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#009fe3]" />
              <span>Ringkasan Pengguna</span>
            </span>
            <span className="text-xs font-mono font-semibold text-[#009fe3] dark:text-sky-400">
              Sesi SSO Terverifikasi · JWT HS256
            </span>
          </div>

          {profile && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.nama}
                    className="w-16 h-16 rounded-2xl object-cover shadow-md shrink-0 border border-sky-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#009fe3] text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0 border border-sky-300">
                    {profile.avatarInitials}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg leading-snug">
                    {profile.nama}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">
                      Badge / NIK: <span className="text-slate-800 dark:text-slate-200">{profile.nik}</span>
                    </p>
                    {currentUser?.username && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        • Username: <strong className="text-slate-700 dark:text-slate-300">@{currentUser.username}</strong>
                      </span>
                    )}
                  </div>
                  <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-950/70 text-amber-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800">
                    Peran: {formatUserRole(profile.role)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Jabatan Struktural:</span>
                  <strong className="text-slate-900 dark:text-slate-100 text-xs block">{profile.jabatan}</strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Unit Kerja / Departemen:</span>
                  <strong className="text-slate-900 dark:text-slate-100 text-xs block">{profile.unitKerja} ({profile.kodeUnitKerja})</strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Email Resmi Pusri:</span>
                  <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs block">{profile.email}</strong>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Waktu Terakhir Login:</span>
                  <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs block">{profile.terakhirLogin || 'Hari ini (Sesi Aktif)'}</strong>
                </div>
              </div>

              {profile.hakAkses && profile.hakAkses.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Wewenang & Hak Akses Sistem ERM</span>
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    {profile.hakAkses.map((hak, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{hak}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Banner */}
      <div className="p-3.5 md:p-4 rounded-xl bg-gradient-to-r from-[#009fe3] to-[#0284c7] text-white shadow-md flex items-center justify-between">
        <h2 className="text-base md:text-lg font-extrabold tracking-tight">
          Pengaturan Aplikasi & Sesi Akun
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1: PROFIL YANG SEDANG LOGIN */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#009fe3]" />
              <span>Profil yang Sedang Login</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-sky-50 dark:bg-sky-950 text-[#009fe3] border border-sky-200 dark:border-sky-800">
              Online
            </span>
          </div>

          {profile && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.nama}
                    className="w-14 h-14 rounded-2xl object-cover shadow-md shrink-0 border border-sky-300"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#009fe3] text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0 border border-sky-300">
                    {profile.avatarInitials}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                    {profile.nama}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Badge: {profile.nik}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-950/70 text-amber-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800">
                    {formatUserRole(profile.role)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold">Jabatan</span>
                  <strong className="text-slate-800 dark:text-slate-200">{profile.jabatan}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold">Unit Kerja</span>
                  <strong className="text-slate-800 dark:text-slate-200">{profile.unitKerja} ({profile.kodeUnitKerja})</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold">Email Dinas</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{profile.email}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: TEMA TAMPILAN APLIKASI (GELAP & TERANG) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Tema Gelap & Terang</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Pilih preferensi tampilan aplikasi antara Tema Terang (Light) atau Tema Gelap (Dark Mode) sesuai kenyamanan visual Anda.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onThemeChange('light')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-[#009fe3] bg-sky-50 text-[#009fe3] ring-2 ring-sky-300 dark:ring-sky-800'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Sun className="w-5 h-5 text-amber-500" />
                {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#009fe3]" />}
              </div>
              <div className="font-bold text-xs">Tema Terang</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Mode standar terang</div>
            </button>

            <button
              onClick={() => onThemeChange('dark')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-sky-400 bg-slate-800 text-sky-300 ring-2 ring-sky-500/40'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Moon className="w-5 h-5 text-sky-400" />
                {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
              </div>
              <div className="font-bold text-xs">Tema Gelap</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Mode redup gelap</div>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: KEAMANAN KATA SANDI SSO (VERIFIKASI SERVER IAM) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-[#009fe3]" />
            <span>Pembaruan Kata Sandi Single Sign-On (SSO)</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Enkripsi scrypt + Verifikasi Sesi JWT
          </span>
        </div>

        {passwordMsg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              passwordMsg.isError
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {passwordMsg.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSavePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kata Sandi SSO Saat Ini *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Kata sandi aktif"
                className="w-full h-10 pl-3.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kata Sandi SSO Baru (Min. 8 Karakter) *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono"
              required
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Konfirmasi Sandi Baru *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi sandi baru"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSavingPassword}
              className="h-10 px-4 rounded-xl bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingPassword ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 4: SINKRONISASI DATABASE MYSQL & EXPLORER TABEL (KHUSUS RISK ADMIN) */}
      {currentRole === 'risk admin' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#009fe3]" />
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Sinkronisasi Database MySQL & Penjelajah Tabel (9 Tabel Terpadu)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded font-mono font-bold border ${
                  mysqlStatus?.isConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
              >
                {mysqlStatus?.isConnected
                  ? `MySQL Live (${mysqlStatus.host}:${mysqlStatus.port})`
                  : 'Hybrid Mode (Local Store + schema.sql)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Host MySQL</label>
              <input
                type="text"
                value={mysqlStatus.host || '127.0.0.1'}
                onChange={(e) => setMysqlStatus({ ...mysqlStatus, host: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Port</label>
              <input
                type="number"
                value={mysqlStatus.port || 3306}
                onChange={(e) => setMysqlStatus({ ...mysqlStatus, port: Number(e.target.value) || 3306 })}
                className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">User</label>
              <input
                type="text"
                value={mysqlStatus.user || 'root'}
                onChange={(e) => setMysqlStatus({ ...mysqlStatus, user: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Database</label>
              <input
                type="text"
                value={mysqlStatus.database || 'pusri_risk_db'}
                onChange={(e) => setMysqlStatus({ ...mysqlStatus, database: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleTestConnect}
              disabled={isTestingConn}
              className="h-9 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isTestingConn ? 'Menguji Koneksi...' : 'Uji & Hubungkan MySQL'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllToMysql}
              disabled={isSyncingAll}
              className="h-9 px-3.5 rounded-lg bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Menyinkronkan...' : 'Sinkronkan Seluruh Database'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Menyiapkan SQL...' : 'Unduh Dump SQL (.sql)'}</span>
            </button>

            <button
              type="button"
              onClick={copyConnectionSnippet}
              className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Perintah Tersalin' : 'Salin CLI Import'}</span>
            </button>
          </div>

          {connMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                connMessage.isError
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{connMessage.text}</span>
            </div>
          )}

          {syncResultMsg && (
            <div className="p-3 rounded-xl border bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#009fe3]" />
              <span>{syncResultMsg}</span>
            </div>
          )}

          {/* Table Explorer Tabs */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-[#009fe3]" />
                <span>Inspeksi Isi Tabel Database Aktif:</span>
              </span>
              {tableData && (
                <span className="text-[11px] font-mono text-slate-500">
                  Total Baris: <strong>{tableData.total}</strong> ({tableData.isLiveMySql ? 'Live MySQL' : 'Local Synced Store'})
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'pusri_risks', label: 'pusri_risks' },
                  { id: 'pengendalian_triwulan', label: 'pengendalian_triwulan' },
                  { id: 'pelaksanaan_tindakan', label: 'pelaksanaan_tindakan' },
                  { id: 'carry_over', label: 'carry_over' },
                  { id: 'master_organisasi', label: 'master_organisasi' },
                  { id: 'master_sumber_risiko', label: 'master_sumber_risiko' },
                  { id: 'master_likelihood_consequence', label: 'master_likelihood_consequence' },
                  { id: 'user_accounts', label: 'user_accounts' },
                  { id: 'audit_log_risiko', label: 'audit_log_risiko' },
                  { id: 'sync_event_modul', label: 'sync_event_modul' }
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveTable(t.id);
                    loadTableData(t.id);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                    activeTable === t.id
                      ? 'bg-[#009fe3] text-white border-[#009fe3]'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-64">
              {loadingTable ? (
                <div className="p-6 text-center text-xs text-slate-500">Memuat data tabel {activeTable}...</div>
              ) : tableData && tableData.rows.length > 0 ? (
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                    <tr>
                      {tableData.columns.slice(0, 8).map((col) => (
                        <th key={col} className="px-3 py-2 font-mono font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tableData.rows.slice(0, 15).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {tableData.columns.slice(0, 8).map((col) => (
                          <td key={col} className="px-3 py-1.5 text-slate-700 dark:text-slate-300 max-w-[220px] truncate font-mono">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">Belum ada baris pada tabel {activeTable}.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
