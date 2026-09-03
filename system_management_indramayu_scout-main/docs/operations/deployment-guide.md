# Deployment Guide

Dokumen ini menjelaskan strategi dan prosedur pengerahan (deployment) untuk aplikasi web Rumah Pramuka Indramayu.

## Deployment Target: Vercel

Sistem ini utamanya didesain untuk dijalankan menggunakan platform serverless **Vercel**, mengingat penggunaan *Next.js App Router* dan kompatibilitas zero-config yang ditawarkannya.

## Setup Vercel

Untuk melakukan deployment baru melalui Vercel dashboard:
1. Connect repositori dari GitHub/GitLab/Bitbucket ke Vercel.
2. Pada bagian Framework Preset, pilih **Next.js**.
3. Build command biarkan default atau gunakan: `pnpm build`.
4. Output directory biarkan default: `.next`.
5. Install command biarkan default atau pastikan menggunakan: `pnpm install`.

## Environment Variables (Vercel)

Di dashboard Vercel (bagian Project Settings > Environment Variables), tambahkan variabel wajib berikut untuk environment Production dan/atau Preview:
- `DATABASE_URL` (URL koneksi ke Production/Staging PostgreSQL)
- `NEXTAUTH_SECRET` (Sama seperti `.env.local` namun harus sangat rahasia)
- `NEXTAUTH_URL` (Domain resmi website, e.g., `https://pramukaindramayu.org`)
- `NEXT_PUBLIC_APP_URL` (Domain aplikasi yang terekspos ke klien)
- *Variabel tambahan sesuai integrasi (mis: Resend API Key, R2 Storage Key).*

## Branch Strategy

Siklus kode kita mengikuti branch policy sebagai berikut:
- `main`: Melambangkan environment **Production**. Terkunci dari push langsung.
- `staging`: Melambangkan environment **Staging/Preview**. Digunakan untuk pengetesan terintegrasi QA.
- `develop`: Lingkungan development (integrasi fitur harian).
- `feature/*`: Cabang pengerjaan fitur/perbaikan oleh developer.

## CI/CD (GitHub Actions)

Sebagai lapisan pipeline awal sebelum di-deploy Vercel, kita memanfaatkan GitHub Actions untuk menjalankan otomatisasi.

Contoh workflow sederhana (`.github/workflows/ci.yml`):
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging, develop]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint      # Lint check
      - run: pnpm typecheck # Type check
      - run: pnpm test      # Unit tests
      - run: pnpm build     # Build test
```
*Note:* Deploy ke Preview dilakukan otomatis on PR via integrasi Vercel GitHub App. Deploy ke Production terjadi otomatis ketika PR di-merge ke branch `main`.

## Staging vs Production

Berikut adalah matriks perbedaan lingkungan:

| Aspek | Staging | Production |
|---|---|---|
| URL | `*.preview.vercel.app` | Domain resmi |
| Database | Staging DB terpisah | Production DB utama |
| Data | Data sintetis / Test data | Real data pengguna (sensitif) |
| Tujuan | Uji regresi, QA, Demo | Live, melayani publik |

## Domain

- Tentukan domain utama yang akan digunakan (mis. `pramukaindramayu.org`).
- Setup DNS mapping di Vercel Dashboard menggunakan metode CNAME atau A Record sesuai petunjuk yang diberikan.
- Sertifikat HTTPS akan diprovision otomatis (via Let's Encrypt) oleh Vercel.

## Monitoring

Setelah live, status kesehatan sistem dipantau melalui:
- **Vercel Analytics / Speed Insights**: Memantau Web Vitals (FCP, LCP, CLS) dan trafik.
- **Sentry**: Integrasi error monitoring (server & browser errors) untuk notifikasi realtime jika terdapat exception.
- **Uptime Monitoring**: Pemanfaatan tools eksternal (UptimeRobot, BetterUptime) untuk deteksi downtime dini.
