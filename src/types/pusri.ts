/**
 * Types definition for PT Pupuk Sriwidjaja Palembang - Enterprise Risk Management System
 * Based on Pusri SOP 16 Tahapan Manajemen Risiko & ISO 31000
 */

export type RiskLevel = 'High' | 'Mod to High' | 'Moderate' | 'Low to Mod' | 'Low';

export type RiskCategory = 'Operasional' | 'Keuangan' | 'Strategis' | 'Hukum & Kepatuhan';

export type RiskHandlingStrategy = 'Mitigasi' | 'Diterima' | 'Dihindari' | 'Transfer';

export type WorkflowStatus = 
  | 'Draft_Unit' 
  | 'Menunggu_Approval_VP' 
  | 'Menunggu_Approval_Admin' 
  | 'Disetujui_Dalam_Pengendalian' 
  | 'Selesai' 
  | 'Carry_Over'
  | 'Revisi'
  | 'Tercatat_Final';

export type UserRole = 'risk officer' | 'risk owner' | 'risk admin';

export function normalizeUserRole(role?: string | null): UserRole {
  if (!role) return 'risk officer';
  const lower = role.toLowerCase().trim();
  if (lower.includes('admin')) return 'risk admin';
  if (lower.includes('owner') || lower.includes('vp') || lower.includes('atasan') || lower.includes('kepala')) return 'risk owner';
  if (lower.includes('officer') || lower.includes('unit') || lower.includes('pic') || lower.includes('pelaksana')) return 'risk officer';
  return 'risk officer';
}

export function formatUserRole(role?: string | null): string {
  const norm = normalizeUserRole(role);
  if (norm === 'risk officer') return 'Risk Officer';
  if (norm === 'risk owner') return 'Risk Owner';
  if (norm === 'risk admin') return 'Risk Admin';
  return 'Risk Officer';
}

export type ExecutionStatus = 'Belum Dilaksanakan' | 'Sedang Berjalan' | 'Selesai Dilaksanakan' | 'Terkendala';
export type ControlEffectiveness = 'Efektif' | 'Cukup Efektif' | 'Kurang Efektif';

export interface PelaksanaanTindakanRisiko {
  id: string; // e.g. ACT-RSK-2026-001-1
  riskId: string;
  kodeRisiko: string;
  triwulan?: 'TW 1' | 'TW 2' | 'TW 3' | 'TW 4';
  tanggalPelaksanaan: string; // YYYY-MM-DD
  picPelaksana: string;
  uraianTindakan: string;
  progressPersen: number; // 0 - 100
  statusPelaksanaan: ExecutionStatus;
  realisasiBiaya: number;
  efektivitas: ControlEffectiveness;
  kendalaDanHambatan?: string;
  tindakLanjut?: string;
  nomorBuktiDokumen?: string;
  catatanAdmin?: string;
  isAccAdmin?: boolean;
  accAdminBy?: string;
  accAdminDate?: string;
  diperbaruiOleh: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuarterlyControl {
  triwulan: 'TW 1' | 'TW 2' | 'TW 3' | 'TW 4';
  realisasiKegiatan: string;
  realisasiBiaya: number;
  progressPersen: number; // Progres pengerjaan keseluruhan/evaluasi
  progressFisikPic?: number; // Realisasi kemajuan fisik yang telah di-input oleh PIC
  progresPengerjaanAdmin?: number; // Progres pengerjaan yang di-input oleh Admin
  kemungkinanResidual: number;
  dampakResidual: number;
  tingkatResidual: RiskLevel;
  // Usulan Tingkat Risiko dari Risk Officer:
  kemungkinanUsulanPic?: number;
  dampakUsulanPic?: number;
  tingkatUsulanPic?: RiskLevel;
  catatanUsulanPic?: string;
  // Penilaian & Kesimpulan Admin terhadap Usulan Risk Officer:
  kesimpulanPenilaianAdmin?: 'Sesuai_Usulan_Officer' | 'Disesuaikan_Lebih_Tinggi' | 'Disesuaikan_Lebih_Rendah' | 'Disetujui_Admin';
  catatanPenilaianRisikoAdmin?: string;
  statusPengendalian: 'On Track' | 'Delayed' | 'Completed' | 'Pending';
  kendalaDanTindakLanjut: string;
  reportedBy?: string;
  picDepartemenPelaksana?: string;
  picReportDate?: string;
  isPicAcc?: boolean;
  accBy?: string;
  accDate?: string;
  catatanAdminAcc?: string;
  isAdminProgressAcc?: boolean;
  adminProgressAccBy?: string;
  adminProgressAccDate?: string;
  // Penentuan PIC & Keputusan Evaluasi Lanjutan Admin:
  statusKeputusan?: 'Selesai' | 'Pengendalian_Lanjutan' | 'Carry_Over';
  picDepartemenBaru?: string; // Penugasan PIC per Departemen (disatukan)
  picPelaksanaBaru?: string; // Legacy compatibility
  picPengendaliBaru?: string; // Legacy compatibility
  targetWaktuLanjutan?: string;
  pengendalianLanjutanDesc?: string;
  catatanEvaluasiAdmin?: string;
  tanggalEvaluasi?: string;
  dievaluasiOleh?: string;
  updatedAt: string;
}

export interface CarryOverRecord {
  id: string; // e.g. CO-RSK-2026-001
  riskId: string;
  kodeRisiko: string;
  namaOrganisasi: string;
  pernyataanRisiko: string;
  kategoriRisiko: string;
  currentTingkatRisiko: string;
  statusWorkflow: string;
  progressTerakhir: number;
  targetTahun: number;
  alasanCarryOver: string;
  rekomendasiKomite: string;
  approvalCarryOverBy: string;
  tanggalCarryOver: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarryOverDetails {
  targetTahun: number;
  alasanCarryOver: string;
  rekomendasiKomite: string;
  approvalCarryOverBy?: string;
  tanggalCarryOver?: string;
  isPengendalianUlangActive?: boolean;
  tahunPengendalianUlang?: number;
  tanggalMulaiPengendalianUlang?: string;
  riwayatTahunSebelumnya?: QuarterlyControl[];
}

export interface PusriRisk {
  id: string;
  kodeRisiko: string; // e.g. RSK-2026-001
  kodeOrganisasi: string; // e.g. PRD-1B
  namaOrganisasi: string;
  tahun: number; // e.g. 2026 atau tahun target carry over seperti 2027
  sasaranRKAP: string;
  sasaranUnitKerja: string;
  konteksEksternal: string;
  konteksInternal: string;
  sumberRisiko: string;
  pernyataanRisiko: string;
  penyebabRisiko: string;
  dampakRisiko: string;
  pengendalianExisting: string;
  kategoriRisiko: RiskCategory;
  kemungkinanAwal: number; // 1 - 5
  dampakAwal: number; // 1 - 5
  inherentScore: number; // kemungkinan * dampak (1 - 25)
  tingkatRisikoAwal: RiskLevel;
  currentTingkatRisiko: RiskLevel;
  jenisPenanganan: RiskHandlingStrategy;
  butuhMitigasi: boolean;
  statusKebutuhanMitigasi?: string;
  alasanKebutuhanMitigasi?: string;
  rencanaPenanganan: string;
  targetWaktuMitigasi: string; // e.g. 'TW 2'
  biayaRencanaPengendalian: number;
  picDepartemen?: string; // PIC per Departemen (disatukan, ditentukan oleh Admin)
  picPelaksana: string;
  picPengendali: string;
  jenisAnggaran: string;
  statusWorkflow: WorkflowStatus;
  reviewNotesVp?: string;
  approvalNotesAdmin?: string;
  pengendalianTriwulan: QuarterlyControl[];
  pelaksanaanTindakan?: PelaksanaanTindakanRisiko[];
  statusPelaksanaanTerakhir?: ExecutionStatus;
  progressPelaksanaanTerakhir?: number;
  carryOverInfo?: CarryOverDetails;
  isPengendalianUlangCarryOver?: boolean;
  tahunCarryOverMulai?: number;
  kriteriaDampakKey?: string;
  kriteriaDampakTitle?: string;
  kriteriaDampakLevel?: number;
  // Extended Mitigasi fields (Khusus Strategi Mitigasi)
  keteranganRiskTreatment?: string;
  rencanaPengendalian?: string;
  expectedKemungkinan?: number; // Level 1 - 5 Expected Likelihood
  expectedDampak?: number; // Level 1 - 5 Expected Consequence terhadap Keuangan
  pertanyaanInvestasiRutin?: PertanyaanInvestasiRutin;
  bidangFungsiRisiko?: RiskCategory | string;
  subBidangRisiko?: string;
  bidangProyek?: string;
  diperbaruiOleh?: string; // Nama user yang memperbarui data risiko terakhir
  userProgres?: string; // Nama user yang melakukan progres terakhir
  createdDate: string;
  updatedDate: string;
  createdBy: string;
}

export interface PertanyaanInvestasiRutin {
  sifatInvestasi?: string;
  penggunaanInvestasi?: string;
  dasarUsulan?: string;
  umurInvestasiDiganti?: string;
  stockInvestasiDiajukan?: string;
  kebutuhanDiperlukanPada?: string;
  jikaTidakDisetujui?: string;
  konsekuensiDampak?: string;
}

export type ThemeMode = 'light' | 'dark';

export type AccountStatus = 'active' | 'pending_approval' | 'locked' | 'suspended';
export type AuthProviderType = 'PUSRI_IAM_SSO' | 'OIDC_EXTERNAL' | 'LOCAL_IAM';

export interface UserAccount {
  id: string;
  username: string;
  nama: string;
  nik?: string;
  badge?: string;
  jabatan?: string;
  jabatanPengajuan?: string;
  password?: string;
  role: UserRole;
  unitKerja: string;
  kodeUnitKerja: string;
  email?: string;
  avatarUrl?: string;
  accountStatus?: AccountStatus;
  authProvider?: AuthProviderType;
  lastLoginAt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface IamSecurityEvent {
  id: string;
  timestamp: string;
  eventType:
    | 'SSO_LOGIN_SUCCESS'
    | 'IAM_LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'ACCOUNT_LOCKOUT'
    | 'IMPERSONATION_BLOCKED'
    | 'ACCESS_REQUESTED'
    | 'ACCESS_APPROVED'
    | 'ROLE_CHANGED'
    | 'PASSWORD_CHANGED'
    | 'RESET_TICKET_CREATED'
    | 'RESET_TICKET_RESOLVED'
    | 'LOGOUT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  actorIdentifier: string;
  actorName: string;
  targetAccount?: string;
  authMethod?: string;
  details: string;
}

export interface PasswordResetTicket {
  id: string;
  identifier: string;
  userName?: string;
  badge?: string;
  email: string;
  unitKerja?: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface UserProfile {
  nik: string;
  badge?: string;
  nama: string;
  email: string;
  jabatan: string;
  unitKerja: string;
  kodeUnitKerja: string;
  role: UserRole;
  avatarUrl?: string;
  avatarInitials: string;
  terakhirLogin: string;
  hakAkses: string[];
}

export interface PersonnelItem {
  id?: string;
  nik: string;
  nama: string;
}

export interface OrganizationMaster {
  kode: string;
  nama: string;
  direktorat: string;
  kepalaUnit: string;
  totalRisiko: number;
  officers?: PersonnelItem[];
  owners?: PersonnelItem[];
}

export type Department = OrganizationMaster;

export interface MasterChecklistItem {
  id: string;
  kategori: RiskCategory;
  jenisRisiko: string;
  deskripsiStandar: string;
  faktorPemicuUmum: string;
  rekomendasiPengendalian: string;
}

export interface SumberRisikoGroup {
  id?: string;
  kategori: string;
  items: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface AuditLog {
  id: string;
  riskId: string;
  kodeRisiko: string;
  timestamp: string;
  userRole: UserRole;
  actorName: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  notes: string;
  latencyMs: number; // Simulated API sync latency
}

export interface ApiSyncEvent {
  id: string;
  timestamp: string;
  moduleSource: string;
  moduleTarget: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'SUCCESS' | 'SYNCED';
  durationMs: number;
  payloadSummary: string;
}

export interface SopStage {
  step: number;
  title: string;
  pic: string;
  description: string;
  output: string;
  kategoriSOP: 'Perencanaan' | 'Identifikasi & Analisis' | 'Evaluasi & Respon' | 'Monitoring & Review';
}

export interface MySqlConnectionStatus {
  isConnected: boolean;
  host: string;
  port: number;
  user: string;
  database: string;
  lastPingLatencyMs?: number;
  totalMySqlRows?: number;
  lastError?: string | null;
}
