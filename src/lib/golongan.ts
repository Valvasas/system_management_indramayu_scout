/**
 * Golongan peserta didik + pembina. Dipakai beranda, /tentang, dan /golongan/[id].
 * Rincian (tingkatan SKU, satuan) mengikuti ketentuan umum Kwartir Nasional; halaman
 * golongan selalu merujuk ke petunjuk penyelenggaraan yang berlaku sebagai acuan resmi.
 * Kode kehormatan hanya DISEBUT namanya, teksnya tidak dikutip atau diparafrasekan di sini.
 */
import type { Golongan as GolonganEnum } from '@/db/schema';

export type GolonganId = 'siaga' | 'penggalang' | 'penegak' | 'pandega' | 'pembina';

export interface Golongan {
  id: GolonganId;
  name: string;
  /** Rentang usia, ringkas untuk kartu. */
  age: string;
  /** Satu kalimat: satuan dan cara belajarnya. */
  summary: string;
  /** Kalimat pembuka halaman golongan. */
  tagline: string;
  /** Paragraf penjelasan untuk orang tua & calon anggota. */
  about: string[];
  /** Satuan terkecil → satuan induk. */
  units: { name: string; description: string }[];
  /** Tingkatan Syarat Kecakapan Umum (atau jenjang kursus untuk pembina). */
  levels: { label: string; items: string[] };
  /** Kode kehormatan yang dipakai (nama saja). */
  honorCode: string;
  /** Kegiatan khas. */
  activities: string[];
  /** Enum basis data yang sesuai (untuk statistik). */
  dbKey: GolonganEnum;
}

export const golongan: Golongan[] = [
  {
    id: 'siaga',
    name: 'Siaga',
    age: '7–10 tahun',
    summary: 'Belajar sambil bermain dalam Barung dan Perindukan Siaga.',
    tagline: 'Langkah pertama: bermain, bernyanyi, dan belajar mandiri bersama teman sebaya.',
    about: [
      'Siaga adalah golongan termuda. Kegiatannya dirancang seperti suasana keluarga: penuh permainan, cerita, dan lagu yang menanamkan kebiasaan baik.',
      'Anak belajar mengurus diri, menolong orang lain, dan bekerja sama dalam kelompok kecil, didampingi pembina yang telah mengikuti kursus.',
    ],
    units: [
      { name: 'Barung', description: 'Kelompok kecil berisi beberapa anak, dipimpin seorang Pemimpin Barung.' },
      { name: 'Perindukan', description: 'Gabungan beberapa barung di satu gugus depan.' },
    ],
    levels: { label: 'Tingkatan SKU', items: ['Siaga Mula', 'Siaga Bantu', 'Siaga Tata'] },
    honorCode: 'Dwisatya dan Dwidarma',
    activities: ['Permainan edukatif', 'Pesta Siaga', 'Bernyanyi & bercerita', 'Keterampilan sederhana'],
    dbKey: 'SIAGA',
  },
  {
    id: 'penggalang',
    name: 'Penggalang',
    age: '11–15 tahun',
    summary: 'Berlatih dalam Regu dan Pasukan, mulai dari kemah hingga lomba tingkat.',
    tagline: 'Saatnya berkemah, menjelajah, dan belajar memimpin regu sendiri.',
    about: [
      'Penggalang berlatih di alam terbuka: mendirikan tenda, membaca peta, tali-temali, dan pionering. Sistem beregu melatih tanggung jawab dan kepemimpinan sejak dini.',
      'Puncak kegiatannya antara lain Jambore dan Lomba Tingkat, tempat regu dari berbagai gugus depan bertemu dan berkompetisi secara sehat.',
    ],
    units: [
      { name: 'Regu', description: 'Kelompok inti berisi beberapa anggota, dipimpin seorang Pemimpin Regu.' },
      { name: 'Pasukan', description: 'Gabungan beberapa regu dalam satu gugus depan.' },
    ],
    levels: { label: 'Tingkatan SKU', items: ['Penggalang Ramu', 'Penggalang Rakit', 'Penggalang Terap'] },
    honorCode: 'Trisatya dan Dasadarma',
    activities: ['Perkemahan', 'Jambore', 'Lomba Tingkat', 'Penjelajahan & navigasi', 'Pionering'],
    dbKey: 'PENGGALANG',
  },
  {
    id: 'penegak',
    name: 'Penegak',
    age: '16–20 tahun',
    summary: 'Berorganisasi dalam Sangga dan Ambalan, aktif dalam bakti masyarakat.',
    tagline: 'Merancang kegiatan sendiri dan mulai berbakti untuk masyarakat sekitar.',
    about: [
      'Penegak mengelola kegiatannya sendiri melalui Dewan Ambalan, dengan pembina sebagai pendamping. Fokusnya beralih ke pengabdian, kepemimpinan, dan kesiapan memasuki dunia dewasa.',
      'Penegak dapat bergabung dengan Satuan Karya (Saka) untuk mendalami bidang tertentu, seperti kesehatan, lingkungan, atau kebencanaan.',
    ],
    units: [
      { name: 'Sangga', description: 'Kelompok kecil Penegak dengan Pemimpin Sangga.' },
      { name: 'Ambalan', description: 'Gabungan sangga, dikelola oleh Dewan Ambalan.' },
    ],
    levels: { label: 'Tingkatan SKU', items: ['Penegak Bantara', 'Penegak Laksana'] },
    honorCode: 'Trisatya dan Dasadarma',
    activities: ['Raimuna', 'Perkemahan Bakti', 'Satuan Karya (Saka)', 'Bakti masyarakat'],
    dbKey: 'PENEGAK',
  },
  {
    id: 'pandega',
    name: 'Pandega',
    age: '21–25 tahun',
    summary: 'Berhimpun dalam Racana, mengabdi lewat karya nyata di masyarakat.',
    tagline: 'Golongan tertua peserta didik: berkarya, berbagi, dan menyiapkan diri menjadi pembina.',
    about: [
      'Pandega umumnya berbasis perguruan tinggi atau komunitas. Kegiatannya berorientasi pada karya nyata: pengabdian masyarakat, pengembangan diri, dan kewirausahaan.',
      'Banyak Pandega kemudian melanjutkan perannya sebagai pembina atau pelatih bagi golongan yang lebih muda.',
    ],
    units: [{ name: 'Racana', description: 'Satuan Pandega, dikelola oleh Dewan Racana.' }],
    levels: { label: 'Tingkatan SKU', items: ['Pandega'] },
    honorCode: 'Trisatya dan Dasadarma',
    activities: ['Perkemahan Wirakarya', 'Pengabdian masyarakat', 'Satuan Karya (Saka)', 'Kepemimpinan & kewirausahaan'],
    dbKey: 'PANDEGA',
  },
  {
    id: 'pembina',
    name: 'Pembina',
    age: 'Anggota dewasa',
    summary: 'Membimbing peserta didik di gugus depan setelah menempuh Kursus Mahir Dasar.',
    tagline: 'Orang dewasa yang menyalakan api semangat dan menjaga keselamatan peserta didik.',
    about: [
      'Pembina adalah anggota dewasa yang mendampingi peserta didik di gugus depan. Untuk membina, seseorang menempuh kursus berjenjang yang diselenggarakan Pusdiklatcab.',
      'Selain pembina, ada pelatih yang menyiapkan para pembina, serta andalan dan pengurus kwartir yang mengelola organisasi.',
    ],
    units: [{ name: 'Gugus Depan', description: 'Satuan pendidikan tempat pembina bertugas, berpangkalan di sekolah atau komunitas.' }],
    levels: { label: 'Jenjang kursus', items: ['Kursus Mahir Dasar (KMD)', 'Kursus Mahir Lanjutan (KML)'] },
    honorCode: 'Trisatya dan Dasadarma',
    activities: ['Membina latihan rutin', 'Mendampingi perkemahan', 'Kursus & pelatihan', 'Mengelola gugus depan'],
    dbKey: 'DEWASA',
  },
];

export const golonganById = (id: string) => golongan.find((g) => g.id === id);

export const golonganAnchor = (id: GolonganId) => `golongan-${id}`;

export const golonganHref = (id: GolonganId) => `/golongan/${id}`;
