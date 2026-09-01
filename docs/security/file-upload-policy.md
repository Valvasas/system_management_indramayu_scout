# Kebijakan Upload File

Dokumen ini menjelaskan pembatasan, proses validasi, dan penanganan file yang diunggah oleh pengguna ke sistem Rumah Pramuka Indramayu untuk menjamin keamanan dari serangan siber dan menghemat kapasitas storage.

## Pembatasan File

### 1. File Dokumen
- **Format yang Diizinkan**: PDF, DOCX, XLSX
- **Ukuran Maksimum**: 10 MB per file
- **Penggunaan Umum**: Dokumen SK, surat tugas, laporan, panduan kegiatan.

### 2. File Gambar
- **Format yang Diizinkan**: JPG, PNG, WebP
- **Ukuran Maksimum**: 5 MB per file
- **Penggunaan Umum**: Galeri kegiatan, foto profil, banner berita.

## Aturan Keamanan Upload File

Setiap file yang diproses oleh sistem wajib melewati rantai verifikasi keamanan berikut:

1. **Validasi MIME Type & Ekstensi**:
   - Pengecekan tidak boleh hanya bergantung pada input klien. Validasi MIME type sejati dan ekstensi **wajib** dilakukan di sisi server.
   
2. **Rename File**:
   - Nama file bawaan pengguna berisiko mengandung karakter berbahaya. Semua nama file yang diunggah wajib diubah (di-rename) oleh sistem menggunakan standar **UUID** (misal: `123e4567-e89b-12d3-a456-426614174000.webp`).

3. **Separasi Storage**:
   - File harus disimpan berdasarkan tingkat eksposurnya. Simpan file yang ditujukan untuk publik (contoh: banner berita) di direktori/bucket publik.
   - Simpan file yang bersifat privat (contoh: dokumen SK rahasia, scan identitas) di bucket tertutup yang terpisah dari akses langsung.

4. **Akses File Privat**:
   - File berstatus privat hanya dapat diakses melalui penerapan **Signed URL** dengan waktu kedaluwarsa singkat (misal: berlaku selama 15 menit).

5. **Penelusuran (Traceability)**:
   - Database wajib mencatat siapa pemilik/pengunggah file (`uploaded_by_user_id`).
   - Sistem wajib mencatat konteks penggunaan file tersebut (apakah dilampirkan pada berita, acara, atau profil).

6. **Pencegahan Ekskusi & Injeksi**:
   - Blokir keras (hard block) seluruh file *executable* (.exe, .sh, .bat, .php, dll).
   - Sistem harus melakukan **sanitasi terhadap file SVG** untuk mencegah serangan XSS, atau jika hal tersebut dinilai rumit, secara mutlak **jangan izinkan** unggahan format SVG dari sisi pengguna.

7. **Perlindungan Privasi**:
   - Khusus untuk unggahan foto publik, sistem harus memproses file gambar dan menghapus **EXIF Data** (seperti koordinat GPS/lokasi) demi menjaga privasi dan keamanan pengguna.

8. **Pemindaian Lanjutan**:
   - Jika infrastruktur organisasi mendukung atau memiliki kapabilitas tambahan, integrasikan file upload dengan layanan **Scan Malware / Anti-virus** sesaat setelah file masuk ke storage sementara (tmp).
