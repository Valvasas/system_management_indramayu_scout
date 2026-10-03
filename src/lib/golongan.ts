/** Golongan peserta didik + pembina. Dipakai akses cepat beranda dan halaman Profil. */

export type GolonganId = 'siaga' | 'penggalang' | 'penegak' | 'pembina';

export interface Golongan {
  id: GolonganId;
  name: string;
  /** Rentang usia, ringkas untuk kartu. */
  age: string;
  /** Satu kalimat: satuan dan cara belajarnya. */
  summary: string;
}

export const golongan: Golongan[] = [
  {
    id: 'siaga',
    name: 'Siaga',
    age: '7–10 tahun',
    summary: 'Belajar sambil bermain dalam Barung dan Perindukan Siaga.',
  },
  {
    id: 'penggalang',
    name: 'Penggalang',
    age: '11–15 tahun',
    summary: 'Berlatih dalam Regu dan Pasukan, mulai dari kemah hingga lomba tingkat.',
  },
  {
    id: 'penegak',
    name: 'Penegak',
    age: '16–20 tahun',
    summary: 'Berorganisasi dalam Sangga dan Ambalan, aktif dalam bakti masyarakat.',
  },
  {
    id: 'pembina',
    name: 'Pembina',
    age: 'Anggota dewasa',
    summary: 'Membimbing peserta didik di gugus depan setelah menempuh Kursus Mahir Dasar.',
  },
];

export const golonganAnchor = (id: GolonganId) => `golongan-${id}`;
