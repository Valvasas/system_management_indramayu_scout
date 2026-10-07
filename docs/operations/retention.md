# Retensi & Penghapusan Data

> Implementasi: `src/features/retention/retention.ts` (retensi), `src/features/members/anonymize.ts` (anonimisasi).
> Diuji: `tests/integration/retention.test.ts`, `tests/integration/anonymize.test.ts`.

## Masa simpan (bisa diatur lewat env)

| Data | Dihapus bila | Env (bawaan) |
|---|---|---|
| Sesi masuk | sudah kedaluwarsa | — |
| Kode akses (aktivasi/reset) | terpakai atau kedaluwarsa lebih dari N hari | `RETENTION_ACCESS_CODES_DAYS` (30) |
| Kode persetujuan wali yang **tidak** dipakai | kedaluwarsa/dibatalkan lebih dari N hari | `RETENTION_ACCESS_CODES_DAYS` (30) |
| Permintaan reset sandi yang selesai | dibuat lebih dari N hari lalu (yang masih terbuka tidak dihapus) | `RETENTION_RESET_REQUESTS_DAYS` (90) |
| Penghitung rate limit | jendela waktunya lewat | — |
| Pesan formulir `/kontak` | diterima lebih dari N hari lalu | `RETENTION_CONTACT_MESSAGES_DAYS` (365) |
| Log audit | lebih tua dari N bulan (minimal 6) | `RETENTION_AUDIT_LOG_MONTHS` (24) |

Yang **tidak** dihapus otomatis: data anggota, riwayat mutasi, pendaftaran kegiatan, keputusan persetujuan wali,
dan kode persetujuan yang sudah dipakai (bukti asal persetujuan). Data anggota dihapus identitasnya lewat
anonimisasi (di bawah), bukan dihapus barisnya.

## Menjalankan

```bash
npm run db:retention -- --dry-run   # hitung saja
npm run db:retention                # hapus
```

**Pakai `DATABASE_URL` pemilik skema** (user `postgres` atau peran migrasi). User aplikasi sengaja tidak punya hak
`DELETE` pada `audit_logs`; dengan user itu bagian log dilewati dan dilaporkan `tidak-diizinkan`, bagian lain tetap jalan.
Setiap penghapusan log mencatat jangkar rantai (`audit_chain_anchors`) sehingga `/dashboard/log/integritas` tetap lulus.
Setiap kali berjalan, skrip menulis satu entri log `retention.run` berisi jumlah baris per kategori.

## Penjadwalan

Jalankan **harian** di server yang sama dengan aplikasi (koneksi DB lokal, tanpa membuka port ke internet).

### cron

```cron
# /etc/cron.d/rumah-pramuka — 02.15 WIB setiap hari
15 2 * * * deploy cd /srv/rumah-pramuka && DATABASE_URL="$(cat /etc/rumah-pramuka/owner-db-url)" npm run db:retention >> /var/log/rumah-pramuka-retensi.log 2>&1
```

### systemd timer

```ini
# /etc/systemd/system/rumah-pramuka-retensi.service
[Service]
Type=oneshot
WorkingDirectory=/srv/rumah-pramuka
EnvironmentFile=/etc/rumah-pramuka/owner.env
ExecStart=/usr/bin/npm run db:retention

# /etc/systemd/system/rumah-pramuka-retensi.timer
[Timer]
OnCalendar=*-*-* 02:15:00 Asia/Jakarta
Persistent=true
[Install]
WantedBy=timers.target
```

### GitHub Actions (tidak disarankan)

`schedule:` di Actions hanya cocok bila basis data bisa dijangkau dari runner GitHub, artinya membuka port PostgreSQL
ke internet atau memasang tunnel. Untuk data anak, itu menambah permukaan serangan. Bila tetap dipilih: pakai secret
`OWNER_DATABASE_URL`, koneksi TLS wajib, dan allowlist IP runner.

## Anonimisasi (hak subjek data)

Untuk permintaan penghapusan dari anggota/wali (UU PDP Pasal 8 & 16). Di detail anggota yang **sudah diarsipkan**,
Super Admin atau Pengurus Kwarcab (izin `members.anonymize`) menekan **Anonimkan sekarang**.

- Dihapus: nama, KTA, tanggal & bulan lahir (tahun disimpan untuk statistik golongan), telepon, alamat, data wali,
  catatan, nama wali di riwayat persetujuan, HMAC IP persetujuan; akun portal dinonaktifkan, nama penggunanya diganti,
  sesi/kode akses/MFA dihapus.
- Dipertahankan tanpa nama: baris anggota (golongan, gudep, status, tanggal bergabung), riwayat mutasi,
  pendaftaran kegiatan, keputusan persetujuan.
- Tidak dapat dibatalkan dan tidak bisa dipulihkan dari arsip.
- **Keterbatasan yang diketahui:** log audit bersifat append-only, sehingga ringkasan log lama yang menyebut nama
  anggota baru hilang saat retensi log (bawaan 24 bulan). Teks bebas yang diketik staf (mis. alasan mutasi) tidak
  dipindai otomatis.
