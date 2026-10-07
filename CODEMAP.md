# CODEMAP.md — Indeks Codebase

> Indeks satu-baris-per-file. Cari barisnya, baca **hanya** file itu.
> Diverifikasi 5 Okt 2026: `tsc`, `next lint`, `vitest` (54 tes), `next build` (94 halaman, DB tertanam), `npm run a11y` (118 pemindaian, 0 pelanggaran) dan `npm run e2e` (12/12) lulus.
> **Rute publik di `src/app/(public)/`, portal di `src/app/(dashboard)/`.** Path di tabel Rute relatif terhadap grup masing-masing.
> Baca `AGENTS.md` lebih dulu. **`[P#-#]`** = task di `TASKS.md` yang masih menyentuh file itu.

## Peta Cepat

```
Ubah tampilan     → docs/design/design-system.md, src/styles/tokens.css, tailwind.config.ts
Ubah ilustrasi    → src/components/illustrations/Scenes.tsx (+ geometry.ts)
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
| `package.json` | Next 14.2.35, React 18, Tailwind 3.4, Drizzle, zod, bcryptjs, sharp, leaflet. Script: dev/build/start/lint/format/format:check/typecheck/test/a11y/e2e/db:* | Dev: vitest, playwright, axe-core, prettier, husky, lint-staged |
| `tsconfig.json` | strict, alias `@/*` → `src/*` | |
| `next.config.mjs` | Header keamanan semua rute (HSTS, XFO, Permissions-Policy, COOP) + CSP statis (kecuali `/dashboard`, `/masuk`); `instrumentationHook`; `remotePatterns: []` | Kebijakan CSP di `src/lib/security/csp.mjs`. [P1-6] audit dependensi Next 14 |
| `tailwind.config.ts` | Warna → CSS var (surface/text/action/border(+inverse)/focus/status/brand/tag/neutral), spacing `touch` 44px | Kelas warna literal dilarang ESLint (termasuk `neutral-*`) |
| `.eslintrc.json` | `next/core-web-vitals` + `jsx-a11y` + aturan kustom | Larang warna literal, emoji, `<img>`, impor `mock-data` di luar repository |
| `vitest.config.ts` | Alias `@`, `tests/unit/**` | |
| `.github/workflows/ci.yml` | format:check → lint → typecheck → test → seed demo → build (PGlite) → server → axe+CSP audit → e2e | Belum pernah dijalankan di GitHub; dibuktikan secara lokal |
| `.prettierrc.json`, `.prettierignore`, `.husky/pre-commit`, `.git-blame-ignore-revs` | Prettier (lebar 140, kutip tunggal); pre-commit = lint-staged (prettier + eslint) | Markdown & `drizzle/` tidak diformat |
| `drizzle.config.ts`, `drizzle/` | Migrasi SQL: `0000` init · `0001` kode akses/mutasi/REVIEW · `0002` rate_limits · `0003` rantai audit · `0004`* log INSERT-only (trigger + REVOKE) · `0005` MFA · `0006` persetujuan wali · `0007`* migrasi tanggal manual → LEGACY · `0008` anonimisasi · `0009` backup_runs · `0010`* user app baca jurnal migrasi | `*` = `drizzle-kit generate --custom` (SQL ditulis tangan, satu-satunya pengecualian). PGlite otomatis; Postgres `npm run db:migrate` (pemilik skema) |
| `docker-compose.yml`, `docker/db-init/` | PostgreSQL 16 + PostGIS, user aplikasi non-superuser (`APP_DB_PASSWORD` terpisah) | Skrip init + migrasi + REVOKE + backup diuji di PostgreSQL 16 lokal (bukan Docker) |
| `.env.example` | Semua variabel yang dibaca kode + penjelasan | Jangan baca `.env.local`. Divalidasi `src/lib/env.ts` |
| `components.json` | Konfigurasi shadcn | Menunjuk `src/styles/globals.css` |

## Skrip (`scripts/`)

| File | Fungsi |
|---|---|
| `seed.ts` | `npm run db:seed` (Kwarran + super admin dari env) · `-- --demo` data FIKTIF + 6 akun demo (sandi `demo-pramuka-2026`) |
| `migrate.ts` | Migrasi ke `DATABASE_URL` |
| `a11y-audit.mjs` | `npm run a11y`: axe-core WCAG 2.2 AA + overflow horizontal + header CSP & pelanggaran CSP runtime, 1280 & 390px. Butuh server jalan + data demo |
| `e2e-portal.mjs` | `npm run e2e`: lupa sandi → kode akses, mutasi, review berita, CSV pendaftar, CSP ber-nonce portal. **Mengubah data**, pakai data demo segar |
| `make-icons.mjs` | Membuat ikon PWA PNG + menyelaraskan warna `logo.svg` |
| `encrypt-backfill.ts` | `npm run db:encrypt-backfill` (`--dry-run`): enkripsi data lama & rotasi kunci, idempoten |
| `retention.ts` | `npm run db:retention` (`--dry-run`): retensi terjadwal; jalankan dengan pemilik skema |
| `backup.ts` | `npm run db:backup` (`--verify`): pg_dump / dump PGlite + checksum + uji pulih |
| `permission-matrix.ts` | `npm run docs:matrix`: tabel izin untuk `authorization-model.md` (dicek tes) |

## Dokumentasi

| File | Isi |
|---|---|
| `AGENTS.md` | Protokol agent — **titik masuk** |
| `TASKS.md` | Rencana P0–P6 + "Status Eksekusi" |
| `AI_CONTEXT.MD` | Niat desain & konvensi (masih melebih-lebihkan; kebenaran = kode + CODEMAP) |
| `docs/product/rancangan-v5.md` | Dokumen rancangan sumber V5 (niat produk, bukan status) |
| `docs/design/design-system.md` | Design system "Hutan & Lapangan": warna, tipografi, radius, ilustrasi, gerak, pola halaman |
| `docs/design/`, `security/`, `product/`, `operations/`, `architecture/`, `testing/` | Brief desain, kontras terukur, model otorisasi, klasifikasi data, kebijakan consent/audit/backup/unggah, MVP, deployment |
| `docs/operations/retention.md`, `monitoring.md` | Retensi & anonimisasi + jadwal · health, Sentry, backup & prosedur uji pulih |
| `docs/tour/` | Video tur + tangkapan layar situs (dibuat 5 Okt 2026) |
| `skills/frontend-craft/SKILL.md` | Panduan craft frontend. Baca sebelum ubah UI |

## `src/app/(public)/` — Rute publik

| Rute | File | Catatan |
|---|---|---|
| `/` | `page.tsx` | `components/public/home/*`: HomeHero (pintasan "Saya ingin…"), StatsBand, GolonganPaths, UpcomingAgenda, NewsFeature, GalleryMosaic, AchievementStrip, WilayahTeaser, JoinCta |
| `/golongan`, `/golongan/[id]` | `golongan/…` | Data statis `lib/golongan.ts` (5 golongan) + jumlah anggota aktif dari DB |
| `/bergabung` | `bergabung/page.tsx` | Jalur per kebutuhan (orang tua, pembina, pindah gudep) + FAQ + tautan ke `/wilayah` |
| `/wilayah`, `/wilayah/[slug]` | `wilayah/…` | `KwarranFinder` (saring kecamatan) · 31 kwarran, agregat gudep/anggota (`lib/repositories/wilayah.ts`) |
| `/cari` | `cari/page.tsx` | Pencarian lintas konten (`lib/search.ts`) |
| `/agenda/kalender.ics`, `/agenda/[slug]/kalender.ics` | `route.ts` | iCalendar (`lib/ics.ts`) |
| `/tentang`, `/struktur-organisasi` | `…/page.tsx` | Struktur: pengurus dari DB + 31 Kwarran |
| `/berita`, `/agenda`, `/galeri` | `<rute>/(daftar)/page.tsx` + `loading.tsx` | **Grup `(daftar)`**: skeleton hanya untuk daftar, supaya slug asing tetap 404 sungguhan (bukan soft 404) |
| `/berita/[slug]`, `/agenda/[slug]`, `/galeri/[slug]` | `…/[slug]/page.tsx` | `dynamicParams=true` (konten baru dari CMS dirender saat diminta); slug asing → `notFound()` → 404. Lightbox: `PhotoGallery.tsx` |
| `/prestasi`, `/dokumen` | `…/page.tsx` | Filter lewat query param; unduhan divalidasi allowlist |
| `/kontak` | `kontak/page.tsx` + `ContactForm.tsx` + `actions.ts` | Server Action → tabel `contact_messages`; honeypot, time-trap, rate limit 3/10 mnt; webhook opsional |
| `/kebijakan-privasi`, `/aksesibilitas` | `…/page.tsx` | Hanya klaim yang terbukti + bagian "Yang belum berlaku". **Perbarui setiap skema data/akses berubah** |
| `/masuk`, `/masuk/lupa-sandi`, `/masuk/kode`, `/masuk/verifikasi` | `masuk/…` | Login; reset ke pembina (tanpa email); kode akses → sandi sendiri; **verifikasi** = langkah MFA (sesi `mfa_pending`). `noindex`. `/masuk` & `/masuk/verifikasi` wajib dinamis (CSP nonce) |
| `/persetujuan-wali` | `persetujuan-wali/page.tsx` + `components/public/GuardianConsentFlow.tsx` | Wali memakai kode sekali pakai, memilih per cakupan. `noindex` |
| `/api/health` (di `app/api`) | `api/health/route.ts` | 200/503 + cek DB, tanpa detail konfigurasi |

## `src/app/(dashboard)/dashboard/` — Portal (login wajib, `noindex`, `force-dynamic`)

| Rute | Izin | Catatan |
|---|---|---|
| `/dashboard` | semua | Ringkasan: `PesertaHome` / `StaffHome` |
| `anggota`, `anggota/[id]`, `anggota/[id]/ubah`, `anggota/baru` | `members.*` | Cakupan per peran; deteksi duplikat; verifikasi; riwayat; data sensitif tercatat di audit |
| `anggota/impor` (+ `templat`), `anggota/ekspor` | `members.import/export` | CSV; pratinjau sebelum simpan; ekspor tercatat |
| `gudep`, `gudep/[id]`, `gudep/baru`, `gudep/[id]/ubah` | `gudep.*` | Peta sebaran + pemilih lokasi |
| `kwarran`, `kwarran/[id]` | `kwarran.manage` | |
| `pengguna`, `pengguna/[id]` | `users.manage` | Hanya peran yang boleh diberikan (`assignableRoles`) |
| `akses` | `users.manage`/`members.manage` | Antrean permintaan reset → terbitkan kode akses sekali pakai |
| `mutasi` | `members.*` | Pengajuan & persetujuan mutasi antar-gudep (cakupan tujuan) |
| `pendaftaran`, `pendaftaran/[id]` (+`ekspor`) | `content.manage` | Pendaftar per kegiatan + unduh CSV |
| `kontribusi`, `kontribusi/[id]` | `content.contribute` | Staf gudep/kwarran menulis berita → status REVIEW → editor terbitkan/kembalikan |
| `pengumuman`, `pesan`, `log`, `pengaturan`, `akun` | per izin | Log = audit (`audit.view`) |
| `log/integritas` | `audit.verify` | Verifikasi rantai HMAC log + kepala rantai |
| `akun/mfa` | login | Daftar/kelola TOTP; satu-satunya halaman yang terbuka saat tenggang MFA habis |
| `persetujuan` | `members.read` | Pusat persetujuan wali (anak < 18 dalam cakupan). Minta kode & catat pencabutan di detail anggota (`ConsentPanel`) |
| `backup` | `system.backup` | Backup manual, uji pulih, riwayat |
| **`konten`** (hub) + `konten/{berita,agenda,galeri,dokumen,pengurus,prestasi}` | `content.manage` | **CMS.** Tiap bagian: `page.tsx` daftar + `[id]/page.tsx` editor (`baru` = buat). Galeri `[id]` memuat unggah foto & keterangan |
| **`kegiatan`**, **`profil`** | `self.portal` (PESERTA) | Daftar/batal kegiatan; profil tanpa alamat/telepon/wali |
| `/media/[...path]` (di `app/`) | publik | Menyajikan berkas unggahan dari `STORAGE_DIR` |
| `middleware.ts` | — | Penyaring awal (cookie ada?) — **bukan** kontrol akses — + CSP ber-nonce untuk `/dashboard/*` & `/masuk` (wajib dinamis) |
| `instrumentation.ts` | — | Saat server start: validasi env (fail-fast) |

`not-found.tsx`, `error.tsx`, `sitemap.ts`, `robots.ts` ada di `src/app/`.

## `src/components/`

| Folder / File | Catatan |
|---|---|
| `ui/` | `Button`(+`ButtonLink`, varian `inverse`, bentuk pill), `Card`, `Badge`(+status), `Field`/`Input`/`Select`/`Textarea`, `FilterChips`, `EmptyState` (`scene`/`icon`), `MediaFrame` (server-only), `Reveal`, `Section`/`PageHeader`/`PageHero`, `Skeleton`, `SkipToContent` |
| `illustrations/` | `Scenes.tsx`: `HeroLandscape`, `SceneStrip`, `TreeLine`, `Hills`, `GolonganArt`, `EmptyCamp`, `PineMark`, `CompassRose` · `geometry.ts` generator ber-seed |
| `public/` | `Header` (drawer layar penuh), `Footer`, `home/*` (section beranda), `KwarranFinder`, `ReadingProgress`, `DocumentCenter`/`Table`, `LeafletMap`/`MapCanvas`, `GolonganIcon`, `Breadcrumbs` |
| `forms/` | `ActionForm` (+`SubmitButton`), `Fields` (`TextField`, `SelectField`, `FileField`, `CheckboxField`, `FieldGroup`) — pembungkus `useFormState` |
| `dashboard/` | `DashboardShell` (sidebar hutan + bilah bawah ponsel + bottom sheet), `nav.ts` (menu per izin + lencana antrean), `ui.tsx` (`PortalWelcome`, `PortalHeader`, `Panel`, `Notice`, `TableWrap`, `Pagination`, `PublishBadge`, …), `ConfirmButton` (`ActionButton`), `home/`, `members/` (+`TransferForms`), `gudep/`, `users/` (+`IssueCodeForm`) |
| `dashboard/content/ContentForms.tsx` | Formulir CMS klien: Berita, Agenda, Album, Foto, Dokumen, Pengurus, Prestasi |
| `dashboard/consent/` | `ConsentBadge` (ikon + teks), `ConsentPanel` (status, riwayat, minta kode, catat pencabutan) |
| `dashboard/QrCode.tsx`, `MfaForms.tsx`, `MfaGraceNotice.tsx`, `users/MfaAdminPanel.tsx` | QR SVG dari matriks (server) · formulir kode yang menampilkan kode pemulihan sekali · pengingat tenggang · reset MFA Super Admin |
| `maps/` | `GudepMap`, `GudepMapCanvas`, `LocationPicker` (Leaflet, `ssr:false`) |

**Komponen = *named export*** kecuali `LeafletMap`. **`TableWrap` wajib `relative`** (elemen `sr-only` di dalam tabel bisa melebarkan halaman).

## `src/features/` — Logika per fitur (Server Action + query)

`auth` (login/logout/ganti sandi; `access-codes.ts` + `access-actions.ts` = kode akses & permintaan reset; **`mfa.ts` + `mfa-actions.ts`** = TOTP, kode pemulihan, verifikasi masuk, reset Super Admin) · **`consent`** (`texts.ts` teks berversi, `status.ts` aturan murni, `consent.ts` + `consent-actions.ts`) · **`retention/retention.ts`** · **`backup/`** (`backup.ts`, `backup-actions.ts`) · `members` (+`validation.ts`, `import.ts`, `transfers.ts` + `transfer-actions.ts` = mutasi, `anonymize.ts` = hak subjek data) · `gudep` · `kwarran` · `users` · `announcements` · `portal` (peserta) · `site` (pengaturan beranda) · **`content`**: `news.ts` (+kembalikan ke penulis), `contributions.ts` (kontributor), `events.ts`, `gallery.ts`, `documents.ts`, `organization.ts` (pengurus+prestasi) menulis; `queries.ts` membaca (termasuk draf); `shared.ts` (`uniqueSlug`, waktu WIB, **`revalidatePublicSite()`** — wajib dipanggil setelah menulis konten).

## `src/lib/`, `src/db/`, `src/styles/`, `src/types/`

| File | Isi |
|---|---|
| `db/index.ts`, `db/schema.ts` | Drizzle. `DATABASE_URL` → Postgres; kosong → PGlite di `.data/pglite` (ditolak di produksi kecuali `ALLOW_PGLITE=1`). Koneksi malas |
| `db/encrypted-text.ts`, `db/encrypt-backfill.ts` | `encryptedText()` customType (AES-GCM transparan, kolom tak bisa dicari) + `ENCRYPTED_COLUMNS` · backfill/rotasi |
| `lib/auth/` | `permissions.ts` (matriks 6 peran, `SUPER_ADMIN_ONLY`), `permission-matrix.ts`, `scope.ts`, `session.ts` (`requireUser`/`requirePermission`/`can`, sesi `mfaPending`, kunci tenggang MFA), `audit.ts` → `audit-chain.ts` (rantai HMAC, verifikasi), `password.ts`, `access-code.ts`, `totp.ts` (RFC 6238), `mfa-policy.ts` |
| `lib/env.ts` | **Satu-satunya pembaca `process.env`.** `publicEnv` (aman di klien) · `serverEnv()` Zod, di-cache; galat tanpa nilai |
| `lib/security/request.ts` | `clientIp`, `userAgent` |
| `lib/security/rate-limit.ts` | `createRateLimiter(max, ms, { scope, failClosed })` di tabel `rate_limits` (bersama antar-instance, kunci HMAC) |
| `lib/security/crypto.ts` | AES-256-GCM berformat `enc:v1:<keyId>:…`, rotasi, `blindIndex()` (HMAC). Kunci dev publik bila env kosong |
| `lib/monitoring.ts` | `reportError()` → Sentry envelope bila `SENTRY_DSN`; `scrub()` menyamarkan data pribadi |
| `lib/security/csp.mjs` | `buildCsp({dev, nonce})`, `usesNonceCsp`, `STATIC_CSP_SOURCE` — dipakai `next.config.mjs` & middleware |
| `lib/json-ld.ts` | `jsonLdHtml()` — JSON-LD aman di `<script>` (escape `<>&`). Wajib untuk semua JSON-LD |
| `lib/storage.ts` | Unggah: validasi magic-bytes, sharp→WebP (membuang EXIF/GPS), simpan ke `STORAGE_DIR` |
| `lib/forms.ts`, `lib/csv.ts`, `lib/domain.ts` | Util formulir Zod · CSV aman injeksi · label & konstanta kepramukaan |
| `lib/repositories/` | Baca konten **tayang** untuk situs publik. Satu-satunya yang boleh impor `lib/data/mock-data` |
| `lib/site.ts`, `format.ts`, `media.ts`, `utils.ts`, `golongan.ts` | Identitas (+`mark`, koordinat) · tanggal id-ID/WIB · `assetExists` (server-only) · `cn()` (paham `text-display-*`) · data golongan |
| `lib/ics.ts`, `search.ts`, `reading.ts` | iCalendar · pencarian konten · waktu baca & paragraf |
| `styles/tokens.css` | Palet "Hutan & Lapangan": forest/moss/bark/sand/sky/ember/stone → token semantic; `--ill-*` khusus SVG |
| `styles/globals.css` | Tailwind, base, reduced-motion, `.civic-*`, `.eyebrow`, `.topo`, `.lift`, `[data-reveal]`, `.stretched-link` |

## `tests/`

`tests/unit/*.test.ts` — izin & eskalasi hak, formulir, CSV (injeksi), domain/golongan/slug, kata sandi, validasi anggota (UU PDP), waktu WIB, iCalendar, pencarian, kode akses, env, CSP & JSON-LD, kripto, TOTP (vektor RFC), MFA, persetujuan, monitoring, sinkron dokumen otorisasi.
`tests/integration/*.test.ts` — **SQL sungguhan** di PGlite in-memory (`tests/helpers/test-db.ts`, migrasi asli, clone per tes): rate limit bersama, enkripsi + backfill, rantai audit & trigger, MFA, persetujuan wali (IDOR), retensi (termasuk `SET ROLE` tanpa hak DELETE), anonimisasi, backup. Alur portal: `npm run e2e`. Jalankan `npm test`.

## `public/`

`manifest.json` (tema `#6B4E31`) · `brand/logo.svg`, `mark.svg` (tanda persegi, placeholder), `icon-192/512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`. Folder `images/` belum ada; `MediaFrame` menampilkan empty state sampai berkas diunggah.

## Alur data & token

Baca publik: `DB` → `lib/repositories/*` → halaman (Server Component). Tulis: form → `features/*` Server Action (`requirePermission` → Zod → DB → `audit()` → `revalidatePublicSite()`).
Env: **hanya** lewat `src/lib/env.ts` (`serverEnv()`, `publicEnv`). Variabel baru → skema + `RULES` di `env.ts` + `.env.example`.
Token: `tokens.css` → `tailwind.config.ts` → kelas semantik (`bg-surface-subtle`, `text-text-secondary`).

## Perbarui file ini

Tambah/hapus/pindah file → perbarui `CODEMAP.md` di perubahan yang sama.
