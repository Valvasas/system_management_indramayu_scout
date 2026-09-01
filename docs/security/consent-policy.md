# Kebijakan Persetujuan (Consent Policy)

Dokumen ini mengatur kebijakan persetujuan penggunaan data pada sistem Rumah Pramuka Indramayu, yang didesain untuk melindungi privasi anggota, khususnya anggota di bawah umur.

## Dasar Hukum

Seluruh kebijakan mengacu pada **Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi**.

## Prinsip Persetujuan

Sistem mengadopsi prinsip pengelolaan persetujuan sebagai berikut:
1. **Terbatas dan spesifik**: Persetujuan hanya mencakup apa yang dijelaskan dengan gamblang, tidak bersifat pukul rata.
2. **Sesuai tujuan**: Pemrosesan data yang dilakukan harus relevan dengan tujuan pengelolaan organisasi kepramukaan.
3. **Akurat dan mutakhir**: Status persetujuan dapat diperbarui sewaktu-waktu oleh pemilik data.
4. **Aman**: Catatan persetujuan disimpan dengan aman dan menjadi syarat logis sebelum data ditampilkan.
5. **Dihapus setelah masa retensi**: Data terkait akan dihapus bila persetujuan dicabut atau melewati batas waktu retensi yang telah ditetapkan.

## Persetujuan Wali untuk Data Anak

Anggota Pramuka yang masih di bawah umur secara hukum diwajibkan menyertakan persetujuan wali:
- **WAJIB** untuk semua pendaftaran anggota di bawah umur (contoh: Penggalang).
- Catatan persetujuan (digital consent) harus terekam secara sistematis di dalam database.
- Persetujuan yang diberikan harus secara eksplisit mencakup izin pengelolaan:
  - Data identitas (nama, TTL)
  - Penggunaan foto untuk kebutuhan internal
  - Data kontak dan riwayat medis
  - Partisipasi dalam kegiatan lapangan
- Orang tua/wali memiliki hak penuh untuk **menarik persetujuan** (revoke consent) kapan saja melalui portal wali.
- Tindakan penarikan persetujuan ini dijamin terhubung dengan sistem **audit log** secara otomatis.

## Kategori Persetujuan

| Kategori | Deskripsi Persetujuan | Sifat |
|---|---|---|
| Pemrosesan Data Dasar | Izin untuk menyimpan data pokok pendaftaran anggota | Wajib |
| Partisipasi Kegiatan | Izin bagi anak di bawah umur untuk didaftarkan ke event | Wajib per kegiatan |
| Penggunaan Foto Internal | Izin menampilkan foto anak di lingkup login terbatas | Opsional/Wajib (tergantung Gudep) |
| Publikasi Media Umum | Izin mempublikasikan nama/prestasi di berita publik | Opsional |
| Kontak Medis | Izin menyimpan dan mengakses data medis/alergi anak | Wajib |

## Alur Persetujuan (Fase 2)

Proses manajemen persetujuan mengikuti alur standar:
1. **Pendaftaran**: Akun anggota anak didaftarkan ke dalam sistem.
2. **Permintaan Consent**: Sistem secara otomatis mengirimkan notifikasi permintaan persetujuan kepada akun Orang Tua/Wali.
3. **Pemberian Persetujuan**: Wali login dan menyetujui secara digital (digital signature / checkbox tervalidasi).
4. **Pencatatan**: Database mencatat timestamp, IP, dan user ID wali yang memberikan consent.
5. **Pemrosesan Terbuka**: Setelah status consent terpenuhi, data anggota anak tersebut baru dapat diproses (didaftarkan kegiatan, dilihat detailnya) sesuai dengan lingkup yang disetujui.
