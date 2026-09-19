# TASKS.md — Rencana Perbaikan & Upgrade

> **Proyek:** Rumah Pramuka Indramayu (Kwarcab Gerakan Pramuka Indramayu)
> **Disusun:** 19 September 2026
> **Basis audit:** `generate_pages.js`, `create_components.js`, `tailwind.config.ts`, `package.json`, `next.config.mjs`, `docker-compose.yml`, `components.json`, `AI_CONTEXT.MD`, `PERBAIKAN.md`
> **Cara pakai:** kerjakan blok **P0 → P6** berurutan. P0 adalah blocker mutlak — tanpa itu proyek tidak bisa di-build sama sekali. Setiap task punya *Masalah*, *Aksi*, dan *Selesai bila* (acceptance criteria) supaya bisa dieksekusi AI agent tanpa tebak-tebakan.

---

## Status Eksekusi (diperbarui 19 Sep 2026)

**Checkpoint P0 tercapai:** `tsc --noEmit` exit 0 · `next build` exit 0 · 15/15 halaman ter-generate.

| Task | Status | Catatan |
|---|---|---|
| P0-1 satukan direktori | SELESAI sebagian | Salinan bersarang diarsipkan (dipindah ke luar proyek), `AI_CONTEXT.MD` digabung, `exclude` tsconfig dihapus. **Belum:** perataan 4 lapis folder induk `Project P/Project P/Project P/` |
| P0-2 `.gitignore` + git init | SELESAI sebagian | `.gitignore` dibuat. **`git init` belum:** Git tidak terpasang di mesin ini |
| P0-3 pulihkan source | SELESAI | Dari GitHub (`Valvasas/system_management_indramayu_scout`, folder bersarang = versi lengkap). Bukan dari generator. `utils.ts` ditulis baru |
| P0-4 jalur CSS | SELESAI | Satu lokasi `src/styles/`. `utilities.css` **digabung ke `globals.css`** (`@layer` di file ter-`@import` membuat build gagal) |
| P0-5 tailwind + token | SELESAI | `fontFamily` ditambah; token `brand-200..900` dilengkapi |
| P0-6 alias import | SELESAI | Semua ke `components/public|ui`, `lib/i18n`, `lib/data`. 5 file basi ditulis ulang agar cocok dengan ekspor nyata |

**Sesi lanjutan (19 Sep 2026) — `tsc` + `next build` tetap lulus, 15/15 halaman:**

| Task | Status | Catatan |
|---|---|---|
| P1-1 security headers | SELESAI (CSP masih Report-Only) | `next.config.mjs`; naikkan CSP ke enforce setelah console bersih. `poweredByHeader` dimatikan |
| P1-2 env | SEBAGIAN | `.env.example` tanpa rahasia. **Belum:** validasi Zod `src/lib/env.ts` (belum ada kode yang membaca env) |
| P1-3 docker | SELESAI | Password wajib, bind 127.0.0.1, healthcheck, user app non-superuser (`docker/db-init/`). Belum dites (Docker tidak dijalankan) |
| P1-5 `/masuk` | SELESAI | Diganti halaman status jujur; tombol "Masuk" dihapus dari Header (juga menyelesaikan P2-3 di header) |
| P1-6 dependensi | SEBAGIAN | Dihapus: cn, shadcn, fast-glob, @base-ui/react, tw-animate-css, @swc/helpers, framer-motion, class-variance-authority. Next dipin 14.2.35. **`npm audit --omit=dev` masih 1 critical + 4 high di jalur Next 14; perbaikannya hanya lewat migrasi Next 16 (mayor) — perlu keputusan** |
| P2-1 emoji | SELESAI | Nol emoji di `src/` (semua diganti lucide) |
| P3-1 nav mobile | SELESAI | Ternyata drawer sudah ada (CODEMAP usang). Diperbaiki: ikon lucide, `aria-current`, label `nav`, fokus kembali ke tombol saat Escape, breakpoint `lg` |
| Header | | Logo `/logo-pramuka.png` tidak ada → `/brand/logo.svg` |

**Belum dikerjakan:** P1-4 (form kontak — saat ini menampilkan "Pesan Berhasil Terkirim" padahal tidak mengirim apa pun), P1-7, P1-8, P2-2…P2-8, P3-2…P3-8, P4–P6.

**Temuan tambahan saat eksekusi:** (1) `t("key") \|\| "fallback"` tidak pernah jatuh ke fallback karena `t()` mengembalikan *key*-nya sendiri, sehingga pengunjung akan melihat teks "news_title"; sudah diganti ke key yang ada. (2) Halaman hasil GitHub masih memuat emoji (`📅 📍`) dan warna literal `green-*` → tetap tugas P2. (3) `node_modules` lama tidak lengkap; `npm install` dijalankan ulang. (4) Ada proses lain yang menjalankan `generate_pages.js` di tengah sesi dan menimpa `src/app` dengan template lama; sudah dipulihkan. **Jangan jalankan kedua generator lagi**, keduanya sudah usang.

---

## 0. Ringkasan Kondisi Nyata (audit awal, sebelum eksekusi P0)

| Aspek | Klaim `AI_CONTEXT.MD` | Kondisi Terverifikasi |
|---|---|---|
| Source code | Fase 1 selesai 100% | **Kosong.** `src/**` hanya folder tanpa file |
| Design token | `tokens.css` aktif, semua pakai token | `tokens.css` tidak ada; komponen hardcode `green-600`, `neutral-200` |
| UI primitives | Button, Card, Badge, LanguageSelector, SkipToContent | Hanya `SkipToContent` ada (di generator). Sisanya tidak ada |
| Mobile drawer | Header punya drawer mobile | **Tidak ada.** Nav `hidden md:flex` tanpa pengganti → navigasi mati di bawah 768px |
| i18n 3 bahasa | ID/EN/SU penuh | Hanya pola `t("key") \|\| "fallback"` untuk judul; badan teks hardcode Bahasa Indonesia |
| Larangan emoji | Dilarang keras | Dilanggar di 8+ tempat (`⚜️ 📸 📅 🗺️ 👤 🏢 🔒 🧭 ✓`) |
| Dokumentasi `docs/` | 16 dokumen lengkap | Semua folder kosong |
| Versi proyek | Satu proyek | **Dua versi bercabang** yang saling bertentangan (lihat P0-1) |

**Konsekuensi:** `pnpm build` saat ini pasti gagal. Jangan mulai dari UI/UX — mulai dari pemulihan.

---

## P0 — Pemulihan & Integritas Build (BLOCKER)

### P0-1 · Tentukan satu source of truth, hapus duplikasi direktori
**Masalah.** Struktur folder bersarang 4 lapis (`Project P/Project P/Project P/system_management_indramayu_scout-main/`), dan di dalamnya ada **salinan kedua** `system_management_indramayu_scout-main/` yang isinya proyek berbeda:

| | Root (luar) | Nested (dalam) |
|---|---|---|
| `version` | `1.0.0` | `0.2.0` |
| Stack | shadcn 4, `@base-ui/react`, framer-motion 13 | Prisma 5, next-auth 5 beta, zod, bcryptjs |
| Script | dev/build/start/lint | + typecheck, db:generate, db:push, db:migrate, db:seed, db:studio |
| Dokumen | `PERBAIKAN.md` | `AI_CONTEXT.MD` |

`tsconfig.json` root bahkan meng-`exclude` folder nested — tambalan, bukan solusi. Dua `package.json` berarti dua dependency tree yang tidak pernah bisa konsisten.

**Aksi.**
1. Pilih root (luar) sebagai kanonik — ia punya `.next/`, `node_modules/`, `package-lock.json`, `components.json`.
2. Pindahkan aset unik dari nested ke root: `AI_CONTEXT.MD`, `.env.example` versi panjang (612 B, lebih lengkap), script `typecheck` + `db:*`.
3. Arsipkan folder nested ke luar repo, lalu hapus.
4. Ratakan nesting `Project P/Project P/Project P/` menjadi satu direktori proyek.
5. Hapus baris `"exclude": [..., "system_management_indramayu_scout-main"]` dari `tsconfig.json`.

**Selesai bila.** Hanya ada satu `package.json`, satu `tsconfig.json`, satu `src/`; `tsc --noEmit` jalan tanpa exclude khusus.

---

### P0-2 · Inisialisasi Git + `.gitignore` (kerjakan SEBELUM task lain)
**Masalah.** Tidak ada repositori Git dan **tidak ada `.gitignore` sama sekali**. Sementara itu `.env.local` sudah ada di direktori proyek. Commit pertama tanpa `.gitignore` akan membocorkan `.env.local` dan memasukkan `node_modules/` (311 paket) + `.next/` ke riwayat permanen.

**Aksi.**
1. Buat `.gitignore` sebelum `git init`:
   ```
   node_modules/
   .next/
   out/
   build/
   .env
   .env.local
   .env.*.local
   *.pem
   .DS_Store
   npm-debug.log*
   .vercel
   /coverage
   /playwright-report
   ```
2. `git init` → verifikasi `git status` tidak menampilkan `.env.local`, `node_modules/`, `.next/`.
3. Commit awal.

**Selesai bila.** `git check-ignore -v .env.local` mengembalikan match; `git status --porcelain | wc -l` masuk akal (< 30 file).

---

### P0-3 · Pulihkan file inti yang hilang (penyebab build gagal)
**Masalah.** Generator mengimpor file-file yang tidak ada di disk. Setiap satu dari ini cukup untuk menggagalkan build:

| Import dalam kode | File yang dibutuhkan | Status |
|---|---|---|
| `import "./globals.css"` (layout.tsx) | `src/app/globals.css` | **Hilang** |
| `components.json` → `src/styles/globals.css` | `src/styles/globals.css` | **Hilang & lokasi beda** |
| `var(--brand-*)`, `var(--neutral-*)` (tailwind.config) | `src/styles/tokens.css` | **Hilang** |
| `@/context/LanguageContext` | `src/context/LanguageContext.tsx` | **Hilang** |
| `@/lib/mock-data` | `src/lib/mock-data.ts` | **Hilang** |
| `cn()` (PERBAIKAN.md Task 1) | `src/lib/utils.ts` | **Hilang** |
| tipe domain | `src/types/index.ts` | **Hilang** |
| `manifest.json` → `/brand/logo.svg` | `public/brand/logo.svg` | **Hilang** |

**Aksi.**
1. Jalankan `node generate_pages.js` dan `node create_components.js` untuk memulihkan `src/app/**` dan `src/components/**`.
2. Tulis manual file yang tidak dicakup generator: `tokens.css`, `globals.css`, `utils.ts`, `LanguageContext.tsx`, `mock-data.ts`, `types/index.ts`, `public/brand/logo.svg`.
3. `src/lib/utils.ts` sesuai `PERBAIKAN.md`:
   ```ts
   import { clsx, type ClassValue } from "clsx";
   import { twMerge } from "tailwind-merge";

   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs));
   }
   ```
4. Setelah pulih, **commit source-nya**, lalu pindahkan `generate_pages.js` + `create_components.js` ke `scripts/_archive/`. Script generator tidak boleh jadi source of truth (lihat P5-1).

**Selesai bila.** `pnpm build` sukses tanpa error; tidak ada import yang unresolved.

---

### P0-4 · Perbaiki jalur CSS yang bercabang dua
**Masalah.** `layout.tsx` mengimpor `./globals.css` (artinya `src/app/globals.css`), tapi `components.json` mendeklarasikan `"css": "src/styles/globals.css"`, dan `AI_CONTEXT.MD` menyebut `src/styles/{globals,tokens,utilities}.css`. Tiga sumber, tiga lokasi berbeda. shadcn CLI akan menulis ke lokasi yang salah.

**Aksi.** Pilih **`src/styles/`** sebagai lokasi tunggal. Ubah import di `layout.tsx` menjadi `import "@/styles/globals.css"`. `globals.css` meng-`@import` `tokens.css` lalu `utilities.css`, lalu direktif Tailwind.

**Selesai bila.** Hanya ada satu `globals.css` di seluruh repo; `components.json` dan `layout.tsx` menunjuk ke path yang sama.

---

### P0-5 · Perbaiki `tailwind.config.ts` yang mematikan seluruh palet `neutral`
**Masalah.** Config meng-*override* `colors.neutral.50–900` menjadi `var(--neutral-50…900)`. Karena `tokens.css` tidak ada, **semua** variabel itu undefined. Padahal komponen memakai `text-neutral-900`, `bg-neutral-50`, `border-neutral-200` di hampir setiap baris. Hasilnya: teks dan border tanpa warna, bukan sekadar "warna sedikit meleset". Hal yang sama berlaku untuk `surface-*`, `text-*`, `action-*`, `border-*`, `status-*`, `brand-*`.

Bug kedua: `font-sans` dan `font-display` dipakai di `layout.tsx` dan heading, tapi `theme.extend.fontFamily` **tidak pernah didefinisikan**. Variabel `--font-inter` dan `--font-dm-sans` di-inject `next/font` tapi tak pernah dipakai → Inter & DM Sans tidak pernah tampil, semua jatuh ke font sistem.

Bug ketiga: `content` tidak mencakup `./src/styles/**` maupun file di luar tiga glob itu.

**Aksi.**
1. Tulis `tokens.css` dengan seluruh primitive (`--green-*`, `--neutral-*`) → semantic (`--surface-*`, `--text-*`, `--action-*`, `--border-*`, `--status-*`) → brand alias (`--brand-*`), plus `--shadow-sm/md/dialog`.
2. Tambahkan ke `tailwind.config.ts`:
   ```ts
   fontFamily: {
     sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
     display: ['var(--font-dm-sans)', 'var(--font-inter)', 'sans-serif'],
   }
   ```
3. Verifikasi setiap kelas warna yang dipakai komponen punya token pasangannya.

**Selesai bila.** Buka `/` di browser: teks hitam pekat, border terlihat, heading memakai DM Sans, body memakai Inter. Tidak ada elemen "tak berwarna".

---

### P0-6 · Luruskan alias import yang tidak konsisten
**Masalah.** Kode nyata vs dokumentasi memakai path berbeda untuk hal yang sama:

| Kode generator | `AI_CONTEXT.MD` |
|---|---|
| `@/components/Header` | `@/components/public/Header` |
| `@/context/LanguageContext` | `@/lib/i18n/LanguageContext` |
| `@/lib/mock-data` | `@/lib/data/mock-data` |

**Aksi.** Adopsi struktur `AI_CONTEXT.MD` (lebih terorganisir & siap skala): `components/ui/` untuk primitive, `components/public/` untuk section, `lib/data/`, `lib/i18n/`. Update semua import.

**Selesai bila.** `src/context/` dan `src/lib/mock-data.ts` tidak lagi ada; `tsc --noEmit` bersih.

---

## P1 — Keamanan

### P1-1 · Tambahkan security headers + CSP
**Masalah.** `next.config.mjs` hanya berisi `reactStrictMode` dan `images.unoptimized`. Tidak ada satu pun header keamanan. Situs institusi publik tanpa CSP, HSTS, dan anti-clickjacking.

**Aksi.** Tambah `async headers()` di `next.config.mjs`:
- `Content-Security-Policy` — `default-src 'self'`; izinkan `fonts.gstatic.com`, `*.tile.openstreetmap.org` (Leaflet), `data:` untuk gambar. Mulai dari `Content-Security-Policy-Report-Only`, naikkan ke enforce setelah bersih.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY` (atau `frame-ancestors 'none'` di CSP)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`

**Selesai bila.** securityheaders.com memberi nilai **A** atau lebih; tidak ada CSP violation di console.

---

### P1-2 · Bersihkan rahasia & konfigurasi environment
**Masalah.**
- `.env.example` menanam `NEXTAUTH_SECRET="super-secret-key-change-in-production"` — nilai placeholder yang secara historis sering ikut ter-copy ke produksi.
- `DATABASE_URL` di `.env.example` memuat password literal `password`.
- `.env.local` ada berdampingan tanpa `.gitignore` (ditangani P0-2).

**Aksi.**
1. Kosongkan nilai di `.env.example` — pakai `NEXTAUTH_SECRET=""` + komentar `# generate: openssl rand -base64 32`.
2. Validasi env saat boot dengan Zod (`src/lib/env.ts`): tolak start bila `NEXTAUTH_SECRET` kosong/placeholder di `NODE_ENV=production`.
3. Rotasi semua nilai yang pernah ditulis di file contoh.

**Selesai bila.** `pnpm build` dengan `NEXTAUTH_SECRET` placeholder gagal dengan pesan jelas.

---

### P1-3 · Kuatkan `docker-compose.yml`
**Masalah.** `POSTGRES_PASSWORD: password`, user `postgres` (superuser), dan port `5432:5432` di-bind ke **semua interface** host. Di jaringan kantor/kampus, database langsung terekspos.

**Aksi.**
1. Ganti ke `${POSTGRES_PASSWORD:?required}` — ambil dari `.env`, tanpa default.
2. Bind loopback saja: `"127.0.0.1:5432:5432"`.
3. Buat user aplikasi non-superuser lewat init script; simpan `postgres` untuk migrasi saja.
4. Tambah `healthcheck` (`pg_isready`) agar app tidak start sebelum DB siap.
5. Hapus `version: '3.8'` (usang di Compose v2).

**Selesai bila.** `docker compose up` gagal tanpa `POSTGRES_PASSWORD`; `nmap` dari host lain tidak menemukan 5432 terbuka.

---

### P1-4 · Amankan form kontak (`/kontak`)
**Masalah.** Form saat ini hanya dekorasi berbahaya: `<button type="button">` tanpa handler, tak ada action, tak ada validasi, tak ada `required`, tak ada penanganan error. Pengguna mengisi data pribadi lalu **tidak terjadi apa-apa dan tidak ada notifikasi** — pesan hilang diam-diam. Saat nanti disambungkan, belum ada rate limit, anti-spam, maupun proteksi CSRF.

**Aksi.**
1. Ubah ke **Server Action** Next.js (CSRF-protected secara bawaan) atau Route Handler dengan token CSRF.
2. Validasi server-side dengan Zod: `nama` 2–100 char, `email` format valid, `pesan` 10–2000 char. Jangan percaya validasi klien.
3. Rate limit per-IP (mis. 3 kirim / 10 menit) + honeypot field tersembunyi + time-trap (tolak submit < 3 detik).
4. Sanitasi sebelum simpan/kirim email; jangan render input balik sebagai HTML.
5. Tambah `required`, `autoComplete="name|email"`, `aria-describedby` untuk pesan error, `aria-live="polite"` untuk status sukses/gagal.
6. Tampilkan pemberitahuan privasi singkat di atas tombol kirim (kewajiban UU PDP: pemberitahuan sebelum pengumpulan).

**Selesai bila.** Submit tanpa JS tetap bekerja (progressive enhancement); kirim ke-4 dalam 10 menit ditolak 429; error tampil terhubung ke field-nya.

---

### P1-5 · Tinjau ulang halaman `/masuk`
**Masalah.** `/masuk` adalah UI login palsu — dua tombol tanpa fungsi apa pun, lengkap dengan peringatan "pastikan URL benar sebelum memasukkan kredensial". Halaman yang *terlihat* seperti form login tapi tidak memproses apa-apa melatih pengguna untuk memasukkan kredensial di layar yang tidak jelas statusnya — persis pola yang dimanfaatkan phishing. Ironisnya peringatan keamanan itu sendiri yang membuatnya lebih meyakinkan.

**Aksi.**
1. Untuk Fase 1: ganti jadi halaman status jujur — "Portal internal belum aktif. Dijadwalkan Fase 2." Hapus elemen yang menyerupai input kredensial.
2. Atau: hapus rute dan tautan "Portal Internal" dari Header sampai auth benar-benar ada.
3. Saat Fase 2 aktif: Auth.js + password hashing (Argon2id, bukan bcrypt untuk sistem baru), rate limit login, lockout progresif, sesi httpOnly+Secure+SameSite=Lax.

**Selesai bila.** Tidak ada layar yang meminta atau menyiratkan permintaan kredensial sementara backend auth belum ada.

---

### P1-6 · Audit & rapikan dependensi
**Masalah.**
- **`cn@^0.2.6`** — paket npm pihak ketiga yang tidak ada hubungannya dengan helper `cn()` shadcn. Ini indikasi *dependency confusion* / salah-install. Helper `cn` seharusnya file lokal `src/lib/utils.ts` (P0-3).
- **`shadcn@^4.21.0`** dan **`fast-glob@^3.3.3`** ada di `dependencies`, bukan `devDependencies` — ikut terbundel ke produksi. `shadcn` adalah CLI, harusnya `npx` saja.
- **`@base-ui/react`**, **`tw-animate-css`**, **`@swc/helpers`** tidak dipakai di kode mana pun.
- **`next: "^14.2.24"`** dengan caret. Next.js 14.2.x < 14.2.25 terdampak **CVE-2025-29927** (bypass otorisasi middleware). Caret memang bisa naik, tapi versi tidak dikunci reproducible.

**Aksi.**
1. Hapus `cn`, `shadcn`, `fast-glob`, `@base-ui/react`, `tw-animate-css`, `@swc/helpers` dari `dependencies`.
2. Pin Next ke versi patched terbaru jalur 14 (≥ 14.2.32) atau rencanakan migrasi ke Next 15.
3. Jalankan `pnpm audit --prod`; tuntaskan severity high/critical.
4. Tambahkan Dependabot/Renovate.

**Selesai bila.** `pnpm audit --prod` bersih dari high/critical; `pnpm why cn` tidak menemukan apa-apa; bundle produksi mengecil.

---

### P1-7 · Validasi sumber gambar & tautan unduhan
**Masalah.**
- `images.unoptimized: true` mematikan optimizer beserta allowlist `remotePatterns`-nya.
- Kode memakai `<img src={news.image}>` dan `<img src={photo.url}>` mentah — begitu data datang dari CMS/DB, URL apa pun bisa di-render (pelacakan pihak ketiga, pixel pelacak, konten tak pantas).
- `/dokumen` memakai `<a href={doc.url} download>` tanpa validasi → berpotensi jadi *open redirect* dan unduhan file sembarang bila data jadi dinamis.

**Aksi.**
1. Nyalakan optimizer; deklarasikan `images.remotePatterns` berisi host yang disetujui saja.
2. Ganti seluruh `<img>` ke `next/image` dengan `width`/`height` eksplisit (juga menghilangkan CLS — lihat P4-2).
3. Untuk tautan dokumen: validasi berada di host sendiri atau allowlist; tambahkan `rel="noopener noreferrer"` untuk tautan eksternal; tampilkan tipe & ukuran file sebelum unduh.

**Selesai bila.** Gambar dari host tak terdaftar ditolak; tidak ada `<img>` mentah tersisa.

---

### P1-8 · Selaraskan janji privasi dengan implementasi
**Masalah.** `/kebijakan-privasi` menjanjikan kepatuhan UU PDP No. 27/2022, retensi 5 tahun, dan persetujuan wali untuk anak di bawah 18. Tidak satu pun mekanismenya ada. Menerbitkan janji privasi yang tidak didukung sistem menimbulkan eksposur hukum, bukan sekadar utang teknis.

**Aksi.**
1. Fase 1: batasi klaim ke apa yang benar-benar berlaku sekarang (situs statis, hanya form kontak). Tambah bagian "Yang belum berlaku".
2. Sediakan kanal nyata untuk hak subjek data (akses, koreksi, penghapusan) — minimal email khusus yang dipantau.
3. Fase 2: implementasikan consent wali, pencatatan consent, klasifikasi data 4 tingkat, audit log append-only — baru kembalikan klaim penuh.
4. Terapkan aturan "tanpa foto wajah anak di bawah umur di halaman publik" sebagai checklist rilis, bukan sekadar catatan di dokumen.

**Selesai bila.** Setiap klaim di halaman privasi bisa ditunjuk implementasinya, atau ditandai eksplisit sebagai rencana.

---

## P2 — UI/UX Sesuai Prinsip yang Sudah Ditetapkan

Prinsip acuan: *"Calm civic system with scouting character"* — Clarity > decoration, satu primary action per konteks, whitespace = trust, warna semantik, privasi terlihat, motion menjelaskan perubahan, aksesibel by default.

### P2-1 · Hapus seluruh emoji dekoratif, ganti ikon `lucide-react`
**Masalah.** Larangan keras dilanggar di sepanjang kode: `⚜️` (Header, `/masuk`), `📸` (AboutPreview), `📅` (AgendaPreview), `🗺️` (MapSection), `👤 🏢 🔒` (`/masuk`), `🧭` (404), `✓` (AboutPreview). Emoji OS berubah bentuk lintas platform, tidak mewarisi `currentColor`, dan dibacakan screen reader sebagai nama emoji ("koper", "wajah") — bukan makna yang dimaksud.

**Aksi.** Peta substitusi:

| Emoji | Lokasi | Ganti dengan |
|---|---|---|
| `⚜️` | Header, `/masuk` | Logo SVG resmi Kwarcab (`public/brand/logo.svg`) |
| `📸` | AboutPreview | `<ImageIcon aria-hidden />` |
| `📅` | AgendaPreview | `<CalendarDays aria-hidden />` |
| `🗺️` | MapSection | `<MapPin aria-hidden />` |
| `👤` | `/masuk` | `<User aria-hidden />` |
| `🏢` | `/masuk` | `<Building2 aria-hidden />` |
| `🔒` | `/masuk` | `<ShieldCheck aria-hidden />` |
| `🧭` | 404 | `<Compass aria-hidden />` |
| `✓` | AboutPreview | `<Check aria-hidden />` |

Semua ikon dekoratif wajib `aria-hidden="true"`; ikon bermakna wajib punya label teks berdampingan.

**Selesai bila.** `grep -P "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/` tidak menemukan apa pun.

---

### P2-2 · Bangun UI primitives yang selama ini hanya ada di dokumen
**Masalah.** `AI_CONTEXT.MD` mendaftar Button, Card, Badge, LanguageSelector, SkipToContent sebagai "selesai". Hanya `SkipToContent` yang nyata. Akibatnya setiap halaman menulis ulang gaya tombol dan kartu — nilai `px-4 py-2 bg-green-700 rounded-md` muncul copy-paste di `/dokumen`, `/kontak`, `/masuk`, Hero, dan 404, masing-masing dengan varian sedikit berbeda.

**Aksi.** Buat di `src/components/ui/`:
- `Button.tsx` — `forwardRef`, varian `primary|secondary|ghost|danger|link`, ukuran `sm|md|lg`, state `loading` + `disabled`, tinggi minimum 44px, `focus-visible` ring.
- `Card.tsx` — compound `Card`/`CardHeader`/`CardContent`/`CardFooter`.
- `Badge.tsx` — varian status yang membawa **ikon + teks**, bukan hanya warna (lihat P3-4).
- `LanguageSelector.tsx` — dropdown ID/EN/SU, navigasi keyboard, `aria-expanded`, `role="listbox"`.
- `Input.tsx`, `Textarea.tsx`, `Field.tsx` — label wajib, slot error, `aria-invalid` + `aria-describedby`.

Semua memakai token dari `tokens.css` via `cn()`. Nol hardcode hex.

**Selesai bila.** Tidak ada `className` berisi warna literal Tailwind (`green-*`, `blue-*`, `red-*`, `yellow-*`) di `src/app/**`.

---

### P2-3 · Tegakkan aturan satu primary action per konteks
**Masalah.** Di viewport pertama beranda ada **tiga** tombol berbobot setara: "Portal Internal" (hijau solid, Header), "Berita Terkini" (hijau solid, Hero), "Lihat Agenda" (putih berbingkai, Hero). Dua tombol hijau solid bersaing di layar yang sama — melanggar aturan yang ditetapkan proyek sendiri.

**Aksi.**
1. Turunkan "Portal Internal" di Header jadi varian `ghost`/tautan teks (apalagi karena P1-5 menonaktifkannya).
2. Hero: pertahankan satu primary ("Berita Terkini"), pastikan "Lihat Agenda" jelas subordinat.
3. Buat aturan tertulis: satu `variant="primary"` per section; audit visual per halaman.

**Selesai bila.** Screenshot beranda di 1440px dan 390px menunjukkan tepat satu tombol hijau solid di atas lipatan.

---

### P2-4 · Perbaiki ritme & hierarki beranda
**Masalah.** Delapan section ditumpuk dengan pola identik: `py-20` + `border-b border-neutral-200` + lebar kontainer berbeda-beda (`max-w-4xl`, `max-w-5xl`, `max-w-6xl`, tanpa max). Hasilnya halaman terasa seperti daftar panjang tanpa penekanan — kebalikan dari "whitespace = trust" yang dituju. `AchievementPreview` bahkan `return null` tapi tetap dirender di `page.tsx`.

**Aksi.**
1. Standarkan lebar kontainer lewat satu utility `.civic-container` (`max-w-6xl` + padding responsif). Satu lebar untuk semua, kecuali blok teks panjang yang pakai `max-w-prose`.
2. Variasikan ritme vertikal dengan niat: section utama `py-24`, sekunder `py-16`.
3. Ganti `border-b` di setiap section dengan pergantian latar (`surface-base` ↔ `surface-subtle`) untuk memisahkan blok tanpa garis berulang.
4. Hapus `AchievementPreview` dari `page.tsx` **dan** hapus filenya, atau implementasikan sungguhan. Komponen yang mengembalikan `null` tapi tetap diimpor adalah beban mati.

**Selesai bila.** Beranda punya alur visual yang jelas; tak ada komponen render-null yang masih diimpor.

---

### P2-5 · Ganti seluruh placeholder abu-abu dengan konten nyata atau empty state bermakna
**Masalah.** Kotak abu bertuliskan "Gambar", "Foto 1", "Foto Kegiatan / Gedung", "Peta Lokasi Kwarcab Indramayu", "Peta Interaktif (Google Maps Embed)" tersebar di Hero area, AboutPreview, NewsPreview, GalleryPreview, MapSection, dan `/kontak`. Situs terasa belum jadi, dan untuk portal institusi resmi itu langsung merusak kepercayaan.

**Aksi.**
1. Kumpulkan aset riil: foto gedung sekretariat, dokumentasi kegiatan (patuh aturan privasi anak — P1-8), logo resmi, PDF jukran/formulir.
2. Implementasikan MapSection dengan Leaflet + OpenStreetMap secara nyata (dependensi `leaflet@1.9.4` dan `@types/leaflet` sudah terpasang tapi tak pernah dipakai). Muat dinamis via `next/dynamic` dengan `ssr: false`.
3. Untuk konten yang memang belum ada, buat empty state jujur: ikon + kalimat penjelas + aksi lanjut. Bukan kotak abu bisu.

**Selesai bila.** Tidak ada kotak `bg-neutral-200/300` berisi teks placeholder di seluruh `src/`.

---

### P2-6 · Perbaiki animasi `BlurFade` dan hormati `prefers-reduced-motion`
**Masalah.** Dua cacat di `create_components.js` → `magicui/blur-fade.tsx`:
1. `visible: { y: -yOffset }` — state akhir meleset **6px di atas** posisi asal, seharusnya `y: 0`. Setiap elemen beranimasi berhenti di tempat yang salah, menggeser layout.
2. Tidak ada penanganan `prefers-reduced-motion`, padahal `AI_CONTEXT.MD` mencantumkannya sebagai persyaratan aksesibilitas. Pengguna dengan gangguan vestibular tetap menerima animasi penuh.

Masalah ketiga bersifat arsitektural: `BlurFade` membungkus setiap kartu statistik, kartu berita, dan foto galeri. Karena `framer-motion` memaksa client component, **seluruh section beranda jadi client-side** — sebuah situs informasi publik yang seharusnya mayoritas statis malah mengirim bundle JS besar.

**Aksi.**
1. Perbaiki `visible` menjadi `{ y: 0, opacity: 1, filter: "blur(0px)" }`.
2. Bungkus dengan `useReducedMotion()` dari framer-motion; bila aktif, render anak tanpa animasi.
3. Kurangi pemakaian drastis: animasikan container section sekali, bukan tiap item. Pertimbangkan mengganti dengan CSS `@keyframes` + `animation-timeline: view()` / IntersectionObserver ringan agar `framer-motion` bisa dilepas seluruhnya dari beranda.

**Selesai bila.** Dengan "Reduce motion" aktif di OS, tidak ada animasi masuk; beranda kembali jadi Server Component.

---

### P2-7 · Hapus `"use client"` yang tidak perlu + tambahkan metadata per halaman
**Masalah.** `/tentang`, `/kebijakan-privasi`, `/aksesibilitas`, `/struktur-organisasi` semuanya konten statis tapi ditandai `"use client"` (karena `useLanguage()`). Efeknya: kehilangan SSG, hidrasi sia-sia, dan konten tidak sepenuhnya ramah crawler.

Lebih parah: **tidak ada satu pun halaman yang mengekspor `metadata`**. Ke-16 rute memakai judul dan deskripsi identik dari `layout.tsx` — "Rumah Pramuka Indramayu". Untuk portal informasi publik yang mengandalkan pencarian, ini kerugian besar.

**Aksi.**
1. Pisahkan: halaman jadi Server Component; bagian interaktif (filter, lightbox, dropdown bahasa) diekstrak jadi child client component kecil.
2. Tambahkan `export const metadata` di setiap `page.tsx` statis: `title`, `description`, `openGraph`, `alternates.canonical`.
3. Untuk rute dinamis (`/berita/[slug]`, `/agenda/[slug]`, `/galeri/[slug]`): `generateMetadata()` + `generateStaticParams()`.
4. Tambah `metadataBase` di root layout agar URL OG absolut.

**Selesai bila.** Setiap rute punya `<title>` unik; `next build` menandai halaman statis sebagai `○ (Static)`.

---

### P2-8 · Jadikan i18n benar-benar berfungsi (atau kurangi klaimnya)
**Masalah.** Pola `t("about_title") || "Tentang Kami"` hanya menerjemahkan judul; seluruh badan teks — paragraf sejarah, visi-misi, kebijakan privasi, label form, pesan 404 — **hardcode Bahasa Indonesia**. Klaim dukungan tiga bahasa (ID/EN/SU) tidak terbukti. `LanguageSelector` bahkan tidak ada. `<html lang="id">` statis, jadi ketika pengguna memilih English, screen reader tetap membaca dengan fonem Indonesia.

**Aksi.** Pilih satu jalur dan tuntaskan:
- **Jalur A (disarankan untuk Fase 1):** fokus Bahasa Indonesia saja. Hapus `LanguageProvider` dan seluruh pemanggilan `t()`. Koreksi `AI_CONTEXT.MD`. Jujur dan jauh lebih ringan.
- **Jalur B:** i18n sungguhan — pindah ke routing `[locale]`, ekstrak **semua** string ke kamus, sinkronkan `<html lang>` dengan locale aktif, tambah `hreflang` dan `alternates.languages`.

Jangan tinggalkan kondisi tengah sekarang: ia menambah kompleksitas tanpa memberi manfaat.

**Selesai bila.** Jalur A: nol pemanggilan `t()`. Jalur B: nol string UI hardcode, `<html lang>` berubah mengikuti pilihan bahasa.

---

## P3 — Responsivitas & Aksesibilitas (WCAG 2.2 AA)

### P3-1 · Navigasi mobile — BLOCKER responsivitas
**Masalah.** `Header.tsx` memakai `<nav className="hidden md:flex">` **tanpa tombol menu mobile atau drawer apa pun**. Di bawah 768px, tujuh tautan navigasi utama (Tentang, Struktur, Berita, Agenda, Galeri, Dokumen, Kontak) **hilang total** — pengguna ponsel hanya bisa mengakses beranda dan tombol "Portal Internal". Ini kegagalan fungsional, bukan masalah estetika, dan mayoritas pengunjung portal publik datang dari ponsel.

`AI_CONTEXT.MD` mengklaim drawer mobile sudah ada. Tidak ada di kode.

**Aksi.**
1. Tambah tombol hamburger (`<Menu />` lucide) yang tampil di bawah `md`, minimal 44×44px, dengan `aria-expanded`, `aria-controls`, dan label teks tersembunyi.
2. Drawer: fokus terperangkap selagi terbuka, `Escape` menutup, fokus kembali ke tombol pemicu, `inert`/`aria-hidden` pada konten belakang, scroll body terkunci.
3. Tandai tautan halaman aktif dengan `aria-current="page"`.

**Selesai bila.** Di viewport 375px, seluruh 7 tautan tercapai lewat keyboard dan sentuhan; `Escape` menutup drawer.

---

### P3-2 · Modal lightbox galeri tidak dapat diakses
**Masalah.** Modal foto di `/galeri/[slug]` dirender sebagai div biasa: tanpa `role="dialog"`, tanpa `aria-modal="true"`, tanpa focus trap, tanpa handler `Escape`, tanpa pengunci scroll, tanpa tombol tutup ber-label. Pengguna keyboard yang membukanya akan ter-tab ke konten di belakang modal tanpa cara menutup.

**Aksi.** Bangun ulang dengan `<dialog>` native (`showModal()`) atau Radix Dialog. Wajib: `role="dialog"` + `aria-modal` + `aria-labelledby`, focus trap, `Escape` menutup, kembalikan fokus ke thumbnail pemicu, tombol tutup dengan `aria-label="Tutup galeri"`, navigasi panah kiri/kanan antarfoto.

**Selesai bila.** Buka modal hanya dengan keyboard, jelajahi, tutup dengan `Escape`, dan fokus kembali ke thumbnail asal.

---

### P3-3 · Target sentuh & area klik
**Masalah.** WCAG 2.2 menambahkan kriteria **2.5.8 Target Size (Minimum) — 24×24px**, dan standar internal proyek menetapkan 44×44px. Yang gagal: tautan nav (`text-sm`, tanpa padding vertikal), chip filter kategori di `/berita` (`px-4 py-2` ≈ 36px), tautan footer (`space-y-2` saja), tautan teks "Lihat Semua ...".

**Aksi.** Terapkan `min-h-11 min-w-11` (44px) pada semua elemen interaktif; untuk tautan inline dalam teks, pastikan jarak antar-target memadai. Kodifikasi di primitive `Button`/`Link` (P2-2) agar tidak terulang.

**Selesai bila.** Audit Lighthouse "Tap targets are sized appropriately" lolos.

---

### P3-4 · Status jangan hanya dibedakan warna
**Masalah.** Badge "Akan Datang" di AgendaPreview hanya mengandalkan warna biru. Kategori berita hanya teks hijau uppercase. Ikon dokumen hanya kotak merah. WCAG 1.4.1 melarang warna sebagai satu-satunya pembawa informasi — dan aturan internal proyek juga mencantumkannya.

**Aksi.** Setiap status = **ikon + teks + warna**. Buat peta status: Akan Datang (`Clock`), Berlangsung (`PlayCircle`), Selesai (`CheckCircle2`), Dibatalkan (`XCircle`). Tempatkan di `Badge.tsx`.

**Selesai bila.** Simulasi grayscale: semua status tetap bisa dibedakan.

---

### P3-5 · Kontras warna
**Masalah.** `text-neutral-500` di atas putih ≈ 4.6:1 (lolos tipis untuk teks normal, **gagal** bila dipakai pada teks kecil di bawah 14px seperti `text-xs` metadata tanggal). `text-neutral-400` pada placeholder **gagal telak**. Blok peringatan `text-yellow-800` di atas `bg-yellow-50` di `/masuk` perlu diverifikasi. Semua rasio ini belum pernah diukur karena token warnanya sendiri belum ada (P0-5).

**Aksi.** Saat menyusun `tokens.css`, ukur setiap pasangan latar/teks. Target: 4.5:1 teks normal, 3:1 teks besar & komponen UI. Naikkan `--text-muted` sampai lolos. Dokumentasikan tabel rasio di `docs/design/`.

**Selesai bila.** axe-core melaporkan nol pelanggaran `color-contrast`.

---

### P3-6 · Tepati janji di halaman `/aksesibilitas`
**Masalah.** Halaman itu mengiklankan pintasan `Alt + 1` → "Kembali ke Beranda". **Tidak ada implementasinya.** Ia juga menjanjikan "navigasi keyboard penuh" — padahal nav mobile tidak ada (P3-1) dan modal galeri menjebak fokus (P3-2). Pernyataan aksesibilitas yang tidak akurat lebih merugikan daripada tidak ada.

**Aksi.**
1. Implementasikan pintasan yang dijanjikan, atau hapus dari halaman.
2. Setelah P3-1…P3-5 selesai, jalankan audit nyata dan tulis ulang halaman berdasarkan hasilnya — termasuk keterbatasan yang masih ada.
3. Pastikan email `aksesibilitas@pramukaindramayu.or.id` benar-benar dipantau.

**Selesai bila.** Setiap klaim di `/aksesibilitas` bisa diverifikasi manual.

---

### P3-7 · Struktur heading, landmark, dan lebar baca
**Masalah.** `/kontak` dan beberapa halaman lain melompat dari `h1` langsung ke `h2` di kolom berbeda tanpa `<section>` ber-label. Tidak ada `aria-label` pada landmark `<nav>` (Header vs Footer tidak terbedakan oleh screen reader). Paragraf di `/tentang` memakai `container mx-auto` tanpa `max-w` → pada layar 1920px baris teks membentang sangat panjang dan sulit dibaca.

**Aksi.**
1. Satu `h1` per halaman; urutan heading tanpa lompatan.
2. `<nav aria-label="Navigasi utama">` dan `<nav aria-label="Navigasi footer">`.
3. Batasi blok teks panjang dengan `max-w-prose` (±65 karakter).
4. Pastikan `<main id="main-content">` cocok dengan target `SkipToContent` — sudah benar, pertahankan.

**Selesai bila.** Pohon aksesibilitas di DevTools menunjukkan hierarki yang logis.

---

### P3-8 · Uji di breakpoint nyata
**Masalah.** Beberapa layout diasumsikan berfungsi tanpa diverifikasi: grid `md:grid-cols-3` di `/berita` menjadi satu kolom penuh di mobile (kartu jadi sangat tinggi); `grid-cols-2 md:grid-cols-4 lg:grid-cols-6` untuk 31 Kwarran menghasilkan nama terpotong di layar sempit; header `/prestasi` berbentuk tabel tanpa strategi overflow.

**Aksi.** Verifikasi di 360, 390, 768, 1024, 1440, 1920px. Tabel `/prestasi` → kartu di bawah `md`, atau bungkus dengan wrapper `overflow-x-auto` ber-`tabindex="0"` dan `aria-label`. Pastikan tak ada scroll horizontal di `body`.

**Selesai bila.** Tidak ada overflow horizontal di lebar mana pun; semua teks terbaca penuh.

---

## P4 — Performa & SEO

### P4-1 · Aktifkan optimasi gambar
**Masalah.** `images: { unoptimized: true }` mematikan seluruh optimasi bawaan Next: tanpa AVIF/WebP, tanpa `srcset` responsif, tanpa lazy-load terkoordinasi. Untuk situs yang porosnya galeri dan dokumentasi kegiatan, ini penalti performa terbesar.

**Aksi.** Hapus `unoptimized: true`, deklarasikan `remotePatterns` (P1-7), migrasikan ke `next/image` dengan `sizes` yang tepat, `priority` untuk gambar hero, dan `placeholder="blur"` untuk aset lokal.

**Selesai bila.** Lighthouse Performance ≥ 90 di mobile.

---

### P4-2 · Hilangkan Cumulative Layout Shift
**Masalah.** `<img>` mentah tanpa `width`/`height`, ditambah `BlurFade` yang menggeser `y` (P2-6) dan font web tanpa strategi `display` → CLS tinggi.

**Aksi.** Dimensi eksplisit atau `aspect-ratio` untuk semua media; `next/font` sudah menangani `font-display: swap` (pertahankan); perbaiki bug `y` di BlurFade.

**Selesai bila.** CLS < 0.1 di data lab.

---

### P4-3 · Tambahkan `sitemap.ts`, `robots.ts`, dan data terstruktur
**Masalah.** Tidak ada sitemap, tidak ada robots.txt, tidak ada JSON-LD. Portal informasi publik yang sangat bergantung pada pencarian organik tapi tanpa fondasi SEO teknis.

**Aksi.**
1. `src/app/sitemap.ts` — semua rute statis + slug berita/agenda/galeri.
2. `src/app/robots.ts` — izinkan crawling, tunjuk sitemap, larang rute internal masa depan (`/dashboard`, `/api`).
3. JSON-LD: `Organization` di layout, `NewsArticle` di detail berita, `Event` di detail agenda, `BreadcrumbList` di halaman dalam.
4. `alternates.canonical` per halaman.

**Selesai bila.** `/sitemap.xml` dan `/robots.txt` merespons benar; Rich Results Test lolos.

---

### P4-4 · Tambahkan `loading.tsx`, `error.tsx`, dan empty state
**Masalah.** Tidak ada boundary loading maupun error di rute mana pun. Filter kategori di `/berita` yang tidak menghasilkan apa-apa menampilkan **grid kosong tanpa penjelasan** — pengguna mengira halaman rusak. Halaman detail dengan slug tidak dikenal kemungkinan crash, bukan menampilkan 404.

**Aksi.**
1. `loading.tsx` dengan skeleton di setiap rute yang mengambil data.
2. `error.tsx` dengan tombol coba lagi.
3. Empty state bermakna untuk filter kosong, galeri kosong, hasil pencarian dokumen kosong.
4. Panggil `notFound()` di halaman detail bila slug tak ditemukan.

**Selesai bila.** Filter kategori tanpa hasil menampilkan pesan jelas + tombol reset filter; `/berita/slug-ngawur` menampilkan halaman 404.

---

### P4-5 · Simpan state filter di URL
**Masalah.** `/berita`, `/agenda`, `/prestasi`, `/dokumen` menyimpan filter di `useState` lokal. Akibatnya: hasil filter tidak bisa dibagikan, tombol Back browser tidak mengembalikan filter, dan refresh mereset pilihan. Untuk situs informasi, kemampuan berbagi tautan hasil filter itu penting.

**Aksi.** Pindahkan ke query param (`?kategori=prestasi`) memakai `useSearchParams` + `router.replace` dengan `scroll: false`. Tambah `aria-pressed` pada chip filter dan bungkus dalam `role="group"` ber-label.

**Selesai bila.** Menyalin URL setelah memfilter lalu membukanya di tab baru menghasilkan tampilan yang sama.

---

## P5 — Skalabilitas & Arsitektur

### P5-1 · Pensiunkan script generator sebagai source of truth
**Masalah.** Seluruh aplikasi lahir dari `generate_pages.js` (34 KB) dan `create_components.js` (17,5 KB) yang menyimpan kode sebagai template string. Dampaknya konkret dan sudah terjadi: tanpa type checking di dalam string, tanpa linting, tanpa diff yang berarti, escaping backtick berlapis, dan menjalankannya ulang **menimpa seluruh pekerjaan manual**. Hilangnya `src/` kemungkinan besar bersumber dari ketergantungan pada pola ini.

**Aksi.** Setelah P0-3, commit `src/` sebagai kode nyata. Pindahkan kedua script ke `scripts/_archive/` dengan README yang menyatakan status arsip. Scaffolding ke depan pakai `plop`/`hygen` dengan file template terpisah, bukan string inline.

**Selesai bila.** Menjalankan generator tidak lagi diperlukan untuk membangun proyek.

---

### P5-2 · Bangun lapisan akses data
**Masalah.** Komponen mengimpor `mock-data` langsung (`import { newsData } from "@/lib/mock-data"`). Lebih buruk, beberapa komponen **menanam datanya sendiri**: `StatsSection` memuat array statistik inline, `AgendaPreview` memuat 3 agenda inline, `NewsPreview` memuat 3 berita inline — terduplikasi dengan `mock-data.ts` dan pasti akan bergeser tidak sinkron. Tidak ada sambungan untuk menukar mock dengan Prisma tanpa menyentuh setiap komponen.

**Aksi.**
1. Buat `src/lib/repositories/` dengan fungsi async: `getNews({ category, limit })`, `getNewsBySlug(slug)`, `getAgenda(...)`, `getKwarran()`, dst. Implementasi awal membaca mock; nanti diganti Prisma tanpa mengubah pemanggil.
2. Hapus semua data inline dari komponen; semuanya lewat repository.
3. Definisikan skema Zod per entitas di `src/lib/schemas/`, turunkan tipe TypeScript dari situ — satu sumber kebenaran untuk tipe dan validasi.

**Selesai bila.** `grep -r "mock-data" src/app src/components` tidak menghasilkan apa-apa (hanya repository yang boleh mengimpornya).

---

### P5-3 · Siapkan skema database
**Masalah.** `docker-compose.yml` menyediakan PostgreSQL+PostGIS dan `package.json` (versi nested) punya script `db:migrate`/`db:seed`, tapi **tidak ada `prisma/schema.prisma`, tidak ada migrasi, tidak ada seed**. Infrastruktur menunggu skema yang tak pernah ditulis.

**Aksi.**
1. Tulis `prisma/schema.prisma`: `User`, `Role`, `Permission`, `Member`, `Gudep`, `Kwarran`, `Event`, `News`, `Document`, `Achievement`, `AuditLog`, `ConsentRecord`.
2. Terapkan klasifikasi data 4 tingkat sejak level skema — tandai kolom sensitif, rencanakan enkripsi di level kolom untuk NIK dan data anak.
3. `AuditLog` append-only: cabut hak UPDATE/DELETE di level database, bukan hanya di kode aplikasi.
4. Seed dari `mock-data.ts` supaya dev punya data realistis.
5. Indeks pada kolom yang sering difilter (`slug`, `category`, `publishedAt`, `kwarranId`).

**Selesai bila.** `pnpm db:push && pnpm db:seed` menghasilkan database yang bisa dipakai jalan.

---

### P5-4 · Rancang RBAC sebelum menulis fitur berkewenangan
**Masalah.** `AI_CONTEXT.MD` menyebut "RBAC hierarkis dengan scope" tapi tidak ada model, tidak ada matriks izin, tidak ada middleware. Aturan proyek sendiri melarang "permission check hanya di frontend" — mudah dilanggar bila modelnya belum ada saat fitur mulai ditulis.

**Aksi.**
1. Tulis matriks izin: peran (super admin, admin website, staf Kwarcab, staf Kwarran, staf Gudep, pembina, pelatih, anggota, publik) × sumber daya × aksi.
2. Terapkan *scope*: Kwarcab > Kwarran > Gudep > Event > Personal. Staf Kwarran hanya boleh menyentuh data Kwarran-nya.
3. Penegakan **di server** — Server Action/Route Handler memvalidasi sesi + izin + scope sebelum query. UI hanya menyembunyikan tombol, bukan menjaga pintu.
4. Setiap perubahan berkewenangan menulis `AuditLog`.

**Selesai bila.** Ada satu fungsi `can(user, action, resource, scope)` yang dipanggil setiap Server Action.

---

### P5-5 · Batas modul & struktur folder yang tahan tumbuh
**Masalah.** Arsitektur "modular monolith" disebut di dokumen tapi tidak tercermin di struktur — semua komponen tercampur datar di `src/components/`. Menuju Fase 3 (Gudep, Kwarran, kegiatan, mutasi), ini akan cepat kusut.

**Aksi.** Kelompokkan per fitur begitu Fase 2 dimulai:
```
src/
  features/
    news/        { components/, repository.ts, schema.ts, actions.ts }
    agenda/
    members/
    auth/
  components/ui/     # primitive lintas fitur saja
  lib/               # utilitas lintas fitur
```
Tegakkan dengan ESLint `no-restricted-imports`: fitur tidak boleh saling impor internal, hanya lewat API publik masing-masing.

**Selesai bila.** Fitur baru bisa ditambah tanpa menyentuh file fitur lain.

---

## P6 — Gerbang Kualitas

### P6-1 · Lint & type check
**Masalah.** `package.json` punya `"lint": "next lint"` tapi **tidak ada `.eslintrc*` maupun `eslint.config.mjs`** — perintahnya tidak melakukan apa-apa berarti. Script `typecheck` hanya ada di `package.json` versi nested yang akan dihapus (P0-1).

**Aksi.**
1. Buat konfigurasi ESLint: `next/core-web-vitals`, `@typescript-eslint`, `eslint-plugin-jsx-a11y` (kritis mengingat target WCAG).
2. Tambahkan `"typecheck": "tsc --noEmit"` ke `package.json` kanonik.
3. Aturan kustom penegak keputusan di atas: larang warna literal Tailwind di `src/app/**`, larang `<img>`, larang karakter emoji.
4. Prettier + `prettier-plugin-tailwindcss`.
5. Husky + lint-staged pada pre-commit.

**Selesai bila.** `pnpm lint && pnpm typecheck` bersih dan berjalan otomatis sebelum commit.

---

### P6-2 · Pengujian
**Masalah.** Nol tes. Nol infrastruktur tes. `docs/testing/testing-strategy.md` yang disebut di `AI_CONTEXT.MD` tidak ada (folder kosong).

**Aksi.**
1. **Vitest + Testing Library** — UI primitives (varian, state disabled/loading), fungsi repository, skema Zod.
2. **Playwright** — alur kritis: navigasi mobile membuka & menutup, filter berita mengubah URL, modal galeri bisa ditutup dengan keyboard, form kontak menolak input tidak valid.
3. **axe-core** via `@axe-core/playwright` di setiap rute — gagalkan build bila ada pelanggaran serius.
4. Target cakupan: 70% untuk `lib/` dan `components/ui/`.

**Selesai bila.** `pnpm test` dan `pnpm test:e2e` berjalan di CI.

---

### P6-3 · CI/CD & pemantauan
**Masalah.** Tidak ada pipeline, tidak ada branch protection, tidak ada error tracking, tidak ada pemantauan uptime — untuk situs yang akan jadi kanal resmi sebuah organisasi.

**Aksi.**
1. GitHub Actions: `lint → typecheck → test → build` pada setiap PR.
2. Lighthouse CI dengan anggaran: Performance ≥ 90, Accessibility = 100, Best Practices ≥ 95, SEO ≥ 95.
3. Preview deployment Vercel per PR.
4. Sentry untuk error tracking (aktifkan scrubbing PII — wajib mengingat UU PDP).
5. Pemantauan uptime + backup database harian dengan uji pemulihan.

**Selesai bila.** PR tidak bisa di-merge bila salah satu gerbang gagal.

---

### P6-4 · Luruskan dokumentasi dengan kenyataan
**Masalah.** `AI_CONTEXT.MD` menyatakan Fase 1 "100% selesai" dan merujuk 16 dokumen di `docs/` yang seluruhnya tidak ada. Dokumentasi yang salah lebih berbahaya daripada tidak ada dokumentasi — AI agent maupun kontributor baru akan mengambil keputusan berdasarkan premis palsu, persis yang menyebabkan audit ini perlu dilakukan dari nol.

**Aksi.**
1. Perbarui `AI_CONTEXT.MD` agar mencerminkan kondisi terverifikasi (tabel di bagian 0 dokumen ini bisa dipakai langsung).
2. Tulis dokumen `docs/` yang memang dirujuk, atau hapus rujukannya.
3. Pelihara `AGENTS.md` + `CODEMAP.md` (lihat panduan agent) sebagai titik masuk utama.
4. Tetapkan aturan: setiap PR yang mengubah struktur wajib memperbarui `CODEMAP.md`.

**Selesai bila.** Setiap file yang dirujuk dokumentasi benar-benar ada.

---

## Urutan Eksekusi yang Disarankan

```
P0-2  .gitignore + git init        ← paling dulu, sebelum menyentuh apa pun
P0-1  satukan direktori
P0-3  pulihkan source
P0-4  luruskan jalur CSS
P0-5  perbaiki tailwind config + tokens
P0-6  luruskan alias import
      ── checkpoint: pnpm build HARUS sukses ──
P1-1  security headers      P1-2  env      P1-3  docker
P1-6  audit dependensi      P1-5  /masuk
      ── checkpoint: securityheaders.com = A ──
P3-1  navigasi mobile       ← perbaikan berdampak tertinggi bagi pengguna
P2-1  hapus emoji           P2-2  UI primitives
P2-6  perbaiki BlurFade     P2-7  metadata per halaman
P3-2..P3-8  aksesibilitas
      ── checkpoint: axe-core nol pelanggaran ──
P4    performa & SEO
P5    arsitektur data (paralel dengan P4)
P6    gerbang kualitas       ← pasang lebih awal bila memungkinkan
```

**Tiga hal paling mendesak bila waktu terbatas:**
1. **P0-2** — commit tanpa `.gitignore` akan membocorkan `.env.local` secara permanen.
2. **P0-3/P0-5** — tanpa ini proyek tidak bisa di-build sama sekali.
3. **P3-1** — navigasi mobile hilang total; mayoritas pengunjung tidak bisa memakai situs.
