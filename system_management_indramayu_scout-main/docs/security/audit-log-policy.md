# Kebijakan Audit Log

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
