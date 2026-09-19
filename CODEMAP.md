# CODEMAP.md — Indeks Codebase

> Indeks satu-baris-per-file. Cari barisnya, baca **hanya** file itu.
> Diverifikasi 19 Sep 2026 setelah blok P2–P4 (`tsc`, `next lint`, `next build` lulus; 30 halaman ter-generate).
> Baca `AGENTS.md` lebih dulu. **`[P#-#]`** = task di `TASKS.md` yang masih menyentuh file itu.

## Peta Cepat

```
Ubah tampilan     → src/styles/tokens.css, tailwind.config.ts
Ubah komponen     → src/components/ui/ (primitive) · src/components/public/ (section)
Ubah halaman      → src/app/<rute>/page.tsx
Ubah data         → src/lib/repositories/* (JANGAN impor mock-data langsung)
Ubah identitas    → src/lib/site.ts (nama, URL, kontak; dipakai metadata/sitemap/JSON-LD)
Ubah konfigurasi  → next.config.mjs, package.json, tsconfig.json, .eslintrc.json
```

## Konfigurasi (root)

| File | Isi | Catatan |
|---|---|---|
| `package.json` | Next 14.2.35, React 18, Tailwind 3.4. Script: dev/build/start/lint/typecheck | Dependensi runtime tinggal: next, react, react-dom, clsx, tailwind-merge, lucide-react, leaflet |
| `tsconfig.json` | strict, alias `@/*` → `src/*` | Bersih |
| `next.config.mjs` | CSP **enforce**, HSTS, X-Frame-Options, Permissions-Policy, COOP; optimizer gambar aktif (`remotePatterns: []` = hanya aset sendiri) | [P1-1, P1-7, P4-1] selesai |
| `tailwind.config.ts` | Warna → CSS var (surface/text/action/border/focus/status/brand/neutral), fontFamily, spacing `touch` (44px), radius, shadow | Kelas warna literal dilarang ESLint |
| `.eslintrc.json` | `next/core-web-vitals` + `jsx-a11y/recommended` + aturan kustom | Larang warna literal Tailwind, emoji, `<img>`, impor `mock-data` di luar repository |
| `components.json` | Konfigurasi shadcn | Menunjuk `src/styles/globals.css` |
| `docker-compose.yml` | PostgreSQL 16 + PostGIS | Password wajib dari `.env`, bind 127.0.0.1, healthcheck |
| `.env.example` / `.env.local` | Env | Jangan baca `.env.local`. Validasi Zod belum ada [P1-2] |
| `.gitignore` | node_modules, .next, .env* | Ada. **Git tidak terpasang di mesin ini**, belum ada `git init` [P0-2] |
| `prisma/schema.prisma` | — | **Belum ada** [P5-3] |

## Dokumentasi

| File | Isi |
|---|---|
| `AGENTS.md` | Protokol agent — **titik masuk** |
| `TASKS.md` | Rencana P0–P6 + "Status Eksekusi" |
| `AI_CONTEXT.MD` | Niat desain & konvensi |
| `docs/design/` | design-brief, visual-principles, motion-guidelines, accessibility-checklist, **color-contrast** (tabel rasio terukur) |
| `docs/security/` | authorization-model, data-classification, consent/audit-log/backup/file-upload policy |
| `docs/product/`, `operations/`, `architecture/`, `testing/` | Visi & MVP, deployment, arsitektur, strategi tes |
| `skills/frontend-craft/SKILL.md` | Panduan craft frontend. Baca sebelum ubah UI |

## `src/app/` — Rute

| Rute | File | Catatan |
|---|---|---|
| layout | `app/layout.tsx` | Inter + DM Sans, `metadataBase`, template judul, JSON-LD `Organization`. Tanpa provider klien |
| `/` | `app/page.tsx` | 8 section, latar bergantian subtle↔base |
| `/tentang` | `tentang/page.tsx` | Server Component, konten nyata (sejarah, visi-misi, Dasa Darma) |
| `/struktur-organisasi` | `struktur-organisasi/page.tsx` | Pengurus per departemen + 31 Kwarran (grid 2 kolom di ponsel) |
| `/berita` | `berita/page.tsx` + `loading.tsx` | Server Component; filter kategori lewat `?kategori=` |
| `/berita/[slug]` | `berita/[slug]/page.tsx` + `ShareLink.tsx` | `generateStaticParams`, `dynamicParams=false`, JSON-LD `NewsArticle` |
| `/agenda` | `agenda/page.tsx` + `loading.tsx` | Filter status lewat `?status=` |
| `/agenda/[slug]` | `agenda/[slug]/page.tsx` | JSON-LD `Event` |
| `/galeri` | `galeri/page.tsx` + `loading.tsx` | |
| `/galeri/[slug]` | `galeri/[slug]/page.tsx` + `PhotoGallery.tsx` | Lightbox: focus trap, Escape, panah, fokus kembali |
| `/prestasi` | `prestasi/page.tsx` + `loading.tsx` | Tabel (≥md, wrapper fokusabel) ↔ kartu (<md); filter `?tingkat=` |
| `/dokumen` | `dokumen/page.tsx` + `DocumentSearch.tsx` + `loading.tsx` | Filter `?kategori=`, cari `?cari=`; unduhan divalidasi allowlist |
| `/kontak` | `kontak/page.tsx` + `ContactForm.tsx` + `actions.ts` | Server Action: validasi, honeypot, time-trap, rate limit 3/10 mnt |
| `/kebijakan-privasi`, `/aksesibilitas` | `.../page.tsx` | Hanya klaim yang terbukti + bagian "yang belum berlaku" |
| `/masuk` | `masuk/page.tsx` | Halaman status jujur, `robots: noindex` |
| 404 / error | `not-found.tsx`, `error.tsx` | |
| SEO | `sitemap.ts`, `robots.ts` | Semua rute statis + slug dinamis |

## `src/components/`

| File | Ekspor | Catatan |
|---|---|---|
| `ui/Button.tsx` | `Button`, `ButtonLink`, `buttonStyles` | 6 varian, 3 ukuran, semua ≥44px. `ButtonLink` menggantikan pola `<Link><Button/></Link>` |
| `ui/Card.tsx` | `Card`, `CardHeader`, `CardContent`, `CardFooter` | Prop `as` (div/article/li/section) + `hoverable` |
| `ui/Badge.tsx` | `Badge`, `AgendaStatusBadge`, `FileTypeBadge`, `CategoryBadge`, `agendaStatusLabel` | Selalu ikon + teks (WCAG 1.4.1) |
| `ui/Field.tsx` | `Field`, `Input`, `Textarea`, `fieldAria` | Label wajib, slot galat, `aria-invalid`/`aria-describedby` |
| `ui/FilterChips.tsx` | `FilterChips` | Klien; menulis state filter ke query param |
| `ui/EmptyState.tsx` | `EmptyState` | Ikon + penjelasan + aksi lanjut |
| `ui/MediaFrame.tsx` | `MediaFrame` | **Server-only.** `next/image` bila aset ada, pita empty state bila belum |
| `ui/Section.tsx` | `Section`, `PageHeader` | Ritme vertikal + latar bergantian; satu h1 per halaman |
| `ui/Skeleton.tsx` | `Skeleton`, `CardListSkeleton`, `PageLoading` | Dipakai `loading.tsx` |
| `ui/SkipToContent.tsx` | `SkipToContent` | Target `#main-content` |
| `public/Header.tsx` | `Header` | Drawer ponsel: focus trap, Escape, scroll lock, `aria-current` |
| `public/Footer.tsx` | `Footer` | Dua landmark `nav` ber-label; tanpa tautan mati |
| `public/Hero.tsx`, `StatsSection.tsx`, `AboutPreview.tsx`, `AgendaPreview.tsx`, `NewsPreview.tsx`, `GalleryPreview.tsx`, `AchievementPreview.tsx`, `MapSection.tsx` | named export | Section beranda; semua membaca repository |
| `public/MapCanvas.tsx`, `public/LeafletMap.tsx` | `MapCanvas`, default | Leaflet + OpenStreetMap, dimuat `next/dynamic` `ssr:false` |

**Semua ekspor komponen adalah *named export*** kecuali `LeafletMap` (default, syarat `next/dynamic`).

## `src/lib/`, `src/styles/`, `src/types/`

| File | Isi |
|---|---|
| `lib/repositories/` | `news.ts`, `agenda.ts`, `gallery.ts`, `achievements.ts`, `documents.ts`, `organization.ts`, `stats.ts` + `index.ts` (barrel). **Satu-satunya tempat yang boleh mengimpor `lib/data/mock-data`** |
| `lib/data/mock-data.ts` | Sumber data sementara. Diganti Prisma di P5-3 tanpa mengubah pemanggil |
| `lib/site.ts` | `site` (nama, URL, kontak, alamat) + `absoluteUrl()` |
| `lib/format.ts` | `formatDate`, `formatTime`, `formatDateRange` (id-ID, Asia/Jakarta) |
| `lib/media.ts` | `assetExists()` — **server-only**, mengecek berkas di `public/` |
| `lib/utils.ts` | `cn()` (clsx + tailwind-merge) |
| `styles/tokens.css` | Token 3 tingkat + trio status + scrim + ritme section |
| `styles/globals.css` | `@import tokens.css`, `@tailwind`, base, reduced-motion, timpaan kontrol Leaflet, utility `.civic-container` `.civic-section` `.civic-prose` `.stretched-link` `.card-subtle` |
| `types/index.ts` | `NewsStatus`, `AgendaStatus`, `AchievementLevel` + entitas domain |

## `public/`

`manifest.json` (PWA, tema `#16A34A`) · `brand/logo.svg`
Folder `images/` belum ada; `MediaFrame` otomatis menampilkan empty state sampai berkas diunggah.

## Skema data (ringkas, hindari membuka `types/index.ts`)

- News: `id slug title category excerpt content coverImage author publishedAt tags status(DRAFT|PUBLISHED|ARCHIVED)`
- Agenda: `id slug title dateStart dateEnd location organizer description status(UPCOMING|ONGOING|COMPLETED|CANCELLED) contactPerson`
- Album: `id slug title date location organizer description coverImage category photos[Photo]`
- Achievement: `level(Kecamatan..Internasional) year recipient image`
- OrganizationMember: `name role department period photoUrl bio`
- Kwarran: `name code gudepCount activeMembers address leader`
- Document: `title category type size date url description?` (+ `available`, `isExternal` dari repository)

## Alur data & token

`mock-data.ts` → `lib/repositories/*` → halaman/komponen (async, Server Component).
Token: `tokens.css` → `tailwind.config.ts` → kelas semantik (`bg-surface-subtle`, `text-text-secondary`).
Warna literal Tailwind (`green-600`, `gray-200`, …) ditolak ESLint.

## Perbarui file ini

Tambah/hapus/pindah file → perbarui `CODEMAP.md` di perubahan yang sama.
