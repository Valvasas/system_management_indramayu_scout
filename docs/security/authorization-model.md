# Model Otorisasi (RBAC)

Dokumen ini mendefinisikan model Role-Based Access Control (RBAC) yang digunakan dalam portal Rumah Pramuka Indramayu.

## Model Akses

Arsitektur model akses memisahkan antara akun (identitas pengguna), profil keanggotaan, role, dan penugasan organisasi (scope):

```text
Account
├── User profile
├── Member profile
├── Role
├── Permission
├── Organization scope
└── Organization assignment
```

## Prinsip Akun

- **Satu orang = satu akun identitas**. Setiap individu hanya mendaftarkan satu akun utama yang merepresentasikan profil fisik mereka.
- **Satu akun dapat memiliki lebih dari satu penugasan**. Pengguna dapat mengemban beberapa peran secara bersamaan dalam berbagai scope organisasi.
- *Contoh Kasus*: Saudara Rizky dapat terdaftar sebagai Anggota Penegak, sekaligus bertugas sebagai Staff Administrasi di Gudep-nya, dan merangkap sebagai Panitia Kegiatan di tingkat Kwarcab menggunakan satu akun yang sama.

## Role Dasar

Sistem memiliki beberapa role dasar yang terikat dengan fase pengembangan proyek:

| Role | Deskripsi | Fase Aktif |
|---|---|---|
| Public Visitor | Pengunjung publik tanpa proses autentikasi (login) | Fase 1 |
| Member Penggalang | Anggota muda usia SMP/MTs | Fase 2 |
| Member Penegak | Anggota muda usia SMA/MA | Fase 2 |
| Member Pandega | Anggota muda usia perguruan tinggi | Fase 2 |
| Parent / Guardian | Orang tua atau wali dari anggota muda | Fase 2 |
| Pembina | Pembina di tingkat Gugus Depan | Fase 2 |
| Pelatih | Pelatih kegiatan kepramukaan | Fase 2 |
| Staff Gudep | Staff atau pengurus administrasi di Gugus Depan | Fase 2 |
| Staff Kwarran | Staff atau pengurus administrasi di tingkat Kwarran | Fase 2 |
| Staff Kwarcab | Staff atau pengurus administrasi di tingkat Kwarcab | Fase 2 |
| Admin Website | Administrator pengelola konten publik website | Fase 1 |
| Admin System | Administrator untuk konfigurasi teknis sistem | Fase 1 |
| Super Admin | Akses tertinggi mencakup semua izin dalam sistem | Fase 1 |

> [!NOTE]
> Pada pengembangan **Fase 1**, hanya role **Public Visitor**, **Admin Website**, dan **Super Admin** (serta Admin System) yang diaktifkan.

## Permission Matrix

Daftar izin (permissions) yang ada pada sistem meliputi:
- `members.read`, `members.create`, `members.update`, `members.verify`, `members.archive`, `members.export`, `members.view_sensitive`
- `organizations.read`, `organizations.manage`
- `events.create`, `events.review`, `events.publish`, `events.manage`
- `news.create`, `news.review`, `news.publish`, `news.archive`
- `gallery.create`, `gallery.review`, `gallery.publish`
- `roles.manage`, `permissions.manage`
- `audit_logs.view`, `backups.manage`, `system.manage`

### Matriks Otorisasi (Fase 1)

| Permission / Role | Public Visitor | Admin Website | Admin System | Super Admin |
|---|:---:|:---:|:---:|:---:|
| `news.read` (implicit) | ✓ | ✓ | ✓ | ✓ |
| `news.create` | | ✓ | | ✓ |
| `news.publish` | | ✓ | | ✓ |
| `gallery.publish` | | ✓ | | ✓ |
| `events.publish` | | ✓ | | ✓ |
| `system.manage` | | | ✓ | ✓ |
| `roles.manage` | | | ✓ | ✓ |
| `audit_logs.view` | | | ✓ | ✓ |

*(Catatan: Matriks lengkap untuk semua role Fase 2 akan ditambahkan saat pengembangan Fase 2 dimulai)*

## Scope Organisasi

Akses pengguna tidak hanya dibatasi oleh Role, tetapi juga oleh Scope (cakupan kewenangan) wilayah/organisasi.

Tingkatan Scope:
- **Kwarcab scope**: Mencakup seluruh data di wilayah Kabupaten (Indramayu).
- **Kwarran scope**: Terbatas pada data di tingkat Kecamatan tertentu.
- **Gudep scope**: Terbatas pada data pangkalan sekolah atau gugus depan tertentu.
- **Event scope**: Terbatas pada kepanitiaan sebuah kegiatan.
- **Content scope**: Terbatas pada konten artikel/berita yang dibuat sendiri.
- **Personal scope**: Terbatas pada data profil pengguna itu sendiri.

**Contoh Implementasi Scope:**
- **Staff Gudep SMKN 1 Cikedung**: Hanya memiliki izin membaca dan mengubah data anggotanya sendiri di Gudep SMKN 1 Cikedung. Tidak diperbolehkan mengakses atau melihat data Gudep SMKN 1 Indramayu.
- **Staff Kwarran**: Dapat melihat rekap dan data Gudep yang berada di dalam wilayah kecamatannya, namun tidak memiliki hak untuk mengubah konfigurasi data tingkat Kwarcab.
- **Staff Kwarcab**: Memiliki akses lintas wilayah (semua Kwarran dan Gudep) untuk keperluan monitoring dan manajemen. Semua aktivitas mengubah atau melihat data sensitif anggota oleh Staff Kwarcab akan dicatat dalam audit log.
