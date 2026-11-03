import React, { useState, useEffect, useCallback } from 'react';
import { PusriApiClient } from './services/api';
import { PusriRisk, UserRole, ThemeMode, OrganizationMaster, MasterChecklistItem, ApiSyncEvent, UserAccount, SumberRisikoGroup } from './types/pusri';
import { MASTER_DEPARTMENTS, MASTER_CHECKLIST } from './data/initialData';
import { MASTER_SUMBER_RISIKO_DATA } from './data/sumberRisikoData';
import { normalizeRiskWithMasterData, getMasterRiskLevel, sortRisksNewestFirst } from './utils/riskMatrix';

// Visual components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { KpiCards } from './components/KpiCards';
import { StrategyAndCategoryCards } from './components/StrategyAndCategoryCards';
import { AnnualRecapSummaryCard } from './components/AnnualRecapSummaryCard';
import { LoginPage } from './components/LoginPage';

// Dedicated Workspace Views for each menu
import { IdentifikasiView } from './components/views/IdentifikasiView';
import { ReviewVpView } from './components/views/ReviewVpView';
import { ApprovalAdminView } from './components/views/ApprovalAdminView';
import { PelaksanaanRisikoView } from './components/views/PelaksanaanRisikoView';
import { PengendalianTwView } from './components/views/PengendalianTwView';
import { RekapTahunanView } from './components/views/RekapTahunanView';
import { MasterOrganisasiView } from './components/views/MasterOrganisasiView';
import { MasterLikelihoodConsequenceView } from './components/views/MasterLikelihoodConsequenceView';
import { MasterSumberRisikoView } from './components/views/MasterSumberRisikoView';
import { SettingsView } from './components/views/SettingsView';
import { AccessDeniedBanner } from './components/views/AccessDeniedBanner';
import { IamSsoManagementView } from './components/views/IamSsoManagementView';

// Modals
import { IdentifikasiRisikoModal } from './components/IdentifikasiRisikoModal';
import { ReviewVpModal } from './components/ReviewVpModal';
import { ApprovalAdminModal } from './components/ApprovalAdminModal';
import { PengendalianTwModal } from './components/PengendalianTwModal';
import { EvaluasiCarryOverModal } from './components/EvaluasiCarryOverModal';
import { SopWorkflowModal } from './components/SopWorkflowModal';
import { GolangMysqlSyncModal } from './components/GolangMysqlSyncModal';
import { RiskDetailModal } from './components/RiskDetailModal';
import { MasterOrganisasiModal } from './components/MasterOrganisasiModal';
import { DownloadDatabasePasswordModal } from './components/DownloadDatabasePasswordModal';
import { UpdateRiskModal } from './components/UpdateRiskModal';

import { ChevronRight, Home, Sparkles, Database } from 'lucide-react';

const ADMIN_ONLY_TABS = new Set([
  'approval-admin',
  'master-sumber-risiko',
  'master-organisasi',
  'master-matriks',
  'iam-sso'
]);

function getSafeTabForRole(tab: string | null | undefined, role: UserRole): string {
  if (!tab || tab === 'login') return 'dashboard';
  if (ADMIN_ONLY_TABS.has(tab) && role !== 'risk admin') return 'dashboard';
  if (tab === 'review-vp' && role === 'risk officer') return 'dashboard';
  return tab;
}

export function App() {
  // Core states - data baru selalu berada di atas (paling atas)
  const [risks, setRisks] = useState<PusriRisk[]>([]);
  const [departments, setDepartments] = useState<OrganizationMaster[]>(MASTER_DEPARTMENTS);
  const [checklist, setChecklist] = useState<MasterChecklistItem[]>(MASTER_CHECKLIST);
  const [sumberRisikoGroups, setSumberRisikoGroups] = useState<SumberRisikoGroup[]>(MASTER_SUMBER_RISIKO_DATA);
  const [syncEvents, setSyncEvents] = useState<ApiSyncEvent[]>([]);
  const [riskLoadError, setRiskLoadError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isSessionRestoring, setIsSessionRestoring] = useState(
    () => Boolean(PusriApiClient.getSsoToken())
  );

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return currentUser?.role || 'risk officer';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('pusri_theme') as ThemeMode) || 'light';
  });
  const [viewMode, setViewMode] = useState<'laptop' | 'mobile'>('laptop');
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const savedTab = localStorage.getItem('pusri_active_tab');
      if (PusriApiClient.getSsoToken()) return savedTab || 'dashboard';
      return getSafeTabForRole(savedTab, currentUser?.role || 'risk officer');
    } catch {}
    return 'dashboard';
  });
  const [syncPulse, setSyncPulse] = useState(false);

  useEffect(() => {
    if (!PusriApiClient.getSsoToken()) return;

    let isActive = true;
    PusriApiClient.verifySession()
      .then(({ valid, user }) => {
        if (!isActive || !valid || !user) return;
        setCurrentUser(user);
        setCurrentRole(user.role);
        try {
          setActiveTab(getSafeTabForRole(localStorage.getItem('pusri_active_tab'), user.role));
        } catch {
          setActiveTab('dashboard');
        }
      })
      .catch((error) => {
        console.error('Gagal memulihkan sesi pengguna.', error);
      })
      .finally(() => {
        if (isActive) setIsSessionRestoring(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  // Pastikan tab yang sedang aktif selalu sesuai hak akses peran pengguna
  useEffect(() => {
    if (isSessionRestoring) return;
    const safeTab = getSafeTabForRole(activeTab, currentRole);
    if (safeTab !== activeTab) {
      setActiveTab(safeTab);
      return;
    }
    if (activeTab) {
      try {
        localStorage.setItem('pusri_active_tab', activeTab);
      } catch (e) {
        console.warn('Failed to save active tab', e);
      }
    }
  }, [activeTab, currentRole, isSessionRestoring]);

  const [preselectedLoginRole, setPreselectedLoginRole] = useState<UserRole | undefined>(undefined);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setPreselectedLoginRole(undefined);
    setCurrentRole(user.role);
    // Pertahankan halaman aktif yang disimpan jika diizinkan untuk peran user ini, jika terkunci kembali ke dashboard
    const savedTab = localStorage.getItem('pusri_active_tab');
    setActiveTab(getSafeTabForRole(savedTab, user.role));
  };

  const handleRoleChange = (role: UserRole) => {
    // Penggantian peran/role mewajibkan login ulang dengan menuliskan kata sandi resmi
    handleLogout(role);
  };

  const handleUpdateUserProfile = (updatedFields: Partial<UserAccount>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updatedFields };
      setCurrentUser(updatedUser);
      // Sinkronkan ke database backend
      const iden = currentUser.badge || currentUser.nik || currentUser.username;
      if (iden) {
        PusriApiClient.updateUserProfile(iden, updatedFields).catch((err) =>
          console.warn('[Auto-sync user profile notice]:', err)
        );
      }
    }
  };

  const handleUploadAvatar = async (file: File) => {
    const avatarUrl = await PusriApiClient.uploadProfileAvatar(file);
    setCurrentUser((user) => user ? { ...user, avatarUrl } : user);
  };

  const handleRemoveAvatar = async () => {
    await PusriApiClient.removeProfileAvatar();
    setCurrentUser((user) => user ? { ...user, avatarUrl: undefined } : user);
  };

  const handleLogout = useCallback((roleToSelect?: UserRole) => {
    PusriApiClient.logoutSession().catch(() => {});
    setCurrentUser(null);
    setCurrentRole('risk officer');
    try {
      localStorage.removeItem('pusri_logged_user');
      sessionStorage.removeItem('pusri_session_user');
      localStorage.removeItem('pusri_active_tab');
    } catch {}
    setPreselectedLoginRole(roleToSelect);
    setActiveTab('dashboard');
  }, []);

  const [selectedRiskForTwId, setSelectedRiskForTwId] = useState<string | null>(null);

  const handleNavigateNext = (nextTab: string, riskId?: string) => {
    if (riskId) {
      setSelectedRiskForTwId(riskId);
    }
    setActiveTab(nextTab);
  };

  const handleRisksCreated = (newRisks: PusriRisk[]) => {
    setRisks((prev) => {
      const incomingMap = new Map(newRisks.map((r) => [r.id, normalizeRiskWithMasterData(r)]));
      const existingIds = new Set(newRisks.map((r) => r.id));
      const remainingPrev = prev.filter((r) => !existingIds.has(r.id));
      const freshNormalized = newRisks.map((r) => incomingMap.get(r.id) || normalizeRiskWithMasterData(r));
      return [...freshNormalized, ...remainingPrev].sort(sortRisksNewestFirst);
    });
  };

  const handleRiskCreated = (newRisk: PusriRisk) => {
    const normalized = normalizeRiskWithMasterData(newRisk);
    setRisks((prev) => {
      const filtered = prev.filter((r) => r.id !== normalized.id);
      return [normalized, ...filtered].sort(sortRisksNewestFirst);
    });
  };

  // Filters for Table & Dashboard Year Recap (2024+)
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<string | null>(null);
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string | null>(null);
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedDashboardYear, setSelectedDashboardYear] = useState<number | 'ALL'>('ALL');
  const [recapInitialYear, setRecapInitialYear] = useState<number | 'ALL'>('ALL');

  const handleSelectKpiFilter = (key: string | null) => {
    setSelectedKpiFilter(key);
    if (key) {
      setSelectedStrategyFilter(null);
      setSelectedCategoryFilter(null);
      setSelectedMatrixCell(null);
    }
  };

  const handleSelectStrategyFilter = (strategy: string | null) => {
    setSelectedStrategyFilter(strategy);
    if (strategy) {
      setSelectedKpiFilter(null);
      setSelectedCategoryFilter(null);
      setSelectedMatrixCell(null);
    }
  };

  const handleSelectCategoryFilter = (category: string | null) => {
    setSelectedCategoryFilter(category);
    if (category) {
      setSelectedKpiFilter(null);
      setSelectedStrategyFilter(null);
      setSelectedMatrixCell(null);
    }
  };

  const handleResetAllFilters = () => {
    setSelectedKpiFilter(null);
    setSelectedStrategyFilter(null);
    setSelectedCategoryFilter(null);
    setSelectedMatrixCell(null);
    setSelectedDashboardYear('ALL');
  };

  // Modal Dialogs (for quick actions)
  const [isNewRiskOpen, setIsNewRiskOpen] = useState(false);
  const [isReviewVpOpen, setIsReviewVpOpen] = useState(false);
  const [isApprovalAdminOpen, setIsApprovalAdminOpen] = useState(false);
  const [isPengendalianTwOpen, setIsPengendalianTwOpen] = useState(false);
  const [isEvaluasiCarryOverOpen, setIsEvaluasiCarryOverOpen] = useState(false);
  const [isSopWorkflowOpen, setIsSopWorkflowOpen] = useState(false);
  const [isSyncConsoleOpen, setIsSyncConsoleOpen] = useState(false);
  const [selectedRiskDetail, setSelectedRiskDetail] = useState<PusriRisk | null>(null);
  const [masterModalMode, setMasterModalMode] = useState<'organisasi' | 'checklist' | null>(null);
  const [isDownloadPasswordOpen, setIsDownloadPasswordOpen] = useState(false);
  const [riskToUpdate, setRiskToUpdate] = useState<PusriRisk | null>(null);

  // Apply Theme to Document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pusri_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Load initial data from REST API
  useEffect(() => {
    const initData = async () => {
      try {
        const [fetchedRisks, fetchedDepts, fetchedChecklist, fetchedSumber, fetchedSyncs] = await Promise.all([
          PusriApiClient.getRisks(),
          PusriApiClient.getDepartments(),
          PusriApiClient.getMasterChecklist(),
          PusriApiClient.getMasterSumberRisiko(),
          PusriApiClient.getSyncEvents()
        ]);
        setRisks(fetchedRisks.map(normalizeRiskWithMasterData).sort(sortRisksNewestFirst));
        setRiskLoadError(null);
        if (fetchedDepts && fetchedDepts.length > 0) setDepartments(fetchedDepts);
        if (fetchedChecklist && fetchedChecklist.length > 0) setChecklist(fetchedChecklist);
        if (fetchedSumber && fetchedSumber.length > 0) setSumberRisikoGroups(fetchedSumber);
        if (fetchedSyncs) setSyncEvents(fetchedSyncs);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal memuat data dari backend.';
        setRiskLoadError(message);
        console.error('Gagal memuat data risiko dari backend MySQL:', err);
      }
    };
    initData();
  }, []);

  // Subscribe to real-time cross-module API sync events
  useEffect(() => {
    const unsubscribe = PusriApiClient.subscribeSync((event, updatedRisks) => {
      const seen = new Set<string>();
      const unique = updatedRisks.filter((r) => {
        if (!r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      }).map(normalizeRiskWithMasterData).sort(sortRisksNewestFirst);
      setRisks(unique);
      setSyncEvents((prev) => [event, ...prev.slice(0, 49)]);
      setSyncPulse(true);
      setTimeout(() => setSyncPulse(false), 2000);
    });
    return unsubscribe;
  }, []);

  // Aturan RBAC:
  // 1. Hanya Risk Admin yang dapat melihat semuanya (corporate-wide view)
  // 2. Pada role Risk Owner dan Risk Officer, disinkronkan apa yang dapat dilihat (hanya data departemennya / penugasan PIC departemennya)
  const isRiskInUserUnit = useCallback((r: PusriRisk) => {
    // Hanya Risk Admin yang dapat melihat seluruh risiko perusahaan
    if (currentRole === 'risk admin' || !currentUser?.unitKerja) return true;

    // Untuk Risk Owner dan Risk Officer, data yang dilihat 100% sinkron berbasis departemen pengguna
    const uDept = currentUser.unitKerja.toLowerCase().trim();
    const uKode = (currentUser.kodeUnitKerja || '').toLowerCase().trim();
    const rDept = (r.namaOrganisasi || '').toLowerCase().trim();
    const rKode = (r.kodeOrganisasi || '').toLowerCase().trim();
    const rPicDept = (r.picDepartemen || r.picPelaksana || r.picPengendali || '').toLowerCase().trim();

    const isDirectDept = rDept.includes(uDept) || uDept.includes(rDept) || (uKode && rKode === uKode);
    const isPicDept = rPicDept.includes(uDept) || uDept.includes(rPicDept) || (uKode && rPicDept.includes(uKode));

    return isDirectDept || isPicDept;
  }, [currentRole, currentUser]);

  // Compute counts: Active risks in register sesuai Skor Matriks Register (High: 17-25, Mod to High: 12-16, Moderate: 8-11, Low to Mod: 4-7, Low: 1-3)
  // Jika pengguna memilih filter tahun spesifik pada Dashboard (misal 2024 atau 2025), tampilkan seluruh data pada tahun tersebut (termasuk arsip/selesai)
  const activeRegisterRisks = risks.filter((r) => {
    if (!isRiskInUserUnit(r)) return false;
    if (selectedDashboardYear !== 'ALL') {
      return (Number(r.tahun) || 2026) === selectedDashboardYear;
    }
    return r.statusWorkflow !== 'Selesai';
  });
  const totalRisks = activeRegisterRisks.length;
  const highRisk = activeRegisterRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'High').length;
  const modToHigh = activeRegisterRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Mod to High').length;
  const moderate = activeRegisterRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Moderate').length;
  const lowToMod = activeRegisterRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Low to Mod').length;
  const lowRisk = activeRegisterRisks.filter((r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === 'Low').length;
  const vpReviewCount = activeRegisterRisks.filter((r) => r.statusWorkflow === 'Menunggu_Approval_VP').length;
  const adminApprovalCount = activeRegisterRisks.filter((r) => r.statusWorkflow === 'Menunggu_Approval_Admin').length;
  const approvalCount = vpReviewCount + adminApprovalCount;
  const carryOverCount = activeRegisterRisks.filter((r) => r.statusWorkflow === 'Carry_Over').length;

  // 5x5 Matrix Cell mapping (Active Register)
  const matrixCounts: Record<string, number> = {};
  activeRegisterRisks.forEach((r) => {
    const key = `L${r.kemungkinanAwal}xD${r.dampakAwal}`;
    matrixCounts[key] = (matrixCounts[key] || 0) + 1;
  });

  // Strategy breakdown (Active Register)
  const mitigasiCount = activeRegisterRisks.filter((r) => r.jenisPenanganan === 'Mitigasi').length;
  const diterimaCount = activeRegisterRisks.filter((r) => r.jenisPenanganan === 'Diterima').length;
  const dihindariCount = activeRegisterRisks.filter((r) => r.jenisPenanganan === 'Dihindari').length;
  const transferCount = activeRegisterRisks.filter((r) => r.jenisPenanganan === 'Transfer').length;
  const safeTotal = totalRisks || 1;

  const strategiesData = {
    Mitigasi: mitigasiCount,
    Diterima: diterimaCount,
    Dihindari: dihindariCount,
    Transfer: transferCount,
    persentaseMitigasi: Math.round((mitigasiCount / safeTotal) * 100),
    persentaseDiterima: Math.round((diterimaCount / safeTotal) * 100),
    persentaseDihindari: Math.round((dihindariCount / safeTotal) * 100),
    persentaseTransfer: Math.round((transferCount / safeTotal) * 100)
  };

  // Category breakdown (Active Register)
  const categoriesData = {
    Operasional: activeRegisterRisks.filter((r) => r.kategoriRisiko === 'Operasional').length,
    Keuangan: activeRegisterRisks.filter((r) => r.kategoriRisiko === 'Keuangan').length,
    Strategis: activeRegisterRisks.filter((r) => r.kategoriRisiko === 'Strategis').length,
    'Hukum & Kepatuhan': activeRegisterRisks.filter((r) => r.kategoriRisiko === 'Hukum & Kepatuhan').length
  };

  // Download SQL Database File (Password Protected: portal123, Khusus Admin)
  const handleDownloadSql = () => {
    setIsDownloadPasswordOpen(true);
  };

  // Download user manual PDF
  const handleDownloadManual = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header Banner
      doc.setFillColor(0, 102, 153);
      doc.rect(0, 0, 210, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('BUKU PANDUAN PENGGUNA PORTAL RISIKO (ERM)', 14, 14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('PT Pupuk Sriwidjaja Palembang — Standar ISO 31000:2018', 14, 21);
      doc.setFontSize(8.5);
      doc.text('Dokumen Pedoman Operasional Aplikasi Manajemen Risiko Korporat & Unit Kerja', 14, 27);

      let y = 42;
      const addSection = (title: string, lines: string[]) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 102, 153);
        doc.text(title, 14, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(40, 40, 40);
        lines.forEach((line) => {
          const wrapped = doc.splitTextToSize(line, 182);
          wrapped.forEach((wLine: string) => {
            if (y > 278) {
              doc.addPage();
              y = 20;
            }
            doc.text(wLine, 14, y);
            y += 5;
          });
          y += 1;
        });
        y += 4;
      };

      addSection('1. Peran Pengguna & Hak Akses (Role-Based Access Control)', [
        '• CORPORATE RISK OFFICER (Unit Kerja): Menginput Identifikasi Risiko baru (Sasaran RKAP, Sasaran Unit Kerja, Konteks Eksternal/Internal, Peristiwa Risiko, Penyebab, Dampak, Existing Control, Skor Inherent, dan Rencana Mitigasi), serta melaporkan realisasi pengendalian Triwulan (TW I - TW IV).',
        '• RISK OWNER / VP UNIT KERJA: Melakukan verifikasi, reviu, koreksi (kembalikan ke draft), atau menyetujui (Approve) usulan risiko unit kerja untuk diteruskan ke Corporate Risk Admin.',
        '• CORPORATE RISK ADMIN / SUPERADMIN PORTAL RISIKO: Melakukan persetujuan akhir tingkat korporat, menetapkan PIC Departemen, mengevaluasi efektivitas pengendalian TW I - TW IV, menetapkan status Selesai atau Carry Over, serta mengelola Master Data & IAM SSO.'
      ]);

      addSection('2. Alur Kerja (Workflow) 7 Tahap Manajemen Risiko', [
        '1) Penetapan Konteks & Sasaran: Mengisi Sasaran RKAP, Sasaran Unit Kerja, Konteks Eksternal, dan Konteks Internal secara wajib sebelum risiko disimpan.',
        '2) Identifikasi Risiko: Menentukan Peristiwa Risiko, Kategori/Bidang Risiko, Sumber Risiko, Penyebab, Dampak, dan Indikator Risiko Kunci (KRI).',
        '3) Analisis Risiko Inherent: Menentukan nilai Kemungkinan (1-5) dan Dampak (1-5) berdasarkan Master Matriks 5x5.',
        '4) Evaluasi & Strategi Penanganan: Risiko dengan skor >= 10 wajib menyusun Rencana Tindak Lanjut (Mitigasi) beserta anggaran biaya.',
        '5) Review Risk Owner (VP): Pemeriksaan dan persetujuan oleh pimpinan unit kerja.',
        '6) Approval Risk Admin: Validasi akhir oleh Corporate Risk Admin untuk masuk ke Register Risiko Aktif.',
        '7) Pemantauan & Evaluasi Triwulanan (TW 1 - TW 4): Pelaporan progres fisik (%), realisasi biaya, skor risiko residual, serta evaluasi akhir tahun (Selesai / Carry Over).'
      ]);

      addSection('3. Matriks Risiko 5x5 PT Pupuk Sriwidjaja Palembang', [
        '• Low Risk (Skor 1 - 4): Risiko rendah, dikendalikan melalui prosedur rutin.',
        '• Low to Moderate Risk (Skor 5 - 8): Risiko rendah-menengah, memerlukan pemantauan berkala.',
        '• Moderate Risk (Skor 9 - 12): Risiko menengah, wajib memiliki rencana tindak pengendalian.',
        '• Moderate to High Risk (Skor 15 - 16): Risiko menengah-tinggi, prioritas mitigasi unit kerja & korporat.',
        '• High Risk (Skor 20 - 25): Risiko tinggi/ekstrem, wajib dimitigasi dengan pengawasan intensif manajemen.'
      ]);

      addSection('4. Fitur Rekap Data Tahunan & Pelaporan', [
        '• Gunakan menu "Rekap Data Tahunan" di bagian atas (Header) untuk memantau perbandingan profil risiko lintas tahun (2024 dan seterusnya) serta mengunduh laporan resmi dalam format PDF maupun Excel/CSV.'
      ]);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Dicetak melalui Portal Risiko PT Pupuk Sriwidjaja Palembang pada ${new Date().toLocaleDateString('id-ID')}`,
        14,
        287
      );

      doc.save('Panduan_Portal_Risiko_PT_Pupuk_Sriwidjaja_Palembang.pdf');
    } catch (err) {
      console.error('Gagal mengunduh PDF panduan:', err);
    }
  };

  // Manual Trigger Sync
  const handleTriggerSync = async () => {
    await PusriApiClient.triggerCrossModuleSync('Dashboard User Action', 'MySQL & All Modules', 'Manual API Sync triggered by User');
  };

  // Handlers for data updates from views (telah tersimpan melalui endpoint modul masing-masing)
  const handleRiskUpdated = (updated: PusriRisk) => {
    const normalized = normalizeRiskWithMasterData(updated);
    setRisks((prev) => {
      const exists = prev.some((r) => r.id === normalized.id);
      if (exists) {
        return prev.map((r) => (r.id === normalized.id ? normalized : r)).sort(sortRisksNewestFirst);
      }
      return [normalized, ...prev].sort(sortRisksNewestFirst);
    });
  };

  const handleRiskDeleted = (riskId: string) => {
    setRisks((prev) => prev.filter((r) => r.id !== riskId && r.kodeRisiko !== riskId));
    if (currentRole === 'risk admin') {
      PusriApiClient.deleteRisk(riskId, currentRole).catch((err) =>
        console.warn('[Auto-sync delete risk notice]:', err)
      );
    }
  };

  // Synchronize department totalRisiko counts automatically whenever risks change
  useEffect(() => {
    setDepartments((prevDepts) =>
      prevDepts.map((dept) => ({
        ...dept,
        totalRisiko: risks.filter((r) => r.kodeOrganisasi === dept.kode).length
      }))
    );
  }, [risks]);

  // Filtered risks for table based on KPI / Strategy / Category / Matrix:
  // Risks declared Selesai by Admin are stored in Evaluasi Risiko and excluded from the Register
  // Aturan RBAC: Unit kerja setiap departemen hanya dapat melihat data departemennya saja
  const userScopedRisks = risks.filter(isRiskInUserUnit);
  let displayedRisks = userScopedRisks.filter((r) => r.statusWorkflow !== 'Selesai');
  if (selectedKpiFilter) {
    if (selectedKpiFilter === 'APPROVAL') {
      displayedRisks = displayedRisks.filter(
        (r) => r.statusWorkflow === 'Menunggu_Approval_VP' || r.statusWorkflow === 'Menunggu_Approval_Admin'
      );
    } else if (selectedKpiFilter === 'CARRY_OVER') {
      displayedRisks = displayedRisks.filter((r) => r.statusWorkflow === 'Carry_Over');
    } else if (selectedKpiFilter !== 'ALL') {
      displayedRisks = displayedRisks.filter(
        (r) => getMasterRiskLevel(r.kemungkinanAwal, r.dampakAwal) === selectedKpiFilter
      );
    }
  }

  if (selectedStrategyFilter) {
    displayedRisks = displayedRisks.filter((r) => {
      if (selectedStrategyFilter === 'Transfer') {
        return r.jenisPenanganan === 'Transfer' || (r.jenisPenanganan as any) === 'Ditransfer';
      }
      return r.jenisPenanganan === selectedStrategyFilter;
    });
  }

  if (selectedCategoryFilter) {
    displayedRisks = displayedRisks.filter((r) => r.kategoriRisiko === selectedCategoryFilter);
  }

  // Active filter label description
  const activeFilterDescription = selectedKpiFilter
    ? selectedKpiFilter === 'ALL'
      ? 'Semua Risiko (Seluruh Unit Kerja)'
      : selectedKpiFilter === 'APPROVAL'
        ? 'Risiko Dalam Tahap Review & Approval (VP / Admin)'
        : selectedKpiFilter === 'CARRY_OVER'
          ? 'Risiko Penetapan Carry Over ke RKAP 2027'
          : `Risiko Skor Matriks ${selectedKpiFilter.toUpperCase()}`
    : selectedStrategyFilter
      ? `Strategi Penanganan: ${selectedStrategyFilter}`
      : selectedCategoryFilter
        ? `Kategori Taksonomi: ${selectedCategoryFilter}`
        : null;

  // Active view title mapping for breadcrumbs
  const getMenuTitle = (menu: string) => {
    switch (menu) {
      case 'dashboard': return 'Dashboard';
      case 'rekap-tahunan': return 'Rekap Data Tahunan (2024 & Seterusnya)';
      case 'identifikasi': return 'Identifikasi Risiko';
      case 'review-vp': return 'Review Risk Owner (VP)';
      case 'approval-admin': return 'Approval Risiko (Admin)';
      case 'pelaksanaan-risiko': return 'Pelaksanaan Tindakan Pengendalian';
      case 'pengendalian-tw': return 'Pengendalian & Evaluasi Triwulan (TW 1-4)';
      case 'evaluasi-carryover': return 'Pengendalian & Evaluasi Triwulan (TW 1-4)';
      case 'master-sumber-risiko': return 'Master Data Sumber Risiko';
      case 'master-organisasi': return 'Daftar Departemen';
      case 'master-matriks': return 'Master Likelihood & Consequence';
      case 'iam-sso': return 'Manajemen Akses & SSO (IAM)';
      case 'settings': return 'Pengaturan Aplikasi';
      case 'profile': return 'Ringkasan Pengguna';
      default: return 'Portal Risiko';
    }
  };

  if (isSessionRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-sm text-slate-500 dark:text-slate-400">Memulihkan sesi...</div>
      </div>
    );
  }

  // If user is not logged in, render the dedicated LoginPage
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        departments={departments}
        initialRole={preselectedLoginRole}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors w-full">
      <div className="w-full">
        {/* Header */}
        <Header
          currentRole={currentRole}
          currentUser={currentUser}
          onLogout={handleLogout}
          onRoleChange={handleRoleChange}
          onOpenSop={() => setIsSopWorkflowOpen(true)}
          onOpenSyncConsole={() => setIsSyncConsoleOpen(true)}
          syncPulse={syncPulse}
          theme={theme}
          onToggleTheme={toggleTheme}
          onDownloadSql={handleDownloadSql}
          onNavigateSettings={() => setActiveTab('settings')}
          onNavigateProfile={() => setActiveTab('profile')}
          risks={userScopedRisks}
          selectedRecapYear={recapInitialYear}
          activeTab={activeTab}
          onSelectRecapYear={(yr) => {
            setRecapInitialYear(yr);
            setSelectedDashboardYear(yr);
            setActiveTab('rekap-tahunan');
          }}
        />

        {/* Main Body */}
        <div className="flex">
          {/* Sidebar */}
          {viewMode === 'laptop' && (
            <Sidebar
              currentRole={currentRole}
              currentUser={currentUser}
              activeTab={activeTab}
              onSelectMenu={setActiveTab}
              counts={{
                total: totalRisks,
                vpReview: vpReviewCount,
                adminApproval: adminApprovalCount,
                carryOver: carryOverCount
              }}
              onDownloadManual={handleDownloadManual}
              onOpenSop={() => setIsSopWorkflowOpen(true)}
              onNavigateProfile={() => setActiveTab('profile')}
              onNavigateSettings={() => setActiveTab('settings')}
              onUploadAvatar={handleUploadAvatar}
              onRemoveAvatar={handleRemoveAvatar}
              onLogout={() => handleLogout()}
            />
          )}

          {/* Main Content Workspace */}
          <main className="flex-1 p-4 md:p-6 space-y-4 max-w-7xl mx-auto overflow-hidden">
            {riskLoadError && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" role="alert">
                Data risiko gagal dimuat dari backend MySQL: {riskLoadError}. Data lokal tidak digunakan.
              </div>
            )}
            {/* Breadcrumb Navigation when not on Dashboard */}
            {activeTab !== 'dashboard' && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pb-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-1 hover:text-[#009fe3] dark:hover:text-sky-400 font-semibold transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {getMenuTitle(activeTab)}
                </span>
              </div>
            )}

            {/* ROUTE 1: DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                {/* KPI Cards (Row of 8 Cards) */}
                <KpiCards
                  stats={{
                    totalRisks,
                    highRisk,
                    modToHigh,
                    moderate,
                    lowToMod,
                    lowRisk,
                    approvalCount,
                    carryOverCount
                  }}
                  activeFilter={selectedKpiFilter}
                  onSelectFilter={handleSelectKpiFilter}
                />

                {/* Visual Overview: Strategy Breakdown & Category Distribution */}
                <div className="w-full">
                  <StrategyAndCategoryCards
                    strategies={strategiesData}
                    categories={categoriesData}
                    activeCategory={selectedCategoryFilter}
                    activeStrategy={selectedStrategyFilter}
                    onFilterCategory={handleSelectCategoryFilter}
                    onFilterStrategy={handleSelectStrategyFilter}
                  />
                </div>

                {/* Rekap Data Portal Risiko Per Tahun (Mulai 2024 dan Seterusnya) */}
                <AnnualRecapSummaryCard
                  risks={userScopedRisks}
                  selectedDashboardYear={selectedDashboardYear}
                  onSelectDashboardYear={setSelectedDashboardYear}
                  onOpenFullAnnualRecap={(yr) => {
                    setRecapInitialYear(yr || 'ALL');
                    setActiveTab('rekap-tahunan');
                  }}
                />

                {/* Active Filter Notification Bar */}
                {(activeFilterDescription || selectedMatrixCell || selectedDashboardYear !== 'ALL') && (
                  <div className="p-3 px-4 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 flex items-center justify-between text-xs transition-all animate-fadeIn flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-medium">
                      <span className="font-bold text-[#009fe3] dark:text-sky-400">Filter Aktif:</span>
                      <span className="font-semibold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-800 font-mono text-slate-800 dark:text-slate-200">
                        {selectedDashboardYear !== 'ALL' ? `[RKAP ${selectedDashboardYear}] ` : ''}
                        {activeFilterDescription || (selectedMatrixCell ? `Matriks Cell: ${selectedMatrixCell}` : 'Filter Tahun Anggaran')}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        ({activeRegisterRisks.length} data risiko ditemukan)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRecapInitialYear(selectedDashboardYear);
                          setActiveTab('rekap-tahunan');
                        }}
                        className="px-3 py-1 bg-[#009fe3] hover:bg-[#0284c7] text-white font-bold rounded-lg text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Buka di Rekap Tahunan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleResetAllFilters}
                        className="px-3 py-1 bg-white dark:bg-slate-900 hover:bg-sky-100 dark:hover:bg-slate-800 text-[#009fe3] dark:text-sky-400 font-bold rounded-lg border border-sky-200 dark:border-sky-800 text-[11px] shadow-2xs transition-all cursor-pointer"
                      >
                        Hapus Filter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ROUTE REKAP DATA TAHUNAN (MULAI 2024 DAN SETERUSNYA) */}
            {activeTab === 'rekap-tahunan' && (
              <RekapTahunanView
                currentRole={currentRole}
                currentUser={currentUser}
                risks={userScopedRisks}
                departments={departments}
                onSelectRisk={(r) => setSelectedRiskDetail(r)}
                onNavigateTab={setActiveTab}
                initialYear={recapInitialYear}
              />
            )}

            {/* ROUTE 2: IDENTIFIKASI RISIKO VIEW */}
            {activeTab === 'identifikasi' && (
              <IdentifikasiView
                currentRole={currentRole}
                currentUser={currentUser}
                risks={risks}
                departments={departments}
                checklist={checklist}
                sumberRisikoGroups={sumberRisikoGroups}
                onOpenMasterSumberRisiko={() => setActiveTab('master-sumber-risiko')}
                onRiskCreated={handleRiskCreated}
                onRisksCreated={handleRisksCreated}
                onRiskUpdated={handleRiskUpdated}
                onSelectRisk={(r) => setSelectedRiskDetail(r)}
                onOpenUpdateRiskModal={(r) => setRiskToUpdate(r)}
                onNavigateNext={handleNavigateNext}
              />
            )}

            {/* ROUTE 3: REVIEW RISK OWNER (VP) VIEW */}
            {activeTab === 'review-vp' && (
              <ReviewVpView
                currentRole={currentRole}
                currentUser={currentUser}
                onSwitchRole={handleRoleChange}
                risks={userScopedRisks}
                onRiskUpdated={handleRiskUpdated}
                onSelectRisk={(r) => setSelectedRiskDetail(r)}
                onOpenUpdateRiskModal={(r) => setRiskToUpdate(r)}
                onNavigateNext={handleNavigateNext}
              />
            )}

            {/* ROUTE 4: APPROVAL ADMIN VIEW (WITH RBAC CHECK) */}
            {activeTab === 'approval-admin' && (
              <ApprovalAdminView
                currentRole={currentRole}
                currentUser={currentUser}
                onSwitchRole={handleRoleChange}
                risks={risks}
                departments={departments}
                onRiskUpdated={handleRiskUpdated}
                onRiskDeleted={handleRiskDeleted}
                onNavigateNext={handleNavigateNext}
              />
            )}

            {/* ROUTE PELAKSANAAN RISIKO (LOG TINDAKAN PENGENDALIAN) */}
            {activeTab === 'pelaksanaan-risiko' && (
              <PelaksanaanRisikoView
                currentRole={currentRole}
                currentUser={currentUser}
                risks={userScopedRisks}
                departments={departments}
                onRiskUpdated={handleRiskUpdated}
                onSelectRisk={(r) => setSelectedRiskDetail(r)}
                onNavigateNext={handleNavigateNext}
              />
            )}

            {/* ROUTE 5: PENGENDALIAN & EVALUASI TRIWULANAN (TW 1-4) VIEW */}
            {(activeTab === 'pengendalian-tw' || activeTab === 'evaluasi-carryover') && (
              <PengendalianTwView
                currentRole={currentRole}
                currentUser={currentUser}
                risks={risks}
                departments={departments}
                onRiskUpdated={handleRiskUpdated}
                onSelectRisk={(r) => setSelectedRiskDetail(r)}
                onNavigateNext={handleNavigateNext}
                initialSelectedRiskId={selectedRiskForTwId}
                initialMainTab={activeTab === 'evaluasi-carryover' ? 'evaluasi-akhir' : 'pemantauan-tw'}
              />
            )}

            {/* ROUTE MASTER SUMBER RISIKO VIEW */}
            {activeTab === 'master-sumber-risiko' && (
              <MasterSumberRisikoView
                currentRole={currentRole}
                sumberRisikoGroups={sumberRisikoGroups}
                onUpdateSumberRisiko={setSumberRisikoGroups}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* ROUTE 7: MASTER ORGANISASI VIEW */}
            {activeTab === 'master-organisasi' && (
              <MasterOrganisasiView
                currentRole={currentRole}
                departments={departments}
                risks={risks}
                onDownloadSql={handleDownloadSql}
                onNavigateTab={setActiveTab}
                onUpdateDepartments={setDepartments}
              />
            )}

            {/* ROUTE MASTER LIKELIHOOD & CONSEQUENCE VIEW */}
            {activeTab === 'master-matriks' && (
              <MasterLikelihoodConsequenceView
                currentRole={currentRole}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* ROUTE 8: MANAJEMEN AKSES & SSO (IAM ADMIN ONLY) */}
            {activeTab === 'iam-sso' && (
              <IamSsoManagementView
                currentRole={currentRole}
                currentUser={currentUser}
                departments={departments}
                onNavigateNext={setActiveTab}
              />
            )}

            {/* ROUTE 9: PROFIL VIEW (HANYA RINGKASAN PENGGUNA) */}
            {activeTab === 'profile' && (
              <SettingsView
                mode="profile"
                currentRole={currentRole}
                currentUser={currentUser}
                onLogout={handleLogout}
                onRoleChange={handleRoleChange}
                onUpdateUserProfile={handleUpdateUserProfile}
                theme={theme}
                onThemeChange={setTheme}
                onDownloadSql={handleDownloadSql}
              />
            )}

            {/* ROUTE 10: PENGATURAN VIEW (TEMA, ROLE, LOGOUT, PROFIL) */}
            {activeTab === 'settings' && (
              <SettingsView
                mode="settings"
                currentRole={currentRole}
                currentUser={currentUser}
                onLogout={handleLogout}
                onRoleChange={handleRoleChange}
                onUpdateUserProfile={handleUpdateUserProfile}
                theme={theme}
                onThemeChange={setTheme}
                onDownloadSql={handleDownloadSql}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modals for Quick Action Buttons */}
      <IdentifikasiRisikoModal
        isOpen={isNewRiskOpen}
        onClose={() => setIsNewRiskOpen(false)}
        currentRole={currentRole}
        currentUser={currentUser}
        departments={departments}
        checklist={checklist}
        sumberRisikoGroups={sumberRisikoGroups}
        onOpenMasterSumberRisiko={() => setActiveTab('master-sumber-risiko')}
        onRiskCreated={handleRiskCreated}
      />

      <ReviewVpModal
        isOpen={isReviewVpOpen}
        onClose={() => setIsReviewVpOpen(false)}
        risks={risks}
        onRiskUpdated={handleRiskUpdated}
      />

      <ApprovalAdminModal
        isOpen={isApprovalAdminOpen}
        onClose={() => setIsApprovalAdminOpen(false)}
        risks={risks}
        departments={departments}
        onRiskUpdated={handleRiskUpdated}
      />

      <PengendalianTwModal
        isOpen={isPengendalianTwOpen}
        onClose={() => setIsPengendalianTwOpen(false)}
        risks={risks}
        currentRole={currentRole}
        onRiskUpdated={handleRiskUpdated}
      />

      <EvaluasiCarryOverModal
        isOpen={isEvaluasiCarryOverOpen}
        onClose={() => setIsEvaluasiCarryOverOpen(false)}
        risks={risks}
        onRiskUpdated={handleRiskUpdated}
      />

      <SopWorkflowModal
        isOpen={isSopWorkflowOpen}
        onClose={() => setIsSopWorkflowOpen(false)}
      />

      <GolangMysqlSyncModal
        isOpen={isSyncConsoleOpen}
        onClose={() => setIsSyncConsoleOpen(false)}
        syncEvents={syncEvents}
        onTriggerSync={handleTriggerSync}
      />

      <RiskDetailModal
        isOpen={!!selectedRiskDetail}
        onClose={() => setSelectedRiskDetail(null)}
        risk={selectedRiskDetail}
        currentRole={currentRole}
        sumberRisikoGroups={sumberRisikoGroups}
        onRiskUpdated={(updated) => {
          handleRiskUpdated(updated);
          setSelectedRiskDetail(updated);
        }}
        onRiskDeleted={(id) => {
          handleRiskDeleted(id);
          setSelectedRiskDetail(null);
        }}
        onOpenUpdateModal={(r) => setRiskToUpdate(r)}
      />

      {/* Modal: Update Data Risiko (Pembaruan & Resubmit Risiko sebelum Approval) */}
      <UpdateRiskModal
        isOpen={!!riskToUpdate}
        onClose={() => setRiskToUpdate(null)}
        risk={riskToUpdate}
        currentRole={currentRole}
        currentUser={currentUser}
        sumberRisikoGroups={sumberRisikoGroups}
        onOpenMasterSumberRisiko={() => setActiveTab('master-sumber-risiko')}
        onRiskUpdated={(updated) => {
          handleRiskUpdated(updated);
          if (selectedRiskDetail && selectedRiskDetail.id === updated.id) {
            setSelectedRiskDetail(updated);
          }
          setRiskToUpdate(null);
        }}
      />

      {masterModalMode && (
        <MasterOrganisasiModal
          isOpen={!!masterModalMode}
          onClose={() => setMasterModalMode(null)}
          departments={departments}
          checklist={checklist}
          mode={masterModalMode}
        />
      )}

      {/* Password-protected SQL Database Download Modal (Password: portal123) */}
      <DownloadDatabasePasswordModal
        isOpen={isDownloadPasswordOpen}
        onClose={() => setIsDownloadPasswordOpen(false)}
      />
    </div>
  );
}

export default App;
