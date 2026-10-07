# Model Otorisasi (RBAC + Cakupan)

> Diperbarui 6 Okt 2026 dari kode. Sumber kebenaran: `src/lib/auth/permissions.ts` (izin per peran),
> `src/lib/auth/scope.ts` (cakupan baris data), `src/lib/auth/session.ts` (`requireUser`/`requirePermission`),
> `src/lib/auth/mfa-policy.ts` (MFA). Versi lama dokumen ini memuat peran dan izin rancangan Fase 1 yang tidak pernah ada.
> Niat produk jangka panjang (peran wali, pelatih, panitia kegiatan): `docs/product/rancangan-v5.md`.

## Dua lapis kontrol

1. **Izin peran** — boleh melakukan apa (`roleCan(role, permission)`).
2. **Cakupan** — boleh menyentuh baris data mana (`memberScope`, `gudepScope`, `canAccessGudep`).

Keduanya **dicek di server** pada setiap halaman, Server Action, dan route handler. Menyembunyikan tombol di UI bukan
kontrol akses. Tanpa izin → `notFound()` (404), sehingga keberadaan halaman tidak bocor. Data di luar cakupan diperlakukan
sama dengan tidak ada ("tidak ditemukan atau di luar wilayah Anda").

## Peran

| Peran | Kode | Cakupan |
|---|---|---|
| Super Admin | `SUPER_ADMIN` | Seluruh kabupaten + izin sistem khusus |
| Pengurus Kwarcab | `ADMIN_KWARCAB` | Seluruh kabupaten |
| Admin Website | `ADMIN_WEBSITE` | Konten publik saja (tanpa data anggota) |
| Staf Kwarran | `STAFF_KWARRAN` | Gudep & anggota di satu kwarran (`users.kwarran_id`) |
| Pembina / Staf Gudep | `STAFF_GUDEP` | Satu gudep (`users.gudep_id`) |
| Peserta | `PESERTA` | Data dirinya sendiri (`users.member_id`) |

Akun staf tanpa penugasan wilayah/gudep tidak melihat data apa pun (gagal tertutup).
**Orang tua/wali tidak punya akun**: mereka memakai kode persetujuan sekali pakai (lihat Persetujuan wali di bawah).

## Matriks izin

Dihasilkan dari kode (`npm run docs:matrix`). Tes `tests/unit/authorization-doc.test.ts` gagal bila tabel ini tidak sama
dengan `permissions.ts` — perbarui keduanya bersamaan.

<!-- matriks:mulai -->
| Izin | Super Admin | Pengurus Kwarcab | Admin Website | Staf Kwarran | Pembina / Staf Gudep | Peserta |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `members.read` | ya | ya | — | ya | ya | — |
| `members.create` | ya | ya | — | ya | ya | — |
| `members.update` | ya | ya | — | ya | ya | — |
| `members.verify` | ya | ya | — | ya | — | — |
| `members.archive` | ya | ya | — | ya | — | — |
| `members.export` | ya | ya | — | ya | ya | — |
| `members.import` | ya | ya | — | ya | ya | — |
| `members.view_sensitive` | ya | ya | — | ya | ya | — |
| `members.anonymize` | ya | ya | — | — | — | — |
| `gudep.read` | ya | ya | — | ya | ya | — |
| `gudep.create` | ya | ya | — | ya | — | — |
| `gudep.update` | ya | ya | — | ya | ya | — |
| `kwarran.manage` | ya | ya | — | — | — | — |
| `users.manage` | ya | ya | — | — | — | — |
| `users.create_peserta` | ya | ya | — | ya | ya | — |
| `content.manage` | ya | ya | ya | — | — | — |
| `content.contribute` | ya | ya | ya | ya | ya | — |
| `announcements.manage` | ya | ya | ya | ya | ya | — |
| `messages.read` | ya | ya | ya | — | — | — |
| `settings.manage` | ya | ya | ya | — | — | — |
| `audit.view` | ya | ya | — | — | — | — |
| `audit.verify` | ya | — | — | — | — | — |
| `users.reset_mfa` | ya | — | — | — | — | — |
| `system.backup` | ya | — | — | — | — | — |
| `self.portal` | — | — | — | — | — | ya |
<!-- matriks:selesai -->

**Izin khusus Super Admin** (`SUPER_ADMIN_ONLY`): `audit.verify`, `users.reset_mfa`, `system.backup`. Pengurus Kwarcab
mendapat semua izin lain kecuali `self.portal`.

## Aturan khusus

| Aturan | Implementasi | Diuji |
|---|---|---|
| Pencegahan eskalasi hak: pengelola akun hanya bisa memberi peran di bawahnya; akun Super Admin hanya diubah Super Admin | `assignableRoles()`, halaman `pengguna/[id]` | `tests/unit/permissions.test.ts` |
| Pembina tidak pernah melihat/menentukan sandi anggota; akses akun lewat kode akses sekali pakai | `features/auth/access-codes.ts` | `tests/unit/access-code.test.ts`, e2e |
| **MFA wajib** untuk Super Admin + pemegang `users.manage`/`content.manage`/`audit.view` setelah `MFA_GRACE_DAYS`; setelah tenggang habis portal terkunci ke `/dashboard/akun/mfa` | `mfa-policy.ts`, `requireUser()` | `tests/unit/mfa.test.ts`, `tests/integration/mfa.test.ts`, e2e |
| Sesi "sandi benar, MFA belum" (`sessions.mfa_pending`) tidak memberi akses portal; kode akses dari pembina tidak melewati MFA | `session.ts`, `access-actions.ts` | e2e |
| Reset MFA hanya `users.reset_mfa`, tidak untuk diri sendiri, memutus semua sesi target, tercatat | `canResetMfa()`, `resetUserMfaAction` | `tests/unit/mfa.test.ts` |
| Percobaan kode MFA ≤ 5/15 menit per akun (+ per IP), dicek **sebelum** kode diperiksa, fail-closed | `guardedSecondFactor()` | `tests/integration/mfa.test.ts` |
| **Persetujuan wali**: staf (`members.update`, dalam cakupan) hanya bisa *meminta* kode & *mencatat pencabutan*; memberi persetujuan hanya lewat kode wali | `features/consent/consent.ts` | `tests/integration/consent.test.ts` |
| Verifikasi anggota < 18 tahun mensyaratkan persetujuan DATA dari wali (bukan tanggal manual) | `verifyMemberAction` | `tests/unit/consent.test.ts` |
| Anonimisasi hanya `members.anonymize` (Kwarcab), hanya anggota diarsipkan, dalam cakupan, tidak bisa dibatalkan | `features/members/anonymize.ts` | `tests/integration/anonymize.test.ts` |
| Log audit INSERT-only: trigger + `REVOKE` untuk user aplikasi; integritas dicek `audit.verify` | `drizzle/0004_…`, `audit-chain.ts` | `tests/integration/audit-chain.test.ts`, `retention.test.ts` |
| Backup manual & uji pulih hanya `system.backup` | `features/backup/backup-actions.ts` | `tests/integration/backup.test.ts` |
| Peserta tidak melihat alamat, telepon, data wali; menu staf 404 | `self.portal`, `features/portal` | e2e |

## Cakupan per peran

- **Kwarcab** (`SUPER_ADMIN`, `ADMIN_KWARCAB`): tanpa batas wilayah.
- **Kwarran**: `gudep.kwarran_id = users.kwarran_id`.
- **Gudep**: `members.gudep_id = users.gudep_id`.
- **Mutasi**: diajukan dari cakupan gudep asal, diputuskan pengurus yang berwenang atas gudep **tujuan**.
- **Lainnya**: tidak ada data organisasi (`sql false`).

Setiap aksi tulis yang menerima `id` dari klien memuat ulang barisnya **lewat filter cakupan** sebelum menulis
(mis. `getMember(user, id)`), sehingga IDOR antar-gudep/kwarran menghasilkan "tidak ditemukan".

## Yang belum ada

Peran wali dengan akun, pelatih, panitia kegiatan dengan cakupan per kegiatan, dan persetujuan staf oleh Kwarcab
(rancangan V5 §6) belum diimplementasikan.
