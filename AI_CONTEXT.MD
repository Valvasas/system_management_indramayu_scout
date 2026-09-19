# AI_CONTEXT.MD — Rumah Pramuka Indramayu

> **Tujuan file ini:** Panduan cepat bagi AI agent agar dapat memahami seluruh codebase tanpa membaca ulang semua file. Berisi abstraksi project, bukan salinan kode penuh.

---

## 1. Project Overview

**Nama:** Rumah Pramuka Indramayu (`rumah-pramuka-indramayu`)
**Deskripsi:** Portal digital resmi & sistem informasi bertahap untuk Kwarcab (Kwartir Cabang) Gerakan Pramuka Indramayu. Mengelola keanggotaan pramuka seluruh Kabupaten Indramayu dari tingkat Penggalang, Penegak, Pandega hingga staf pembina/pelatih.

### Fase Pengembangan
| Fase | Fokus | Status |
|------|-------|--------|
| **Fase 1** | Website publik & landing page (informatif, SEO, PWA, Bahasa Indonesia) | 🔨 **Aktif — saat ini** |
| Fase 2 | Fondasi sistem internal (auth, RBAC, member registration) | Planned |
| Fase 3 | Operasional organisasi (Gudep, Kwarran, kegiatan, mutasi) | Planned |
| Fase 4 | Ekosistem digital (reporting, analytics, integrasi) | Planned |

### Problem Statement
- Data anggota tercecer di berbagai file, duplikat, tidak sinkron
- Pencarian & verifikasi data memakan waktu
- Riwayat mutasi anggota hilang
- Tidak ada kanal pusat resmi
- Kerentanan privasi data peserta didik di bawah umur

### Target Pengguna
Masyarakat umum, orang tua/wali, peserta didik (Penggalang/Penegak/Pandega), pembina, pelatih, staf admin (Gudep/Kwarran/Kwarcab), admin website, super admin.

---

## 2. Tech Stack

### Core
| Layer | Teknologi | Catatan |
|-------|-----------|---------|
| Framework | **Next.js 14** (App Router) | `next@14.2.35` |
| Language | **TypeScript** (strict mode) | Target ES2020 |
| Styling | **Tailwind CSS 3** + CSS Custom Properties (design tokens) | Token di `tokens.css` |
| Icons | **Lucide React** | `lucide-react@0.469.0` |
| Maps | **Leaflet** + OpenStreetMap | `leaflet@1.9.4` |
| UI Utility | `clsx` + `tailwind-merge` | Class merging |
| Fonts | Inter (body/UI) + DM Sans (heading) | Via `next/font/google` |

### Database (Disiapkan, belum terkoneksi di Fase 1)
| Layer | Teknologi |
|-------|-----------|
| Database | **PostgreSQL 16** + **PostGIS** |
| ORM | Prisma (planned) |
| Container | Docker (`postgis/postgis:16-3.4`) |
| Object Storage | Cloudflare R2 (planned) |

### Planned (Fase 2+)
Auth.js, React Hook Form + Zod, shadcn/ui + Radix UI, Vitest, Playwright, Sentry, Resend (email), GitHub Actions, Vercel deployment.

---

## 3. Architecture & Design Philosophy

### Arsitektur
- **Modular Monolith** — kompleksitas rendah di awal, boundary modul tetap tegas agar bisa diekstrak ke microservices di masa depan.
- **App Router** (Next.js) — file-based routing, server components by default.

### Desain Visual
- **Prinsip:** *"Calm civic system with scouting character"* — bukan startup SaaS.
- **7 Aturan:** Clarity > decoration, satu primary action per konteks, whitespace = trust, warna semantik, privasi terlihat, motion menjelaskan perubahan, aksesibel by default.
- **Warna Utama:** Green Pramuka (`#2f7d52` / `#246b45`), Neutral warm palette.
- **Tipografi:** Max 2 font — Inter (body) + DM Sans (heading).

### Larangan Desain (JANGAN dilanggar)
❌ Gradient dekoratif tanpa fungsi
❌ Glassmorphism berlebihan
❌ Emoji dekoratif
❌ Card di setiap blok
❌ Rounded-2xl/3xl default
❌ Hardcode hex color, spacing, shadow, radius (wajib pakai token)
❌ Lebih dari 1 primary CTA per konteks
❌ Button icon-only tanpa accessible label
❌ Status hanya dibedakan warna
❌ Foto wajah anak di bawah umur di halaman publik
❌ Autoplay carousel / video dengan audio
❌ Permission check hanya di frontend

### Aksesibilitas
- Target: **WCAG 2.2 Level AA**
- Touch target min 44×44px
- Focus ring visible (`2px solid var(--action-primary)`)
- `prefers-reduced-motion` support
- Skip-to-content link
- Semantic HTML landmarks
- HTML `lang="id"` (Fase 1 satu bahasa — lihat bagian Bahasa di bawah)

---

## 4. Folder Structure

```
system_management_indramayu_scout-main/
├── src/
│   ├── app/                          # Next.js App Router (pages & layouts)
│   │   ├── layout.tsx                # Root layout (fonts, metadataBase, JSON-LD, header/footer)
│   │   ├── page.tsx                  # Homepage — komposisi section components
│   │   ├── berita/page.tsx           # Daftar berita (server; filter kategori lewat ?kategori=)
│   │   ├── tentang/page.tsx          # Halaman profil, sejarah, visi-misi
│   │   ├── struktur-organisasi/page.tsx  # Struktur pengurus & 31 Kwarran
│   │   ├── sitemap.ts, robots.ts     # SEO teknis
│   │   └── error.tsx, not-found.tsx  # Batas galat & 404
│   │
│   ├── components/
│   │   ├── ui/                       # Atomic/reusable UI primitives
│   │   │   ├── Button.tsx            # Button + ButtonLink, 6 varian, 3 ukuran, semua >=44px
│   │   │   ├── Card.tsx              # Compound component (Header/Content/Footer), prop `as`
│   │   │   ├── Badge.tsx             # Badge + AgendaStatusBadge/FileTypeBadge/CategoryBadge (ikon + teks)
│   │   │   ├── Field.tsx             # Field + Input + Textarea + fieldAria
│   │   │   ├── FilterChips.tsx       # Chip filter yang menulis state ke query param
│   │   │   ├── EmptyState.tsx        # Ikon + penjelasan + aksi lanjut
│   │   │   ├── MediaFrame.tsx        # next/image bila aset ada, empty state bila belum (server-only)
│   │   │   ├── Section.tsx           # Section + PageHeader (ritme & hierarki)
│   │   │   ├── Skeleton.tsx          # Rangka muat untuk loading.tsx
│   │   │   └── SkipToContent.tsx     # WCAG bypass block link
│   │   │
│   │   └── public/                   # Homepage section components
│   │       ├── Header.tsx            # Sticky header, nav links, mobile drawer
│   │       ├── Footer.tsx            # Kontak, alamat, jam operasional, sosial
│   │       ├── Hero.tsx              # Hero banner + dual CTA
│   │       ├── StatsSection.tsx      # 4 metric cards (anggota, gudep, kwarran, kegiatan)
│   │       ├── NewsPreview.tsx       # 3 berita terbaru
│   │       ├── AgendaPreview.tsx     # Agenda kegiatan terdekat
│   │       ├── AboutPreview.tsx      # Ringkasan tentang organisasi
│   │       ├── AchievementPreview.tsx# Prestasi/penghargaan
│   │       ├── GalleryPreview.tsx    # Grid foto kegiatan
│   │       └── MapSection.tsx        # Peta lokasi sekretariat + kontak
│   │
│   ├── lib/
│   │   ├── repositories/             # SATU-SATUNYA pintu akses data (news, agenda, gallery,
│   │   │                             # achievements, documents, organization, stats)
│   │   ├── data/
│   │   │   └── mock-data.ts          # Sumber sementara; hanya boleh diimpor repositories
│   │   ├── site.ts                   # Identitas situs (nama, URL, kontak) untuk metadata/SEO
│   │   ├── format.ts                 # formatDate/formatTime/formatDateRange (id-ID, WIB)
│   │   ├── media.ts                  # assetExists() — cek berkas di public/ (server-only)
│   │   └── utils.ts                  # cn()
│   │
│   ├── styles/
│   │   ├── globals.css               # Entry CSS — tokens + tailwind + base a11y + utility
│   │   └── tokens.css                # Design tokens (CSS custom properties)
│   │
│   └── types/
│       └── index.ts                  # Domain interfaces (NewsItem, AgendaItem, KwarranInfo, dll)
│
├── docs/                             # Dokumentasi proyek lengkap
│   ├── architecture/
│   │   └── architecture-overview.md  # Tech stack, konvensi, struktur repo
│   ├── design/
│   │   ├── design-brief.md           # Arah desain & prinsip visual
│   │   ├── visual-principles.md      # Design tokens, tipografi, shadcn/radix usage
│   │   ├── motion-guidelines.md      # Aturan animasi & durasi
│   │   └── accessibility-checklist.md# WCAG 2.2 AA checklist
│   ├── product/
│   │   ├── product-vision.md         # Visi, misi, fase, target pengguna
│   │   ├── mvp-scope.md              # Scope Fase 1 (included/excluded)
│   │   └── content-inventory.md      # Kebutuhan konten awal
│   ├── operations/
│   │   ├── deployment-guide.md       # Vercel, CI/CD, branching strategy
│   │   └── development-setup.md      # Prasyarat, Docker, Prisma, menjalankan dev
│   ├── security/
│   │   ├── authorization-model.md    # RBAC hierarkis + scoped permissions
│   │   ├── data-classification.md    # 4 tier klasifikasi data (Publik→Sangat Sensitif)
│   │   ├── consent-policy.md         # Consent wali untuk anak (UU PDP)
│   │   ├── audit-log-policy.md       # Append-only audit trail
│   │   ├── backup-policy.md          # Daily backup, 30 hari retensi
│   │   └── file-upload-policy.md     # Validasi, rename UUID, signed URL
│   └── testing/
│       └── testing-strategy.md       # Vitest, Playwright, axe-core, coverage target
│
├── skills/frontend-craft/SKILL.md    # AI skill: panduan craft frontend & verifikasi UI
├── public/
│   ├── manifest.json                 # PWA manifest (standalone, theme green)
│   └── brand/                        # Asset branding (logo SVG)
│
├── generate_pages.js                 # Script scaffold halaman Next.js (one-time generator)
├── package.json                      # Dependencies & scripts
├── tailwind.config.ts                # Tailwind config (token-based colors, custom shadows)
├── tsconfig.json                     # TypeScript config (strict, path alias @/*)
├── next.config.mjs                   # Next.js config (strict mode, unoptimized images)
├── postcss.config.mjs                # PostCSS (tailwindcss + autoprefixer)
├── docker-compose.yml                # PostgreSQL + PostGIS container
├── .env.example                      # Template environment variables
└── .env.local                        # Local environment (gitignored)
```

---

## 5. Key Files & Routing

### Routing Map (App Router) — Semua Halaman Publik Fase 1 Lengkap
| Route | File | Deskripsi | Render Mode |
|-------|------|-----------|-------------|
| `/` | `app/page.tsx` | Homepage — komposisi 8 section | Server |
| `/tentang` | `app/tentang/page.tsx` | Profil, sejarah, visi-misi, Dasa Darma | Client |
| `/struktur-organisasi` | `app/struktur-organisasi/page.tsx` | Pengurus Kwarcab + 31 Kwarran | Client |
| `/berita` | `app/berita/page.tsx` | Daftar berita + filter kategori | Client |
| `/berita/[slug]` | `app/berita/[slug]/page.tsx` | Detail artikel berita + share | Client |
| `/agenda` | `app/agenda/page.tsx` | Kalender agenda + filter status | Client |
| `/agenda/[slug]` | `app/agenda/[slug]/page.tsx` | Detail agenda kegiatan | Client |
| `/galeri` | `app/galeri/page.tsx` | Daftar album foto kegiatan | Client |
| `/galeri/[slug]` | `app/galeri/[slug]/page.tsx` | Detail album + modal lightbox | Client |
| `/prestasi` | `app/prestasi/page.tsx` | Rekam jejak prestasi (table/card) | Client |
| `/dokumen` | `app/dokumen/page.tsx` | Pusat unduhan berkas resmi + search | Client |
| `/kontak` | `app/kontak/page.tsx` | Info kantor + form aspirasi | Client |
| `/kebijakan-privasi` | `app/kebijakan-privasi/page.tsx` | Kebijakan privasi & UU PDP | Server |
| `/aksesibilitas` | `app/aksesibilitas/page.tsx` | Komitmen WCAG 2.2 AA & shortcuts | Server |
| `/masuk` | `app/masuk/page.tsx` | Portal login KTA vs Staf (UI only) | Client |
| `not-found.tsx` | `app/not-found.tsx` | Halaman 404 Jejak Pramuka | Server |

### Data Flow
```
mock-data.ts (static) → components → pages
     ↑
  types/index.ts (contracts)
```

Data saat ini sepenuhnya statis dari `mock-data.ts`. Belum ada API routes atau database connection.

---

## 6. Coding Conventions

### Penamaan
| Konteks | Convention | Contoh |
|---------|-----------|--------|
| File/folder/URL | `kebab-case` | `struktur-organisasi/page.tsx` |
| Komponen React | `PascalCase` | `NewsPreview`, `AgendaPreview` |
| Tipe TypeScript | `PascalCase` | `NewsItem`, `KwarranInfo` |
| Fungsi/variabel | `camelCase` | `mockNews`, `setLanguage` |
| CSS variables | `kebab-case` | `--surface-base`, `--brand-500` |
| Tabel database | `snake_case` | (planned) |
| Konstanta | `UPPER_SNAKE_CASE` | (planned) |

### Design Token System (3-Tier)
```
Primitives (--green-600, --neutral-200)
  → Semantics (--action-primary, --surface-raised, --text-secondary)
    → Brand Aliases (--brand-500, --brand-700)
```
**ATURAN:** Selalu gunakan token CSS variable → Tailwind config token. **JANGAN** hardcode hex, px spacing, shadow value.

### Komponen Pattern
- **Atomic UI** (`components/ui/`): Reusable, forwardRef, variant-based, a11y-first
- **Section Components** (`components/public/`): Komposisi atomic → section homepage
- **Page Components** (`app/*/page.tsx`): Komposisi section → halaman penuh
- **Compound Components**: Card menggunakan pola `Card` + `CardHeader` + `CardContent` + `CardFooter`

### Bahasa (keputusan 19 Sep 2026 — TASKS.md P2-8 Jalur A)
Fase 1 **Bahasa Indonesia saja**. `LanguageProvider`, `translations.ts`, dan
`LanguageSelector` sudah dihapus: selektornya tidak pernah tersambung ke context
(memakai state lokal sendiri) dan hanya judul yang diterjemahkan, sehingga
klaim tiga bahasa tidak pernah benar. `<html lang="id">` statis.
Bila multibahasa dibutuhkan, kerjakan penuh lewat routing `[locale]` (Jalur B),
bukan mengembalikan pola `t("key") || "fallback"`.

### Import Alias & akses data
```tsx
import { getNews } from '@/lib/repositories'   // ✅ halaman & komponen
import { mockNews } from '@/lib/data/mock-data' // ❌ ditolak ESLint di luar repositories
```

---

## 7. Security & Privacy Principles

- **UU PDP (No. 27/2022)** — Kepatuhan perlindungan data pribadi Indonesia
- **Data anak di bawah umur** — Foto wajah DILARANG di halaman publik, wajib consent wali
- **4-tier klasifikasi data:** Publik → Internal → Sensitif → Sangat Sensitif
- **RBAC hierarkis** — Role + Scope (Kwarcab/Kwarran/Gudep/Event/Personal)
- **Audit log** — Append-only, immutable, retensi 1-3 tahun
- **File upload** — UUID rename, MIME validation server-side, signed URL untuk file privat

---

## 8. Current Focus & Status

> **Status terverifikasi 19 Sep 2026.** `tsc --noEmit` exit 0 · `next lint` bersih ·
> `next build` exit 0 (30 halaman). Sumber kebenaran status ada di `TASKS.md`
> bagian "Status Eksekusi" — bukan di dokumen ini.

### ✅ Terpasang & terverifikasi
- 15 rute publik + `not-found` + `error` + `sitemap.xml` + `robots.txt`
- Beranda 8 section, seluruhnya Server Component yang membaca `lib/repositories`
- Design token 3 tingkat → Tailwind; nol warna literal (ditegakkan ESLint)
- UI primitives: `Button`/`ButtonLink`, `Card`, `Badge` (+status/kategori/berkas),
  `Field`/`Input`/`Textarea`, `FilterChips`, `EmptyState`, `MediaFrame`,
  `Section`/`PageHeader`, `Skeleton`, `SkipToContent`
- Lapisan akses data `lib/repositories/` (7 modul async) — siap ditukar ke Prisma
- Metadata unik + canonical per rute; JSON-LD Organization/NewsArticle/Event
- Header drawer ponsel & lightbox galeri: focus trap, Escape, fokus kembali (teruji)
- Peta Leaflet + OpenStreetMap nyata di beranda
- Keamanan: CSP enforce, HSTS, X-Frame-Options, Permissions-Policy, COOP;
  optimizer gambar aktif tanpa host luar; unduhan dokumen divalidasi allowlist
- Aksesibilitas terukur: nol pelanggaran kontras & heading pada 15 rute @390px;
  nol overflow horizontal pada 360/768/1920px

### 🔨 Belum ada (jangan diklaim di dokumen mana pun)
- Basis data: tidak ada `prisma/schema.prisma`, migrasi, maupun seed
- Auth & RBAC: belum ada; `/masuk` sengaja hanya halaman status
- Pengujian: nol tes (Vitest/Playwright/axe-core) dan belum ada CI/CD
- Konten media riil: foto kegiatan & PDF resmi belum diunggah ke `public/`
- Validasi env dengan Zod; Prettier + Husky/lint-staged

### 📋 Backlog (Fase 2+)
- Auth system (Auth.js + approval flow)
- Database connection (Prisma + PostgreSQL)
- Member registration & management
- Admin panel konten
- RBAC implementation
- Audit logging
- File upload system
- Email notifications

---

## 9. Quick Reference Commands

```bash
# Development
pnpm dev              # Start dev server → http://localhost:3000
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint check

# Database (Docker)
docker compose up -d  # Start PostgreSQL + PostGIS
docker compose down   # Stop database

# Prisma (Fase 2+)
pnpm prisma generate  # Generate Prisma client
pnpm prisma db push   # Sync schema (rapid prototyping)
pnpm prisma migrate dev  # Create migration

# Testing (Fase 2+)
pnpm test             # Unit & integration tests
pnpm test:e2e         # End-to-end tests
pnpm test:coverage    # Coverage report
```

---

## 10. Catatan Penting untuk AI Agent

1. **Baca dokumen `docs/` yang relevan** sebelum mengubah area tertentu (design → `docs/design/`, security → `docs/security/`)
2. **Selalu gunakan design tokens** — jangan hardcode warna, spacing, shadow
3. **Perhatikan aksesibilitas** — setiap komponen harus keyboard-navigable, punya focus state, dan semantic HTML
4. **Data anak = sangat sensitif** — jangan tampilkan foto wajah anak di halaman publik
5. **Cek `generate_pages.js`** — berisi template/scaffold untuk semua halaman yang belum dibuat
6. **Bahasa** — tulis langsung dalam Bahasa Indonesia; tidak ada kamus terjemahan di Fase 1
7. **Komponen baru** → taruh di `components/ui/` (atomic) atau `components/public/` (section)
8. **Path alias** — gunakan `@/` untuk import dari `src/`
9. **Client component** — tambahkan `"use client"` hanya jika perlu (state, effects, event handlers)
10. **Skill `frontend-craft`** — baca `skills/frontend-craft/SKILL.md` sebelum mengubah UI
