/**
 * Teks persetujuan wali yang dibaca & disetujui per cakupan. Setiap perubahan isi WAJIB
 * menaikkan CONSENT_TEXT_VERSION: catatan lama tetap menunjuk versi yang benar-benar dibaca wali.
 * Setiap klaim di sini harus sesuai implementasi (lihat /kebijakan-privasi).
 */
import type { ConsentScope } from '@/db/schema';

export const CONSENT_TEXT_VERSION = '2026-10-v2';

export const CONSENT_SCOPES: readonly ConsentScope[] = ['DATA', 'PHOTO', 'ACTIVITY'];

export const CONSENT_TEXTS: Record<ConsentScope, { title: string; body: string[] }> = {
  DATA: {
    title: 'Pengelolaan data pribadi anak',
    body: [
      'Kwarcab Gerakan Pramuka Indramayu menyimpan nama lengkap, jenis kelamin, tanggal lahir, golongan, gugus depan, serta nama dan nomor telepon orang tua/wali untuk keperluan administrasi keanggotaan.',
      'Data hanya dapat dibuka pembina gugus depan, staf kwarran, dan pengurus Kwarcab yang berwenang sesuai wilayahnya. Telepon, alamat, dan data wali disimpan terenkripsi.',
      'Persetujuan dapat dicabut kapan saja melalui pembina atau dengan kode baru. Setelah dicabut, data anak tidak dapat diverifikasi ulang, didaftarkan ke kegiatan baru, atau dibuatkan akun portal sampai Anda menyetujui kembali. Penghapusan data dilakukan atas permintaan dengan menganonimkan data anak.',
    ],
  },
  PHOTO: {
    title: 'Foto dan dokumentasi kegiatan',
    body: [
      'Anak boleh tampak dalam foto dokumentasi kegiatan untuk arsip internal Kwarcab dan gugus depan.',
      'Situs publik tidak menampilkan foto wajah anak yang dapat dikenali. Foto suasana kegiatan yang tampil di situs publik tidak memuat nama anak.',
    ],
  },
  ACTIVITY: {
    title: 'Keikutsertaan dalam kegiatan',
    body: [
      'Anak boleh didaftarkan dan mengikuti kegiatan kepramukaan (latihan, perkemahan, lomba) yang diumumkan melalui portal.',
      'Panitia kegiatan menerima nama, golongan, dan gugus depan anak; nomor telepon dan data wali tidak ikut dibagikan.',
      'Tanpa persetujuan ini, anak tidak dapat mendaftar kegiatan lewat portal.',
    ],
  },
};

export const CONSENT_SCOPE_LABELS: Record<ConsentScope, string> = {
  DATA: 'Data pribadi',
  PHOTO: 'Foto & dokumentasi',
  ACTIVITY: 'Kegiatan',
};

/** Masa berlaku kode permintaan persetujuan. */
export const CONSENT_CODE_TTL_DAYS = 14;
