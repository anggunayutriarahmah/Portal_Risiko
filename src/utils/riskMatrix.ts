import { RiskLevel, PusriRisk, QuarterlyControl } from '../types/pusri';

/**
 * Peta Matriks Risiko Korporat 5x5 Resmi PT Pupuk Sriwidjaja Palembang
 * Digunakan sebagai Master Data Indikator Tingkatan Risiko
 * 
 * Sumbu K: Kemungkinan (Likelihood 1-5)
 * Sumbu D: Dampak (Consequence/Impact 1-5)
 */
export function getScoreRiskLevel(score: number): RiskLevel {
  const safeScore = Math.max(1, Math.round(score || 1));
  if (safeScore >= 17) return 'High';
  if (safeScore >= 12) return 'Mod to High';
  if (safeScore >= 8) return 'Moderate';
  if (safeScore >= 4) return 'Low to Mod';
  return 'Low';
}

export function getMasterRiskLevel(k: number, d: number): RiskLevel {
  const safeK = Math.min(5, Math.max(1, Math.round(Number(k) || 1)));
  const safeD = Math.min(5, Math.max(1, Math.round(Number(d) || 1)));
  return getScoreRiskLevel(safeK * safeD);
}

/**
 * Kebutuhan mitigasi sesuai SOP Master Pusri & indikator tingkatan risiko korporat:
 * - High (17-25): Wajib Mitigasi Segera (Ekstrem)
 * - Mod to High (12-16): Wajib Mitigasi Aktif
 * - Moderate (8-11): Mitigasi Direkomendasikan
 * - Low to Mod (4-7): Pemantauan Rutin / Terkendali
 * - Low (1-3): Risiko Rendah / Diterima
 */
export function getMasterMitigationRequirement(k: number, d: number) {
  const score = (Number(k) || 1) * (Number(d) || 1);
  const level = getScoreRiskLevel(score);

  let isRequired = false;
  let statusText = 'Toleransi Risiko Terpenuhi (Dapat Diterima)';
  let recommendation = 'Risiko berada dalam batas toleransi wajar. Pertahankan pengendalian rutin atau terima risiko.';

  if (level === 'High') {
    isRequired = true;
    statusText = 'Wajib Mitigasi Segera (High: 17-25)';
    recommendation = 'Risiko TINGGI/EKSTREM (skor 17-25) melebihi selera risiko korporat Pusri. Wajib menyusun rencana mitigasi komprehensif, persetujuan Direksi/VP, dan monitoring triwulanan.';
  } else if (level === 'Mod to High') {
    isRequired = true;
    statusText = 'Wajib Mitigasi Aktif (Mod to High: 12-16)';
    recommendation = 'Risiko MOD TO HIGH (skor 12-16) melebihi toleransi standar. Wajib menyusun rencana tindakan penanganan/mitigasi dengan target waktu dan PIC yang jelas.';
  } else if (level === 'Moderate') {
    isRequired = true;
    statusText = 'Mitigasi Direkomendasikan (Moderate: 8-11)';
    recommendation = 'Risiko MODERATE (skor 8-11). Disarankan membuat langkah mitigasi atau memperkuat pengendalian existing agar tidak eskalasi.';
  } else if (level === 'Low to Mod') {
    isRequired = false;
    statusText = 'Toleransi Terpenuhi (Low to Mod: 4-7)';
    recommendation = 'Risiko LOW TO MOD (skor 4-7). Risiko dalam kendali memadai.';
  } else {
    isRequired = false;
    statusText = 'Risiko Rendah / Diterima (Low: 1-3)';
    recommendation = 'Risiko LOW (skor 1-3). Pertahankan pemeliharaan preventif.';
  }

  return {
    score,
    level,
    isRequired,
    statusText,
    recommendation
  };
}

/**
 * Normalisasi data risiko berdasarkan Master Data Matriks 5x5 Pusri.
 * Memastikan tingkat risiko awal, skor inherent, dan tingkat residual selalu akurat.
 */
export function normalizeRiskWithMasterData(risk: PusriRisk): PusriRisk {
  const k = Number(risk.kemungkinanAwal) || 1;
  const d = Number(risk.dampakAwal) || 1;
  const masterInherentLevel = getMasterRiskLevel(k, d);
  const mitigationAssessment = getMasterMitigationRequirement(k, d);

  // Normalisasi pemantauan triwulan jika ada
  const normalizedControls: QuarterlyControl[] = Array.isArray(risk.pengendalianTriwulan)
    ? risk.pengendalianTriwulan.map((ctrl) => {
        const qK = Number(ctrl.kemungkinanResidual) || 1;
        const qD = Number(ctrl.dampakResidual) || 1;
        const masterResidualLevel = getMasterRiskLevel(qK, qD);
        return {
          ...ctrl,
          kemungkinanResidual: qK,
          dampakResidual: qD,
          tingkatResidual: masterResidualLevel,
          statusPengendalian: masterResidualLevel === 'Low' || ctrl.progressPersen >= 100
            ? 'Completed'
            : ctrl.statusPengendalian
        };
      })
    : [];

  // Hitung current tingkat risiko: ambil dari TW terakhir atau tingkat awal
  let currentLevel = masterInherentLevel;
  if (normalizedControls.length > 0) {
    currentLevel = normalizedControls[normalizedControls.length - 1].tingkatResidual;
  }

  // Cek apakah risiko sudah selesai (mencapai Low Risk pada TW manapun)
  const isFinishedByQuarter = normalizedControls.some(
    (c) => c.tingkatResidual === 'Low' || c.statusPengendalian === 'Completed' || c.progressPersen >= 100
  );

  // Normalisasi tanggal seed proyeksi lama agar tidak melampaui waktu aktual input baru pengguna
  let safeCreatedDate = risk.createdDate;
  if (risk.id === 'RSK-2027-001' && safeCreatedDate && safeCreatedDate.startsWith('2027-')) {
    safeCreatedDate = '2026-02-01T08:00:00Z';
  } else if (risk.id === 'RSK-2027-002' && safeCreatedDate && safeCreatedDate.startsWith('2027-')) {
    safeCreatedDate = '2026-02-02T09:00:00Z';
  }

  return {
    ...risk,
    createdDate: safeCreatedDate,
    kemungkinanAwal: k,
    dampakAwal: d,
    inherentScore: k * d,
    tingkatRisikoAwal: masterInherentLevel,
    currentTingkatRisiko: currentLevel,
    butuhMitigasi: mitigationAssessment.isRequired || risk.jenisPenanganan === 'Mitigasi',
    statusKebutuhanMitigasi: mitigationAssessment.statusText,
    statusWorkflow: isFinishedByQuarter && risk.statusWorkflow === 'Disetujui_Dalam_Pengendalian'
      ? 'Selesai'
      : risk.statusWorkflow,
    pengendalianTriwulan: normalizedControls
  };
}

function extractRiskSequenceNumber(codeOrId?: string): number {
  if (!codeOrId) return 0;
  const match = codeOrId.match(/RSK-\d+-(\d+)/i) || codeOrId.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) || 0 : 0;
}

/**
 * Mengurutkan data risiko dengan aturan: setiap data baru yang masuk selalu berada di atas (paling atas).
 * Membandingkan berdasarkan createdDate terbaru (descending), kemudian urutan nomor registrasi risiko terbaru (descending).
 */
export function sortRisksNewestFirst(a: PusriRisk, b: PusriRisk): number {
  const timeA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
  const timeB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
  const validTimeA = Number.isFinite(timeA) ? timeA : 0;
  const validTimeB = Number.isFinite(timeB) ? timeB : 0;

  if (validTimeA && validTimeB && validTimeA !== validTimeB) {
    return validTimeB - validTimeA;
  }

  const seqA = extractRiskSequenceNumber(a.kodeRisiko || a.id);
  const seqB = extractRiskSequenceNumber(b.kodeRisiko || b.id);
  if (seqA !== seqB) {
    return seqB - seqA;
  }

  return (b.kodeRisiko || b.id || '').localeCompare(a.kodeRisiko || a.id || '', undefined, { numeric: true });
}

export const TW_SEQUENCE = ['TW 1', 'TW 2', 'TW 3', 'TW 4'] as const;

/**
 * Cek apakah risiko memiliki triwulan yang telah mencapai status Selesai atau Low Risk
 */
export function getFirstFinishedQuarter(risk?: PusriRisk | null): QuarterlyControl | null {
  if (!risk?.pengendalianTriwulan || risk.pengendalianTriwulan.length === 0) return null;

  for (const tw of TW_SEQUENCE) {
    const q = risk.pengendalianTriwulan.find((item) => item.triwulan === tw);
    if (q) {
      const qK = Number(q.kemungkinanResidual) || 1;
      const qD = Number(q.dampakResidual) || 1;
      const level = getMasterRiskLevel(qK, qD);
      const isLow = level === 'Low' || q.tingkatResidual === 'Low';
      const isCompleted = q.statusPengendalian === 'Completed' || q.progressPersen >= 100;

      if (isLow || isCompleted) {
        return q;
      }
    }
  }
  return null;
}

/**
 * Menentukan apakah triwulan target terkunci karena triwulan sebelumnya sudah selesai (Low Risk)
 */
export function isQuarterLocked(
  risk: PusriRisk | null | undefined,
  targetTw: 'TW 1' | 'TW 2' | 'TW 3' | 'TW 4'
): boolean {
  if (!risk) return false;

  const finishedTw = getFirstFinishedQuarter(risk);
  if (!finishedTw) return false;

  const finishedIndex = TW_SEQUENCE.indexOf(finishedTw.triwulan);
  const targetIndex = TW_SEQUENCE.indexOf(targetTw);

  // Jika target berada setelah triwulan yang sudah selesai, maka terkunci!
  return targetIndex > finishedIndex;
}

/**
 * Pengembalian styling badge indikator tingkat risiko korporat Pusri
 */
export function getRiskBadgeClasses(level: RiskLevel | string) {
  switch (level) {
    case 'High':
      return {
        bg: 'bg-red-500 text-white',
        lightBg: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800',
        badge: 'bg-red-600 text-white'
      };
    case 'Mod to High':
      return {
        bg: 'bg-orange-500 text-white',
        lightBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-800',
        badge: 'bg-orange-500 text-white'
      };
    case 'Moderate':
      return {
        bg: 'bg-amber-500 text-white',
        lightBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
        badge: 'bg-amber-500 text-white'
      };
    case 'Low to Mod':
      return {
        bg: 'bg-[#38bdf8] text-white',
        lightBg: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800',
        badge: 'bg-[#38bdf8] text-white'
      };
    case 'Low':
    default:
      return {
        bg: 'bg-[#0284c7] text-white',
        lightBg: 'bg-sky-50 text-[#009fe3] dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
        badge: 'bg-[#0284c7] text-white'
      };
  }
}

/**
 * Validasi otentikasi hak akses penugasan departemen (RBAC Pusri ERM):
 * - Risk Admin: memiliki akses universal (return true).
 * - Risk Officer: HANYA berwenang melakukan pengendalian jika risiko di-assign ke departemennya
 *   (melalui picDepartemen penugasan Admin, picPelaksana, picPengendali, atau unit pemilik risiko).
 */
export function isRiskAssignedToUserDept(
  risk?: PusriRisk | null,
  user?: { role?: string; unitKerja?: string; kodeUnitKerja?: string } | null,
  triwulan?: QuarterlyControl['triwulan']
): boolean {
  if (!risk || !user) return false;
  // Risk Admin memiliki akses penuh ke seluruh departemen
  if (user.role === 'risk admin') return true;

  const uDept = (user.unitKerja || '').toLowerCase().trim();
  const uKode = (user.kodeUnitKerja || '').toLowerCase().trim();
  if (!uDept && !uKode) return true;

  const departmentMatchesUser = (department?: string) => {
    const assignedDept = (department || '').toLowerCase().trim();
    return Boolean(
      assignedDept &&
      (assignedDept.includes(uDept) ||
        uDept.includes(assignedDept) ||
        (uKode && assignedDept.includes(uKode)))
    );
  };

  if (triwulan) {
    const quarterOrder: QuarterlyControl['triwulan'][] = ['TW 1', 'TW 2', 'TW 3', 'TW 4'];
    const targetIndex = quarterOrder.indexOf(triwulan);
    const control = risk.pengendalianTriwulan?.find((item) => item.triwulan === triwulan);
    const reportedDepartment = control?.reportedBy?.match(/\(([^()]*)\)\s*$/)?.[1];
    const savedDepartment = control?.picDepartemenPelaksana || reportedDepartment;
    if (savedDepartment) return departmentMatchesUser(savedDepartment);

    const previousControl = targetIndex > 0
      ? risk.pengendalianTriwulan?.find((item) => item.triwulan === quarterOrder[targetIndex - 1])
      : undefined;
    const quarterDepartment = previousControl?.picDepartemenBaru ||
      previousControl?.picPelaksanaBaru ||
      risk.picDepartemen ||
      risk.picPelaksana ||
      risk.picPengendali;
    if (quarterDepartment) return departmentMatchesUser(quarterDepartment);
  }

  const rDept = (risk.namaOrganisasi || '').toLowerCase().trim();
  const rKode = (risk.kodeOrganisasi || '').toLowerCase().trim();
  const rPicDept = (risk.picDepartemen || '').toLowerCase().trim();
  const rPicPelaksana = (risk.picPelaksana || '').toLowerCase().trim();
  const rPicPengendali = (risk.picPengendali || '').toLowerCase().trim();

  // 1. Cek penugasan resmi picDepartemen dari Admin
  if (rPicDept && (rPicDept.includes(uDept) || uDept.includes(rPicDept) || (uKode && rPicDept.includes(uKode)))) {
    return true;
  }

  // 2. Cek picPelaksana
  if (rPicPelaksana && (rPicPelaksana.includes(uDept) || uDept.includes(rPicPelaksana) || (uKode && rPicPelaksana.includes(uKode)))) {
    return true;
  }

  // 3. Cek picPengendali
  if (rPicPengendali && (rPicPengendali.includes(uDept) || uDept.includes(rPicPengendali) || (uKode && rPicPengendali.includes(uKode)))) {
    return true;
  }

  // 4. Cek unit kerja asal pengusul (namaOrganisasi / kodeOrganisasi)
  if (rDept && (rDept.includes(uDept) || uDept.includes(rDept) || (uKode && rKode === uKode))) {
    return true;
  }

  return false;
}
