# Panduan Deployment

> Diperbarui 11 Okt 2026. Versi lama menyarankan Vercel + pnpm + NextAuth; tidak ada yang cocok dengan kode saat ini.
> **Belum ada deployment produksi yang diuji.** Dokumen ini menjelaskan syarat yang dituntut kode.

## Syarat lingkungan

| Kebutuhan | Alasan di kode |
|---|---|
| Proses Node.js 22 yang hidup lama (`npm run start`) | Sesi, rate limit, dan unggahan memakai server Node, bukan fungsi edge |
| PostgreSQL 16 (+ PostGIS untuk peta internal) | `DATABASE_URL` wajib di produksi; ditolak `src/lib/env.ts` bila kosong |
| Volume persisten untuk `STORAGE_DIR` | Foto & dokumen ditulis ke disk lokal (`src/lib/storage.ts`) |
| HTTPS di depan aplikasi | Cookie sesi `__Host-` + HSTS |

Karena unggahan ditulis ke disk lokal, platform *serverless* tanpa disk persisten (mis. Vercel) **tidak cocok**
tanpa memindahkan penyimpanan ke object storage lebih dulu. Target yang sesuai: VPS/kontainer dengan volume.

## Environment

Isi variabel di `.env.example`. Minimal untuk produksi: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `STORAGE_DIR`,
`DATA_ENCRYPTION_KEYS` + `DATA_ENCRYPTION_KEY_ID` (enkripsi kolom) dan `BLIND_INDEX_KEY` (HMAC kode & indeks).
Server menolak start bila konfigurasi tidak valid (lihat pesan `EnvError`).
Jangan set `ALLOW_PGLITE=1`, `ALLOW_DEV_KEYS=1`, atau `INSECURE_COOKIES=1` di server publik.

## Langkah

```bash
npm ci
npm run db:migrate            # dengan user pemilik skema
npm run db:seed               # Kwarran + Super Admin (ADMIN_USERNAME/NAME/PASSWORD)
npm run build
npm run start                 # dengan DATABASE_URL user aplikasi non-superuser
```

## Reverse proxy (wajib selama masih Next 14)

Next 14 tidak lagi menerima perbaikan keamanan (lihat `docs/operations/keputusan-next-16.md`). Sebagian celahnya
hanya bisa diredam di depan aplikasi:

| Aturan di proxy (nginx/Caddy/CDN) | Celah yang diredam |
|---|---|
| Buang header permintaan `Content-Security-Policy` & `Content-Security-Policy-Report-Only` | GHSA-ffhc-5mcf-pf4q — lapis kedua; aplikasi sudah membuangnya di `src/middleware.ts` |
| Tetapkan `Host`/`X-Forwarded-Host` ke domain resmi; tolak host lain | GHSA-89xv-2m56-2m9x (SSRF Server Action) |
| Tolak permintaan `Upgrade: websocket` (aplikasi tidak memakai WebSocket) | GHSA-c4j6-fc7j-m34r (SSRF lewat upgrade WebSocket) |
| **Jangan** cache HTML/RSC di cache bersama (CDN), atau cache hanya `/_next/static/*` | GHSA-wfc6-r584-vfw7, GHSA-vfv6-92ff-j949, GHSA-3g8h-86w9-wvmq (peracunan cache) |
| Batas ukuran body ±35 MB + rate limit per IP untuk `POST` | GHSA-m99w-x7hq-7vfj, GHSA-8h8q-6873-q5fj, GHSA-q4gf-8mx6-v5v3 (DoS Server Action/RSC) |
| Rate limit `/_next/image` + bersihkan `.next/cache/images` berkala | GHSA-3x4c-7xq6-9pq8, GHSA-h64f-5h5j-jqjh (DoS optimizer) |
| Jalankan proses dengan restart otomatis (systemd/`restart: always`) + ≥2 instance bila memungkinkan | Semua DoS di atas: satu permintaan jahat bisa menahan satu proses |

## CI

`.github/workflows/ci.yml`: format → lint → typecheck → test → seed demo → build (PGlite) → axe → e2e.
Tidak ada deploy otomatis.

## Pemantauan & backup

Lihat `docs/operations/monitoring.md` dan `docs/security/backup-policy.md` (bila sudah tersedia).
