import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Kebijakan Privasi | Rumah Pramuka Indramayu',
  description: 'Komitmen pelindungan data pribadi anggota dan peserta didik sesuai UU No. 27 Tahun 2022.',
};

export default function KebijakanPrivasiPage() {
  return (
    <div className="civic-container py-12 max-w-4xl">
      <header className="mb-8 border-b border-neutral-200 pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-2">
          Kebijakan Privasi
        </h1>
        <p className="text-sm text-neutral-500">
          Pembaruan Terakhir: 1 September 2026 • Sesuai Ketentuan UU PDP No. 27 Tahun 2022
        </p>
      </header>

      <div className="prose prose-neutral max-w-none text-neutral-800 leading-relaxed space-y-6 text-sm sm:text-base">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-900 text-sm">
          <strong>Komitmen Kwartir Cabang:</strong> Kwartir Cabang Gerakan Pramuka Indramayu menjunjung tinggi hak privasi seluruh anggota, terutama peserta didik anak di bawah umur, orang tua/wali, serta pembina dan pelatih. Kami membatasi pengumpulan data hanya untuk keperluan pendidikan kepramukaan yang sah dan tertib.
        </div>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 mt-6 mb-3">1. Dasar Hukum & Ruang Lingkup</h2>
          <p>
            Kebijakan ini disusun berdasarkan <strong>Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong> serta Anggaran Dasar dan Anggaran Rumah Tangga (AD/ART) Gerakan Pramuka. Kebijakan ini berlaku bagi seluruh interaksi pada website publik dan sistem pengelolaan keanggotaan Rumah Pramuka Indramayu.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 mt-6 mb-3">2. Klasifikasi & Data yang Dikumpulkan</h2>
          <p>Kami mengelompokkan data yang kami kelola ke dalam 4 kategori ketat:</p>
          <ul className="list-disc pl-5 space-y-2 text-neutral-700">
            <li>
              <strong>Data Publik:</strong> Informasi yang bebas diakses publik tanpa login, seperti berita kegiatan, pengumuman, agenda perkemahan, dan statistik agregat organisasi.
            </li>
            <li>
              <strong>Data Internal Operasional:</strong> Data kepengurusan Gugus Depan, Kwartir Ranting, serta daftar pembina yang hanya dapat diakses staf berwenang.
            </li>
            <li>
              <strong>Data Pribadi Umum:</strong> Nama lengkap, jenis kelamin, pangkalan sekolah, dan tingkatan Pramuka.
            </li>
            <li>
              <strong>Data Pribadi Spesifik / Sangat Sensitif:</strong> Nomor Induk Kependudukan (NIK), nomor Kartu Tanda Anggota (KTA), kontak pribadi wali murid, dan riwayat kesehatan peserta didik di lapangan. Data kategori ini dienkripsi dan memerlukan izin otorisasi tertinggi.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 mt-6 mb-3">3. Perlindungan Khusus Data Anak & Persetujuan Wali</h2>
          <p>
            Sesuai amanat UU PDP, pemrosesan data anggota yang berstatus anak (di bawah usia 18 tahun, seperti jenjang Siaga dan Penggalang) <strong>wajib memperoleh persetujuan tertulis atau persetujuan elektronik terverifikasi dari orang tua atau wali yang sah</strong>.
          </p>
          <p>
            Foto wajah jarak dekat (close-up) anggota anak dilarang dipublikasikan pada halaman publik terbuka tanpa persetujuan eksplisit rilis media dari orang tua/wali. Publikasi web publik hanya menampilkan foto suasana kegiatan umum (wide-shot/landscape) atau foto tokoh dewasa/pembina resmi.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 mt-6 mb-3">4. Masa Retensi & Penghapusan Data</h2>
          <p>
            Data keanggotaan aktif disimpan selama masa aktif peserta didik atau masa bakti pembina. Jika seorang anggota tidak lagi aktif dan tidak memperbarui registrasi ulang selama <strong>5 (lima) tahun berturut-turut</strong>, data operasional akan dialihkan ke arsip statis terproteksi atau dihapus secara aman. Pemilik data berhak mengajukan permohonan penghapusan (*right to erasure*) melalui sekretariat Kwarcab.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 mt-6 mb-3">5. Jejak Audit & Keamanan Sistem</h2>
          <p>
            Setiap aksi melihat, mengubah, atau mengunduh data anggota sensitif dicatat dalam rekaman jejak audit (*audit trail*) yang bersifat *append-only* (tidak dapat diubah atau dihapus). Akses data menerapkan prinsip hak akses minimum (*Principle of Least Privilege*).
          </p>
        </section>

        <section className="pt-6 border-t border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900 mb-3">6. Kontak Pejabat Pelindung Data</h2>
          <p>
            Pertanyaan, klarifikasi, atau permintaan penarikan persetujuan pemrosesan data pribadi dapat diajukan kepada Tim Pelindung Data Pribadi Kwarcab Indramayu melalui:
          </p>
          <p className="font-semibold text-neutral-800">
            Email: privasi@pramukaindramayu.or.id<br />
            Alamat: Gedung Kwarcab Pramuka Indramayu, Simpang Lima, Indramayu.
          </p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-neutral-200 flex justify-between items-center text-sm">
        <Link href="/" className="text-green-700 hover:underline font-medium">
          &larr; Kembali ke Beranda
        </Link>
        <Link href="/aksesibilitas" className="text-neutral-600 hover:text-neutral-900">
          Lihat Pernyataan Aksesibilitas &rarr;
        </Link>
      </div>
    </div>
  );
}
