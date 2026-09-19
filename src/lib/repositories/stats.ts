import { statSummary } from '@/lib/data/mock-data';
import type { StatSummary } from '@/types';

export async function getStatSummary(): Promise<StatSummary> {
  return statSummary;
}

export interface StatTile {
  label: string;
  value: string;
  /** Konteks singkat: angka tanpa asal-usul tidak membangun kepercayaan. */
  note: string;
}

const number = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export async function getHomeStats(): Promise<StatTile[]> {
  const s = await getStatSummary();
  return [
    { label: 'Anggota terdata', value: number(s.totalMembers), note: `${s.verifiedPercent}% terverifikasi` },
    { label: 'Gugus Depan', value: number(s.totalGudep), note: 'Pangkalan SD s.d. SMA/SMK' },
    { label: 'Kwartir Ranting', value: number(s.totalKwarran), note: 'Seluruh kecamatan' },
    { label: 'Kegiatan setahun', value: number(s.totalActivities), note: 'Program kwarcab & ranting' },
  ];
}
