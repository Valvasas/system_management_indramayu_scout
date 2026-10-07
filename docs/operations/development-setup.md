# Panduan Setup Pengembangan

> Diperbarui 6 Okt 2026. Versi lama dokumen ini menyebut pnpm, Prisma, dan NextAuth — **tidak satu pun dipakai proyek**.
> Kebenaran ada di `package.json`, `.env.example`, dan `CODEMAP.md`.

## Prasyarat

- **Node.js 22** (sama dengan CI) dan **npm** (lockfile: `package-lock.json`).
- **Git**.
- Opsional: **Docker** untuk PostgreSQL + PostGIS. Tanpa Docker, aplikasi memakai PGlite (PostgreSQL di dalam proses).

## Install & jalankan

```bash
npm ci
npm run db:seed -- --demo     # data FIKTIF + 6 akun demo (sandi demo-pramuka-2026)
npm run dev                   # http://localhost:3000
```

Tanpa `DATABASE_URL`, data disimpan di `.data/pglite` dan migrasi berjalan otomatis saat koneksi pertama.
Hapus folder itu untuk mulai dari nol.

## Environment

Salin `.env.example` ke `.env.local`. Setiap variabel dijelaskan di file itu dan divalidasi oleh
`src/lib/env.ts` saat server start. Konfigurasi cacat menghentikan server dengan pesan yang hanya
menyebut nama variabel (nilai rahasia tidak pernah dicetak).

Kode aplikasi **tidak boleh** membaca `process.env` langsung. Tambah variabel baru di `env.ts`
(skema + aturan pesan) dan `.env.example` sekaligus.

## PostgreSQL lewat Docker (opsional)

```bash
# isi POSTGRES_PASSWORD di .env (dibaca docker compose)
docker compose up -d
DATABASE_URL="postgresql://rumah_pramuka_app:<password>@127.0.0.1:5432/rumah_pramuka" npm run db:migrate
```

`docker/db-init/` membuat user aplikasi non-superuser saat volume pertama kali dibuat.

## Perubahan skema

Edit `src/db/schema.ts` lalu `npm run db:generate`. Jangan menulis SQL migrasi dengan tangan.

## Gerbang kualitas

```bash
npm run typecheck && npm run lint && npm run format:check && npm test
npm run db:seed -- --demo && ALLOW_PGLITE=1 npm run build
ALLOW_PGLITE=1 npm run start          # terminal lain
npm run a11y && npm run e2e           # e2e mengubah data: seed ulang sebelum menjalankannya lagi
```

## Ekstensi editor yang disarankan

ESLint, Prettier, Tailwind CSS IntelliSense.

## Pemecahan masalah

- **`EnvError: Konfigurasi environment tidak valid`** — baca daftar variabel di pesan, cocokkan dengan `.env.example`.
- **Port 5432 bentrok** — matikan PostgreSQL lokal lain sebelum `docker compose up`.
- **Data demo berantakan setelah e2e** — `rm -rf .data/pglite && npm run db:seed -- --demo`.
