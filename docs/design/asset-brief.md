# Brief Aset — Rumah Pramuka Indramayu

> Disusun 12 Okt 2026 (marathon 4.1). Daftar aset nyata yang **belum ada** di repositori, spesifikasi teknisnya, dan
> aturan privasi yang mengikatnya. Status konten per halaman: `docs/product/content-inventory.md`.
> Selama aset belum ada, situs tetap jujur: `MediaFrame` (`src/components/ui/MediaFrame.tsx`) menampilkan keadaan
> kosong "Dokumentasi foto belum diunggah" (ikon + teks, rasio tetap agar tidak terjadi CLS), bukan gambar stok.

## 1. Yang menjadi placeholder sekarang

| Berkas | Isi sekarang | Ditandai di |
|---|---|---|
| `public/brand/mark.svg` | Tunas di dalam lingkaran hutan — **bukan lambang resmi** | Komentar SVG baris 2 |
| `public/brand/logo.svg` | Tanda + teks nama situs, warna diselaraskan `make-icons.mjs` | `CODEMAP.md` §public |
| `public/brand/icon-*.png`, `apple-touch-icon.png` | Dibangkitkan dari `mark.svg` | `scripts/make-icons.mjs` |
| `public/images/` | Tidak ada (folder belum dibuat) | `AGENTS.md` §2.9 |
| Foto beranda (`heroImage`) | Kosong → ilustrasi `HeroLandscape` | `/dashboard/pengaturan` |

## 2. Aset yang dibutuhkan

| # | Aset | Spesifikasi | Penyedia → penyetuju | Catatan privasi |
|---|---|---|---|---|
| A1 | **Lambang resmi Kwarcab** (dan izin pemakaiannya) | SVG vektor murni (tanpa raster tertanam), `viewBox` persegi untuk tanda, versi warna penuh + satu warna | Sekretariat Kwarcab → Ketua Kwarcab | — |
| A2 | Logo horizontal (lambang + nama) | SVG, tinggi efektif ≥ 40 px tetap terbaca, kontras ≥ 4,5:1 pada latar terang & gelap | Humas → Kwarcab | — |
| A3 | Gambar pratinjau tautan (Open Graph) | 1200 × 630 px PNG/JPEG ≤ 300 KB, teks di area aman 1000 × 500 | Humas | Tanpa wajah anak |
| A4 | Foto beranda (1–3) | Lanskap, ≥ 2000 px sisi panjang, JPEG/PNG/WebP ≤ 10 MB (otomatis dikecilkan ke ≤ 2000 px WebP, EXIF/GPS dibuang) | Humas → Admin Website | **Wajah anak tidak boleh dapat dikenali**: ambil dari belakang/jauh, siluet, tangan, perlengkapan |
| A5 | Album galeri (≥ 1 per kegiatan besar) | Sama dengan A4; keterangan + teks alt per foto | Pembina/humas → editor (alur review) | Pernyataan "tidak ada wajah anak yang dapat dikenali" wajib di setiap unggahan; tanpa papan nama/nomor rumah |
| A6 | Foto pengurus (`/struktur-organisasi`) | Potret 3:4, ≥ 800 px, latar polos | Pengurus bersangkutan | **Hanya orang dewasa**, dengan persetujuan masing-masing |
| A7 | Dokumen resmi (`/dokumen`) | PDF ≤ 15 MB (teks dapat dicari, bukan hasil pindai saja), nama berkas deskriptif | Sekretariat → Kwarcab | Tanpa data pribadi anggota di dalamnya |
| A8 | Teks resmi SKU/SKK per golongan | Dari Kwarnas, apa adanya | Kwarcab (bidang pembinaan) | **Jangan diketik ulang dengan parafrase**; data demo memakai penanda "Contoh syarat …" |
| A9 | Profil organisasi (sejarah, visi–misi, alamat & jam layanan) | Teks + sumber | Sekretariat | — |

Tri Satya dan Dasa Darma: teks resmi, **tidak boleh diubah atau diparafrase** oleh siapa pun, termasuk saat merapikan tata letak.

## 3. Setelah aset diterima

1. **Lambang**: ganti `public/brand/mark.svg` dan `logo.svg`, hapus komentar placeholder, jalankan
   `node scripts/make-icons.mjs` (ikon PWA + selaras warna), periksa `manifest.json` dan `themeColor` di `src/app/layout.tsx`.
2. **Foto**: unggah lewat portal (`/dashboard/konten/galeri`, `/dashboard/pengaturan`), **jangan** menaruh foto anggota
   di `public/` — unggahan portal melewati validasi isi berkas, pengecilan, dan pembuangan metadata lokasi
   (`saveImage` di `src/lib/storage.ts`). Foto di `public/images/` hanya untuk aset tanpa orang (lanskap, gedung).
3. **Dokumen**: unggah lewat `/dashboard/konten/dokumen` (validasi magic bytes + ekstensi).
4. Jalankan `npm run build`, `npm run a11y` (kontras, teks alt), lalu periksa tampilan 390 px.

## 4. Yang tidak dibutuhkan

- Foto stok, ilustrasi berwajah manusia, ikon emoji — bertentangan dengan design system ("Hutan & Lapangan").
- Ilustrasi tambahan: lanskap & motif berasal dari `src/components/illustrations` (SVG ber-seed, `aria-hidden`).
