# CODEMAP.md — Indeks Codebase

> Indeks satu-baris-per-file. Cari barisnya, baca **hanya** file itu.
> Status diverifikasi 19 September 2026 · Baca `AGENTS.md` lebih dulu.
>
> **`ADA`** = file nyata di disk · **`HILANG`** = dirujuk kode/dokumen tapi tidak ada · **`GEN`** = source-nya saat ini hanya tersimpan di dalam script generator

---

## Peta Cepat

```
Ubah tampilan     → src/styles/tokens.css, tailwind.config.ts
Ubah komponen     → src/components/ui/ (primitive) · src/components/public/ (section)
Ubah halaman      → src/app/<rute>/page.tsx
Ubah data         → src/lib/data/mock-data.ts, src/types/index.ts
Ubah konfigurasi  → next.config.mjs, package.json, tsconfig.json
Ubah keamanan     → next.config.mjs (headers), docker-compose.yml, .env.example
```

---

## Konfigurasi (root)

| File | Status | Isi | Catatan |
|---|---|---|---|
| `package.json` | ADA | Next 14.2.24, React 18.3, Tailwind 3.4, framer-motion 13, shadcn 4 | Ada 6 dependensi bermasalah — `TASKS.md` P1-6. Tidak ada script `typecheck` |
| `tsconfig.json` | ADA | strict, ES2020, alias `@/*` → `src/*` | Meng-`exclude` folder duplikat — tambalan, lihat P0-1 |
| `next.config.mjs` | ADA | `reactStrictMode`, `images.unoptimized: true` | **Nol security header.** `unoptimized` mematikan optimasi gambar — P1-1, P4-1 |
| `tailwind.config.ts` | ADA | Warna dipetakan ke CSS variable, radius, shadow | **Rusak:** semua `var(--*)` undefined karena `tokens.css` hilang. `fontFamily` tak pernah didefinisikan → Inter/DM Sans tak pernah aktif — P0-5 |
| `postcss.config.mjs` | ADA | tailwindcss + autoprefixer | Normal |
| `components.json` | ADA | Konfigurasi shadcn, style `base-nova` | Menunjuk `src/styles/globals.css`, tapi `layout.tsx` mengimpor `./globals.css` — konflik, P0-4 |
| `docker-compose.yml` | ADA | PostgreSQL 16 + PostGIS | Password `password`, port terbuka ke semua interface — P1-3 |
| `.env.example` | ADA | DATABASE_URL, NEXTAUTH_* | Menanam nilai placeholder rahasia — P1-2 |
| `.env.local` | ADA | Environment lokal | **Tidak ada `.gitignore` di repo** — P0-2 sebelum `git init` |
| `.gitignore` | HILANG | — | **Prioritas tertinggi** — P0-2 |
| `.eslintrc*` | HILANG | — | `pnpm lint` tidak melakukan apa-apa tanpa ini — P6-1 |
| `prisma/schema.prisma` | HILANG | — | docker-compose & script db ada, skemanya tidak — P5-3 |

---

## Dokumentasi

| File | Status | Isi |
|---|---|---|
| `AGENTS.md` | ADA | Protokol agent, aturan token, invarian. **Titik masuk** |
| `CODEMAP.md` | ADA | File ini |
| `TASKS.md` | ADA | Rencana perbaikan P0–P6 dengan acceptance criteria |
| `PERBAIKAN.md` | ADA | Brief perbaikan asli. Task 1 (helper `cn`) masih relevan |
| `system_management_indramayu_scout-main/AI_CONTEXT.MD` | ADA | **Tidak akurat** — mendeskripsikan kondisi yang tidak pernah tercapai. Rujuk untuk *niat desain* saja |
| `README.md` | ADA | Satu baris. Kosong secara praktis |
| `docs/**` | HILANG | 6 subfolder, nol file. 16 dokumen yang dirujuk `AI_CONTEXT.MD` tidak ada |
| `skills/frontend-craft/SKILL.md` | HILANG | Dirujuk `AI_CONTEXT.MD` §10 |

---

## Script Generator — source of truth saat ini

> Selama `src/` kosong, **di sinilah seluruh kode aplikasi berada**, sebagai template string.
> Jangan baca utuh. Grep nama rutenya, lalu `Read` dengan offset.

### `generate_pages.js` (ADA · 34 KB · 736 baris) → menulis ke `src/app/`

| Baris | Menghasilkan | Catatan |
|---|---|---|
| 7 | `layout.tsx` | Impor `./globals.css` (HILANG), `@/context/LanguageContext` (HILANG), Header/Footer/SkipToContent |
| 50 | `page.tsx` | Beranda — merangkai 8 section, termasuk `AchievementPreview` yang `return null` |
| 73 | `tentang/page.tsx` | `"use client"` tanpa perlu; konten placeholder ("Sejarah panjang...") |
| 116 | `struktur-organisasi/page.tsx` | Pengurus + 31 Kwarran; grid 6 kolom bermasalah di mobile |
| 158 | `berita/page.tsx` | Filter kategori di `useState` — tidak tersimpan di URL (P4-5); tanpa empty state |
| 211 | `berita/[slug]/page.tsx` | `<img>` mentah; tanpa `generateStaticParams`/`generateMetadata` |
| 262 | `agenda/page.tsx` | Filter status; badge hanya dibedakan warna (P3-4) |
| 318 | `agenda/[slug]/page.tsx` | Detail agenda |
| 372 | `galeri/page.tsx` | Daftar album |
| 411 | `galeri/[slug]/page.tsx` | **Modal lightbox tanpa focus trap, tanpa Escape, tanpa `role="dialog"`** — P3-2 |
| 464 | `prestasi/page.tsx` | Tabel tanpa strategi overflow mobile |
| 506 | `dokumen/page.tsx` | `<a href={doc.url} download>` tanpa validasi — P1-7 |
| 537 | `kontak/page.tsx` | **Form tidak berfungsi** — `<button type="button">` tanpa handler; data pengguna hilang senyap — P1-4 |
| 589 | `kebijakan-privasi/page.tsx` | Menjanjikan kepatuhan UU PDP yang belum diimplementasikan — P1-8 |
| 614 | `aksesibilitas/page.tsx` | Mengiklankan pintasan `Alt+1` yang tidak ada — P3-6 |
| 662 | `masuk/page.tsx` | UI login palsu berpola phishing — P1-5. Emoji `⚜️ 👤 🏢 🔒` |
| 710 | `not-found.tsx` | 404. Emoji `🧭` |

### `create_components.js` (ADA · 17,5 KB · 409 baris) → menulis ke `src/components/`

| Baris | Menghasilkan | Catatan |
|---|---|---|
| 7 | `magicui/blur-fade.tsx` | **Bug:** state `visible` memakai `y: -yOffset`, seharusnya `y: 0`. Tanpa `prefers-reduced-motion` — P2-6 |
| 67 | `Header.tsx` | **`nav` adalah `hidden md:flex` tanpa drawer mobile — navigasi mati di bawah 768px.** Blocker responsivitas, P3-1. Emoji `⚜️` |
| 94 | `Footer.tsx` | Alamat, tautan, kontak. Target sentuh terlalu kecil |
| 138 | `SkipToContent.tsx` | Satu-satunya primitive a11y yang ada. Target `#main-content` cocok — pertahankan |
| 146 | `Hero.tsx` | Dua CTA + tombol hijau di Header = tiga aksi bersaing — P2-3 |
| 187 | `StatsSection.tsx` | **Data statistik ditanam inline** — duplikasi dengan mock-data, P5-2 |
| 215 | `AboutPreview.tsx` | Placeholder abu. Emoji `📸` dan `✓` |
| 257 | `AgendaPreview.tsx` | **Data agenda ditanam inline.** Emoji `📅` |
| 306 | `NewsPreview.tsx` | **Data berita ditanam inline** |
| 352 | `GalleryPreview.tsx` | Empat kotak abu "Foto 1–4" |
| 380 | `AchievementPreview.tsx` | **`return null`** — komponen mati yang masih diimpor beranda, P2-4 |
| 384 | `MapSection.tsx` | Placeholder peta. Emoji `🗺️`. Leaflet terpasang tapi tak pernah dipakai — P2-5 |

---

## `src/` — Target Struktur (semua HILANG saat ini)

> Folder ada, file tidak. Kolom "Sumber" menunjukkan cara memulihkan.

### `src/app/` — Rute
Semua 16 rute berstatus **GEN** — pulihkan dengan `node generate_pages.js`, lalu commit hasilnya sebagai kode nyata (P5-1).

| Rute | File |
|---|---|
| `/` | `app/page.tsx` |
| `/tentang` | `app/tentang/page.tsx` |
| `/struktur-organisasi` | `app/struktur-organisasi/page.tsx` |
| `/berita` · `/berita/[slug]` | `app/berita/page.tsx` · `app/berita/[slug]/page.tsx` |
| `/agenda` · `/agenda/[slug]` | `app/agenda/page.tsx` · `app/agenda/[slug]/page.tsx` |
| `/galeri` · `/galeri/[slug]` | `app/galeri/page.tsx` · `app/galeri/[slug]/page.tsx` |
| `/prestasi` | `app/prestasi/page.tsx` |
| `/dokumen` | `app/dokumen/page.tsx` |
| `/kontak` | `app/kontak/page.tsx` |
| `/kebijakan-privasi` | `app/kebijakan-privasi/page.tsx` |
| `/aksesibilitas` | `app/aksesibilitas/page.tsx` |
| `/masuk` | `app/masuk/page.tsx` |
| 404 | `app/not-found.tsx` |

Belum ada di mana pun: `loading.tsx`, `error.tsx`, `sitemap.ts`, `robots.ts` (P4-3, P4-4).

### `src/components/`

| File | Status | Sumber / Aksi |
|---|---|---|
| `public/Header.tsx`, `Footer.tsx`, `Hero.tsx`, `StatsSection.tsx`, `AboutPreview.tsx`, `AgendaPreview.tsx`, `NewsPreview.tsx`, `GalleryPreview.tsx`, `MapSection.tsx` | GEN | `create_components.js` — catatan: generator menulisnya **datar** di `components/`, bukan `components/public/`. Rapikan saat pemulihan (P0-6) |
| `ui/SkipToContent.tsx` | GEN | `create_components.js:138` |
| `ui/Button.tsx` | HILANG | Tulis baru — P2-2 |
| `ui/Card.tsx` | HILANG | Tulis baru — P2-2 |
| `ui/Badge.tsx` | HILANG | Tulis baru — P2-2 |
| `ui/LanguageSelector.tsx` | HILANG | Tulis baru bila memilih jalur i18n B — P2-8 |
| `ui/Input.tsx`, `Textarea.tsx`, `Field.tsx` | HILANG | Dibutuhkan untuk perbaikan form kontak — P1-4 |
| `magicui/blur-fade.tsx` | GEN | `create_components.js:7` — perbaiki bug `y` |

### `src/lib/`, `src/styles/`, `src/types/`

| File | Status | Catatan |
|---|---|---|
| `lib/utils.ts` (`cn()`) | HILANG | Kode persisnya ada di `PERBAIKAN.md` Task 1. **Jangan pakai paket npm `cn`** yang ada di `package.json` — itu paket asing, P1-6 |
| `lib/data/mock-data.ts` | HILANG | Diimpor sebagai `@/lib/mock-data` oleh generator. Perlu: `newsData`, `agendaData`, `galleryData`, `documentsData`, `achievementsData`, `organizationStructure`, `kwartirRanting` (31 entri) |
| `lib/i18n/LanguageContext.tsx` | HILANG | Diimpor sebagai `@/context/LanguageContext`. Mengekspor `LanguageProvider` + `useLanguage()` → `{ t, language, setLanguage }` |
| `lib/i18n/translations.ts` | HILANG | Kamus ID/EN/SU |
| `lib/repositories/*` | HILANG | Lapisan akses data — P5-2 |
| `styles/tokens.css` | HILANG | **Penyebab tailwind config rusak.** Perlu: `--green-*`, `--neutral-*`, `--surface-*`, `--text-*`, `--action-*`, `--border-*`, `--status-*`, `--brand-50..900`, `--shadow-sm/md/dialog` |
| `styles/globals.css` | HILANG | Entry CSS. Dirujuk dari dua lokasi berbeda — P0-4 |
| `styles/utilities.css` | HILANG | `.civic-container`, `.card-subtle` |
| `types/index.ts` | HILANG | `NewsItem`, `AgendaItem`, `GalleryAlbum`, `DocumentItem`, `Achievement`, `KwarranInfo`, `OrgUnit` |

### `public/`

| File | Status |
|---|---|
| `manifest.json` | ADA — PWA, tema `#16A34A` (catatan: nilai hex ini tidak cocok dengan hijau `#2f7d52` yang disebut dokumen desain; samakan) |
| `brand/logo.svg` | HILANG — dirujuk `manifest.json` |

---

## Sistem Design Token (rencana 3 tingkat)

```
Primitive        --green-600, --neutral-200
  → Semantic     --action-primary, --surface-raised, --text-secondary
    → Brand      --brand-500, --brand-700
```
Didefinisikan di `styles/tokens.css` → dikonsumsi `tailwind.config.ts` → dipakai sebagai kelas (`bg-surface-raised`, `text-text-secondary`).
**Rantai ini putus di mata rantai pertama.** Perbaiki dulu (P0-5); tanpa itu, pekerjaan UI apa pun sia-sia.

---

## Aliran Data

**Sekarang:** `mock-data.ts` (HILANG) → diimpor langsung komponen · sebagian komponen menanam datanya sendiri inline · nol API route · nol koneksi database.

**Target (P5-2):** `sumber data` → `lib/repositories/*` → Server Component → komponen presentasi. Hanya repository yang boleh mengimpor mock.

---

## Perbarui File Ini

Bila kamu menambah, menghapus, atau memindahkan file — perbarui `CODEMAP.md` di PR yang sama. Indeks yang usang mendorong agent berikutnya membaca semuanya, dan itulah yang biayanya mahal.
