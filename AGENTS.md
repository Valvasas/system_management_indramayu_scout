# AGENTS.md — Protokol Kerja AI Agent

> **Baca file ini lebih dulu. Jangan membaca seluruh codebase.**
> Tujuan: kamu bisa mengerjakan task apa pun di proyek ini dengan membaca **2–5 file**, bukan puluhan.
> File ini + `CODEMAP.md` ≈ 6.000 token. Membaca seluruh `src/` ≈ 80.000+ token. Pakai yang pertama.

---

## 1. Aturan Token (wajib)

| Jangan | Lakukan |
|---|---|
| `Read` seluruh direktori "untuk memahami konteks" | Baca `CODEMAP.md` → langsung ke file yang relevan |
| `Read` file penuh untuk mencari satu fungsi | `Grep` nama simbolnya, lalu `Read` dengan `offset`/`limit` di sekitar hasil |
| Membaca `generate_pages.js` (34 KB) seluruhnya | `Grep` nama rutenya; file itu berisi 16 halaman, kamu cuma butuh satu |
| Membuka `package-lock.json` (188 KB) | `Grep` nama paket yang dicari |
| Menjelajah `node_modules/`, `.next/` | Tidak pernah. Nol pengecualian |
| Mengulang eksplorasi yang sudah ada hasilnya | Percayai `CODEMAP.md`; kalau meleset, perbaiki `CODEMAP.md` sekalian |

**Anggaran per task:** target < 15.000 token untuk membangun konteks. Kalau sudah lewat, berhenti — kemungkinan besar kamu mencari di tempat yang salah. Baca ulang bagian 4 di bawah.

**Aturan verifikasi:** `CODEMAP.md` menyebut status setiap file (`ADA` / `HILANG`). Sebelum mengimpor atau memodifikasi sesuatu, pastikan statusnya `ADA`. Proyek ini punya riwayat dokumentasi yang menyebut file yang tidak pernah ada.

---

## 2. Kondisi Proyek per 5 Oktober 2026 — BACA INI

**Sudah Fase 2+, design system "Hutan & Lapangan".** Ada autentikasi (termasuk kode akses tanpa email), RBAC, basis data (Drizzle), anggota/gudep/kwarran + mutasi, CMS dengan alur review, pendaftar kegiatan, portal peserta, dan situs publik bergambar. Gerbang kualitas yang terbukti lulus di build produksi: `npm run typecheck`, `npm run lint`, `npm test` (54 tes), `npm run build` (94 halaman), `npm run a11y` (118 pemindaian, nol pelanggaran), `npm run e2e` (12/12). Yang perlu kamu ketahui:

1. **Build butuh basis data.** Halaman detail memanggil DB di `generateStaticParams`. Lokal/CI: `npm run db:seed -- --demo` lalu `ALLOW_PGLITE=1 npm run build` (PGlite tertanam). Produksi: isi `DATABASE_URL`. Akun demo: sandi `demo-pramuka-2026` (`admin`, `kwarcab`, `humas`, `kwarran.indramayu`, `gudep.smp1`, `peserta.dimas`). Data demo **fiktif**.
2. **`AI_CONTEXT.MD` masih melebih-lebihkan.** Pakai sebagai *niat desain*; kebenaran ada di kode + `CODEMAP.md`. Dokumen rancangan sumber: `docs/product/rancangan-v5.md` (niat, bukan status).
3. **`generate_pages.js` / `create_components.js` USANG.** Jangan dijalankan: menimpa `src/app` dengan template lama.
4. **Menulis konten publik wajib memanggil `revalidatePublicSite()`** (`features/content/shared.ts`). Tanpanya halaman statis (`/galeri`, `/struktur-organisasi`, beranda) menampilkan versi lama.
5. **Halaman `[slug]` memakai `dynamicParams = true` dan halaman daftarnya berada di route group `(daftar)`.** Jangan pindahkan `loading.tsx` ke folder induk: itu membungkus detail dalam Suspense dan slug asing berubah jadi soft 404 (status 200). **Semua** rute dinamis publik (termasuk `/golongan/[id]`, `/wilayah/[slug]` yang daftarnya tetap) wajib `dynamicParams = true` + `notFound()`: di Next 14, `dynamicParams = false` membuat seluruh path rute itu 404 setelah `revalidatePublicSite()` dipanggil (diuji di `npm run e2e`).
6. **Perbarui `/kebijakan-privasi` setiap skema data atau kontrol akses berubah.** Tiap klaim harus bisa ditunjuk implementasinya; yang belum ada tetap di "Yang belum berlaku".
7. **Desain:** baca `docs/design/design-system.md` sebelum mengubah UI. Ilustrasi hanya dari `components/illustrations`; palet `ill-*` khusus SVG; teks tidak boleh di atas hutan/gunung (hanya langit atau pil putih).
8. **Pembina tidak pernah tahu sandi anggota.** Akun baru & reset memakai kode akses sekali pakai (`features/auth/access-codes.ts`). Jangan kembalikan pola "sandi sementara".
9. **Kendala yang diketahui:** `npm audit` melaporkan celah di jalur Next 14 (perbaikan = migrasi mayor, butuh keputusan [P1-6]); rate limit in-memory (satu instance); belum ada enkripsi kolom, retensi otomatis, atau persetujuan wali terverifikasi; ikon/logo masih placeholder; folder `public/images/` kosong.

---

## 3. Urutan Baca Menurut Jenis Task

Cari barisnya, baca kolom kanan, **berhenti**. Jangan baca yang lain kecuali ternyata kurang.

| Task kamu | Baca ini saja | ~Token |
|---|---|---|
| Orientasi umum | `AGENTS.md` + `CODEMAP.md` | 6k |
| Mengerjakan perbaikan terjadwal | `TASKS.md` bagian yang relevan | 2–4k |
| Ubah warna / spacing / shadow | `docs/design/design-system.md` + `src/styles/tokens.css` + `tailwind.config.ts` | 5k |
| Ilustrasi / suasana halaman | `src/components/illustrations/Scenes.tsx` (+ `geometry.ts`) | 4k |
| Akses akun (lupa sandi, kode, aktivasi) | `src/features/auth/access-codes.ts` + `access-actions.ts` + `src/lib/auth/access-code.ts` | 4k |
| Mutasi anggota | `src/features/members/transfers.ts` + `transfer-actions.ts` | 3k |
| Ubah/buat komponen UI primitive | `CODEMAP.md` §UI + file komponennya + `src/lib/utils.ts` | 4k |
| Ubah satu halaman | `CODEMAP.md` §Rute → `src/app/<rute>/page.tsx` saja | 2–5k |
| Tambah halaman baru | `src/app/layout.tsx` + satu `page.tsx` terdekat sebagai contoh | 4k |
| Ubah navigasi publik | `src/components/public/Header.tsx` + `Footer.tsx` | 3k |
| Ubah menu portal | `src/components/dashboard/nav.ts` — **setiap `href` harus punya `page.tsx`** | 2k |
| Ubah/tambah CMS konten | `src/features/content/<bagian>.ts` + `queries.ts` + `components/dashboard/content/ContentForms.tsx` + `app/(dashboard)/dashboard/konten/<bagian>/` | 6k |
| Izin / peran / akses data | `src/lib/auth/permissions.ts` + `scope.ts` + `docs/security/authorization-model.md` | 4k |
| Ubah skema DB | `src/db/schema.ts` → `npm run db:generate` | 3k |
| Ubah data publik | `src/lib/repositories/*` (baca) + `src/features/content/*` (tulis) | 4k |
| Task keamanan | `next.config.mjs` + `docker-compose.yml` + `.env.example` + `TASKS.md` §P1 | 4k |
| Task aksesibilitas | `TASKS.md` §P3 + komponen sasaran | 4k |
| Performa / SEO | `next.config.mjs` + `src/app/layout.tsx` + `TASKS.md` §P4 | 4k |
| Arsitektur data | `TASKS.md` §P5 + `src/types/index.ts` | 4k |
| Setup build / dependensi | `package.json` + `tsconfig.json` + `next.config.mjs` | 3k |

---

## 4. Resep Pencarian (pakai ini sebelum `Read`)

```bash
# Di mana sebuah rute didefinisikan?
Glob: src/app/**/page.tsx

# Di mana komponen X dipakai?
Grep: "<NamaKomponen" --glob "src/**/*.tsx"

# Di mana token warna didefinisikan?
Grep: "--brand-|--surface-|--text-|--action-" --glob "src/styles/*.css"

# Cari pelanggaran aturan proyek:
Grep: "[\x{1F300}-\x{1FAFF}]" --glob "src/**"           # emoji (dilarang)
Grep: "(bg|text|border)-(green|blue|red|yellow)-[0-9]"  # warna hardcode (dilarang)
Grep: "<img " --glob "src/**/*.tsx"                     # harus next/image
Grep: "use client" --glob "src/app/**/*.tsx"            # kandidat konversi ke Server Component
```

---

## 5. Invarian — Jangan Dilanggar

Aturan ini berasal dari standar desain internal proyek (`AI_CONTEXT.MD` §3, `PERBAIKAN.md`). Melanggarnya = PR ditolak.

**Desain**
- Nol emoji sebagai elemen UI. Selalu ikon SVG dari `lucide-react`.
- Nol nilai hardcode warna/spacing/shadow/radius. Selalu token CSS variable → kelas Tailwind.
- Satu tombol `primary` per konteks visual. Sisanya `secondary`/`ghost`.
- Nol gradien dekoratif, nol glassmorphism. Radius mengikuti skala di design system (input `lg`, kartu `xl/2xl`, media `3xl`, tombol `pill`).
- Kekayaan visual lewat ilustrasi SVG dari `components/illustrations` (aria-hidden, tanpa manusia/wajah), bukan foto stok atau efek.
- Judul `font-display` (Fraunces) memakai `font-semibold`; gunakan `cn()` (bukan `twMerge` mentah) agar `text-display-*` tidak hilang.
- Jangan bungkus setiap blok dengan card. Whitespace lebih dulu.

**Aksesibilitas (target WCAG 2.2 AA)**
- Target sentuh ≥ 44×44px.
- `focus-visible` terlihat di semua elemen interaktif.
- Status tidak boleh dibedakan hanya lewat warna — wajib ikon + teks.
- Tombol berikon saja wajib punya label yang bisa diakses.
- Hormati `prefers-reduced-motion`.
- Satu `h1` per halaman, hierarki heading tanpa lompatan.

**Keamanan & privasi**
- Pengecekan izin **wajib di server**. Penyembunyian di UI bukan kontrol keamanan.
- Nol foto wajah anak di bawah umur di halaman publik.
- Nol rahasia di dalam kode atau file contoh.
- Semua input tervalidasi di server dengan Zod, apa pun yang sudah divalidasi klien.

**Kode**
- File/folder/URL `kebab-case`; komponen & tipe `PascalCase`; fungsi/variabel `camelCase`.
- Impor pakai alias `@/` (→ `src/`).
- `"use client"` hanya bila benar-benar butuh state/effect/event handler. Default Server Component.
- Komponen baru → `components/ui/` (primitive) atau `components/public/` (section).

---

## 6. Alur Kerja

1. **Cek `TASKS.md` "Status Eksekusi"** untuk tahu task mana yang sudah selesai; lanjutkan dari blok berikutnya (P1).
2. **Rutekan.** Bagian 3 → tentukan file mana saja yang perlu dibaca.
3. **Grep sebelum Read.** Bagian 4.
4. **Ubah seminimal mungkin.** Ikuti gaya sekitarnya.
5. **Verifikasi:** `typecheck` → `lint` → `test` → `build`; untuk UI juga `npm run a11y`. Laporkan apa adanya kalau gagal.
6. **Perbarui `CODEMAP.md`** bila kamu menambah/menghapus/memindahkan file. Ini yang menjaga panduan ini tetap murah dipakai.

---

## 7. Perintah

```bash
npm run dev                          # http://localhost:3000 (PGlite otomatis bila DATABASE_URL kosong)
npm run db:seed -- --demo            # data FIKTIF + akun demo
npm run lint && npm run typecheck && npm test
ALLOW_PGLITE=1 npm run build         # gerbang utama (setelah seed)
npm run start                        # lalu: npm run a11y   (axe-core, 1280 & 390px)
npm run e2e                          # alur portal end-to-end (MENGUBAH data: jalankan pada data demo segar)
npm run db:generate                  # buat migrasi dari src/db/schema.ts

docker compose up -d                 # PostgreSQL + PostGIS (opsional)
```

## 8. Konteks Domain (hemat waktumu)

- **Kwarcab** = Kwartir Cabang, tingkat kabupaten. Proyek ini untuk Kwarcab Indramayu.
- **Kwarran** = Kwartir Ranting, tingkat kecamatan. Ada **31** di Indramayu.
- **Gudep** = Gugus Depan, satuan berbasis sekolah/komunitas. ~1.200 unit.
- **Penggalang / Penegak / Pandega** = jenjang usia anggota (SMP / SMA / dewasa muda).
- **KTA** = Kartu Tanda Anggota. **KMD** = Kursus Mahir Dasar (pelatihan pembina).
- **Tri Satya / Dasa Darma** = janji & kode kehormatan Pramuka. Perlakukan sebagai teks resmi — **jangan pernah parafrase atau ubah kata-katanya**.
- Bahasa UI: Indonesia. Nada: resmi tapi hangat, institusi publik — bukan startup.
- Banyak pengguna adalah anak di bawah umur → privasi bukan fitur tambahan, melainkan syarat (UU PDP No. 27/2022).

---

## 9. File yang Tidak Perlu Dibaca

`node_modules/` · `.next/` · `package-lock.json` · `create_components.js` & `generate_pages.js` (usang, jangan dibaca maupun dijalankan).
