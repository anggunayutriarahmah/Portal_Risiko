import { jsPDF } from 'jspdf';
import { PusriRisk, QuarterlyControl } from '../types/pusri';

/**
 * Format currency to IDR
 */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

/**
 * Format date to Indonesian localized date
 */
function formatDateId(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Generate and download official PDF report for completed quarterly risk control
 */
export function downloadQuarterlyControlPdf(risk: PusriRisk, specificTw?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Background bar
  doc.setFillColor(0, 159, 227); // Pusri Blue #009fe3
  doc.rect(margin, y, contentWidth, 22, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PT PUPUK SRIWIDJAJA PALEMBANG', margin + 4, y + 7);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('DEPARTEMEN MANAJEMEN RISIKO - ENTERPRISE RISK MANAGEMENT (ERM)', margin + 4, y + 12);
  doc.text('SISTEM INFORMASI & EVALUASI PENGENDALIAN TRIWULAN RISIKO KORPORAT', margin + 4, y + 17);

  // Status Badge in Header
  doc.setFillColor(16, 185, 129); // Emerald Green
  doc.roundedRect(pageWidth - margin - 52, y + 4, 48, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('STATUS PENGENDALIAN:', pageWidth - margin - 50, y + 9);
  doc.setFontSize(9);
  doc.text('SELESAI DIKENDALIKAN', pageWidth - margin - 50, y + 15);

  y += 28;

  // Title of the Document
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('BERITA ACARA LAPORAN PENGENDALIAN TRIWULAN', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Nomor Dokumen: BA-PENG/${risk.kodeRisiko}/${new Date().getFullYear()}`, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Section 1: Profil & Identifikasi Risiko
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('I. IDENTIFIKASI & PROFIL RISIKO', margin + 2, y + 4.5);
  y += 9;

  // Metadata Grid
  const metadata = [
    ['Kode Risiko', `: ${risk.kodeRisiko}`, 'Tahun RKAP', `: ${risk.tahun || 2026}`],
    ['Unit Kerja / Departemen', `: ${risk.namaOrganisasi} (${risk.kodeOrganisasi})`, 'Kategori Risiko', `: ${risk.kategoriRisiko}`],
    ['PIC Pelaksana Mitigasi', `: ${risk.picPelaksana || '-'}`, 'Target Waktu', `: ${risk.targetWaktuMitigasi || 'TW 4'}`],
    ['Tingkat Risiko Awal (Inherent)', `: ${risk.tingkatRisikoAwal} (Skor: ${risk.inherentScore || (risk.kemungkinanAwal * risk.dampakAwal)})`, 'Anggaran Rencana', `: ${formatRupiah(risk.biayaRencanaPengendalian)}`]
  ];

  doc.setFontSize(8);
  metadata.forEach(([k1, v1, k2, v2]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(k1, margin + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(v1, margin + 45, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(k2, margin + 105, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(v2, margin + 145, y);
    y += 5;
  });

  // Pernyataan Risiko & Rencana
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Pernyataan Risiko:', margin + 2, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const splitPernyataan = doc.splitTextToSize(risk.pernyataanRisiko || '-', contentWidth - 4);
  doc.text(splitPernyataan, margin + 2, y);
  y += splitPernyataan.length * 4 + 2;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Program / Rencana Penanganan Risiko:', margin + 2, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const splitPenanganan = doc.splitTextToSize(risk.rencanaPenanganan || '-', contentWidth - 4);
  doc.text(splitPenanganan, margin + 2, y);
  y += splitPenanganan.length * 4 + 4;

  // Section 2: Realisasi Pengendalian Triwulan
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('II. REKAPITULASI PELAKSANAAN & EVALUASI PENGENDALIAN TRIWULAN (TW)', margin + 2, y + 4.5);
  y += 9;

  const twList = risk.pengendalianTriwulan && risk.pengendalianTriwulan.length > 0
    ? risk.pengendalianTriwulan
    : [];

  if (twList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Belum ada catatan pemantauan triwulan yang tersimpan.', margin + 2, y);
    y += 6;
  } else {
    twList.forEach((q: QuarterlyControl, idx: number) => {
      // Check if page overflow
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      }

      const isCompleted = q.statusKeputusan === 'Selesai' || q.statusPengendalian === 'Completed' || (q.progressPersen || 0) >= 100;

      doc.setFillColor(isCompleted ? 240 : 248, isCompleted ? 253 : 250, isCompleted ? 244 : 252);
      doc.setDrawColor(isCompleted ? 16 : 203, isCompleted ? 185 : 213, isCompleted ? 129 : 225);
      doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

      // Quarter Title & Status
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`Periode: ${q.triwulan}`, margin + 3, y + 5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isCompleted ? 5 : 15, isCompleted ? 150 : 23, isCompleted ? 105 : 42);
      const statusTitle = isCompleted ? 'STATUS: SELESAI DIKENDALIKAN' : `STATUS: ${q.statusKeputusan || q.statusPengendalian || 'On Track'}`;
      doc.text(statusTitle, margin + 55, y + 5);

      // Residual & Progress
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const resK = q.kemungkinanResidual || 1;
      const resD = q.dampakResidual || 1;
      const resLevel = q.tingkatResidual || 'Low';
      const progress = q.progressPersen ?? q.progressFisikPic ?? 100;
      doc.text(`Kemajuan Fisik: ${progress}%  |  Serapan Biaya: ${formatRupiah(q.realisasiBiaya)}`, margin + 3, y + 10);
      doc.text(`Tingkat Residual: ${resLevel} (K=${resK} × D=${resD} = Skor ${resK * resD})  |  Status ACC: ${q.isPicAcc ? 'Disetujui Admin' : 'Menunggu'}`, margin + 3, y + 14);

      // Usulan Risk Officer & Catatan Admin
      const officerNote = q.tingkatUsulanPic ? `Usulan Officer: ${q.tingkatUsulanPic} (K=${q.kemungkinanUsulanPic || resK} × D=${q.dampakUsulanPic || resD})` : '';
      const adminEval = q.catatanEvaluasiAdmin || q.kendalaDanTindakLanjut || 'Telah dievaluasi dan disetujui tuntas.';
      doc.text(`${officerNote ? officerNote + '  |  ' : ''}Evaluator: ${q.dievaluasiOleh || 'Admin Korporat'}`, margin + 3, y + 18);
      
      const adminNoteTrunc = adminEval.length > 90 ? adminEval.slice(0, 90) + '...' : adminEval;
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      doc.text(`Catatan Admin: "${adminNoteTrunc}"`, margin + 3, y + 22);

      y += 27;
    });
  }

  // Section 3: Kesimpulan & Penetapan Akhir Admin
  if (y > pageHeight - 65) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('III. KESIMPULAN & PENETAPAN RESMI ADMIN MANAJEMEN RISIKO', margin + 2, y + 4.5);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const kesimpulanText = `Berdasarkan hasil pemantauan fisik, serapan anggaran, dan evaluasi pengendalian triwulan yang telah di-ACC, risiko ${risk.kodeRisiko} dinyatakan telah SELESAI DIKENDALIKAN. Efektivitas mitigasi telah memenuhi batas toleransi risiko korporat (Risk Appetite) PT Pupuk Sriwidjaja Palembang dengan tingkat residual terkendali (${risk.currentTingkatRisiko}).`;
  const splitKesimpulan = doc.splitTextToSize(kesimpulanText, contentWidth - 4);
  doc.text(splitKesimpulan, margin + 2, y);
  y += splitKesimpulan.length * 4 + 6;

  // Section 4: Lembar Tanda Tangan & Pengesahan
  if (y > pageHeight - 45) {
    doc.addPage();
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Palembang, ${formatDateId(new Date().toISOString())}`, pageWidth - margin - 50, y);
  y += 5;

  const colWidth = contentWidth / 3;

  doc.text('Dipersiapkan Oleh,', margin + 8, y);
  doc.text('Disetujui Oleh,', margin + colWidth + 8, y);
  doc.text('Ditetapkan & Ditutup Oleh,', margin + colWidth * 2 + 8, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Risk Officer Unit Pelaksana', margin + 8, y);
  doc.text(`VP ${risk.namaOrganisasi.slice(0, 22)}`, margin + colWidth + 8, y);
  doc.text('Risk Admin Korporat PT Pusri', margin + colWidth * 2 + 8, y);

  y += 18; // Space for signature

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${risk.picPelaksana || 'Risk Officer'} )`, margin + 6, y);
  doc.text(`( ${risk.picPengendali || 'VP Unit Kerja'} )`, margin + colWidth + 6, y);
  doc.text('( DAFFA ARI PRASETYA )', margin + colWidth * 2 + 6, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Tanggal: ' + formatDateId(), margin + 6, y);
  doc.text('Tanggal: ' + formatDateId(), margin + colWidth + 6, y);
  doc.text('Tanggal: ' + formatDateId(), margin + colWidth * 2 + 6, y);

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen Resmi ERM PT Pupuk Sriwidjaja Palembang | Kode: ${risk.kodeRisiko} | Hal. ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `Laporan_Pengendalian_Selesai_${risk.kodeRisiko}_${new Date().getFullYear()}.pdf`;
  doc.save(filename);
}

/**
 * Download single completed risk as Excel-compatible CSV file (UTF-8 BOM)
 */
export function downloadRiskControlExcelCsv(risk: PusriRisk) {
  const headers = [
    'Kode Risiko',
    'Tahun',
    'Departemen / Unit Kerja',
    'Kode Unit',
    'Kategori Risiko',
    'Pernyataan Risiko',
    'Penyebab Risiko',
    'Dampak Risiko',
    'Tingkat Risiko Awal (Inherent)',
    'Skor Inherent',
    'PIC Pelaksana',
    'PIC Pengendali',
    'Anggaran Rencana (Rp)',
    'Status Workflow',
    'Status Pengendalian',
    'Tingkat Residual Akhir',
    'Triwulan Selesai',
    'Kemajuan Fisik (%)',
    'Realisasi Biaya (Rp)',
    'Catatan Evaluasi Admin',
    'Tanggal Selesai'
  ];

  const twSelesai = risk.pengendalianTriwulan?.find((q) => q.statusKeputusan === 'Selesai' || q.statusPengendalian === 'Completed') 
    || risk.pengendalianTriwulan?.[risk.pengendalianTriwulan.length - 1];

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const row = [
    escapeCsv(risk.kodeRisiko),
    escapeCsv(risk.tahun || 2026),
    escapeCsv(risk.namaOrganisasi),
    escapeCsv(risk.kodeOrganisasi),
    escapeCsv(risk.kategoriRisiko),
    escapeCsv(risk.pernyataanRisiko),
    escapeCsv(risk.penyebabRisiko),
    escapeCsv(risk.dampakRisiko),
    escapeCsv(risk.tingkatRisikoAwal),
    escapeCsv(risk.inherentScore || (risk.kemungkinanAwal * risk.dampakAwal)),
    escapeCsv(risk.picPelaksana),
    escapeCsv(risk.picPengendali),
    escapeCsv(risk.biayaRencanaPengendalian),
    escapeCsv('Selesai'),
    escapeCsv('Selesai Dikendalikan'),
    escapeCsv(risk.currentTingkatRisiko),
    escapeCsv(twSelesai?.triwulan || 'TW Selesai'),
    escapeCsv(twSelesai?.progressPersen ?? 100),
    escapeCsv(twSelesai?.realisasiBiaya ?? 0),
    escapeCsv(twSelesai?.catatanEvaluasiAdmin || risk.approvalNotesAdmin || 'Pengendalian telah tuntas diselesaikan.'),
    escapeCsv(twSelesai?.tanggalEvaluasi || new Date().toISOString().split('T')[0])
  ];

  // Triwulan detail rows
  let twDetailsCsv = '\n\nRINCIAN PENGENDALIAN PER TRIWULAN:\n';
  twDetailsCsv += 'Triwulan;Kemajuan Fisik (%);Realisasi Biaya;Tingkat Residual;Usulan Officer;Kesimpulan Admin;Catatan Evaluasi;Status ACC\n';

  (risk.pengendalianTriwulan || []).forEach((q) => {
    twDetailsCsv += [
      escapeCsv(q.triwulan),
      escapeCsv(q.progressPersen || q.progressFisikPic || 0),
      escapeCsv(q.realisasiBiaya || 0),
      escapeCsv(q.tingkatResidual),
      escapeCsv(q.tingkatUsulanPic || '-'),
      escapeCsv(q.kesimpulanPenilaianAdmin || '-'),
      escapeCsv(q.catatanEvaluasiAdmin || q.kendalaDanTindakLanjut || '-'),
      escapeCsv(q.isPicAcc ? 'Disetujui Admin' : 'Menunggu')
    ].join(';') + '\n';
  });

  const csvContent = '\uFEFF' + headers.join(';') + '\n' + row.join(';') + twDetailsCsv;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Pengendalian_${risk.kodeRisiko}_Selesai.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download all completed risks as a comprehensive Excel-compatible CSV file
 */
export function downloadAllCompletedRisksExcelCsv(risks: PusriRisk[]) {
  const completedRisks = risks.filter((r) => 
    r.statusWorkflow === 'Selesai' || 
    r.pengendalianTriwulan?.some((q) => q.statusKeputusan === 'Selesai' || q.statusPengendalian === 'Completed')
  );

  const headers = [
    'No',
    'Kode Risiko',
    'Tahun RKAP',
    'Departemen / Unit Kerja',
    'Kode Unit',
    'Kategori Risiko',
    'Pernyataan Risiko',
    'Tingkat Inherent (Awal)',
    'Skor Inherent',
    'Tingkat Residual Akhir',
    'PIC Pelaksana',
    'Target Waktu',
    'Status Pengendalian',
    'TW Penyelesaian',
    'Realisasi Fisik (%)',
    'Realisasi Anggaran (Rp)',
    'Catatan Evaluasi Admin',
    'Tanggal Selesai'
  ];

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = completedRisks.map((r, i) => {
    const twSelesai = r.pengendalianTriwulan?.find((q) => q.statusKeputusan === 'Selesai' || q.statusPengendalian === 'Completed') 
      || r.pengendalianTriwulan?.[r.pengendalianTriwulan.length - 1];

    return [
      escapeCsv(i + 1),
      escapeCsv(r.kodeRisiko),
      escapeCsv(r.tahun || 2026),
      escapeCsv(r.namaOrganisasi),
      escapeCsv(r.kodeOrganisasi),
      escapeCsv(r.kategoriRisiko),
      escapeCsv(r.pernyataanRisiko),
      escapeCsv(r.tingkatRisikoAwal),
      escapeCsv(r.inherentScore || (r.kemungkinanAwal * r.dampakAwal)),
      escapeCsv(r.currentTingkatRisiko),
      escapeCsv(r.picPelaksana || '-'),
      escapeCsv(r.targetWaktuMitigasi || 'TW 4'),
      escapeCsv('Selesai Dikendalikan'),
      escapeCsv(twSelesai?.triwulan || 'TW Selesai'),
      escapeCsv(twSelesai?.progressPersen ?? 100),
      escapeCsv(twSelesai?.realisasiBiaya ?? 0),
      escapeCsv(twSelesai?.catatanEvaluasiAdmin || r.approvalNotesAdmin || 'Tuntas diselesaikan'),
      escapeCsv(twSelesai?.tanggalEvaluasi || new Date().toISOString().split('T')[0])
    ].join(';');
  });

  const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Seluruh_Risiko_Selesai_Pengendalian_Pusri_${new Date().getFullYear()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface YearlyRecapStat {
  tahun: number;
  total: number;
  high: number;
  modToHigh: number;
  moderate: number;
  lowToMod: number;
  low: number;
  selesai: number;
  dalamPengendalian: number;
  carryOver: number;
  menungguApproval: number;
  totalAnggaran: number;
  totalRealisasi: number;
  avgProgress: number;
  avgInherentScore: number;
  avgResidualScore: number;
}

/**
 * Download Rekap Data Portal Risiko Per Tahun (2024 dan seterusnya) dalam format PDF Resmi Pusri
 */
export function downloadAnnualRecapPdf(
  yearlyStats: YearlyRecapStat[],
  filteredRisks: PusriRisk[],
  selectedYearLabel: string
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Background bar
  doc.setFillColor(0, 159, 227);
  doc.rect(margin, y, contentWidth, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PT PUPUK SRIWIDJAJA PALEMBANG', margin + 4, y + 7);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('DEPARTEMEN MANAJEMEN RISIKO KORPORAT - PORTAL ENTERPRISE RISK MANAGEMENT (ERM)', margin + 4, y + 12.5);
  doc.text('LAPORAN REKAPITULASI DATA PORTAL RISIKO MULTI-TAHUN (MULAI TAHUN 2024 & SETERUSNYA)', margin + 4, y + 17);

  // Badge on right
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(pageWidth - margin - 64, y + 3.5, 60, 13, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CAKUPAN REKAP TAHUN:', pageWidth - margin - 61, y + 8.5);
  doc.setFontSize(9);
  doc.setTextColor(56, 189, 248);
  doc.text(selectedYearLabel.toUpperCase(), pageWidth - margin - 61, y + 14);

  y += 25;

  // Section 1: Tabel Rekapitulasi Tahunan (2024 s/d Seterusnya)
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('I. RINGKASAN EKSEKUTIF REKAPITULASI RISIKO PER TAHUN (2024 & SETERUSNYA)', margin + 2, y + 4.3);
  y += 8;

  // Table Headers for Yearly Summary
  const colPositions = [margin, margin + 20, margin + 40, margin + 62, margin + 84, margin + 106, margin + 128, margin + 150, margin + 175, margin + 215, margin + 250];
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  const summaryHeaders = [
    'Tahun',
    'Total',
    'High / M-H',
    'Mod / L-M',
    'Low Risk',
    'Selesai',
    'Aktif / CO',
    'Rata Progres',
    'Pagu Anggaran',
    'Realisasi Biaya',
    'Inherent -> Residual'
  ];
  summaryHeaders.forEach((h, idx) => {
    doc.text(h, colPositions[idx] + 1.5, y + 4.8);
  });
  y += 7;

  yearlyStats.forEach((st, idx) => {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 6.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 159, 227);
    doc.text(`RKAP ${st.tahun}`, colPositions[0] + 1.5, y + 4.5);

    doc.setTextColor(15, 23, 42);
    doc.text(`${st.total} Risiko`, colPositions[1] + 1.5, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`H:${st.high} | MH:${st.modToHigh}`, colPositions[2] + 1.5, y + 4.5);
    doc.text(`M:${st.moderate} | LM:${st.lowToMod}`, colPositions[3] + 1.5, y + 4.5);
    doc.text(`${st.low}`, colPositions[4] + 1.5, y + 4.5);
    doc.text(`${st.selesai} Tuntas`, colPositions[5] + 1.5, y + 4.5);
    doc.text(`${st.dalamPengendalian} Aktif / ${st.carryOver} CO`, colPositions[6] + 1.5, y + 4.5);
    doc.text(`${st.avgProgress}%`, colPositions[7] + 1.5, y + 4.5);
    doc.text(formatRupiah(st.totalAnggaran), colPositions[8] + 1.5, y + 4.5);
    doc.text(formatRupiah(st.totalRealisasi), colPositions[9] + 1.5, y + 4.5);
    doc.text(`${st.avgInherentScore.toFixed(1)} -> ${st.avgResidualScore.toFixed(1)}`, colPositions[10] + 1.5, y + 4.5);

    y += 6.5;
  });

  y += 6;

  // Section 2: Rincian Register Risiko
  if (y > pageHeight - 40) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`II. DAFTAR REGISTER & REKAP PENGENDALIAN RISIKO (${selectedYearLabel.toUpperCase()} - ${filteredRisks.length} DATA)`, margin + 2, y + 4.3);
  y += 8;

  const regCols = [margin, margin + 15, margin + 40, margin + 88, margin + 165, margin + 190, margin + 215, margin + 245];
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  const regHeaders = ['Tahun', 'Kode Risiko', 'Departemen / Unit Kerja', 'Pernyataan Risiko', 'Inherent', 'Residual', 'Realisasi Biaya', 'Status & Progres'];
  regHeaders.forEach((h, idx) => {
    doc.text(h, regCols[idx] + 1.5, y + 4.8);
  });
  y += 7;

  filteredRisks.forEach((r, idx) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }

    const lastTw = r.pengendalianTriwulan && r.pengendalianTriwulan.length > 0
      ? r.pengendalianTriwulan[r.pengendalianTriwulan.length - 1]
      : null;
    const realisasi = lastTw ? lastTw.realisasiBiaya : (r.pelaksanaanTindakan?.[0]?.realisasiBiaya || 0);
    const prog = lastTw ? lastTw.progressPersen : (r.progressPelaksanaanTerakhir || 0);

    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 7, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(String(r.tahun || 2026), regCols[0] + 1.5, y + 4.6);
    doc.text(r.kodeRisiko, regCols[1] + 1.5, y + 4.6);

    doc.setFont('helvetica', 'normal');
    const deptShort = (r.namaOrganisasi || '-').length > 28 ? r.namaOrganisasi.slice(0, 28) + '...' : r.namaOrganisasi;
    doc.text(deptShort, regCols[2] + 1.5, y + 4.6);

    const riskShort = (r.pernyataanRisiko || '-').length > 48 ? r.pernyataanRisiko.slice(0, 48) + '...' : r.pernyataanRisiko;
    doc.text(riskShort, regCols[3] + 1.5, y + 4.6);

    doc.text(`${r.tingkatRisikoAwal} (${r.inherentScore})`, regCols[4] + 1.5, y + 4.6);
    doc.text(`${r.currentTingkatRisiko}`, regCols[5] + 1.5, y + 4.6);
    doc.text(formatRupiah(realisasi), regCols[6] + 1.5, y + 4.6);

    const statusClean = r.statusWorkflow.replace(/_/g, ' ');
    doc.text(`${statusClean.slice(0, 14)} (${prog}%)`, regCols[7] + 1.5, y + 4.6);

    y += 7;
  });

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Rekap Data Portal Risiko PT Pupuk Sriwidjaja Palembang (2024 & Seterusnya) | Dicetak: ${formatDateId()} | Hal. ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  const safeLabel = selectedYearLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Rekap_Tahunan_Portal_Risiko_Pusri_${safeLabel}.pdf`);
}

/**
 * Download Rekap Data Portal Risiko Per Tahun (2024 dan seterusnya) dalam format CSV / Excel
 */
export function downloadAnnualRecapCsv(
  yearlyStats: YearlyRecapStat[],
  filteredRisks: PusriRisk[],
  selectedYearLabel: string
) {
  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  let csv = '\uFEFF';
  csv += '"REKAPITULASI DATA PORTAL RISIKO PT PUPUK SRIWIDJAJA PALEMBANG PER TAHUN (MULAI 2024 DAN SETERUSNYA)"\n';
  csv += `"Cakupan Filter Tahun:";${escapeCsv(selectedYearLabel)};"Tanggal Unduh:";${escapeCsv(formatDateId())}\n\n`;

  // Bagian 1: Tabel Rekapitulasi Per Tahun
  csv += '"I. TABEL REKAPITULASI KOMPARASI PER TAHUN (2024 - SETERUSNYA)"\n';
  const summaryHeaders = [
    'Tahun RKAP',
    'Total Risiko',
    'High Risk',
    'Mod to High',
    'Moderate',
    'Low to Mod',
    'Low Risk',
    'Status Selesai (Tuntas)',
    'Status Dalam Pengendalian',
    'Status Carry Over',
    'Menunggu Approval',
    'Rata-rata Progres Fisik (%)',
    'Total Pagu Anggaran (Rp)',
    'Total Realisasi Biaya (Rp)',
    'Rata-rata Skor Inherent',
    'Rata-rata Skor Residual'
  ];
  csv += summaryHeaders.map(escapeCsv).join(';') + '\n';

  yearlyStats.forEach((st) => {
    csv += [
      escapeCsv(st.tahun),
      escapeCsv(st.total),
      escapeCsv(st.high),
      escapeCsv(st.modToHigh),
      escapeCsv(st.moderate),
      escapeCsv(st.lowToMod),
      escapeCsv(st.low),
      escapeCsv(st.selesai),
      escapeCsv(st.dalamPengendalian),
      escapeCsv(st.carryOver),
      escapeCsv(st.menungguApproval),
      escapeCsv(`${st.avgProgress}%`),
      escapeCsv(st.totalAnggaran),
      escapeCsv(st.totalRealisasi),
      escapeCsv(st.avgInherentScore.toFixed(2)),
      escapeCsv(st.avgResidualScore.toFixed(2))
    ].join(';') + '\n';
  });

  // Bagian 2: Rincian Register Risiko Per Tahun
  csv += '\n"II. RINCIAN DATA REGISTER RISIKO PER TAHUN"\n';
  const detailHeaders = [
    'No',
    'Tahun RKAP',
    'Kode Risiko',
    'Kode Unit',
    'Departemen / Unit Kerja',
    'Kategori Risiko',
    'Sasaran RKAP',
    'Pernyataan Risiko',
    'Penyebab Risiko',
    'Dampak Risiko',
    'Kemungkinan Awal',
    'Dampak Awal',
    'Skor Inherent',
    'Tingkat Risiko Awal',
    'Tingkat Risiko Terkini (Residual)',
    'Strategi Penanganan',
    'Rencana Penanganan',
    'Target Waktu',
    'Pagu Anggaran (Rp)',
    'Realisasi Biaya Terakhir (Rp)',
    'Progres Fisik (%)',
    'Jumlah Laporan TW',
    'Status Workflow',
    'PIC Departemen'
  ];
  csv += detailHeaders.map(escapeCsv).join(';') + '\n';

  filteredRisks.forEach((r, idx) => {
    const lastTw = r.pengendalianTriwulan && r.pengendalianTriwulan.length > 0
      ? r.pengendalianTriwulan[r.pengendalianTriwulan.length - 1]
      : null;
    const realisasi = lastTw ? lastTw.realisasiBiaya : (r.pelaksanaanTindakan?.[0]?.realisasiBiaya || 0);
    const prog = lastTw ? lastTw.progressPersen : (r.progressPelaksanaanTerakhir || 0);

    csv += [
      escapeCsv(idx + 1),
      escapeCsv(r.tahun || 2026),
      escapeCsv(r.kodeRisiko),
      escapeCsv(r.kodeOrganisasi),
      escapeCsv(r.namaOrganisasi),
      escapeCsv(r.kategoriRisiko),
      escapeCsv(r.sasaranRKAP),
      escapeCsv(r.pernyataanRisiko),
      escapeCsv(r.penyebabRisiko),
      escapeCsv(r.dampakRisiko),
      escapeCsv(r.kemungkinanAwal),
      escapeCsv(r.dampakAwal),
      escapeCsv(r.inherentScore || (r.kemungkinanAwal * r.dampakAwal)),
      escapeCsv(r.tingkatRisikoAwal),
      escapeCsv(r.currentTingkatRisiko),
      escapeCsv(r.jenisPenanganan),
      escapeCsv(r.rencanaPenanganan),
      escapeCsv(r.targetWaktuMitigasi),
      escapeCsv(r.biayaRencanaPengendalian || 0),
      escapeCsv(realisasi || 0),
      escapeCsv(`${prog}%`),
      escapeCsv(r.pengendalianTriwulan?.length || 0),
      escapeCsv(r.statusWorkflow),
      escapeCsv(r.picDepartemen || r.picPelaksana || '-')
    ].join(';') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeLabel = selectedYearLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Tahunan_Portal_Risiko_Pusri_${safeLabel}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

