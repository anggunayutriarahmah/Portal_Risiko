import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Users,
  KeyRound,
  AlertTriangle,
  Search,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  XCircle,
  Unlock,
  Ban,
  Copy,
  Check,
  X,
  Lock
} from 'lucide-react';
import {
  UserAccount,
  UserRole,
  AccountStatus,
  OrganizationMaster,
  IamSecurityEvent,
  PasswordResetTicket,
  formatUserRole
} from '../../types/pusri';
import { PusriApiClient } from '../../services/api';
import { AccessDeniedBanner } from './AccessDeniedBanner';

interface IamSsoManagementViewProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  departments: OrganizationMaster[];
  onNavigateNext?: (tab: string) => void;
}

export const IamSsoManagementView: React.FC<IamSsoManagementViewProps> = ({
  currentRole,
  currentUser,
  departments,
  onNavigateNext
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'approvals' | 'security'>('users');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [resetTickets, setResetTickets] = useState<PasswordResetTicket[]>([]);
  const [securityLogs, setSecurityLogs] = useState<IamSecurityEvent[]>([]);
  const [ssoConfig, setSsoConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});
  const [copiedCallback, setCopiedCallback] = useState(false);

  // Create Official Account Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('risk officer');
  const [newJabatan, setNewJabatan] = useState('');
  const [newUnitKerja, setNewUnitKerja] = useState(
    departments[0]?.nama || 'Departemen Manajemen Risiko Korporat'
  );
  const [newPassword, setNewPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const loadIamData = useCallback(async () => {
    if (currentRole !== 'risk admin') return;
    setLoading(true);
    try {
      const [fetchedUsers, fetchedTickets, fetchedLogs, fetchedConfig] = await Promise.all([
        PusriApiClient.getIamUsers(),
        PusriApiClient.getPasswordResetTickets(),
        PusriApiClient.getIamSecurityLogs(),
        PusriApiClient.getSsoConfig()
      ]);
      setUsers(fetchedUsers || []);
      setResetTickets(fetchedTickets || []);
      setSecurityLogs(fetchedLogs || []);
      if (fetchedConfig) setSsoConfig(fetchedConfig);
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error
          ? error.message
          : 'Gagal memuat data konsol IAM dari server. Pastikan sesi JWT Risk Admin Anda aktif.'
      });
    } finally {
      setLoading(false);
    }
  }, [currentRole]);

  useEffect(() => {
    loadIamData();
  }, [loadIamData]);

  if (currentRole !== 'risk admin') {
    return (
      <AccessDeniedBanner
        moduleName="Manajemen Akses & Single Sign-On (IAM)"
        requiredRole="risk admin"
        currentRole={currentRole}
        onBackToDashboard={() => onNavigateNext?.('dashboard')}
        onGoToIdentifikasi={() => onNavigateNext?.('identifikasi')}
      />
    );
  }

  const pendingAccounts = users.filter((u) => u.accountStatus === 'pending_approval');
  const pendingTickets = resetTickets.filter((t) => t.status === 'pending');
  const criticalEventsCount = securityLogs.filter(
    (e) =>
      e.eventType === 'IMPERSONATION_BLOCKED' ||
      e.eventType === 'LOGIN_FAILED' ||
      e.eventType === 'ACCOUNT_LOCKOUT'
  ).length;

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    const effectiveStatus = u.accountStatus || 'active';
    if (statusFilter !== 'ALL' && effectiveStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.nama.toLowerCase().includes(q) ||
        (u.badge || '').toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        u.unitKerja.toLowerCase().includes(q) ||
        (u.jabatanPengajuan || '').toLowerCase().includes(q) ||
        (u.jabatan || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateAccess = async (
    userId: string,
    updates: { role?: UserRole; accountStatus?: AccountStatus }
  ) => {
    setProcessingId(userId);
    setFeedback(null);
    try {
      const res = await PusriApiClient.updateIamUserAccess(userId, updates);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        await loadIamData();
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const generateRandomTempPassword = (ticketId: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
    const bytes = new Uint8Array(10);
    crypto.getRandomValues(bytes);
    let generated = 'Pusri-';
    for (let i = 0; i < 6; i++) {
      generated += chars[bytes[i] % chars.length];
    }
    setTempPasswords((prev) => ({ ...prev, [ticketId]: generated }));
  };

  const handleResolveTicket = async (ticketId: string, action: 'approve' | 'reject') => {
    const tempPass = (tempPasswords[ticketId] || '').trim();
    if (action === 'approve' && tempPass.length < 8) {
      setFeedback({
        type: 'error',
        text: 'Kata sandi sementara minimal 8 karakter wajib diisi sebelum menyetujui tiket reset.'
      });
      return;
    }

    setProcessingId(ticketId);
    setFeedback(null);
    try {
      const res = await PusriApiClient.resolvePasswordResetTicket(
        ticketId,
        action,
        action === 'approve' ? tempPass : undefined
      );
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        await loadIamData();
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateOfficialUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!newNama.trim() || !newBadge.trim() || !newEmail.trim() || newPassword.trim().length < 8) {
      setFeedback({
        type: 'error',
        text: 'Nama, Nomor Badge, Email Korporat, dan Kata Sandi awal (minimal 8 karakter) wajib diisi.'
      });
      return;
    }

    setIsCreatingUser(true);
    try {
      const deptObj = departments.find((d) => d.nama === newUnitKerja);
      const kodeUnit = deptObj ? deptObj.kode : 'CORP';
      const res = await PusriApiClient.createIamUserByAdmin({
        nama: newNama.trim(),
        badge: newBadge.trim(),
        username: newUsername.trim() || newBadge.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword.trim(),
        role: newRole,
        jabatan:
          newJabatan.trim() ||
          (newRole === 'risk admin'
            ? 'Administrator Manajemen Risiko Korporat'
            : newRole === 'risk owner'
              ? 'Vice President / Kepala Unit Kerja'
              : 'Risk Officer Unit Kerja'),
        unitKerja: newUnitKerja,
        kodeUnitKerja: kodeUnit
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        setNewNama('');
        setNewBadge('');
        setNewUsername('');
        setNewEmail('');
        setNewJabatan('');
        setNewPassword('');
        setFeedback({ type: 'success', text: res.message });
        await loadIamData();
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const formatStatusLabel = (status?: AccountStatus) => {
    switch (status) {
      case 'pending_approval':
        return { text: 'Menunggu Verifikasi', cls: 'text-amber-700 dark:text-amber-400' };
      case 'locked':
        return { text: 'Terkunci (Lockout)', cls: 'text-red-600 dark:text-red-400' };
      case 'suspended':
        return { text: 'Ditangguhkan', cls: 'text-slate-500 dark:text-slate-400' };
      default:
        return { text: 'Aktif Terverifikasi', cls: 'text-emerald-700 dark:text-emerald-400' };
    }
  };

  const callbackUri =
    ssoConfig?.callbackUrl || `${window.location.origin.replace(/\/+$/, '')}/auth/callback`;

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manajemen Akses &amp; Single Sign-On (IAM)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pusat kendali otorisasi peran (RBAC), persetujuan akun pegawai baru, pemulihan kata
            sandi terverifikasi, dan audit keamanan SSO PT Pupuk Sriwidjaja Palembang.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadIamData}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Akun Resmi</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Akun SSO Terdaftar</span>
            <Users className="w-4 h-4 text-[#009fe3]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {users.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {users.filter((u) => !u.accountStatus || u.accountStatus === 'active').length} aktif ·{' '}
            {users.filter((u) => u.role === 'risk admin').length} Risk Admin
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Menunggu Persetujuan IAM</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
            {pendingAccounts.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Permohonan aktivasi pegawai baru
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tiket Reset Kata Sandi</span>
            <KeyRound className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {pendingTickets.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Menunggu penerbitan sandi sementara
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Insiden &amp; Impersonasi Diblokir</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {criticalEventsCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            Dari total {securityLogs.length} catatan audit IAM
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'users'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          1. Direktori Akun &amp; Peran ({users.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('approvals')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'approvals'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          2. Antrean Verifikasi &amp; Reset Sandi ({pendingAccounts.length + pendingTickets.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'security'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          3. Konfigurasi OIDC &amp; Audit Keamanan
        </button>
      </div>

      {/* SUBTAB 1: USER DIRECTORY & RBAC AUTHORIZATION */}
      {activeSubTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nama, Nomor Badge, Email, Unit Kerja, atau Jabatan Struktural..."
                className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="ALL">Semua Peran</option>
                <option value="risk admin">Risk Admin</option>
                <option value="risk owner">Risk Owner (VP)</option>
                <option value="risk officer">Risk Officer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="active">Aktif Terverifikasi</option>
                <option value="pending_approval">Menunggu Verifikasi</option>
                <option value="locked">Terkunci</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold">Pegawai &amp; Email SSO</th>
                  <th className="py-3 px-4 font-semibold">Badge / Username</th>
                  <th className="py-3 px-4 font-semibold">Unit Kerja</th>
                  <th className="py-3 px-4 font-semibold">Jabatan Struktural</th>
                  <th className="py-3 px-4 font-semibold">Otorisasi Peran (RBAC)</th>
                  <th className="py-3 px-4 font-semibold">Status Akun</th>
                  <th className="py-3 px-4 font-semibold text-right">Tindakan IAM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUsers.map((u) => {
                  const statusMeta = formatStatusLabel(u.accountStatus);
                  const isSelf = currentUser?.id === u.id || currentUser?.badge === u.badge;
                  const structuralTitle = u.jabatanPengajuan || u.jabatan || '-';
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {u.nama}
                          {isSelf && (
                            <span className="ml-2 text-[11px] font-normal text-[#009fe3]">
                              (Sesi Anda)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {u.email || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {u.badge || u.nik || '-'} · @{u.username}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={u.unitKerja}>
                        {u.unitKerja}
                      </td>
                      <td className="py-3 px-4 max-w-[220px]">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 leading-snug" title={structuralTitle}>
                          {structuralTitle}
                        </div>
                        {u.jabatanPengajuan && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Pengajuan Aktivasi Awal
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          disabled={processingId === u.id}
                          onChange={(e) =>
                            handleUpdateAccess(u.id, { role: e.target.value as UserRole })
                          }
                          className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer disabled:opacity-50"
                        >
                          <option value="risk officer">Risk Officer</option>
                          <option value="risk owner">Risk Owner (VP)</option>
                          <option value="risk admin">Risk Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${statusMeta.cls}`}>
                          {statusMeta.text}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {u.accountStatus === 'pending_approval' && (
                            <button
                              type="button"
                              disabled={processingId === u.id}
                              onClick={() =>
                                handleUpdateAccess(u.id, { accountStatus: 'active' })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] cursor-pointer whitespace-nowrap shrink-0"
                            >
                              Setujui Akses
                            </button>
                          )}

                          {u.accountStatus === 'locked' && (
                            <button
                              type="button"
                              disabled={processingId === u.id}
                              onClick={() =>
                                handleUpdateAccess(u.id, { accountStatus: 'active' })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Buka Kunci</span>
                            </button>
                          )}

                          {(!u.accountStatus || u.accountStatus === 'active') && !isSelf && (
                            <button
                              type="button"
                              disabled={processingId === u.id}
                              onClick={() =>
                                handleUpdateAccess(u.id, { accountStatus: 'suspended' })
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Tangguhkan</span>
                            </button>
                          )}

                          {u.accountStatus === 'suspended' && (
                            <button
                              type="button"
                              disabled={processingId === u.id}
                              onClick={() =>
                                handleUpdateAccess(u.id, { accountStatus: 'active' })
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold text-[11px] cursor-pointer whitespace-nowrap shrink-0"
                            >
                              Aktifkan Kembali
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      Tidak ada akun pegawai yang sesuai dengan kriteria pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ONBOARDING APPROVAL QUEUE & VERIFIED PASSWORD RESET TICKETS */}
      {activeSubTab === 'approvals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pending Account Activations */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Antrean Aktivasi Akun Pegawai Baru
                </h3>
                <p className="text-[11px] text-slate-500">
                  Verifikasi identitas kepegawaian sebelum memberikan akses SSO
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-bold text-amber-600">
                {pendingAccounts.length} Permohonan
              </span>
            </div>

            {pendingAccounts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Tidak ada permohonan aktivasi akun baru yang menunggu persetujuan.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">
                          {acc.nama}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Badge: {acc.badge || acc.nik} · {acc.email}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                          Unit Kerja: <strong className="font-semibold">{acc.unitKerja}</strong>
                        </p>
                        <p className="text-[11px] text-sky-700 dark:text-sky-300 mt-0.5">
                          Jabatan Struktural Diajukan:{' '}
                          <strong className="font-bold">{acc.jabatanPengajuan || acc.jabatan || '-'}</strong>
                        </p>
                      </div>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold shrink-0">
                        Role Dasar: {formatUserRole(acc.role)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={processingId === acc.id}
                        onClick={() =>
                          handleUpdateAccess(acc.id, {
                            accountStatus: 'active',
                            role: 'risk officer'
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Setujui (Risk Officer)</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingId === acc.id}
                        onClick={() =>
                          handleUpdateAccess(acc.id, {
                            accountStatus: 'active',
                            role: 'risk owner'
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Setujui sbg Risk Owner (VP)
                      </button>

                      <button
                        type="button"
                        disabled={processingId === acc.id}
                        onClick={() =>
                          handleUpdateAccess(acc.id, { accountStatus: 'suspended' })
                        }
                        className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Password Reset Tickets */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Tiket Pemulihan Kata Sandi SSO
                </h3>
                <p className="text-[11px] text-slate-500">
                  Terbitkan kata sandi sementara dan serahkan melalui saluran resmi pegawai
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-bold text-[#009fe3]">
                {pendingTickets.length} Tiket Aktif
              </span>
            </div>

            {pendingTickets.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Tidak ada tiket permohonan reset kata sandi yang menunggu verifikasi.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {t.userName || t.identifier} {t.badge ? `(Badge ${t.badge})` : ''}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          {new Date(t.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Email Terverifikasi: {t.email}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Alasan: {t.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempPasswords[t.id] || ''}
                        onChange={(e) =>
                          setTempPasswords((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        placeholder="Kata sandi sementara (min. 8 karakter)"
                        className="flex-1 h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => generateRandomTempPassword(t.id)}
                        className="px-2.5 h-9 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Buat Otomatis
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={processingId === t.id}
                        onClick={() => handleResolveTicket(t.id, 'approve')}
                        className="px-3 py-1.5 rounded-lg bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Terapkan Sandi Sementara
                      </button>
                      <button
                        type="button"
                        disabled={processingId === t.id}
                        onClick={() => handleResolveTicket(t.id, 'reject')}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Tolak Tiket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: OIDC CONFIGURATION & SECURITY AUDIT LOGS */}
      {activeSubTab === 'security' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Parameter Protokol Single Sign-On &amp; Federasi OIDC
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 block">Identity Provider Utama</span>
                <strong className="text-slate-900 dark:text-white block">
                  {ssoConfig?.providerName || 'Pusri Corporate Identity Provider (IAM OIDC)'}
                </strong>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 block">Standar Kriptografi &amp; Token</span>
                <strong className="text-slate-900 dark:text-white font-mono block">
                  {ssoConfig?.protocol || 'OpenID Connect 1.0 (PKCE S256) + JWT HS256'}
                </strong>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 block">Kebijakan Brute-Force &amp; Sesi</span>
                <strong className="text-slate-900 dark:text-white font-mono tabular-nums block">
                  Maks. 5 Percobaan · Lockout 15 Menit · TTL 8 Jam
                </strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-500 block">
                  Authorized Redirect / Callback URI (Microsoft Entra ID / Google Workspace / Okta):
                </span>
                <code className="font-mono text-slate-900 dark:text-sky-300 break-all">
                  {callbackUri}
                </code>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(callbackUri);
                  setCopiedCallback(true);
                  setTimeout(() => setCopiedCallback(false), 2000);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedCallback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Callback URI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Security Audit Events Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Jejak Audit Keamanan SSO &amp; Deteksi Impersonasi
              </h3>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {securityLogs.length} peristiwa tercatat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4 font-semibold">Waktu (WIB)</th>
                    <th className="py-3 px-4 font-semibold">Jenis Peristiwa</th>
                    <th className="py-3 px-4 font-semibold">Tingkat</th>
                    <th className="py-3 px-4 font-semibold">Identitas / Aktor</th>
                    <th className="py-3 px-4 font-semibold">Rincian Audit Keamanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {securityLogs.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {ev.eventType}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            ev.severity === 'CRITICAL'
                              ? 'text-red-600 dark:text-red-400'
                              : ev.severity === 'WARNING'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {ev.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {ev.actorName ? `${ev.actorName} (${ev.actorIdentifier})` : ev.actorIdentifier}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                        {ev.details}
                      </td>
                    </tr>
                  ))}
                  {securityLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Belum ada log peristiwa keamanan tercatat pada sesi ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Provision Official Corporate Account (Admin Only) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[#009fe3]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Registrasi Akun Resmi oleh Risk Admin IAM
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOfficialUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Pegawai *
                  </label>
                  <input
                    type="text"
                    value={newNama}
                    onChange={(e) => setNewNama(e.target.value)}
                    placeholder="Nama lengkap resmi"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Badge / NIK *
                  </label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="Contoh: 0960"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono tabular-nums"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Dinas Korporat *
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="nama@pusri.co.id"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username SSO
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Opsional (default: badge)"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Otorisasi Peran (RBAC) *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
                  >
                    <option value="risk officer">Risk Officer (Unit Kerja)</option>
                    <option value="risk owner">Risk Owner (VP / Kepala Unit)</option>
                    <option value="risk admin">Risk Admin (Korporat)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Kerja / Departemen *
                  </label>
                  <select
                    value={newUnitKerja}
                    onChange={(e) => setNewUnitKerja(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.kode} value={d.nama}>
                        {d.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan Struktural
                  </label>
                  <input
                    type="text"
                    value={newJabatan}
                    onChange={(e) => setNewJabatan(e.target.value)}
                    placeholder="Contoh: VP Operasi Pabrik"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kata Sandi Awal SSO (Min. 8 Karakter) *
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-4 py-2.5 rounded-xl bg-[#009fe3] hover:bg-[#0284c7] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isCreatingUser ? 'Menyimpan...' : 'Aktifkan Akun Resmi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
