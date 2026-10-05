# Tur Rumah Pramuka Indramayu

Dibuat ulang 5 Oktober 2026 (design system "Hutan & Lapangan") dari build produksi lokal (`next build` + `next start`) dengan **data demo fiktif** (`npm run db:seed -- --demo`). Tidak ada data nyata.

**Video:** [`tur-rumah-pramuka.mp4`](./tur-rumah-pramuka.mp4) (±5 menit 30 detik, 1280×720, caption berbahasa Indonesia; segmen ponsel di tengah bingkai).

Urutan video: situs publik (desktop) → ponsel (publik + portal) → portal pengurus → kontributor gudep → portal peserta.

## Yang dibuktikan oleh tur ini

Skrip tur berisi *assertion* status HTTP di setiap halaman:

- Semua halaman publik baru (`/golongan`, `/bergabung`, `/wilayah`, `/cari`) dan detailnya menjawab 200; halaman asing 404 sungguhan.
- Peserta yang membuka menu staf (`/dashboard/akses`) ditolak di server (404).
- Alur yang **mengubah data** (lupa sandi → kode akses, mutasi, review berita, CSV pendaftar) diuji terpisah lewat `npm run e2e`, bukan di tur ini.

## Keterbatasan rekaman

- Petak peta OpenStreetMap diblokir proxy lingkungan rekaman, jadi peta tampil tanpa petak.
- Folder `public/images/` kosong, jadi slot foto menampilkan keterangan "belum diunggah". Itu kondisi nyata.
- Logo `brand/mark.svg` masih placeholder, belum lambang resmi Kwarcab.
- Pada tangkapan ponsel (DPR 2) jarak huruf "t" kadang tampak renggang. Kemungkinan artefak render Chromium headless; periksa di perangkat nyata sebelum disimpulkan sebagai bug font.

## Situs publik (desktop 1280 px)

- [`01-beranda.png`](./screenshots/publik/01-beranda.png)
- [`02-golongan.png`](./screenshots/publik/02-golongan.png)
- [`03-golongan-penggalang.png`](./screenshots/publik/03-golongan-penggalang.png)
- [`04-bergabung.png`](./screenshots/publik/04-bergabung.png)
- [`05-wilayah.png`](./screenshots/publik/05-wilayah.png)
- [`06-cari-kwarran.png`](./screenshots/publik/06-cari-kwarran.png)
- [`07-wilayah-detail.png`](./screenshots/publik/07-wilayah-detail.png)
- [`08-cari.png`](./screenshots/publik/08-cari.png)
- [`09-berita.png`](./screenshots/publik/09-berita.png)
- [`10-berita-detail.png`](./screenshots/publik/10-berita-detail.png)
- [`11-agenda.png`](./screenshots/publik/11-agenda.png)
- [`12-galeri.png`](./screenshots/publik/12-galeri.png)
- [`13-tentang.png`](./screenshots/publik/13-tentang.png)
- [`14-kontak.png`](./screenshots/publik/14-kontak.png)
- [`15-masuk.png`](./screenshots/publik/15-masuk.png)
- [`16-lupa-sandi.png`](./screenshots/publik/16-lupa-sandi.png)
- [`17-404.png`](./screenshots/publik/17-404.png)

## Ponsel (390 px)

- [`01-beranda.png`](./screenshots/mobile/01-beranda.png)
- [`02-menu.png`](./screenshots/mobile/02-menu.png)
- [`03-golongan.png`](./screenshots/mobile/03-golongan.png)
- [`04-bergabung.png`](./screenshots/mobile/04-bergabung.png)
- [`05-agenda.png`](./screenshots/mobile/05-agenda.png)
- [`06-portal-ponsel.png`](./screenshots/mobile/06-portal-ponsel.png)
- [`07-portal-menu.png`](./screenshots/mobile/07-portal-menu.png)

## Portal pengurus & kontributor

- [`01-ringkasan.png`](./screenshots/portal-pengurus/01-ringkasan.png)
- [`02-akses.png`](./screenshots/portal-pengurus/02-akses.png)
- [`03-mutasi.png`](./screenshots/portal-pengurus/03-mutasi.png)
- [`04-pendaftaran.png`](./screenshots/portal-pengurus/04-pendaftaran.png)
- [`05-konten-berita.png`](./screenshots/portal-pengurus/05-konten-berita.png)
- [`06-anggota.png`](./screenshots/portal-pengurus/06-anggota.png)
- [`07-kontribusi.png`](./screenshots/portal-pengurus/07-kontribusi.png)

## Portal peserta

- [`01-ringkasan.png`](./screenshots/portal-peserta/01-ringkasan.png)
- [`02-kegiatan.png`](./screenshots/portal-peserta/02-kegiatan.png)
- [`03-profil.png`](./screenshots/portal-peserta/03-profil.png)
- [`04-akses-ditolak.png`](./screenshots/portal-peserta/04-akses-ditolak.png)
