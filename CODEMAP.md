# CODEMAP.md — Indeks Codebase

> Indeks satu-baris-per-file. Cari barisnya, baca **hanya** file itu.
> Diverifikasi 5 Okt 2026: `tsc`, `next lint`, `vitest` (40 tes), `next build` (48 halaman, DB tertanam) dan `npm run a11y` (84 pemindaian) lulus.
> **Rute publik di `src/app/(public)/`, portal di `src/app/(dashboard)/`.** Path di tabel Rute relatif terhadap grup masing-masing.
> Baca `AGENTS.md` lebih dulu. **`[P#-#]`** = task di `TASKS.md` yang masih menyentuh file itu.

## Peta Cepat

```
Ubah tampilan     → src/styles/tokens.css, tailwind.config.ts
Ubah komponen     → src/components/ui/ (primitive) · public/ (section publik) · dashboard/ (portal) · forms/ (formulir Server Action)
Ubah halaman      → src/app/<grup>/<rute>/page.tsx
Ubah data publik  → src/lib/repositories/* (baca) · src/features/content/* (tulis lewat CMS)
Ubah data anggota → src/features/members/* · gudep/* · kwarran/*
Ubah izin         → src/lib/auth/permissions.ts (matriks) · scope.ts (cakupan) — penegakan di SERVER
Ubah skema DB     → src/db/schema.ts → npm run db:generate → drizzle/
Ubah identitas    → src/lib/site.ts
Ubah konfigurasi  → next.config.mjs, package.json, tsconfig.json, .eslintrc.json
```

## Konfigurasi (root)

| File | Isi | Catatan |
|---|---|---|
| `package.json` | Next 14.2.35, React 18, Tailwind 3.4, Drizzle, zod, bcryptjs, sharp, leaflet. Script: dev/build/start/lint/typecheck/test/a11y/db:* | Dev: vitest, playwright, axe-core |
| `tsconfig.json` | strict, alias `@/*` → `src/*` | |
| `next.config.mjs` | CSP enforce, HSTS, X-Frame-Options, Permissions-Policy, COOP; `remotePatterns: []` | [P1-6] audit dependensi Next 14 |
| `tailwind.config.ts` | Warna → CSS var (surface/text/action/border(+inverse)/focus/status/brand/tag/neutral), spacing `touch` 44px | Kelas warna literal dilarang ESLint (termasuk `neutral-*`) |
| `.eslintrc.json` | `next/core-web-vitals` + `jsx-a11y` + aturan kustom | Larang warna literal, emoji, `<img>`, impor `mock-data` di luar repository |
| `vitest.config.ts` | Alias `@`, `tests/unit/**` | |
| `.github/workflows/ci.yml` | lint → typecheck → test → seed demo → build (PGlite) → axe audit | Belum pernah dijalankan di GitHub; dibuktikan secara lokal |
| `drizzle.config.ts`, `drizzle/` | Konfigurasi & migrasi SQL (`0000_init.sql`) | Migrasi PGlite otomatis; Postgres lewat `npm run db:migrate` |
| `docker-compose.yml`, `docker/db-init/` | PostgreSQL 16 + PostGIS, user aplikasi non-superuser | Belum dites di mesin ini |
| `.env.example` | Variabel yang dibaca kode | Jangan baca `.env.local`. Validasi Zod `src/lib/env.ts` belum ada [P1-2] |
| `components.json` | Konfigurasi shadcn | Menunjuk `src/styles/globals.css` |

## Skrip (`scripts/`)

| File | Fungsi |
|---|---|
| `seed.ts` | `npm run db:seed` (Kwarran + super admin dari env) · `-- --demo` data FIKTIF + 6 akun demo (sandi `demo-pramuka-2026`) |
| `migrate.ts` | Migrasi ke `DATABASE_URL` |
| `a11y-audit.mjs` | `npm run a11y`: axe-core WCAG 2.2 AA + overflow horizontal, 1280 & 390px. Butuh server jalan + data demo |
| `make-icons.mjs` | Membuat ikon PWA PNG + menyelaraskan warna `logo.svg` |
| `_archive/` | Tidak ada. `generate_pages.js` / `create_components.js` di root **usang**, jangan dijalankan |

## Dokumentasi

| File | Isi |
|---|---|
| `AGENTS.md` | Protokol agent — **titik masuk** |
| `TASKS.md` | Rencana P0–P6 + "Status Eksekusi" |
| `AI_CONTEXT.MD` | Niat desain & konvensi (masih melebih-lebihkan; kebenaran = kode + CODEMAP) |
| `docs/product/rancangan-v5.md` | Dokumen rancangan sumber V5 (niat produk, bukan status) |
| `docs/design/`, `security/`, `product/`, `operations/`, `architecture/`, `testing/` | Brief desain, kontras terukur, model otorisasi, klasifikasi data, kebijakan consent/audit/backup/unggah, MVP, deployment |
| `docs/tour/` | Video tur + tangkapan layar situs (dibuat 5 Okt 2026) |
| `skills/frontend-craft/SKILL.md` | Panduan craft frontend. Baca sebelum ubah UI |

## `src/app/(public)/` — Rute publik

| Rute | File | Catatan |
|---|---|---|
| `/` | `page.tsx` | Hero, QuickAccess (golongan), NewsPreview, DocumentCenter |
| `/tentang`, `/struktur-organisasi` | `…/page.tsx` | Struktur: pengurus dari DB + 31 Kwarran |
| `/berita`, `/agenda`, `/galeri` | `<rute>/(daftar)/page.tsx` + `loading.tsx` | **Grup `(daftar)`**: skeleton hanya untuk daftar, supaya slug asing tetap 404 sungguhan (bukan soft 404) |
| `/berita/[slug]`, `/agenda/[slug]`, `/galeri/[slug]` | `…/[slug]/page.tsx` | `dynamicParams=true` (konten baru dari CMS dirender saat diminta); slug asing → `notFound()` → 404. Lightbox: `PhotoGallery.tsx` |
| `/prestasi`, `/dokumen` | `…/page.tsx` | Filter lewat query param; unduhan divalidasi allowlist |
| `/kontak` | `kontak/page.tsx` + `ContactForm.tsx` + `actions.ts` | Server Action → tabel `contact_messages`; honeypot, time-trap, rate limit 3/10 mnt; webhook opsional |
| `/kebijakan-privasi`, `/aksesibilitas` | `…/page.tsx` | Hanya klaim yang terbukti + bagian "Yang belum berlaku". **Perbarui setiap skema data/akses berubah** |
| `/masuk` | `masuk/page.tsx` | Login nyata (`features/auth/actions.ts`), `noindex` |

## `src/app/(dashboard)/dashboard/` — Portal (login wajib, `noindex`, `force-dynamic`)

| Rute | Izin | Catatan |
|---|---|---|
| `/dashboard` | semua | Ringkasan: `PesertaHome` / `StaffHome` |
| `anggota`, `anggota/[id]`, `anggota/[id]/ubah`, `anggota/baru` | `members.*` | Cakupan per peran; deteksi duplikat; verifikasi; riwayat; data sensitif tercatat di audit |
| `anggota/impor` (+ `templat`), `anggota/ekspor` | `members.import/export` | CSV; pratinjau sebelum simpan; ekspor tercatat |
| `gudep`, `gudep/[id]`, `gudep/baru`, `gudep/[id]/ubah` | `gudep.*` | Peta sebaran + pemilih lokasi |
| `kwarran`, `kwarran/[id]` | `kwarran.manage` | |
| `pengguna`, `pengguna/[id]` | `users.manage` | Hanya peran yang boleh diberikan (`assignableRoles`) |
| `pengumuman`, `pesan`, `log`, `pengaturan`, `akun` | per izin | Log = audit (`audit.view`) |
| **`konten`** (hub) + `konten/{berita,agenda,galeri,dokumen,pengurus,prestasi}` | `content.manage` | **CMS.** Tiap bagian: `page.tsx` daftar + `[id]/page.tsx` editor (`baru` = buat). Galeri `[id]` memuat unggah foto & keterangan |
| **`kegiatan`**, **`profil`** | `self.portal` (PESERTA) | Daftar/batal kegiatan; profil tanpa alamat/telepon/wali |
| `/media/[...path]` (di `app/`) | publik | Menyajikan berkas unggahan dari `STORAGE_DIR` |
| `middleware.ts` | — | Penyaring awal (cookie ada?). **Bukan** kontrol akses |

`not-found.tsx`, `error.tsx`, `sitemap.ts`, `robots.ts` ada di `src/app/`.

## `src/components/`

| Folder / File | Catatan |
|---|---|
| `ui/` | `Button`(+`ButtonLink`), `Card`, `Badge`(+status), `Field`/`Input`/`Select`/`Textarea`, `FilterChips`, `EmptyState`, `MediaFrame` (server-only), `Section`/`PageHeader`, `Skeleton`, `SkipToContent` |
| `public/` | `Header` (drawer ponsel), `Footer`, `Hero`, `QuickAccess`, `DocumentCenter`/`Table`, `NewsPreview`, `MapSection`+`LeafletMap`, `Breadcrumbs`, dst. |
| `forms/` | `ActionForm` (+`SubmitButton`), `Fields` (`TextField`, `SelectField`, `FileField`, `CheckboxField`, `FieldGroup`) — pembungkus `useFormState` |
| `dashboard/` | `DashboardShell`, `nav.ts` (menu per izin), `ui.tsx` (`PortalHeader`, `Panel`, `Notice`, `TableWrap`, `Pagination`, `PublishBadge`, …), `ConfirmButton` (`ActionButton`), `home/`, `members/`, `gudep/`, `users/` |
| `dashboard/content/ContentForms.tsx` | Formulir CMS klien: Berita, Agenda, Album, Foto, Dokumen, Pengurus, Prestasi |
| `maps/` | `GudepMap`, `GudepMapCanvas`, `LocationPicker` (Leaflet, `ssr:false`) |

**Komponen = *named export*** kecuali `LeafletMap`. **`TableWrap` wajib `relative`** (elemen `sr-only` di dalam tabel bisa melebarkan halaman).

## `src/features/` — Logika per fitur (Server Action + query)

`auth` (login/logout/ganti sandi) · `members` (+`validation.ts`, `import.ts`) · `gudep` · `kwarran` · `users` · `announcements` · `portal` (peserta) · `site` (pengaturan beranda) · **`content`**: `news.ts`, `events.ts`, `gallery.ts`, `documents.ts`, `organization.ts` (pengurus+prestasi) menulis; `queries.ts` membaca (termasuk draf); `shared.ts` (`uniqueSlug`, waktu WIB, **`revalidatePublicSite()`** — wajib dipanggil setelah menulis konten).

## `src/lib/`, `src/db/`, `src/styles/`, `src/types/`

| File | Isi |
|---|---|
| `db/index.ts`, `db/schema.ts` | Drizzle. `DATABASE_URL` → Postgres; kosong → PGlite di `.data/pglite` (ditolak di produksi kecuali `ALLOW_PGLITE=1`). Koneksi malas |
| `lib/auth/` | `permissions.ts` (matriks 6 peran × 20 izin), `scope.ts`, `session.ts` (`requireUser`/`requirePermission`/`can`), `audit.ts`, `password.ts` |
| `lib/security/request.ts` | `clientIp`, `createRateLimiter` (in-memory, satu instance) |
| `lib/storage.ts` | Unggah: validasi magic-bytes, sharp→WebP (membuang EXIF/GPS), simpan ke `STORAGE_DIR` |
| `lib/forms.ts`, `lib/csv.ts`, `lib/domain.ts` | Util formulir Zod · CSV aman injeksi · label & konstanta kepramukaan |
| `lib/repositories/` | Baca konten **tayang** untuk situs publik. Satu-satunya yang boleh impor `lib/data/mock-data` |
| `lib/site.ts`, `format.ts`, `media.ts`, `utils.ts`, `golongan.ts` | Identitas · tanggal id-ID/WIB · `assetExists` (server-only) · `cn()` · data golongan |
| `styles/tokens.css` | Palet Scout Earth Tones: cokelat #6B4E31, pasir (`tag-*`), aksen #DC2626, token `border-inverse*` untuk footer |
| `styles/globals.css` | Tailwind, base, reduced-motion, utilitas `.civic-*`, `.stretched-link` |

## `tests/`

`tests/unit/*.test.ts` — izin & eskalasi hak, formulir, CSV (injeksi), domain/golongan/slug, kata sandi & rate limit, validasi anggota (UU PDP), waktu WIB. Jalankan `npm test`.

## `public/`

`manifest.json` (tema `#6B4E31`) · `brand/logo.svg`, `icon-192/512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`. Folder `images/` belum ada; `MediaFrame` menampilkan empty state sampai berkas diunggah.

## Alur data & token

Baca publik: `DB` → `lib/repositories/*` → halaman (Server Component). Tulis: form → `features/*` Server Action (`requirePermission` → Zod → DB → `audit()` → `revalidatePublicSite()`).
Token: `tokens.css` → `tailwind.config.ts` → kelas semantik (`bg-surface-subtle`, `text-text-secondary`).

## Perbarui file ini

Tambah/hapus/pindah file → perbarui `CODEMAP.md` di perubahan yang sama.
