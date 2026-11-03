import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  Globe,
  FileKey2,
  UserCheck
} from 'lucide-react';
import { UserAccount, UserRole, OrganizationMaster, formatUserRole } from '../types/pusri';
import { PusriApiClient } from '../services/api';
import { PusriLogo } from './PusriLogo';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
  departments: OrganizationMaster[];
  initialRole?: UserRole;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  departments,
  initialRole
}) => {
  const [mode, setMode] = useState<'sso' | 'onboarding'>('sso');

  // SSO Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFederationLoading, setIsFederationLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Server SSO Config Metadata
  const [ssoConfig, setSsoConfig] = useState<{
    providerName: string;
    protocol: string;
    externalOidcConfigured: boolean;
    allowedDomains: string[];
    callbackUrl: string;
  } | null>(null);

  // Employee Onboarding Access Request State (Hard-locked to 'risk officer' + Admin Approval)
  const [regNama, setRegNama] = useState('');
  const [regBadge, setRegBadge] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regJabatan, setRegJabatan] = useState('');
  const [regUnitKerja, setRegUnitKerja] = useState(
    departments[0]?.nama || 'Departemen Operasi Pabrik Pusri IIB'
  );
  const [regCustomUnit, setRegCustomUnit] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Verified Password Reset Ticket Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    PusriApiClient.getSsoConfig().then((cfg) => {
      if (mounted && cfg) {
        setSsoConfig(cfg);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Listen for OAuth 2.0 / OIDC Federation popup callback messages
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin || '';
      if (
        origin &&
        !origin.endsWith('.run.app') &&
        !origin.includes('localhost') &&
        origin !== window.location.origin
      ) {
        return;
      }

      const payload = event.data;
      if (!payload || typeof payload !== 'object') return;

      if (payload.type === 'OAUTH_AUTH_SUCCESS' && payload.token && payload.user) {
        setIsFederationLoading(false);
        setErrorMsg(null);
        PusriApiClient.setSsoToken(payload.token, false);
        onLoginSuccess(payload.user);
      } else if (payload.type === 'OAUTH_AUTH_PENDING') {
        setIsFederationLoading(false);
        setErrorMsg(null);
        setSuccessNotice(
          payload.message ||
            'Identitas SSO terverifikasi dan sedang menunggu otorisasi Risk Admin IAM.'
        );
      } else if (payload.type === 'OAUTH_AUTH_ERROR') {
        setIsFederationLoading(false);
        setErrorMsg(payload.message || 'Autentikasi SSO Eksternal dibatalkan atau gagal.');
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onLoginSuccess]);

  // Primary Pusri Corporate SSO Login (OIDC Authorization Code + PKCE S256 -> Signed JWT)
  const handleSsoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMsg('Masukkan Email Korporat (@pusri.co.id) atau Nomor Badge Pegawai.');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Kata Sandi SSO wajib diisi untuk autentikasi kriptografi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await PusriApiClient.loginWithPusriSso(cleanId, cleanPass, false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        return;
      }
      setErrorMsg(
        res.message ||
          'Autentikasi Single Sign-On ditolak. Pastikan kredensial terdaftar dan akun berstatus aktif.'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal terhubung ke Identity Provider SSO Pusri.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // External OIDC Federation (Microsoft Entra ID / Google Workspace / Okta)
  const handleExternalFederationLogin = async () => {
    setErrorMsg(null);
    setSuccessNotice(null);
    setIsFederationLoading(true);

    try {
      const res = await PusriApiClient.getExternalOauthUrl();
      if (!res.success || !res.url) {
        setIsFederationLoading(false);
        setErrorMsg(
          res.message ||
            'Federasi IdP Eksternal belum dikonfigurasi pada environment server. Silakan masuk menggunakan Pusri Corporate SSO (OIDC PKCE) pada formulir utama.'
        );
        return;
      }

      window.location.assign(res.url);
    } catch {
      setIsFederationLoading(false);
      setErrorMsg('Gagal menginisialisasi sesi Federasi OIDC Eksternal.');
    }
  };

  // Employee Onboarding Access Request (Strictly locked to 'risk officer' + pending_approval)
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    const finalNama = regNama.trim();
    const finalBadge = regBadge.trim();
    const finalUsername =
      regUsername.trim() || finalBadge || finalNama.toLowerCase().replace(/[^a-z0-9]/g, '.');
    const finalEmail = regEmail.trim().toLowerCase();
    const finalUnit = regCustomUnit.trim() || regUnitKerja;
    const finalPassword = regPassword.trim();
    const finalConfirm = regConfirmPassword.trim();

    const finalJabatan = regJabatan.trim();

    if (!finalNama || !finalBadge || !finalEmail) {
      setErrorMsg('Nama lengkap, Nomor Badge, dan Email Korporat wajib diisi.');
      return;
    }
    if (!finalJabatan) {
      setErrorMsg('Jabatan Struktural yang diajukan wajib diisi sesuai posisi pada Unit Kerja.');
      return;
    }
    if (!finalEmail.includes('@')) {
      setErrorMsg('Masukkan alamat email korporat yang valid (contoh: nama@pusri.co.id).');
      return;
    }
    if (finalPassword.length < 8) {
      setErrorMsg('Kata sandi SSO minimal harus terdiri dari 8 karakter.');
      return;
    }
    if (finalPassword !== finalConfirm) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const deptObj = departments.find((d) => d.nama === finalUnit);
      const code = deptObj ? deptObj.kode : 'UNIT-' + finalBadge.toUpperCase().slice(0, 4);

      const res = await PusriApiClient.requestEmployeeAccess({
        nama: finalNama,
        badge: finalBadge,
        nik: finalBadge,
        username: finalUsername,
        email: finalEmail,
        jabatan: finalJabatan,
        jabatanPengajuan: finalJabatan,
        unitKerja: finalUnit,
        kodeUnitKerja: code,
        password: finalPassword
      });

      if (res.success) {
        setRegNama('');
        setRegBadge('');
        setRegUsername('');
        setRegEmail('');
        setRegJabatan('');
        setRegPassword('');
        setRegConfirmPassword('');
        setIdentifier(finalEmail || finalBadge);
        setPassword('');
        setMode('sso');
        setSuccessNotice(
          res.message ||
            'Permohonan aktivasi akun telah dikirim ke antrean IAM. Akun Anda baru dapat digunakan setelah diverifikasi dan disetujui oleh Risk Admin Korporat.'
        );
      } else {
        setErrorMsg(res.message || 'Gagal mengajukan permohonan aktivasi akun.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat menghubungi server IAM.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Verified Password Reset Ticket (Admin IAM Verification Required)
  const handleResetTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg(null);

    if (!resetIdentifier.trim() || !resetEmail.trim()) {
      setResetErrorMsg('Nomor Badge dan Email Korporat terdaftar wajib diisi untuk verifikasi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await PusriApiClient.requestPasswordResetTicket(
        resetIdentifier.trim(),
        resetEmail.trim(),
        resetReason.trim() || 'Permohonan pemulihan akses SSO melalui Portal Login'
      );
      if (res.success) {
        setIsResetModalOpen(false);
        setSuccessNotice(
          res.message ||
            'Tiket pemulihan kata sandi berhasil tercatat di IAM. Risk Admin akan memverifikasi identitas Anda sebelum menerbitkan kata sandi sementara.'
        );
        setResetReason('');
      } else {
        setResetErrorMsg(res.message || 'Verifikasi identitas gagal.');
      }
    } catch (err: any) {
      setResetErrorMsg(err?.message || 'Gagal mengirim tiket pemulihan kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg overflow-hidden items-stretch">
        {/* Left Column: Foto Kantor Pusat PT Pupuk Sriwidjaja Palembang */}
        <div className="lg:col-span-5 relative bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center min-h-[280px] lg:min-h-[580px]">
          <img
            src="/image_d3b68e3c.png"
            alt="Kantor Pusat PT Pupuk Sriwidjaja Palembang"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-6 text-white">
            <div className="flex items-center gap-3">
              <PusriLogo className="h-10 w-10 p-1 rounded-xl shrink-0" withBg={true} />
              <div>
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white drop-shadow-xs">
                  Sistem Manajemen Risiko
                </h1>
                <p className="text-xs text-sky-200 font-medium drop-shadow-xs">
                  PT Pupuk Sriwidjaja Palembang
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Corporate SSO Login & Onboarding Request */}
        <div className="lg:col-span-7 p-7 sm:p-9 flex flex-col justify-center">
          {/* Optional Notice if User Requested Role Switch */}
          {initialRole && (
            <div className="mb-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
              <span>
                Silakan masuk menggunakan kredensial resmi untuk mengakses otoritas{' '}
                <strong>{formatUserRole(initialRole)}</strong>.
              </span>
            </div>
          )}

          {/* Segmented Mode Control */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('sso');
                setErrorMsg(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                mode === 'sso'
                  ? 'bg-[#009fe3] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Single Sign-On (SSO)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('onboarding');
                setErrorMsg(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                mode === 'onboarding'
                  ? 'bg-[#009fe3] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Permohonan Aktivasi Akun</span>
            </button>
          </div>

          {/* Feedback Banners */}
          {successNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: CORPORATE SSO LOGIN */}
          {mode === 'sso' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Masuk dengan Akun Korporat Pusri
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Gunakan Email Dinas terdaftar (<span className="font-mono">@pusri.co.id</span>)
                  atau Nomor Badge resmi pegawai Anda.
                </p>
              </div>

              <form onSubmit={handleSsoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    Email Korporat atau Nomor Badge
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="nama.pegawai@pusri.co.id atau Nomor Badge"
                      autoComplete="username"
                      className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3] focus:ring-1 focus:ring-[#009fe3] transition-colors font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Kata Sandi SSO
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetIdentifier(identifier.includes('@') ? '' : identifier);
                        setResetEmail(identifier.includes('@') ? identifier : '');
                        setResetErrorMsg(null);
                        setIsResetModalOpen(true);
                      }}
                      className="text-xs font-semibold text-[#009fe3] hover:text-[#0284c7] dark:text-sky-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Lupa Kata Sandi SSO?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="sso-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi SSO Anda"
                      autoComplete="current-password"
                      className="w-full h-11 pl-10 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3] focus:ring-1 focus:ring-[#009fe3] transition-colors font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !identifier.trim() || !password.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Memverifikasi Handshake OIDC PKCE...'
                      : 'Masuk dengan Single Sign-On (SSO)'}
                  </span>
                </button>
              </form>

              {/* Divider for External OIDC Federation */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 font-medium">
                    atau Federasi Identity Provider Eksternal
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExternalFederationLogin}
                disabled={isFederationLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Globe className="w-4 h-4 text-[#009fe3]" />
                <span>
                  {isFederationLoading
                    ? 'Menghubungkan ke Identity Provider...'
                    : 'Login Federasi OIDC (Microsoft Entra ID / Workspace)'}
                </span>
              </button>
            </div>
          )}

          {/* TAB 2: EMPLOYEE ONBOARDING ACCESS REQUEST (NO SELF-ASSIGNED ADMIN ROLE) */}
          {mode === 'onboarding' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Permohonan Aktivasi Akun Pegawai
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Formulir ini hanya mengajukan hak akses dasar <strong>Risk Officer</strong>. Untuk
                  keamanan korporat, pengangkatan peran <strong>Risk Owner (VP)</strong> atau{' '}
                  <strong>Risk Admin</strong> hanya dapat ditetapkan oleh Administrator IAM.
                </p>
              </div>

              <form onSubmit={handleOnboardingSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap Pegawai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regNama}
                      onChange={(e) => setRegNama(e.target.value)}
                      placeholder="Sesuai SK Kepegawaian"
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Badge / NIK Resmi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regBadge}
                      onChange={(e) => setRegBadge(e.target.value)}
                      placeholder="Contoh: 0984"
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3] font-mono tabular-nums"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Dinas Korporat <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nama.pegawai@pusri.co.id"
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Username SSO (Opsional)
                    </label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) =>
                        setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))
                      }
                      placeholder="nama.pegawai"
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Unit Kerja / Departemen <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={regUnitKerja}
                      onChange={(e) => {
                        setRegUnitKerja(e.target.value);
                        if (e.target.value !== 'LAINNYA') setRegCustomUnit('');
                      }}
                      className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3] cursor-pointer"
                    >
                      {departments.map((d) => (
                        <option key={d.kode} value={d.nama}>
                          {d.nama}
                        </option>
                      ))}
                      <option value="LAINNYA">+ Unit Kerja Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jabatan Struktural yang Diajukan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regJabatan}
                      onChange={(e) => setRegJabatan(e.target.value)}
                      placeholder="Contoh: Staf Operasi Pabrik / Superintendent"
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3]"
                      required
                    />
                  </div>
                </div>

                {regUnitKerja === 'LAINNYA' && (
                  <div>
                    <input
                      type="text"
                      value={regCustomUnit}
                      onChange={(e) => setRegCustomUnit(e.target.value)}
                      placeholder="Tuliskan nama lengkap Unit Kerja / Departemen"
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3]"
                      required
                    />
                  </div>
                )}

                {/* Locked Role Governance Box */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Building2 className="w-4 h-4 text-[#009fe3] shrink-0" />
                    <span>
                      Otoritas Awal: <strong>Risk Officer</strong> · Status:{' '}
                      <span className="text-amber-700 dark:text-amber-400 font-semibold">
                        Menunggu Verifikasi IAM
                      </span>
                    </span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kata Sandi SSO (Min. 8 Karakter) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className="w-full h-10 pl-3.5 pr-9 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3] font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#009fe3] font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Mengirim Permohonan ke Server IAM...'
                      : 'Ajukan Aktivasi Akun ke Risk Admin IAM'}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Verified Password Recovery Ticket (No Unauthenticated Direct Overwrite) */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-[#009fe3]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Tiket Pemulihan Kata Sandi SSO
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Verifikasi identitas melalui Administrator IAM Pusri
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetErrorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{resetErrorMsg}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Demi mencegah pengambilalihan akun secara sepihak, perubahan kata sandi tanpa login
              wajib mencocokkan Nomor Badge dan Email Korporat terdaftar, lalu disetujui oleh{' '}
              <strong>Risk Admin IAM</strong>.
            </p>

            <form onSubmit={handleResetTicketSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Badge / Username Terdaftar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="Masukkan Nomor Badge resmi Anda"
                  className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Korporat Terdaftar <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="nama.pegawai@pusri.co.id"
                  className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Alasan Permohonan
                </label>
                <input
                  type="text"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Contoh: Pergantian perangkat dinas / lupa sandi"
                  className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
                />
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {isSubmitting ? 'Mengirim Tiket...' : 'Kirim Tiket Verifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
