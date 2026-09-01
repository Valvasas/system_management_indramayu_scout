# Klasifikasi Data Sistem

Dokumen ini mendefinisikan tingkat klasifikasi data pada sistem Rumah Pramuka Indramayu, mengatur cara data diakses, disimpan, ditransmisikan, dan dihapus sesuai dengan tingkat sensitivitasnya.

## Tingkat Klasifikasi Data

Sistem membagi data ke dalam empat tingkat klasifikasi utama:

| Tingkat | Deskripsi | Contoh | Akses |
|---|---|---|---|
| Publik | Data yang boleh ditampilkan ke masyarakat luas tanpa batasan | Berita, agenda, galeri publik, profil Kwarcab, statistik agregat (jumlah anggota, dll) | Semua orang (termasuk tanpa login) |
| Internal | Data operasional organisasi yang tidak dipublikasikan | Daftar Gugus Depan (Gudep), data pembina, struktur organisasi detail | Staff berwenang (login required) |
| Sensitif | Data pribadi yang dilindungi dan bersifat rahasia | Nama lengkap anggota, tanggal lahir, kontak pribadi, foto wajah | Role spesifik dengan otorisasi |
| Sangat Sensitif | Data yang memerlukan perlindungan hukum dan keamanan khusus | Data anak di bawah umur, kontak orang tua/wali, alamat rumah lengkap, KTA | Role tertinggi + tercatat di audit log |

## Aturan per Kategori

Berikut adalah aturan pengelolaan data untuk masing-masing tingkat klasifikasi:

### 1. Data Publik
- **Akses**: Terbuka untuk umum.
- **Penyimpanan**: Disimpan di database utama atau CDN.
- **Transmisi**: Dikirim menggunakan enkripsi standar (HTTPS).
- **Retensi**: Disimpan selama relevan dengan kebutuhan publikasi.
- **Penghapusan**: Dapat dihapus oleh Admin Website.

### 2. Data Internal
- **Akses**: Terbatas pada akun yang memiliki hak akses internal (Staff Gudep, Kwarran, Kwarcab).
- **Penyimpanan**: Disimpan di database utama dengan kontrol akses (RBAC).
- **Transmisi**: Enkripsi end-to-end (HTTPS) wajib digunakan.
- **Retensi**: Mengikuti kebijakan retensi operasional organisasi (default 5 tahun).
- **Penghapusan**: Dihapus atau diarsipkan setelah masa aktif selesai, memerlukan persetujuan dari level manajemen terkait.

### 3. Data Sensitif
- **Akses**: Terbatas hanya pada pihak yang membutuhkan akses untuk operasional spesifik (pembina langsung, staff administrasi terkait).
- **Penyimpanan**: Disimpan secara aman di database dengan perlindungan lapis ganda. Password dan token selalu di-hash.
- **Transmisi**: HTTPS wajib, tidak boleh diekspos melalui API publik.
- **Retensi**: Disimpan sesuai dengan status keanggotaan aktif.
- **Penghapusan**: Dapat diajukan oleh pengguna terkait atau dihapus setelah masa retensi habis dengan otorisasi Super Admin. Penghapusan akan memicu entri di audit log.

### 4. Data Sangat Sensitif
- **Akses**: Hanya dapat diakses oleh role administratif dengan level tertinggi atau wali hukum (orang tua). Akses oleh admin akan selalu dicatat.
- **Penyimpanan**: Bidang data tertentu harus dienkripsi (encryption-at-rest).
- **Transmisi**: Wajib HTTPS dan melalui jalur API internal yang ketat.
- **Retensi**: Data segera dianomisasi atau dihapus jika persetujuan (consent) dicabut atau masa keanggotaan berakhir (dengan periode grace tertentu).
- **Penghapusan**: Memerlukan hak khusus (Super Admin), konfirmasi berlapis, dan setiap aksi penghapusan dijamin tercatat permanen dalam audit log.

## Aturan Publikasi Foto

Keamanan identitas visual sangat penting, khususnya bagi anggota usia muda:
- Foto anggota yang berstatus di bawah umur (contoh: usia Penggalang) **TIDAK** diperbolehkan ditampilkan secara eksplisit di website publik.
- Website publik hanya diizinkan untuk menampilkan:
  - Foto suasana kegiatan (landscape/wide shot) di mana identitas individu tidak terlihat jelas.
  - Foto pembina, staff, atau tokoh dewasa yang telah memberikan izin rilis publik.
- Data publik yang menyangkut anggota hanya disajikan secara agregat (misalnya: jumlah anggota aktif, statistik Gudep, dsb).

## Aturan Pengelolaan Data Anak

Pengelolaan data anak merujuk pada ketentuan yang ditetapkan dalam **Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi**:
- Data anak dikategorikan sebagai **data pribadi spesifik**.
- Sistem **wajib** memperoleh persetujuan eksplisit (consent) dari orang tua atau wali yang sah sebelum mengumpulkan atau memproses data.
- Pemrosesan data harus diselenggarakan secara khusus, terbatas pada keperluan pembinaan kepramukaan, dan tidak disalahgunakan untuk tujuan komersial atau pihak ketiga tanpa izin.

## Kebijakan Retensi Data

Sistem menerapkan kebijakan retensi untuk memastikan data tidak disimpan lebih lama dari yang diperlukan:
- **Retensi Data Default**: 5 tahun untuk data operasional aktif.
- **Pengaturan Retensi**: Parameter retensi dapat disesuaikan (dikelola) oleh Super Admin berdasarkan regulasi terbaru.
- **Data Historis**: Setelah masa retensi aktif habis, data dipindahkan ke status arsip historis yang tersedia secara terbatas dan tidak bisa diakses secara umum.
- **Penghapusan Data**: Tindakan penghapusan permanen (hard delete) memerlukan hak akses khusus, konfirmasi ganda (konfirmasi manual), dan pengawasan ketat.
- **Audit Penghapusan**: Setiap tindakan penghapusan data, terutama data sensitif, akan dicatat secara mendetail di dalam audit log sistem.
