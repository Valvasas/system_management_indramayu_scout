# Keputusan: Multibahasa (Indonesia / English / Basa Sunda)

> Disusun 12 Okt 2026 (marathon 4.2). **Rekomendasi saja — tidak ada kode yang diubah.** Keputusan akhir ada di
> pengurus Kwarcab karena biaya terbesarnya adalah penerjemah dan peninjau, bukan teknis.

## 1. Kondisi

- Rancangan V5 §12 meminta situs publik dalam **id/en/su** dengan URL `/id`, `/en`, `/su`, terjemahan ditinjau manusia
  (bukan mesin), dan penanda jujur bila terjemahan belum ada. Konten administratif/legal tetap bersumber Bahasa Indonesia.
- Implementasi lama (`LanguageProvider`, `translations.ts`, selektor bahasa) dihapus pada 19 Sep 2026 (TASKS P2-8):
  selektornya tidak tersambung, dan hanya judul yang diterjemahkan, sehingga klaim tiga bahasa tidak pernah benar.
- Sekarang: Bahasa Indonesia saja, `<html lang="id">` statis, 101 halaman pra-render, CMS satu bahasa.

## 2. Pilihan

| | A. Indonesia saja (sekarang) | B. Halaman kunci statis en/su | C. i18n penuh `[locale]` | D. Terjemahan mesin otomatis |
|---|---|---|---|---|
| Cakupan | — | Beranda ringkas, Tentang, Kontak, Struktur, Kebijakan privasi (ringkasan), Aksesibilitas | Seluruh situs publik + CMS per bahasa | Seluruh situs |
| Perubahan kode | Nol | Rute `/en/*`, `/su/*` statis + `hreflang` + pilihan bahasa di Header/Footer | Segmen `[locale]` untuk semua rute publik, skema terjemahan untuk 6 jenis konten (berita, agenda, galeri, dokumen, pengurus, prestasi), alur review per bahasa, sitemap per bahasa | Kecil |
| Biaya build/cache | Tetap | +±12 halaman | ±3× halaman pra-render & entri ISR; `revalidatePublicSite()` membangun ulang ketiganya | Tetap |
| Beban redaksi | Tetap | Terjemahan sekali + revisi jarang | Setiap berita/agenda × 2 bahasa, ditinjau sebelum terbit | Nol, tapi melanggar V5 |
| Risiko | Pengunjung non-Indonesia/Sunda kurang terlayani | Isi en/su tertinggal dari versi id | Konten setengah diterjemahkan; antrean review macet; regresi SEO | **Ditolak**: V5 melarang terjemahan mesin tanpa review; istilah kepramukaan & Tri Satya/Dasa Darma bisa rusak |

Catatan teknis untuk C: middleware sekarang berjalan di semua rute (membuang header CSP kiriman klien), sehingga deteksi
bahasa di middleware tidak menambah titik baru — tetapi pengalihan otomatis berdasarkan `Accept-Language` tidak
dianjurkan (merusak tautan bersama & cache). Portal (`/dashboard`) tetap Bahasa Indonesia di semua pilihan.

## 3. Rekomendasi

1. **Sekarang: tetap A.** Jangan menambah rute `[locale]` sebelum migrasi Next 16 (`docs/operations/keputusan-next-16.md`):
   C menyentuh semua rute publik, sehingga dikerjakan dua kali bila dilakukan di Next 14.
2. **Setelah ada peninjau tetap** (minimal 1 orang untuk English dan 1 untuk Basa Sunda yang bersedia meninjau perubahan):
   kerjakan **B** sebagai langkah jujur pertama — halaman kunci yang jarang berubah, lengkap dengan `hreflang`,
   `lang` per halaman, dan penanda "Halaman ini tersedia dalam Bahasa Indonesia" untuk tautan ke halaman yang belum
   diterjemahkan. Tri Satya & Dasa Darma tidak diterjemahkan kecuali ada terjemahan resmi Kwarnas.
3. **C** hanya bila data kunjungan (setelah B berjalan ±6 bulan) menunjukkan kebutuhan, dan redaksi sanggup
   menerjemahkan berita/agenda rutin. Saat itu tambahkan skema terjemahan lewat `src/db/schema.ts` + `db:generate`,
   dan perbarui `/kebijakan-privasi` bila ada data baru yang disimpan.

## 4. Yang perlu diputuskan manusia

- Apakah Kwarcab punya penerjemah/peninjau tetap untuk English dan Basa Sunda (siapa, berapa jam per bulan)?
- Halaman mana yang paling dibutuhkan pengunjung luar daerah (untuk B)?
- Apakah ada terjemahan resmi Kwarnas untuk teks janji/kode kehormatan yang boleh dipakai?
