import type { SumberRisikoGroup } from '../types/pusri';

export type { SumberRisikoGroup };

export const MASTER_SUMBER_RISIKO_DATA: SumberRisikoGroup[] = [
  {
    kategori: 'Material',
    items: [
      'Ketersediaan material /Spare Part /Produk / Bahan Penunjang',
      'Spesifikasi & mutu material / Spare part/Produk / Bahan Penunjang',
      'Delivery time material/ Spare part/Produk / Bahan Penunjang pesanan',
      'Ketersediaan material / Spare part/Produk / Bahan Penunjang pengganti/substitusi',
      'Harga Material / Spare part/Produk / Bahan Penunjang'
    ]
  },
  {
    kategori: 'Mesin',
    items: [
      'Usia mesin / Peralatan',
      'Mesin tidak berfungsi dengan baik atau rusak',
      'Mesin pesanan tidak sesuai specs dan mutu',
      'Keusangan (obsolete)',
      'Adaptasi mesin',
      'Mesin tidak tersedia'
    ]
  },
  {
    kategori: 'Method',
    items: [
      'Ketidakcukupan prosedur / SOP / Instruksi Kerja',
      'Ketidaksesuaian pelaksanaan terhadap SOP standar',
      'Perubahan metode kerja / proses produksi pabrik',
      'Kegagalan sistem teknologi informasi / otomasi kontrol'
    ]
  },
  {
    kategori: 'Money/Dana',
    items: [
      'Keterbatasan alokasi anggaran / RKAP',
      'Fluktuasi nilai tukar mata uang asing (Kurs USD/IDR)',
      'Kenaikan biaya operasional / harga gas bumi / bahan baku',
      'Keterlambatan pencairan dana / pembayaran mitra'
    ]
  },
  {
    kategori: 'Man / Manusia (SDM)',
    items: [
      'Kurangnya kompetensi / sertifikasi teknis personel',
      'Kelalaian manusia (Human Error) pada pengoperasian',
      'Kekurangan jumlah personel operasional / pemeliharaan',
      'Kesehatan dan keselamatan kerja (K3) personel lapangan'
    ]
  },
  {
    kategori: 'Milieu / Lingkungan & Regulasi',
    items: [
      'Perubahan regulasi pemerintah / kebijakan subsidi pupuk',
      'Cuaca ekstrem / bencana alam / gangguan lingkungan',
      'Baku mutu emisi / limbah lingkungan hidup (PROPER)',
      'Dinamika sosial masyarakat sekitar kawasan pabrik'
    ]
  },
  {
    kategori: 'Market / Pasar & Pasokan',
    items: [
      'Fluktuasi harga komoditas amoniak & urea global',
      'Persaingan pasar pupuk komersial / non-subsidi',
      'Gangguan distribusi logistik / transportasi pengapalan',
      'Ketergantungan pada pemasok tunggal (Single Vendor)'
    ]
  }
];

export function cloneDefaultSumberRisiko(): SumberRisikoGroup[] {
  return MASTER_SUMBER_RISIKO_DATA.map((group) => ({
    kategori: group.kategori,
    items: [...group.items]
  }));
}

export function flattenSumberRisikoGroups(groups: SumberRisikoGroup[]): string[] {
  return groups.flatMap((group) => group.items || []);
}

export const ALL_SUMBER_RISIKO_FLAT: string[] = flattenSumberRisikoGroups(MASTER_SUMBER_RISIKO_DATA);
