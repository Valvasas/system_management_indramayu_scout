# Keputusan: migrasi Next.js 14 → 16 (P1-6)

> Disusun 11 Okt 2026 untuk keputusan manusia. **Migrasi belum dilakukan** (Titik Henti marathon).
> Yang sudah dilakukan: mitigasi tanpa migrasi (§3) — diuji di build produksi lokal, belum di produksi.

## 1. Ringkasan & rekomendasi

| | |
|---|---|
| Versi sekarang | `next@14.2.35` (rilis terakhir jalur 14; dist-tag `next-14`) |
| `npm audit --omit=dev` | **3 paket rentan: 1 critical (`next`), 2 high (`postcss`, `source-map-js` — turunan `next`)**; 23 advisori untuk `next` |
| Perbaikan resmi untuk 14.x | **Tidak ada.** Setiap advisori 2026 di bawah hanya dipatch di 15.5.x dan 16.x |
| Rilis tujuan | `next@16.4.0` (`latest`) — atau `15.5.27` (`backport`) sebagai jalur cadangan |
| Terjangkau nyata setelah mitigasi | 4 DoS tanpa autentikasi (Server Action/RSC), 2 DoS optimizer gambar (sebagian diredam), 1 SSRF WebSocket (diredam di proxy, belum terverifikasi), 1 pengungkapan ID Server Action (dampak rendah) |
| Temuan terbukti | **XSS tersimpan di beranda lewat cache ISR** (GHSA-ffhc) — sudah ditutup di `src/middleware.ts` |

**Rekomendasi: setujui migrasi langsung ke Next 16.4.x sebagai satu blok kerja terpisah (perkiraan 3–4 hari
kerja termasuk verifikasi), dengan semua gerbang kualitas + `npm audit --omit=dev` tanpa high/critical sebagai
syarat selesai.** Sampai migrasi selesai, deploy publik **wajib** di belakang reverse proxy dengan aturan di
`docs/operations/deployment-guide.md` §Reverse proxy.

Alasan memilih 16, bukan 15.5: biaya terbesar (API permintaan async, React 19, tipe) sama untuk keduanya;
15.5 sudah berstatus *backport* (hanya perbaikan pilihan), sehingga berhenti di 15 berarti migrasi mayor kedua
dalam waktu dekat. Tambahan 15→16 bagi kode ini kecil dan terukur (§4).

## 2. Analisis keterjangkauan (reachability) per advisori

Metode: tiap advisori dibaca prasyaratnya di GitHub Advisory Database, lalu dicocokkan dengan konfigurasi & kode
proyek ini (`next.config.mjs`, `src/middleware.ts`, route handler, Server Action, `src/lib/storage.ts`).
"Terjangkau" = penyerang tanpa akun bisa memicunya pada topologi yang direkomendasikan
(`next start` di Linux, di belakang reverse proxy, tanpa CDN yang meng-cache HTML).

| Advisori | Sev. | Prasyarat | Di proyek ini | Status |
|---|---|---|---|---|
| GHSA-2xp9-vwfh-vxw4 RCE optimizer (libheif/AVIF) | critical | Optimizer memproses AVIF | `formats` memuat `image/avif` → optimizer meng-encode AVIF lewat libheif (sharp 0.35.5, libheif 1.23.5). Unggahan sudah menolak AVIF/HEIC (sniffing JPEG/PNG/WEBP) | **Diredam:** AVIF dimatikan + `localPatterns` hanya folder foto WebP. Sisa risiko: libheif masih ada di biner sharp, tapi tak lagi dipanggil |
| GHSA-p293-qw3h-jr36 RCE server Windows | critical | Host Windows | Target deploy Linux | Tidak terjangkau |
| GHSA-ffhc-5mcf-pf4q XSS nonce CSP | moderate* | App Router + nonce dari header permintaan | **Terbukti** (lihat §3.1): menjadi XSS tersimpan di `/` & `/wilayah` untuk semua pengunjung. *Dampak nyata di sini lebih tinggi dari rating advisori | **Ditutup** di middleware + regresi e2e |
| GHSA-h25m-26qc-wcjf DoS deserialisasi RSC | high | Endpoint Server Function | Ada Server Action publik (`/kontak`, `/persetujuan-wali`, `/masuk`) | **Terjangkau**, tanpa workaround |
| GHSA-q4gf-8mx6-v5v3 DoS Server Components | high | idem | idem | **Terjangkau**, tanpa workaround |
| GHSA-8h8q-6873-q5fj DoS Server Components | high | idem | idem | **Terjangkau**, tanpa workaround |
| GHSA-m99w-x7hq-7vfj DoS Server Actions | high | App Router + ≥1 Server Action | 22 berkas `'use server'` | **Terjangkau**, tanpa workaround |
| GHSA-c4j6-fc7j-m34r SSRF upgrade WebSocket | high | Server Node bawaan menerima upgrade WebSocket | `next start` = server bawaan; aplikasi tak butuh WebSocket | **Mungkin terjangkau** — PoC tidak dipublikasikan, tidak bisa diuji. Diredam: blokir `Upgrade` di proxy |
| GHSA-89xv-2m56-2m9x SSRF Server Action (custom server) | high | Host tidak dipin | `next start` ≥14.2 memin host (menurut advisori) | Tidak terjangkau; proxy tetap memin `Host` |
| GHSA-p9j2-gv94-2wf4 SSRF rewrites | high | `rewrites` ke host dari input | Tidak ada `rewrites`, middleware tak memakai `rewrite()` | Tidak terjangkau |
| GHSA-36qx-fr4f-26g5 bypass middleware (Pages + i18n) | high | Pages Router + `i18n` | App Router saja; otorisasi tidak bergantung middleware | Tidak terjangkau |
| GHSA-h64f-5h5j-jqjh DoS optimizer (berkas lokal besar) | moderate | Berkas lokal besar lewat `/_next/image` | Sebelumnya `/media/dokumen/*.pdf` (≤15 MB) bisa ditarik ke memori | **Diredam:** `localPatterns` hanya `/media/{foto,berita,situs}/**` + `/images/**` (WebP ≤2000 px) |
| GHSA-3x4c-7xq6-9pq8 cache disk optimizer tak terbatas | moderate | Banyak varian unik | Varian = lebar × kualitas (1–100, Next 14 tak punya `qualities`) × berkas | **Sebagian:** `localPatterns` + tanpa query; sisanya rate limit & pembersihan `.next/cache/images` |
| GHSA-955p-x3mx-jcvp pengungkapan ID Server Function | moderate | Server Action | ID terbaca dari chunk publik | Terjangkau, **dampak rendah**: setiap aksi memeriksa sesi/izin di server (invarian AGENTS §5) |
| GHSA-68g3-v927-f742 / GHSA-4633-3j49-mh5q cache `fetch` ber-body | moderate | `fetch` server ber-body yang di-cache | Dua `fetch` POST (webhook kontak, Sentry), keduanya `cache: 'no-store'`, UTF-8 | Tidak terjangkau |
| GHSA-4c39-4ccg-62r3 payload Server Action Edge | moderate | Server Action runtime Edge | Tidak ada `export const runtime` | Tidak terjangkau |
| GHSA-gx5p-jg67-6x7h XSS `beforeInteractive` | moderate | `next/script` + input tak tepercaya | Tidak memakai `next/script` | Tidak terjangkau |
| GHSA-ggv3-7p47-pfv8 smuggling via rewrites | moderate | `rewrites` ke backend eksternal | Tidak ada | Tidak terjangkau |
| GHSA-9g9p-9gw9-jx7f DoS `remotePatterns` | moderate | `remotePatterns` berisi domain luar | `remotePatterns: []` | Tidak terjangkau |
| GHSA-wfc6-r584-vfw7, GHSA-vfv6-92ff-j949 peracunan cache RSC | moderate/low | Cache bersama/CDN | Panduan deploy melarang cache HTML/RSC di CDN | Tidak terjangkau **bila panduan dipatuhi** |
| GHSA-3g8h-86w9-wvmq peracunan redirect middleware | low | CDN meng-cache 3xx | idem | Tidak terjangkau bila panduan dipatuhi |
| `postcss` ≤8.5.22 (4 advisori) & `source-map-js` 1.2.1 | high | Memproses CSS/source map tak tepercaya | Hanya saat build, CSS milik sendiri (Tailwind) | Tidak terjangkau saat runtime; hilang bersama Next 16 (`postcss@8.5.23`) |

## 3. Mitigasi yang sudah dipasang (tanpa migrasi)

### 3.1 Header CSP kiriman klien dibuang di semua rute — `src/middleware.ts`

Next 14 membaca nonce dari header **permintaan** `Content-Security-Policy` dan menulisnya ke
`<script nonce=${JSON.stringify(nonce)}>` (`next/dist/server/app-render/use-flight-response.js`). `JSON.stringify`
bukan escape HTML: kutip ganda di nonce palsu menutup atribut dan menyisipkan atribut baru (`src`/`onerror`).
Middleware lama hanya berjalan di `/dashboard` & `/masuk`, sehingga rute publik menerima header itu apa adanya.

Bukti di build produksi lokal (`ALLOW_PGLITE=1 next build && next start`, data demo):

| Skenario | Sebelum | Sesudah |
|---|---|---|
| `/cari`, `/berita/<slug-asing>` dengan header palsu (refleksi langsung) | nonce palsu di setiap `<script>` | bersih |
| Admin menyimpan berita (`revalidatePublicSite()`) → satu permintaan berheader palsu ke `/` → pengunjung biasa membuka `/` | **48 atribut sisipan, `alert()` berjalan di Chromium** | 0, tanpa dialog |
| idem untuk `/wilayah` | 34 atribut sisipan, `alert()` berjalan | 0 |

Jadi cukup satu permintaan pada saat yang tepat (setelah konten disimpan, atau saat `revalidate = 3600` habis —
mudah diotomasi dengan polling) untuk menyisipkan skrip ke beranda bagi semua pengunjung, termasuk pengurus yang
sedang masuk portal (origin sama). CSP statis tidak menahan karena halaman pra-render butuh `'unsafe-inline'`.

Perbaikan: matcher middleware kini mencakup semua rute halaman (kecuali `_next/static`, `_next/image`, `/media/`,
`favicon.ico`) dan selalu membuang `Content-Security-Policy` + `Content-Security-Policy-Report-Only` dari permintaan.
Catatan: Next sengaja melewati middleware untuk permintaan `x-prerender-revalidate` bertoken `previewModeId`
(rahasia build, hanya dipakai `res.revalidate()` Pages Router — tidak dipakai proyek ini).

Diuji di: `tests/unit/middleware.test.ts` (terbukti gagal bila baris pembuangan dihapus) dan langkah e2e
"header CSP kiriman klien tidak meracuni cache ISR" di `scripts/e2e-portal.mjs`.

### 3.2 Optimizer gambar — `next.config.mjs`

- `formats: ['image/webp']` (AVIF dimatikan, GHSA-2xp9).
- `localPatterns` hanya folder hasil `saveImage()` + `/images/**`, tanpa query string (GHSA-h64f, GHSA-3x4c).
  Dampak: tidak ada (SVG disajikan apa adanya oleh `next/image`; semua foto unggahan sudah WebP).

### 3.3 Aturan reverse proxy

Dicatat di `docs/operations/deployment-guide.md` §Reverse proxy. **Belum diverifikasi** — belum ada server produksi.

## 4. Perubahan mayor yang harus dikerjakan (diukur dari kode ini)

| Perubahan | Versi | Dampak di repo ini |
|---|---|---|
| API permintaan async: `params`, `searchParams`, `cookies()`, `headers()` menjadi Promise; akses sinkron **dihapus** di 16 | 15/16 | ±50 berkas `page/layout/route` memakai `params`/`searchParams`; 7 panggilan `cookies()`/`headers()` (sesi, `request.ts`, layout dashboard). Ada codemod `next-async-request-api`, tapi sesi & CSRF wajib ditinjau manual |
| React 19 (`@types/react` 19); `useFormState` → `useActionState` | 15 | 5 komponen (`ActionForm`, `ContactForm`, `MfaForms`, `ImportFlow`, `GuardianConsentFlow`) |
| Default caching berubah (GET route handler & `fetch` tidak di-cache) | 15 | Kecil: route handler kita sudah `force-dynamic`, `fetch` sudah `no-store` |
| `serverComponentsExternalPackages` → `serverExternalPackages`; `instrumentationHook` dihapus (stabil) | 15 | `next.config.mjs`; `onRequestError` jadi tersedia → ganti tambalan `console.error` di `src/lib/monitoring.ts` |
| `middleware.ts` → `proxy.ts` (runtime Node, bukan Edge) | 16 | 1 berkas; pembuangan header CSP tetap dipertahankan sebagai pertahanan berlapis |
| `next lint` dihapus; `@next/eslint-plugin-next` default Flat Config | 16 | Skrip `lint`, `.eslintrc.json` → `eslint.config.mjs` (codemod `next-lint-to-eslint-cli`), langkah CI |
| Turbopack default untuk `next build` | 16 | Tidak ada konfigurasi `webpack` kustom; perlu verifikasi PGlite/`pg`/`sharp` sebagai external dan trik `NEXT_RUNTIME` di `instrumentation.ts`. Jalan keluar sementara: `next build --webpack` |
| `next/image`: `qualities` default `[75]`, `minimumCacheTTL` 4 jam, query string butuh `localPatterns.search` | 16 | Sesuai keinginan (mengurangi varian); `localPatterns` sudah dipasang |
| `revalidateTag(tag)` satu argumen deprecated | 16 | Tidak dipakai (0 panggilan; kita memakai `revalidatePath`) |
| Node ≥ 20.9, TypeScript ≥ 5.1 | 16 | Sudah: Node 22, TypeScript 5.7 |

## 5. Risiko migrasi

1. **Regresi otorisasi** saat mengubah `params`/`cookies()` jadi async (mis. `await` terlupa → objek Promise dianggap
   truthy). Mitigasi: tes integrasi izin yang ada + tes keamanan Blok 3, tinjau manual setiap `requireUser`/`requirePermission`.
2. **CSP ber-nonce** — perilaku pembacaan nonce & skrip inline berubah antarversi. Mitigasi: audit CSP runtime di
   `npm run a11y` dan langkah CSP di e2e sudah ada dan terbukti bisa gagal.
3. **Turbopack** dengan paket WASM/native (PGlite, sharp). Mitigasi: `--webpack` sebagai jalan keluar sementara.
4. **React 19** — perbedaan hidrasi & formulir. Mitigasi: e2e alur kritis (20+ langkah) + axe 136+ pemindaian.
5. **`dynamicParams` & ISR** (AGENTS §2.5) — perilaku cache berubah; regresi 404 setelah revalidasi sudah dijaga e2e.

Tidak ada perubahan skema basis data → rollback = deploy ulang tag sebelumnya.

## 6. Rencana (bila disetujui)

1. Cabang khusus; bekukan fitur baru selama migrasi.
2. `npx @next/codemod@canary upgrade latest`, lalu `npx @next/codemod@canary next-async-request-api .`; tinjau diff manual.
3. React/React DOM 19.2 + `@types/react` 19; `useActionState`.
4. Konfigurasi: `serverExternalPackages`, hapus `instrumentationHook`, `onRequestError` untuk pemantauan; `proxy.ts`.
5. ESLint CLI + flat config; perbarui CI.
6. Gerbang: `typecheck`, `lint`, `test`, `build`, `a11y` (nol pelanggaran), `e2e`, **`npm audit --omit=dev` nol high/critical**.
7. Staging di belakang proxy ±1 minggu, lalu produksi. AVIF boleh dinyalakan lagi setelah versi terpasang ≥ 15.5.24/16.3.3.

## 7. Yang perlu diputuskan manusia

- Setuju/tidak migrasi ke 16.4.x dan kapan jendelanya (atau 15.5.27 bila ingin langkah lebih kecil).
- Siapa yang memasang & memverifikasi aturan reverse proxy sebelum situs dibuka ke publik.
- Selama belum migrasi: terima risiko sisa DoS tanpa autentikasi (tidak ada workaround di tingkat aplikasi).
