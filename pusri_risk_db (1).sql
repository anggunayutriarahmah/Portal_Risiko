-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 03, 2026 at 08:03 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pusri_risk_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_log_risiko`
--

CREATE TABLE `audit_log_risiko` (
  `id` varchar(64) NOT NULL,
  `risk_id` varchar(64) NOT NULL DEFAULT '',
  `kode_risiko` varchar(64) NOT NULL DEFAULT '',
  `user_role` varchar(64) NOT NULL DEFAULT 'risk officer',
  `actor_name` varchar(255) NOT NULL DEFAULT 'Risk System',
  `action` varchar(128) NOT NULL,
  `previous_status` varchar(64) DEFAULT NULL,
  `new_status` varchar(64) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT '127.0.0.1',
  `latency_ms` decimal(6,2) DEFAULT 4.20,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_log_risiko`
--

INSERT INTO `audit_log_risiko` (`id`, `risk_id`, `kode_risiko`, `user_role`, `actor_name`, `action`, `previous_status`, `new_status`, `notes`, `ip_address`, `latency_ms`, `created_at`) VALUES
('log-1793264465893-wxud', 'RSK-2026-242', 'RSK-2026-242', 'risk officer', 'jihan (Badge 0963 - Staf / Risk Officer Unit Kerja)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_Admin', 'Pendaftaran risiko baru unit kerja: ya gitu...', '127.0.0.1', 11.00, '2026-10-30 06:28:58'),
('log-1793264465900-5brw', 'RSK-2028-243', 'RSK-2028-243', 'risk officer', 'jihan (Badge 0963 - Staf / Risk Officer Unit Kerja)', 'RISK_REGISTERED', NULL, 'Carry_Over', 'Pendaftaran risiko baru unit kerja: terekena nya serangan siber...', '127.0.0.1', 8.10, '2026-10-30 06:28:58'),
('log-1793264465906-y7qs', 'RSK-2026-244', 'RSK-2026-244', 'risk officer', 'jihan (Badge 0963 - Staf / Risk Officer Unit Kerja)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_Admin', 'Pendaftaran risiko baru unit kerja: aku bisa ...', '127.0.0.1', 7.20, '2026-10-30 06:28:58'),
('log-1793265304235-jogv', 'RSK-2026-204', 'RSK-2026-204', 'risk officer', 'DAFFA ARI PRASETYA (Badge 0952 - Super Admin Enterprise Risk Management Korporat (Risk Admin))', 'RISK_REGISTERED', NULL, 'Tercatat_Final', 'Pendaftaran risiko baru unit kerja: mm...', '127.0.0.1', 9.30, '2026-10-30 06:28:58'),
('log-1793265304323-od6r', 'RSK-2026-204', 'RSK-2026-204', 'Admin', 'System UI Auto-Sync', 'RISK_UPDATED', 'Tercatat_Final', 'Tercatat_Final', 'Update data risiko RSK-2026-204 [Tercatat_Final -> Tercatat_Final]', '127.0.0.1', 8.70, '2026-10-30 06:28:58'),
('log-1793265348199-t2b1', 'RSK-2026-245', 'RSK-2026-245', 'risk officer', 'ANGGUN AYU (Badge 0960 - Staff Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Tercatat_Final', 'Pendaftaran risiko baru unit kerja: mmmmmmmmmmmm...', '127.0.0.1', 9.90, '2026-10-30 06:28:58'),
('log-1793265348267-7m2l', 'RSK-2026-245', 'RSK-2026-245', 'Admin', 'System UI Auto-Sync', 'RISK_UPDATED', 'Tercatat_Final', 'Tercatat_Final', 'Update data risiko RSK-2026-245 [Tercatat_Final -> Tercatat_Final]', '127.0.0.1', 6.20, '2026-10-30 06:28:58'),
('log-1793265966791-0pg4', 'RSK-2026-246', 'RSK-2026-246', 'risk officer', 'ANGGUN AYU (Badge 0960 - Staff Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Menunggu_Approval_VP', 'Pendaftaran risiko baru unit kerja: mmmmm...', '127.0.0.1', 6.40, '2026-10-30 06:28:58'),
('log-1793265966888-81e3', 'RSK-2026-246', 'RSK-2026-246', 'Admin', 'System UI Auto-Sync', 'RISK_UPDATED', 'Menunggu_Approval_VP', 'Menunggu_Approval_VP', 'Update data risiko RSK-2026-246 [Menunggu_Approval_VP -> Menunggu_Approval_VP]', '127.0.0.1', 8.50, '2026-10-30 06:28:58'),
('log-1793266094276-a3vq', 'RSK-2026-246', 'RSK-2026-246', 'risk owner', 'VIZANIA (0961)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Revisi', 'Update data risiko RSK-2026-246 [Menunggu_Approval_VP -> Revisi]', '127.0.0.1', 5.70, '2026-10-30 06:28:58'),
('log-1793266094364-0qiy', 'RSK-2026-246', 'RSK-2026-246', 'Admin', 'VIZANIA (0961)', 'RISK_UPDATED', 'Revisi', 'Revisi', 'Update data risiko RSK-2026-246 [Revisi -> Revisi]', '127.0.0.1', 5.90, '2026-10-30 06:28:58'),
('log-1793266136861-qp27', 'RSK-2026-246', 'RSK-2026-246', 'risk officer', 'ANGGUN AYU', 'RISK_UPDATED', 'Revisi', 'Revisi', 'Update data risiko RSK-2026-246 [Revisi -> Revisi]', '127.0.0.1', 7.50, '2026-10-30 06:28:58'),
('log-1793266137093-anuq', 'RSK-2026-246', 'RSK-2026-246', 'Admin', 'ANGGUN AYU', 'RISK_UPDATED', 'Revisi', 'Revisi', 'Update data risiko RSK-2026-246 [Revisi -> Revisi]', '127.0.0.1', 6.00, '2026-10-30 06:28:58'),
('log-1793266375879-eple', 'RSK-2026-246', 'RSK-2026-246', 'risk officer', 'ANGGUN AYU', 'STATUS_WORKFLOW_CHANGED', 'Revisi', 'Menunggu_Approval_VP', 'Update data risiko RSK-2026-246 [Revisi -> Menunggu_Approval_VP]', '127.0.0.1', 5.50, '2026-10-30 06:28:58'),
('log-1793266376130-exe4', 'RSK-2026-246', 'RSK-2026-246', 'Admin', 'ANGGUN AYU', 'RISK_UPDATED', 'Menunggu_Approval_VP', 'Menunggu_Approval_VP', 'Update data risiko RSK-2026-246 [Menunggu_Approval_VP -> Menunggu_Approval_VP]', '127.0.0.1', 8.20, '2026-10-30 06:28:58'),
('log-1793266402560-hl7o', 'RSK-2026-246', 'RSK-2026-246', 'risk owner', 'VIZANIA (0961)', 'STATUS_WORKFLOW_CHANGED', 'Menunggu_Approval_VP', 'Menunggu_Approval_Admin', 'Update data risiko RSK-2026-246 [Menunggu_Approval_VP -> Menunggu_Approval_Admin]', '127.0.0.1', 6.20, '2026-10-30 06:28:58'),
('log-1793266402637-5c10', 'RSK-2026-246', 'RSK-2026-246', 'Admin', 'VIZANIA (0961)', 'RISK_UPDATED', 'Menunggu_Approval_Admin', 'Menunggu_Approval_Admin', 'Update data risiko RSK-2026-246 [Menunggu_Approval_Admin -> Menunggu_Approval_Admin]', '127.0.0.1', 6.10, '2026-10-30 06:28:58'),
('log-1793327749082-0o9q', 'RSK-2026-207', 'RSK-2026-207', 'risk officer', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', 'RISK_REGISTERED', NULL, 'Tercatat_Final', 'Pendaftaran risiko baru unit kerja: llllllllllllllllllllllll...', '127.0.0.1', 9.10, '2026-10-30 06:28:58'),
('log-1793340223826-v7c9', 'RSK-2028-243', 'RSK-2028-243', 'risk admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2028-243 [Carry_Over -> Carry_Over]', '127.0.0.1', 6.40, '2026-10-30 06:28:58'),
('log-1793340223986-0eyq', 'RSK-2028-243', 'RSK-2028-243', 'Admin', 'DAFFA ARI PRASETYA (0952)', 'RISK_UPDATED', 'Carry_Over', 'Carry_Over', 'Update data risiko RSK-2028-243 [Carry_Over -> Carry_Over]', '127.0.0.1', 6.80, '2026-10-30 06:28:58'),
('log-seed-01', 'RSK-2026-001', 'RSK-2026-001', 'risk admin', 'Risk Admin Korporat', 'INITIAL_DB_SYNC', 'Draft_Unit', 'Disetujui_Dalam_Pengendalian', 'Initial data load from PT Pupuk Sriwidjaja Palembang MySQL Enterprise Risk Database.', '127.0.0.1', 8.50, '2026-10-30 06:28:58');

-- --------------------------------------------------------

--
-- Table structure for table `carry_over`
--

CREATE TABLE `carry_over` (
  `id` varchar(64) NOT NULL,
  `risk_id` varchar(64) NOT NULL,
  `kode_risiko` varchar(64) NOT NULL,
  `nama_organisasi` varchar(255) NOT NULL,
  `pernyataan_risiko` text NOT NULL,
  `kategori_risiko` varchar(100) NOT NULL,
  `current_tingkat_risiko` varchar(50) NOT NULL,
  `status_workflow` varchar(100) NOT NULL,
  `progress_terakhir` int(11) DEFAULT 0,
  `target_tahun` int(11) NOT NULL DEFAULT 2027,
  `alasan_carry_over` text NOT NULL,
  `rekomendasi_komite` text NOT NULL,
  `approval_carry_over_by` varchar(255) DEFAULT 'Komite Risiko Pusri',
  `tanggal_carry_over` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `carry_over`
--

INSERT INTO `carry_over` (`id`, `risk_id`, `kode_risiko`, `nama_organisasi`, `pernyataan_risiko`, `kategori_risiko`, `current_tingkat_risiko`, `status_workflow`, `progress_terakhir`, `target_tahun`, `alasan_carry_over`, `rekomendasi_komite`, `approval_carry_over_by`, `tanggal_carry_over`, `created_at`, `updated_at`) VALUES
('CO-RSK-2026-001', 'RSK-2026-001', 'RSK-2026-001', 'Departemen Teknologi Informasi', 'AAAAAAAAAAAAA', 'Operasional', 'Low to Mod', 'Carry_Over', 0, 2027, 'Risiko operasional memerlukan mitigasi berkelanjutan lintas tahun buku operasional.', 'Direkomendasikan agar komite risiko memasukkan risiko RSK-2026-001 ke RKAP Risiko 2027.', 'DAFFA ARI PRASETYA (risk admin)', '2026-10-30', '2026-10-30 09:08:24', '2026-10-30 09:08:24'),
('CO-RSK-2026-002', 'RSK-2026-002', 'RSK-2026-002', 'Departemen Teknologi Informasi', 'tttttttttttttttttttttttt', 'Operasional', 'Moderate', 'Carry_Over', 0, 2027, 'Risiko operasional memerlukan mitigasi berkelanjutan lintas tahun buku operasional.', 'Direkomendasikan agar komite risiko memasukkan risiko RSK-2026-002 ke RKAP Risiko 2027.', 'DAFFA ARI PRASETYA (risk admin)', '2026-10-30', '2026-10-30 08:56:26', '2026-10-30 08:59:54'),
('CO-RSK-2026-003', 'RSK-2026-003', 'RSK-2026-003', 'Departemen Teknologi Informasi', 'ddddddddddd', 'Operasional', 'Mod to High', 'Carry_Over', 0, 2027, 'nia', 'anggun', 'DAFFA ARI PRASETYA (risk admin)', '2026-10-29', '2026-10-30 09:33:31', '2026-10-30 09:37:52');

-- --------------------------------------------------------

--
-- Table structure for table `master_likelihood_consequence`
--

CREATE TABLE `master_likelihood_consequence` (
  `id` varchar(20) NOT NULL,
  `likelihood` tinyint(3) UNSIGNED NOT NULL,
  `keterangan_en` varchar(100) NOT NULL,
  `keterangan_id` varchar(100) NOT NULL,
  `c1` enum('L','LM','M','MH','H') NOT NULL,
  `c2` enum('L','LM','M','MH','H') NOT NULL,
  `c3` enum('L','LM','M','MH','H') NOT NULL,
  `c4` enum('L','LM','M','MH','H') NOT NULL,
  `c5` enum('L','LM','M','MH','H') NOT NULL,
  `status` enum('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `master_likelihood_consequence`
--

INSERT INTO `master_likelihood_consequence` (`id`, `likelihood`, `keterangan_en`, `keterangan_id`, `c1`, `c2`, `c3`, `c4`, `c5`, `status`, `created_at`, `updated_at`) VALUES
('lc-1', 1, 'Almost Never', 'Sangat Rendah', 'L', 'L', 'LM', 'M', 'H', 'Aktif', '2026-10-30 07:03:23', '2026-10-30 07:03:23'),
('lc-2', 2, 'Unlikely', 'Rendah', 'L', 'LM', 'LM', 'MH', 'H', 'Aktif', '2026-10-30 07:03:23', '2026-10-30 07:03:23'),
('lc-3', 3, 'Possible', 'Sedang', 'L', 'LM', 'M', 'MH', 'H', 'Aktif', '2026-10-30 07:03:23', '2026-10-30 07:03:23'),
('lc-4', 4, 'Likely', 'Tinggi', 'L', 'LM', 'M', 'MH', 'H', 'Aktif', '2026-10-30 07:03:23', '2026-10-30 07:03:23'),
('lc-5', 5, 'Almost Certain', 'Sangat Tinggi', 'LM', 'M', 'MH', 'H', 'H', 'Aktif', '2026-10-30 07:03:23', '2026-10-30 07:03:23');

-- --------------------------------------------------------

--
-- Table structure for table `master_organisasi`
--

CREATE TABLE `master_organisasi` (
  `id` int(11) NOT NULL,
  `kode` varchar(32) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `direktorat` varchar(255) NOT NULL DEFAULT 'Direktorat Operasi & Produksi',
  `kepala_unit` varchar(255) NOT NULL DEFAULT 'Vice President Unit Kerja',
  `jabatan_kepala` varchar(150) NOT NULL DEFAULT 'Vice President (VP)',
  `email_unit` varchar(150) NOT NULL DEFAULT 'unit@pusri.co.id',
  `total_risiko` int(11) DEFAULT 0,
  `officers_json` longtext DEFAULT NULL,
  `owners_json` longtext DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `master_organisasi`
--

INSERT INTO `master_organisasi` (`id`, `kode`, `nama`, `direktorat`, `kepala_unit`, `jabatan_kepala`, `email_unit`, `total_risiko`, `officers_json`, `owners_json`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '50095068', 'Departemen Pengel. Transformasi Bisnis', 'Direktorat Transformasi Bisnis', 'Vice President Pengelolaan Transformasi Bisnis', 'Vice President Pengelolaan Transformasi Bisnis', '50095068@pusri.co.id', 0, '[]', '[]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:16'),
(2, 'JD300000', 'DEPARTEMEN ANGGARAN', 'Direktorat Keuangan & Umum', 'Vice President Anggaran', 'Vice President Anggaran', 'jd300000@pusri.co.id', 0, '[{\"nik\":\"112128\",\"nama\":\"Ria Ramadi Kurniawan\"},{\"nik\":\"12345\",\"nama\":\"Anggun\"}]', '[{\"nik\":\"080268\",\"nama\":\"Livia Sarlita\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:16'),
(3, '50000252', 'KOMPARTEMEN SEKRETARIS PERUSAHAAN', 'Sekretariat Perusahaan', 'SVP / Sekretaris Perusahaan', 'SVP / Sekretaris Perusahaan', '50000252@pusri.co.id', 0, '[{\"nik\":\"070665\",\"nama\":\"Andika Putra\"}]', '[{\"nik\":\"040981\",\"nama\":\"Indah Irmayani\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:16'),
(4, '50000253', 'KOMPARTEMEN SATUAN PENGAWASAN INTERN', 'Satuan Pengawasan Intern', 'Kepala Satuan Pengawasan Intern (SVP)', 'Kepala Satuan Pengawasan Intern (SVP)', '50000253@pusri.co.id', 0, '[{\"nik\":\"040478\",\"nama\":\"Firman Ajie Rayotomo\"}]', '[{\"nik\":\"040866\",\"nama\":\"DIAN PERMATASARI\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:16'),
(5, '50000259', 'DEPARTEMEN KOMUNIKASI & ADMINISTRASI KORPORAT', 'Sekretariat Perusahaan', 'Vice President Komunikasi & Administrasi Korporat', 'Vice President Komunikasi & Administrasi Korporat', '50000259@pusri.co.id', 0, '[{\"nik\":\"153068\",\"nama\":\"Glory Liani Putri\"},{\"nik\":\"140701\",\"nama\":\"Wildan Muttaqin\"},{\"nik\":\"111104\",\"nama\":\"M Iqbal Akbar\"}]', '[{\"nik\":\"930011\",\"nama\":\"Rustam Effendi\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:16'),
(6, '50000260', 'DEPARTEMEN MANAJEMEN RISIKO', 'Direktorat Utama', 'Vice President Manajemen Risiko', 'Vice President Manajemen Risiko', '50000260@pusri.co.id', 0, '[{\"nik\":\"140088\",\"nama\":\"Ade Lia Diani Safitri\"},{\"nik\":\"080557\",\"nama\":\"Nurhadi\"},{\"nik\":\"080482\",\"nama\":\"Arimeldi Adrian\"},{\"nik\":\"122424\",\"nama\":\"Heru Presetio\"},{\"nik\":\"090061\",\"nama\":\"Khoiril Anwar\"}]', '[{\"nik\":\"930116\",\"nama\":\"Amir Hamzah\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:16'),
(7, 'OP-IIB', 'Departemen Operasi Pabrik Pusri IIB', 'Direktorat Operasi & Produksi', 'Bambang Irawan, S.T. (VP)', 'Bambang Irawan, S.T. (VP)', 'opiib@pusri.co.id', 30, '[{\"nik\":\"132109\",\"nama\":\"M. Ridwan Fadli\"}]', '[{\"nik\":\"050112\",\"nama\":\"Bambang Irawan, S.T.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:16'),
(8, 'OP-III', 'Departemen Operasi Pabrik Pusri III', 'Direktorat Operasi & Produksi', 'Ir. Ahmad Subari (VP)', 'Ir. Ahmad Subari (VP)', 'opiii@pusri.co.id', 0, '[{\"nik\":\"133201\",\"nama\":\"Hendra Saputra\"}]', '[{\"nik\":\"040811\",\"nama\":\"Ir. Ahmad Subari\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(9, 'OP-IV', 'Departemen Operasi Pabrik Pusri IV', 'Direktorat Operasi & Produksi', 'Kurniawan Pratama, S.T. (VP)', 'Kurniawan Pratama, S.T. (VP)', 'opiv@pusri.co.id', 0, '[{\"nik\":\"142318\",\"nama\":\"Fajar Nugraha\"}]', '[{\"nik\":\"061022\",\"nama\":\"Kurniawan Pratama, S.T.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(10, 'OP-V', 'Departemen Operasi Pabrik Pusri V', 'Direktorat Operasi & Produksi', 'M. Rizky Ramadhan, S.T. (VP)', 'M. Rizky Ramadhan, S.T. (VP)', 'opv@pusri.co.id', 0, '[{\"nik\":\"150419\",\"nama\":\"Ilham Syahputra\"}]', '[{\"nik\":\"070933\",\"nama\":\"M. Rizky Ramadhan, S.T.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(11, 'RP-PROD', 'Departemen Rencana & Pengendalian Produksi', 'Direktorat Operasi & Produksi', 'Faisal Akbar, M.T. (VP)', 'Faisal Akbar, M.T. (VP)', 'rpprod@pusri.co.id', 18, '[{\"nik\":\"130776\",\"nama\":\"Ilham Ramadhan\"}]', '[{\"nik\":\"070114\",\"nama\":\"Faisal Akbar, M.T.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(12, 'HAR-MEK', 'Departemen Pemeliharaan Mekanikal', 'Direktorat Operasi & Produksi', 'Ir. Hendra Kusuma (VP)', 'Ir. Hendra Kusuma (VP)', 'harmek@pusri.co.id', 18, '[{\"nik\":\"121990\",\"nama\":\"Reza Pratama\"}]', '[{\"nik\":\"060877\",\"nama\":\"Ir. Hendra Kusuma\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(13, 'HAR-ELINS', 'Departemen Pemeliharaan Listrik & Instrumen', 'Direktorat Operasi & Produksi', 'Agung Wicaksono, S.T. (VP)', 'Agung Wicaksono, S.T. (VP)', 'harelins@pusri.co.id', 6, '[{\"nik\":\"138812\",\"nama\":\"Satria Dewa\"}]', '[{\"nik\":\"061245\",\"nama\":\"Agung Wicaksono, S.T.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(14, 'INSP-TEK', 'Departemen Inspeksi Teknik', 'Direktorat Operasi & Produksi', 'Ir. Wahyu Hidayat (VP)', 'Ir. Wahyu Hidayat (VP)', 'insptek@pusri.co.id', 0, '[{\"nik\":\"129983\",\"nama\":\"Doni Prasetya\"}]', '[{\"nik\":\"050412\",\"nama\":\"Ir. Wahyu Hidayat\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(15, 'K3', 'Departemen Keselamatan & Kesehatan Kerja (K3)', 'Direktorat Operasi & Produksi', 'Agus Setiawan, S.T., M.Env. (VP)', 'Agus Setiawan, S.T., M.Env. (VP)', 'k3@pusri.co.id', 18, '[{\"nik\":\"141205\",\"nama\":\"Bayu Wicaksono\"}]', '[{\"nik\":\"070334\",\"nama\":\"Agus Setiawan, S.T., M.Env.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(16, 'LH', 'Departemen Lingkungan Hidup', 'Direktorat Operasi & Produksi', 'Dr. Ir. Ratna Sari (VP)', 'Dr. Ir. Ratna Sari (VP)', 'lh@pusri.co.id', 18, '[{\"nik\":\"150881\",\"nama\":\"Dewi Anggraini\"}]', '[{\"nik\":\"040119\",\"nama\":\"Dr. Ir. Ratna Sari\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(17, 'SDM-ORG', 'Departemen Pengembangan SDM & Organisasi', 'Direktorat SDM & Umum', 'Nurul Hidayati, S.Psi., M.M. (VP)', 'Nurul Hidayati, S.Psi., M.M. (VP)', 'sdmorg@pusri.co.id', 12, '[{\"nik\":\"130456\",\"nama\":\"Taufik Hidayat\"}]', '[{\"nik\":\"080321\",\"nama\":\"Nurul Hidayati, S.Psi., M.M.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(18, 'DIKLAT', 'Departemen Pendidikan & Pelatihan (Diklat)', 'Direktorat SDM & Umum', 'Budi Santoso, S.Pd., M.M. (VP)', 'Budi Santoso, S.Pd., M.M. (VP)', 'diklat@pusri.co.id', 0, '[{\"nik\":\"141872\",\"nama\":\"Ahmad Syafiq\"}]', '[{\"nik\":\"071109\",\"nama\":\"Budi Santoso, S.Pd., M.M.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(19, 'REM-HI', 'Departemen Remunerasi & Hubungan Industrial', 'Direktorat SDM & Umum', 'Indra Gunawan, S.H. (VP)', 'Indra Gunawan, S.H. (VP)', 'remhi@pusri.co.id', 0, '[{\"nik\":\"139044\",\"nama\":\"Roni Iskandar\"}]', '[{\"nik\":\"061988\",\"nama\":\"Indra Gunawan, S.H.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(20, 'SAR-UMUM', 'Departemen Sarana & Umum', 'Direktorat SDM & Umum', 'Drs. Heru Prasetyo (VP)', 'Drs. Heru Prasetyo (VP)', 'sarumum@pusri.co.id', 0, '[{\"nik\":\"128834\",\"nama\":\"Dedi Sunardi\"}]', '[{\"nik\":\"051120\",\"nama\":\"Drs. Heru Prasetyo\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(21, 'SEKURITI', 'Departemen Keamanan / Sekuriti', 'Direktorat SDM & Umum', 'Mayor (Purn) Darmawan (VP)', 'Mayor (Purn) Darmawan (VP)', 'sekuriti@pusri.co.id', 0, '[{\"nik\":\"134590\",\"nama\":\"Eko Wahyudi\"}]', '[{\"nik\":\"060134\",\"nama\":\"Mayor (Purn) Darmawan\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(22, 'TJSL', 'Departemen Tanggung Jawab Sosial & Lingkungan (TJSL)', 'Direktorat Keuangan & Umum', 'Dra. Sri Wahyuni, M.M. (VP)', 'Dra. Sri Wahyuni, M.M. (VP)', 'tjsl@pusri.co.id', 0, '[{\"nik\":\"145612\",\"nama\":\"Intan Permata\"}]', '[{\"nik\":\"062201\",\"nama\":\"Dra. Sri Wahyuni, M.M.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(23, 'PENGADAAN', 'Departemen Pengadaan Barang & Jasa', 'Direktorat Keuangan & Umum', 'Arief Budiman, S.T. (VP)', 'Arief Budiman, S.T. (VP)', 'pengadaan@pusri.co.id', 6, '[{\"nik\":\"141098\",\"nama\":\"Rahmat Hidayat\"}]', '[{\"nik\":\"061145\",\"nama\":\"Arief Budiman, S.T.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(24, 'HUMAS', 'Departemen Hubungan Masyarakat (Humas)', 'Sekretariat Perusahaan', 'Rustam Effendi, S.Sos. (VP)', 'Rustam Effendi, S.Sos. (VP)', 'humas@pusri.co.id', 0, '[{\"nik\":\"139981\",\"nama\":\"Nadia Safitri\"}]', '[{\"nik\":\"050212\",\"nama\":\"Rustam Effendi, S.Sos.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(25, 'HUKUM', 'Departemen Hukum (Corporate Legal)', 'Sekretariat Perusahaan', 'Maya Lestari, S.H., M.Kn. (VP)', 'Maya Lestari, S.H., M.Kn. (VP)', 'hukum@pusri.co.id', 12, '[{\"nik\":\"160204\",\"nama\":\"Nadia Salsabila\"}]', '[{\"nik\":\"050789\",\"nama\":\"Maya Lestari, S.H., M.Kn.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(26, 'KEU-AKUN', 'Departemen Keuangan & Akuntansi', 'Direktorat Keuangan & Umum', 'Ahmad Fauzi, S.E., Ak. (VP)', 'Ahmad Fauzi, S.E., Ak. (VP)', 'keuakun@pusri.co.id', 33, '[{\"nik\":\"140992\",\"nama\":\"Fajar Siddiq\"}]', '[{\"nik\":\"060445\",\"nama\":\"Ahmad Fauzi, S.E., Ak.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(27, 'TI', 'Departemen Teknologi Informasi', 'Direktorat Transformasi Bisnis', 'Ir. Dedi Kurniawan, M.Kom. (VP)', 'Ir. Dedi Kurniawan, M.Kom. (VP)', 'ti@pusri.co.id', 29, '[{\"nik\":\"150117\",\"nama\":\"Dimas Arya\"}]', '[{\"nik\":\"050998\",\"nama\":\"Ir. Dedi Kurniawan, M.Kom.\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17'),
(28, 'MR-CORP', 'Departemen Manajemen Risiko Korporat', 'Direktorat Utama', 'Vice President Manajemen Risiko Korporat', 'Vice President Manajemen Risiko Korporat', 'mrcorp@pusri.co.id', 7, '[{\"nik\":\"140088\",\"nama\":\"Ade Lia Diani Safitri\"},{\"nik\":\"080482\",\"nama\":\"Arimeldi Adrian\"}]', '[{\"nik\":\"930116\",\"nama\":\"Amir Hamzah\"}]', 1, '2026-10-30 06:28:54', '2026-10-30 06:31:17');

-- --------------------------------------------------------

--
-- Table structure for table `master_sumber_risiko`
--

CREATE TABLE `master_sumber_risiko` (
  `id` int(11) NOT NULL,
  `kategori` varchar(150) NOT NULL,
  `sumber_risiko` varchar(500) NOT NULL,
  `urutan` int(11) DEFAULT 0,
  `dibuat_oleh` varchar(150) DEFAULT 'Risk Admin',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `master_sumber_risiko`
--

INSERT INTO `master_sumber_risiko` (`id`, `kategori`, `sumber_risiko`, `urutan`, `dibuat_oleh`, `created_at`, `updated_at`) VALUES
(1, 'Material', 'Ketersediaan material /Spare Part /Produk / Bahan Penunjang', 1, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(2, 'Material', 'Spesifikasi & mutu material / Spare part/Produk / Bahan Penunjang', 2, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(3, 'Material', 'Delivery time material/ Spare part/Produk / Bahan Penunjang pesanan', 3, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(4, 'Material', 'Ketersediaan material / Spare part/Produk / Bahan Penunjang pengganti/substitusi', 4, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(5, 'Material', 'Harga Material / Spare part/Produk / Bahan Penunjang', 5, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(6, 'Mesin', 'Usia mesin / Peralatan', 1, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(7, 'Mesin', 'Mesin tidak berfungsi dengan baik atau rusak', 2, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(8, 'Mesin', 'Mesin pesanan tidak sesuai specs dan mutu', 3, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(9, 'Mesin', 'Keusangan (obsolete)', 4, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(10, 'Mesin', 'Adaptasi mesin', 5, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(11, 'Mesin', 'Mesin tidak tersedia', 6, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(12, 'Method', 'Metode tidak ada', 1, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(13, 'Method', 'Metode ada tapi tidak mencukupi', 2, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(14, 'Method', 'Metode rumit dan sulit dipahami dengan baik', 3, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(15, 'Method', 'Metode tidak baku', 4, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(16, 'Money/Dana', 'Dana terbatas (likuiditas)', 1, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(17, 'Money/Dana', 'Keterlambatan pencairan dana / cash flow', 2, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(18, 'Money/Dana', 'Fluktuasi kurs / nilai tukar mata uang', 3, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(19, 'Money/Dana', 'Kenaikan suku bunga / beban pembiayaan', 4, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(20, 'Man / Manusia (SDM)', 'Kompetensi personil tidak mencukupi', 1, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(21, 'Man / Manusia (SDM)', 'Kekurangan personil / beban kerja berlebih', 2, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(22, 'Man / Manusia (SDM)', 'Human error / kelalaian operasional', 3, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(23, 'Man / Manusia (SDM)', 'Pelatihan dan sertifikasi belum memadai', 4, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(24, 'Man / Manusia (SDM)', 'Kepatuhan SOP & disiplin K3 rendah', 5, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(25, 'Milieu / Lingkungan & Regulasi', 'Kondisi cuaca ekstrem & faktor alam', 1, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(26, 'Milieu / Lingkungan & Regulasi', 'Perubahan regulasi dan kebijakan pemerintah', 2, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(27, 'Milieu / Lingkungan & Regulasi', 'Dampak lingkungan dan emisi limbah', 3, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(28, 'Milieu / Lingkungan & Regulasi', 'Dinamika sosial masyarakat sekitar', 4, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(29, 'Market / Pasar & Pasokan', 'Fluktuasi harga komoditas pupuk & bahan baku gas', 1, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(30, 'Market / Pasar & Pasokan', 'Penurunan permintaan pasar / daya serap konsumen', 2, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54'),
(31, 'Market / Pasar & Pasokan', 'Keterlambatan rantai pasok & logistik distribusi', 3, 'Risk Admin', '2026-10-30 06:28:54', '2026-10-30 06:28:54');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tickets`
--

CREATE TABLE `password_reset_tickets` (
  `id` varchar(64) NOT NULL,
  `identifier` varchar(150) NOT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `badge` varchar(64) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `unit_kerja` varchar(255) DEFAULT NULL,
  `reason` text NOT NULL,
  `temporary_password` varchar(255) DEFAULT NULL,
  `temporary_password_hash` varchar(255) DEFAULT NULL,
  `status` enum('pending','resolved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `resolved_by` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_tickets`
--

INSERT INTO `password_reset_tickets` (`id`, `identifier`, `user_name`, `badge`, `email`, `unit_kerja`, `reason`, `temporary_password`, `temporary_password_hash`, `status`, `created_at`, `resolved_at`, `resolved_by`) VALUES
('RST-9c3fe681-3e42-4a72-8a12-c40835cbca47', '0960', 'ANGGUN AYU', '0960', 'anggunayutriarahmah@gmail.com', 'Departemen Teknologi Informasi', 'lupa', NULL, 'scrypt$f64a2c8761c46c4601728adda014b054$3f2aa3bcfbd2a61e9248c2fd9d1fba2b97e9ee1925b868723332c1e0e9e8c889532024ccd4797b748569280fa2574ce37ee192bdc9eb73346620fcaa0c4753e5', 'resolved', '2026-11-03 06:53:32', '2026-11-03 13:54:02', 'DAFFA ARI PRASETYA (0952)'),
('RST-e99eb16e-e432-42fd-8523-6e0cc3243bb4', '0960', 'ANGGUN AYU', '0960', 'anggunayutriarahmah@gmail.com', 'Departemen Teknologi Informasi', 'lupa', 'Pusri-AtMkaF', 'scrypt$a8d31121e242229e8cf0eb5a8253a570$1d445794ebbabc9c371eb3d727100bf86921d13e68b31ab80909ae9701257f14e95cf3c2f46ad03a4ccfd33bfc423fb90f70c10239853ffa03fc932632b8c1c3', 'resolved', '2026-11-03 06:54:24', '2026-11-03 13:58:17', 'DAFFA ARI PRASETYA (0952)');

-- --------------------------------------------------------

--
-- Table structure for table `pelaksanaan_tindakan`
--

CREATE TABLE `pelaksanaan_tindakan` (
  `id` varchar(64) NOT NULL,
  `risk_id` varchar(64) NOT NULL,
  `kode_risiko` varchar(64) NOT NULL,
  `triwulan` varchar(16) DEFAULT NULL,
  `tanggal_pelaksanaan` varchar(32) NOT NULL,
  `pic_pelaksana` varchar(255) NOT NULL,
  `uraian_tindakan` text NOT NULL,
  `progress_persen` int(11) DEFAULT 0,
  `status_pelaksanaan` varchar(64) NOT NULL DEFAULT 'Belum Dilaksanakan',
  `realisasi_biaya` decimal(15,2) DEFAULT 0.00,
  `efektivitas` varchar(64) NOT NULL DEFAULT 'Belum Dinilai',
  `kendala_dan_hambatan` text DEFAULT NULL,
  `tindak_lanjut` text DEFAULT NULL,
  `nomor_bukti_dokumen` varchar(255) DEFAULT NULL,
  `catatan_admin` text DEFAULT NULL,
  `is_acc_admin` tinyint(1) DEFAULT 0,
  `acc_admin_by` varchar(150) DEFAULT NULL,
  `acc_admin_date` varchar(64) DEFAULT NULL,
  `diperbarui_oleh` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pelaksanaan_tindakan`
--

INSERT INTO `pelaksanaan_tindakan` (`id`, `risk_id`, `kode_risiko`, `triwulan`, `tanggal_pelaksanaan`, `pic_pelaksana`, `uraian_tindakan`, `progress_persen`, `status_pelaksanaan`, `realisasi_biaya`, `efektivitas`, `kendala_dan_hambatan`, `tindak_lanjut`, `nomor_bukti_dokumen`, `catatan_admin`, `is_acc_admin`, `acc_admin_by`, `acc_admin_date`, `diperbarui_oleh`, `created_at`, `updated_at`) VALUES
('ACT-RSK-2026-002-TW1', 'RSK-2026-002', 'RSK-2026-002', 'TW 1', '2026-10-30', 'Departemen Keuangan & Akuntansi', 'sedang di lakukan', 50, 'Sedang Berjalan', 2500000.00, 'Cukup Efektif', 'wifi rumah', 'Tindak lanjut pemulihan: wifi rumah', 'DOC/PUSRI-ERM/RSK-2026-002/TW1', 'Laporan progres TW 1 terekam oleh SYENA (risk officer). Usulan Tingkat Risiko: Moderate.', 1, 'DAFFA ARI PRASETYA', '2026-10-30T08:12:09.920Z', 'SYENA (risk officer)', '2026-10-30 08:06:15', '2026-10-30 08:59:54'),
('ACT-RSK-2026-002-TW2', 'RSK-2026-002', 'RSK-2026-002', 'TW 2', '2026-10-30', 'Departemen Teknologi Informasi', 'Realisasi mitigasi TW 2: kegiatan pemantauan dan mitigasi risiko.', 50, 'Sedang Berjalan', 3000000.00, 'Cukup Efektif', 'ya gitu ', 'Tindak lanjut pemulihan: ya gitu ', 'DOC/PUSRI-ERM/RSK-2026-002/TW2', 'Laporan progres TW 2 terekam oleh VIZANIA (risk officer). Usulan Tingkat Risiko: Mod to High.', 1, 'DAFFA ARI PRASETYA', '2026-10-30T08:32:26.324Z', 'VIZANIA (risk officer)', '2026-10-30 08:13:22', '2026-10-30 08:59:54'),
('ACT-RSK-2026-002-TW3', 'RSK-2026-002', 'RSK-2026-002', 'TW 3', '2026-10-30', 'Departemen Teknologi Informasi', 'aku mau', 75, 'Sedang Berjalan', 4000000.00, 'Cukup Efektif', 'wifi nia', 'Tindak lanjut pemulihan: wifi nia', 'DOC/PUSRI-ERM/RSK-2026-002/TW3', 'Laporan progres TW 3 terekam oleh VIZANIA (risk officer). Usulan Tingkat Risiko: Mod to High.', 1, 'DAFFA ARI PRASETYA', '2026-10-30T08:34:33.684Z', 'VIZANIA (risk officer)', '2026-10-30 08:34:04', '2026-10-30 08:59:54'),
('ACT-RSK-2026-002-TW4', 'RSK-2026-002', 'RSK-2026-002', 'TW 4', '2026-10-30', 'Departemen Keuangan & Akuntansi', 'Realisasi mitigasi TW 4: kegiatan pemantauan dan mitigasi risiko.', 80, 'Sedang Berjalan', 2000000.00, 'Efektif', 'wifi syena', 'Tindak lanjut pemulihan: wifi syena', 'DOC/PUSRI-ERM/RSK-2026-002/TW4', 'Laporan progres TW 4 terekam oleh SYENA (risk officer). Usulan Tingkat Risiko: Mod to High.', 1, 'DAFFA ARI PRASETYA', '2026-10-30T08:59:48.494Z', 'SYENA (risk officer)', '2026-10-30 08:36:58', '2026-10-30 08:59:54'),
('ACT-RSK-2026-003-TW1', 'RSK-2026-003', 'RSK-2026-003', 'TW 1', '2026-10-30', 'Departemen Keuangan & Akuntansi', 'ya oke', 25, 'Sedang Berjalan', 3000000.00, 'Kurang Efektif', 'wifi jihan', 'Tindak lanjut pemulihan: wifi jihan', 'DOC/PUSRI-ERM/RSK-2026-003/TW1', 'Laporan progres TW 1 terekam oleh SYENA (risk officer). Usulan Tingkat Risiko: Mod to High.', 1, 'DAFFA ARI PRASETYA', '2026-10-30T09:18:44.649Z', 'SYENA (risk officer)', '2026-10-30 09:18:26', '2026-10-30 09:37:52'),
('ACT-RSK-2026-003-TW2', 'RSK-2026-003', 'RSK-2026-003', 'TW 2', '2026-10-30', 'Departemen Keuangan & Akuntansi', 'sudah dilakukan evaluasi brkala', 50, 'Sedang Berjalan', 3000000.00, 'Cukup Efektif', 'sejauh ini masih sama', 'Tindak lanjut pemulihan: sejauh ini masih sama', 'DOC/PUSRI-ERM/RSK-2026-003/TW2', 'Laporan progres TW 2 terekam oleh SYENA (risk officer). Usulan Tingkat Risiko: Mod to High.', 1, 'DAFFA ARI PRASETYA', '2026-10-30T09:25:50.529Z', 'SYENA (risk officer)', '2026-10-30 09:21:58', '2026-10-30 09:37:52'),
('ACT-RSK-2026-003-TW4', 'RSK-2026-003', 'RSK-2026-003', 'TW 4', '2026-10-30', 'Departemen Keuangan & Akuntansi', 'hmmm', 75, 'Sedang Berjalan', 5000000.00, 'Cukup Efektif', 'keuangan', 'Tindak lanjut pemulihan: keuangan', 'DOC/PUSRI-ERM/RSK-2026-003/TW4', 'Laporan progres TW 4 terekam oleh SYENA (risk officer). Usulan Tingkat Risiko: Mod to High.', 1, 'DAFFA ARI PRASETYA', '2026-10-30T09:33:01.495Z', 'SYENA (risk officer)', '2026-10-30 09:32:33', '2026-10-30 09:37:52'),
('ACT-RSK-2026-005-TW1', 'RSK-2026-005', 'RSK-2026-005', 'TW 1', '2026-11-02', 'Departemen Keuangan & Akuntansi', 'Pengendalian Ulang Periode RKAP 2027 (Status: Carry Over). Memulai pemantauan dan mitigasi triwulan 1.', 25, 'Sedang Berjalan', 2000000.00, 'Kurang Efektif', 'Risiko Carry Over dilanjutkan ke siklus RKAP 2027. Memulai pengendalian ulang triwulanan.', 'Tindak lanjut pemulihan: Risiko Carry Over dilanjutkan ke siklus RKAP 2027. Memulai pengendalian ulang triwulanan.', 'DOC/PUSRI-ERM/RSK-2026-005/TW1', 'Laporan progres TW 1 terekam oleh SYENA (risk officer). Usulan Tingkat Risiko: Mod to High.', 1, 'DAFFA ARI PRASETYA', '2026-11-02T01:26:22.001Z', 'SYENA (risk officer)', '2026-11-02 01:25:49', '2026-11-02 01:43:56'),
('ACT-RSK-2026-005-TW2', 'RSK-2026-005', 'RSK-2026-005', 'TW 2', '2026-11-02', 'Departemen Keuangan & Akuntansi', 'Realisasi mitigasi TW 2: kegiatan pemantauan dan mitigasi risiko.', 50, 'Sedang Berjalan', 2500000.00, 'Cukup Efektif', 'mmmm', 'Tindak lanjut pemulihan: mmmm', 'DOC/PUSRI-ERM/RSK-2026-005/TW2', 'Laporan progres TW 2 terekam oleh SYENA (risk officer). Usulan Tingkat Risiko: Moderate.', 1, 'DAFFA ARI PRASETYA', '2026-11-02T01:34:47.043Z', 'SYENA (risk officer)', '2026-11-02 01:34:20', '2026-11-02 01:43:56'),
('ACT-RSK-2026-005-TW3', 'RSK-2026-005', 'RSK-2026-005', 'TW 3', '2026-11-02', 'Departemen Teknologi Informasi', 'Realisasi mitigasi TW 3: kegiatan pemantauan dan mitigasi risiko.', 50, 'Sedang Berjalan', 3000000.00, 'Cukup Efektif', 'mm', 'Tindak lanjut pemulihan: mm', 'DOC/PUSRI-ERM/RSK-2026-005/TW3', 'Laporan progres TW 3 terekam oleh VIZANIA (risk officer). Usulan Tingkat Risiko: Low to Mod.', 1, 'DAFFA ARI PRASETYA', '2026-11-02T01:39:38.691Z', 'VIZANIA (risk officer)', '2026-11-02 01:39:19', '2026-11-02 01:43:56'),
('ACT-RSK-2026-005-TW4', 'RSK-2026-005', 'RSK-2026-005', 'TW 4', '2026-11-02', 'Departemen Keuangan & Akuntansi', 'Realisasi mitigasi TW 4: kegiatan pemantauan dan mitigasi risiko.', 75, 'Sedang Berjalan', 3000000.00, 'Cukup Efektif', 'aaa', 'Tindak lanjut pemulihan: aaa', 'DOC/PUSRI-ERM/RSK-2026-005/TW4', 'Laporan progres TW 4 terekam oleh SYENA (risk officer). Usulan Tingkat Risiko: Moderate.', 1, 'DAFFA ARI PRASETYA', '2026-11-02T01:43:40.114Z', 'SYENA (risk officer)', '2026-11-02 01:40:46', '2026-11-02 01:43:56');

-- --------------------------------------------------------

--
-- Table structure for table `pengendalian_triwulan`
--

CREATE TABLE `pengendalian_triwulan` (
  `id` varchar(64) NOT NULL,
  `risk_id` varchar(64) NOT NULL,
  `kode_risiko` varchar(64) NOT NULL DEFAULT '',
  `triwulan` enum('TW 1','TW 2','TW 3','TW 4') NOT NULL,
  `realisasi_kegiatan` text NOT NULL,
  `realisasi_biaya` decimal(15,2) DEFAULT 0.00,
  `progress_persen` int(11) DEFAULT 0,
  `progress_fisik_pic` int(11) DEFAULT NULL,
  `progres_pengerjaan_admin` int(11) DEFAULT NULL,
  `kemungkinan_residual` int(11) DEFAULT 1,
  `dampak_residual` int(11) DEFAULT 1,
  `residual_score` int(11) GENERATED ALWAYS AS (`kemungkinan_residual` * `dampak_residual`) STORED,
  `tingkat_residual` varchar(50) NOT NULL,
  `status_pengendalian` varchar(50) NOT NULL DEFAULT 'On Track',
  `kendala_dan_tindak_lanjut` text DEFAULT NULL,
  `reported_by` varchar(150) NOT NULL DEFAULT 'PIC Pelaksana',
  `pic_report_date` varchar(64) DEFAULT NULL,
  `is_pic_acc` tinyint(1) DEFAULT 0,
  `acc_by` varchar(150) DEFAULT NULL,
  `acc_date` varchar(64) DEFAULT NULL,
  `catatan_admin_acc` text DEFAULT NULL,
  `status_keputusan` varchar(64) DEFAULT NULL,
  `catatan_evaluasi_admin` text DEFAULT NULL,
  `tanggal_evaluasi` varchar(64) DEFAULT NULL,
  `dievaluasi_oleh` varchar(150) DEFAULT NULL,
  `detail_evaluasi_json` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pengendalian_triwulan`
--

INSERT INTO `pengendalian_triwulan` (`id`, `risk_id`, `kode_risiko`, `triwulan`, `realisasi_kegiatan`, `realisasi_biaya`, `progress_persen`, `progress_fisik_pic`, `progres_pengerjaan_admin`, `kemungkinan_residual`, `dampak_residual`, `tingkat_residual`, `status_pengendalian`, `kendala_dan_tindak_lanjut`, `reported_by`, `pic_report_date`, `is_pic_acc`, `acc_by`, `acc_date`, `catatan_admin_acc`, `status_keputusan`, `catatan_evaluasi_admin`, `tanggal_evaluasi`, `dievaluasi_oleh`, `detail_evaluasi_json`, `created_at`, `updated_at`) VALUES
('CTRL-RSK-2026-001-TW1', 'RSK-2026-001', 'RSK-2026-001', 'TW 1', 'Inisiasi pelaksanaan mitigasi carry over tahun 2027 (Lanjutan dari tahun 2026)', 0.00, 0, 0, 0, 3, 3, 'Moderate', 'Pending', 'Carry Over resmi disetujui untuk RKAP 2027. Progres mitigasi dimulai kembali dari TW 1.', 'Departemen Teknologi Informasi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-10-30 09:08:11', '2026-10-30 09:08:24'),
('CTRL-RSK-2026-001-TW2', 'RSK-2026-001', 'RSK-2026-001', 'TW 2', 'Realisasi mitigasi TW 2', 0.00, 0, 0, 0, 3, 3, 'Moderate', 'Pending', '-', 'Departemen Teknologi Informasi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-10-30 09:08:24', '2026-10-30 09:08:24'),
('CTRL-RSK-2026-001-TW3', 'RSK-2026-001', 'RSK-2026-001', 'TW 3', 'Realisasi mitigasi TW 3', 0.00, 0, 0, 0, 3, 3, 'Moderate', 'Pending', '-', 'Departemen Teknologi Informasi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-10-30 09:08:24', '2026-10-30 09:08:24'),
('CTRL-RSK-2026-001-TW4', 'RSK-2026-001', 'RSK-2026-001', 'TW 4', 'Realisasi mitigasi TW 4', 0.00, 0, 0, 0, 3, 3, 'Moderate', 'Pending', '-', 'Departemen Teknologi Informasi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-10-30 09:08:24', '2026-10-30 09:08:24'),
('CTRL-RSK-2026-002-TW1', 'RSK-2026-002', 'RSK-2026-002', 'TW 1', 'Inisiasi pelaksanaan mitigasi carry over tahun 2027 (Lanjutan dari tahun 2028)', 0.00, 0, 0, 0, 3, 3, 'Moderate', 'Pending', 'Carry Over resmi disetujui untuk RKAP 2027. Progres mitigasi dimulai kembali dari TW 1.', 'DAFFA ARI PRASETYA (Departemen Teknologi Informasi)', '2026-10-30', 1, 'DAFFA ARI PRASETYA', '2026-10-30T08:59:48.494Z', 'l', NULL, NULL, NULL, NULL, '{\"kemungkinanUsulanPic\":3,\"dampakUsulanPic\":3,\"tingkatUsulanPic\":\"Moderate\",\"catatanUsulanPic\":\"\"}', '2026-10-30 08:06:15', '2026-10-30 08:59:54'),
('CTRL-RSK-2026-002-TW2', 'RSK-2026-002', 'RSK-2026-002', 'TW 2', 'Realisasi mitigasi TW 2', 0.00, 0, 0, 0, 3, 3, 'Moderate', 'Pending', '-', 'Departemen Teknologi Informasi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-10-30 08:13:22', '2026-10-30 08:59:54'),
('CTRL-RSK-2026-002-TW3', 'RSK-2026-002', 'RSK-2026-002', 'TW 3', 'Realisasi mitigasi TW 3', 0.00, 0, 0, 0, 3, 3, 'Moderate', 'Pending', '-', 'Departemen Teknologi Informasi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-10-30 08:34:04', '2026-10-30 08:59:54'),
('CTRL-RSK-2026-002-TW4', 'RSK-2026-002', 'RSK-2026-002', 'TW 4', 'Realisasi mitigasi TW 4', 0.00, 0, 0, 0, 3, 3, 'Moderate', 'Pending', '-', 'Departemen Teknologi Informasi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-10-30 08:36:58', '2026-10-30 08:59:54'),
('CTRL-RSK-2026-003-TW1', 'RSK-2026-003', 'RSK-2026-003', 'TW 1', 'Pengendalian Ulang Periode RKAP 2027 (Status: Carry Over). Memulai pemantauan dan mitigasi triwulan 1.', 0.00, 0, 0, 0, 4, 4, 'Mod to High', 'On Track', 'Risiko Carry Over dilanjutkan ke siklus RKAP 2027. Memulai pengendalian ulang triwulanan.', 'Departemen Keuangan & Akuntansi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-10-30 09:18:26', '2026-10-30 09:37:52'),
('CTRL-RSK-2026-003-TW2', 'RSK-2026-003', 'RSK-2026-003', 'TW 2', 'Realisasi mitigasi TW 2', 0.00, 0, 0, 0, 4, 4, 'Mod to High', 'Pending', '-', 'Departemen Keuangan & Akuntansi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-10-30 09:21:58', '2026-10-30 09:33:31'),
('CTRL-RSK-2026-003-TW3', 'RSK-2026-003', 'RSK-2026-003', 'TW 3', 'Realisasi mitigasi TW 3', 0.00, 0, 0, 0, 4, 4, 'Mod to High', 'Pending', '-', 'Departemen Keuangan & Akuntansi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-10-30 09:25:50', '2026-10-30 09:33:31'),
('CTRL-RSK-2026-003-TW4', 'RSK-2026-003', 'RSK-2026-003', 'TW 4', 'Realisasi mitigasi TW 4', 0.00, 0, 0, 0, 4, 4, 'Mod to High', 'Pending', '-', 'Departemen Keuangan & Akuntansi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-10-30 09:32:33', '2026-10-30 09:33:31'),
('CTRL-RSK-2026-005-TW1', 'RSK-2026-005', 'RSK-2026-005', 'TW 1', 'Pengendalian Ulang Periode RKAP 2027 (Status: Carry Over). Memulai pemantauan dan mitigasi triwulan 1.', 2000000.00, 25, 25, 0, 4, 3, 'Mod to High', 'On Track', 'Risiko Carry Over dilanjutkan ke siklus RKAP 2027. Memulai pengendalian ulang triwulanan.\n[Evaluasi Admin TW 1 (2026-11-02)]: Penilaian Admin: Menyetujui usulan tingkat risiko dari Risk Officer (Mod to High). Berdasarkan verifikasi kemajuan fisik (25%) dan efektivitas tindakan mitigasi lapangan, penurunan risiko ke tingkat Mod to High (Skor: 12) dinilai objektif dan valid.', 'SYENA (Departemen Keuangan & Akuntansi)', '2026-11-02', 1, 'DAFFA ARI PRASETYA', '2026-11-02T01:43:40.114Z', 'z', 'Pengendalian_Lanjutan', 'Penilaian Admin: Menyetujui usulan tingkat risiko dari Risk Officer (Mod to High). Berdasarkan verifikasi kemajuan fisik (25%) dan efektivitas tindakan mitigasi lapangan, penurunan risiko ke tingkat Mod to High (Skor: 12) dinilai objektif dan valid.', '2026-11-02', 'DAFFA ARI PRASETYA (risk admin)', '{\"kemungkinanUsulanPic\":4,\"dampakUsulanPic\":3,\"tingkatUsulanPic\":\"Mod to High\",\"catatanUsulanPic\":\"zzzz\",\"kesimpulanPenilaianAdmin\":\"Sesuai_Usulan_Officer\",\"catatanPenilaianRisikoAdmin\":\"Penilaian Admin: Menyetujui usulan tingkat risiko dari Risk Officer (Mod to High). Berdasarkan verifikasi kemajuan fisik (25%) dan efektivitas tindakan mitigasi lapangan, penurunan risiko ke tingkat Mod to High (Skor: 12) dinilai objektif dan valid.\",\"pengendalianLanjutanDesc\":\"Tindak lanjut mitigasi percepatan untuk periode TW 2.\",\"picDepartemenBaru\":\"Departemen Keuangan & Akuntansi\",\"picPelaksanaBaru\":\"Departemen Keuangan & Akuntansi\",\"picPengendaliBaru\":\"Vice President Departemen Keuangan & Akuntansi\",\"targetWaktuLanjutan\":\"TW 2\"}', '2026-11-02 01:25:49', '2026-11-02 01:43:56'),
('CTRL-RSK-2026-005-TW2', 'RSK-2026-005', 'RSK-2026-005', 'TW 2', 'Realisasi mitigasi TW 2', 0.00, 0, 0, 0, 3, 3, 'Moderate', 'Pending', '-', 'Departemen Keuangan & Akuntansi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-11-02 01:34:20', '2026-11-02 01:41:31'),
('CTRL-RSK-2026-005-TW3', 'RSK-2026-005', 'RSK-2026-005', 'TW 3', 'Realisasi mitigasi TW 3', 0.00, 0, 0, 0, 3, 3, 'Moderate', 'Pending', '-', 'Departemen Keuangan & Akuntansi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-11-02 01:39:19', '2026-11-02 01:41:31'),
('CTRL-RSK-2026-005-TW4', 'RSK-2026-005', 'RSK-2026-005', 'TW 4', 'Realisasi mitigasi TW 4', 0.00, 0, 0, 0, 3, 3, 'Moderate', 'Pending', '-', 'Departemen Keuangan & Akuntansi', NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2026-11-02 01:40:46', '2026-11-02 01:41:31');

-- --------------------------------------------------------

--
-- Table structure for table `pusri_risks`
--

CREATE TABLE `pusri_risks` (
  `id` varchar(64) NOT NULL,
  `kode_risiko` varchar(64) NOT NULL,
  `kode_organisasi` varchar(32) NOT NULL,
  `nama_organisasi` varchar(255) NOT NULL,
  `tahun` int(11) NOT NULL DEFAULT 2026,
  `sasaran_rkap` text NOT NULL,
  `sasaran_unit_kerja` text NOT NULL,
  `konteks_eksternal` text DEFAULT NULL,
  `konteks_internal` text DEFAULT NULL,
  `sumber_risiko` varchar(255) NOT NULL DEFAULT 'Operasional',
  `pernyataan_risiko` text NOT NULL,
  `penyebab_risiko` text NOT NULL,
  `dampak_risiko` text NOT NULL,
  `pengendalian_existing` text DEFAULT NULL,
  `kategori_risiko` varchar(64) NOT NULL DEFAULT 'Operasional',
  `kriteria_dampak_key` varchar(64) DEFAULT NULL,
  `kriteria_dampak_title` varchar(255) DEFAULT NULL,
  `kriteria_dampak_level` int(11) DEFAULT NULL,
  `kemungkinan_awal` int(11) NOT NULL DEFAULT 1,
  `dampak_awal` int(11) NOT NULL DEFAULT 1,
  `inherent_score` int(11) GENERATED ALWAYS AS (`kemungkinan_awal` * `dampak_awal`) STORED,
  `tingkat_risiko_awal` varchar(50) NOT NULL DEFAULT 'Moderate',
  `current_tingkat_risiko` varchar(50) NOT NULL DEFAULT 'Moderate',
  `jenis_penanganan` varchar(50) NOT NULL DEFAULT 'Mitigasi',
  `butuh_mitigasi` tinyint(1) NOT NULL DEFAULT 1,
  `status_kebutuhan_mitigasi` varchar(128) NOT NULL DEFAULT 'Wajib Mitigasi',
  `alasan_kebutuhan_mitigasi` text DEFAULT NULL,
  `rencana_penanganan` text DEFAULT NULL,
  `target_waktu_mitigasi` varchar(128) DEFAULT 'TW 2',
  `biaya_rencana_pengendalian` decimal(15,2) DEFAULT 0.00,
  `pic_departemen` varchar(255) DEFAULT NULL,
  `pic_pelaksana` varchar(255) DEFAULT '',
  `pic_pengendali` varchar(255) DEFAULT '',
  `jenis_anggaran` varchar(128) DEFAULT 'Investasi Rutin / OPEX',
  `status_workflow` varchar(100) NOT NULL DEFAULT 'Menunggu_Approval_VP',
  `status_pelaksanaan_terakhir` varchar(64) DEFAULT 'Belum Dilaksanakan',
  `progress_pelaksanaan_terakhir` int(11) DEFAULT 0,
  `review_notes_vp` text DEFAULT NULL,
  `approval_notes_admin` text DEFAULT NULL,
  `diperbarui_oleh` varchar(150) DEFAULT NULL,
  `user_progres` varchar(150) DEFAULT NULL,
  `created_by` varchar(128) NOT NULL DEFAULT 'Risk Officer',
  `created_date` varchar(64) DEFAULT NULL,
  `updated_date` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pusri_risks`
--

INSERT INTO `pusri_risks` (`id`, `kode_risiko`, `kode_organisasi`, `nama_organisasi`, `tahun`, `sasaran_rkap`, `sasaran_unit_kerja`, `konteks_eksternal`, `konteks_internal`, `sumber_risiko`, `pernyataan_risiko`, `penyebab_risiko`, `dampak_risiko`, `pengendalian_existing`, `kategori_risiko`, `kriteria_dampak_key`, `kriteria_dampak_title`, `kriteria_dampak_level`, `kemungkinan_awal`, `dampak_awal`, `tingkat_risiko_awal`, `current_tingkat_risiko`, `jenis_penanganan`, `butuh_mitigasi`, `status_kebutuhan_mitigasi`, `alasan_kebutuhan_mitigasi`, `rencana_penanganan`, `target_waktu_mitigasi`, `biaya_rencana_pengendalian`, `pic_departemen`, `pic_pelaksana`, `pic_pengendali`, `jenis_anggaran`, `status_workflow`, `status_pelaksanaan_terakhir`, `progress_pelaksanaan_terakhir`, `review_notes_vp`, `approval_notes_admin`, `diperbarui_oleh`, `user_progres`, `created_by`, `created_date`, `updated_date`, `created_at`, `updated_at`) VALUES
('RSK-2026-001', 'RSK-2026-001', 'TI', 'Departemen Teknologi Informasi', 2027, 'mmmmmmmmmmmmmmmmmmmmmmmmmm', 'llllllllllllllllll', 'mmmmmmmmmmmmmm', 'lllllllllllllllllllll', 'Delivery time material/ Spare part/Produk / Bahan Penunjang pesanan', 'AAAAAAAAAAAAA', 'DDDDDDDDDDDDDDDDDDDDD', 'FFFFFFFFFFFFFFFFFFFFFFFFFF', 'GGGGGGGG', 'Operasional', 'k3_3', 'Kriteria Dampak Risiko terhadap K3', 3, 3, 3, 'Moderate', 'Low to Mod', 'Mitigasi', 1, 'Mitigasi Direkomendasikan (Moderate)', 'Skor inherent 9 (≥10) melebihi batas toleransi selera risiko Pusri. Wajib mitigasi.', 'GGGGGGGGGGGG', 'TW 1', 25000000.00, 'Departemen Teknologi Informasi', 'Departemen Teknologi Informasi', 'Departemen Teknologi Informasi', 'Non-Anggaran / Prosedural', 'Carry_Over', 'Belum Dilaksanakan', 0, 'T', '[Evaluasi Admin TW 1 (2026-10-30)]: Evaluasi pemantauan hasil pengendalian risiko RSK-2026-001 pada periode TW 1.', 'DAFFA ARI PRASETYA (0952)', 'DAFFA ARI PRASETYA (0952)', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', '2026-10-30T07:58:09.154Z', '2026-10-30T09:08:24.227Z', '2026-10-30 07:58:09', '2026-10-30 09:08:24'),
('RSK-2026-002', 'RSK-2026-002', 'TI', 'Departemen Teknologi Informasi', 2028, 'aku bisa', 'llllllllllllllllll', 'ya gutu', 'lllllllllllllllllllll', 'Adaptasi mesin', 'tttttttttttttttttttttttt', 'hhhhhhhhhhhhhh', 'kkkkkkkkk', 'vvvvvvvvv', 'Operasional', 'k3_3', 'Kriteria Dampak Risiko terhadap K3', 3, 3, 3, 'Moderate', 'Moderate', 'Mitigasi', 1, 'Mitigasi Direkomendasikan (Moderate)', 'Skor inherent 9 (≥10) melebihi batas toleransi selera risiko Pusri. Wajib mitigasi.', 'dddddddddddddddd\n[Tindak Lanjut TW 1]: pada TW 2 lakukan pendekatan alami\n[Tindak Lanjut TW 1]: Tindak lanjut mitigasi percepatan untuk periode TW 2.\n[Tindak Lanjut TW 2]: lakukan pengendalian\n[Tindak Lanjut TW 3]: lanjutkan\n[Tindak Lanjut TW 4]: Tindak lanjut mitigasi percepatan untuk periode Carry Over.', 'TW 1', 10000000.00, 'Departemen Teknologi Informasi', 'Departemen Teknologi Informasi', 'Vice President Departemen Teknologi Informasi', 'Non-Anggaran / Prosedural', 'Carry_Over', 'Belum Dilaksanakan', 0, '[Perbaikan Unit Kerja]: sudah sesuai ususlan', '[Evaluasi Admin TW 1 (2026-10-30)]: Penilaian Admin: Menyetujui usulan tingkat risiko dari Risk Officer (Moderate). Berdasarkan verifikasi kemajuan fisik (0%) dan efektivitas tindakan mitigasi lapangan, penurunan risiko ke tingkat Moderate (Skor: 9) dinilai objektif dan valid.', 'DAFFA ARI PRASETYA (0952)', 'DAFFA ARI PRASETYA (0952)', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', '2026-10-30T08:01:59.276Z', '2026-10-30T08:59:54.486Z', '2026-10-30 08:01:59', '2026-10-30 08:59:54'),
('RSK-2026-003', 'RSK-2026-003', 'TI', 'Departemen Teknologi Informasi', 2027, 'mmmmmmmmmmmmmmmmmmmmmmmmmm', 'llllllllllllllllll', 'ya gutu', 'lllllllllllllllllllll', 'Mesin pesanan tidak sesuai specs dan mutu', 'ddddddddddd', 'ddffffffffff', 'Adanya 1 atau lebih karyawan yang mengalami luka sangat serius (luka berat/diopname lebih dari 1 bulan) atau mengalami cacat tetap.', 'Monitoring SOP Rutin', 'Operasional', 'k3_4', 'Kriteria Dampak Risiko terhadap K3', 4, 4, 4, 'Mod to High', 'Mod to High', 'Mitigasi', 1, 'Mitigasi Direkomendasikan (Moderate)', 'Skor inherent 9 (≥10) melebihi batas toleransi selera risiko Pusri. Wajib mitigasi.', 'rrrre\n[Tindak Lanjut TW 1]: lanjut ke pengandalian 2, lakukan scara langsung\n[Tindak Lanjut TW 2]: ubah metode di lapangana\n[Tindak Lanjut TW 3]: lakukan dengan metode baru', 'TW 1', 10000000.00, 'Departemen Keuangan & Akuntansi', 'Departemen Keuangan & Akuntansi', 'Vice President Departemen Keuangan & Akuntansi', 'Non-Anggaran / Prosedural', 'Carry_Over', 'Belum Dilaksanakan', 0, '[Perbaikan Unit Kerja]: sudah diperbaiki sesuia rahan', '[Evaluasi Admin TW 4 (2026-10-30)]: Penilaian Admin: Menyetujui usulan tingkat risiko dari Risk Officer (Mod to High). Berdasarkan verifikasi kemajuan fisik (75%) dan efektivitas tindakan mitigasi lapangan, penurunan risiko ke tingkat Mod to High (Skor: 16) dinilai objektif dan valid.', 'DAFFA ARI PRASETYA (0952)', 'DAFFA ARI PRASETYA (0952)', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', '2026-10-30T09:09:39.821Z', '2026-10-30T09:37:52.274Z', '2026-10-30 09:09:39', '2026-10-30 09:37:52'),
('RSK-2026-004', 'RSK-2026-004', 'TI', 'Departemen Teknologi Informasi', 2026, 'mmmmmmmmmmmmmmmmmmmmmmmmmm', 'llllllllllllllllll', 'mmmmmmmmmmmmmm', 'lllllllllllllllllllll', 'Delivery time material/ Spare part/Produk / Bahan Penunjang pesanan', 'fiyyyyyyyyyyy', 'kkkkkkkkkkkkkkk', 'pppppppppppp', 'ooooooooooo', 'Operasional', 'k3_4', 'Kriteria Dampak Risiko terhadap K3', 4, 4, 4, 'Mod to High', 'Mod to High', 'Mitigasi', 1, 'Wajib Mitigasi Segera (High Risk)', 'Skor inherent 16 (≥10) melebihi batas toleransi selera risiko Pusri. Wajib mitigasi.', 'mmmmmmmmmmmm', 'Risiko Awal', 10000000.00, NULL, '-', 'VP Departemen', 'Non-Anggaran / Prosedural', 'Draft_Unit', 'Belum Dilaksanakan', 0, 'Telah direview dan disetujui resmi oleh ANGGUN AYU (Badge 0960 - Staff Teknologi Informasi) untuk eskalasi ke tahap Approval Korporat Admin.', 'Usulan risiko ditolak oleh Admin Korporat.', 'DAFFA ARI PRASETYA (0952)', 'DAFFA ARI PRASETYA (0952)', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', '2026-10-30T09:39:04.711Z', '2026-10-30T09:39:33.507Z', '2026-10-30 09:39:04', '2026-10-30 09:39:33'),
('RSK-2026-005', 'RSK-2026-005', 'KEU-AKUN', 'Departemen Keuangan & Akuntansi', 2029, 'aku bisa', 'lo sih', 'ya gutu', 'hmm', 'Delivery time material/ Spare part/Produk / Bahan Penunjang pesanan', 'aaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbb', 'ccccccccccccccccc', 'ddddddddddddddddd', 'Keuangan', 'k3_3', 'Kriteria Dampak Risiko terhadap K3', 3, 3, 3, 'Moderate', 'Mod to High', 'Mitigasi', 1, 'Mitigasi Direkomendasikan (Moderate)', 'Skor inherent 9 (<10) berada dalam batas toleransi wajar.', 'ggggggggggggggggg\n[Tindak Lanjut TW 1]: lnajut mitigasi\n[Tindak Lanjut TW 2]: Tindak lanjut mitigasi percepatan untuk periode TW 3.\n[Tindak Lanjut TW 3]: Tindak lanjut mitigasi percepatan untuk periode TW 4.\n[Tindak Lanjut TW 1]: Tindak lanjut mitigasi percepatan untuk periode TW 2.', 'TW 2', 10000000.00, 'Departemen Keuangan & Akuntansi', 'Departemen Keuangan & Akuntansi', 'Vice President Departemen Keuangan & Akuntansi', 'Non-Anggaran / Prosedural', 'Disetujui_Dalam_Pengendalian', 'Sedang Berjalan', 0, '[Perbaikan Unit Kerja]: sudah diperbaiki sesuai arahan', '[Evaluasi Admin TW 1 (2026-11-02)]: Penilaian Admin: Menyetujui usulan tingkat risiko dari Risk Officer (Mod to High). Berdasarkan verifikasi kemajuan fisik (25%) dan efektivitas tindakan mitigasi lapangan, penurunan risiko ke tingkat Mod to High (Skor: 12) dinilai objektif dan valid.', 'DAFFA ARI PRASETYA (0952)', 'DAFFA ARI PRASETYA (0952)', 'SYENA (Badge 0964 - vp Keuangan & Akuntansi)', '2026-11-02T01:20:14.343Z', '2026-11-02T01:43:55.965Z', '2026-11-02 01:20:14', '2026-11-02 01:43:56'),
('RSK-2026-006', 'RSK-2026-006', 'MR-CORP', 'Departemen Manajemen Risiko Korporat', 2026, 'aku bisa', 'lo sih', 'ya gutu', 'hmm', 'Ketersediaan material /Spare Part /Produk / Bahan Penunjang', 'sssssssssssssssssscccc', 'cccccccccccf', 'ffffffffff', 'ggggggggggggggg', 'Operasional', 'k3_3', 'Kriteria Dampak Risiko terhadap K3', 3, 3, 3, 'Moderate', 'Moderate', 'Dihindari', 1, 'Mitigasi Direkomendasikan (Moderate)', 'Skor inherent 9 (<10) dalam batas toleransi.', 'ggggggggggg', 'Risiko Awal', 0.00, NULL, '-', '-', 'Investasi Rutin', 'Menunggu_Approval_VP', 'Belum Dilaksanakan', 0, NULL, NULL, NULL, NULL, 'DAFFA ARI PRASETYA (Badge 0952 - Super Admin Enterprise Risk Management Korporat (Risk Admin))', '2026-11-02T01:45:04.293Z', '2026-11-02T01:45:04.293Z', '2026-11-02 01:45:04', '2026-11-02 01:45:04'),
('RSK-2026-008', 'RSK-2026-008', 'TI', 'Departemen Teknologi Informasi', 2026, 'aku bisa', 'lo sih', 'ya gutu', 'hmm', 'Harga Material / Spare part/Produk / Bahan Penunjang', 'dddddddddddddddddddddd', 'ffffffffffffffff', 'vvvvvvvvvvvvvvvvvvv', ' vvvvvvvvvvvv', 'Operasional', 'k3_2', 'Kriteria Dampak Risiko terhadap K3', 2, 3, 2, 'Low to Mod', 'Low to Mod', 'Dihindari', 0, 'Toleransi Terpenuhi (Dapat Diterima)', 'Skor inherent 6 (<10) dalam batas toleransi.', 'fffffffff', 'Risiko Awal', 0.00, NULL, '-', 'VP Departemen', 'Investasi Rutin', 'Tercatat_Final', 'Belum Dilaksanakan', 0, 'ddd', NULL, 'ANGGUN AYU (0960)', 'ANGGUN AYU (0960)', 'VIZANIA (Badge 0961 - Vp Teknologi Informasi)', '2026-11-02T01:53:23.388Z', '2026-11-02T01:53:48.629Z', '2026-11-02 01:53:23', '2026-11-02 01:53:48');

-- --------------------------------------------------------

--
-- Table structure for table `sync_event_modul`
--

CREATE TABLE `sync_event_modul` (
  `id` varchar(64) NOT NULL,
  `module_source` varchar(128) NOT NULL,
  `module_target` varchar(128) NOT NULL,
  `endpoint` varchar(255) NOT NULL,
  `method` varchar(16) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'SYNCED',
  `duration_ms` decimal(8,2) NOT NULL DEFAULT 4.50,
  `payload_summary` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sync_event_modul`
--

INSERT INTO `sync_event_modul` (`id`, `module_source`, `module_target`, `endpoint`, `method`, `status`, `duration_ms`, `payload_summary`, `created_at`) VALUES
('sync-1793264465893-63q4', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 11.30, 'New risk created [RSK-2026-242]', '2026-10-30 06:28:58'),
('sync-1793264465900-fs54', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 8.20, 'New risk created [RSK-2028-243]', '2026-10-30 06:28:58'),
('sync-1793264465906-dv6i', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 12.40, 'New risk created [RSK-2026-244]', '2026-10-30 06:28:58'),
('sync-1793265304235-9ij0', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 11.90, 'New risk created [RSK-2026-204]', '2026-10-30 06:28:58'),
('sync-1793265304324-766l', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-204', 'PUT', 'SYNCED', 7.50, 'Updated RSK-2026-204 status: Tercatat_Final', '2026-10-30 06:28:58'),
('sync-1793265348199-tx86', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 8.80, 'New risk created [RSK-2026-245]', '2026-10-30 06:28:58'),
('sync-1793265348268-etkb', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-245', 'PUT', 'SYNCED', 9.00, 'Updated RSK-2026-245 status: Tercatat_Final', '2026-10-30 06:28:58'),
('sync-1793265966791-je7s', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 11.80, 'New risk created [RSK-2026-246]', '2026-10-30 06:28:58'),
('sync-1793265966888-2a14', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 9.50, 'Updated RSK-2026-246 status: Menunggu_Approval_VP', '2026-10-30 06:28:58'),
('sync-1793266094276-vmez', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 6.40, 'Updated RSK-2026-246 status: Revisi', '2026-10-30 06:28:58'),
('sync-1793266094364-a2xk', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 10.20, 'Updated RSK-2026-246 status: Revisi', '2026-10-30 06:28:58'),
('sync-1793266136861-oy6c', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 8.40, 'Updated RSK-2026-246 status: Revisi', '2026-10-30 06:28:58'),
('sync-1793266137093-oog5', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 9.40, 'Updated RSK-2026-246 status: Revisi', '2026-10-30 06:28:58'),
('sync-1793266375879-c084', 'Modul risk officer', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 7.40, 'Updated RSK-2026-246 status: Menunggu_Approval_VP', '2026-10-30 06:28:58'),
('sync-1793266376130-l8qd', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 7.20, 'Updated RSK-2026-246 status: Menunggu_Approval_VP', '2026-10-30 06:28:58'),
('sync-1793266402561-fxs2', 'Modul risk owner', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 6.90, 'Updated RSK-2026-246 status: Menunggu_Approval_Admin', '2026-10-30 06:28:58'),
('sync-1793266402637-60ek', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2026-246', 'PUT', 'SYNCED', 6.80, 'Updated RSK-2026-246 status: Menunggu_Approval_Admin', '2026-10-30 06:28:58'),
('sync-1793327749100-k8k1', 'Modul Identifikasi Risiko (Unit Kerja)', 'MySQL DB & Modul Review Atasan', '/api/risks', 'POST', 'SYNCED', 12.90, 'New risk created [RSK-2026-207]', '2026-10-30 06:28:58'),
('sync-1793340223866-r7qa', 'Modul risk admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2028-243', 'PUT', 'SYNCED', 6.20, 'Updated RSK-2028-243 status: Carry_Over', '2026-10-30 06:28:58'),
('sync-1793340224018-6x5a', 'Modul Admin', 'MySQL DB & All Active Modules', '/api/risks/RSK-2028-243', 'PUT', 'SYNCED', 6.90, 'Updated RSK-2028-243 status: Carry_Over', '2026-10-30 06:28:58'),
('sync-init-01', 'Golang Engine (Port 8080)', 'Portal Dashboard UI & MySQL DB', '/api/v1/risks/sync-all', 'GET', 'SYNCED', 9.40, 'Loaded 8 Enterprise Risks across 8 Departments', '2026-10-30 06:28:58');

-- --------------------------------------------------------

--
-- Table structure for table `user_accounts`
--

CREATE TABLE `user_accounts` (
  `id` varchar(64) NOT NULL,
  `username` varchar(100) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `nik` varchar(64) DEFAULT NULL,
  `badge` varchar(64) DEFAULT NULL,
  `password` varchar(255) NOT NULL DEFAULT 'portal123',
  `password_hash` varchar(255) DEFAULT NULL,
  `role` varchar(64) NOT NULL DEFAULT 'risk officer',
  `jabatan` varchar(255) DEFAULT NULL,
  `jabatan_pengajuan` varchar(255) DEFAULT NULL,
  `unit_kerja` varchar(255) NOT NULL DEFAULT 'Departemen Operasi Pabrik Pusri IIB',
  `kode_unit` varchar(64) NOT NULL DEFAULT 'OP-IIB',
  `kode_unit_kerja` varchar(64) DEFAULT 'OP-IIB',
  `email` varchar(150) NOT NULL DEFAULT 'user@pusri.co.id',
  `account_status` varchar(32) NOT NULL DEFAULT 'active',
  `auth_provider` varchar(64) NOT NULL DEFAULT 'PUSRI_IAM_SSO',
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` varchar(64) DEFAULT NULL,
  `approved_by` varchar(150) DEFAULT NULL,
  `last_login_at` varchar(64) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_accounts`
--

INSERT INTO `user_accounts` (`id`, `username`, `nama`, `nik`, `badge`, `password`, `password_hash`, `role`, `jabatan`, `jabatan_pengajuan`, `unit_kerja`, `kode_unit`, `kode_unit_kerja`, `email`, `account_status`, `auth_provider`, `failed_login_attempts`, `locked_until`, `approved_by`, `last_login_at`, `avatar`, `is_active`, `created_at`, `updated_at`) VALUES
('usr-0950', 'dappa', 'DAPPA ARI PRASETYA', '0950', '0950', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'risk admin', 'Super Admin Enterprise Risk Management Korporat (Risk Admin)', 'Super Admin Enterprise Risk Management Korporat (Risk Admin)', 'Departemen Teknologi Informasi', 'TI', 'TI', 'dafaprasetya947@gmail.com', 'active', 'PUSRI_IAM_SSO', 0, NULL, 'Sistem IAM Korporat Pusri', NULL, NULL, 1, '2026-10-30 06:28:54', '2026-11-03 06:46:19'),
('usr-0951', '0951', 'M DAVI RAMADHAN', '0951', '0951', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'risk owner', 'Vice President Operasi Pabrik Pusri IIB (Risk Owner)', 'Vice President Operasi Pabrik Pusri IIB (Risk Owner)', 'Departemen Operasi Pabrik Pusri IIB', 'OP-IIB', 'OP-IIB', 'm.davi@pusri.co.id', 'active', 'PUSRI_IAM_SSO', 0, NULL, 'Sistem IAM Korporat Pusri', NULL, NULL, 1, '2026-10-30 06:28:54', '2026-11-03 06:46:19'),
('usr-0952', '0952', 'DAFFA ARI PRASETYA', '0952', '0952', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'risk admin', 'Super Admin Enterprise Risk Management Korporat (Risk Admin)', 'Super Admin Enterprise Risk Management Korporat (Risk Admin)', 'Departemen Manajemen Risiko Korporat', 'MR-CORP', 'MR-CORP', 'daffa.ari@pusri.co.id', 'active', 'PUSRI_IAM_SSO', 0, NULL, 'Sistem IAM Korporat Pusri', '2026-11-02T01:22:57.946Z', NULL, 1, '2026-10-30 06:28:54', '2026-11-03 06:46:19'),
('usr-0953', '0953', 'FAUZAN AL GHANIYYU', '0953', '0953', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'scrypt$909de04ea9819fb1fc1f376582f50eb9$e3e8bee461e1baf1bf062d6d917d765f9fc0028b09560755ffc9b68a1145402c7c16ed55e61adc8c46dc84af4b149ae73c27aa4aae78473d2a3cac07545356eb', 'risk officer', 'Risk Officer Unit Kerja Pabrik', 'Risk Officer Unit Kerja Pabrik', 'Departemen Operasi Pabrik Pusri IIB', 'OP-IIB', 'OP-IIB', 'fauzan.al@pusri.co.id', 'active', 'PUSRI_IAM_SSO', 0, NULL, 'Sistem IAM Korporat Pusri', NULL, NULL, 1, '2026-10-30 06:28:54', '2026-11-03 06:46:19');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_log_risiko`
--
ALTER TABLE `audit_log_risiko`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_risk_id` (`risk_id`),
  ADD KEY `idx_audit_created_at` (`created_at`);

--
-- Indexes for table `carry_over`
--
ALTER TABLE `carry_over`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `risk_id` (`risk_id`),
  ADD KEY `idx_carry_status` (`status_workflow`),
  ADD KEY `idx_carry_tingkat` (`current_tingkat_risiko`);

--
-- Indexes for table `master_likelihood_consequence`
--
ALTER TABLE `master_likelihood_consequence`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_master_likelihood_level` (`likelihood`);

--
-- Indexes for table `master_organisasi`
--
ALTER TABLE `master_organisasi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode` (`kode`),
  ADD KEY `idx_org_kode` (`kode`),
  ADD KEY `idx_org_direktorat` (`direktorat`);

--
-- Indexes for table `master_sumber_risiko`
--
ALTER TABLE `master_sumber_risiko`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_master_sumber_risiko` (`kategori`,`sumber_risiko`(191)),
  ADD KEY `idx_sumber_kategori` (`kategori`);

--
-- Indexes for table `password_reset_tickets`
--
ALTER TABLE `password_reset_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reset_ticket_status_created` (`status`,`created_at`);

--
-- Indexes for table `pelaksanaan_tindakan`
--
ALTER TABLE `pelaksanaan_tindakan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_action_risk` (`risk_id`);

--
-- Indexes for table `pengendalian_triwulan`
--
ALTER TABLE `pengendalian_triwulan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_risk_triwulan` (`risk_id`,`triwulan`),
  ADD KEY `idx_tw_risk` (`risk_id`),
  ADD KEY `idx_quarterly_status` (`status_pengendalian`);

--
-- Indexes for table `pusri_risks`
--
ALTER TABLE `pusri_risks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_risiko` (`kode_risiko`),
  ADD KEY `fk_pusri_risk_org` (`kode_organisasi`),
  ADD KEY `idx_risk_tahun` (`tahun`),
  ADD KEY `idx_risk_status` (`status_workflow`),
  ADD KEY `idx_risk_kategori` (`kategori_risiko`),
  ADD KEY `idx_risk_tingkat` (`current_tingkat_risiko`),
  ADD KEY `idx_risk_inherent` (`inherent_score`);

--
-- Indexes for table `sync_event_modul`
--
ALTER TABLE `sync_event_modul`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sync_created_at` (`created_at`);

--
-- Indexes for table `user_accounts`
--
ALTER TABLE `user_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_username` (`username`),
  ADD KEY `idx_users_badge` (`badge`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `master_organisasi`
--
ALTER TABLE `master_organisasi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=159;

--
-- AUTO_INCREMENT for table `master_sumber_risiko`
--
ALTER TABLE `master_sumber_risiko`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `carry_over`
--
ALTER TABLE `carry_over`
  ADD CONSTRAINT `fk_carryover_pusri_risk` FOREIGN KEY (`risk_id`) REFERENCES `pusri_risks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pelaksanaan_tindakan`
--
ALTER TABLE `pelaksanaan_tindakan`
  ADD CONSTRAINT `fk_action_pusri_risk` FOREIGN KEY (`risk_id`) REFERENCES `pusri_risks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pengendalian_triwulan`
--
ALTER TABLE `pengendalian_triwulan`
  ADD CONSTRAINT `fk_quarterly_pusri_risk` FOREIGN KEY (`risk_id`) REFERENCES `pusri_risks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pusri_risks`
--
ALTER TABLE `pusri_risks`
  ADD CONSTRAINT `fk_pusri_risk_org` FOREIGN KEY (`kode_organisasi`) REFERENCES `master_organisasi` (`kode`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
