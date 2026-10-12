# Rancangan Fase 4 — Ekosistem Digital

> Disusun 12 Okt 2026 (marathon Blok 5). **Rancangan, bukan status** — belum ada kode Fase 4.
> Sumber niat: `docs/product/rancangan-v5.md` §Fase 4, §17 (PWA), §25 (Notifikasi).
> Batas keras dari marathon: **PWA luring tidak boleh menyimpan data anggota**, **notifikasi dorong tanpa isi sensitif**,
> **obrolan (chat) ditunda**.

## 0. Prasyarat

| Prasyarat | Mengapa | Status |
|---|---|---|
| Migrasi Next 16 (P1-6) | Service worker, caching, dan `proxy.ts` berubah di 15/16; membangun PWA di Next 14 berarti mengerjakan dua kali | Menunggu keputusan (`docs/operations/keputusan-next-16.md`) |
| Notifikasi dalam portal (2.1) | Push hanya saluran tambahan dari notifikasi yang sudah ada | Ada |
| Aset nyata (lambang, ikon) | Ikon PWA & sertifikat butuh lambang resmi | Belum (`docs/design/asset-brief.md`) |
| Reverse proxy + HTTPS produksi | Service worker & Web Push wajib HTTPS | Belum diverifikasi |

## 1. PWA luring terbatas

**Tujuan**: situs publik tetap terbuka saat sinyal buruk di lapangan; portal tetap aman.

**Aturan cache (wajib, diuji otomatis):**

| Boleh disimpan di perangkat | Tidak pernah |
|---|---|
| Aset build (`/_next/static/*`), font, ikon, ilustrasi | Respons apa pun dari `/dashboard/*`, `/masuk*`, `/api/*`, `/media/*` |
| Halaman publik tertentu (beranda, agenda, kontak, tentang) dengan versi cache yang jelas | Payload RSC portal (`?_rsc=` di rute portal), unduhan CSV/XLSX |
| Halaman luring (`/luring`) statis | Respons ber-`Cache-Control: private` atau `no-store` |
| Draf formulir **publik** tanpa data pribadi (tidak ada) | Draf formulir yang memuat data anak/wali, termasuk di `localStorage` |

- Service worker **dipasang tanpa paksaan** (tanpa banner yang menghalangi), nonce-CSP tetap utuh (berkas SW
  dari origin sendiri, `script-src 'self'`).
- **Keluar** dan sesi kedaluwarsa → `caches.delete` untuk cache portal (pertahanan berlapis, meski portal tidak di-cache).
- **Mode lapangan presensi luring ditunda**: tanpa menyimpan daftar anggota di perangkat, presensi luring tidak mungkin.
  Bila kelak dibutuhkan, itu **keputusan risiko** (data anak di perangkat pembina) yang memerlukan: enkripsi di
  perangkat, penghapusan otomatis ≤ 24 jam, persetujuan Kwarcab, dan pembaruan `/kebijakan-privasi`.
  Alternatif sekarang: UI presensi 2.2 sudah ringan dan berjalan tanpa JavaScript.

**Uji penerimaan**: skrip e2e memeriksa `CacheStorage` setelah membuka portal → nol entri portal; audit Lighthouse PWA;
uji luring halaman publik.

## 2. Notifikasi dorong (Web Push)

**Tujuan**: pengurus tahu ada hal mendesak (permintaan akses, persetujuan wali) tanpa membuka portal terus-menerus.

- **Isi push generik**: judul "Rumah Pramuka: ada pemberitahuan baru", isi kosong atau jenisnya saja ("Permintaan
  akses"), tautan ke `/dashboard/notifikasi`. **Tidak pernah** nama anak/wali, pilihan persetujuan, alasan mutasi,
  username, atau kode. Rincian dibaca setelah masuk, lewat halaman yang menegakkan izinnya sendiri.
- Penyedia: **Web Push standar (VAPID) dari server sendiri** dulu (tanpa SDK pihak ketiga di klien); FCM hanya bila
  dibutuhkan untuk perangkat tertentu, dengan payload yang sama generiknya.
- Data baru: `push_subscriptions` (user, endpoint, kunci, perangkat, dibuat, terakhir dipakai) — endpoint dihapus saat
  keluar, saat akun dinonaktifkan/dianonimkan, dan bila layanan push membalas 404/410. Masuk retensi.
- Preferensi: saluran push per jenis di halaman notifikasi yang sudah ada; **keamanan akun tidak bisa dimatikan**
  (V5 §25); jam tenang 21.00–06.00 WIB kecuali prioritas kritis.
- Peserta (anak) **tidak** menerima push di fase ini.
- Keamanan: kunci privat VAPID di env (bukan repo), endpoint diperlakukan sebagai data pribadi.

## 3. Sertifikat

**Tujuan**: sertifikat kegiatan, KMD, dan penyelesaian SKU yang bisa diverifikasi pihak lain.

- Diterbitkan server sebagai PDF dari templat milik Kwarcab; ditandatangani dengan **kode verifikasi** acak + HMAC
  (bentuk sama dengan kode akses, mudah dibacakan), dicatat di log audit, dapat **dicabut**.
- Halaman publik `/sertifikat/verifikasi`: masukkan kode → **minimal data**: jenis sertifikat, nama kegiatan, tanggal,
  penerbit, status (sah/dicabut). Untuk pemegang **di bawah 18 tahun hanya nama depan** (selaras persetujuan wali); tanpa
  KTA, tanggal lahir, gudep, atau foto.
- Penerbitan untuk anak mensyaratkan persetujuan wali cakupan KEGIATAN (sudah ditegakkan pada pendaftaran kegiatan).
- Tanda tangan/stempel sebagai aset privat (tidak di `public/`), hanya dipakai saat membuat PDF.
- Prasyarat data: presensi (2.2) & SKU/SKK (2.3) sebagai dasar kelulusan.

## 4. Pusat pembelajaran

**Tujuan**: materi KMD untuk pembina dan materi SKU/SKK untuk peserta di satu tempat.

- Materi dikelola lewat CMS dengan alur draf → review → terbit yang sudah ada; video dari host sendiri atau
  pemutar tanpa pelacakan (tanpa embed yang memasang cookie pihak ketiga di halaman anak).
- Materi **publik** boleh di-cache luring (§1). Kemajuan belajar per pengguna disimpan minimal (modul, selesai/belum,
  tanggal) — tidak ada skor perilaku, tanpa analitik pihak ketiga; masuk retensi & anonimisasi.
- Kuis opsional tanpa peringkat publik.

## 5. Obrolan (chat) — ditunda

Tidak dikerjakan di Fase 4 awal. Bila kelak dibuka, urutannya: kanal pengumuman satu arah per gudep/kwarran →
diskusi pembina (dewasa saja) → baru ruang yang melibatkan anak, dengan syarat:
- tidak ada pesan langsung antara orang dewasa dan anak tanpa pembina lain/wali dapat melihat;
- moderasi & pelaporan, retensi pesan, ekspor untuk penyelidikan, penghapusan saat anonimisasi;
- evaluasi dampak perlindungan data (DPIA) dan kebijakan perlindungan anak tertulis lebih dulu.

## 6. Urutan yang disarankan

1. Migrasi Next 16 → 2. PWA publik + halaman luring (§1) → 3. Web Push untuk pengurus (§2) →
4. Sertifikat (§3) → 5. Pusat pembelajaran (§4). Tiap langkah: perbarui `/kebijakan-privasi`,
`authorization-model.md`, `CODEMAP.md`, tambah tes keamanan (IDOR, cache) dan rute a11y.

## 7. Keputusan manusia yang dibutuhkan

- Persetujuan urutan & prasyarat di atas (terutama migrasi Next 16 lebih dulu).
- Apakah presensi luring cukup penting untuk menerima risiko data anak di perangkat (default: **tidak**).
- Templat dan penanda tangan sertifikat resmi; kebijakan pencabutan.
- Sumber materi pembelajaran resmi (Kwarnas/Kwarda) dan hak pakainya.
