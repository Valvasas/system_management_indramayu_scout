# CODEMAP.md — Indeks Codebase

> Indeks satu-baris-per-file. Cari barisnya, baca **hanya** file itu.
> Diverifikasi 19 Sep 2026 setelah P0 (`tsc` + `next build` lulus). Baca `AGENTS.md` lebih dulu.
> **`[P#-#]`** = task di `TASKS.md` yang masih menyentuh file itu.

## Peta Cepat

```
Ubah tampilan     → src/styles/tokens.css, tailwind.config.ts
Ubah komponen     → src/components/ui/ (primitive) · src/components/public/ (section)
Ubah halaman      → src/app/<rute>/page.tsx
Ubah data         → src/lib/data/mock-data.ts, src/types/index.ts
Ubah teks bahasa  → src/lib/i18n/translations.ts
Ubah konfigurasi  → next.config.mjs, package.json, tsconfig.json
```

## Konfigurasi (root)

| File | Isi | Catatan |
|---|---|---|
| `package.json` | Next 14.2, React 18, Tailwind 3.4. Script: dev/build/start/lint/**typecheck** | Ada dependensi tak terpakai/berbahaya (`cn`, `shadcn`, `framer-motion`, `@base-ui/react`, ...) [P1-6]. Source hanya butuh next, react, tailwind, clsx, tailwind-merge |
| `tsconfig.json` | strict, alias `@/*` → `src/*` | Bersih |
| `next.config.mjs` | `reactStrictMode`, `images.unoptimized` | Nol security header [P1-1]; optimasi gambar mati [P4-1] |
| `tailwind.config.ts` | Warna → CSS var, `fontFamily` sans/display, radius, shadow | Sudah berfungsi. `font-display` belum dipakai halaman mana pun |
| `components.json` | Konfigurasi shadcn | Menunjuk `src/styles/globals.css` (sudah benar) |
| `docker-compose.yml` | PostgreSQL 16 + PostGIS | Password lemah, port terbuka [P1-3] |
| `.env.example` / `.env.local` | Env | Placeholder rahasia [P1-2]. Jangan baca `.env.local` |
| `.gitignore` | node_modules, .next, .env* | Ada. **Git belum terpasang**, belum ada `git init` |
| `.eslintrc*` | — | **Belum ada**, `pnpm lint` tak berarti [P6-1] |
| `prisma/schema.prisma` | — | **Belum ada** [P5-3] |

## Dokumentasi

| File | Isi |
|---|---|
| `AGENTS.md` | Protokol agent — **titik masuk** |
| `TASKS.md` | Rencana P0–P6 + "Status Eksekusi" |
| `AI_CONTEXT.MD` | Niat desain & konvensi. Sebagian klaim status keliru (lihat AGENTS §2) |
| `PERBAIKAN.md` | Brief awal. Task 1 (`cn`) sudah dikerjakan |
| `docs/design/` | design-brief, visual-principles, motion-guidelines, accessibility-checklist |
| `docs/security/` | authorization-model, data-classification, consent/audit-log/backup/file-upload policy |
| `docs/product/`, `operations/`, `architecture/`, `testing/` | Visi & MVP, deployment, arsitektur, strategi tes |
| `skills/frontend-craft/SKILL.md` | Panduan craft frontend. Baca sebelum ubah UI |

## `src/app/` — Rute (semua ada, semua ter-build)

| Rute | File | Catatan |
|---|---|---|
| layout | `app/layout.tsx` | Font Inter + DM Sans, `LanguageProvider`, Header/Footer. Metadata sama untuk semua rute [P2-7] |
| `/` | `app/page.tsx` | Merangkai 8 section `components/public/*` |
| `/tentang` | `app/tentang/page.tsx` | Konten masih placeholder ("Sejarah panjang..."); `"use client"` tak perlu [P2-7] |
| `/struktur-organisasi` | `app/struktur-organisasi/page.tsx` | Pengurus dikelompokkan per `department`, 31 Kwarran |
| `/berita`, `/berita/[slug]` | `app/berita/...` | Filter di `useState`, bukan URL [P4-5]. `<img>` mentah [P1-7] |
| `/agenda`, `/agenda/[slug]` | `app/agenda/...` | Emoji `📅 📍` [P2-1]; badge status hanya warna [P3-4] |
| `/galeri`, `/galeri/[slug]` | `app/galeri/...` | Lightbox tanpa focus trap/Escape [P3-2] |
| `/prestasi` | `app/prestasi/page.tsx` | Tabel tanpa strategi overflow mobile [P3-8] |
| `/dokumen` | `app/dokumen/page.tsx` | Tautan unduh tanpa validasi [P1-7] |
| `/kontak` | `app/kontak/page.tsx` | Form perlu dicek: kirim ke mana, validasi server [P1-4] |
| `/kebijakan-privasi`, `/aksesibilitas` | `app/.../page.tsx` | Klaim melebihi implementasi [P1-8, P3-6] |
| `/masuk` | `app/masuk/page.tsx` | UI login tanpa backend [P1-5] |
| 404 | `app/not-found.tsx` | |

Belum ada: `loading.tsx`, `error.tsx`, `sitemap.ts`, `robots.ts` [P4-3, P4-4].

## `src/components/`

| File | Ekspor | Catatan |
|---|---|---|
| `ui/Button.tsx` | `Button` | Varian + loading |
| `ui/Card.tsx` | `Card`, `CardHeader`, `CardContent`, `CardFooter` | Compound; prop `hoverable` |
| `ui/Badge.tsx` | `Badge` | variant: success/warning/info/**danger**/default/brand. Warna literal [P2-2] |
| `ui/LanguageSelector.tsx` | `LanguageSelector` | Dropdown ID/EN/SU |
| `ui/SkipToContent.tsx` | `SkipToContent` | Target `#main-content` (cocok dengan layout) |
| `public/Header.tsx` | `Header` | **Belum ada drawer mobile** [P3-1] |
| `public/Footer.tsx` | `Footer` | |
| `public/Hero.tsx`, `StatsSection.tsx`, `AboutPreview.tsx`, `AgendaPreview.tsx`, `NewsPreview.tsx`, `GalleryPreview.tsx`, `AchievementPreview.tsx`, `MapSection.tsx` | masing-masing named export | Section beranda. MapSection masih placeholder, Leaflet belum dipakai [P2-5] |

**Semua ekspor komponen adalah *named export*** (`import { Header } from ...`), bukan default.

## `src/lib/`, `src/styles/`, `src/types/`

| File | Isi |
|---|---|
| `lib/utils.ts` | `cn()` (clsx + tailwind-merge) |
| `lib/data/mock-data.ts` | `mockNews`, `mockAgendas`, `mockGalleryAlbums`, `mockAchievements`, `mockOrganization`, `mockKwarrans`, `statSummary`, `mockDocuments`. Data diimpor langsung oleh halaman [P5-2] |
| `lib/i18n/LanguageContext.tsx` | `LanguageProvider`, `useLanguage()` → `{ language, setLanguage, t }`. `t()` mengembalikan **key** bila tak ditemukan |
| `lib/i18n/translations.ts` | Kamus id/en/su: hanya `nav`, `hero`, `filter`, `contact`, `footer` |
| `styles/tokens.css` | Token 3 tingkat (primitive → semantic → brand 50–900), shadow |
| `styles/globals.css` | `@import tokens.css`, `@tailwind`, base + reduced-motion, utility `.civic-container` `.card-subtle` `.skip-to-content` |
| `types/index.ts` | `NewsItem`, `AgendaItem`, `Photo`, `GalleryAlbum`, `AchievementItem`, `OrganizationMember`, `KwarranInfo`, `StatSummary`, `DocumentItem` |

## `public/`

`manifest.json` (PWA, tema `#16A34A`) · `brand/logo.svg`

## Skema data (ringkas, hindari membuka `types/index.ts`)

- News: `id slug title category excerpt content coverImage author publishedAt tags status(DRAFT|PUBLISHED|ARCHIVED)`
- Agenda: `id slug title dateStart dateEnd location organizer description status(UPCOMING|ONGOING|COMPLETED) contactPerson`
- Album: `id slug title date location organizer description coverImage category photos[Photo]`
- Achievement: `level(Kecamatan..Internasional) year recipient image`
- OrganizationMember: `name role department period photoUrl bio`
- Kwarran: `name code gudepCount activeMembers address leader`
- Document: `title category type size date url description?`

## Alur data & token

`mock-data.ts` → dibaca langsung halaman/komponen [target P5-2: lewat `lib/repositories`].
Token: `tokens.css` → `tailwind.config.ts` → kelas (`bg-surface-raised`). Komponen saat ini masih banyak memakai palet Tailwind langsung (`green-*`, `neutral-*`, `blue-*`), bukan token semantik [P2-2].

## Perbarui file ini

Tambah/hapus/pindah file → perbarui `CODEMAP.md` di perubahan yang sama.
