import 'dotenv/config';
import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise';
import { normalizeUserRole } from '../src/types/pusri.ts';
import { hashPassword } from './security.ts';
import type {
  PusriRisk,
  OrganizationMaster,
  UserAccount,
  PasswordResetTicket,
  AuditLog,
  ApiSyncEvent,
  QuarterlyControl,
  PelaksanaanTindakanRisiko,
  SumberRisikoGroup
} from '../src/types/pusri.ts';

export interface MySqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export function getEnvMySqlConfig(): MySqlConfig {
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'pusri_risk_db'
  };
}

export const defaultMySqlConfig: MySqlConfig = getEnvMySqlConfig();

let activeConfig: MySqlConfig = { ...defaultMySqlConfig };
let pool: Pool | null = null;
let isConnected = false;
let lastError: string | null = null;
let lastConnectAttempt = new Date().toISOString();
let lastPingLatencyMs = 0;
let totalMySqlRows = 0;

// Dynamic schema compatibility flags for seamless migration from older tables
let orgIdIsAutoIncrement = true;
let twIdIsAutoIncrement = false;
let twResidualIsGenerated = true;
let riskInherentIsGenerated = true;

export interface MasterLikelihoodConsequenceRow {
  id: string;
  likelihood: number;
  keteranganEn: string;
  keteranganId: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  status: 'Aktif' | 'Nonaktif';
}

export const DEFAULT_MASTER_LIKELIHOOD_CONSEQUENCE: MasterLikelihoodConsequenceRow[] = [
  { id: 'lc-1', likelihood: 1, keteranganEn: 'Almost Never', keteranganId: 'Sangat Rendah', c1: 'L', c2: 'L', c3: 'LM', c4: 'M', c5: 'H', status: 'Aktif' },
  { id: 'lc-2', likelihood: 2, keteranganEn: 'Unlikely', keteranganId: 'Rendah', c1: 'L', c2: 'LM', c3: 'LM', c4: 'MH', c5: 'H', status: 'Aktif' },
  { id: 'lc-3', likelihood: 3, keteranganEn: 'Possible', keteranganId: 'Sedang', c1: 'L', c2: 'LM', c3: 'M', c4: 'MH', c5: 'H', status: 'Aktif' },
  { id: 'lc-4', likelihood: 4, keteranganEn: 'Likely', keteranganId: 'Tinggi', c1: 'L', c2: 'LM', c3: 'M', c4: 'MH', c5: 'H', status: 'Aktif' },
  { id: 'lc-5', likelihood: 5, keteranganEn: 'Almost Certain', keteranganId: 'Sangat Tinggi', c1: 'LM', c2: 'M', c3: 'MH', c4: 'H', c5: 'H', status: 'Aktif' }
];

function normalizeSqlDate(val?: string | Date | null): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function normalizeOrgCode(code?: string): string {
  if (!code) return 'OP-IIB';
  const trimmed = code.trim();
  if (trimmed === 'PRD-1B') return 'OP-IB';
  if (trimmed === 'TI-CORP') return 'TI';
  if (trimmed === 'RISK-CORP') return 'MR-CORP';
  return trimmed;
}

async function ensureTableColumns(
  p: Pool,
  tableName: string,
  requiredColumns: Array<{ name: string; definition: string }>
): Promise<Map<string, any>> {
  const colMap = new Map<string, any>();
  try {
    const [cols] = await p.query<RowDataPacket[]>(`SHOW COLUMNS FROM \`${tableName}\``);
    for (const c of cols) {
      colMap.set(String(c.Field).toLowerCase(), c);
    }

    for (const spec of requiredColumns) {
      if (!colMap.has(spec.name.toLowerCase())) {
        await p
          .query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${spec.name}\` ${spec.definition}`)
          .catch((e: any) => console.warn(`[MySQL Auto-Migrate] ${tableName}.${spec.name}:`, e?.message));
      }
    }

    const [updatedCols] = await p.query<RowDataPacket[]>(`SHOW COLUMNS FROM \`${tableName}\``);
    colMap.clear();
    for (const c of updatedCols) {
      colMap.set(String(c.Field).toLowerCase(), c);
    }
  } catch (err: any) {
    console.warn(`[MySQL Inspect Columns] ${tableName}:`, err?.message);
  }
  return colMap;
}

/**
 * Buat & migrasikan seluruh tabel utama secara otomatis agar 100% sinkron dengan schema.sql
 */
async function ensureTablesExist(p: Pool) {
  try {
    // 1. Tabel Master Organisasi
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`master_organisasi\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`kode\` VARCHAR(32) NOT NULL UNIQUE,
        \`nama\` VARCHAR(255) NOT NULL,
        \`direktorat\` VARCHAR(255) NOT NULL DEFAULT 'Direktorat Operasi & Produksi',
        \`kepala_unit\` VARCHAR(255) NOT NULL DEFAULT 'Vice President Unit Kerja',
        \`jabatan_kepala\` VARCHAR(150) NOT NULL DEFAULT 'Vice President (VP)',
        \`email_unit\` VARCHAR(150) NOT NULL DEFAULT 'unit@pusri.co.id',
        \`total_risiko\` INT DEFAULT 0,
        \`officers_json\` LONGTEXT DEFAULT NULL,
        \`owners_json\` LONGTEXT DEFAULT NULL,
        \`is_active\` TINYINT(1) DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_org_kode\` (\`kode\`),
        INDEX \`idx_org_direktorat\` (\`direktorat\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    const orgCols = await ensureTableColumns(p, 'master_organisasi', [
      { name: 'direktorat', definition: "VARCHAR(255) NOT NULL DEFAULT 'Direktorat Operasi & Produksi'" },
      { name: 'kepala_unit', definition: "VARCHAR(255) NOT NULL DEFAULT 'Vice President Unit Kerja'" },
      { name: 'jabatan_kepala', definition: "VARCHAR(150) NOT NULL DEFAULT 'Vice President (VP)'" },
      { name: 'email_unit', definition: "VARCHAR(150) NOT NULL DEFAULT 'unit@pusri.co.id'" },
      { name: 'total_risiko', definition: 'INT DEFAULT 0' },
      { name: 'officers_json', definition: 'LONGTEXT DEFAULT NULL' },
      { name: 'owners_json', definition: 'LONGTEXT DEFAULT NULL' },
      { name: 'is_active', definition: 'TINYINT(1) DEFAULT 1' },
      { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    ]);
    const orgIdCol = orgCols.get('id');
    orgIdIsAutoIncrement = Boolean(orgIdCol && String(orgIdCol.Extra || '').toLowerCase().includes('auto_increment'));

    // 2. Tabel Akun Pengguna & IAM SSO
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`user_accounts\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`username\` VARCHAR(100) NOT NULL UNIQUE,
        \`nama\` VARCHAR(255) NOT NULL,
        \`nik\` VARCHAR(64) DEFAULT NULL,
        \`badge\` VARCHAR(64) DEFAULT NULL,
        \`password\` VARCHAR(255) NOT NULL DEFAULT 'portal123',
        \`password_hash\` VARCHAR(255) DEFAULT NULL,
        \`role\` VARCHAR(64) NOT NULL DEFAULT 'risk officer',
        \`jabatan\` VARCHAR(255) DEFAULT NULL,
        \`jabatan_pengajuan\` VARCHAR(255) DEFAULT NULL,
        \`unit_kerja\` VARCHAR(255) NOT NULL DEFAULT 'Departemen Operasi Pabrik Pusri IIB',
        \`kode_unit\` VARCHAR(64) NOT NULL DEFAULT 'OP-IIB',
        \`kode_unit_kerja\` VARCHAR(64) DEFAULT 'OP-IIB',
        \`email\` VARCHAR(150) NOT NULL DEFAULT 'user@pusri.co.id',
        \`account_status\` VARCHAR(32) NOT NULL DEFAULT 'active',
        \`auth_provider\` VARCHAR(64) NOT NULL DEFAULT 'PUSRI_IAM_SSO',
        \`failed_login_attempts\` INT NOT NULL DEFAULT 0,
        \`locked_until\` VARCHAR(64) DEFAULT NULL,
        \`approved_by\` VARCHAR(150) DEFAULT NULL,
        \`last_login_at\` VARCHAR(64) DEFAULT NULL,
        \`avatar\` VARCHAR(255) DEFAULT NULL,
        \`is_active\` TINYINT(1) DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_users_role\` (\`role\`),
        INDEX \`idx_users_username\` (\`username\`),
        INDEX \`idx_users_badge\` (\`badge\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await ensureTableColumns(p, 'user_accounts', [
      { name: 'nik', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'badge', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'password', definition: "VARCHAR(255) NOT NULL DEFAULT 'portal123'" },
      { name: 'password_hash', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'jabatan', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'jabatan_pengajuan', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'kode_unit', definition: "VARCHAR(64) NOT NULL DEFAULT 'OP-IIB'" },
      { name: 'kode_unit_kerja', definition: "VARCHAR(64) DEFAULT 'OP-IIB'" },
      { name: 'account_status', definition: "VARCHAR(32) NOT NULL DEFAULT 'active'" },
      { name: 'auth_provider', definition: "VARCHAR(64) NOT NULL DEFAULT 'PUSRI_IAM_SSO'" },
      { name: 'failed_login_attempts', definition: 'INT NOT NULL DEFAULT 0' },
      { name: 'locked_until', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'approved_by', definition: 'VARCHAR(150) DEFAULT NULL' },
      { name: 'last_login_at', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'avatar', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'is_active', definition: 'TINYINT(1) DEFAULT 1' },
      { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    ]);

    await p.query(`
      CREATE TABLE IF NOT EXISTS \`password_reset_tickets\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`identifier\` VARCHAR(150) NOT NULL,
        \`user_name\` VARCHAR(255) DEFAULT NULL,
        \`badge\` VARCHAR(64) DEFAULT NULL,
        \`email\` VARCHAR(150) NOT NULL,
        \`unit_kerja\` VARCHAR(255) DEFAULT NULL,
        \`reason\` TEXT NOT NULL,
        \`temporary_password\` VARCHAR(255) DEFAULT NULL,
        \`temporary_password_hash\` VARCHAR(255) DEFAULT NULL,
        \`status\` ENUM('pending', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
        \`created_at\` DATETIME NOT NULL,
        \`resolved_at\` DATETIME DEFAULT NULL,
        \`resolved_by\` VARCHAR(255) DEFAULT NULL,
        INDEX \`idx_reset_ticket_status_created\` (\`status\`, \`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await ensureTableColumns(p, 'password_reset_tickets', [
      { name: 'temporary_password', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'temporary_password_hash', definition: 'VARCHAR(255) DEFAULT NULL' }
    ]);

    // 3. Tabel Utama Pusri Risks
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`pusri_risks\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`kode_risiko\` VARCHAR(64) NOT NULL UNIQUE,
        \`kode_organisasi\` VARCHAR(32) NOT NULL,
        \`nama_organisasi\` VARCHAR(255) NOT NULL,
        \`tahun\` INT NOT NULL DEFAULT 2026,
        \`sasaran_rkap\` TEXT NOT NULL,
        \`sasaran_unit_kerja\` TEXT NOT NULL,
        \`konteks_eksternal\` TEXT,
        \`konteks_internal\` TEXT,
        \`sumber_risiko\` VARCHAR(255) NOT NULL DEFAULT 'Operasional',
        \`pernyataan_risiko\` TEXT NOT NULL,
        \`penyebab_risiko\` TEXT NOT NULL,
        \`dampak_risiko\` TEXT NOT NULL,
        \`pengendalian_existing\` TEXT,
        \`kategori_risiko\` VARCHAR(64) NOT NULL DEFAULT 'Operasional',
        \`kriteria_dampak_key\` VARCHAR(64) DEFAULT NULL,
        \`kriteria_dampak_title\` VARCHAR(255) DEFAULT NULL,
        \`kriteria_dampak_level\` INT DEFAULT NULL,
        \`kemungkinan_awal\` INT NOT NULL DEFAULT 1,
        \`dampak_awal\` INT NOT NULL DEFAULT 1,
        \`inherent_score\` INT GENERATED ALWAYS AS (\`kemungkinan_awal\` * \`dampak_awal\`) STORED,
        \`tingkat_risiko_awal\` VARCHAR(50) NOT NULL DEFAULT 'Moderate',
        \`current_tingkat_risiko\` VARCHAR(50) NOT NULL DEFAULT 'Moderate',
        \`jenis_penanganan\` VARCHAR(50) NOT NULL DEFAULT 'Mitigasi',
        \`butuh_mitigasi\` TINYINT(1) NOT NULL DEFAULT 1,
        \`status_kebutuhan_mitigasi\` VARCHAR(128) NOT NULL DEFAULT 'Wajib Mitigasi',
        \`alasan_kebutuhan_mitigasi\` TEXT,
        \`rencana_penanganan\` TEXT,
        \`target_waktu_mitigasi\` VARCHAR(128) DEFAULT 'TW 2',
        \`biaya_rencana_pengendalian\` DECIMAL(15, 2) DEFAULT 0.00,
        \`pic_departemen\` VARCHAR(255) DEFAULT NULL,
        \`pic_pelaksana\` VARCHAR(255) DEFAULT '',
        \`pic_pengendali\` VARCHAR(255) DEFAULT '',
        \`jenis_anggaran\` VARCHAR(128) DEFAULT 'Investasi Rutin / OPEX',
        \`status_workflow\` VARCHAR(100) NOT NULL DEFAULT 'Menunggu_Approval_VP',
        \`status_pelaksanaan_terakhir\` VARCHAR(64) DEFAULT 'Belum Dilaksanakan',
        \`progress_pelaksanaan_terakhir\` INT DEFAULT 0,
        \`review_notes_vp\` TEXT,
        \`approval_notes_admin\` TEXT,
        \`diperbarui_oleh\` VARCHAR(150) DEFAULT NULL,
        \`user_progres\` VARCHAR(150) DEFAULT NULL,
        \`created_by\` VARCHAR(128) NOT NULL DEFAULT 'Risk Officer',
        \`created_date\` VARCHAR(64) DEFAULT NULL,
        \`updated_date\` VARCHAR(64) DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_pusri_risk_org\` FOREIGN KEY (\`kode_organisasi\`) REFERENCES \`master_organisasi\`(\`kode\`) ON UPDATE CASCADE,
        INDEX \`idx_risk_tahun\` (\`tahun\`),
        INDEX \`idx_risk_status\` (\`status_workflow\`),
        INDEX \`idx_risk_kategori\` (\`kategori_risiko\`),
        INDEX \`idx_risk_tingkat\` (\`current_tingkat_risiko\`),
        INDEX \`idx_risk_inherent\` (\`inherent_score\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    const riskCols = await ensureTableColumns(p, 'pusri_risks', [
      { name: 'kriteria_dampak_key', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'kriteria_dampak_title', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'kriteria_dampak_level', definition: 'INT DEFAULT NULL' },
      { name: 'pic_departemen', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'status_pelaksanaan_terakhir', definition: "VARCHAR(64) DEFAULT 'Belum Dilaksanakan'" },
      { name: 'progress_pelaksanaan_terakhir', definition: 'INT DEFAULT 0' },
      { name: 'diperbarui_oleh', definition: 'VARCHAR(150) DEFAULT NULL' },
      { name: 'user_progres', definition: 'VARCHAR(150) DEFAULT NULL' },
      { name: 'created_date', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'updated_date', definition: 'VARCHAR(64) DEFAULT NULL' }
    ]);
    await p.query(`ALTER TABLE \`pusri_risks\` MODIFY COLUMN \`target_waktu_mitigasi\` VARCHAR(128) DEFAULT 'TW 2'`).catch(() => {});
    await p.query(`ALTER TABLE \`pusri_risks\` MODIFY COLUMN \`jenis_anggaran\` VARCHAR(128) DEFAULT 'Investasi Rutin / OPEX'`).catch(() => {});
    await p.query(`ALTER TABLE \`pusri_risks\` MODIFY COLUMN \`status_workflow\` VARCHAR(100) NOT NULL DEFAULT 'Menunggu_Approval_VP'`).catch(() => {});
    const inhCol = riskCols.get('inherent_score');
    riskInherentIsGenerated = Boolean(inhCol && String(inhCol.Extra || '').toUpperCase().includes('GENERATED'));

    // 4. Tabel Pemantauan Triwulan (pengendalian_triwulan)
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`pengendalian_triwulan\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`risk_id\` VARCHAR(64) NOT NULL,
        \`kode_risiko\` VARCHAR(64) NOT NULL DEFAULT '',
        \`triwulan\` ENUM('TW 1', 'TW 2', 'TW 3', 'TW 4') NOT NULL,
        \`realisasi_kegiatan\` TEXT NOT NULL,
        \`realisasi_biaya\` DECIMAL(15, 2) DEFAULT 0.00,
        \`progress_persen\` INT DEFAULT 0,
        \`progress_fisik_pic\` INT DEFAULT NULL,
        \`progres_pengerjaan_admin\` INT DEFAULT NULL,
        \`kemungkinan_residual\` INT DEFAULT 1,
        \`dampak_residual\` INT DEFAULT 1,
        \`residual_score\` INT GENERATED ALWAYS AS (\`kemungkinan_residual\` * \`dampak_residual\`) STORED,
        \`tingkat_residual\` VARCHAR(50) NOT NULL,
        \`status_pengendalian\` VARCHAR(50) NOT NULL DEFAULT 'On Track',
        \`kendala_dan_tindak_lanjut\` TEXT,
        \`reported_by\` VARCHAR(150) NOT NULL DEFAULT 'PIC Pelaksana',
        \`pic_report_date\` VARCHAR(64) DEFAULT NULL,
        \`is_pic_acc\` TINYINT(1) DEFAULT 0,
        \`acc_by\` VARCHAR(150) DEFAULT NULL,
        \`acc_date\` VARCHAR(64) DEFAULT NULL,
        \`catatan_admin_acc\` TEXT DEFAULT NULL,
        \`status_keputusan\` VARCHAR(64) DEFAULT NULL,
        \`catatan_evaluasi_admin\` TEXT DEFAULT NULL,
        \`tanggal_evaluasi\` VARCHAR(64) DEFAULT NULL,
        \`dievaluasi_oleh\` VARCHAR(150) DEFAULT NULL,
        \`detail_evaluasi_json\` LONGTEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_quarterly_pusri_risk\` FOREIGN KEY (\`risk_id\`) REFERENCES \`pusri_risks\`(\`id\`) ON DELETE CASCADE,
        UNIQUE KEY \`uk_risk_triwulan\` (\`risk_id\`, \`triwulan\`),
        INDEX \`idx_tw_risk\` (\`risk_id\`),
        INDEX \`idx_quarterly_status\` (\`status_pengendalian\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    const twCols = await ensureTableColumns(p, 'pengendalian_triwulan', [
      { name: 'kode_risiko', definition: "VARCHAR(64) NOT NULL DEFAULT ''" },
      { name: 'progress_fisik_pic', definition: 'INT DEFAULT NULL' },
      { name: 'progres_pengerjaan_admin', definition: 'INT DEFAULT NULL' },
      { name: 'pic_report_date', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'is_pic_acc', definition: 'TINYINT(1) DEFAULT 0' },
      { name: 'acc_by', definition: 'VARCHAR(150) DEFAULT NULL' },
      { name: 'acc_date', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'catatan_admin_acc', definition: 'TEXT DEFAULT NULL' },
      { name: 'status_keputusan', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'catatan_evaluasi_admin', definition: 'TEXT DEFAULT NULL' },
      { name: 'tanggal_evaluasi', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'dievaluasi_oleh', definition: 'VARCHAR(150) DEFAULT NULL' },
      { name: 'detail_evaluasi_json', definition: 'LONGTEXT DEFAULT NULL' }
    ]);
    const twIdCol = twCols.get('id');
    twIdIsAutoIncrement = Boolean(twIdCol && String(twIdCol.Extra || '').toLowerCase().includes('auto_increment'));
    const twResCol = twCols.get('residual_score');
    twResidualIsGenerated = Boolean(twResCol && String(twResCol.Extra || '').toUpperCase().includes('GENERATED'));

    // 5. Tabel Pelaksanaan Tindakan Mitigasi (pelaksanaan_tindakan)
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`pelaksanaan_tindakan\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`risk_id\` VARCHAR(64) NOT NULL,
        \`kode_risiko\` VARCHAR(64) NOT NULL,
        \`triwulan\` VARCHAR(16) DEFAULT NULL,
        \`tanggal_pelaksanaan\` VARCHAR(32) NOT NULL,
        \`pic_pelaksana\` VARCHAR(255) NOT NULL,
        \`uraian_tindakan\` TEXT NOT NULL,
        \`progress_persen\` INT DEFAULT 0,
        \`status_pelaksanaan\` VARCHAR(64) NOT NULL DEFAULT 'Belum Dilaksanakan',
        \`realisasi_biaya\` DECIMAL(15, 2) DEFAULT 0.00,
        \`efektivitas\` VARCHAR(64) NOT NULL DEFAULT 'Belum Dinilai',
        \`kendala_dan_hambatan\` TEXT,
        \`tindak_lanjut\` TEXT,
        \`nomor_bukti_dokumen\` VARCHAR(255) DEFAULT NULL,
        \`catatan_admin\` TEXT DEFAULT NULL,
        \`is_acc_admin\` TINYINT(1) DEFAULT 0,
        \`acc_admin_by\` VARCHAR(150) DEFAULT NULL,
        \`acc_admin_date\` VARCHAR(64) DEFAULT NULL,
        \`diperbarui_oleh\` VARCHAR(150) DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_action_pusri_risk\` FOREIGN KEY (\`risk_id\`) REFERENCES \`pusri_risks\`(\`id\`) ON DELETE CASCADE,
        INDEX \`idx_action_risk\` (\`risk_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Tabel Carry Over (Risiko Lanjutan Lintas Tahun RKAP)
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`carry_over\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`risk_id\` VARCHAR(64) NOT NULL UNIQUE,
        \`kode_risiko\` VARCHAR(64) NOT NULL,
        \`nama_organisasi\` VARCHAR(255) NOT NULL,
        \`pernyataan_risiko\` TEXT NOT NULL,
        \`kategori_risiko\` VARCHAR(100) NOT NULL,
        \`current_tingkat_risiko\` VARCHAR(50) NOT NULL,
        \`status_workflow\` VARCHAR(100) NOT NULL,
        \`progress_terakhir\` INT DEFAULT 0,
        \`target_tahun\` INT NOT NULL DEFAULT 2027,
        \`alasan_carry_over\` TEXT NOT NULL,
        \`rekomendasi_komite\` TEXT NOT NULL,
        \`approval_carry_over_by\` VARCHAR(255) DEFAULT 'Komite Risiko Pusri',
        \`tanggal_carry_over\` DATE DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_carryover_pusri_risk\` FOREIGN KEY (\`risk_id\`) REFERENCES \`pusri_risks\`(\`id\`) ON DELETE CASCADE,
        INDEX \`idx_carry_status\` (\`status_workflow\`),
        INDEX \`idx_carry_tingkat\` (\`current_tingkat_risiko\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Tabel Audit Logs
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`audit_log_risiko\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`risk_id\` VARCHAR(64) NOT NULL DEFAULT '',
        \`kode_risiko\` VARCHAR(64) NOT NULL DEFAULT '',
        \`user_role\` VARCHAR(64) NOT NULL DEFAULT 'risk officer',
        \`actor_name\` VARCHAR(255) NOT NULL DEFAULT 'Risk System',
        \`action\` VARCHAR(128) NOT NULL,
        \`previous_status\` VARCHAR(64) DEFAULT NULL,
        \`new_status\` VARCHAR(64) DEFAULT NULL,
        \`notes\` TEXT,
        \`ip_address\` VARCHAR(64) DEFAULT '127.0.0.1',
        \`latency_ms\` DECIMAL(6, 2) DEFAULT 4.20,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_audit_risk_id\` (\`risk_id\`),
        INDEX \`idx_audit_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await ensureTableColumns(p, 'audit_log_risiko', [
      { name: 'kode_risiko', definition: "VARCHAR(64) NOT NULL DEFAULT ''" },
      { name: 'user_role', definition: "VARCHAR(64) NOT NULL DEFAULT 'risk officer'" },
      { name: 'actor_name', definition: "VARCHAR(255) NOT NULL DEFAULT 'Risk System'" },
      { name: 'previous_status', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'new_status', definition: 'VARCHAR(64) DEFAULT NULL' },
      { name: 'notes', definition: 'TEXT' },
      { name: 'ip_address', definition: "VARCHAR(64) DEFAULT '127.0.0.1'" },
      { name: 'latency_ms', definition: 'DECIMAL(6, 2) DEFAULT 4.20' },
      { name: 'created_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ]);
    await p
      .query(`ALTER TABLE \`audit_log_risiko\` MODIFY COLUMN \`user_role\` VARCHAR(64) NOT NULL DEFAULT 'risk officer'`)
      .catch(() => {});

    // 8. Tabel Event Sinkronisasi Antar Modul
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`sync_event_modul\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`module_source\` VARCHAR(128) NOT NULL,
        \`module_target\` VARCHAR(128) NOT NULL,
        \`endpoint\` VARCHAR(255) NOT NULL,
        \`method\` VARCHAR(16) NOT NULL,
        \`status\` VARCHAR(32) NOT NULL DEFAULT 'SYNCED',
        \`duration_ms\` DECIMAL(8, 2) NOT NULL DEFAULT 4.50,
        \`payload_summary\` TEXT,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_sync_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await ensureTableColumns(p, 'sync_event_modul', [
      { name: 'created_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ]);

    // 9. Tabel Master Sumber Risiko (Hanya diinput/dikelola oleh Risk Admin)
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`master_sumber_risiko\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`kategori\` VARCHAR(150) NOT NULL,
        \`sumber_risiko\` VARCHAR(500) NOT NULL,
        \`urutan\` INT DEFAULT 0,
        \`dibuat_oleh\` VARCHAR(150) DEFAULT 'Risk Admin',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`uk_master_sumber_risiko\` (\`kategori\`, \`sumber_risiko\`(191)),
        INDEX \`idx_sumber_kategori\` (\`kategori\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Master Matriks Likelihood & Consequence
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`master_likelihood_consequence\` (
        \`id\` VARCHAR(20) NOT NULL,
        \`likelihood\` TINYINT UNSIGNED NOT NULL,
        \`keterangan_en\` VARCHAR(100) NOT NULL,
        \`keterangan_id\` VARCHAR(100) NOT NULL,
        \`c1\` ENUM('L', 'LM', 'M', 'MH', 'H') NOT NULL,
        \`c2\` ENUM('L', 'LM', 'M', 'MH', 'H') NOT NULL,
        \`c3\` ENUM('L', 'LM', 'M', 'MH', 'H') NOT NULL,
        \`c4\` ENUM('L', 'LM', 'M', 'MH', 'H') NOT NULL,
        \`c5\` ENUM('L', 'LM', 'M', 'MH', 'H') NOT NULL,
        \`status\` ENUM('Aktif', 'Nonaktif') NOT NULL DEFAULT 'Aktif',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_master_likelihood_level\` (\`likelihood\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    const [likelihoodCount] = await p.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM `master_likelihood_consequence`'
    );
    if (Number(likelihoodCount[0]?.total || 0) === 0) {
      for (const row of DEFAULT_MASTER_LIKELIHOOD_CONSEQUENCE) {
        await p.execute(
          'INSERT INTO `master_likelihood_consequence` (`id`, `likelihood`, `keterangan_en`, `keterangan_id`, `c1`, `c2`, `c3`, `c4`, `c5`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [row.id, row.likelihood, row.keteranganEn, row.keteranganId, row.c1, row.c2, row.c3, row.c4, row.c5, row.status]
        );
      }
    }

    // Compatibility Views (Alias Bahasa Inggris & Alternatif)
    await p.query(`CREATE OR REPLACE VIEW \`master_organizations\` AS SELECT * FROM \`master_organisasi\`;`).catch(() => {});
    await p.query(`CREATE OR REPLACE VIEW \`master_risk_sources\` AS SELECT * FROM \`master_sumber_risiko\`;`).catch(() => {});
    await p.query(`CREATE OR REPLACE VIEW \`portal_users\` AS SELECT * FROM \`user_accounts\`;`).catch(() => {});
    await p.query(`CREATE OR REPLACE VIEW \`pusri_risk\` AS SELECT * FROM \`pusri_risks\`;`).catch(() => {});
    await p.query(`CREATE OR REPLACE VIEW \`quarterly_controls\` AS SELECT * FROM \`pengendalian_triwulan\`;`).catch(() => {});
    await p.query(`CREATE OR REPLACE VIEW \`risk_action_executions\` AS SELECT * FROM \`pelaksanaan_tindakan\`;`).catch(() => {});
    await p.query(`CREATE OR REPLACE VIEW \`evaluasi_carry_over\` AS SELECT * FROM \`carry_over\`;`).catch(() => {});
    await p.query(`CREATE OR REPLACE VIEW \`risk_carry_overs\` AS SELECT * FROM \`carry_over\`;`).catch(() => {});
    await p.query(`CREATE OR REPLACE VIEW \`risk_audit_logs\` AS SELECT * FROM \`audit_log_risiko\`;`).catch(() => {});
    await p.query(`CREATE OR REPLACE VIEW \`module_sync_events\` AS SELECT * FROM \`sync_event_modul\`;`).catch(() => {});

    // Hapus tabel & view lama yang sudah tidak digunakan
    await p.query(`DROP VIEW IF EXISTS \`master_risk_checklist\`, \`sop_stages\`, \`master_sop_stages\`;`).catch(() => {});
    await p.query(`DROP TABLE IF EXISTS \`master_checklist_risiko\`, \`master_risk_checklist\`, \`master_tahapan_sop\`, \`sop_stages\`;`).catch(() => {});
  } catch (err: any) {
    console.warn('[MySQL Table Init Notice]:', err?.message);
  }
}

async function ensureOrganizationExistsInMySql(kode: string, nama: string): Promise<void> {
  if (!pool || !isConnected) return;
  const cleanKode = normalizeOrgCode(kode);
  const cleanNama = nama || `Departemen ${cleanKode}`;
  const email = `${cleanKode.toLowerCase().replace(/[^a-z0-9]/g, '')}@pusri.co.id`;

  if (orgIdIsAutoIncrement) {
    await pool
      .execute(
        `INSERT IGNORE INTO \`master_organisasi\` (\`kode\`, \`nama\`, \`direktorat\`, \`kepala_unit\`, \`jabatan_kepala\`, \`email_unit\`) VALUES (?, ?, ?, ?, ?, ?)`,
        [cleanKode, cleanNama, 'Direktorat Operasi & Produksi', `VP ${cleanNama}`, `Vice President ${cleanNama}`, email]
      )
      .catch(() => {});
  } else {
    await pool
      .execute(
        `INSERT IGNORE INTO \`master_organisasi\` (\`id\`, \`kode\`, \`nama\`, \`direktorat\`, \`kepala_unit\`, \`jabatan_kepala\`, \`email_unit\`) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`ORG-${cleanKode}`, cleanKode, cleanNama, 'Direktorat Operasi & Produksi', `VP ${cleanNama}`, `Vice President ${cleanNama}`, email]
      )
      .catch(() => {});
  }
}

async function refreshRowCounter() {
  if (!pool || !isConnected) return;
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM `pusri_risks`');
    totalMySqlRows = Number(rows[0]?.total) || 0;
  } catch {
    // ignore
  }
}

/**
 * Inisialisasi pool koneksi MySQL dengan deteksi & migrasi skema otomatis
 */
export async function initMySqlConnection(config: Partial<MySqlConfig> = {}): Promise<boolean> {
  const envCfg = getEnvMySqlConfig();
  const currentConfig: MySqlConfig = {
    host: config.host ?? envCfg.host,
    port: config.port ? Number(config.port) : envCfg.port,
    user: config.user ?? envCfg.user,
    password: config.password !== undefined ? config.password : envCfg.password,
    database: config.database ?? envCfg.database
  };

  activeConfig = { ...currentConfig };
  lastConnectAttempt = new Date().toISOString();

  try {
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }

    // Auto-create database if MySQL server is reachable
    try {
      const probeConn = await mysql.createConnection({
        host: currentConfig.host,
        port: currentConfig.port,
        user: currentConfig.user,
        password: currentConfig.password,
        connectTimeout: 1200
      });
      await probeConn.query(
        `CREATE DATABASE IF NOT EXISTS \`${currentConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      await probeConn.end().catch(() => {});
    } catch {
      // Proceed to pool creation
    }

    pool = mysql.createPool({
      host: currentConfig.host,
      port: currentConfig.port,
      user: currentConfig.user,
      password: currentConfig.password,
      database: currentConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 1200
    });

    const startPing = Date.now();
    const connection = await pool.getConnection();
    await connection.ping();
    lastPingLatencyMs = Math.max(1, Date.now() - startPing);
    connection.release();

    await ensureTablesExist(pool);
    isConnected = true;
    lastError = null;
    await refreshRowCounter();

    console.log(
      `[MySQL Realtime] Terkoneksi ke database '${currentConfig.database}' (${currentConfig.host}:${currentConfig.port}) - Latensi: ${lastPingLatencyMs}ms`
    );
    return true;
  } catch (err: any) {
    isConnected = false;
    lastError = err?.message || 'Gagal terhubung ke MySQL server';
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }
    console.warn(
      `[MySQL Realtime] Koneksi MySQL gagal (${lastError}). Operasi data risiko memerlukan MySQL aktif.`
    );
    return false;
  }
}

/**
 * Status koneksi MySQL saat ini secara real-time
 */
export function getMySqlStatus() {
  return {
    isConnected,
    host: activeConfig.host,
    port: activeConfig.port,
    user: activeConfig.user,
    database: activeConfig.database,
    lastError,
    lastConnectAttempt,
    lastPingLatencyMs,
    totalMySqlRows,
    configLocation: {
      tsBackend: 'server/mysql.ts',
      envFile: '.env',
      goBackend: 'server/backend_go/main.go',
      schemaSql: 'server/backend_go/schema.sql'
    }
  };
}

/**
 * Sinkronkan Master Organisasi / Departemen ke MySQL
 */
export async function syncDepartmentsToMySql(departments: OrganizationMaster[]): Promise<number> {
  if (!pool || !isConnected || !Array.isArray(departments)) return 0;
  let saved = 0;

  for (const d of departments) {
    if (!d || !d.kode) continue;
    const kode = normalizeOrgCode(d.kode);
    const email = `${kode.toLowerCase().replace(/[^a-z0-9]/g, '')}@pusri.co.id`;
    const jabatan =
      d.kepalaUnit?.includes('VP') || d.kepalaUnit?.includes('Vice President')
        ? d.kepalaUnit
        : `Vice President ${d.nama}`;
    const officersJson = d.officers ? JSON.stringify(d.officers) : null;
    const ownersJson = d.owners ? JSON.stringify(d.owners) : null;

    try {
      if (orgIdIsAutoIncrement) {
        await pool.execute(
          `INSERT INTO \`master_organisasi\` (
            \`kode\`, \`nama\`, \`direktorat\`, \`kepala_unit\`, \`jabatan_kepala\`, \`email_unit\`, \`total_risiko\`, \`officers_json\`, \`owners_json\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            \`nama\` = VALUES(\`nama\`),
            \`direktorat\` = VALUES(\`direktorat\`),
            \`kepala_unit\` = VALUES(\`kepala_unit\`),
            \`jabatan_kepala\` = VALUES(\`jabatan_kepala\`),
            \`total_risiko\` = VALUES(\`total_risiko\`),
            \`officers_json\` = VALUES(\`officers_json\`),
            \`owners_json\` = VALUES(\`owners_json\`),
            \`updated_at\` = CURRENT_TIMESTAMP`,
          [
            kode,
            d.nama,
            d.direktorat || 'Direktorat Operasi & Produksi',
            d.kepalaUnit || 'VP Unit Kerja',
            jabatan,
            email,
            Number(d.totalRisiko) || 0,
            officersJson,
            ownersJson
          ]
        );
      } else {
        await pool.execute(
          `INSERT INTO \`master_organisasi\` (
            \`id\`, \`kode\`, \`nama\`, \`direktorat\`, \`kepala_unit\`, \`jabatan_kepala\`, \`email_unit\`, \`total_risiko\`, \`officers_json\`, \`owners_json\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            \`nama\` = VALUES(\`nama\`),
            \`direktorat\` = VALUES(\`direktorat\`),
            \`kepala_unit\` = VALUES(\`kepala_unit\`),
            \`jabatan_kepala\` = VALUES(\`jabatan_kepala\`),
            \`total_risiko\` = VALUES(\`total_risiko\`),
            \`officers_json\` = VALUES(\`officers_json\`),
            \`owners_json\` = VALUES(\`owners_json\`),
            \`updated_at\` = CURRENT_TIMESTAMP`,
          [
            `ORG-${kode}`,
            kode,
            d.nama,
            d.direktorat || 'Direktorat Operasi & Produksi',
            d.kepalaUnit || 'VP Unit Kerja',
            jabatan,
            email,
            Number(d.totalRisiko) || 0,
            officersJson,
            ownersJson
          ]
        );
      }
      saved++;
    } catch (err: any) {
      console.warn(`[MySQL Sync Org] ${kode}:`, err?.message);
    }
  }
  return saved;
}

export async function loadDepartmentsFromMySql(): Promise<OrganizationMaster[] | null> {
  if (!pool || !isConnected) return null;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT `kode`, `nama`, `direktorat`, `kepala_unit`, `total_risiko`, `officers_json`, `owners_json` FROM `master_organisasi` WHERE COALESCE(`is_active`, 1) = 1 ORDER BY `nama`'
    );
    return rows.map((row) => ({
      kode: normalizeOrgCode(String(row.kode || '')),
      nama: String(row.nama || ''),
      direktorat: String(row.direktorat || ''),
      kepalaUnit: String(row.kepala_unit || ''),
      totalRisiko: Number(row.total_risiko) || 0,
      officers: row.officers_json ? JSON.parse(String(row.officers_json)) : [],
      owners: row.owners_json ? JSON.parse(String(row.owners_json)) : []
    }));
  } catch (err) {
    console.error('[MySQL Read Error] Gagal membaca master_organisasi:', err);
    return null;
  }
}

/**
 * Sinkronkan Akun Pengguna & IAM SSO ke MySQL
 */
export async function syncUsersToMySql(users: UserAccount[]): Promise<number> {
  if (!pool || !isConnected || !Array.isArray(users)) return 0;
  let saved = 0;

  for (const u of users) {
    if (!u || !u.id || !u.username) continue;
    const pwd = u.password || 'portal123';
    const kodeUnit = normalizeOrgCode(u.kodeUnitKerja || 'OP-IIB');
    try {
      await pool.execute(
        `INSERT INTO \`user_accounts\` (
          \`id\`, \`username\`, \`nama\`, \`nik\`, \`badge\`, \`password\`, \`password_hash\`,
          \`role\`, \`jabatan\`, \`jabatan_pengajuan\`, \`unit_kerja\`, \`kode_unit\`, \`kode_unit_kerja\`,
          \`email\`, \`account_status\`, \`auth_provider\`, \`failed_login_attempts\`, \`locked_until\`,
          \`approved_by\`, \`last_login_at\`, \`avatar\`, \`is_active\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          \`nama\` = VALUES(\`nama\`),
          \`nik\` = VALUES(\`nik\`),
          \`badge\` = VALUES(\`badge\`),
          \`password\` = VALUES(\`password\`),
          \`password_hash\` = VALUES(\`password_hash\`),
          \`role\` = VALUES(\`role\`),
          \`jabatan\` = VALUES(\`jabatan\`),
          \`jabatan_pengajuan\` = VALUES(\`jabatan_pengajuan\`),
          \`unit_kerja\` = VALUES(\`unit_kerja\`),
          \`kode_unit\` = VALUES(\`kode_unit\`),
          \`kode_unit_kerja\` = VALUES(\`kode_unit_kerja\`),
          \`email\` = VALUES(\`email\`),
          \`account_status\` = VALUES(\`account_status\`),
          \`auth_provider\` = VALUES(\`auth_provider\`),
          \`failed_login_attempts\` = VALUES(\`failed_login_attempts\`),
          \`locked_until\` = VALUES(\`locked_until\`),
          \`approved_by\` = VALUES(\`approved_by\`),
          \`last_login_at\` = VALUES(\`last_login_at\`),
          \`avatar\` = VALUES(\`avatar\`),
          \`is_active\` = VALUES(\`is_active\`),
          \`updated_at\` = CURRENT_TIMESTAMP`,
        [
          u.id,
          u.username,
          u.nama,
          u.nik || u.badge || null,
          u.badge || u.nik || null,
          pwd,
          pwd,
          u.role || 'risk officer',
          u.jabatan || null,
          u.jabatanPengajuan || u.jabatan || null,
          u.unitKerja || 'Departemen Operasi Pabrik Pusri IIB',
          kodeUnit,
          kodeUnit,
          u.email || `${u.username.toLowerCase()}@pusri.co.id`,
          u.accountStatus || 'active',
          u.authProvider || 'PUSRI_IAM_SSO',
          Number(u.failedLoginAttempts) || 0,
          u.lockedUntil || null,
          u.approvedBy || null,
          u.lastLoginAt || null,
          u.avatarUrl || null,
          u.accountStatus === 'suspended' ? 0 : 1
        ]
      );
      saved++;
    } catch (err: any) {
      console.warn(`[MySQL Sync User] ${u.username}:`, err?.message);
    }
  }
  return saved;
}

export async function loadUsersFromMySql(): Promise<UserAccount[] | null> {
  if (!pool || !isConnected) return null;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT `id`, `username`, `nama`, `nik`, `badge`, `password`, `password_hash`, `role`, `jabatan`, `jabatan_pengajuan`, `unit_kerja`, `kode_unit_kerja`, `email`, `account_status`, `auth_provider`, `failed_login_attempts`, `locked_until`, `approved_by`, `last_login_at`, `avatar`, `created_at` FROM `user_accounts` ORDER BY `created_at`, `id`'
    );
    return rows.map((row) => ({
      id: String(row.id),
      username: String(row.username),
      nama: String(row.nama),
      nik: row.nik ? String(row.nik) : undefined,
      badge: row.badge ? String(row.badge) : undefined,
      password: String(row.password_hash || row.password || ''),
      role: normalizeUserRole(String(row.role || 'risk officer')),
      jabatan: row.jabatan ? String(row.jabatan) : undefined,
      jabatanPengajuan: row.jabatan_pengajuan ? String(row.jabatan_pengajuan) : undefined,
      unitKerja: String(row.unit_kerja || ''),
      kodeUnitKerja: normalizeOrgCode(String(row.kode_unit_kerja || '')),
      email: row.email ? String(row.email) : undefined,
      accountStatus: String(row.account_status || 'active') as UserAccount['accountStatus'],
      authProvider: String(row.auth_provider || 'PUSRI_IAM_SSO') as UserAccount['authProvider'],
      lastLoginAt: row.last_login_at ? String(row.last_login_at) : undefined,
      failedLoginAttempts: Number(row.failed_login_attempts) || 0,
      lockedUntil: row.locked_until ? String(row.locked_until) : null,
      approvedBy: row.approved_by ? String(row.approved_by) : undefined,
      avatarUrl: row.avatar ? String(row.avatar) : undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
    }));
  } catch (err) {
    console.error('[MySQL Read Error] Gagal membaca user_accounts:', err);
    return null;
  }
}

export async function findPasswordResetUserInMySql(
  identifier: string,
  email: string
): Promise<UserAccount | null> {
  if (!pool || !isConnected) {
    throw new Error('Koneksi MySQL belum tersedia.');
  }
  const cleanIdentifier = identifier.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanIdentifier || !cleanEmail) return null;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT \`id\`, \`username\`, \`nama\`, \`nik\`, \`badge\`, \`password\`, \`password_hash\`,
      \`role\`, \`jabatan\`, \`jabatan_pengajuan\`, \`unit_kerja\`, \`kode_unit_kerja\`,
      \`email\`, \`account_status\`, \`auth_provider\`, \`failed_login_attempts\`,
      \`locked_until\`, \`approved_by\`, \`last_login_at\`, \`avatar\`, \`created_at\`
    FROM \`user_accounts\`
    WHERE (
      LOWER(TRIM(COALESCE(\`badge\`, ''))) = ?
      OR LOWER(TRIM(COALESCE(\`nik\`, ''))) = ?
      OR LOWER(TRIM(\`username\`)) = ?
    )
      AND LOWER(TRIM(COALESCE(\`email\`, ''))) = ?
    LIMIT 1`,
    [cleanIdentifier, cleanIdentifier, cleanIdentifier, cleanEmail]
  );
  const row = rows[0];
  if (!row) return null;

  return {
    id: String(row.id),
    username: String(row.username),
    nama: String(row.nama),
    nik: row.nik ? String(row.nik) : undefined,
    badge: row.badge ? String(row.badge) : undefined,
    password: String(row.password_hash || row.password || ''),
    role: normalizeUserRole(String(row.role || 'risk officer')),
    jabatan: row.jabatan ? String(row.jabatan) : undefined,
    jabatanPengajuan: row.jabatan_pengajuan ? String(row.jabatan_pengajuan) : undefined,
    unitKerja: String(row.unit_kerja || ''),
    kodeUnitKerja: normalizeOrgCode(String(row.kode_unit_kerja || '')),
    email: String(row.email || ''),
    accountStatus: String(row.account_status || 'active') as UserAccount['accountStatus'],
    authProvider: String(row.auth_provider || 'PUSRI_IAM_SSO') as UserAccount['authProvider'],
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : undefined,
    failedLoginAttempts: Number(row.failed_login_attempts) || 0,
    lockedUntil: row.locked_until ? String(row.locked_until) : null,
    approvedBy: row.approved_by ? String(row.approved_by) : undefined,
    avatarUrl: row.avatar ? String(row.avatar) : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  };
}

export async function createPasswordResetTicketInMySql(ticket: PasswordResetTicket): Promise<boolean> {
  if (!pool || !isConnected) throw new Error('Koneksi MySQL belum tersedia.');
  const [result] = await pool.execute(
    `INSERT INTO \`password_reset_tickets\`
      (\`id\`, \`identifier\`, \`user_name\`, \`badge\`, \`email\`, \`unit_kerja\`, \`reason\`, \`status\`, \`created_at\`)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ticket.id,
      ticket.identifier,
      ticket.userName || null,
      ticket.badge || null,
      ticket.email,
      ticket.unitKerja || null,
      ticket.reason,
      ticket.status,
      new Date(ticket.createdAt).toISOString().slice(0, 19).replace('T', ' ')
    ]
  );
  return Number((result as mysql.ResultSetHeader).affectedRows) === 1;
}

export async function migratePendingPasswordResetTicketsToMySql(
  tickets: PasswordResetTicket[]
): Promise<number> {
  if (!pool || !isConnected) throw new Error('Koneksi MySQL belum tersedia.');
  let migrated = 0;
  for (const ticket of tickets.filter((item) => item.status === 'pending')) {
    const [result] = await pool.execute(
      `INSERT IGNORE INTO \`password_reset_tickets\`
        (\`id\`, \`identifier\`, \`user_name\`, \`badge\`, \`email\`, \`unit_kerja\`, \`reason\`, \`status\`, \`created_at\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        ticket.id,
        ticket.identifier,
        ticket.userName || null,
        ticket.badge || null,
        ticket.email,
        ticket.unitKerja || null,
        ticket.reason,
        new Date(ticket.createdAt).toISOString().slice(0, 19).replace('T', ' ')
      ]
    );
    migrated += Number((result as mysql.ResultSetHeader).affectedRows) === 1 ? 1 : 0;
  }
  return migrated;
}

export async function loadPasswordResetTicketsFromMySql(): Promise<PasswordResetTicket[] | null> {
  if (!pool || !isConnected) return null;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT `id`, `identifier`, `user_name`, `badge`, `email`, `unit_kerja`, `reason`, `status`, `created_at`, `resolved_at`, `resolved_by` FROM `password_reset_tickets` ORDER BY `created_at` DESC'
    );
    return rows.map((row) => ({
      id: String(row.id),
      identifier: String(row.identifier),
      userName: row.user_name ? String(row.user_name) : undefined,
      badge: row.badge ? String(row.badge) : undefined,
      email: String(row.email),
      unitKerja: row.unit_kerja ? String(row.unit_kerja) : undefined,
      reason: String(row.reason || ''),
      status: String(row.status) as PasswordResetTicket['status'],
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : undefined,
      resolvedBy: row.resolved_by ? String(row.resolved_by) : undefined
    }));
  } catch (err) {
    console.error('[MySQL Read Error] Gagal membaca password_reset_tickets:', err);
    return null;
  }
}

export async function resolvePasswordResetTicketInMySql(
  ticketId: string,
  action: 'approve' | 'reject',
  newTemporaryPassword: string | undefined,
  resolvedBy: string
): Promise<{ success: boolean; message: string }> {
  if (!pool || !isConnected) {
    return { success: false, message: 'Koneksi MySQL belum tersedia.' };
  }
  if (action === 'approve' && (!newTemporaryPassword || newTemporaryPassword.trim().length < 8)) {
    return { success: false, message: 'Kata sandi sementara minimal 8 karakter.' };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT `id`, `identifier`, `status` FROM `password_reset_tickets` WHERE `id` = ? FOR UPDATE',
      [ticketId]
    );
    const ticket = rows[0];
    if (!ticket) {
      await connection.rollback();
      return { success: false, message: 'Tiket reset sandi tidak ditemukan.' };
    }
    if (ticket.status !== 'pending') {
      await connection.rollback();
      return { success: false, message: 'Tiket ini sudah diproses sebelumnya.' };
    }

    if (action === 'approve') {
      const passwordHash = hashPassword(newTemporaryPassword!.trim());
      const [userResult] = await connection.execute(
        `UPDATE \`user_accounts\`
         SET \`password\` = ?, \`password_hash\` = ?, \`failed_login_attempts\` = 0,
             \`locked_until\` = NULL, \`account_status\` = IF(\`account_status\` = 'locked', 'active', \`account_status\`),
             \`is_active\` = 1, \`updated_at\` = CURRENT_TIMESTAMP
         WHERE LOWER(TRIM(COALESCE(\`badge\`, ''))) = LOWER(TRIM(?))
            OR LOWER(TRIM(COALESCE(\`nik\`, ''))) = LOWER(TRIM(?))
            OR LOWER(TRIM(\`username\`)) = LOWER(TRIM(?))`,
        [passwordHash, passwordHash, String(ticket.identifier), String(ticket.identifier), String(ticket.identifier)]
      );
      if (Number((userResult as mysql.ResultSetHeader).affectedRows) < 1) {
        await connection.rollback();
        return { success: false, message: 'Akun terkait tidak ditemukan di MySQL.' };
      }
      await connection.execute(
        'UPDATE `password_reset_tickets` SET `temporary_password` = ?, `temporary_password_hash` = ? WHERE `id` = ?',
        [newTemporaryPassword!.trim(), passwordHash, ticketId]
      );
    }

    await connection.execute(
      'UPDATE `password_reset_tickets` SET `status` = ?, `resolved_at` = CURRENT_TIMESTAMP, `resolved_by` = ? WHERE `id` = ?',
      [action === 'approve' ? 'resolved' : 'rejected', resolvedBy, ticketId]
    );
    await connection.commit();
    return {
      success: true,
      message: action === 'approve' ? 'Kata sandi sementara berhasil disimpan ke MySQL.' : 'Tiket reset sandi telah ditolak.'
    };
  } catch (err) {
    await connection.rollback();
    console.error('[MySQL Reset Ticket Error]:', err);
    return { success: false, message: 'Gagal memproses tiket reset kata sandi di MySQL.' };
  } finally {
    connection.release();
  }
}

export async function updateUserAvatarInMySql(userId: string, avatarUrl: string | null): Promise<boolean> {
  if (!pool || !isConnected) return false;
  const [result] = await pool.execute(
    'UPDATE `user_accounts` SET `avatar` = ?, `updated_at` = CURRENT_TIMESTAMP WHERE `id` = ?',
    [avatarUrl, userId]
  );
  return Number((result as mysql.ResultSetHeader).affectedRows) > 0;
}

/**
 * Sinkronkan Audit Logs & Sync Events ke MySQL
 */
export async function syncAuditAndEventsToMySql(
  auditLogs: AuditLog[],
  syncEvents: ApiSyncEvent[]
): Promise<{ audits: number; events: number }> {
  if (!pool || !isConnected) return { audits: 0, events: 0 };
  let audits = 0;
  let events = 0;

  for (const log of auditLogs.slice(0, 100)) {
    if (!log || !log.id) continue;
    try {
      await pool.execute(
        `INSERT IGNORE INTO \`audit_log_risiko\` (
          \`id\`, \`risk_id\`, \`kode_risiko\`, \`user_role\`, \`actor_name\`, \`action\`,
          \`previous_status\`, \`new_status\`, \`notes\`, \`latency_ms\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          log.riskId || '',
          log.kodeRisiko || log.riskId || '',
          String(log.userRole || 'risk officer'),
          log.actorName || 'Risk System',
          log.action || 'UPDATED',
          log.previousStatus || null,
          log.newStatus || null,
          log.notes || '',
          Number(log.latencyMs) || 4.2
        ]
      );
      audits++;
    } catch {}
  }

  for (const ev of syncEvents.slice(0, 80)) {
    if (!ev || !ev.id) continue;
    try {
      await pool.execute(
        `INSERT IGNORE INTO \`sync_event_modul\` (
          \`id\`, \`module_source\`, \`module_target\`, \`endpoint\`, \`method\`, \`status\`, \`duration_ms\`, \`payload_summary\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ev.id,
          ev.moduleSource || 'Portal Risiko',
          ev.moduleTarget || 'MySQL Database',
          ev.endpoint || '/api/sync',
          ev.method || 'POST',
          ev.status || 'SYNCED',
          Number(ev.durationMs) || 4.5,
          ev.payloadSummary || ''
        ]
      );
      events++;
    } catch {}
  }

  return { audits, events };
}

/**
 * Simpan / perbarui 1 risiko beserta pengendalian_triwulan, pelaksanaan_tindakan, dan carry_over ke MySQL
 */
export async function saveRiskToMySql(risk: PusriRisk): Promise<boolean> {
  if (!pool || !isConnected) return false;

  const cleanKodeOrg = normalizeOrgCode(risk.kodeOrganisasi);
  const cleanNamaOrg = risk.namaOrganisasi || 'Departemen Operasi Pabrik Pusri IIB';

  try {
    // Pastikan FK master_organisasi selalu tersedia terlebih dahulu
    await ensureOrganizationExistsInMySql(cleanKodeOrg, cleanNamaOrg);

    const kAwal = Math.min(5, Math.max(1, Number(risk.kemungkinanAwal) || 1));
    const dAwal = Math.min(5, Math.max(1, Number(risk.dampakAwal) || 1));

    const cols = [
      'id',
      'kode_risiko',
      'kode_organisasi',
      'nama_organisasi',
      'tahun',
      'sasaran_rkap',
      'sasaran_unit_kerja',
      'konteks_eksternal',
      'konteks_internal',
      'sumber_risiko',
      'pernyataan_risiko',
      'penyebab_risiko',
      'dampak_risiko',
      'pengendalian_existing',
      'kategori_risiko',
      'kriteria_dampak_key',
      'kriteria_dampak_title',
      'kriteria_dampak_level',
      'kemungkinan_awal',
      'dampak_awal',
      ...(riskInherentIsGenerated ? [] : ['inherent_score']),
      'tingkat_risiko_awal',
      'current_tingkat_risiko',
      'jenis_penanganan',
      'butuh_mitigasi',
      'status_kebutuhan_mitigasi',
      'alasan_kebutuhan_mitigasi',
      'rencana_penanganan',
      'target_waktu_mitigasi',
      'biaya_rencana_pengendalian',
      'pic_departemen',
      'pic_pelaksana',
      'pic_pengendali',
      'jenis_anggaran',
      'status_workflow',
      'status_pelaksanaan_terakhir',
      'progress_pelaksanaan_terakhir',
      'review_notes_vp',
      'approval_notes_admin',
      'diperbarui_oleh',
      'user_progres',
      'created_by',
      'created_date',
      'updated_date'
    ];

    const values: any[] = [
      risk.id,
      risk.kodeRisiko || risk.id,
      cleanKodeOrg,
      cleanNamaOrg,
      Number(risk.tahun) || 2026,
      risk.sasaranRKAP || '-',
      risk.sasaranUnitKerja || '-',
      risk.konteksEksternal || '-',
      risk.konteksInternal || '-',
      risk.sumberRisiko || 'Operasional',
      risk.pernyataanRisiko || '-',
      risk.penyebabRisiko || '-',
      risk.dampakRisiko || '-',
      risk.pengendalianExisting || '-',
      risk.kategoriRisiko || 'Operasional',
      risk.kriteriaDampakKey || null,
      risk.kriteriaDampakTitle || null,
      risk.kriteriaDampakLevel !== undefined ? Number(risk.kriteriaDampakLevel) : dAwal,
      kAwal,
      dAwal,
      ...(riskInherentIsGenerated ? [] : [kAwal * dAwal]),
      risk.tingkatRisikoAwal || 'Moderate',
      risk.currentTingkatRisiko || risk.tingkatRisikoAwal || 'Moderate',
      risk.jenisPenanganan || 'Mitigasi',
      risk.butuhMitigasi ? 1 : 0,
      risk.statusKebutuhanMitigasi || (risk.butuhMitigasi ? 'Wajib Mitigasi' : 'Toleransi Standar'),
      risk.alasanKebutuhanMitigasi || '-',
      risk.rencanaPenanganan || '-',
      String(risk.targetWaktuMitigasi || 'TW 2').slice(0, 125),
      Number(risk.biayaRencanaPengendalian) || 0,
      risk.picDepartemen || null,
      risk.picPelaksana || '-',
      risk.picPengendali || 'VP Departemen',
      String(risk.jenisAnggaran || 'Investasi Rutin / OPEX').slice(0, 125),
      risk.statusWorkflow || 'Menunggu_Approval_VP',
      risk.statusPelaksanaanTerakhir || 'Belum Dilaksanakan',
      Number(risk.progressPelaksanaanTerakhir) || 0,
      risk.reviewNotesVp || null,
      risk.approvalNotesAdmin || null,
      risk.diperbaruiOleh || null,
      risk.userProgres || null,
      risk.createdBy || 'Risk Officer',
      risk.createdDate || new Date().toISOString(),
      risk.updatedDate || new Date().toISOString()
    ];

    const placeholders = cols.map(() => '?').join(', ');
    const updatableCols = cols.filter((c) => c !== 'id');
    const updateAssignments = updatableCols.map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(',\n      ');

    const sql = `
      INSERT INTO \`pusri_risks\` (${cols.map((c) => `\`${c}\``).join(', ')})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE
      ${updateAssignments},
      \`updated_at\` = CURRENT_TIMESTAMP
    `;

    await pool.execute(sql, values);

    // 1. Sinkronisasi ke pengendalian_triwulan (TW 1 - TW 4)
    if (Array.isArray(risk.pengendalianTriwulan) && risk.pengendalianTriwulan.length > 0) {
      for (const ctrl of risk.pengendalianTriwulan) {
        const kRes = Math.min(5, Math.max(1, Number(ctrl.kemungkinanResidual) || 1));
        const dRes = Math.min(5, Math.max(1, Number(ctrl.dampakResidual) || 1));
        const detailJson = JSON.stringify({
          kemungkinanUsulanPic: ctrl.kemungkinanUsulanPic,
          dampakUsulanPic: ctrl.dampakUsulanPic,
          tingkatUsulanPic: ctrl.tingkatUsulanPic,
          catatanUsulanPic: ctrl.catatanUsulanPic,
          kesimpulanPenilaianAdmin: ctrl.kesimpulanPenilaianAdmin,
          catatanPenilaianRisikoAdmin: ctrl.catatanPenilaianRisikoAdmin,
          pengendalianLanjutanDesc: ctrl.pengendalianLanjutanDesc,
          picDepartemenBaru: ctrl.picDepartemenBaru,
          picPelaksanaBaru: ctrl.picPelaksanaBaru,
          picPengendaliBaru: ctrl.picPengendaliBaru,
          targetWaktuLanjutan: ctrl.targetWaktuLanjutan
        });

        const twColNames = [
          ...(twIdIsAutoIncrement ? [] : ['id']),
          'risk_id',
          'kode_risiko',
          'triwulan',
          'realisasi_kegiatan',
          'realisasi_biaya',
          'progress_persen',
          'progress_fisik_pic',
          'progres_pengerjaan_admin',
          'kemungkinan_residual',
          'dampak_residual',
          ...(twResidualIsGenerated ? [] : ['residual_score']),
          'tingkat_residual',
          'status_pengendalian',
          'kendala_dan_tindak_lanjut',
          'reported_by',
          'pic_report_date',
          'is_pic_acc',
          'acc_by',
          'acc_date',
          'catatan_admin_acc',
          'status_keputusan',
          'catatan_evaluasi_admin',
          'tanggal_evaluasi',
          'dievaluasi_oleh',
          'detail_evaluasi_json'
        ];

        const twValues: any[] = [
          ...(twIdIsAutoIncrement ? [] : [`CTRL-${risk.id}-${ctrl.triwulan.replace(/\s+/g, '')}`]),
          risk.id,
          risk.kodeRisiko || risk.id,
          ctrl.triwulan,
          ctrl.realisasiKegiatan || `Realisasi mitigasi ${ctrl.triwulan}`,
          Number(ctrl.realisasiBiaya) || 0,
          Number(ctrl.progressPersen) || 0,
          ctrl.progressFisikPic !== undefined ? Number(ctrl.progressFisikPic) : Number(ctrl.progressPersen) || 0,
          ctrl.progresPengerjaanAdmin !== undefined ? Number(ctrl.progresPengerjaanAdmin) : null,
          kRes,
          dRes,
          ...(twResidualIsGenerated ? [] : [kRes * dRes]),
          ctrl.tingkatResidual || 'Moderate',
          ctrl.statusPengendalian || 'On Track',
          ctrl.kendalaDanTindakLanjut || '-',
          ctrl.reportedBy || risk.picPelaksana || 'PIC Pelaksana',
          ctrl.picReportDate || null,
          ctrl.isPicAcc ? 1 : 0,
          ctrl.accBy || null,
          ctrl.accDate || null,
          ctrl.catatanAdminAcc || null,
          ctrl.statusKeputusan || null,
          ctrl.catatanEvaluasiAdmin || null,
          ctrl.tanggalEvaluasi || null,
          ctrl.dievaluasiOleh || null,
          detailJson
        ];

        const twUpdateCols = twColNames.filter((c) => c !== 'id' && c !== 'risk_id' && c !== 'triwulan');
        const twSql = `
          INSERT INTO \`pengendalian_triwulan\` (${twColNames.map((c) => `\`${c}\``).join(', ')})
          VALUES (${twColNames.map(() => '?').join(', ')})
          ON DUPLICATE KEY UPDATE
          ${twUpdateCols.map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(', ')},
          \`updated_at\` = CURRENT_TIMESTAMP
        `;

        await pool.execute(twSql, twValues).catch((e) => console.warn('[MySQL Save TW]:', e?.message));
      }
    }

    // 2. Sinkronisasi ke pelaksanaan_tindakan
    if (Array.isArray(risk.pelaksanaanTindakan) && risk.pelaksanaanTindakan.length > 0) {
      for (let i = 0; i < risk.pelaksanaanTindakan.length; i++) {
        const act = risk.pelaksanaanTindakan[i];
        const actId = act.id || `ACT-${risk.kodeRisiko || risk.id}-${String(i + 1).padStart(2, '0')}`;
        const actSql = `
          INSERT INTO \`pelaksanaan_tindakan\` (
            \`id\`, \`risk_id\`, \`kode_risiko\`, \`triwulan\`, \`tanggal_pelaksanaan\`,
            \`pic_pelaksana\`, \`uraian_tindakan\`, \`progress_persen\`, \`status_pelaksanaan\`,
            \`realisasi_biaya\`, \`efektivitas\`, \`kendala_dan_hambatan\`, \`tindak_lanjut\`,
            \`nomor_bukti_dokumen\`, \`catatan_admin\`, \`is_acc_admin\`, \`acc_admin_by\`,
            \`acc_admin_date\`, \`diperbarui_oleh\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            \`triwulan\` = VALUES(\`triwulan\`),
            \`tanggal_pelaksanaan\` = VALUES(\`tanggal_pelaksanaan\`),
            \`pic_pelaksana\` = VALUES(\`pic_pelaksana\`),
            \`uraian_tindakan\` = VALUES(\`uraian_tindakan\`),
            \`progress_persen\` = VALUES(\`progress_persen\`),
            \`status_pelaksanaan\` = VALUES(\`status_pelaksanaan\`),
            \`realisasi_biaya\` = VALUES(\`realisasi_biaya\`),
            \`efektivitas\` = VALUES(\`efektivitas\`),
            \`kendala_dan_hambatan\` = VALUES(\`kendala_dan_hambatan\`),
            \`tindak_lanjut\` = VALUES(\`tindak_lanjut\`),
            \`nomor_bukti_dokumen\` = VALUES(\`nomor_bukti_dokumen\`),
            \`catatan_admin\` = VALUES(\`catatan_admin\`),
            \`is_acc_admin\` = VALUES(\`is_acc_admin\`),
            \`acc_admin_by\` = VALUES(\`acc_admin_by\`),
            \`acc_admin_date\` = VALUES(\`acc_admin_date\`),
            \`diperbarui_oleh\` = VALUES(\`diperbarui_oleh\`),
            \`updated_at\` = CURRENT_TIMESTAMP
        `;
        await pool
          .execute(actSql, [
            actId,
            risk.id,
            risk.kodeRisiko || risk.id,
            act.triwulan || null,
            normalizeSqlDate(act.tanggalPelaksanaan),
            act.picPelaksana || risk.picPelaksana || 'PIC Pelaksana',
            act.uraianTindakan || '-',
            Number(act.progressPersen) || 0,
            act.statusPelaksanaan || 'Belum Dilaksanakan',
            Number(act.realisasiBiaya) || 0,
            act.efektivitas || 'Belum Dinilai',
            act.kendalaDanHambatan || '-',
            act.tindakLanjut || '-',
            act.nomorBuktiDokumen || null,
            act.catatanAdmin || null,
            act.isAccAdmin ? 1 : 0,
            act.accAdminBy || null,
            act.accAdminDate || null,
            act.diperbaruiOleh || risk.diperbaruiOleh || 'Risk Officer'
          ])
          .catch((e) => console.warn('[MySQL Save Action]:', e?.message));
      }
    }

    // 3. Sinkronisasi ke carry_over (HANYA risiko dengan statusWorkflow === 'Carry_Over')
    if (risk.statusWorkflow === 'Carry_Over') {
      const carryId = `CO-${risk.id}`;
      const alasan =
        risk.carryOverInfo?.alasanCarryOver ||
        'Program mitigasi multi-tahun memerlukan tindak lanjut di RKAP berikutnya.';
      const rekomendasi =
        risk.carryOverInfo?.rekomendasiKomite ||
        'Disetujui Komite Manajemen Risiko Pusri untuk dilanjutkan ke periode target.';
      const approver = risk.carryOverInfo?.approvalCarryOverBy || 'Komite Manajemen Risiko Pusri';
      const targetTahun = Number(risk.carryOverInfo?.targetTahun) || 2027;
      const tgl = normalizeSqlDate(risk.carryOverInfo?.tanggalCarryOver);
      const lastProgress =
        risk.pengendalianTriwulan && risk.pengendalianTriwulan.length > 0
          ? Number(risk.pengendalianTriwulan[risk.pengendalianTriwulan.length - 1].progressPersen) || 0
          : Number(risk.progressPelaksanaanTerakhir) || 0;

      const carrySql = `
        INSERT INTO \`carry_over\` (
          \`id\`, \`risk_id\`, \`kode_risiko\`, \`nama_organisasi\`, \`pernyataan_risiko\`,
          \`kategori_risiko\`, \`current_tingkat_risiko\`, \`status_workflow\`, \`progress_terakhir\`,
          \`target_tahun\`, \`alasan_carry_over\`, \`rekomendasi_komite\`, \`approval_carry_over_by\`,
          \`tanggal_carry_over\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          \`nama_organisasi\` = VALUES(\`nama_organisasi\`),
          \`pernyataan_risiko\` = VALUES(\`pernyataan_risiko\`),
          \`kategori_risiko\` = VALUES(\`kategori_risiko\`),
          \`current_tingkat_risiko\` = VALUES(\`current_tingkat_risiko\`),
          \`status_workflow\` = VALUES(\`status_workflow\`),
          \`progress_terakhir\` = VALUES(\`progress_terakhir\`),
          \`target_tahun\` = VALUES(\`target_tahun\`),
          \`alasan_carry_over\` = VALUES(\`alasan_carry_over\`),
          \`rekomendasi_komite\` = VALUES(\`rekomendasi_komite\`),
          \`approval_carry_over_by\` = VALUES(\`approval_carry_over_by\`),
          \`tanggal_carry_over\` = VALUES(\`tanggal_carry_over\`),
          \`updated_at\` = CURRENT_TIMESTAMP
      `;
      await pool
        .execute(carrySql, [
          carryId,
          risk.id,
          risk.kodeRisiko || risk.id,
          cleanNamaOrg,
          risk.pernyataanRisiko || '-',
          risk.kategoriRisiko || 'Operasional',
          risk.currentTingkatRisiko || 'Moderate',
          risk.statusWorkflow,
          lastProgress,
          targetTahun,
          alasan,
          rekomendasi,
          approver,
          tgl
        ])
        .catch((e) => console.warn('[MySQL Save CarryOver]:', e?.message));
    } else {
      await pool.execute('DELETE FROM `carry_over` WHERE `risk_id` = ?', [risk.id]).catch(() => {});
    }

    await refreshRowCounter();
    return true;
  } catch (err: any) {
    console.error(`[MySQL Sync Error] Gagal menyimpan '${risk.kodeRisiko}':`, err?.message);
    return false;
  }
}

/**
 * Hapus risiko dari MySQL beserta seluruh tabel anak terkait
 */
export async function deleteRiskFromMySql(riskId: string): Promise<boolean> {
  if (!pool || !isConnected) return false;
  try {
    await pool.execute('DELETE FROM `carry_over` WHERE `risk_id` = ?', [riskId]).catch(() => {});
    await pool.execute('DELETE FROM `pelaksanaan_tindakan` WHERE `risk_id` = ?', [riskId]).catch(() => {});
    await pool.execute('DELETE FROM `pengendalian_triwulan` WHERE `risk_id` = ?', [riskId]).catch(() => {});
    await pool.execute('DELETE FROM `pusri_risks` WHERE `id` = ?', [riskId]);
    await refreshRowCounter();
    return true;
  } catch (err: any) {
    console.error(`[MySQL Sync Error] Gagal menghapus '${riskId}':`, err?.message);
    return false;
  }
}

/**
 * Sinkronkan seluruh data risiko ke MySQL
 */
export async function syncAllRisksToMySql(risks: PusriRisk[]): Promise<number> {
  let count = 0;
  for (const r of risks) {
    const ok = await saveRiskToMySql(r);
    if (ok) count++;
  }
  await refreshRowCounter();
  return count;
}

export async function syncSumberRisikoToMySql(groups: SumberRisikoGroup[]): Promise<number> {
  if (!pool || !isConnected) return 0;
  try {
    await pool.query('DELETE FROM `master_sumber_risiko`');
    let saved = 0;
    for (const g of groups) {
      const kat = (g.kategori || '').trim();
      if (!kat) continue;
      for (let idx = 0; idx < (g.items || []).length; idx++) {
        const item = (g.items[idx] || '').trim();
        if (!item) continue;
        await pool.execute(
          'INSERT INTO `master_sumber_risiko` (`kategori`, `sumber_risiko`, `urutan`, `dibuat_oleh`) VALUES (?, ?, ?, ?)',
          [kat, item, idx + 1, g.updatedBy || 'Risk Admin']
        );
        saved++;
      }
    }
    return saved;
  } catch (err: any) {
    console.warn('[MySQL Sumber Risiko Sync Notice]:', err?.message);
    return 0;
  }
}

export async function loadSumberRisikoFromMySql(): Promise<SumberRisikoGroup[] | null> {
  if (!pool || !isConnected) return null;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM `master_sumber_risiko` ORDER BY `id` ASC, `urutan` ASC'
    );
    if (!rows || rows.length === 0) return [];
    const grouped = new Map<string, SumberRisikoGroup>();
    for (const row of rows) {
      const kat = String(row.kategori || '').trim();
      const val = String(row.sumber_risiko || '').trim();
      if (!kat || !val) continue;
      if (!grouped.has(kat)) {
        grouped.set(kat, {
          kategori: kat,
          items: [],
          updatedBy: row.dibuat_oleh ? String(row.dibuat_oleh) : 'Risk Admin',
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
        });
      }

      const grp = grouped.get(kat)!;
      if (!grp.items.includes(val)) {
        grp.items.push(val);
      }
    }
    return Array.from(grouped.values());
  } catch {
    return null;
  }
}

export async function loadMasterLikelihoodConsequenceFromMySql(): Promise<MasterLikelihoodConsequenceRow[]> {
  if (!pool || !isConnected) {
    throw new Error('Koneksi MySQL belum tersedia.');
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT `id`, `likelihood`, `keterangan_en`, `keterangan_id`, `c1`, `c2`, `c3`, `c4`, `c5`, `status` FROM `master_likelihood_consequence` ORDER BY `likelihood` ASC'
  );
  return rows.map((row) => ({
    id: String(row.id),
    likelihood: Number(row.likelihood),
    keteranganEn: String(row.keterangan_en),
    keteranganId: String(row.keterangan_id),
    c1: String(row.c1),
    c2: String(row.c2),
    c3: String(row.c3),
    c4: String(row.c4),
    c5: String(row.c5),
    status: row.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif'
  }));
}

export async function replaceMasterLikelihoodConsequenceInMySql(
  rows: MasterLikelihoodConsequenceRow[]
): Promise<void> {
  if (!pool || !isConnected) {
    throw new Error('Koneksi MySQL belum tersedia.');
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM `master_likelihood_consequence`');
    for (const row of rows) {
      await connection.execute(
        'INSERT INTO `master_likelihood_consequence` (`id`, `likelihood`, `keterangan_en`, `keterangan_id`, `c1`, `c2`, `c3`, `c4`, `c5`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [row.id, row.likelihood, row.keteranganEn, row.keteranganId, row.c1, row.c2, row.c3, row.c4, row.c5, row.status]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Sinkronisasi penuh seluruh entitas database (Organisasi, Sumber Risiko, Users, Risks, TW, Actions, CarryOver, Audit, SyncEvents)
 */
export async function syncFullDatabaseToMySql(payload: {
  departments: OrganizationMaster[];
  sumberRisiko?: SumberRisikoGroup[];
  users: UserAccount[];
  risks: PusriRisk[];
  auditLogs: AuditLog[];
  syncEvents: ApiSyncEvent[];
}): Promise<{
  connected: boolean;
  departmentsSaved: number;
  sumberRisikoSaved: number;
  usersSaved: number;
  risksSaved: number;
  auditsSaved: number;
  eventsSaved: number;
}> {
  if (!pool || !isConnected) {
    return {
      connected: false,
      departmentsSaved: 0,
      sumberRisikoSaved: 0,
      usersSaved: 0,
      risksSaved: 0,
      auditsSaved: 0,
      eventsSaved: 0
    };
  }

  const departmentsSaved = await syncDepartmentsToMySql(payload.departments);
  const sumberRisikoSaved = payload.sumberRisiko
    ? await syncSumberRisikoToMySql(payload.sumberRisiko)
    : 0;
  const usersSaved = await syncUsersToMySql(payload.users);
  const risksSaved = await syncAllRisksToMySql(payload.risks);
  const { audits: auditsSaved, events: eventsSaved } = await syncAuditAndEventsToMySql(
    payload.auditLogs,
    payload.syncEvents
  );

  // Bersihkan carry_over yatim jika ada risiko yang bukan Carry_Over lagi
  const validCarryIds = new Set(
    payload.risks.filter((r) => r.statusWorkflow === 'Carry_Over').map((r) => r.id)
  );
  try {
    const [coRows] = await pool.query<RowDataPacket[]>('SELECT `risk_id` FROM `carry_over`');
    for (const row of coRows) {
      if (row.risk_id && !validCarryIds.has(String(row.risk_id))) {
        await pool.execute('DELETE FROM `carry_over` WHERE `risk_id` = ?', [row.risk_id]).catch(() => {});
      }
    }
  } catch {}

  await refreshRowCounter();
  return {
    connected: true,
    departmentsSaved,
    sumberRisikoSaved,
    usersSaved,
    risksSaved,
    auditsSaved,
    eventsSaved
  };
}

/**
 * Ambil seluruh data risiko dari MySQL lengkap dengan TW, Pelaksanaan Tindakan, dan Carry Over
 */
export async function loadRisksFromMySql(): Promise<PusriRisk[] | null> {
  if (!pool || !isConnected) return null;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM `pusri_risks` ORDER BY `created_at` DESC, `id` DESC'
    );
    if (!rows || rows.length === 0) return [];

    const controlsByRiskId: Record<string, QuarterlyControl[]> = {};
    try {
      const [ctrlRows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM `pengendalian_triwulan` ORDER BY `triwulan` ASC'
      );
      if (Array.isArray(ctrlRows)) {
        ctrlRows.forEach((c: any) => {
          if (!controlsByRiskId[c.risk_id]) controlsByRiskId[c.risk_id] = [];
          let extra: any = {};
          if (c.detail_evaluasi_json) {
            try {
              extra = JSON.parse(String(c.detail_evaluasi_json));
            } catch {}
          }
          controlsByRiskId[c.risk_id].push({
            triwulan: c.triwulan,
            realisasiKegiatan: c.realisasi_kegiatan || '',
            realisasiBiaya: Number(c.realisasi_biaya) || 0,
            progressPersen: Number(c.progress_persen) || 0,
            progressFisikPic: c.progress_fisik_pic !== null && c.progress_fisik_pic !== undefined ? Number(c.progress_fisik_pic) : undefined,
            progresPengerjaanAdmin: c.progres_pengerjaan_admin !== null && c.progres_pengerjaan_admin !== undefined ? Number(c.progres_pengerjaan_admin) : undefined,
            kemungkinanResidual: Number(c.kemungkinan_residual) || 1,
            dampakResidual: Number(c.dampak_residual) || 1,
            tingkatResidual: c.tingkat_residual,
            statusPengendalian: c.status_pengendalian,
            kendalaDanTindakLanjut: c.kendala_dan_tindak_lanjut || '',
            reportedBy: c.reported_by || undefined,
            picReportDate: c.pic_report_date || undefined,
            isPicAcc: Boolean(c.is_pic_acc),
            accBy: c.acc_by || undefined,
            accDate: c.acc_date || undefined,
            catatanAdminAcc: c.catatan_admin_acc || undefined,
            statusKeputusan: c.status_keputusan || undefined,
            catatanEvaluasiAdmin: c.catatan_evaluasi_admin || undefined,
            tanggalEvaluasi: c.tanggal_evaluasi || undefined,
            dievaluasiOleh: c.dievaluasi_oleh || undefined,
            ...extra,
            updatedAt: c.updated_at ? new Date(c.updated_at).toISOString() : new Date().toISOString()
          });
        });
      }
    } catch {}

    const actionsByRiskId: Record<string, PelaksanaanTindakanRisiko[]> = {};
    try {
      const [actRows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM `pelaksanaan_tindakan` ORDER BY `tanggal_pelaksanaan` DESC, `created_at` DESC'
      );
      if (Array.isArray(actRows)) {
        actRows.forEach((a: any) => {
          if (!actionsByRiskId[a.risk_id]) actionsByRiskId[a.risk_id] = [];
          actionsByRiskId[a.risk_id].push({
            id: a.id,
            riskId: a.risk_id,
            kodeRisiko: a.kode_risiko,
            triwulan: a.triwulan || undefined,
            tanggalPelaksanaan: normalizeSqlDate(a.tanggal_pelaksanaan),
            picPelaksana: a.pic_pelaksana,
            uraianTindakan: a.uraian_tindakan,
            progressPersen: Number(a.progress_persen) || 0,
            statusPelaksanaan: a.status_pelaksanaan,
            realisasiBiaya: Number(a.realisasi_biaya) || 0,
            efektivitas: a.efektivitas,
            kendalaDanHambatan: a.kendala_dan_hambatan || '',
            tindakLanjut: a.tindak_lanjut || '',
            nomorBuktiDokumen: a.nomor_bukti_dokumen || undefined,
            catatanAdmin: a.catatan_admin || undefined,
            isAccAdmin: Boolean(a.is_acc_admin),
            accAdminBy: a.acc_admin_by || undefined,
            accAdminDate: a.acc_admin_date || undefined,
            diperbaruiOleh: a.diperbarui_oleh || 'Risk Officer',
            createdAt: a.created_at ? new Date(a.created_at).toISOString() : new Date().toISOString(),
            updatedAt: a.updated_at ? new Date(a.updated_at).toISOString() : new Date().toISOString()
          });
        });
      }
    } catch {}

    const carryOverByRiskId: Record<string, any> = {};
    try {
      const [coRows] = await pool.query<RowDataPacket[]>('SELECT * FROM `carry_over`');
      if (Array.isArray(coRows)) {
        coRows.forEach((co: any) => {
          carryOverByRiskId[co.risk_id] = {
            targetTahun: Number(co.target_tahun) || 2027,
            alasanCarryOver: co.alasan_carry_over,
            rekomendasiKomite: co.rekomendasi_komite,
            approvalCarryOverBy: co.approval_carry_over_by,
            tanggalCarryOver: normalizeSqlDate(co.tanggal_carry_over)
          };
        });
      }
    } catch {}

    return rows.map((r: any) => ({
      id: r.id,
      kodeRisiko: r.kode_risiko || r.id,
      kodeOrganisasi: normalizeOrgCode(r.kode_organisasi),
      namaOrganisasi: r.nama_organisasi,
      tahun: Number(r.tahun) || 2026,
      sasaranRKAP: r.sasaran_rkap || '-',
      sasaranUnitKerja: r.sasaran_unit_kerja || '-',
      konteksEksternal: r.konteks_eksternal || '-',
      konteksInternal: r.konteks_internal || '-',
      sumberRisiko: r.sumber_risiko || 'Operasional',
      pernyataanRisiko: r.pernyataan_risiko,
      penyebabRisiko: r.penyebab_risiko || '-',
      dampakRisiko: r.dampak_risiko || '-',
      pengendalianExisting: r.pengendalian_existing || '-',
      kategoriRisiko: r.kategori_risiko || 'Operasional',
      kriteriaDampakKey: r.kriteria_dampak_key || undefined,
      kriteriaDampakTitle: r.kriteria_dampak_title || undefined,
      kriteriaDampakLevel: r.kriteria_dampak_level ? Number(r.kriteria_dampak_level) : undefined,
      kemungkinanAwal: Number(r.kemungkinan_awal) || 1,
      dampakAwal: Number(r.dampak_awal) || 1,
      inherentScore: Number(r.inherent_score) || (Number(r.kemungkinan_awal) || 1) * (Number(r.dampak_awal) || 1),
      tingkatRisikoAwal: r.tingkat_risiko_awal,
      currentTingkatRisiko: r.current_tingkat_risiko,
      jenisPenanganan: r.jenis_penanganan,
      butuhMitigasi: Boolean(r.butuh_mitigasi),
      statusKebutuhanMitigasi: r.status_kebutuhan_mitigasi,
      alasanKebutuhanMitigasi: r.alasan_kebutuhan_mitigasi,
      rencanaPenanganan: r.rencana_penanganan || '',
      targetWaktuMitigasi: r.target_waktu_mitigasi || 'TW 2',
      biayaRencanaPengendalian: Number(r.biaya_rencana_pengendalian) || 0,
      picDepartemen: r.pic_departemen || undefined,
      picPelaksana: r.pic_pelaksana || '-',
      picPengendali: r.pic_pengendali || '-',
      jenisAnggaran: r.jenis_anggaran || 'Investasi Rutin / OPEX',
      statusWorkflow: r.status_workflow,
      statusPelaksanaanTerakhir: r.status_pelaksanaan_terakhir || undefined,
      progressPelaksanaanTerakhir:
        r.progress_pelaksanaan_terakhir !== null && r.progress_pelaksanaan_terakhir !== undefined
          ? Number(r.progress_pelaksanaan_terakhir)
          : undefined,
      reviewNotesVp: r.review_notes_vp || undefined,
      approvalNotesAdmin: r.approval_notes_admin || undefined,
      diperbaruiOleh: r.diperbarui_oleh || undefined,
      userProgres: r.user_progres || undefined,
      pengendalianTriwulan: controlsByRiskId[r.id] || [],
      pelaksanaanTindakan: actionsByRiskId[r.id] || [],
      carryOverInfo: carryOverByRiskId[r.id] || undefined,
      createdDate: r.created_date || (r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()),
      updatedDate: r.updated_date || (r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()),
      createdBy: r.created_by || 'Risk Officer'
    }));
  } catch (err: any) {
    console.error('[MySQL Read Error]:', err?.message);
    return null;
  }
}

/**
 * Ambil data dari tabel manapun untuk fitur Database Explorer di UI
 */
export async function getTableData(tableName: string): Promise<{
  columns: string[];
  rows: any[];
  total: number;
} | null> {
  if (!pool || !isConnected) return null;

  const allowedTables = [
    'pusri_risks',
    'pusri_risk',
    'pengendalian_triwulan',
    'quarterly_controls',
    'pelaksanaan_tindakan',
    'risk_action_executions',
    'carry_over',
    'evaluasi_carry_over',
    'risk_carry_overs',
    'master_organisasi',
    'master_organizations',
    'master_sumber_risiko',
    'master_likelihood_consequence',
    'master_risk_sources',
    'user_accounts',
    'portal_users',
    'audit_log_risiko',
    'risk_audit_logs',
    'sync_event_modul',
    'module_sync_events'
  ];

  if (!allowedTables.includes(tableName)) {
    throw new Error(`Tabel '${tableName}' tidak diperbolehkan atau tidak terdaftar di pusri_risk_db.`);
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM \`${tableName}\` LIMIT 100`);
    const [countRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
    const [cols] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM \`${tableName}\``);

    return {
      columns: cols.map((c: any) => c.Field),
      rows: rows as any[],
      total: Number(countRows[0]?.cnt) || rows.length
    };
  } catch (err: any) {
    console.error(`[MySQL Table Query Error] ${tableName}:`, err?.message);
    return null;
  }
}
