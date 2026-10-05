# Tur Rumah Pramuka Indramayu

Dibuat 5 Oktober 2026 dari build produksi lokal (`next build` + `next start`) dengan **data demo fiktif** (`npm run db:seed -- --demo`). Tidak ada data nyata. Foto di album demo adalah ilustrasi buatan, bukan dokumentasi kegiatan.

**Video:** [`tur-rumah-pramuka.mp4`](./tur-rumah-pramuka.mp4) (±5 menit 45 detik, 1280×720, caption berbahasa Indonesia).

Urutan video: situs publik → ponsel → portal pengurus (login, anggota, verifikasi, CMS, galeri, pengumuman, log) → portal peserta.

## Yang dibuktikan oleh tur ini

Skrip tur berisi *assertion*, jadi bagian ini bukan sekadar tampilan:

- Berita dan album yang dibuat lewat CMS **langsung tayang** di situs publik tanpa build ulang (detail, daftar, dan `/galeri` statis).
- Slug yang tidak ada mengembalikan **404 sungguhan**, bukan soft 404.
- Pesan dari formulir kontak publik sampai ke "Pesan masuk" di portal.
- Pengurus memverifikasi anggota → peserta berstatus Aktif dapat mendaftar kegiatan → muncul di Ringkasan.
- Peserta yang membuka `/dashboard/konten` ditolak di server.

## Keterbatasan rekaman

- Petak peta OpenStreetMap diblokir proxy lingkungan rekaman, jadi peta tampil tanpa petak.
- Folder `public/images/` kosong, sehingga banyak slot foto menampilkan keterangan "belum diunggah". Itu kondisi nyata, bukan kesalahan rekaman.
- Pada tangkapan layar portal, sidebar `fixed` dipanjangkan sementara agar tampil utuh di gambar penuh.

## Situs publik (desktop 1280 px)

- [`01-beranda.png`](./screenshots/publik/01-beranda.png)
- [`02-tentang.png`](./screenshots/publik/02-tentang.png)
- [`03-struktur-organisasi.png`](./screenshots/publik/03-struktur-organisasi.png)
- [`04-berita-filter.png`](./screenshots/publik/04-berita-filter.png)
- [`05-berita-detail.png`](./screenshots/publik/05-berita-detail.png)
- [`06-agenda.png`](./screenshots/publik/06-agenda.png)
- [`07-agenda-detail.png`](./screenshots/publik/07-agenda-detail.png)
- [`08-galeri.png`](./screenshots/publik/08-galeri.png)
- [`09-prestasi.png`](./screenshots/publik/09-prestasi.png)
- [`10-dokumen.png`](./screenshots/publik/10-dokumen.png)
- [`11-dokumen-cari.png`](./screenshots/publik/11-dokumen-cari.png)
- [`12-kontak.png`](./screenshots/publik/12-kontak.png)
- [`13-kontak-terkirim.png`](./screenshots/publik/13-kontak-terkirim.png)
- [`14-kebijakan-privasi.png`](./screenshots/publik/14-kebijakan-privasi.png)
- [`15-aksesibilitas.png`](./screenshots/publik/15-aksesibilitas.png)
- [`16-halaman-404.png`](./screenshots/publik/16-halaman-404.png)

## Situs publik (ponsel 390 px)

- [`01-beranda.png`](./screenshots/mobile/01-beranda.png)
- [`02-menu-drawer.png`](./screenshots/mobile/02-menu-drawer.png)
- [`03-berita.png`](./screenshots/mobile/03-berita.png)
- [`04-prestasi.png`](./screenshots/mobile/04-prestasi.png)
- [`05-dokumen.png`](./screenshots/mobile/05-dokumen.png)
- [`06-kontak.png`](./screenshots/mobile/06-kontak.png)
- [`07-masuk.png`](./screenshots/mobile/07-masuk.png)

## Portal pengurus

- [`01-masuk.png`](./screenshots/portal-pengurus/01-masuk.png)
- [`02-masuk-galat.png`](./screenshots/portal-pengurus/02-masuk-galat.png)
- [`03-ringkasan.png`](./screenshots/portal-pengurus/03-ringkasan.png)
- [`04-anggota.png`](./screenshots/portal-pengurus/04-anggota.png)
- [`05-anggota-detail.png`](./screenshots/portal-pengurus/05-anggota-detail.png)
- [`05b-verifikasi-menunggu.png`](./screenshots/portal-pengurus/05b-verifikasi-menunggu.png)
- [`05c-verifikasi-aktif.png`](./screenshots/portal-pengurus/05c-verifikasi-aktif.png)
- [`06-anggota-baru.png`](./screenshots/portal-pengurus/06-anggota-baru.png)
- [`07-anggota-impor.png`](./screenshots/portal-pengurus/07-anggota-impor.png)
- [`08-gudep.png`](./screenshots/portal-pengurus/08-gudep.png)
- [`09-kwarran.png`](./screenshots/portal-pengurus/09-kwarran.png)
- [`10-konten-hub.png`](./screenshots/portal-pengurus/10-konten-hub.png)
- [`11-cms-berita-daftar.png`](./screenshots/portal-pengurus/11-cms-berita-daftar.png)
- [`12-cms-berita-form.png`](./screenshots/portal-pengurus/12-cms-berita-form.png)
- [`13-cms-berita-tersimpan.png`](./screenshots/portal-pengurus/13-cms-berita-tersimpan.png)
- [`14-berita-tayang-publik.png`](./screenshots/portal-pengurus/14-berita-tayang-publik.png)
- [`15-cms-album-form.png`](./screenshots/portal-pengurus/15-cms-album-form.png)
- [`16-cms-album-foto.png`](./screenshots/portal-pengurus/16-cms-album-foto.png)
- [`17-galeri-publik.png`](./screenshots/portal-pengurus/17-galeri-publik.png)
- [`18-galeri-lightbox.png`](./screenshots/portal-pengurus/18-galeri-lightbox.png)
- [`19-cms-agenda-form.png`](./screenshots/portal-pengurus/19-cms-agenda-form.png)
- [`20-cms-dokumen.png`](./screenshots/portal-pengurus/20-cms-dokumen.png)
- [`21-cms-pengurus.png`](./screenshots/portal-pengurus/21-cms-pengurus.png)
- [`22-cms-prestasi.png`](./screenshots/portal-pengurus/22-cms-prestasi.png)
- [`23-pengumuman.png`](./screenshots/portal-pengurus/23-pengumuman.png)
- [`24-pesan-masuk.png`](./screenshots/portal-pengurus/24-pesan-masuk.png)
- [`25-log-aktivitas.png`](./screenshots/portal-pengurus/25-log-aktivitas.png)
- [`26-pengguna.png`](./screenshots/portal-pengurus/26-pengguna.png)

## Portal peserta

- [`01-ringkasan.png`](./screenshots/portal-peserta/01-ringkasan.png)
- [`02-kegiatan.png`](./screenshots/portal-peserta/02-kegiatan.png)
- [`03-kegiatan-terdaftar.png`](./screenshots/portal-peserta/03-kegiatan-terdaftar.png)
- [`04-profil.png`](./screenshots/portal-peserta/04-profil.png)
- [`05-ringkasan-setelah-daftar.png`](./screenshots/portal-peserta/05-ringkasan-setelah-daftar.png)
- [`06-akses-ditolak.png`](./screenshots/portal-peserta/06-akses-ditolak.png)

