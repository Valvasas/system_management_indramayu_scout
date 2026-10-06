# Prompt Marathon Perbaikan — Rumah Pramuka Indramayu

> Salin seluruh blok di bawah garis ini sebagai prompt tunggal ke AI agent.
> Disusun 6 Okt 2026 dari audit `TASKS.md` + `CODEMAP.md` + `docs/product/rancangan-v5.md`.

---

## PERAN

Kamu adalah engineer full-stack senior yang menjalankan **marathon perbaikan** pada proyek Rumah Pramuka Indramayu (Next.js 14, Drizzle, PGlite/PostgreSQL, Tailwind, Vitest, Playwright). Kerjakan berurutan, mandiri, dan jujur melaporkan hasil. Jangan berhenti untuk bertanya kecuali menabrak **Titik Henti** di bagian akhir.

## ATURAN DASAR (wajib, tanpa pengecualian)

1. Baca `AGENTS.md` lalu `CODEMAP.md` dulu. Jangan menyapu seluruh codebase. Grep sebelum Read. Jangan buka `node_modules/`, `.next/`, `package-lock.json`.
2. **Jangan jalankan atau baca** `generate_pages.js` / `create_components.js` (kecuali untuk menghapusnya di Blok 0).
3. Patuhi seluruh Invarian `AGENTS.md` §5: nol emoji (pakai `lucide-react`), nol warna/spacing hardcode (token CSS), satu tombol `primary` per konteks, target sentuh ≥ 44px, `focus-visible`, status = ikon + teks, izin dicek di server, semua input divalidasi Zod di server, `cn()` bukan `twMerge` mentah, impor via `@/`, Server Component secara default.
4. Penulisan konten publik wajib memanggil `revalidatePublicSite()`. Rute dinamis publik wajib `dynamicParams = true` + `notFound()`.
5. Pembina tidak pernah melihat sandi anggota. Jangan kembalikan pola "sandi sementara".
6. Teks Tri Satya / Dasa Darma jangan diubah. Data demo fiktif. Nol foto wajah anak di halaman publik. Nol rahasia di kode atau file contoh.
7. Setiap perubahan skema data atau kontrol akses → perbarui `/kebijakan-privasi` (tiap klaim harus bisa ditunjuk implementasinya; yang belum ada tetap di "Yang belum berlaku") dan `docs/security/authorization-model.md`.
8. Ubah seminimal mungkin, ikuti gaya sekitar. Perubahan skema: edit `src/db/schema.ts` → `npm run db:generate` (jangan edit SQL migrasi manual).
9. Perbarui `CODEMAP.md` setiap menambah, menghapus, atau memindahkan file.
10. Jangan pernah melewati, menonaktifkan, atau mengarantina tes agar hijau. Kegagalan nyata dilaporkan apa adanya.

## GERBANG KUALITAS (jalankan di akhir tiap blok)

```bash
npm run typecheck && npm run lint && npm test
npm run db:seed -- --demo && ALLOW_PGLITE=1 npm run build
npm run start   # terminal lain
npm run a11y    # harus nol pelanggaran (tambah rute baru ke daftar pemindaian)
npm run e2e     # jalankan pada data demo SEGAR (db:seed ulang)
```

Blok dianggap selesai hanya bila semua gerbang di atas hijau. Setiap fitur baru wajib membawa tes (Vitest untuk logika/izin/validasi; langkah e2e untuk alur kritis). Setelah tiap blok: **commit sendiri** dengan pesan deskriptif (satu commit per blok atau lebih kecil), lalu lanjut. Push ke branch kerja yang ditentukan; jangan buat PR kecuali diminta.

## LAPORAN

Setelah tiap blok, tulis ke `TASKS.md` bagian "Status Eksekusi" (ringkas, satu tabel baris per task: status, catatan, hasil gerbang). Di akhir marathon, **pangkas `TASKS.md`** menjadi satu sumber kebenaran (hapus "Antrean lama" dan "Belum dikerjakan (usang)").

---

## BLOK 0 — Kebersihan & Fondasi (mulai di sini)

**0.1 Hapus generator usang.** Hapus `generate_pages.js` dan `create_components.js` dari repo; bersihkan referensinya di `AGENTS.md`, `CODEMAP.md`, `README.md`, `TASKS.md`. Selesai bila `Grep "generate_pages|create_components"` hanya tersisa di catatan riwayat.

**0.2 Validasi env Zod (P1-2).** Buat `src/lib/env.ts`: skema Zod untuk semua variabel di `.env.example` (`DATABASE_URL`, rahasia sesi, `CONTACT_WEBHOOK_URL`, dll.), dibaca sekali, gagal-cepat saat produksi bila wajib tidak ada, dan mengizinkan PGlite saat `ALLOW_PGLITE=1`/dev. Ganti semua `process.env.*` langsung di `src/` dengan impor dari `env.ts`. Tes: env tidak valid → galat jelas tanpa membocorkan nilai. Selesai bila `Grep "process.env" src` hanya di `env.ts` (dan konfigurasi Next yang memang butuh).

**0.3 Prettier + Husky + lint-staged (P6-1).** Pasang, konfigurasi selaras gaya kode yang ada (jangan memformat ulang seluruh repo dalam commit bercampur: lakukan satu commit format murni terpisah). Tambahkan `npm run format:check` ke CI.

**0.4 Jalankan CI (P6-3).** Tinjau `.github/workflows/ci.yml` terhadap perbedaan environment GitHub (PGlite, Playwright browser, seed, urutan langkah, cache). Perbaiki hal yang pasti gagal di runner bersih. Tambahkan langkah `e2e` bila belum ada dan `format:check`. Kamu tidak bisa memicu Actions dari sini: catat di laporan bahwa verifikasi di GitHub masih menunggu push.

**0.5 CSP enforce (P1-1).** Audit pelanggaran CSP di build produksi (Leaflet, font, gambar, inline script Next). Bila bersih, naikkan dari Report-Only ke enforce; bila ada pelanggaran yang tak bisa dihilangkan tanpa `unsafe-*`, gunakan nonce/hash, jangan melonggarkan sembarangan. Tambahkan tes yang memastikan header ada.

## BLOK 1 — Keamanan Infrastruktur

**1.1 Rate limit bersama (DB-backed).** Ganti penyimpan in-memory (login, kode akses, kontak) dengan abstraksi `RateLimitStore` berimplementasi tabel Postgres (kunci, hitungan, jendela waktu, indeks, pembersihan kedaluwarsa), tanpa menambah dependensi Redis. Antarmuka lama dipertahankan. Tes: batas tercapai, jendela reset, dua "instance" berbagi hitungan, kegagalan DB → fail-closed untuk login/kode akses.

**1.2 MFA TOTP untuk pengurus.** Untuk peran dengan izin `users.manage`, `content.manage`, `audit.view` dan Super Admin: pendaftaran TOTP (QR + kode pemulihan sekali pakai, hash), verifikasi saat login, wajib bagi peran tersebut dengan masa tenggang yang dapat diatur, reset oleh Super Admin tercatat di audit log. Rahasia TOTP dienkripsi (lihat 1.3). Peserta/anggota tidak diwajibkan. Tes keamanan: brute-force dibatasi, kode dipakai ulang ditolak, eskalasi hak tidak mungkin.

**1.3 Enkripsi kolom sensitif.** Enkripsi level aplikasi (AES-256-GCM, kunci dari env via `env.ts`, dukung rotasi dengan `keyId`) untuk kolom sensitif anggota (kontak, alamat, data wali) dan rahasia TOTP. Migrasi data bertahap yang idempoten + skrip `db:encrypt-backfill`. Pencarian pada kolom terenkripsi tidak boleh bocor: gunakan blind index bila perlu. Perbarui seed, ekspor CSV (tetap hanya data yang diizinkan), dan tes.

**1.4 Retensi & penghapusan data.** Kebijakan retensi terkonfigurasi (mis. kode akses kedaluwarsa, sesi, pesan kontak, log ≥ N bulan) dengan skrip terjadwal `db:retention` + dokumentasi cara menjadwalkan (cron/Actions). Hak subjek data: alur anonimisasi anggota nonaktif yang menjaga integritas riwayat. Tes.

**1.5 Persetujuan wali terverifikasi.** Ganti "tanggal manual" dengan alur: pembina mengajukan → wali menerima tautan/kode sekali pakai (tanpa email wajib: sesuai prinsip V5 §10) → wali menyetujui per jenis (data, foto, kegiatan) → tercatat (waktu, versi teks persetujuan, metode verifikasi). Pencabutan persetujuan. Pusat persetujuan di dasbor: `/dashboard/persetujuan`. Tambah menu di `nav.ts` **dan** `page.tsx`-nya.

**1.6 Log audit tahan-ubah.** Hash-chain pada `audit_logs` (hash entri sebelumnya) + izin DB `INSERT`-only untuk user aplikasi (`docker/db-init/`) + halaman verifikasi integritas bagi Super Admin. Tes: modifikasi entri terdeteksi.

**1.7 Monitoring.** Integrasi Sentry opsional (aktif hanya bila DSN di env; scrub data pribadi), endpoint `/api/health` (cek DB), dokumen `docs/operations/monitoring.md` (uptime, alert). Backup: skrip `db:backup` + prosedur uji restore terdokumentasi; Super Admin dapat memicu backup manual dan melihat status backup terakhir (V5 §20).

> Setelah Blok 1: perbarui `/kebijakan-privasi` (pindahkan yang sudah berlaku dari "Yang belum berlaku"), jalankan gerbang penuh, commit.

## BLOK 2 — Fitur Operasional (Fase 3 V5)

**2.1 Notifikasi dalam portal.** Tabel `notifications` (penerima, jenis, prioritas rendah/normal/tinggi, judul, isi ringkas tanpa data sensitif, tautan, `readAt`, `createdAt`) + preferensi per pengguna. Pemicu: pengumuman baru, berita dikembalikan/diterbitkan (review), mutasi diajukan/diputuskan, permintaan akses, persetujuan wali, pendaftaran kegiatan. Lonceng di shell portal (Server Component + client kecil), halaman `/dashboard/notifikasi` (juga untuk peserta di portal peserta), tandai dibaca, jumlah belum-dibaca sebagai lencana ikon + angka (bukan warna saja), `aria-live` sopan. Penerima ditentukan di server memakai scope. Tes: pengguna tidak bisa membaca notifikasi orang lain.

**2.2 Presensi kegiatan.** Skema `event_attendance` (acara, anggota, status hadir/izin/alpa, dicatat oleh, waktu). UI di `/dashboard/pendaftaran/[acara]` untuk mencatat per pendaftar (mobile-first, target sentuh besar), rekap, ekspor CSV. Peserta melihat riwayat kehadirannya di portal peserta. Izin baru di `permissions.ts` dan dokumen otorisasi. Tes izin dan cakupan gudep/kwarran.

**2.3 SKU/SKK digital.** Skema untuk daftar syarat per golongan (data referensi, bukan menyalin teks resmi; **jangan memparafrase Tri Satya/Dasa Darma**; syarat diisi sebagai data yang dikelola admin), progres per anggota, verifikasi oleh pembina/pembimbing, tanggal & pemverifikasi. Tampilan progres di detail anggota dan portal peserta. Ekspor. Tes.

**2.4 Masa jabatan pengurus.** Tambah `termStart`/`termEnd`/`isActive` pada `board_members` dan penugasan pembina/staf; halaman struktur publik menampilkan hanya yang aktif; riwayat periode di dasbor; peringatan jabatan hampir berakhir lewat notifikasi (2.1). Migrasi data lama dengan default aman. Tes.

**2.5 Laporan & ekspor Excel.** Pasang pustaka XLSX yang terawat (`exceljs`; audit lisensi dan celah dulu), ekspor `.xlsx` selain CSV untuk anggota, gudep, pendaftar, presensi, dengan escape sel yang mencegah formula injection (`= + - @`). Halaman `/dashboard/laporan`: rekap jumlah anggota per golongan/gudep/kwarran, status verifikasi, mutasi periode tertentu, kegiatan. Hanya data dalam scope pengguna. Tes untuk formula injection dan scope.

**2.6 Pengelolaan dokumen internal.** Dokumen non-publik (SK, surat, formulir) dengan visibilitas per peran/scope, unggah tervalidasi (tipe, ukuran, nama aman, `isSafeDocumentUrl`, pindai tipe MIME sebenarnya), versi, dan log unduhan. Terpisah dari dokumen publik. Tes unggahan berbahaya (ekstensi ganda, MIME palsu, path traversal).

**2.7 Peta internal + PostGIS.** Aktifkan PostGIS di `docker-compose.yml` (sudah ada image) dengan kolom geometri lokasi gudep, pencarian terdekat, peta internal di dasbor (Leaflet, `ssr:false`, CSP tetap lulus) dengan lapisan per kwarran/golongan. Fallback bila PostGIS tak tersedia (PGlite): tetap berfungsi dengan lat/lng biasa. Dokumentasikan atribusi OSM. Tes.

> Setelah Blok 2: perbarui `nav.ts` (setiap `href` punya `page.tsx`), `authorization-model.md`, `/kebijakan-privasi`, `CODEMAP.md`, tambah rute baru ke `npm run a11y`, perluas e2e (minimal: notifikasi, presensi, ekspor).

## BLOK 3 — Kualitas & Pengujian

**3.1 Tes komponen** (Testing Library + Vitest/jsdom) untuk primitive `components/ui` (Button, Field, Badge, FilterChips, EmptyState) dan komponen interaktif kritis (Header drawer: Escape & fokus kembali, PhotoGallery lightbox: focus trap).

**3.2 Cakupan ≥ 70%** pada `src/lib`, `src/features` (laporkan angka nyata; jangan menulis tes kosong demi angka; tes harus bisa gagal: lakukan uji mutasi singkat pada logika izin dan keamanan).

**3.3 Lighthouse CI** (performa ≥ 90, a11y ≥ 95, SEO ≥ 95 pada beranda, berita, agenda) sebagai langkah CI non-blokir pertama, lalu blokir setelah stabil.

**3.4 Skenario keamanan wajib (V5 §26)**: IDOR antar gudep/kwarran, eskalasi hak, mass assignment, unggahan berbahaya, XSS pada konten CMS (sanitasi), CSRF Server Action, enumerasi akun saat login/lupa sandi. Tulis sebagai tes terpisah `tests/security/`.

## BLOK 4 — Konten, Brand, Dokumentasi

**4.1 Aset & lambang.** Jangan mengarang lambang resmi Kwarcab atau memakai foto stok/wajah anak. Siapkan: struktur `public/images/` + panduan `docs/design/asset-brief.md` (daftar aset yang dibutuhkan, rasio, ukuran, aturan privasi foto, format penamaan), dan pastikan `MediaFrame` menampilkan empty state bermakna sampai aset ada. Tandai jelas `mark.svg` sebagai placeholder di dokumen.

**4.2 Keputusan multibahasa.** Tulis `docs/product/keputusan-multibahasa.md`: bandingkan P2-8 (hanya Indonesia) vs V5 (ID/EN/SU): biaya, risiko terjemahan teks resmi, beban editor, SEO (`hreflang`). Beri rekomendasi (bukan implementasi), tandai sebagai menunggu keputusan pemilik.

**4.3 Sisir `AI_CONTEXT.MD` (P6-4).** Hapus klaim yang tak punya implementasi, tandai niat vs status, arahkan ke kode + `CODEMAP.md`.

**4.4 Pangkas `TASKS.md`** menjadi satu sumber kebenaran (status ringkas + antrean tunggal), perbarui `AGENTS.md` §2 (angka tes/halaman/pemindaian terbaru) dan `CODEMAP.md`.

## BLOK 5 — Phase 4 (hanya persiapan, jangan implementasi penuh)

Tulis `docs/product/fase-4-rancangan.md` ringkas: PWA offline terbatas (apa yang di-cache, apa yang tidak: data anggota **tidak** boleh di-cache offline), push notification (model izin, tanpa konten sensitif), sertifikat (generator PDF, verifikasi publik via kode, tanpa data anak berlebih), pusat belajar. Chat tetap ditunda. Hanya dokumen; tanpa kode.

---

## TITIK HENTI (berhenti dan laporkan, jangan menebak)

1. **Migrasi Next 14 → 16 (P1-6): JANGAN dikerjakan.** Hanya tulis `docs/operations/keputusan-next-16.md`: daftar celah dari `npm audit --omit=dev`, mana yang terjangkau dari kode kita (analisis nyata, bukan salin output), perkiraan perubahan mayor (App Router, caching, `params` async, dll.), risiko ke e2e/a11y, rencana langkah, dan rekomendasi. Pemilik yang memutuskan.
2. Perubahan yang menghapus data produksi atau melonggarkan kontrol akses.
3. Gerbang kualitas yang gagal dua kali berturut-turut dengan akar masalah yang tak bisa kamu temukan: berhenti, laporkan output lengkap.
4. Kebutuhan kredensial/rahasia/layanan eksternal yang tidak ada: buat integrasi opsional berbasis env dan lanjutkan.
5. Anggaran konteks: bila membangun konteks satu task melewati ~15.000 token, kamu mencari di tempat yang salah. Berhenti, baca ulang `CODEMAP.md`.

## FORMAT LAPORAN AKHIR

Per blok: apa yang selesai, apa yang sebagian (dan kenapa), keputusan teknis + alasannya, hasil tiap gerbang (angka nyata: jumlah tes, halaman, pemindaian a11y, e2e), risiko tersisa, dan daftar yang butuh keputusan manusia. Jujur: "belum diverifikasi di GitHub Actions" tetap ditulis bila memang begitu.
