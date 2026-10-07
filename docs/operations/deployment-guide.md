# Panduan Deployment

> Diperbarui 6 Okt 2026. Versi lama menyarankan Vercel + pnpm + NextAuth; tidak ada yang cocok dengan kode saat ini.
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

Isi variabel di `.env.example`. Minimal untuk produksi: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `STORAGE_DIR`.
Server menolak start bila konfigurasi tidak valid (lihat pesan `EnvError`).
Jangan set `ALLOW_PGLITE=1` atau `INSECURE_COOKIES=1` di server publik.

## Langkah

```bash
npm ci
npm run db:migrate            # dengan user pemilik skema
npm run db:seed               # Kwarran + Super Admin (ADMIN_USERNAME/NAME/PASSWORD)
npm run build
npm run start                 # dengan DATABASE_URL user aplikasi non-superuser
```

## CI

`.github/workflows/ci.yml`: format → lint → typecheck → test → seed demo → build (PGlite) → axe → e2e.
Tidak ada deploy otomatis.

## Pemantauan & backup

Lihat `docs/operations/monitoring.md` dan `docs/security/backup-policy.md` (bila sudah tersedia).
