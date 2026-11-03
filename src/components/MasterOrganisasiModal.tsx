import React, { useState } from 'react';
import { X, Building2, Search, CheckCircle2, Shield } from 'lucide-react';
import { OrganizationMaster, MasterChecklistItem } from '../types/pusri';

interface MasterOrganisasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: OrganizationMaster[];
  checklist: MasterChecklistItem[];
  mode: 'organisasi' | 'checklist';
}

export const MasterOrganisasiModal: React.FC<MasterOrganisasiModalProps> = ({
  isOpen,
  onClose,
  departments,
  checklist,
  mode
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="px-5 py-4 bg-[#009fe3] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {mode === 'organisasi' ? (
              <Building2 className="w-5 h-5 text-yellow-300" />
            ) : (
              <Shield className="w-5 h-5 text-yellow-300" />
            )}
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {mode === 'organisasi' ? 'Master Data Organisasi & Unit Kerja' : 'Master Standar Dampak & Jenis Risiko'}
              </h3>
              <p className="text-xs text-sky-100 mt-0.5">
                Struktur organisasi dan taksonomi standar risiko PT Pupuk Sriwidjaja Palembang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs max-h-[74vh] overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-[#009fe3] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#009fe3]/15 shadow-2xs transition-all"
            />
          </div>

          {mode === 'organisasi' ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">Nama Organisasi</th>
                    <th className="py-2.5 px-3">Corporate Risk Officer</th>
                    <th className="py-2.5 px-3">Corporate Risk Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {departments
                    .filter((d) =>
                      d.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.direktorat.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((dept) => (
                      <tr key={dept.kode} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#009fe3] dark:text-sky-400">{dept.kode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{dept.nama}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {dept.officers && dept.officers.length > 0 ? (
                            <div className="space-y-0.5">
                              {dept.officers.map(o => (
                                <div key={o.nik} className="text-[11px]">{o.nik} - {o.nama}</div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {dept.owners && dept.owners.length > 0 ? (
                            <div className="space-y-0.5">
                              {dept.owners.map(o => (
                                <div key={o.nik} className="text-[11px]">{o.nik} - {o.nama}</div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {checklist
                .filter((c) =>
                  c.jenisRisiko.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.deskripsiStandar.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{item.jenisRisiko}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 dark:bg-yellow-950/70 text-amber-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800">
                        {item.kategori}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{item.deskripsiStandar}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                      <div>
                        <strong>Pemicu Umum:</strong> {item.faktorPemicuUmum}
                      </div>
                      <div>
                        <strong>Rekomendasi Pengendalian:</strong> {item.rekomendasiPengendalian}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
