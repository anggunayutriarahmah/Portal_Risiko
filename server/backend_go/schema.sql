-- =====================================================================
-- DATABASE DUMP: PT PUPUK SRIWIDJAJA PALEMBANG (PUSRI)
-- Database Name: pusri_risk_db
-- Dialect: MySQL 8.0+ / MariaDB 10.5+ (InnoDB Storage Engine, utf8mb4)
-- Skema Terpadu Tersinkronisasi Penuh dengan Node.js / Express & Golang
-- Generated At: 2026-11-03T07:15:48.666Z
-- Total Master Organisasi (master_organisasi): 28 Departemen
-- Total Akun Pengguna IAM SSO (user_accounts): 4 Pengguna
-- Total Registrasi Risiko (pusri_risks): 0 Data
-- Total Pelaksanaan Tindakan (pelaksanaan_tindakan): 0 Data
-- =====================================================================

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `pusri_risk_db`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `pusri_risk_db`;

-- Bersihkan View & Tabel Anak ke Induk secara berurutan
DROP VIEW IF EXISTS
  `master_organizations`,
  `master_risk_sources`,
  `portal_users`,
  `pusri_risk`,
  `quarterly_controls`,
  `risk_action_executions`,
  `evaluasi_carry_over`,
  `risk_carry_overs`,
  `risk_audit_logs`,
  `module_sync_events`,
  `master_risk_checklist`,
  `sop_stages`,
  `master_sop_stages`;

DROP TABLE IF EXISTS
  `sync_event_modul`,
  `audit_log_risiko`,
  `carry_over`,
  `pelaksanaan_tindakan`,
  `pengendalian_triwulan`,
  `pusri_risks`,
  `password_reset_tickets`,
  `user_accounts`,
  `master_likelihood_consequence`,
  `master_sumber_risiko`,
  `master_organisasi`,
  `master_checklist_risiko`,
  `master_risk_checklist`,
  `master_tahapan_sop`,
  `sop_stages`;

-- ---------------------------------------------------------------------
-- 1. TABEL: master_organisasi (Daftar Departemen & Unit Kerja Pusri)
-- ---------------------------------------------------------------------
CREATE TABLE `master_organisasi` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `kode` VARCHAR(32) NOT NULL UNIQUE,
    `nama` VARCHAR(255) NOT NULL,
    `direktorat` VARCHAR(255) NOT NULL DEFAULT 'Direktorat Operasi & Produksi',
    `kepala_unit` VARCHAR(255) NOT NULL DEFAULT 'Vice President Unit Kerja',
    `jabatan_kepala` VARCHAR(150) NOT NULL DEFAULT 'Vice President (VP)',
    `email_unit` VARCHAR(150) NOT NULL DEFAULT 'unit@pusri.co.id',
    `total_risiko` INT DEFAULT 0,
    `officers_json` LONGTEXT DEFAULT NULL,
    `owners_json` LONGTEXT DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_org_kode` (`kode`),
    INDEX `idx_org_direktorat` (`direktorat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. TABEL: user_accounts (Akun Pengguna & Hak Akses IAM SSO Pusri)
-- ---------------------------------------------------------------------
CREATE TABLE `user_accounts` (
    `id` VARCHAR(64) PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `nama` VARCHAR(255) NOT NULL,
    `nik` VARCHAR(64) DEFAULT NULL,
    `badge` VARCHAR(64) DEFAULT NULL,
    `password` VARCHAR(255) NOT NULL DEFAULT 'portal123',
    `password_hash` VARCHAR(255) DEFAULT NULL,
    `role` VARCHAR(64) NOT NULL DEFAULT 'risk officer',
    `jabatan` VARCHAR(255) DEFAULT NULL,
    `jabatan_pengajuan` VARCHAR(255) DEFAULT NULL,
    `unit_kerja` VARCHAR(255) NOT NULL DEFAULT 'Departemen Operasi Pabrik Pusri IIB',
    `kode_unit` VARCHAR(64) NOT NULL DEFAULT 'OP-IIB',
    `kode_unit_kerja` VARCHAR(64) DEFAULT 'OP-IIB',
    `email` VARCHAR(150) NOT NULL DEFAULT 'user@pusri.co.id',
    `account_status` VARCHAR(32) NOT NULL DEFAULT 'active',
    `auth_provider` VARCHAR(64) NOT NULL DEFAULT 'PUSRI_IAM_SSO',
    `failed_login_attempts` INT NOT NULL DEFAULT 0,
    `locked_until` VARCHAR(64) DEFAULT NULL,
    `approved_by` VARCHAR(150) DEFAULT NULL,
    `last_login_at` VARCHAR(64) DEFAULT NULL,
    `avatar` VARCHAR(255) DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_badge` (`badge`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2B. TABEL: password_reset_tickets (Antrean Pemulihan Kata Sandi IAM)
-- ---------------------------------------------------------------------
CREATE TABLE `password_reset_tickets` (
    `id` VARCHAR(64) PRIMARY KEY,
    `identifier` VARCHAR(150) NOT NULL,
    `user_name` VARCHAR(255) DEFAULT NULL,
    `badge` VARCHAR(64) DEFAULT NULL,
    `email` VARCHAR(150) NOT NULL,
    `unit_kerja` VARCHAR(255) DEFAULT NULL,
    `reason` TEXT NOT NULL,
    `temporary_password` VARCHAR(255) DEFAULT NULL,
    `temporary_password_hash` VARCHAR(255) DEFAULT NULL,
    `status` ENUM('pending', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME NOT NULL,
    `resolved_at` DATETIME DEFAULT NULL,
    `resolved_by` VARCHAR(255) DEFAULT NULL,
    INDEX `idx_reset_ticket_status_created` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. TABEL: pusri_risks (Tabel Utama Registrasi Profil Risiko Pusri)
-- ---------------------------------------------------------------------
CREATE TABLE `pusri_risks` (
    `id` VARCHAR(64) PRIMARY KEY,
    `kode_risiko` VARCHAR(64) NOT NULL UNIQUE,
    `kode_organisasi` VARCHAR(32) NOT NULL,
    `nama_organisasi` VARCHAR(255) NOT NULL,
    `tahun` INT NOT NULL DEFAULT 2026,
    `sasaran_rkap` TEXT NOT NULL,
    `sasaran_unit_kerja` TEXT NOT NULL,
    `konteks_eksternal` TEXT,
    `konteks_internal` TEXT,
    `sumber_risiko` VARCHAR(255) NOT NULL DEFAULT 'Operasional',
    `pernyataan_risiko` TEXT NOT NULL,
    `penyebab_risiko` TEXT NOT NULL,
    `dampak_risiko` TEXT NOT NULL,
    `pengendalian_existing` TEXT,
    `kategori_risiko` VARCHAR(64) NOT NULL DEFAULT 'Operasional',
    `kriteria_dampak_key` VARCHAR(64) DEFAULT NULL,
    `kriteria_dampak_title` VARCHAR(255) DEFAULT NULL,
    `kriteria_dampak_level` INT DEFAULT NULL,
    `kemungkinan_awal` INT NOT NULL DEFAULT 1,
    `dampak_awal` INT NOT NULL DEFAULT 1,
    `inherent_score` INT GENERATED ALWAYS AS (`kemungkinan_awal` * `dampak_awal`) STORED,
    `tingkat_risiko_awal` VARCHAR(50) NOT NULL DEFAULT 'Moderate',
    `current_tingkat_risiko` VARCHAR(50) NOT NULL DEFAULT 'Moderate',
    `jenis_penanganan` VARCHAR(50) NOT NULL DEFAULT 'Mitigasi',
    `butuh_mitigasi` TINYINT(1) NOT NULL DEFAULT 1,
    `status_kebutuhan_mitigasi` VARCHAR(128) NOT NULL DEFAULT 'Wajib Mitigasi',
    `alasan_kebutuhan_mitigasi` TEXT,
    `rencana_penanganan` TEXT,
    `target_waktu_mitigasi` VARCHAR(128) DEFAULT 'TW 2',
    `biaya_rencana_pengendalian` DECIMAL(15, 2) DEFAULT 0.00,
    `pic_departemen` VARCHAR(255) DEFAULT NULL,
    `pic_pelaksana` VARCHAR(255) DEFAULT '',
    `pic_pengendali` VARCHAR(255) DEFAULT '',
    `jenis_anggaran` VARCHAR(128) DEFAULT 'Investasi Rutin / OPEX',
    `status_workflow` VARCHAR(100) NOT NULL DEFAULT 'Menunggu_Approval_VP',
    `status_pelaksanaan_terakhir` VARCHAR(64) DEFAULT 'Belum Dilaksanakan',
    `progress_pelaksanaan_terakhir` INT DEFAULT 0,
    `review_notes_vp` TEXT,
    `approval_notes_admin` TEXT,
    `diperbarui_oleh` VARCHAR(150) DEFAULT NULL,
    `user_progres` VARCHAR(150) DEFAULT NULL,
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'Risk Officer',
    `created_date` VARCHAR(64) DEFAULT NULL,
    `updated_date` VARCHAR(64) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pusri_risk_org` FOREIGN KEY (`kode_organisasi`) REFERENCES `master_organisasi`(`kode`) ON UPDATE CASCADE,
    INDEX `idx_risk_tahun` (`tahun`),
    INDEX `idx_risk_status` (`status_workflow`),
    INDEX `idx_risk_kategori` (`kategori_risiko`),
    INDEX `idx_risk_tingkat` (`current_tingkat_risiko`),
    INDEX `idx_risk_inherent` (`inherent_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. TABEL: pengendalian_triwulan (Pemantauan Pengendalian TW 1 - TW 4)
-- ---------------------------------------------------------------------
CREATE TABLE `pengendalian_triwulan` (
    `id` VARCHAR(64) PRIMARY KEY,
    `risk_id` VARCHAR(64) NOT NULL,
    `kode_risiko` VARCHAR(64) NOT NULL DEFAULT '',
    `triwulan` ENUM('TW 1', 'TW 2', 'TW 3', 'TW 4') NOT NULL,
    `realisasi_kegiatan` TEXT NOT NULL,
    `realisasi_biaya` DECIMAL(15, 2) DEFAULT 0.00,
    `progress_persen` INT DEFAULT 0,
    `progress_fisik_pic` INT DEFAULT NULL,
    `progres_pengerjaan_admin` INT DEFAULT NULL,
    `kemungkinan_residual` INT DEFAULT 1,
    `dampak_residual` INT DEFAULT 1,
    `residual_score` INT GENERATED ALWAYS AS (`kemungkinan_residual` * `dampak_residual`) STORED,
    `tingkat_residual` VARCHAR(50) NOT NULL,
    `status_pengendalian` VARCHAR(50) NOT NULL DEFAULT 'On Track',
    `kendala_dan_tindak_lanjut` TEXT,
    `reported_by` VARCHAR(150) NOT NULL DEFAULT 'PIC Pelaksana',
    `pic_report_date` VARCHAR(64) DEFAULT NULL,
    `is_pic_acc` TINYINT(1) DEFAULT 0,
    `acc_by` VARCHAR(150) DEFAULT NULL,
    `acc_date` VARCHAR(64) DEFAULT NULL,
    `catatan_admin_acc` TEXT DEFAULT NULL,
    `status_keputusan` VARCHAR(64) DEFAULT NULL,
    `catatan_evaluasi_admin` TEXT DEFAULT NULL,
    `tanggal_evaluasi` VARCHAR(64) DEFAULT NULL,
    `dievaluasi_oleh` VARCHAR(150) DEFAULT NULL,
    `detail_evaluasi_json` LONGTEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_quarterly_pusri_risk` FOREIGN KEY (`risk_id`) REFERENCES `pusri_risks`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_risk_triwulan` (`risk_id`, `triwulan`),
    INDEX `idx_tw_risk` (`risk_id`),
    INDEX `idx_quarterly_status` (`status_pengendalian`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. TABEL: pelaksanaan_tindakan (Realisasi Rencana Aksi Mitigasi)
-- ---------------------------------------------------------------------
CREATE TABLE `pelaksanaan_tindakan` (
    `id` VARCHAR(64) PRIMARY KEY,
    `risk_id` VARCHAR(64) NOT NULL,
    `kode_risiko` VARCHAR(64) NOT NULL,
    `triwulan` VARCHAR(16) DEFAULT NULL,
    `tanggal_pelaksanaan` VARCHAR(32) NOT NULL,
    `pic_pelaksana` VARCHAR(255) NOT NULL,
    `uraian_tindakan` TEXT NOT NULL,
    `progress_persen` INT DEFAULT 0,
    `status_pelaksanaan` VARCHAR(64) NOT NULL DEFAULT 'Belum Dilaksanakan',
    `realisasi_biaya` DECIMAL(15, 2) DEFAULT 0.00,
    `efektivitas` VARCHAR(64) NOT NULL DEFAULT 'Belum Dinilai',
    `kendala_dan_hambatan` TEXT,
    `tindak_lanjut` TEXT,
    `nomor_bukti_dokumen` VARCHAR(255) DEFAULT NULL,
    `catatan_admin` TEXT DEFAULT NULL,
    `is_acc_admin` TINYINT(1) DEFAULT 0,
    `acc_admin_by` VARCHAR(150) DEFAULT NULL,
    `acc_admin_date` VARCHAR(64) DEFAULT NULL,
    `diperbarui_oleh` VARCHAR(150) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_action_pusri_risk` FOREIGN KEY (`risk_id`) REFERENCES `pusri_risks`(`id`) ON DELETE CASCADE,
    INDEX `idx_action_risk` (`risk_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. TABEL: carry_over (Evaluasi Risiko Lanjutan Lintas Tahun RKAP)
-- ---------------------------------------------------------------------
CREATE TABLE `carry_over` (
    `id` VARCHAR(64) PRIMARY KEY,
    `risk_id` VARCHAR(64) NOT NULL UNIQUE,
    `kode_risiko` VARCHAR(64) NOT NULL,
    `nama_organisasi` VARCHAR(255) NOT NULL,
    `pernyataan_risiko` TEXT NOT NULL,
    `kategori_risiko` VARCHAR(100) NOT NULL,
    `current_tingkat_risiko` VARCHAR(50) NOT NULL,
    `status_workflow` VARCHAR(100) NOT NULL,
    `progress_terakhir` INT DEFAULT 0,
    `target_tahun` INT NOT NULL DEFAULT 2027,
    `alasan_carry_over` TEXT NOT NULL,
    `rekomendasi_komite` TEXT NOT NULL,
    `approval_carry_over_by` VARCHAR(255) DEFAULT 'Komite Risiko Pusri',
    `tanggal_carry_over` DATE DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_carryover_pusri_risk` FOREIGN KEY (`risk_id`) REFERENCES `pusri_risks`(`id`) ON DELETE CASCADE,
    INDEX `idx_carry_status` (`status_workflow`),
    INDEX `idx_carry_tingkat` (`current_tingkat_risiko`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. TABEL: audit_log_risiko (Riwayat Audit Trail & Jejak Perubahan)
-- ---------------------------------------------------------------------
CREATE TABLE `audit_log_risiko` (
    `id` VARCHAR(64) PRIMARY KEY,
    `risk_id` VARCHAR(64) NOT NULL DEFAULT '',
    `kode_risiko` VARCHAR(64) NOT NULL DEFAULT '',
    `user_role` VARCHAR(64) NOT NULL DEFAULT 'risk officer',
    `actor_name` VARCHAR(255) NOT NULL DEFAULT 'Risk System',
    `action` VARCHAR(128) NOT NULL,
    `previous_status` VARCHAR(64) DEFAULT NULL,
    `new_status` VARCHAR(64) DEFAULT NULL,
    `notes` TEXT,
    `ip_address` VARCHAR(64) DEFAULT '127.0.0.1',
    `latency_ms` DECIMAL(6, 2) DEFAULT 4.20,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_risk_id` (`risk_id`),
    INDEX `idx_audit_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. TABEL: sync_event_modul (Log Sinkronisasi Antar-Modul REST API)
-- ---------------------------------------------------------------------
CREATE TABLE `sync_event_modul` (
    `id` VARCHAR(64) PRIMARY KEY,
    `module_source` VARCHAR(128) NOT NULL,
    `module_target` VARCHAR(128) NOT NULL,
    `endpoint` VARCHAR(255) NOT NULL,
    `method` VARCHAR(16) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'SYNCED',
    `duration_ms` DECIMAL(8, 2) NOT NULL DEFAULT 4.50,
    `payload_summary` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sync_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. TABEL: master_sumber_risiko (Master Data Sumber Risiko - Khusus Admin)
-- ---------------------------------------------------------------------
CREATE TABLE `master_sumber_risiko` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `kategori` VARCHAR(150) NOT NULL,
    `sumber_risiko` VARCHAR(500) NOT NULL,
    `urutan` INT DEFAULT 0,
    `dibuat_oleh` VARCHAR(150) DEFAULT 'Risk Admin',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_master_sumber_risiko` (`kategori`, `sumber_risiko`(191)),
    INDEX `idx_sumber_kategori` (`kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. TABEL: master_likelihood_consequence
-- ---------------------------------------------------------------------
CREATE TABLE `master_likelihood_consequence` (
    `id` VARCHAR(20) NOT NULL,
    `likelihood` TINYINT UNSIGNED NOT NULL,
    `keterangan_en` VARCHAR(100) NOT NULL,
    `keterangan_id` VARCHAR(100) NOT NULL,
    `c1` ENUM('L', 'LM', 'M', 'MH', 'H') NOT NULL,
    `c2` ENUM('L', 'LM', 'M', 'MH', 'H') NOT NULL,
    `c3` ENUM('L', 'LM', 'M', 'MH', 'H') NOT NULL,
    `c4` ENUM('L', 'LM', 'M', 'MH', 'H') NOT NULL,
    `c5` ENUM('L', 'LM', 'M', 'MH', 'H') NOT NULL,
    `status` ENUM('Aktif', 'Nonaktif') NOT NULL DEFAULT 'Aktif',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_master_likelihood_level` (`likelihood`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DATA INSERTS
-- =====================================================================

-- ---------------------------------------------------------------------
-- DATA: master_organisasi (28 records)
-- ---------------------------------------------------------------------
INSERT INTO `master_organisasi` (`kode`, `nama`, `direktorat`, `kepala_unit`, `jabatan_kepala`, `email_unit`, `total_risiko`, `officers_json`, `owners_json`) VALUES
('JD300000', 'DEPARTEMEN ANGGARAN', 'Direktorat Keuangan & Umum', 'Vice President Anggaran', 'Vice President Anggaran', 'jd300000@pusri.co.id', 0, '[{\"nik\":\"112128\",\"nama\":\"Ria Ramadi Kurniawan\"},{\"nik\":\"12345\",\"nama\":\"Anggun\"}]', '[{\"nik\":\"080268\",\"nama\":\"Livia Sarlita\"}]'),
('HUMAS', 'Departemen Hubungan Masyarakat (Humas)', 'Sekretariat Perusahaan', 'Rustam Effendi, S.Sos. (VP)', 'Rustam Effendi, S.Sos. (VP)', 'humas@pusri.co.id', 0, '[{\"nik\":\"139981\",\"nama\":\"Nadia Safitri\"}]', '[{\"nik\":\"050212\",\"nama\":\"Rustam Effendi, S.Sos.\"}]'),
('HUKUM', 'Departemen Hukum (Corporate Legal)', 'Sekretariat Perusahaan', 'Maya Lestari, S.H., M.Kn. (VP)', 'Maya Lestari, S.H., M.Kn. (VP)', 'hukum@pusri.co.id', 0, '[{\"nik\":\"160204\",\"nama\":\"Nadia Salsabila\"}]', '[{\"nik\":\"050789\",\"nama\":\"Maya Lestari, S.H., M.Kn.\"}]'),
('INSP-TEK', 'Departemen Inspeksi Teknik', 'Direktorat Operasi & Produksi', 'Ir. Wahyu Hidayat (VP)', 'Ir. Wahyu Hidayat (VP)', 'insptek@pusri.co.id', 0, '[{\"nik\":\"129983\",\"nama\":\"Doni Prasetya\"}]', '[{\"nik\":\"050412\",\"nama\":\"Ir. Wahyu Hidayat\"}]'),
('SEKURITI', 'Departemen Keamanan / Sekuriti', 'Direktorat SDM & Umum', 'Mayor (Purn) Darmawan (VP)', 'Mayor (Purn) Darmawan (VP)', 'sekuriti@pusri.co.id', 0, '[{\"nik\":\"134590\",\"nama\":\"Eko Wahyudi\"}]', '[{\"nik\":\"060134\",\"nama\":\"Mayor (Purn) Darmawan\"}]'),
('K3', 'Departemen Keselamatan & Kesehatan Kerja (K3)', 'Direktorat Operasi & Produksi', 'Agus Setiawan, S.T., M.Env. (VP)', 'Agus Setiawan, S.T., M.Env. (VP)', 'k3@pusri.co.id', 0, '[{\"nik\":\"141205\",\"nama\":\"Bayu Wicaksono\"}]', '[{\"nik\":\"070334\",\"nama\":\"Agus Setiawan, S.T., M.Env.\"}]'),
('KEU-AKUN', 'Departemen Keuangan & Akuntansi', 'Direktorat Keuangan & Umum', 'Ahmad Fauzi, S.E., Ak. (VP)', 'Ahmad Fauzi, S.E., Ak. (VP)', 'keuakun@pusri.co.id', 0, '[{\"nik\":\"140992\",\"nama\":\"Fajar Siddiq\"}]', '[{\"nik\":\"060445\",\"nama\":\"Ahmad Fauzi, S.E., Ak.\"}]'),
('50000259', 'DEPARTEMEN KOMUNIKASI & ADMINISTRASI KORPORAT', 'Sekretariat Perusahaan', 'Vice President Komunikasi & Administrasi Korporat', 'Vice President Komunikasi & Administrasi Korporat', '50000259@pusri.co.id', 0, '[{\"nik\":\"153068\",\"nama\":\"Glory Liani Putri\"},{\"nik\":\"140701\",\"nama\":\"Wildan Muttaqin\"},{\"nik\":\"111104\",\"nama\":\"M Iqbal Akbar\"}]', '[{\"nik\":\"930011\",\"nama\":\"Rustam Effendi\"}]'),
('LH', 'Departemen Lingkungan Hidup', 'Direktorat Operasi & Produksi', 'Dr. Ir. Ratna Sari (VP)', 'Dr. Ir. Ratna Sari (VP)', 'lh@pusri.co.id', 0, '[{\"nik\":\"150881\",\"nama\":\"Dewi Anggraini\"}]', '[{\"nik\":\"040119\",\"nama\":\"Dr. Ir. Ratna Sari\"}]'),
('50000260', 'DEPARTEMEN MANAJEMEN RISIKO', 'Direktorat Utama', 'Vice President Manajemen Risiko', 'Vice President Manajemen Risiko', '50000260@pusri.co.id', 0, '[{\"nik\":\"140088\",\"nama\":\"Ade Lia Diani Safitri\"},{\"nik\":\"080557\",\"nama\":\"Nurhadi\"},{\"nik\":\"080482\",\"nama\":\"Arimeldi Adrian\"},{\"nik\":\"122424\",\"nama\":\"Heru Presetio\"},{\"nik\":\"090061\",\"nama\":\"Khoiril Anwar\"}]', '[{\"nik\":\"930116\",\"nama\":\"Amir Hamzah\"}]'),
('MR-CORP', 'Departemen Manajemen Risiko Korporat', 'Direktorat Utama', 'Vice President Manajemen Risiko Korporat', 'Vice President Manajemen Risiko Korporat', 'mrcorp@pusri.co.id', 0, '[{\"nik\":\"140088\",\"nama\":\"Ade Lia Diani Safitri\"},{\"nik\":\"080482\",\"nama\":\"Arimeldi Adrian\"}]', '[{\"nik\":\"930116\",\"nama\":\"Amir Hamzah\"}]'),
('OP-IIB', 'Departemen Operasi Pabrik Pusri IIB', 'Direktorat Operasi & Produksi', 'Bambang Irawan, S.T. (VP)', 'Bambang Irawan, S.T. (VP)', 'opiib@pusri.co.id', 0, '[{\"nik\":\"132109\",\"nama\":\"M. Ridwan Fadli\"}]', '[{\"nik\":\"050112\",\"nama\":\"Bambang Irawan, S.T.\"}]'),
('OP-III', 'Departemen Operasi Pabrik Pusri III', 'Direktorat Operasi & Produksi', 'Ir. Ahmad Subari (VP)', 'Ir. Ahmad Subari (VP)', 'opiii@pusri.co.id', 0, '[{\"nik\":\"133201\",\"nama\":\"Hendra Saputra\"}]', '[{\"nik\":\"040811\",\"nama\":\"Ir. Ahmad Subari\"}]'),
('OP-IV', 'Departemen Operasi Pabrik Pusri IV', 'Direktorat Operasi & Produksi', 'Kurniawan Pratama, S.T. (VP)', 'Kurniawan Pratama, S.T. (VP)', 'opiv@pusri.co.id', 0, '[{\"nik\":\"142318\",\"nama\":\"Fajar Nugraha\"}]', '[{\"nik\":\"061022\",\"nama\":\"Kurniawan Pratama, S.T.\"}]'),
('OP-V', 'Departemen Operasi Pabrik Pusri V', 'Direktorat Operasi & Produksi', 'M. Rizky Ramadhan, S.T. (VP)', 'M. Rizky Ramadhan, S.T. (VP)', 'opv@pusri.co.id', 0, '[{\"nik\":\"150419\",\"nama\":\"Ilham Syahputra\"}]', '[{\"nik\":\"070933\",\"nama\":\"M. Rizky Ramadhan, S.T.\"}]'),
('HAR-ELINS', 'Departemen Pemeliharaan Listrik & Instrumen', 'Direktorat Operasi & Produksi', 'Agung Wicaksono, S.T. (VP)', 'Agung Wicaksono, S.T. (VP)', 'harelins@pusri.co.id', 0, '[{\"nik\":\"138812\",\"nama\":\"Satria Dewa\"}]', '[{\"nik\":\"061245\",\"nama\":\"Agung Wicaksono, S.T.\"}]'),
('HAR-MEK', 'Departemen Pemeliharaan Mekanikal', 'Direktorat Operasi & Produksi', 'Ir. Hendra Kusuma (VP)', 'Ir. Hendra Kusuma (VP)', 'harmek@pusri.co.id', 0, '[{\"nik\":\"121990\",\"nama\":\"Reza Pratama\"}]', '[{\"nik\":\"060877\",\"nama\":\"Ir. Hendra Kusuma\"}]'),
('DIKLAT', 'Departemen Pendidikan & Pelatihan (Diklat)', 'Direktorat SDM & Umum', 'Budi Santoso, S.Pd., M.M. (VP)', 'Budi Santoso, S.Pd., M.M. (VP)', 'diklat@pusri.co.id', 0, '[{\"nik\":\"141872\",\"nama\":\"Ahmad Syafiq\"}]', '[{\"nik\":\"071109\",\"nama\":\"Budi Santoso, S.Pd., M.M.\"}]'),
('PENGADAAN', 'Departemen Pengadaan Barang & Jasa', 'Direktorat Keuangan & Umum', 'Arief Budiman, S.T. (VP)', 'Arief Budiman, S.T. (VP)', 'pengadaan@pusri.co.id', 0, '[{\"nik\":\"141098\",\"nama\":\"Rahmat Hidayat\"}]', '[{\"nik\":\"061145\",\"nama\":\"Arief Budiman, S.T.\"}]'),
('50095068', 'Departemen Pengel. Transformasi Bisnis', 'Direktorat Transformasi Bisnis', 'Vice President Pengelolaan Transformasi Bisnis', 'Vice President Pengelolaan Transformasi Bisnis', '50095068@pusri.co.id', 0, '[]', '[]'),
('SDM-ORG', 'Departemen Pengembangan SDM & Organisasi', 'Direktorat SDM & Umum', 'Nurul Hidayati, S.Psi., M.M. (VP)', 'Nurul Hidayati, S.Psi., M.M. (VP)', 'sdmorg@pusri.co.id', 0, '[{\"nik\":\"130456\",\"nama\":\"Taufik Hidayat\"}]', '[{\"nik\":\"080321\",\"nama\":\"Nurul Hidayati, S.Psi., M.M.\"}]'),
('REM-HI', 'Departemen Remunerasi & Hubungan Industrial', 'Direktorat SDM & Umum', 'Indra Gunawan, S.H. (VP)', 'Indra Gunawan, S.H. (VP)', 'remhi@pusri.co.id', 0, '[{\"nik\":\"139044\",\"nama\":\"Roni Iskandar\"}]', '[{\"nik\":\"061988\",\"nama\":\"Indra Gunawan, S.H.\"}]'),
('RP-PROD', 'Departemen Rencana & Pengendalian Produksi', 'Direktorat Operasi & Produksi', 'Faisal Akbar, M.T. (VP)', 'Faisal Akbar, M.T. (VP)', 'rpprod@pusri.co.id', 0, '[{\"nik\":\"130776\",\"nama\":\"Ilham Ramadhan\"}]', '[{\"nik\":\"070114\",\"nama\":\"Faisal Akbar, M.T.\"}]'),
('SAR-UMUM', 'Departemen Sarana & Umum', 'Direktorat SDM & Umum', 'Drs. Heru Prasetyo (VP)', 'Drs. Heru Prasetyo (VP)', 'sarumum@pusri.co.id', 0, '[{\"nik\":\"128834\",\"nama\":\"Dedi Sunardi\"}]', '[{\"nik\":\"051120\",\"nama\":\"Drs. Heru Prasetyo\"}]'),
('TJSL', 'Departemen Tanggung Jawab Sosial & Lingkungan (TJSL)', 'Direktorat Keuangan & Umum', 'Dra. Sri Wahyuni, M.M. (VP)', 'Dra. Sri Wahyuni, M.M. (VP)', 'tjsl@pusri.co.id', 0, '[{\"nik\":\"145612\",\"nama\":\"Intan Permata\"}]', '[{\"nik\":\"062201\",\"nama\":\"Dra. Sri Wahyuni, M.M.\"}]'),
('TI', 'Departemen Teknologi Informasi', 'Direktorat Transformasi Bisnis', 'Ir. Dedi Kurniawan, M.Kom. (VP)', 'Ir. Dedi Kurniawan, M.Kom. (VP)', 'ti@pusri.co.id', 0, '[{\"nik\":\"150117\",\"nama\":\"Dimas Arya\"}]', '[{\"nik\":\"050998\",\"nama\":\"Ir. Dedi Kurniawan, M.Kom.\"}]'),
('50000253', 'KOMPARTEMEN SATUAN PENGAWASAN INTERN', 'Satuan Pengawasan Intern', 'Kepala Satuan Pengawasan Intern (SVP)', 'Kepala Satuan Pengawasan Intern (SVP)', '50000253@pusri.co.id', 0, '[{\"nik\":\"040478\",\"nama\":\"Firman Ajie Rayotomo\"}]', '[{\"nik\":\"040866\",\"nama\":\"DIAN PERMATASARI\"}]'),
('50000252', 'KOMPARTEMEN SEKRETARIS PERUSAHAAN', 'Sekretariat Perusahaan', 'SVP / Sekretaris Perusahaan', 'SVP / Sekretaris Perusahaan', '50000252@pusri.co.id', 0, '[{\"nik\":\"070665\",\"nama\":\"Andika Putra\"}]', '[{\"nik\":\"040981\",\"nama\":\"Indah Irmayani\"}]');

-- ---------------------------------------------------------------------
-- DATA: master_sumber_risiko (31 records)
-- ---------------------------------------------------------------------
INSERT INTO `master_sumber_risiko` (`kategori`, `sumber_risiko`, `urutan`, `dibuat_oleh`) VALUES
('Material', 'Ketersediaan material /Spare Part /Produk / Bahan Penunjang', 1, 'DAFFA ARI PRASETYA (0952)'),
('Material', 'Spesifikasi & mutu material / Spare part/Produk / Bahan Penunjang', 2, 'DAFFA ARI PRASETYA (0952)'),
('Material', 'Delivery time material/ Spare part/Produk / Bahan Penunjang pesanan', 3, 'DAFFA ARI PRASETYA (0952)'),
('Material', 'Ketersediaan material / Spare part/Produk / Bahan Penunjang pengganti/substitusi', 4, 'DAFFA ARI PRASETYA (0952)'),
('Material', 'Harga Material / Spare part/Produk / Bahan Penunjang', 5, 'DAFFA ARI PRASETYA (0952)'),
('Mesin', 'Usia mesin / Peralatan', 1, 'Risk Admin'),
('Mesin', 'Mesin tidak berfungsi dengan baik atau rusak', 2, 'Risk Admin'),
('Mesin', 'Mesin pesanan tidak sesuai specs dan mutu', 3, 'Risk Admin'),
('Mesin', 'Keusangan (obsolete)', 4, 'Risk Admin'),
('Mesin', 'Adaptasi mesin', 5, 'Risk Admin'),
('Mesin', 'Mesin tidak tersedia', 6, 'Risk Admin'),
('Method', 'Metode tidak ada', 1, 'Risk Admin'),
('Method', 'Metode ada tapi tidak mencukupi', 2, 'Risk Admin'),
('Method', 'Metode rumit dan sulit dipahami dengan baik', 3, 'Risk Admin'),
('Method', 'Metode tidak baku', 4, 'Risk Admin'),
('Money/Dana', 'Dana terbatas (likuiditas)', 1, 'Risk Admin'),
('Money/Dana', 'Keterlambatan pencairan dana / cash flow', 2, 'Risk Admin'),
('Money/Dana', 'Fluktuasi kurs / nilai tukar mata uang', 3, 'Risk Admin'),
('Money/Dana', 'Kenaikan suku bunga / beban pembiayaan', 4, 'Risk Admin'),
('Man / Manusia (SDM)', 'Kompetensi personil tidak mencukupi', 1, 'Risk Admin'),
('Man / Manusia (SDM)', 'Kekurangan personil / beban kerja berlebih', 2, 'Risk Admin'),
('Man / Manusia (SDM)', 'Human error / kelalaian operasional', 3, 'Risk Admin'),
('Man / Manusia (SDM)', 'Pelatihan dan sertifikasi belum memadai', 4, 'Risk Admin'),
('Man / Manusia (SDM)', 'Kepatuhan SOP & disiplin K3 rendah', 5, 'Risk Admin'),
('Milieu / Lingkungan & Regulasi', 'Kondisi cuaca ekstrem & faktor alam', 1, 'Risk Admin'),
('Milieu / Lingkungan & Regulasi', 'Perubahan regulasi dan kebijakan pemerintah', 2, 'Risk Admin'),
('Milieu / Lingkungan & Regulasi', 'Dampak lingkungan dan emisi limbah', 3, 'Risk Admin'),
('Milieu / Lingkungan & Regulasi', 'Dinamika sosial masyarakat sekitar', 4, 'Risk Admin'),
('Market / Pasar & Pasokan', 'Fluktuasi harga komoditas pupuk & bahan baku gas', 1, 'Risk Admin'),
('Market / Pasar & Pasokan', 'Penurunan permintaan pasar / daya serap konsumen', 2, 'Risk Admin'),
('Market / Pasar & Pasokan', 'Keterlambatan rantai pasok & logistik distribusi', 3, 'Risk Admin');

-- ---------------------------------------------------------------------
-- DATA: master_likelihood_consequence
-- ---------------------------------------------------------------------
INSERT INTO `master_likelihood_consequence` (`id`, `likelihood`, `keterangan_en`, `keterangan_id`, `c1`, `c2`, `c3`, `c4`, `c5`, `status`) VALUES
('lc-1', 1, 'Almost Never', 'Sangat Rendah', 'L', 'L', 'LM', 'M', 'H', 'Aktif'),
('lc-2', 2, 'Unlikely', 'Rendah', 'L', 'LM', 'LM', 'MH', 'H', 'Aktif'),
('lc-3', 3, 'Possible', 'Sedang', 'L', 'LM', 'M', 'MH', 'H', 'Aktif'),
('lc-4', 4, 'Likely', 'Tinggi', 'L', 'LM', 'M', 'MH', 'H', 'Aktif'),
('lc-5', 5, 'Almost Certain', 'Sangat Tinggi', 'LM', 'M', 'MH', 'H', 'H', 'Aktif');

-- ---------------------------------------------------------------------
-- DATA: user_accounts (4 records)
-- ---------------------------------------------------------------------
INSERT INTO `user_accounts` (`id`, `username`, `nama`, `nik`, `badge`, `password`, `password_hash`, `role`, `jabatan`, `unit_kerja`, `kode_unit`, `kode_unit_kerja`, `email`, `account_status`, `auth_provider`, `approved_by`) VALUES
('usr-0950', 'dappa', 'DAPPA ARI PRASETYA', '0950', '0950', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'risk admin', 'Super Admin Enterprise Risk Management Korporat (Risk Admin)', 'Departemen Teknologi Informasi', 'TI', 'TI', 'dafaprasetya947@gmail.com', 'active', 'PUSRI_IAM_SSO', 'Sistem IAM Korporat Pusri'),
('usr-0951', '0951', 'M DAVI RAMADHAN', '0951', '0951', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'risk owner', 'Vice President Operasi Pabrik Pusri IIB (Risk Owner)', 'Departemen Operasi Pabrik Pusri IIB', 'OP-IIB', 'OP-IIB', 'm.davi@pusri.co.id', 'active', 'PUSRI_IAM_SSO', 'Sistem IAM Korporat Pusri'),
('usr-0952', '0952', 'DAFFA ARI PRASETYA', '0952', '0952', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'risk admin', 'Super Admin Enterprise Risk Management Korporat (Risk Admin)', 'Departemen Manajemen Risiko Korporat', 'MR-CORP', 'MR-CORP', 'daffa.ari@pusri.co.id', 'active', 'PUSRI_IAM_SSO', 'Sistem IAM Korporat Pusri'),
('usr-0953', '0953', 'FAUZAN AL GHANIYYU', '0953', '0953', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'risk officer', 'Risk Officer Unit Kerja Pabrik', 'Departemen Operasi Pabrik Pusri IIB', 'OP-IIB', 'OP-IIB', 'fauzan.al@pusri.co.id', 'active', 'PUSRI_IAM_SSO', 'Sistem IAM Korporat Pusri');

-- ---------------------------------------------------------------------
-- DATA: audit_log_risiko (123 records)
-- ---------------------------------------------------------------------
INSERT INTO `audit_log_risiko` (`id`, `risk_id`, `kode_risiko`, `user_role`, `actor_name`, `action`, `previous_status`, `new_status`, `notes`, `latency_ms`) VALUES
('log-1793584428635-sr58', 'RSK-2026-008', 'RSK-2026-008', 'risk owner', 'ANGGUN AYU (0960)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Tercatat_Final', 'Update data risiko RSK-2026-008 [Menunggu_Approval_VP -> Tercatat_Final]', 6),
('log-1793584403397-h1rf', 'RSK-2026-008', 'RSK-2026-008', 'risk officer', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_VP', 'Pendaftaran risiko baru unit kerja: dddddddddddddddddddddd...', 7.7),
('log-1793583958715-dd74', 'RSK-2026-007', 'RSK-2026-007', 'risk officer', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Tercatat_Final', 'Pendaftaran risiko baru unit kerja: aaaaaaaaaaaa...', 9.2),
('log-1793583904300-nz1s', 'RSK-2026-006', 'RSK-2026-006', 'risk officer', 'DAFFA ARI PRASETYA (Badge 0952 - Super Admin Enterprise Risk Management Korporat (Risk Admin))', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_VP', 'Pendaftaran risiko baru unit kerja: sssssssssssssssssscccc...', 9.2),
('log-1793583835971-ozsa', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Carry_Over', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 1 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: Mod to High', 6.8),
('log-1793583825241-0jvw', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2026-005 [Carry_Over -> Carry_Over]', 8.7),
('log-1793583820119-ms9b', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Carry_Over', 'Carry_Over', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 1. Catatan: z', 4.5),
('log-1793583803694-w6lw', 'RSK-2026-005', 'RSK-2026-005', 'risk officer', 'SYENA (0964)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2026-005 [Carry_Over -> Carry_Over]', 6.2),
('log-1793583796310-3b49', 'RSK-2026-005', 'RSK-2026-005', 'risk officer', 'SYENA (0964)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2026-005 [Carry_Over -> Carry_Over]', 7),
('log-1793583715934-lbh8', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2026-005 [Carry_Over -> Carry_Over]', 7),
('log-1793583691598-9yhy', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Carry_Over', 'Evaluasi TW 4 oleh Admin: Keputusan [Carry_Over], Tingkat Residual: Moderate', 6.8),
('log-1793583665376-mhp2', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-005 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 5.3),
('log-1793583663437-5qqi', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 4. Catatan: c', 4.5),
('log-1793583646769-l8fe', 'RSK-2026-005', 'RSK-2026-005', 'risk officer', 'SYENA (0964)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-005 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 5.4),
('log-1793583593966-1t8q', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 3 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: Low to Mod', 6.8),
('log-1793583580788-a4op', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-005 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 6.9),
('log-1793583578697-0wrp', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 3. Catatan: m\n', 4.5),
('log-1793583559805-m3dg', 'RSK-2026-005', 'RSK-2026-005', 'risk officer', 'VIZANIA (0961)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-005 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 6.3),
('log-1793583300528-jfua', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 2 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: Moderate', 6.8),
('log-1793583289560-6hsk', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-005 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 5.6),
('log-1793583287048-00p7', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 2. Catatan: m', 4.5),
('log-1793583260819-7dli', 'RSK-2026-005', 'RSK-2026-005', 'risk officer', 'SYENA (0964)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-005 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 7.1),
('log-1793583215932-a7lk', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 1 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: Mod to High', 6.8),
('log-1793583163635-gudk', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-005 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 8.7),
('log-1793582782007-z3b8', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 1. Catatan: oke sudah sesuai ', 4.5),
('log-1793582749481-4ql0', 'RSK-2026-005', 'RSK-2026-005', 'risk officer', 'SYENA (0964)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-005 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 9),
('log-1793582687887-ps1a', 'RSK-2026-005', 'RSK-2026-005', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_Admin', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-005 [Menunggu_Approval_Admin -> Disetujui_Dalam_Pengendalian]', 5.9),
('log-1793582661598-r7z9', 'RSK-2026-005', 'RSK-2026-005', 'risk owner', 'RIZKY (0966)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Menunggu_Approval_Admin', 'Update data risiko RSK-2026-005 [Menunggu_Approval_VP -> Menunggu_Approval_Admin]', 5.9),
('log-1793582651089-2w8z', 'RSK-2026-005', 'RSK-2026-005', 'risk officer', 'SYENA (0964)', 'STATUS_WORKFLOW_CHANGED', 'Revisi', 'Menunggu_Approval_VP', 'Update data risiko RSK-2026-005 [Revisi -> Menunggu_Approval_VP]', 6),
('log-1793582626581-c6nw', 'RSK-2026-005', 'RSK-2026-005', 'risk owner', 'RIZKY (0966)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Revisi', 'Update data risiko RSK-2026-005 [Menunggu_Approval_VP -> Revisi]', 7.3),
('log-1793582414351-d5ue', 'RSK-2026-005', 'RSK-2026-005', 'risk officer', 'SYENA (Badge 0964 - vp Keuangan & Akuntansi)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_VP', 'Pendaftaran risiko baru unit kerja: aaaaaaaaaaaaaaa...', 6.9),
('log-1793353173511-2s1n', 'RSK-2026-004', 'RSK-2026-004', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_Admin', 'Draft_Unit', 'Update data risiko RSK-2026-004 [Menunggu_Approval_Admin -> Draft_Unit]', 6.2),
('log-1793353164991-a3uv', 'RSK-2026-004', 'RSK-2026-004', 'risk owner', 'ANGGUN AYU (0960)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Menunggu_Approval_Admin', 'Update data risiko RSK-2026-004 [Menunggu_Approval_VP -> Menunggu_Approval_Admin]', 5.3),
('log-1793353144714-w2yu', 'RSK-2026-004', 'RSK-2026-004', 'risk officer', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_VP', 'Pendaftaran risiko baru unit kerja: fiyyyyyyyyyyy...', 7.1),
('log-1793353072303-3yog', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2026-003 [Carry_Over -> Carry_Over]', 8.9),
('log-1793352885200-wnlc', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2026-003 [Carry_Over -> Carry_Over]', 6.1),
('log-1793352859568-1hlu', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2026-003 [Carry_Over -> Carry_Over]', 8.4),
('log-1793352811293-0jpm', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Carry_Over', 'Evaluasi TW 4 oleh Admin: Keputusan [Carry_Over], Tingkat Residual: Mod to High', 6.8),
('log-1793352785418-xdc2', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-003 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 6),
('log-1793352781498-hmi4', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 4. Catatan: l', 4.5),
('log-1793352753948-0oeo', 'RSK-2026-003', 'RSK-2026-003', 'risk officer', 'SYENA (0964)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-003 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 7.6),
('log-1793352564387-bprs', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 3 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: Mod to High', 6.8),
('log-1793352356215-v01o', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-003 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 8.3),
('log-1793352350532-kppx', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 3. Catatan: l', 4.5),
('log-1793352285994-e7td', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 2 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: High', 6.8),
('log-1793352147128-5q5i', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-003 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 7.8),
('log-1793352145106-rzrc', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 2. Catatan: l', 4.5),
('log-1793352118363-mdh2', 'RSK-2026-003', 'RSK-2026-003', 'risk officer', 'SYENA (0964)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-003 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 5.2),
('log-1793352002530-s4yf', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 1 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: Mod to High', 6.8),
('log-1793351931409-haas', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-003 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 6.7),
('log-1793351924653-fe0u', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 1. Catatan: disetujui', 4.5),
('log-1793351906780-wqxu', 'RSK-2026-003', 'RSK-2026-003', 'risk officer', 'SYENA (0964)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-003 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 5.4),
('log-1793351863612-p47d', 'RSK-2026-003', 'RSK-2026-003', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_Admin', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-003 [Menunggu_Approval_Admin -> Disetujui_Dalam_Pengendalian]', 5.4),
('log-1793351829015-d8f6', 'RSK-2026-003', 'RSK-2026-003', 'risk owner', 'ANGGUN AYU (0960)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Menunggu_Approval_Admin', 'Update data risiko RSK-2026-003 [Menunggu_Approval_VP -> Menunggu_Approval_Admin]', 8.9),
('log-1793351806020-tvtp', 'RSK-2026-003', 'RSK-2026-003', 'risk officer', 'VIZANIA (0961)', 'STATUS_WORKFLOW_CHANGED', 'Revisi', 'Menunggu_Approval_VP', 'Update data risiko RSK-2026-003 [Revisi -> Menunggu_Approval_VP]', 6.1),
('log-1793351431483-pu2g', 'RSK-2026-003', 'RSK-2026-003', 'risk owner', 'ANGGUN AYU (0960)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Revisi', 'Update data risiko RSK-2026-003 [Menunggu_Approval_VP -> Revisi]', 6),
('log-1793351379825-qul3', 'RSK-2026-003', 'RSK-2026-003', 'risk officer', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_VP', 'Pendaftaran risiko baru unit kerja: ddddddddddd...', 9.6),
('log-1793351304231-06pl', 'RSK-2026-001', 'RSK-2026-001', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Carry_Over', 'Evaluasi TW 1 oleh Admin: Keputusan [Carry_Over], Tingkat Residual: Low to Mod', 6.8),
('log-1793351292449-k88f', 'RSK-2026-001', 'RSK-2026-001', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-001 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 8.4),
('log-1793351291263-kn4u', 'RSK-2026-001', 'RSK-2026-001', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 1. Catatan: j', 4.5),
('log-1793350794488-4t8r', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2026-002 [Carry_Over -> Carry_Over]', 6),
('log-1793350788496-ufjb', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Carry_Over', 'Carry_Over', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 1. Catatan: l', 4.5),
('log-1793350775694-9nw6', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Carry_Over', 'Carry_Over', 'Evaluasi TW 1 oleh Admin: Keputusan [Carry_Over], Tingkat Residual: Moderate', 6.8),
('log-1793350764422-3u4j', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2026-002 [Carry_Over -> Carry_Over]', 6),
('log-1793350762452-srif', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Carry_Over', 'Carry_Over', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 1. Catatan: l\n', 4.5),
('log-1793350709523-3mho', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2026-002 [Carry_Over -> Carry_Over]', 8.2),
('log-1793350586175-8gtn', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Carry_Over', 'Evaluasi TW 1 oleh Admin: Keputusan [Carry_Over], Tingkat Residual: Moderate', 6.8),
('log-1793350578327-qf3b', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 8.3),
('log-1793350440924-efcb', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 5.6),
('log-1793350320435-30n6', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 7.8),
('log-1793350252456-486u', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 7.6),
('log-1793350066320-e81k', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 7.1),
('log-1793349973430-9hwl', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 5.6),
('log-1793349525023-gtpo', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 4 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: Mod to High', 6.8),
('log-1793349465221-uz4y', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 7.1),
('log-1793349458831-vc31', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 4. Catatan: h', 4.5),
('log-1793349418320-j84o', 'RSK-2026-002', 'RSK-2026-002', 'risk officer', 'SYENA (0964)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 8.8),
('log-1793349303892-8nh2', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 3 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: Mod to High', 6.8),
('log-1793349278650-9mvy', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 8.9),
('log-1793349273688-x2nm', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 3. Catatan: l', 4.5),
('log-1793349244348-0ck9', 'RSK-2026-002', 'RSK-2026-002', 'risk officer', 'VIZANIA (0961)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 6.5),
('log-1793349201187-jc88', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 2 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: Mod to High', 6.8),
('log-1793349150023-blmu', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 5.5),
('log-1793349146328-s61e', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 2. Catatan: m\n', 4.5),
('log-1793349132916-qm23', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 1 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: Moderate', 6.8),
('log-1793349081889-urul', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 5.8),
('log-1793348002297-7r9t', 'RSK-2026-002', 'RSK-2026-002', 'risk officer', 'VIZANIA (0961)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 8.5),
('log-1793347929924-nt97', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_ACC_PIC_REPORT', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Admin [DAFFA ARI PRASETYA] telah melakukan ACC atas laporan pelaksanaan pengendalian PIC untuk TW 1. Catatan: k\n', 4.5),
('log-1793347853081-ow7a', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA', 'ADMIN_QUARTERLY_EVALUATION', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Evaluasi TW 1 oleh Admin: Keputusan [Pengendalian_Lanjutan], Tingkat Residual: Mod to High', 6.8),
('log-1793347767348-yddw', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 8.8),
('log-1793347574985-5aaq', 'RSK-2026-002', 'RSK-2026-002', 'risk officer', 'SYENA (0964)', 'RISK_UPDATED', 'Disetujui_Dalam_Pengendalian', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Disetujui_Dalam_Pengendalian -> Disetujui_Dalam_Pengendalian]', 6.3),
('log-1793347465812-8d92', 'RSK-2026-002', 'RSK-2026-002', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_Admin', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-002 [Menunggu_Approval_Admin -> Disetujui_Dalam_Pengendalian]', 7.8),
('log-1793347436909-srev', 'RSK-2026-002', 'RSK-2026-002', 'risk owner', 'ANGGUN AYU (0960)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Menunggu_Approval_Admin', 'Update data risiko RSK-2026-002 [Menunggu_Approval_VP -> Menunggu_Approval_Admin]', 6),
('log-1793347405822-v2m2', 'RSK-2026-002', 'RSK-2026-002', 'risk officer', 'VIZANIA (0961)', 'STATUS_WORKFLOW_CHANGED', 'Revisi', 'Menunggu_Approval_VP', 'Update data risiko RSK-2026-002 [Revisi -> Menunggu_Approval_VP]', 5.8),
('log-1793347387643-f1qc', 'RSK-2026-002', 'RSK-2026-002', 'risk owner', 'ANGGUN AYU (0960)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Revisi', 'Update data risiko RSK-2026-002 [Menunggu_Approval_VP -> Revisi]', 5.4),
('log-1793347374867-miou', 'RSK-2026-002', 'RSK-2026-002', 'risk officer', 'VIZANIA (0961)', 'STATUS_WORKFLOW_CHANGED', 'Revisi', 'Menunggu_Approval_VP', 'Update data risiko RSK-2026-002 [Revisi -> Menunggu_Approval_VP]', 8.9),
('log-1793347351798-hp5i', 'RSK-2026-002', 'RSK-2026-002', 'risk owner', 'ANGGUN AYU (0960)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Revisi', 'Update data risiko RSK-2026-002 [Menunggu_Approval_VP -> Revisi]', 7.5),
('log-1793347319287-sf0w', 'RSK-2026-002', 'RSK-2026-002', 'risk officer', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_VP', 'Pendaftaran risiko baru unit kerja: tttttttttttttttttttttttt...', 10.1),
('log-1793347205744-xoub', 'RSK-2026-001', 'RSK-2026-001', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_Admin', 'Disetujui_Dalam_Pengendalian', 'Update data risiko RSK-2026-001 [Menunggu_Approval_Admin -> Disetujui_Dalam_Pengendalian]', 8.8),
('log-1793347129548-g1tk', 'RSK-2026-001', 'RSK-2026-001', 'risk owner', 'ANGGUN AYU (0960)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Menunggu_Approval_Admin', 'Update data risiko RSK-2026-001 [Menunggu_Approval_VP -> Menunggu_Approval_Admin]', 5.8),
('log-1793347089157-8w92', 'RSK-2026-001', 'RSK-2026-001', 'risk officer', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_VP', 'Pendaftaran risiko baru unit kerja: AAAAAAAAAAAAA...', 9.6),
('log-1793344117110-tjvb', 'RSK-2027-240', 'RSK-2027-240', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2027-240 [Carry_Over -> Carry_Over]', 6.3),
('log-1793340223986-0eyq', 'RSK-2028-243', 'RSK-2028-243', 'Admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2028-243 [Carry_Over -> Carry_Over]', 6.8),
('log-1793340223826-v7c9', 'RSK-2028-243', 'RSK-2028-243', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2028-243 [Carry_Over -> Carry_Over]', 6.4),
('log-1793327749082-0o9q', 'RSK-2026-207', 'RSK-2026-207', 'risk officer', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Tercatat_Final', 'Pendaftaran risiko baru unit kerja: llllllllllllllllllllllll...', 9.1),
('log-1793266402637-5c10', 'RSK-2026-246', 'RSK-2026-246', 'Admin', 'VIZANIA (0961)', 'RISK_UPDATED', 'Menunggu_Approval_Admin', 'Menunggu_Approval_Admin', 'Update data risiko RSK-2026-246 [Menunggu_Approval_Admin -> Menunggu_Approval_Admin]', 6.1),
('log-1793266402560-hl7o', 'RSK-2026-246', 'RSK-2026-246', 'risk owner', 'VIZANIA (0961)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Menunggu_Approval_Admin', 'Update data risiko RSK-2026-246 [Menunggu_Approval_VP -> Menunggu_Approval_Admin]', 6.2),
('log-1793266376130-exe4', 'RSK-2026-246', 'RSK-2026-246', 'Admin', 'ANGGUN AYU', 'RISK_UPDATED', 'Menunggu_Approval_VP', 'Menunggu_Approval_VP', 'Update data risiko RSK-2026-246 [Menunggu_Approval_VP -> Menunggu_Approval_VP]', 8.2),
('log-1793266375879-eple', 'RSK-2026-246', 'RSK-2026-246', 'risk officer', 'ANGGUN AYU', 'STATUS_WORKFLOW_CHANGED', 'Revisi', 'Menunggu_Approval_VP', 'Update data risiko RSK-2026-246 [Revisi -> Menunggu_Approval_VP]', 5.5),
('log-1793266137093-anuq', 'RSK-2026-246', 'RSK-2026-246', 'Admin', 'ANGGUN AYU', 'RISK_UPDATED', 'Revisi', 'Revisi', 'Update data risiko RSK-2026-246 [Revisi -> Revisi]', 6),
('log-1793266136861-qp27', 'RSK-2026-246', 'RSK-2026-246', 'risk officer', 'ANGGUN AYU', 'RISK_UPDATED', 'Revisi', 'Revisi', 'Update data risiko RSK-2026-246 [Revisi -> Revisi]', 7.5),
('log-1793266094364-0qiy', 'RSK-2026-246', 'RSK-2026-246', 'Admin', 'VIZANIA (0961)', 'RISK_UPDATED', 'Revisi', 'Revisi', 'Update data risiko RSK-2026-246 [Revisi -> Revisi]', 5.9),
('log-1793266094276-a3vq', 'RSK-2026-246', 'RSK-2026-246', 'risk owner', 'VIZANIA (0961)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Revisi', 'Update data risiko RSK-2026-246 [Menunggu_Approval_VP -> Revisi]', 5.7),
('log-1793265966888-81e3', 'RSK-2026-246', 'RSK-2026-246', 'Admin', 'System UI Auto-Sync', 'RISK_UPDATED', 'Menunggu_Approval_VP', 'Menunggu_Approval_VP', 'Update data risiko RSK-2026-246 [Menunggu_Approval_VP -> Menunggu_Approval_VP]', 8.5),
('log-1793265966791-0pg4', 'RSK-2026-246', 'RSK-2026-246', 'risk officer', 'ANGGUN AYU (Badge 0960 - Staff Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_VP', 'Pendaftaran risiko baru unit kerja: mmmmm...', 6.4),
('log-1793265348267-7m2l', 'RSK-2026-245', 'RSK-2026-245', 'Admin', 'System UI Auto-Sync', 'RISK_UPDATED', 'Tercatat_Final', 'Tercatat_Final', 'Update data risiko RSK-2026-245 [Tercatat_Final -> Tercatat_Final]', 6.2),
('log-1793265348199-t2b1', 'RSK-2026-245', 'RSK-2026-245', 'risk officer', 'ANGGUN AYU (Badge 0960 - Staff Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Tercatat_Final', 'Pendaftaran risiko baru unit kerja: mmmmmmmmmmmm...', 9.9),
('log-1793265304323-od6r', 'RSK-2026-204', 'RSK-2026-204', 'Admin', 'System UI Auto-Sync', 'RISK_UPDATED', 'Tercatat_Final', 'Tercatat_Final', 'Update data risiko RSK-2026-204 [Tercatat_Final -> Tercatat_Final]', 8.7),
('log-1793265304235-jogv', 'RSK-2026-204', 'RSK-2026-204', 'risk officer', 'DAFFA ARI PRASETYA (Badge 0952 - Super Admin Enterprise Risk Management Korporat (Risk Admin))', 'RISK_REGISTERED', NULL, 'Tercatat_Final', 'Pendaftaran risiko baru unit kerja: mm...', 9.3),
('log-1793264465906-y7qs', 'RSK-2026-244', 'RSK-2026-244', 'risk officer', 'jihan (Badge 0963 - Staf / Risk Officer Unit Kerja)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_Admin', 'Pendaftaran risiko baru unit kerja: aku bisa ...', 7.2),
('log-1793264465900-5brw', 'RSK-2028-243', 'RSK-2028-243', 'risk officer', 'jihan (Badge 0963 - Staf / Risk Officer Unit Kerja)', 'RISK_REGISTERED', NULL, 'Carry_Over', 'Pendaftaran risiko baru unit kerja: terekena nya serangan siber...', 8.1),
('log-1793264465893-wxud', 'RSK-2026-242', 'RSK-2026-242', 'risk officer', 'jihan (Badge 0963 - Staf / Risk Officer Unit Kerja)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_Admin', 'Pendaftaran risiko baru unit kerja: ya gitu...', 11),
('log-seed-01', 'RSK-2026-001', 'RSK-2026-001', 'risk admin', 'Risk Admin Korporat', 'INITIAL_DB_SYNC', 'Draft_Unit', 'Disetujui_Dalam_Pengendalian', 'Initial data load from PT Pupuk Sriwidjaja Palembang MySQL Enterprise Risk Database.', 8.5);

-- ---------------------------------------------------------------------
-- DATA: sync_event_modul (100 records)
-- ---------------------------------------------------------------------
INSERT INTO `sync_event_modul` (`id`, `module_source`, `module_target`, `endpoint`, `method`, `status`, `duration_ms`, `payload_summary`) VALUES
('sync-1793689739445-3a9g', 'Master Sumber Risiko (Admin)', 'MySQL DB & Formulir Identifikasi Risiko', '/api/master/sumber-risiko', 'POST', 'SYNCED', 4.3, 'Admin (DAFFA ARI PRASETYA (0952)) menambahkan sumber risiko baru pada [Material]: \"aku\"'),
('sync-1793584428640-zi98', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-008', 'PUT', 'SYNCED', 10.4, 'Updated RSK-2026-008 status: Tercatat_Final'),
('sync-1793584403404-oznt', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 7.4, 'New risk created [RSK-2026-008]'),
('sync-1793583958722-ahtr', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 11.5, 'New risk created [RSK-2026-007]'),
('sync-1793583904307-2e7d', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 8.5, 'New risk created [RSK-2026-006]'),
('sync-1793583835976-drt3', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 1 pada RSK-2026-005 -> Disetujui_Dalam_Pengendalian'),
('sync-1793583825246-lip0', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 6.6, 'Updated RSK-2026-005 status: Carry_Over'),
('sync-1793583803700-w527', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 10.4, 'Updated RSK-2026-005 status: Carry_Over'),
('sync-1793583796316-idgh', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 8.8, 'Updated RSK-2026-005 status: Carry_Over'),
('sync-1793583715939-ufzf', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 7.5, 'Updated RSK-2026-005 status: Carry_Over'),
('sync-1793583691606-xmcz', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 4 pada RSK-2026-005 -> Carry_Over'),
('sync-1793583665382-mj8c', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 10, 'Updated RSK-2026-005 status: Disetujui_Dalam_Pengendalian'),
('sync-1793583646774-e4cm', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 6.2, 'Updated RSK-2026-005 status: Disetujui_Dalam_Pengendalian'),
('sync-1793583593972-h4g6', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 3 pada RSK-2026-005 -> Disetujui_Dalam_Pengendalian'),
('sync-1793583580825-t4yx', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 7, 'Updated RSK-2026-005 status: Disetujui_Dalam_Pengendalian'),
('sync-1793583559811-fwhc', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 8.7, 'Updated RSK-2026-005 status: Disetujui_Dalam_Pengendalian'),
('sync-1793583300566-82jr', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 2 pada RSK-2026-005 -> Disetujui_Dalam_Pengendalian'),
('sync-1793583289566-aqai', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 9.3, 'Updated RSK-2026-005 status: Disetujui_Dalam_Pengendalian'),
('sync-1793583260824-h8lm', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 7.5, 'Updated RSK-2026-005 status: Disetujui_Dalam_Pengendalian'),
('sync-1793583215939-vr1r', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 1 pada RSK-2026-005 -> Disetujui_Dalam_Pengendalian'),
('sync-1793583163640-2cu3', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 7.2, 'Updated RSK-2026-005 status: Disetujui_Dalam_Pengendalian'),
('sync-1793582749486-jyfp', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 7.2, 'Updated RSK-2026-005 status: Disetujui_Dalam_Pengendalian'),
('sync-1793582687892-fgr1', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 6.5, 'Updated RSK-2026-005 status: Disetujui_Dalam_Pengendalian'),
('sync-1793582661603-ahx0', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 10.7, 'Updated RSK-2026-005 status: Menunggu_Approval_Admin'),
('sync-1793582651100-yfug', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 7.2, 'Updated RSK-2026-005 status: Menunggu_Approval_VP'),
('sync-1793582626587-b6z9', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-005', 'PUT', 'SYNCED', 9.5, 'Updated RSK-2026-005 status: Revisi'),
('sync-1793582414357-tbmf', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 7.8, 'New risk created [RSK-2026-005]'),
('sync-1793353173514-v219', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-004', 'PUT', 'SYNCED', 9.3, 'Updated RSK-2026-004 status: Draft_Unit'),
('sync-1793353164995-vibe', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-004', 'PUT', 'SYNCED', 10.2, 'Updated RSK-2026-004 status: Menunggu_Approval_Admin'),
('sync-1793353144717-4grr', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 10.8, 'New risk created [RSK-2026-004]'),
('sync-1793353072317-re4m', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 6.8, 'Updated RSK-2026-003 status: Carry_Over'),
('sync-1793352885203-i7jo', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 7.4, 'Updated RSK-2026-003 status: Carry_Over'),
('sync-1793352859572-kyqe', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 10, 'Updated RSK-2026-003 status: Carry_Over'),
('sync-1793352811296-o83w', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 4 pada RSK-2026-003 -> Carry_Over'),
('sync-1793352785421-cr6q', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 9.2, 'Updated RSK-2026-003 status: Disetujui_Dalam_Pengendalian'),
('sync-1793352753952-pw7h', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 6.6, 'Updated RSK-2026-003 status: Disetujui_Dalam_Pengendalian'),
('sync-1793352564390-i4lm', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 3 pada RSK-2026-003 -> Disetujui_Dalam_Pengendalian'),
('sync-1793352356218-yg7h', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 6, 'Updated RSK-2026-003 status: Disetujui_Dalam_Pengendalian'),
('sync-1793352285997-2py6', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 2 pada RSK-2026-003 -> Disetujui_Dalam_Pengendalian'),
('sync-1793352147132-tc9l', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 10.6, 'Updated RSK-2026-003 status: Disetujui_Dalam_Pengendalian'),
('sync-1793352118366-cw4z', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 9.3, 'Updated RSK-2026-003 status: Disetujui_Dalam_Pengendalian'),
('sync-1793352002533-fmlv', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 1 pada RSK-2026-003 -> Disetujui_Dalam_Pengendalian'),
('sync-1793351931413-ofpd', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 9.6, 'Updated RSK-2026-003 status: Disetujui_Dalam_Pengendalian'),
('sync-1793351906783-6b82', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 6.3, 'Updated RSK-2026-003 status: Disetujui_Dalam_Pengendalian'),
('sync-1793351863615-yyyt', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 8.2, 'Updated RSK-2026-003 status: Disetujui_Dalam_Pengendalian'),
('sync-1793351829019-ezqq', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 8.2, 'Updated RSK-2026-003 status: Menunggu_Approval_Admin'),
('sync-1793351806025-2zyq', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 6.3, 'Updated RSK-2026-003 status: Menunggu_Approval_VP'),
('sync-1793351431485-xqie', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-003', 'PUT', 'SYNCED', 8.7, 'Updated RSK-2026-003 status: Revisi'),
('sync-1793351379828-dasm', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 11.5, 'New risk created [RSK-2026-003]'),
('sync-1793351304234-segn', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 1 pada RSK-2026-001 -> Carry_Over'),
('sync-1793351292452-l206', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-001', 'PUT', 'SYNCED', 9.5, 'Updated RSK-2026-001 status: Disetujui_Dalam_Pengendalian'),
('sync-1793350794490-l2o7', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 9.5, 'Updated RSK-2026-002 status: Carry_Over'),
('sync-1793350775697-5440', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 1 pada RSK-2026-002 -> Carry_Over'),
('sync-1793350764425-gqk1', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 6.6, 'Updated RSK-2026-002 status: Carry_Over'),
('sync-1793350709525-5xex', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 8.9, 'Updated RSK-2026-002 status: Carry_Over'),
('sync-1793350586177-14kx', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 1 pada RSK-2026-002 -> Carry_Over'),
('sync-1793350578329-1rv4', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 7.8, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793350440926-asy6', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 10.8, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793350320437-i2o3', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 9.5, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793350252458-w1fh', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 10, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793350066322-7ffp', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 9.9, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793349973431-r6m6', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 7.8, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793349525025-u3ez', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 4 pada RSK-2026-002 -> Disetujui_Dalam_Pengendalian'),
('sync-1793349465224-w9av', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 10.9, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793349418322-2jx4', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 6.5, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793349303894-b8dk', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 3 pada RSK-2026-002 -> Disetujui_Dalam_Pengendalian'),
('sync-1793349278652-nk4p', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 7.5, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793349244351-yb8r', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 10.7, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793349201191-h3ll', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 2 pada RSK-2026-002 -> Disetujui_Dalam_Pengendalian'),
('sync-1793349150025-xm4u', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 9.8, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793349132919-bi8x', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 1 pada RSK-2026-002 -> Disetujui_Dalam_Pengendalian'),
('sync-1793349081891-f4v1', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 7.6, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793348002299-2jb1', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 10.7, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793347853120-cw3k', 'Modul Approval & Evaluasi Admin', 'MySQL DB & Modul Unit Kerja / Monitoring', '/api/admin/evaluasi-triwulan', 'POST', 'SYNCED', 7.9, 'Evaluasi TW 1 pada RSK-2026-002 -> Disetujui_Dalam_Pengendalian'),
('sync-1793347767368-eomp', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 7.6, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793347574998-6wkt', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 7, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793347465909-87wi', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 9, 'Updated RSK-2026-002 status: Disetujui_Dalam_Pengendalian'),
('sync-1793347436921-gr2d', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 8.9, 'Updated RSK-2026-002 status: Menunggu_Approval_Admin'),
('sync-1793347405872-c1ot', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 7.5, 'Updated RSK-2026-002 status: Menunggu_Approval_VP'),
('sync-1793347387722-r890', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 8.1, 'Updated RSK-2026-002 status: Revisi'),
('sync-1793347374898-cu5x', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 10.5, 'Updated RSK-2026-002 status: Menunggu_Approval_VP'),
('sync-1793347351865-bokj', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-002', 'PUT', 'SYNCED', 6.7, 'Updated RSK-2026-002 status: Revisi'),
('sync-1793347319293-ehyf', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 10.9, 'New risk created [RSK-2026-002]'),
('sync-1793347205758-pxi4', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-001', 'PUT', 'SYNCED', 6.2, 'Updated RSK-2026-001 status: Disetujui_Dalam_Pengendalian'),
('sync-1793347129551-ki45', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-001', 'PUT', 'SYNCED', 8.8, 'Updated RSK-2026-001 status: Menunggu_Approval_Admin'),
('sync-1793347089159-4t5p', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 9.1, 'New risk created [RSK-2026-001]'),
('sync-1793344117737-wg4w', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2027-240', 'PUT', 'SYNCED', 8.4, 'Updated RSK-2027-240 status: Carry_Over'),
('sync-1793340224018-6x5a', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2028-243', 'PUT', 'SYNCED', 6.9, 'Updated RSK-2028-243 status: Carry_Over'),
('sync-1793340223866-r7qa', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2028-243', 'PUT', 'SYNCED', 6.2, 'Updated RSK-2028-243 status: Carry_Over'),
('sync-1793327749100-k8k1', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 12.9, 'New risk created [RSK-2026-207]'),
('sync-1793266402637-60ek', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 6.8, 'Updated RSK-2026-246 status: Menunggu_Approval_Admin'),
('sync-1793266402561-fxs2', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 6.9, 'Updated RSK-2026-246 status: Menunggu_Approval_Admin'),
('sync-1793266376130-l8qd', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 7.2, 'Updated RSK-2026-246 status: Menunggu_Approval_VP'),
('sync-1793266375879-c084', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 7.4, 'Updated RSK-2026-246 status: Menunggu_Approval_VP'),
('sync-1793266137093-oog5', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 9.4, 'Updated RSK-2026-246 status: Revisi'),
('sync-1793266136861-oy6c', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 8.4, 'Updated RSK-2026-246 status: Revisi'),
('sync-1793266094364-a2xk', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 10.2, 'Updated RSK-2026-246 status: Revisi'),
('sync-1793266094276-vmez', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 6.4, 'Updated RSK-2026-246 status: Revisi'),
('sync-1793265966888-2a14', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 9.5, 'Updated RSK-2026-246 status: Menunggu_Approval_VP'),
('sync-1793265966791-je7s', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 11.8, 'New risk created [RSK-2026-246]');

-- =====================================================================
-- VIEW ALIAS KOMPATIBILITAS (Mendukung Nama Bahasa Inggris & Alternatif)
-- =====================================================================
CREATE OR REPLACE VIEW `master_organizations` AS SELECT * FROM `master_organisasi`;
CREATE OR REPLACE VIEW `master_risk_sources` AS SELECT * FROM `master_sumber_risiko`;
CREATE OR REPLACE VIEW `portal_users` AS SELECT * FROM `user_accounts`;
CREATE OR REPLACE VIEW `pusri_risk` AS SELECT * FROM `pusri_risks`;
CREATE OR REPLACE VIEW `quarterly_controls` AS SELECT * FROM `pengendalian_triwulan`;
CREATE OR REPLACE VIEW `risk_action_executions` AS SELECT * FROM `pelaksanaan_tindakan`;
CREATE OR REPLACE VIEW `evaluasi_carry_over` AS SELECT * FROM `carry_over`;
CREATE OR REPLACE VIEW `risk_carry_overs` AS SELECT * FROM `carry_over`;
CREATE OR REPLACE VIEW `risk_audit_logs` AS SELECT * FROM `audit_log_risiko`;
CREATE OR REPLACE VIEW `module_sync_events` AS SELECT * FROM `sync_event_modul`;

-- =====================================================================
-- RESTORE SQL ENVIRONMENT
-- =====================================================================
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- DUMP BERHASIL DISINKRONKAN PADA 2026-11-03T07:15:48.666Z
