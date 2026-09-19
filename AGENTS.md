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

## 2. Kondisi Proyek per 19 September 2026 — BACA INI

**Blok P0 selesai:** `pnpm typecheck` dan `next build` lulus, 15 halaman ter-generate. Source sudah dipulihkan dari GitHub ke `src/`. Yang masih perlu kamu ketahui:

1. **`AI_CONTEXT.MD` masih melebih-lebihkan.** Ia bilang drawer mobile ada (tidak ada di `Header.tsx`), i18n 3 bahasa penuh (hanya kamus nav/hero/filter/footer), dan halaman bebas emoji (tidak). Pakai sebagai *niat desain*; kebenaran ada di kode + `CODEMAP.md`.
2. **`generate_pages.js` / `create_components.js` USANG.** Jangan dijalankan: menimpa `src/app` dengan template lama yang import-nya rusak dan membuat komponen datar duplikat. Pernah terjadi sekali.
3. **Git belum terpasang** di mesin ini, jadi belum ada riwayat/`git init`. `.gitignore` sudah ada. Sebelum edit besar, salin dulu file yang diubah.
4. **Fungsi `t()` mengembalikan key-nya sendiri bila terjemahan tidak ada** (bukan string kosong). Jangan tulis `t("x") || "fallback"`; fallback tidak pernah aktif. Pakai key yang ada di `src/lib/i18n/translations.ts`.
5. **Kualitas UI masih di tahap P2/P3:** emoji, warna literal `green-*`, tanpa drawer mobile, `<img>` mentah. Itu pekerjaan berikutnya, jangan dianggap sudah beres.

---

## 3. Urutan Baca Menurut Jenis Task

Cari barisnya, baca kolom kanan, **berhenti**. Jangan baca yang lain kecuali ternyata kurang.

| Task kamu | Baca ini saja | ~Token |
|---|---|---|
| Orientasi umum | `AGENTS.md` + `CODEMAP.md` | 6k |
| Mengerjakan perbaikan terjadwal | `TASKS.md` bagian yang relevan | 2–4k |
| Ubah warna / spacing / shadow | `src/styles/tokens.css` + `tailwind.config.ts` | 3k |
| Ubah/buat komponen UI primitive | `CODEMAP.md` §UI + file komponennya + `src/lib/utils.ts` | 4k |
| Ubah satu halaman | `CODEMAP.md` §Rute → `src/app/<rute>/page.tsx` saja | 2–5k |
| Tambah halaman baru | `src/app/layout.tsx` + satu `page.tsx` terdekat sebagai contoh | 4k |
| Ubah navigasi | `src/components/public/Header.tsx` + `Footer.tsx` | 3k |
| Ubah data / mock | `src/lib/data/mock-data.ts` + `src/types/index.ts` | 5k |
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
- Nol gradien dekoratif, nol glassmorphism, nol `rounded-2xl/3xl` sebagai default.
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
5. **Verifikasi:** `pnpm typecheck` → `pnpm lint` → `pnpm build`. Laporkan apa adanya kalau gagal.
6. **Perbarui `CODEMAP.md`** bila kamu menambah/menghapus/memindahkan file. Ini yang menjaga panduan ini tetap murah dipakai.

---

## 7. Perintah

```bash
pnpm dev          # http://localhost:3000
pnpm build        # build produksi — gerbang utama
pnpm lint
pnpm typecheck    # tsc --noEmit   (tambahkan ke package.json bila belum ada — TASKS.md P6-1)

docker compose up -d     # PostgreSQL + PostGIS
```

---

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
