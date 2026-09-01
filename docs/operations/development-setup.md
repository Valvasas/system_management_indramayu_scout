# Development Setup Guide

Dokumen ini memandu Anda dalam menyiapkan lingkungan kerja (development environment) untuk berkontribusi pada proyek Rumah Pramuka Indramayu.

## Prasyarat

Sebelum memulai, pastikan sistem Anda telah memiliki perangkat lunak berikut yang terpasang dengan benar:
- **Node.js** >= 20 LTS
- **pnpm** >= 9 (Package Manager)
- **Docker Desktop** (Untuk menjalankan database lokal)
- **Git** (Version Control System)
- **VS Code** (Rekomendasi Code Editor)

## Clone & Install

Langkah pertama adalah mengunduh repositori dan menginstal seluruh dependensi.

```bash
git clone <repo-url>
cd rumah-pramuka-indramayu
pnpm install
```

## Database Setup (Docker)

Proyek ini memanfaatkan kontainer Docker untuk menjamin keseragaman database environment yang mencakup PostgreSQL dengan ekstensi PostGIS. 

File `docker-compose.yml` telah disediakan:

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgis/postgis:16-3.4
    container_name: rpi-database
    environment:
      POSTGRES_DB: rumah_pramuka
      POSTGRES_USER: pramuka_dev
      POSTGRES_PASSWORD: pramuka_dev_password
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Jalankan container database dalam mode background (detached):
```bash
docker compose up -d
```

## Environment Variables

Salin template variabel lingkungan `.env.example` menjadi `.env.local` dan konfigurasikan isinya:

```env
# .env.local
DATABASE_URL="postgresql://pramuka_dev:pramuka_dev_password@localhost:5432/rumah_pramuka"
NEXTAUTH_SECRET="generate-random-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_LOCALE="id"
```
*(Ganti `generate-random-secret` dengan string acak yang kuat).*

## Prisma Setup

Lakukan sinkronisasi schema Prisma ke dalam database development:

```bash
# Melakukan generate Prisma Client
pnpm prisma generate

# Sinkronisasi schema saat development (tanpa membuat riwayat migrasi)
pnpm prisma db push

# Menjalankan migrasi secara resmi (saat schema sudah matang/stabil)
pnpm prisma migrate dev
```

## Run Development Server

Jalankan server aplikasi Next.js dalam mode development:

```bash
pnpm dev
```
Setelah server menyala, Anda dapat membuka browser dan mengakses: **http://localhost:3000**

## VS Code Extensions (Rekomendasi)

Untuk memaksimalkan produktivitas dan kepatuhan standar proyek, pasang ekstensi VS Code berikut:
- **ESLint** (Linting kode JavaScript/TypeScript)
- **Prettier - Code formatter** (Konsistensi format kode)
- **Tailwind CSS IntelliSense** (Autocomplete class Tailwind)
- **Prisma** (Syntax highlighting & formatting `.prisma`)
- **PostCSS Language Support** (Dukungan syntax PostCSS)

## Troubleshooting

### Docker tidak start
Pastikan Docker Desktop (atau daemon Docker) sedang berjalan. Cek koneksi atau jika terdapat pesan error `permission denied`.

### Port 5432 Conflict
Jika saat menjalankan `docker compose up` terdapat error port 5432 in use, itu berarti ada instansi PostgreSQL lain yang berjalan di komputer Anda. Matikan service Postgres lokal (seperti service bawaan Windows/Mac) sebelum menjalankan container.

### Prisma Connection Error
Cek kesesuaian credentials (username, password, db name, port) pada string `DATABASE_URL` di file `.env.local`. Pastikan container berjalan sehat dengan perintah `docker ps`.
