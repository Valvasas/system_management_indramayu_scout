# Kebijakan Audit Log

> **Status implementasi (6 Okt 2026)** — kebenaran ada di kode.
>
> | Butir kebijakan | Status | Implementasi |
> |---|---|---|
> | Append-only, tidak bisa diubah/dihapus siapa pun | **Berlaku** | Trigger `audit_logs_guard` (UPDATE/DELETE/TRUNCATE ditolak, juga untuk pemilik skema) + `REVOKE` untuk user aplikasi (`drizzle/0004_audit_insert_only.sql`), diuji di PGlite dan PostgreSQL 16 |
> | Deteksi perubahan | **Berlaku** | Rantai HMAC `prev_hash`/`hash` (`src/lib/auth/audit-chain.ts`); verifikasi di `/dashboard/log/integritas` (izin `audit.verify`) |
> | Retensi otomatis | **Berlaku, satu tingkat** | `npm run db:retention`, bawaan 24 bulan (`RETENTION_AUDIT_LOG_MONTHS`, minimal 6), dengan jangkar rantai. Belum ada pembedaan 1 vs 3 tahun untuk log keamanan kritis |
> | Aksi yang dicatat | Sebagian besar | Login (sukses/gagal/MFA), reset & kode akses, MFA (aktif/reset/nonaktif), perubahan anggota & ekspor, persetujuan wali (diminta/diputuskan/dicabut), anonimisasi, mutasi, konten, backup, retensi |
> | Kolom: waktu, pelaku, aksi, entitas, ringkasan, IP | **Berlaku** | Tabel `audit_logs` |
> | Kolom: peran aktif, user agent, nilai lama/baru, status hasil | Belum | Ringkasan teks menyebut kolom yang berubah, bukan nilainya |
> | Akses baca log | Berlaku | `audit.view`: Super Admin & Pengurus Kwarcab (peran "Admin System" tidak ada) |
> | Recursive auditing (membuka modul log ikut tercatat) | Sebagian | Pemeriksaan integritas tercatat; membuka daftar log belum |

---

*Bagian di bawah adalah kebijakan (niat). Yang belum tercantum di status di atas belum berlaku.*


Dokumen ini merangkum mekanisme pencatatan riwayat aktivitas di sistem Rumah Pramuka Indramayu. Audit Log dirancang untuk menjamin akuntabilitas, keamanan, dan kemampuan pelacakan forensik apabila terjadi insiden kebocoran data atau penyalahgunaan akun.

## Aksi yang Wajib Dicatat

Sistem **wajib** mencatat event atau aktivitas berikut secara terus-menerus di background:

1. **Autentikasi & Akun**: Login sukses, Login gagal, Reset password.
2. **Manajemen Otorisasi**: Perubahan role pengguna, Perubahan permission, Perubahan penugasan (scope organisasi).
3. **Manajemen Data Anggota**: Perubahan data profil anggota, **Akses untuk melihat data sensitif**, Perubahan status anggota (aktif/non-aktif/arsip).
4. **Persetujuan Hukum**: Pemberian atau penarikan persetujuan (consent) dari wali untuk anggota anak.
5. **Impor/Ekspor & File**: Export data laporan, Import data massal, Upload file, Download file yang bersifat privat.
6. **Manajemen Konten (Fase 1)**: Publikasi berita/artikel baru, Penghapusan konten secara paksa (take down).
7. **Infrastruktur & Destruktif**: Pengaturan dan eksekusi mekanisme backup, Penghapusan data apa pun dari sistem.

## Format Log

Setiap rekaman dalam sistem Audit Log minimal memuat kolom/field berikut agar bermakna saat diperiksa:

- **Timestamp**: Waktu kejadian secara presisi (disimpan dalam UTC).
- **User ID**: ID sistem dari pengguna yang melakukan tindakan.
- **User Role**: Peran (role) yang aktif digunakan pengguna pada saat tindakan itu dilakukan.
- **Action Type**: Kategori aktivitas (misal: `UPDATE_MEMBER`, `EXPORT_BACKUP`, `LOGIN_FAILED`).
- **Target Entity**: ID objek yang dimodifikasi atau diakses.
- **Detail Perubahan**: Untuk modifikasi data sensitif, log harus mencatat snapshot dari `old value` dan `new value`.
- **IP Address**: Alamat IP publik dari perangkat klien.
- **User Agent**: Informasi browser atau perangkat yang digunakan pengguna.
- **Status**: Hasil dari tindakan tersebut (`success` atau `failure`).

## Kebijakan Retensi Log

- **Minimum Retensi**: Semua log reguler disimpan secara aktif minimum selama **1 tahun**.
- **Log Keamanan Kritis**: Log yang berkaitan dengan autentikasi, penghapusan data, dan pengelolaan hak akses disimpan secara aktif selama **3 tahun**.
- **Imutabilitas**: Audit log dirancang secara *append-only*. Audit log **tidak boleh diubah atau dihapus** oleh siapa pun (termasuk Super Admin). Proses penghapusan log lawas murni bergantung pada mekanisme retensi otomatis yang dijalankan oleh mesin (cronjob/database scheduler).

## Akses Log

- Data Audit Log merupakan informasi yang sangat rahasia dan berisi rekaman sistem yang mendalam.
- Modul pembacaan log di dasbor hanya boleh diakses oleh akun dengan tingkat tertinggi: **Super Admin** dan **Admin System**.
- Sistem menerapkan *recursive auditing*: Segala aktivitas di mana administrator mengakses dan menelusuri modul Audit Log itu sendiri **juga akan dicatat** (ter-log) untuk mencegah penyalahgunaan intaian.
