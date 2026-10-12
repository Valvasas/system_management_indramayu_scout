# AI_CONTEXT.MD — Rumah Pramuka Indramayu

> **Dokumen niat, bukan status.** Isinya: untuk siapa produk ini, masalah apa yang diselesaikan, dan prinsip yang
> tidak boleh dilanggar. Kebenaran tentang kode ada di tempat lain:
>
> | Butuh | Baca |
> |---|---|
> | Aturan kerja, invarian, perintah | `AGENTS.md` |
> | Letak file, rute, status `ADA`/`HILANG` | `CODEMAP.md` |
> | Apa yang sudah/belum dikerjakan + angka gerbang | `TASKS.md` §Status Eksekusi |
> | Desain visual | `docs/design/design-system.md` |
> | Izin per peran | `docs/security/authorization-model.md` (dibangkitkan dari kode) |
>
> Ditulis ulang 12 Okt 2026. Versi sebelumnya menyebut Prisma, data tiruan (`mock-data.ts`), pnpm, font Inter/DM Sans,
> dan "basis data belum terkoneksi" — semuanya sudah tidak benar. Rancangan sumber: `docs/product/rancangan-v5.md`.

---

## 1. Produk

**Rumah Pramuka Indramayu** — portal resmi dan sistem informasi Kwartir Cabang (Kwarcab) Gerakan Pramuka Indramayu:
situs publik untuk masyarakat, dan portal untuk pengurus Kwarcab, 31 Kwartir Ranting (Kwarran), ±1.200 Gugus Depan
(Gudep), serta peserta didik (Penggalang, Penegak, Pandega).

**Masalah yang diselesaikan**

- Data anggota tercecer di banyak berkas, ganda, dan tidak sinkron; riwayat mutasi hilang.
- Pencarian dan verifikasi data lambat; tidak ada kanal resmi terpusat.
- Data peserta didik di bawah umur rentan bocor — **privasi anak adalah syarat, bukan fitur** (UU PDP No. 27/2022).

**Pengguna**: masyarakat umum, orang tua/wali, peserta didik, pembina/pelatih, staf Gudep/Kwarran/Kwarcab, admin
website, Super Admin. Peran sistem dan cakupannya: lihat `authorization-model.md`.

**Fase (niat jangka panjang)**

| Fase | Fokus |
|---|---|
| 1 | Situs publik informatif, SEO, PWA, Bahasa Indonesia |
| 2 | Fondasi internal: autentikasi tanpa email, RBAC bercakupan, data anggota, persetujuan wali |
| 3 | Operasional: Gudep/Kwarran, kegiatan, mutasi, presensi, SKU/SKK, laporan |
| 4 | Ekosistem: PWA luring tanpa data anggota, notifikasi dorong, sertifikat, pusat belajar — `docs/product/fase-4-rancangan.md` |

## 2. Prinsip desain

*"Sistem kewargaan yang tenang, berkarakter kepanduan"* — institusi publik yang hangat, bukan startup SaaS.
Design system **"Hutan & Lapangan"**: hijau hutan sebagai warna merek dan aksi utama, palet hangat, judul **Fraunces**
(`font-semibold`), teks UI **Plus Jakarta Sans**, ilustrasi SVG lanskap dari `components/illustrations` sebagai
kekayaan visual. Rincian dan alasannya: `docs/design/design-system.md`.

**Dilarang** (pelanggaran = PR ditolak; daftar lengkap di `AGENTS.md` §5):

- Emoji sebagai elemen UI — pakai ikon `lucide-react` (`aria-hidden`) + teks.
- Nilai warna/spacing/shadow/radius literal — selalu token CSS → kelas Tailwind.
- Lebih dari satu tombol `primary` per konteks visual.
- Gradien dekoratif, glassmorphism, kartu di setiap blok, carousel otomatis, video bersuara otomatis.
- Status yang hanya dibedakan warna — wajib ikon + teks.
- Teks di atas hutan/gunung ilustrasi (hanya di atas langit atau pil putih).
- **Foto wajah anak di bawah umur yang dapat dikenali di halaman publik** — juga bila wali menyetujui foto
  dokumentasi (persetujuan itu hanya untuk arsip internal).

**Aksesibilitas**: target WCAG 2.2 AA — target sentuh ≥ 44 px, `focus-visible` terlihat, `prefers-reduced-motion`,
satu `h1` per halaman tanpa lompatan heading, landmark semantik, `lang="id"`. Diukur otomatis oleh `npm run a11y`.

## 3. Prinsip keamanan & privasi

- **Izin dicek di server** pada setiap halaman, aksi, dan route handler, beserta cakupan baris (gudep/kwarran).
  Menyembunyikan tombol bukan kontrol keamanan. Di luar cakupan = "tidak ditemukan".
- **Semua masukan divalidasi Zod di server**, apa pun yang sudah divalidasi klien.
- **Pembina tidak pernah tahu sandi anggota** — akun baru & reset memakai kode akses sekali pakai.
- **Persetujuan wali hanya dari wali** lewat kode sekali pakai; staf hanya bisa mencatat pencabutan.
- Data sensitif terenkripsi per kolom; log audit hanya-tambah dan berantai HMAC; data dianonimkan atas permintaan.
- **Setiap klaim di `/kebijakan-privasi` harus bisa ditunjuk implementasinya**; yang belum ada tetap di
  "Yang belum berlaku". Perbarui halaman itu setiap skema data atau kontrol akses berubah.
- Nol rahasia di kode atau berkas contoh. Data demo selalu fiktif.

## 4. Konten & bahasa

- Bahasa UI: **Indonesia saja** (keputusan P2-8; evaluasi multibahasa: `docs/product/keputusan-multibahasa.md`).
  Nada resmi tetapi hangat.
- **Tri Satya dan Dasa Darma adalah teks resmi — jangan pernah diparafrase atau diubah.** Begitu pula teks resmi SKU/SKK:
  jangan mengarang; pakai penanda "contoh" sampai teks resmi Kwarnas dimasukkan.
- Lambang/logo di `public/brand/` masih **placeholder**; kebutuhan aset nyata: `docs/design/asset-brief.md`.

## 5. Catatan untuk AI agent

1. Mulai dari `AGENTS.md` → `CODEMAP.md`; grep sebelum membaca; jangan menyapu seluruh `src/`.
2. `src/` adalah satu-satunya sumber kebenaran; jangan membuat generator yang menulis kode sebagai template string.
3. Server Component secara bawaan; `'use client'` hanya untuk state/effect/event handler. Impor lewat `@/`.
4. Menulis konten publik → panggil `revalidatePublicSite()`. Rute dinamis publik → `dynamicParams = true` + `notFound()`.
5. Ubah skema lewat `src/db/schema.ts` lalu `npm run db:generate` — jangan menulis SQL migrasi dengan tangan
   (kecuali migrasi `--custom` untuk trigger/constraint yang tidak bisa diungkapkan Drizzle).
6. Fitur baru wajib tes yang bisa gagal; jangan pernah melewati atau menonaktifkan tes agar hijau.
7. Sebelum mengubah UI, baca `docs/design/design-system.md` dan `skills/frontend-craft/SKILL.md`.
