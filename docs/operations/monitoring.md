# Pemantauan, Backup & Uji Pulih

> Implementasi: `src/lib/monitoring.ts`, `src/app/api/health/route.ts`, `src/features/backup/backup.ts`, `/dashboard/backup`.
> Prosedur backup/restore di bawah **sudah dijalankan** pada PostgreSQL 16 lokal (6 Okt 2026): `pg_dump` sebagai user
> aplikasi → `sha256sum -c` → `pg_restore` ke database baru → 24 anggota, 6 akun, 46 persetujuan, 11 migrasi utuh →
> `npm run db:migrate` pada hasil restore tidak menjalankan ulang apa pun. **Belum diuji di server produksi.**

## 1. Pemeriksaan kesehatan

`GET /api/health` → `200 {"status":"ok","checks":{"database":"ok"}}` atau `503` bila basis data tidak terjangkau
(batas 3 detik). Tidak memuat versi, konfigurasi, atau pesan galat. Arahkan pemantau uptime (UptimeRobot,
Better Stack, atau `curl` dari cron) ke URL ini setiap 1–5 menit dan kirim peringatan bila dua kali berturut-turut gagal.

## 2. Pelaporan galat (Sentry, opsional)

Aktif hanya bila `SENTRY_DSN` diisi (dan `SENTRY_ENVIRONMENT`, mis. `production`). Hanya galat **server** yang dikirim:

- Sumber: galat yang dicetak Next lewat `console.error` (render, Server Action, route handler), `unhandledRejection`,
  dan pemanggilan langsung `reportError()` (mis. health check gagal).
- Disamarkan sebelum dikirim (`scrub()`): pos-el, nomor telepon, angka ≥ 10 digit (NIK), IP, kode akses `ABCD-2345`,
  kata sandi/token, kredensial di URL PostgreSQL, dan query string.
- Tidak dikirim: data pengguna, cookie, header, isi request.

**Mengapa tanpa SDK resmi.** `@sentry/nextjs` menambah skrip di peramban (melonggarkan CSP dan mengirim data peramban
pengguna anak) serta instrumentasi otomatis yang merekam URL/header. Klien envelope minimal di `monitoring.ts` cukup untuk
galat server. Bila kelak butuh tracing/performance, nilai ulang dengan `@sentry/node` + `beforeSend` yang memakai `scrub()`.

**Keterbatasan Next 14:** tidak ada hook `onRequestError` (baru di Next 15). Galat render ditangkap lewat `console.error`.

## 3. Backup

| Cara | Kapan |
|---|---|
| Otomatis harian di server | **Wajib** untuk produksi |
| Tombol **Backup sekarang** di `/dashboard/backup` (izin `system.backup`, Super Admin) | Sebelum pembaruan besar / migrasi |
| `npm run db:backup` (`-- --verify` untuk langsung uji pulih) | Dari cron atau manual |

- PostgreSQL: `pg_dump --format=custom` (butuh `pg_dump` versi ≥ server di mesin aplikasi). Sandi lewat `PGPASSWORD`,
  bukan argumen. Berjalan dengan user aplikasi (punya `SELECT` termasuk jurnal migrasi, `drizzle/0010_…`).
- PGlite (demo/pengembangan): dump folder data dari proses yang sedang berjalan. **Jangan** jalankan
  `npm run db:backup` selagi server memakai folder PGlite yang sama — pakai tombol di portal.
- Hasil: `BACKUP_DIR/rumah-pramuka-YYYYMMDD-HHMMSS.dump` + `.sha256` (izin `600`), riwayat di tabel `backup_runs`,
  hanya `BACKUP_KEEP` berkas terbaru yang disimpan (bawaan 14).
- **Berkas unggahan (`STORAGE_DIR`) tidak termasuk.** Backup terpisah dengan `restic`/`rsync` ke lokasi lain.
- **Kunci enkripsi.** Telepon, alamat, data wali, dan rahasia MFA di dalam backup tetap terenkripsi. Simpan
  `DATA_ENCRYPTION_KEYS` + `BLIND_INDEX_KEY` di pengelola rahasia/brankas **terpisah** dari berkas backup.
  Backup tanpa kunci = kolom itu hilang; kunci bersama backup = enkripsi tidak berguna.
- Salin backup ke luar server (aturan 3-2-1) dalam bentuk terenkripsi, mis. `age -r <kunci-publik> berkas.dump`.

Contoh cron (02.40 WIB, setelah retensi):

```cron
40 2 * * * deploy cd /srv/rumah-pramuka && npm run db:backup -- --verify >> /var/log/rumah-pramuka-backup.log 2>&1
```

## 4. Uji pulih (lakukan bulanan, dan setiap mengubah prosedur)

Tombol **Uji pulih** di portal memeriksa checksum lalu: PGlite → memulihkan ke basis data sementara dan menghitung baris;
PostgreSQL → `pg_restore --list`. Uji pulih **penuh** PostgreSQL dilakukan manual:

```bash
cd "$BACKUP_DIR" && sha256sum -c rumah-pramuka-YYYYMMDD-HHMMSS.dump.sha256
createdb -h <host> -U postgres restore_uji
pg_restore -h <host> -U postgres --no-owner --dbname restore_uji rumah-pramuka-YYYYMMDD-HHMMSS.dump
psql -h <host> -U postgres restore_uji -c "SELECT (SELECT count(*) FROM members), (SELECT count(*) FROM users), (SELECT count(*) FROM drizzle.__drizzle_migrations)"
DATABASE_URL=postgresql://postgres:…@<host>/restore_uji npm run db:migrate   # harus tanpa perubahan
dropdb -h <host> -U postgres restore_uji
```

Catat hasilnya (tanggal, berkas, jumlah baris) di agenda sekretariat. Pemulihan sesungguhnya: hentikan aplikasi,
`pg_restore --clean --if-exists` ke database produksi, pulihkan `STORAGE_DIR`, jalankan aplikasi, periksa
`/api/health` dan `/dashboard/log/integritas`.

## 5. Daftar periksa operasi

- [ ] `/api/health` dipantau dari luar server
- [ ] `SENTRY_DSN` diisi (opsional) dan satu galat uji muncul tersamar
- [ ] cron retensi (`docs/operations/retention.md`) + backup harian aktif
- [ ] kunci enkripsi tersimpan di brankas terpisah
- [ ] uji pulih bulanan tercatat
- [ ] kepala rantai log (`/dashboard/log/integritas`) dicatat mingguan
