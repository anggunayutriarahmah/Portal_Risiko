import { pusriDb } from './db.ts';
import { DEFAULT_MASTER_LIKELIHOOD_CONSEQUENCE } from './mysql.ts';
import type { OrganizationMaster } from '../src/types/pusri.ts';
import fs from 'fs';
import path from 'path';

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? '0' : String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  const str = String(val);
  return `'${str.replace(/[\0\x08\x09\x1a\n\r"'\\]/g, (char) => {
    switch (char) {
      case '\0':
        return '\\0';
      case '\x08':
        return '\\b';
      case '\x09':
        return '\\t';
      case '\x1a':
        return '\\z';
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '"':
      case "'":
      case '\\':
        return '\\' + char;
      default:
        return char;
    }
  })}'`;
}

function normalizeSqlDate(val?: string | Date | null, fallback = '2026-09-15'): string {
  if (!val) return fallback;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return fallback;
}

function normalizeOrgCode(code?: string): string {
  if (!code) return 'OP-IIB';
  const trimmed = code.trim();
  if (trimmed === 'PRD-1B') return 'OP-IB';
  if (trimmed === 'TI-CORP') return 'TI';
  if (trimmed === 'RISK-CORP') return 'MR-CORP';
  return trimmed;
}

export function generatePusriSqlDump(): string {
  const risks = pusriDb.getAllRisks();
  const baseDepartments = pusriDb.getAllDepartments();
  const users = pusriDb.getRawUsersForDatabaseSync();
  const auditLogs = pusriDb.getAuditLogs();
  const syncEvents = pusriDb.getSyncEvents();
  const actionExecutions = pusriDb.getAllActionExecutions();
  const sumberRisikoGroups = pusriDb.getMasterSumberRisiko();

  // Pastikan setiap kode_organisasi pada risiko dan user terdaftar di master_organisasi (menjamin FK fk_pusri_risk_org bebas error)
  const deptMap = new Map<string, OrganizationMaster>();
  baseDepartments.forEach((d) => {
    const k = normalizeOrgCode(d.kode);
    deptMap.set(k, { ...d, kode: k });
  });
  risks.forEach((r) => {
    const k = normalizeOrgCode(r.kodeOrganisasi);
    if (!deptMap.has(k)) {
      deptMap.set(k, {
        kode: k,
        nama: r.namaOrganisasi || `Departemen ${k}`,
        direktorat: 'Direktorat Operasi & Produksi',
        kepalaUnit: `VP ${r.namaOrganisasi || k}`,
        totalRisiko: 1
      });
    }
  });
  const departments = Array.from(deptMap.values());

  const timestamp = new Date().toISOString();

  let sql = `-- =====================================================================
-- DATABASE DUMP: PT PUPUK SRIWIDJAJA PALEMBANG (PUSRI)
-- Database Name: pusri_risk_db
-- Dialect: MySQL 8.0+ / MariaDB 10.5+ (InnoDB Storage Engine, utf8mb4)
-- Skema Terpadu Tersinkronisasi Penuh dengan Node.js / Express & Golang
-- Generated At: ${timestamp}
-- Total Master Organisasi (master_organisasi): ${departments.length} Departemen
-- Total Akun Pengguna IAM SSO (user_accounts): ${users.length} Pengguna
-- Total Registrasi Risiko (pusri_risks): ${risks.length} Data
-- Total Pelaksanaan Tindakan (pelaksanaan_tindakan): ${actionExecutions.length} Data
-- =====================================================================

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS \`pusri_risk_db\`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE \`pusri_risk_db\`;

-- Bersihkan View & Tabel Anak ke Induk secara berurutan
DROP VIEW IF EXISTS
  \`master_organizations\`,
  \`master_risk_sources\`,
  \`portal_users\`,
  \`pusri_risk\`,
  \`quarterly_controls\`,
  \`risk_action_executions\`,
  \`evaluasi_carry_over\`,
  \`risk_carry_overs\`,
  \`risk_audit_logs\`,
  \`module_sync_events\`,
  \`master_risk_checklist\`,
  \`sop_stages\`,
  \`master_sop_stages\`;

DROP TABLE IF EXISTS
  \`sync_event_modul\`,
  \`audit_log_risiko\`,
  \`carry_over\`,
  \`pelaksanaan_tindakan\`,
  \`pengendalian_triwulan\`,
  \`pusri_risks\`,
  \`password_reset_tickets\`,
  \`user_accounts\`,
  \`master_likelihood_consequence\`,
  \`master_sumber_risiko\`,
  \`master_organisasi\`,
  \`master_checklist_risiko\`,
  \`master_risk_checklist\`,
  \`master_tahapan_sop\`,
  \`sop_stages\`;

-- ---------------------------------------------------------------------
-- 1. TABEL: master_organisasi (Daftar Departemen & Unit Kerja Pusri)
-- ---------------------------------------------------------------------
CREATE TABLE \`master_organisasi\` (
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

-- ---------------------------------------------------------------------
-- 2. TABEL: user_accounts (Akun Pengguna & Hak Akses IAM SSO Pusri)
-- ---------------------------------------------------------------------
CREATE TABLE \`user_accounts\` (
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

-- ---------------------------------------------------------------------
-- 2B. TABEL: password_reset_tickets (Antrean Pemulihan Kata Sandi IAM)
-- ---------------------------------------------------------------------
CREATE TABLE \`password_reset_tickets\` (
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

-- ---------------------------------------------------------------------
-- 3. TABEL: pusri_risks (Tabel Utama Registrasi Profil Risiko Pusri)
-- ---------------------------------------------------------------------
CREATE TABLE \`pusri_risks\` (
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

-- ---------------------------------------------------------------------
-- 4. TABEL: pengendalian_triwulan (Pemantauan Pengendalian TW 1 - TW 4)
-- ---------------------------------------------------------------------
CREATE TABLE \`pengendalian_triwulan\` (
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

-- ---------------------------------------------------------------------
-- 5. TABEL: pelaksanaan_tindakan (Realisasi Rencana Aksi Mitigasi)
-- ---------------------------------------------------------------------
CREATE TABLE \`pelaksanaan_tindakan\` (
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

-- ---------------------------------------------------------------------
-- 6. TABEL: carry_over (Evaluasi Risiko Lanjutan Lintas Tahun RKAP)
-- ---------------------------------------------------------------------
CREATE TABLE \`carry_over\` (
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

-- ---------------------------------------------------------------------
-- 7. TABEL: audit_log_risiko (Riwayat Audit Trail & Jejak Perubahan)
-- ---------------------------------------------------------------------
CREATE TABLE \`audit_log_risiko\` (
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

-- ---------------------------------------------------------------------
-- 8. TABEL: sync_event_modul (Log Sinkronisasi Antar-Modul REST API)
-- ---------------------------------------------------------------------
CREATE TABLE \`sync_event_modul\` (
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

-- ---------------------------------------------------------------------
-- 9. TABEL: master_sumber_risiko (Master Data Sumber Risiko - Khusus Admin)
-- ---------------------------------------------------------------------
CREATE TABLE \`master_sumber_risiko\` (
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

-- ---------------------------------------------------------------------
-- 10. TABEL: master_likelihood_consequence
-- ---------------------------------------------------------------------
CREATE TABLE \`master_likelihood_consequence\` (
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

-- =====================================================================
-- DATA INSERTS
-- =====================================================================
`;

  // 1. master_organisasi
  if (departments.length > 0) {
    sql += `\n-- ---------------------------------------------------------------------\n-- DATA: master_organisasi (${departments.length} records)\n-- ---------------------------------------------------------------------\n`;
    sql += `INSERT INTO \`master_organisasi\` (\`kode\`, \`nama\`, \`direktorat\`, \`kepala_unit\`, \`jabatan_kepala\`, \`email_unit\`, \`total_risiko\`, \`officers_json\`, \`owners_json\`) VALUES\n`;
    const orgRows = departments.map((d) => {
      const email = `${d.kode.toLowerCase().replace(/[^a-z0-9]/g, '')}@pusri.co.id`;
      const jabatan =
        d.kepalaUnit?.includes('VP') || d.kepalaUnit?.includes('Vice President')
          ? d.kepalaUnit
          : `Vice President ${d.nama}`;
      const officersJson = d.officers ? JSON.stringify(d.officers) : null;
      const ownersJson = d.owners ? JSON.stringify(d.owners) : null;
      return `(${escapeSql(d.kode)}, ${escapeSql(d.nama)}, ${escapeSql(d.direktorat || 'Direktorat Operasi & Produksi')}, ${escapeSql(d.kepalaUnit || 'VP Terkait')}, ${escapeSql(jabatan)}, ${escapeSql(email)}, ${d.totalRisiko || 0}, ${escapeSql(officersJson)}, ${escapeSql(ownersJson)})`;
    });
    sql += orgRows.join(',\n') + ';\n';
  }

  // 1B. master_sumber_risiko
  const flatSumberRows: string[] = [];
  sumberRisikoGroups.forEach((g) => {
    (g.items || []).forEach((item, idx) => {
      flatSumberRows.push(
        `(${escapeSql(g.kategori)}, ${escapeSql(item)}, ${idx + 1}, ${escapeSql(g.updatedBy || 'Risk Admin')})`
      );
    });
  });
  if (flatSumberRows.length > 0) {
    sql += `\n-- ---------------------------------------------------------------------\n-- DATA: master_sumber_risiko (${flatSumberRows.length} records)\n-- ---------------------------------------------------------------------\n`;
    sql += `INSERT INTO \`master_sumber_risiko\` (\`kategori\`, \`sumber_risiko\`, \`urutan\`, \`dibuat_oleh\`) VALUES\n`;
    sql += flatSumberRows.join(',\n') + ';\n';
  }

  sql += `\n-- ---------------------------------------------------------------------\n-- DATA: master_likelihood_consequence\n-- ---------------------------------------------------------------------\n`;
  sql += `INSERT INTO \`master_likelihood_consequence\` (\`id\`, \`likelihood\`, \`keterangan_en\`, \`keterangan_id\`, \`c1\`, \`c2\`, \`c3\`, \`c4\`, \`c5\`, \`status\`) VALUES\n`;
  sql += DEFAULT_MASTER_LIKELIHOOD_CONSEQUENCE.map((row) =>
    `(${escapeSql(row.id)}, ${row.likelihood}, ${escapeSql(row.keteranganEn)}, ${escapeSql(row.keteranganId)}, ${escapeSql(row.c1)}, ${escapeSql(row.c2)}, ${escapeSql(row.c3)}, ${escapeSql(row.c4)}, ${escapeSql(row.c5)}, ${escapeSql(row.status)})`
  ).join(',\n') + ';\n';

  // 2. user_accounts
  if (users.length > 0) {
    sql += `\n-- ---------------------------------------------------------------------\n-- DATA: user_accounts (${users.length} records)\n-- ---------------------------------------------------------------------\n`;
    sql += `INSERT INTO \`user_accounts\` (\`id\`, \`username\`, \`nama\`, \`nik\`, \`badge\`, \`password\`, \`password_hash\`, \`role\`, \`jabatan\`, \`unit_kerja\`, \`kode_unit\`, \`kode_unit_kerja\`, \`email\`, \`account_status\`, \`auth_provider\`, \`approved_by\`) VALUES\n`;
    const userRows = users.map((u) => {
      const nik = u.nik || u.badge || '0952';
      const badge = u.badge || u.nik || '0952';
      const pwd = u.password || 'portal123';
      const kodeUnit = normalizeOrgCode(u.kodeUnitKerja || 'OP-IIB');
      const jabatan =
        u.jabatan ||
        (u.role === 'risk admin'
          ? 'Super Admin ERM Korporat'
          : u.role === 'risk owner'
            ? 'Vice President Unit Kerja'
            : 'Risk Officer Pelaksana');
      return `(${escapeSql(u.id)}, ${escapeSql(u.username)}, ${escapeSql(u.nama)}, ${escapeSql(nik)}, ${escapeSql(badge)}, ${escapeSql(pwd)}, ${escapeSql(pwd)}, ${escapeSql(u.role)}, ${escapeSql(jabatan)}, ${escapeSql(u.unitKerja)}, ${escapeSql(kodeUnit)}, ${escapeSql(kodeUnit)}, ${escapeSql(u.email)}, ${escapeSql(u.accountStatus || 'active')}, ${escapeSql(u.authProvider || 'PUSRI_IAM_SSO')}, ${escapeSql(u.approvedBy || 'Sistem IAM Korporat Pusri')})`;
    });
    sql += userRows.join(',\n') + ';\n';
  }

  // 3. pusri_risks (tanpa kolom generated inherent_score pada INSERT)
  if (risks.length > 0) {
    sql += `\n-- ---------------------------------------------------------------------\n-- DATA: pusri_risks (${risks.length} records)\n-- ---------------------------------------------------------------------\n`;
    sql +=
      `INSERT INTO \`pusri_risks\` (\n` +
      `  \`id\`, \`kode_risiko\`, \`kode_organisasi\`, \`nama_organisasi\`, \`tahun\`,\n` +
      `  \`sasaran_rkap\`, \`sasaran_unit_kerja\`, \`konteks_eksternal\`, \`konteks_internal\`,\n` +
      `  \`sumber_risiko\`, \`pernyataan_risiko\`, \`penyebab_risiko\`, \`dampak_risiko\`,\n` +
      `  \`pengendalian_existing\`, \`kategori_risiko\`, \`kriteria_dampak_key\`, \`kriteria_dampak_title\`, \`kriteria_dampak_level\`,\n` +
      `  \`kemungkinan_awal\`, \`dampak_awal\`, \`tingkat_risiko_awal\`, \`current_tingkat_risiko\`, \`jenis_penanganan\`,\n` +
      `  \`butuh_mitigasi\`, \`status_kebutuhan_mitigasi\`, \`alasan_kebutuhan_mitigasi\`,\n` +
      `  \`rencana_penanganan\`, \`target_waktu_mitigasi\`, \`biaya_rencana_pengendalian\`,\n` +
      `  \`pic_departemen\`, \`pic_pelaksana\`, \`pic_pengendali\`, \`jenis_anggaran\`, \`status_workflow\`,\n` +
      `  \`status_pelaksanaan_terakhir\`, \`progress_pelaksanaan_terakhir\`,\n` +
      `  \`review_notes_vp\`, \`approval_notes_admin\`, \`created_by\`, \`created_date\`, \`updated_date\`\n` +
      `) VALUES\n`;

    const riskRows = risks.map((r) => {
      const cleanOrg = normalizeOrgCode(r.kodeOrganisasi);
      const statusKebutuhan =
        r.statusKebutuhanMitigasi || (r.butuhMitigasi ? 'Wajib Mitigasi' : 'Toleransi Standar');
      const alasanKebutuhan =
        r.alasanKebutuhanMitigasi ||
        (r.butuhMitigasi
          ? `Skor inherent ${r.inherentScore} (${r.tingkatRisikoAwal}) mewajibkan mitigasi terstruktur sesuai SOP Pusri.`
          : 'Toleransi risiko dalam batas wajar.');

      return (
        `(\n` +
        `  ${escapeSql(r.id)}, ${escapeSql(r.kodeRisiko)}, ${escapeSql(cleanOrg)}, ${escapeSql(r.namaOrganisasi)}, ${r.tahun || 2026},\n` +
        `  ${escapeSql(r.sasaranRKAP || '-')}, ${escapeSql(r.sasaranUnitKerja || '-')}, ${escapeSql(r.konteksEksternal || '-')}, ${escapeSql(r.konteksInternal || '-')},\n` +
        `  ${escapeSql(r.sumberRisiko || 'Operasional')}, ${escapeSql(r.pernyataanRisiko)}, ${escapeSql(r.penyebabRisiko || '-')}, ${escapeSql(r.dampakRisiko || '-')},\n` +
        `  ${escapeSql(r.pengendalianExisting || '-')}, ${escapeSql(r.kategoriRisiko || 'Operasional')}, ${escapeSql(r.kriteriaDampakKey || null)}, ${escapeSql(r.kriteriaDampakTitle || null)}, ${r.kriteriaDampakLevel !== undefined ? Number(r.kriteriaDampakLevel) : r.dampakAwal},\n` +
        `  ${Number(r.kemungkinanAwal) || 1}, ${Number(r.dampakAwal) || 1}, ${escapeSql(r.tingkatRisikoAwal)}, ${escapeSql(r.currentTingkatRisiko)}, ${escapeSql(r.jenisPenanganan)},\n` +
        `  ${r.butuhMitigasi ? '1' : '0'}, ${escapeSql(statusKebutuhan)}, ${escapeSql(alasanKebutuhan)},\n` +
        `  ${escapeSql(r.rencanaPenanganan || '')}, ${escapeSql(String(r.targetWaktuMitigasi || 'TW 2').slice(0, 125))}, ${Number(r.biayaRencanaPengendalian) || 0.0},\n` +
        `  ${escapeSql(r.picDepartemen || null)}, ${escapeSql(r.picPelaksana || '')}, ${escapeSql(r.picPengendali || '')}, ${escapeSql(String(r.jenisAnggaran || 'Operasional / OPEX').slice(0, 125))}, ${escapeSql(r.statusWorkflow)},\n` +
        `  ${escapeSql(r.statusPelaksanaanTerakhir || 'Belum Dilaksanakan')}, ${Number(r.progressPelaksanaanTerakhir) || 0},\n` +
        `  ${escapeSql(r.reviewNotesVp || null)}, ${escapeSql(r.approvalNotesAdmin || null)}, ${escapeSql(r.createdBy || 'Risk Officer')},\n` +
        `  ${escapeSql(r.createdDate || '2026-01-10T08:00:00Z')}, ${escapeSql(r.updatedDate || timestamp)}\n` +
        `)`
      );
    });

    sql += riskRows.join(',\n') + ';\n';
  }

  // 4. pengendalian_triwulan (tanpa kolom generated residual_score pada INSERT)
  const allControls: Array<{ riskId: string; kodeRisiko: string; picDefault: string; control: any }> = [];
  risks.forEach((r) => {
    if (Array.isArray(r.pengendalianTriwulan)) {
      r.pengendalianTriwulan.forEach((ctrl) => {
        allControls.push({
          riskId: r.id,
          kodeRisiko: r.kodeRisiko || r.id,
          picDefault: r.picPelaksana || 'PIC Pelaksana',
          control: ctrl
        });
      });
    }
  });

  if (allControls.length > 0) {
    sql += `\n-- ---------------------------------------------------------------------\n-- DATA: pengendalian_triwulan (${allControls.length} records)\n-- ---------------------------------------------------------------------\n`;
    sql += `INSERT INTO \`pengendalian_triwulan\` (\`id\`, \`risk_id\`, \`kode_risiko\`, \`triwulan\`, \`realisasi_kegiatan\`, \`realisasi_biaya\`, \`progress_persen\`, \`progress_fisik_pic\`, \`progres_pengerjaan_admin\`, \`kemungkinan_residual\`, \`dampak_residual\`, \`tingkat_residual\`, \`status_pengendalian\`, \`kendala_dan_tindak_lanjut\`, \`reported_by\`, \`is_pic_acc\`, \`status_keputusan\`, \`catatan_evaluasi_admin\`) VALUES\n`;
    const ctrlRows = allControls.map(({ riskId, kodeRisiko, picDefault, control }) => {
      const ctrlId = `CTRL-${riskId}-${String(control.triwulan).replace(/\s+/g, '')}`;
      const prog = Number(control.progressPersen) || 0;
      const progPic = control.progressFisikPic !== undefined ? Number(control.progressFisikPic) : prog;
      const progAdmin = control.progresPengerjaanAdmin !== undefined ? Number(control.progresPengerjaanAdmin) : null;
      return `(${escapeSql(ctrlId)}, ${escapeSql(riskId)}, ${escapeSql(kodeRisiko)}, ${escapeSql(control.triwulan)}, ${escapeSql(control.realisasiKegiatan || `Realisasi mitigasi ${control.triwulan}`)}, ${Number(control.realisasiBiaya) || 0}, ${prog}, ${progPic}, ${escapeSql(progAdmin)}, ${Number(control.kemungkinanResidual) || 1}, ${Number(control.dampakResidual) || 1}, ${escapeSql(control.tingkatResidual || 'Low')}, ${escapeSql(control.statusPengendalian || 'On Track')}, ${escapeSql(control.kendalaDanTindakLanjut || '')}, ${escapeSql(control.reportedBy || picDefault)}, ${control.isPicAcc ? 1 : 0}, ${escapeSql(control.statusKeputusan || null)}, ${escapeSql(control.catatanEvaluasiAdmin || null)})`;
    });
    sql += ctrlRows.join(',\n') + ';\n';
  }

  // 5. pelaksanaan_tindakan
  if (actionExecutions.length > 0) {
    sql += `\n-- ---------------------------------------------------------------------\n-- DATA: pelaksanaan_tindakan (${actionExecutions.length} records)\n-- ---------------------------------------------------------------------\n`;
    sql += `INSERT INTO \`pelaksanaan_tindakan\` (\`id\`, \`risk_id\`, \`kode_risiko\`, \`triwulan\`, \`tanggal_pelaksanaan\`, \`pic_pelaksana\`, \`uraian_tindakan\`, \`progress_persen\`, \`status_pelaksanaan\`, \`realisasi_biaya\`, \`efektivitas\`, \`kendala_dan_hambatan\`, \`tindak_lanjut\`, \`nomor_bukti_dokumen\`, \`catatan_admin\`, \`is_acc_admin\`, \`diperbarui_oleh\`) VALUES\n`;
    const actRows = actionExecutions.map((a) => {
      return `(${escapeSql(a.id)}, ${escapeSql(a.risk_id)}, ${escapeSql(a.kode_risiko)}, ${escapeSql(a.triwulan)}, ${escapeSql(a.tanggal_pelaksanaan)}, ${escapeSql(a.pic_pelaksana)}, ${escapeSql(a.uraian_tindakan)}, ${Number(a.progress_persen) || 0}, ${escapeSql(a.status_pelaksanaan)}, ${Number(a.realisasi_biaya) || 0}, ${escapeSql(a.efektivitas)}, ${escapeSql(a.kendala_dan_hambatan)}, ${escapeSql(a.tindak_lanjut)}, ${escapeSql(a.nomor_bukti_dokumen)}, ${escapeSql(a.catatan_admin)}, ${a.is_acc_admin ? 1 : 0}, ${escapeSql(a.diperbarui_oleh)})`;
    });
    sql += actRows.join(',\n') + ';\n';
  }

  // 6. carry_over (hanya risiko yang resmi berstatus Carry_Over, tanggal wajib YYYY-MM-DD)
  const carryOverRisks = risks.filter((r) => r.statusWorkflow === 'Carry_Over');
  if (carryOverRisks.length > 0) {
    sql += `\n-- ---------------------------------------------------------------------\n-- DATA: carry_over (${carryOverRisks.length} records)\n-- ---------------------------------------------------------------------\n`;
    sql += `INSERT INTO \`carry_over\` (\`id\`, \`risk_id\`, \`kode_risiko\`, \`nama_organisasi\`, \`pernyataan_risiko\`, \`kategori_risiko\`, \`current_tingkat_risiko\`, \`status_workflow\`, \`progress_terakhir\`, \`target_tahun\`, \`alasan_carry_over\`, \`rekomendasi_komite\`, \`approval_carry_over_by\`, \`tanggal_carry_over\`) VALUES\n`;
    const carryRows = carryOverRisks.map((r) => {
      const info = r.carryOverInfo;
      const carryId = `CO-${r.id}`;
      const alasan =
        info?.alasanCarryOver ||
        `Program mitigasi ${r.rencanaPenanganan} memerlukan tindak lanjut multi-tahun ke RKAP berikutnya.`;
      const rekomendasi =
        info?.rekomendasiKomite ||
        'Komite Risiko menyetujui pemantauan berkala dan alokasi anggaran mitigasi lanjutan.';
      const approver = info?.approvalCarryOverBy || 'Komite Manajemen Risiko Pusri';
      const tanggal = normalizeSqlDate(info?.tanggalCarryOver, '2026-09-15');
      const lastProgress =
        r.pengendalianTriwulan && r.pengendalianTriwulan.length > 0
          ? Number(r.pengendalianTriwulan[r.pengendalianTriwulan.length - 1].progressPersen) || 0
          : Number(r.progressPelaksanaanTerakhir) || 0;
      return `(${escapeSql(carryId)}, ${escapeSql(r.id)}, ${escapeSql(r.kodeRisiko)}, ${escapeSql(r.namaOrganisasi)}, ${escapeSql(r.pernyataanRisiko)}, ${escapeSql(r.kategoriRisiko)}, ${escapeSql(r.currentTingkatRisiko)}, ${escapeSql(r.statusWorkflow)}, ${lastProgress}, ${Number(info?.targetTahun) || 2027}, ${escapeSql(alasan)}, ${escapeSql(rekomendasi)}, ${escapeSql(approver)}, ${escapeSql(tanggal)})`;
    });
    sql += carryRows.join(',\n') + ';\n';
  }

  // 7. audit_log_risiko
  const logsToOutput =
    auditLogs.length >= 6
      ? auditLogs
      : [
          ...auditLogs,
          {
            id: 'log-001',
            timestamp: '2026-01-15T08:30:00Z',
            riskId: 'RSK-2026-001',
            kodeRisiko: 'RSK-2026-001',
            userRole: 'risk officer' as const,
            actorName: 'Fauzan Al Ghaniyyu (Risk Officer)',
            action: 'IDENTIFIKASI_SUBMITTED',
            newStatus: 'Menunggu_Approval_VP',
            notes: 'Penyusunan usulan butir risiko operasional tekanan gas alam reformer pabrik IIB.',
            latencyMs: 3.8
          },
          {
            id: 'log-002',
            timestamp: '2026-01-20T10:15:00Z',
            riskId: 'RSK-2026-001',
            kodeRisiko: 'RSK-2026-001',
            userRole: 'risk owner' as const,
            actorName: 'M Davi Ramadhan (VP Operasi IIB)',
            action: 'VP_APPROVAL_PASSED',
            previousStatus: 'Menunggu_Approval_VP',
            newStatus: 'Menunggu_Approval_Admin',
            notes: 'Review kelayakan usulan risiko disetujui untuk registrasi korporat.',
            latencyMs: 4.2
          },
          {
            id: 'log-003',
            timestamp: '2026-01-25T14:00:00Z',
            riskId: 'RSK-2026-001',
            kodeRisiko: 'RSK-2026-001',
            userRole: 'risk admin' as const,
            actorName: 'Daffa Ari Prasetya (Risk Admin)',
            action: 'ADMIN_REGISTERED_AND_ASSIGNED_PIC',
            previousStatus: 'Menunggu_Approval_Admin',
            newStatus: 'Disetujui_Dalam_Pengendalian',
            notes: 'Approval final registrasi korporat RSK-2026-001 dan penetapan resmi PIC Pelaksana/Pengendali.',
            latencyMs: 4.9
          }
        ];

  const seenAuditIds = new Set<string>();
  const uniqueLogs = logsToOutput.filter((l) => {
    if (!l || !l.id || seenAuditIds.has(l.id)) return false;
    seenAuditIds.add(l.id);
    return true;
  });

  if (uniqueLogs.length > 0) {
    sql += `\n-- ---------------------------------------------------------------------\n-- DATA: audit_log_risiko (${uniqueLogs.length} records)\n-- ---------------------------------------------------------------------\n`;
    sql += `INSERT INTO \`audit_log_risiko\` (\`id\`, \`risk_id\`, \`kode_risiko\`, \`user_role\`, \`actor_name\`, \`action\`, \`previous_status\`, \`new_status\`, \`notes\`, \`latency_ms\`) VALUES\n`;
    const auditRows = uniqueLogs.map((l) => {
      return `(${escapeSql(l.id)}, ${escapeSql(l.riskId || '')}, ${escapeSql(l.kodeRisiko || l.riskId || '')}, ${escapeSql(String(l.userRole || 'risk officer'))}, ${escapeSql(l.actorName || 'Risk System')}, ${escapeSql(l.action)}, ${escapeSql(l.previousStatus || null)}, ${escapeSql(l.newStatus || null)}, ${escapeSql(l.notes || '')}, ${Number(l.latencyMs) || 4.2})`;
    });
    sql += auditRows.join(',\n') + ';\n';
  }

  // 8. sync_event_modul
  const syncsToOutput =
    syncEvents.length >= 4
      ? syncEvents
      : [
          ...syncEvents,
          {
            id: 'sync-001',
            timestamp: '2026-01-15T08:30:05Z',
            moduleSource: 'Modul Unit Kerja',
            moduleTarget: 'Modul Review Atasan / VP',
            endpoint: '/api/approval/submit-identifikasi',
            method: 'POST',
            status: 'SYNCED',
            durationMs: 4.8,
            payloadSummary: 'Sinkronisasi Paket Draf Identifikasi Pabrik OP-IIB'
          },
          {
            id: 'sync-002',
            timestamp: '2026-01-20T10:15:10Z',
            moduleSource: 'Modul Review Atasan / VP',
            moduleTarget: 'Modul Approval Admin',
            endpoint: '/api/vp/risks/decision',
            method: 'POST',
            status: 'SYNCED',
            durationMs: 3.9,
            payloadSummary: 'Persetujuan VP Operasi ke Admin Korporat'
          },
          {
            id: 'sync-003',
            timestamp: '2026-01-25T14:00:20Z',
            moduleSource: 'Modul Approval Admin',
            moduleTarget: 'Modul Pengendalian TW 1-4 & MySQL',
            endpoint: '/api/admin/risks/approve-individual',
            method: 'POST',
            status: 'SYNCED',
            durationMs: 4.2,
            payloadSummary: 'Registrasi Korporat & Penugasan PIC Resmi'
          }
        ];

  const seenSyncIds = new Set<string>();
  const uniqueSyncs = syncsToOutput.filter((s) => {
    if (!s || !s.id || seenSyncIds.has(s.id)) return false;
    seenSyncIds.add(s.id);
    return true;
  });

  if (uniqueSyncs.length > 0) {
    sql += `\n-- ---------------------------------------------------------------------\n-- DATA: sync_event_modul (${uniqueSyncs.length} records)\n-- ---------------------------------------------------------------------\n`;
    sql += `INSERT INTO \`sync_event_modul\` (\`id\`, \`module_source\`, \`module_target\`, \`endpoint\`, \`method\`, \`status\`, \`duration_ms\`, \`payload_summary\`) VALUES\n`;
    const syncRows = uniqueSyncs.map((s) => {
      return `(${escapeSql(s.id)}, ${escapeSql(s.moduleSource)}, ${escapeSql(s.moduleTarget)}, ${escapeSql(s.endpoint)}, ${escapeSql(s.method)}, ${escapeSql(s.status)}, ${Number(s.durationMs) || 4.5}, ${escapeSql(s.payloadSummary || '')})`;
    });
    sql += syncRows.join(',\n') + ';\n';
  }

  // Compatibility Views
  sql +=
    `\n-- =====================================================================\n` +
    `-- VIEW ALIAS KOMPATIBILITAS (Mendukung Nama Bahasa Inggris & Alternatif)\n` +
    `-- =====================================================================\n` +
    `CREATE OR REPLACE VIEW \`master_organizations\` AS SELECT * FROM \`master_organisasi\`;\n` +
    `CREATE OR REPLACE VIEW \`master_risk_sources\` AS SELECT * FROM \`master_sumber_risiko\`;\n` +
    `CREATE OR REPLACE VIEW \`portal_users\` AS SELECT * FROM \`user_accounts\`;\n` +
    `CREATE OR REPLACE VIEW \`pusri_risk\` AS SELECT * FROM \`pusri_risks\`;\n` +
    `CREATE OR REPLACE VIEW \`quarterly_controls\` AS SELECT * FROM \`pengendalian_triwulan\`;\n` +
    `CREATE OR REPLACE VIEW \`risk_action_executions\` AS SELECT * FROM \`pelaksanaan_tindakan\`;\n` +
    `CREATE OR REPLACE VIEW \`evaluasi_carry_over\` AS SELECT * FROM \`carry_over\`;\n` +
    `CREATE OR REPLACE VIEW \`risk_carry_overs\` AS SELECT * FROM \`carry_over\`;\n` +
    `CREATE OR REPLACE VIEW \`risk_audit_logs\` AS SELECT * FROM \`audit_log_risiko\`;\n` +
    `CREATE OR REPLACE VIEW \`module_sync_events\` AS SELECT * FROM \`sync_event_modul\`;\n`;

  sql +=
    `\n-- =====================================================================\n` +
    `-- RESTORE SQL ENVIRONMENT\n` +
    `-- =====================================================================\n` +
    `/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;\n` +
    `/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;\n` +
    `/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n` +
    `/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n` +
    `/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n` +
    `/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;\n\n` +
    `-- DUMP BERHASIL DISINKRONKAN PADA ${timestamp}\n`;

  return sql;
}

export function saveSqlDumpToDisk(): void {
  try {
    const dump = generatePusriSqlDump();
    const targetPath = path.join(process.cwd(), 'server', 'backend_go', 'schema.sql');
    fs.writeFileSync(targetPath, dump, 'utf8');
  } catch (err) {
    console.error('Failed to save schema.sql to disk:', err);
  }
}
