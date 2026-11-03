import React, { useEffect, useState } from 'react';
import { 
  RotateCw, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  Building2, 
  Send,
  HelpCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Archive,
  ArrowRight,
  ShieldCheck,
  Check,
  Lock,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { PusriRisk, UserRole, UserAccount } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';
import { downloadQuarterlyControlPdf, downloadRiskControlExcelCsv } from '../../utils/downloadRiskReport';
import { sortRisksNewestFirst } from '../../utils/riskMatrix';

interface EvaluasiCarryOverViewProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  risks: PusriRisk[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onSelectRisk: (risk: PusriRisk) => void;
  onNavigateNext?: (tab: string, riskId?: string) => void;
  initialSubTab?: 'aktif' | 'selesai' | 'carryover' | 'all';
  initialSelectedRiskId?: string | null;
}

export const EvaluasiCarryOverView: React.FC<EvaluasiCarryOverViewProps> = ({
  currentRole,
  currentUser,
  risks,
  onRiskUpdated,
  onSelectRisk,
  onNavigateNext,
  initialSubTab = 'aktif',
  initialSelectedRiskId
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'aktif' | 'selesai' | 'carryover' | 'all'>(initialSubTab);
  const [alasanCarryOver, setAlasanCarryOver] = useState('');
  const [tahunTujuan, setTahunTujuan] = useState(2027);
  const [rekomendasi, setRekomendasi] = useState('');
  const [catatanSelesai, setCatatanSelesai] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Hanya risiko strategi Mitigasi yang telah melewati persetujuan yang masuk ke Evaluasi Admin
  // Risiko Dihindari berhenti di tingkat Atasan / VP (tidak masuk ke Evaluasi Admin)
  const evaluasiPool = risks.filter((r) => {
    if (
      r.jenisPenanganan === 'Dihindari' ||
      r.jenisPenanganan === 'Diterima' ||
      r.jenisPenanganan === 'Transfer' ||
      (r.jenisPenanganan as string) === 'Ditransfer'
    ) {
      return false;
    }
    if (
      r.statusWorkflow === 'Tercatat_Final' ||
      r.statusWorkflow === 'Menunggu_Approval_VP' ||
      r.statusWorkflow === 'Menunggu_Approval_Admin' ||
      r.statusWorkflow === 'Draft_Unit' ||
      r.statusWorkflow === 'Revisi'
    ) {
      return false;
    }
    return true;
  });

  // Filter lists:
  // Data baru yang masuk selalu berada di atas (paling atas)
  const activeRisks = evaluasiPool
    .filter((r) => r.statusWorkflow !== 'Selesai' && r.statusWorkflow !== 'Carry_Over')
    .sort((a, b) => {
      const aDone = (a.progressPelaksanaanTerakhir && a.progressPelaksanaanTerakhir >= 100) || a.statusPelaksanaanTerakhir === 'Selesai Dilaksanakan' ? 1 : 0;
      const bDone = (b.progressPelaksanaanTerakhir && b.progressPelaksanaanTerakhir >= 100) || b.statusPelaksanaanTerakhir === 'Selesai Dilaksanakan' ? 1 : 0;
      if (bDone !== aDone) return bDone - aDone;
      return sortRisksNewestFirst(a, b);
    });

  const finishedRisks = evaluasiPool.filter((r) => r.statusWorkflow === 'Selesai').sort(sortRisksNewestFirst);
  // Hanya risiko yang secara resmi ditetapkan Carry Over
  const carryOverRisks = evaluasiPool.filter((r) => r.statusWorkflow === 'Carry_Over').sort(sortRisksNewestFirst);

  let filteredList = activeRisks;
  if (activeSubTab === 'selesai') filteredList = finishedRisks;
  else if (activeSubTab === 'carryover') filteredList = carryOverRisks;
  else if (activeSubTab === 'all') filteredList = [...evaluasiPool].sort(sortRisksNewestFirst);

  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(
    initialSelectedRiskId || filteredList[0]?.id || activeRisks[0]?.id || evaluasiPool[0]?.id || null
  );

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
    if (initialSelectedRiskId) setSelectedRiskId(initialSelectedRiskId);
  }, [initialSubTab, initialSelectedRiskId]);

  const selectedRisk = evaluasiPool.find((r) => r.id === selectedRiskId) || filteredList[0] || null;

  // Handle Mark as Selesai (Completed by Admin)
  const handleMarkAsCompleted = async (riskId?: string) => {
    const targetId = riskId || selectedRisk?.id;
    if (!targetId) return;

    const targetRisk = risks.find((r) => r.id === targetId);
    if (!targetRisk) return;

    setIsSubmitting(true);
    try {
      const updated = await PusriApiClient.updateRisk(
        targetId,
        {
          statusWorkflow: 'Selesai',
          statusKebutuhanMitigasi: 'Selesai / Terpenuhi (Closed)',
          approvalNotesAdmin: catatanSelesai || 'Telah dinyatakan selesai dan ditutup secara resmi oleh Admin Korporat.',
          catatanSelesai: catatanSelesai || 'Dinyatakan selesai oleh Admin. Mitigasi tuntas dieksekusi dengan hasil residual terkendali.',
          tanggalSelesai: new Date().toISOString()
        } as any,
        currentUser?.nama ? `${currentUser.nama} (Badge ${currentUser.badge || ''}) - Dinyatakan Selesai` : 'Risk Admin Korporat - Dinyatakan Selesai',
        'risk admin'
      );

      if (updated) {
        onRiskUpdated(updated);
        setNotice(`✅ Risiko ${targetRisk.kodeRisiko} (${targetRisk.namaOrganisasi}) BERHASIL DINYATAKAN SELESAI OLEH ADMIN! Data tercatat dan tersimpan permanen, otomatis dihilangkan dari Tugas PIC dan Daftar Register Risiko, dan kini hanya terdata di bagian Evaluasi Risiko (Telah Diselesaikan).`);
        setCatatanSelesai('');
        
        // Pick next candidate in active list
        const remainingActive = activeRisks.filter((r) => r.id !== targetId);
        if (remainingActive.length > 0) {
          setSelectedRiskId(remainingActive[0].id);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Mark as Carry Over
  const handleCarryOver = async () => {
    if (!selectedRisk) return;
    setIsSubmitting(true);
    try {
      const updated = await PusriApiClient.updateRisk(
        selectedRisk.id,
        {
          statusWorkflow: 'Carry_Over',
          carryOverInfo: {
            alasanCarryOver: alasanCarryOver || 'Program mitigasi multi-tahun memerlukan tindak lanjut di RKAP berikutnya.',
            targetTahun: tahunTujuan,
            rekomendasiKomite: rekomendasi || 'Disetujui komite risiko Pusri untuk dilanjutkan pada periode target.',
            approvalCarryOverBy: currentUser?.nama ? `${currentUser.nama} (${currentUser.role})` : (currentRole === 'risk admin' ? 'Disetujui Komite Risiko Korporat' : 'Diajukan Unit / VP'),
            tanggalCarryOver: new Date().toISOString()
          }
        },
        currentUser?.nama ? `${currentUser.nama} (${currentUser.role}) - Evaluasi Tahunan` : `${currentRole} - Evaluasi Tahunan`,
        currentRole
      );
      if (updated) {
        onRiskUpdated(updated);
        setNotice(`🔄 Risiko ${updated.kodeRisiko} berhasil ditetapkan CARRY OVER ke RKAP ${tahunTujuan}.`);
        setAlasanCarryOver('');
        setRekomendasi('');
        
        const remainingActive = activeRisks.filter((r) => r.id !== selectedRisk.id);
        if (remainingActive.length > 0) {
          setSelectedRiskId(remainingActive[0].id);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Memulai Pengendalian Ulang di Tahun Berikutnya dengan status : carry over
  const handleStartPengendalianUlang = async (riskToRestart?: PusriRisk) => {
    const target = riskToRestart || selectedRisk;
    if (!target) return;

    setIsSubmitting(true);
    const targetYear = target.carryOverInfo?.targetTahun || tahunTujuan || (target.tahun + 1) || 2027;
    const actorName = currentUser?.nama ? `${currentUser.nama} (${currentRole})` : `${currentRole} - Pengendalian Ulang Carry Over`;

    // Simpan riwayat triwulan tahun sebelumnya ke dalam carryOverInfo.riwayatTahunSebelumnya agar data lama tidak hilang
    const existingQuarters = target.pengendalianTriwulan || [];
    const archivedHistory = target.carryOverInfo?.riwayatTahunSebelumnya || (existingQuarters.length > 0 ? existingQuarters : []);

    // Siapkan triwulan 1 baru untuk siklus tahun berikutnya
    const newQuarterControls = [
      {
        triwulan: 'TW 1' as const,
        realisasiKegiatan: `Pengendalian Ulang Periode RKAP ${targetYear} (Status: Carry Over). Memulai pemantauan dan mitigasi triwulan 1.`,
        realisasiBiaya: 0,
        progressPersen: 0,
        progressFisikPic: 0,
        progresPengerjaanAdmin: 0,
        kemungkinanResidual: target.kemungkinanAwal,
        dampakResidual: target.dampakAwal,
        tingkatResidual: target.tingkatRisikoAwal,
        statusPengendalian: 'On Track' as const,
        kendalaDanTindakLanjut: `Risiko Carry Over dilanjutkan ke siklus RKAP ${targetYear}. Memulai pengendalian ulang triwulanan.`,
        updatedAt: new Date().toISOString()
      }
    ];

    try {
      const updated = await PusriApiClient.updateRisk(
        target.id,
        {
          tahun: targetYear,
          statusWorkflow: 'Carry_Over',
          isPengendalianUlangCarryOver: true,
          tahunCarryOverMulai: targetYear,
          carryOverInfo: {
            targetTahun: targetYear,
            alasanCarryOver: target.carryOverInfo?.alasanCarryOver || 'Program mitigasi multi-tahun memerlukan tindak lanjut di RKAP berikutnya.',
            rekomendasiKomite: target.carryOverInfo?.rekomendasiKomite || 'Disetujui komite risiko Pusri untuk dilanjutkan pada periode target.',
            approvalCarryOverBy: target.carryOverInfo?.approvalCarryOverBy || (currentUser?.nama || 'Admin Korporat'),
            tanggalCarryOver: target.carryOverInfo?.tanggalCarryOver || new Date().toISOString(),
            isPengendalianUlangActive: true,
            tahunPengendalianUlang: targetYear,
            tanggalMulaiPengendalianUlang: new Date().toISOString(),
            riwayatTahunSebelumnya: archivedHistory
          },
          pengendalianTriwulan: newQuarterControls,
          targetWaktuMitigasi: 'TW 1',
          progressPelaksanaanTerakhir: 0,
          statusPelaksanaanTerakhir: 'Sedang Berjalan'
        },
        actorName,
        currentRole
      );

      if (updated) {
        onRiskUpdated(updated);
        setNotice(`🔄 Risiko ${updated.kodeRisiko} BERHASIL DIMULAI PENGENDALIAN ULANG di tahun ${targetYear} dengan status : CARRY OVER! Membuka menu Pengendalian Triwulan...`);
        onNavigateNext?.('pengendalian-tw', updated.id);
      }
    } catch (error) {
      setNotice(`Gagal memulai pengendalian ulang: ${error instanceof Error ? error.message : 'Terjadi kesalahan sistem.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      {/* Banner */}
      <div className="p-3.5 md:p-4 rounded-xl bg-gradient-to-r from-[#009fe3] to-[#0284c7] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base md:text-lg font-extrabold tracking-tight">
          Evaluasi Efektivitas, Selesai & Carry Over
        </h2>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-mono text-sky-300">
            Selesai: <strong className="text-white font-bold">{finishedRisks.length}</strong>
          </div>
          <div className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-mono text-yellow-300">
            Carry Over: <strong className="text-white font-bold">{carryOverRisks.length}</strong>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-300 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#009fe3] dark:text-sky-400 shrink-0" />
            <span className="font-semibold">{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-xs font-bold hover:underline cursor-pointer px-2 py-1 rounded bg-sky-100 dark:bg-sky-900/60">
            Tutup
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => { setActiveSubTab('aktif'); if (activeRisks[0]) setSelectedRiskId(activeRisks[0].id); }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'aktif'
              ? 'bg-white dark:bg-slate-900 text-[#009fe3] dark:text-sky-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Perlu Evaluasi (Aktif)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-100 dark:bg-sky-950 text-[#009fe3] dark:text-sky-300 font-mono">
            {activeRisks.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveSubTab('selesai'); if (finishedRisks[0]) setSelectedRiskId(finishedRisks[0].id); }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'selesai'
              ? 'bg-white dark:bg-slate-900 text-[#009fe3] dark:text-sky-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-[#009fe3]" />
          <span>Telah Diselesaikan</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-100 dark:bg-sky-950 text-[#009fe3] dark:text-sky-300 font-mono">
            {finishedRisks.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveSubTab('carryover'); if (carryOverRisks[0]) setSelectedRiskId(carryOverRisks[0].id); }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'carryover'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Carry Over (Database)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
            {carryOverRisks.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveSubTab('all'); if (evaluasiPool[0]) setSelectedRiskId(evaluasiPool[0].id); }}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Semua ({evaluasiPool.length})</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left: Risks List */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>
              {activeSubTab === 'aktif' && `Daftar Risiko Aktif (${filteredList.length})`}
              {activeSubTab === 'selesai' && `Daftar Risiko Telah Selesai (${filteredList.length})`}
              {activeSubTab === 'carryover' && `Daftar Risiko Carry Over (${filteredList.length})`}
              {activeSubTab === 'all' && `Seluruh Risiko RKAP (${filteredList.length})`}
            </span>
            <span className="text-[10px] font-mono text-[#009fe3] bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
              {activeSubTab.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
                {activeSubTab === 'aktif' ? 'Semua risiko telah selesai dievaluasi / tidak ada risiko aktif pending.' : 'Tidak ada data risiko dalam kategori ini.'}
              </div>
            ) : (
              filteredList.map((risk) => {
                const isSelected = selectedRisk?.id === risk.id;
                const isFinished = risk.statusWorkflow === 'Selesai';
                const isCarryOver = risk.statusWorkflow === 'Carry_Over';

                return (
                  <div
                    key={risk.id}
                    onClick={() => setSelectedRiskId(risk.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all relative group ${
                      isSelected
                        ? 'border-[#009fe3] bg-sky-50/70 dark:bg-sky-950/40 ring-2 ring-sky-300 dark:ring-sky-800'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-slate-900 dark:text-slate-100 mb-1">
                      <span>{risk.kodeRisiko}</span>
                      <div className="flex items-center gap-1">
                        {((risk.progressPelaksanaanTerakhir && risk.progressPelaksanaanTerakhir >= 100) || risk.statusPelaksanaanTerakhir === 'Selesai Dilaksanakan') && !isFinished && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            PIC 100% Selesai
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isFinished
                            ? 'bg-sky-100 dark:bg-sky-950/70 text-[#009fe3] dark:text-sky-300 border-sky-300 dark:border-sky-800'
                            : (isCarryOver || (!isFinished && risk.currentTingkatRisiko !== 'Low'))
                              ? 'bg-yellow-100 dark:bg-yellow-950/70 text-amber-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                          {isFinished 
                            ? 'Selesai' 
                            : isCarryOver 
                              ? 'Carry Over 2027' 
                              : (!isFinished && risk.currentTingkatRisiko !== 'Low') 
                                ? 'Carry Over (Belum Low)' 
                                : risk.statusWorkflow.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                      {risk.namaOrganisasi}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {risk.pernyataanRisiko}
                    </p>

                    {/* Quick Start Pengendalian Ulang on Row if Carry Over */}
                    {isCarryOver && (
                      <div className="pt-2 mt-2 border-t border-amber-100 dark:border-amber-900/60 flex items-center justify-between">
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold">
                          RKAP {risk.carryOverInfo?.targetTahun || 2027}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartPengendalianUlang(risk);
                          }}
                          title="Lakukan pengendalian kembali di tahun berikutnya (Pengendalian Triwulan)"
                          className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCw className="w-3 h-3 text-amber-600" />
                          <span>Kendalikan di TW 1</span>
                        </button>
                      </div>
                    )}

                    {/* Quick Mark Completed on Row (If not finished yet and Admin) */}
                    {!isFinished && !isCarryOver && currentRole === 'risk admin' && (
                      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Inherent: {risk.inherentScore} ({risk.tingkatRisikoAwal})
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsCompleted(risk.id);
                          }}
                          title="Nyatakan Selesai resmi oleh Admin"
                          className="px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-[#009fe3] dark:text-sky-300 text-[10px] font-bold border border-sky-300 dark:border-sky-800 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Nyatakan Selesai (Admin)</span>
                        </button>
                      </div>
                    )}

                    {/* Status on Row (If finished) */}
                    {isFinished && (
                      <div className="pt-2 mt-2 border-t border-emerald-100 dark:border-emerald-950 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Selesai Dikendalikan</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Buka Formulir
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed Evaluation & Actions */}
        <div className="md:col-span-2 space-y-4">
          {selectedRisk ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                      {selectedRisk.kodeRisiko}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono border ${
                      selectedRisk.statusWorkflow === 'Selesai'
                        ? 'bg-sky-100 dark:bg-sky-950 text-[#009fe3] dark:text-sky-300 border-sky-300 dark:border-sky-800'
                        : selectedRisk.statusWorkflow === 'Carry_Over'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                          : 'bg-sky-100 dark:bg-sky-950 text-[#009fe3] dark:text-sky-300 border-sky-300 dark:border-sky-800'
                    }`}>
                      {selectedRisk.statusWorkflow === 'Selesai' ? 'STATUS: SELESAI (CLOSED)' : selectedRisk.statusWorkflow === 'Carry_Over' ? 'STATUS: CARRY OVER 2027' : 'STATUS: DALAM PENGENDALIAN'}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Departemen: <strong>{selectedRisk.namaOrganisasi}</strong> ({selectedRisk.kodeOrganisasi})
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-500">Skor Awal:</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                    {selectedRisk.inherentScore} ({selectedRisk.tingkatRisikoAwal})
                  </span>
                  {selectedRisk.statusWorkflow === 'Selesai' && (
                    <div className="flex items-center gap-1.5 sm:ml-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Selesai Dikendalikan</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* BANNER RISIKO TELAH SELESAI & DOKUMEN BISA DI-DOWNLOAD */}
              {selectedRisk.statusWorkflow === 'Selesai' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/20 border-2 border-emerald-500 dark:border-emerald-600/80 text-emerald-950 dark:text-emerald-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100">
                          Pengendalian Triwulan Telah Selesai Dikendalikan
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-200 font-mono font-extrabold text-[10px] border border-emerald-400">
                          STATUS : CLOSED
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-900 dark:text-emerald-200 mt-1 leading-relaxed">
                        Data risiko ini telah menyelesaikan tahapan pemantauan dan pengendalian triwulan dengan capaian target residual terkendali (<strong>{selectedRisk.currentTingkatRisiko}</strong>). Dokumen Berita Acara dan Rekapitulasi Data siap diunduh untuk dokumentasi korporat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => downloadQuarterlyControlPdf(selectedRisk)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="Unduh Berita Acara Laporan Selesai (Format PDF)"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Unduh Berita Acara (PDF)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadRiskControlExcelCsv(selectedRisk)}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="Unduh Rekapitulasi Data (Excel / CSV)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Unduh Excel / CSV</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Statement & Details */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Pernyataan Risiko:</span>
                  <p className="text-slate-900 dark:text-slate-100 font-bold text-xs">{selectedRisk.pernyataanRisiko}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Akar Masalah:</span>
                    <p className="text-slate-700 dark:text-slate-300">{selectedRisk.penyebabRisiko}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Uraian Dampak:</span>
                    <p className="text-slate-700 dark:text-slate-300">{selectedRisk.dampakRisiko}</p>
                  </div>
                </div>
                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                  <span className="text-slate-500 font-semibold">Strategi & Tindakan: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRisk.jenisPenanganan} - {selectedRisk.rencanaPenanganan}</span>
                </div>
              </div>

              {/* PIC 100% Completion Notification */}
              {selectedRisk.statusWorkflow !== 'Selesai' && 
               ((selectedRisk.progressPelaksanaanTerakhir && selectedRisk.progressPelaksanaanTerakhir >= 100) || selectedRisk.statusPelaksanaanTerakhir === 'Selesai Dilaksanakan') && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-200">
                        Pengerjaan Risiko 100% Selesai Diinput oleh PIC
                      </p>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                        Data risiko tersimpan di bagian Evaluasi Risiko. Menunggu Admin menyatakan selesai secara resmi.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 text-[10px]">
                    Progres: 100%
                  </span>
                </div>
              )}

              {/* ACTION BOXES: PENGENDALIAN KEMBALI CARRY OVER & OPSI SELESAI */}
              {selectedRisk.statusWorkflow === 'Carry_Over' ? (
                <div className="space-y-4">
                  {/* KARTU PENGENDALIAN KEMBALI DI TAHUN BERIKUTNYA DENGAN STATUS CARRY OVER */}
                  <div className="p-4 rounded-xl border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50/80 via-yellow-50/50 to-amber-100/40 dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-slate-900 shadow-xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
                          <RotateCw className="w-4 h-4 animate-spin-reverse" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-amber-950 dark:text-yellow-200 text-xs sm:text-sm flex items-center gap-1.5">
                            <span>Pengendalian Kembali di Tahun Berikutnya (Tahun {selectedRisk.carryOverInfo?.targetTahun || 2027})</span>
                          </h4>
                          <span className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                            Siklus Lanjutan Multi-Tahun • Status Resmi: <strong>Carry Over</strong>
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-yellow-200 font-mono font-extrabold text-[11px] border border-amber-400 dark:border-amber-700 shrink-0 self-start sm:self-auto">
                        STATUS : CARRY OVER
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-900/80 text-xs space-y-2">
                      <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                        Risiko <strong>{selectedRisk.kodeRisiko}</strong> telah resmi tercatat sebagai <strong>Carry Over</strong>. Sesuai tata kelola risiko, risiko ini dapat <strong>dilakukan pengendalian kembali di tahun berikutnya</strong> dan <strong>memulai pengendalian ulang di bagian Pengendalian Triwulan (TW 1 - TW 4) dengan status : Carry Over</strong>.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="p-2 rounded bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40">
                          <span className="text-[10px] font-bold text-amber-800 dark:text-yellow-400 block mb-0.5">Alasan Carry Over:</span>
                          <p className="text-slate-800 dark:text-slate-200 italic line-clamp-2">
                            "{selectedRisk.carryOverInfo?.alasanCarryOver || 'Program mitigasi multi-tahun memerlukan tindak lanjut di RKAP berikutnya.'}"
                          </p>
                        </div>
                        <div className="p-2 rounded bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40">
                          <span className="text-[10px] font-bold text-amber-800 dark:text-yellow-400 block mb-0.5">Rekomendasi Komite:</span>
                          <p className="text-slate-800 dark:text-slate-200 italic line-clamp-2">
                            "{selectedRisk.carryOverInfo?.rekomendasiKomite || 'Disetujui untuk dikendalikan kembali di tahun target.'}"
                          </p>
                        </div>
                      </div>

                      {selectedRisk.carryOverInfo?.riwayatTahunSebelumnya && selectedRisk.carryOverInfo.riwayatTahunSebelumnya.length > 0 && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                          📂 Riwayat pemantauan tahun sebelumnya tersimpan ({selectedRisk.carryOverInfo.riwayatTahunSebelumnya.length} TW terekam).
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                      <div className="text-[11px] text-amber-900 dark:text-yellow-300 font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-yellow-400 shrink-0" />
                        <span>Mulai dari TW 1 dengan PIC yang ditugaskan & status tetap Carry Over.</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleStartPengendalianUlang(selectedRisk)}
                          disabled={isSubmitting}
                          className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-500 to-[#009fe3] hover:from-amber-600 hover:to-[#0284c7] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                        >
                          <RotateCw className="w-4 h-4 text-yellow-200" />
                          <span>
                            {isSubmitting
                              ? 'Memproses...'
                              : `Mulai Pengendalian Ulang di TW (Tahun ${selectedRisk.carryOverInfo?.targetTahun || 2027})`}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BOX: MARK AS SELESAI (Jika suatu saat risiko Carry Over sudah tuntas) */}
                  {currentRole === 'risk admin' && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-[#009fe3]" />
                          <span>Opsi Penutupan: Nyatakan Selesai (Jika Pengendalian Carry Over Telah Tuntas)</span>
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                          Khusus Admin
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          placeholder="Catatan penutupan risiko carry over (opsional)..."
                          value={catatanSelesai}
                          onChange={(e) => setCatatanSelesai(e.target.value)}
                          className="flex-1 h-8 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleMarkAsCompleted()}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Nyatakan Selesai</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedRisk.statusWorkflow !== 'Selesai' && (
                currentRole === 'risk admin' ? (
                  <>
                    {/* ACTION BOX 1: MARK AS SELESAI (Khusus Admin) */}
                    <div className="p-4 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold text-xs">
                          <CheckCircle className="w-4 h-4 text-[#009fe3] dark:text-sky-400" />
                          <span>Opsi 1: Nyatakan Selesai oleh Admin</span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#009fe3] dark:text-sky-400 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-full">
                          Wewenang Admin Korporat
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Data risiko yang sudah dinyatakan selesai oleh Admin akan tercatat dan tersimpan permanen, dinyatakan selesai, dan <strong>tidak bisa dilihat lagi di Tugas & Pengendalian Risiko (PIC) maupun daftar register risiko</strong>. Hanya terdata di bagian Evaluasi Risiko & Carry Over (telah diselesaikan).
                      </p>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                        <input
                          type="text"
                          placeholder="Catatan pernyataan selesai dari Admin (opsional)..."
                          value={catatanSelesai}
                          onChange={(e) => setCatatanSelesai(e.target.value)}
                          className="flex-1 h-9 px-3 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#009fe3]/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleMarkAsCompleted()}
                          disabled={isSubmitting}
                          className="px-5 py-2 bg-[#009fe3] hover:bg-[#0284c7] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                          <span>{isSubmitting ? 'Menyimpan...' : 'Nyatakan Selesai (Admin)'}</span>
                        </button>
                      </div>
                    </div>

                    {/* ACTION BOX 2: CARRY OVER OPTION (Khusus Admin) */}
                    <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/30 dark:bg-sky-950/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                          <RotateCw className="w-3.5 h-3.5 text-[#009fe3]" />
                          <span>Opsi 2: Penetapan Usulan Carry Over ke RKAP Berikutnya</span>
                        </span>
                        <span className="text-[10px] font-semibold text-[#009fe3] dark:text-sky-400 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-full">
                          Wewenang Admin Korporat
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Tahun Anggaran Asal
                          </label>
                          <input
                            type="number"
                            disabled
                            value={selectedRisk.tahun}
                            className="w-full h-9 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-500 opacity-80 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Tahun Anggaran Sasaran (Carry Over) *
                          </label>
                          <input
                            type="number"
                            value={tahunTujuan}
                            onChange={(e) => setTahunTujuan(Number(e.target.value))}
                            className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 font-bold focus:border-[#009fe3] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Justifikasi / Alasan Kebutuhan Carry Over *
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Uraikan kendala atau sifat multi-tahun yang memerlukan perpanjangan ke RKAP tahun berikutnya..."
                          value={alasanCarryOver}
                          onChange={(e) => setAlasanCarryOver(e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Rekomendasi Penanganan di Tahun Baru *
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Rekomendasi tindakan mitigasi lanjutan pada periode RKAP target..."
                          value={rekomendasi}
                          onChange={(e) => setRekomendasi(e.target.value)}
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:border-[#009fe3] outline-none resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-end pt-2 border-t border-sky-200/60 dark:border-sky-800/60">
                        <button
                          type="button"
                          onClick={handleCarryOver}
                          disabled={isSubmitting}
                          className="px-5 py-2 bg-[#009fe3] hover:bg-[#0284c7] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-yellow-300" />
                          <span>{isSubmitting ? 'Memproses...' : `Tetapkan Carry Over ke RKAP ${tahunTujuan}`}</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* MODE TINJAUAN KHUSUS ROLE NON-ADMIN (HANYA BISA MELIHAT) */
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                        <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Mode Tinjauan Pejabat ({currentRole})</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold">
                        Hanya Melihat (View-Only)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Sebagai <strong>{currentRole}</strong>, Anda dapat membuka menu ini untuk melihat seluruh data evaluasi efektivitas, capaian progres, dan status risiko. Namun, <strong>opsi untuk menyatakan risiko selesai</strong> dan <strong>opsi penetapan usulan carry over ke RKAP berikutnya</strong> hanya dapat diakses dan dieksekusi secara resmi oleh <strong>Admin Korporat</strong>.
                    </p>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              Pilih risiko dari daftar di sebelah kiri untuk melakukan evaluasi, menandai selesai, atau menetapkan carry over.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
