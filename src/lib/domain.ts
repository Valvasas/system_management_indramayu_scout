/** Label & pilihan domain kepramukaan. Satu sumber untuk formulir, tabel, dan ekspor. */
import type { Audience, Golongan, MemberStatus } from '@/db/schema';

export const GOLONGAN_OPTIONS: { value: Golongan; label: string; age: string }[] = [
  { value: 'SIAGA', label: 'Siaga', age: '7–10 tahun' },
  { value: 'PENGGALANG', label: 'Penggalang', age: '11–15 tahun' },
  { value: 'PENEGAK', label: 'Penegak', age: '16–20 tahun' },
  { value: 'PANDEGA', label: 'Pandega', age: '21–25 tahun' },
  { value: 'DEWASA', label: 'Anggota Dewasa / Pembina', age: '≥ 26 tahun' },
];

export const golonganLabel = (g: Golongan) => GOLONGAN_OPTIONS.find((o) => o.value === g)?.label ?? g;

/** Golongan yang wajar untuk usia tertentu — dipakai sebagai saran, bukan paksaan. */
export function suggestedGolongan(birthDate: string, at = new Date()): Golongan | null {
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  let age = at.getFullYear() - b.getFullYear();
  if (at < new Date(at.getFullYear(), b.getMonth(), b.getDate())) age -= 1;
  if (age < 7) return null;
  if (age <= 10) return 'SIAGA';
  if (age <= 15) return 'PENGGALANG';
  if (age <= 20) return 'PENEGAK';
  if (age <= 25) return 'PANDEGA';
  return 'DEWASA';
}

export function ageOn(birthDate: string, at = new Date()): number {
  const b = new Date(birthDate);
  let age = at.getFullYear() - b.getFullYear();
  if (at < new Date(at.getFullYear(), b.getMonth(), b.getDate())) age -= 1;
  return age;
}

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  PENDING: 'Menunggu verifikasi',
  ACTIVE: 'Aktif',
  NEEDS_FIX: 'Perlu perbaikan',
  ARCHIVED: 'Diarsipkan',
};

export const GENDER_LABELS = { L: 'Laki-laki', P: 'Perempuan' } as const;

export const JENJANG_OPTIONS = ['SD/MI', 'SMP/MTs', 'SMA/SMK/MA', 'Perguruan Tinggi', 'Komunitas'];

export const AUDIENCE_LABELS: Record<Audience, string> = {
  ALL: 'Semua (peserta & staf)',
  PESERTA: 'Peserta saja',
  STAFF: 'Staf & pembina saja',
};

export const NEWS_CATEGORIES = ['Organisasi', 'Kegiatan', 'Pendidikan', 'Prestasi', 'Pengumuman', 'Pembinaan'];
export const DOCUMENT_CATEGORIES = ['Surat Keputusan', 'Petunjuk Teknis', 'Formulir', 'Panduan', 'Template Administrasi', 'Laporan'];
export const ACHIEVEMENT_LEVEL_OPTIONS = ['Kecamatan', 'Kabupaten', 'Provinsi', 'Nasional', 'Internasional'];
export const ALBUM_CATEGORIES = ['Kegiatan', 'Perayaan', 'Sosial', 'Pendidikan', 'Organisasi'];

/** Indramayu: kotak batas kasar untuk validasi koordinat gudep (mencegah salah ketik). */
export const INDRAMAYU_BOUNDS = { minLat: -6.75, maxLat: -6.15, minLng: 107.85, maxLng: 108.6 };
export const INDRAMAYU_CENTER = { lat: -6.4, lng: 108.25 };

/** Slug URL dari judul: huruf kecil, tanda hubung, maks 80 karakter. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/-$/, '');
}
