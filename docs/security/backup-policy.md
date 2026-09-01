# Kebijakan Backup (Backup Policy)

Dokumen ini menjelaskan strategi, prosedur, dan aturan main pencadangan data (backup) untuk sistem Rumah Pramuka Indramayu guna mencegah kehilangan data.

## Backup Otomatis

Sistem mengandalkan infrastruktur berbasis cloud/Docker yang dilengkapi dengan fitur automated backup:
- **Frekuensi**: Dilakukan secara harian (Daily).
- **Retensi**: Setiap file backup otomatis disimpan dengan periode minimum 30 hari sebelum dirotasi atau ditimpa.
- **Storage**: Disimpan pada lokasi penyimpanan yang terpisah (off-site storage) dari lingkungan server produksi.

## Backup Manual oleh Super Admin

Selain backup otomatis, sistem memfasilitasi pembuatan backup secara mandiri:
- Super Admin memiliki kewenangan untuk membuat export backup data terstruktur melalui antarmuka sistem.
- File hasil export ini wajib disimpan dengan aman di perangkat lokal atau hard drive fisik milik institusi/organisasi (Kwarcab).
- **Catatan Penting**: Backup manual ini **BUKAN** satu-satunya lapisan backup, melainkan lapisan cadangan darurat (air-gapped backup) sebagai best practice keamanan.

## Peringatan Kewajiban Backup (Backup Nagging)

Untuk menjamin ketersediaan data secara lokal oleh organisasi:
- Sistem akan senantiasa mencatat timestamp (waktu) kapan backup manual terakhir kali diunduh/dijadikan arsip.
- Jika backup manual belum dilakukan dalam periode waktu tertentu (misalnya, lebih dari 30 hari), Super Admin akan melihat pesan peringatan persisten pada dasbor.
- **Contoh Pesan Notifikasi**: *"Peringatan Keamanan: Backup manual terakhir dilakukan 35 hari lalu. Harap segera lakukan export data untuk arsip organisasi."*
- Peringatan ini dapat ditunda (snooze) dengan memberikan alasan tertulis yang valid (dicatat di sistem), namun peringatan tersebut tidak dapat dihilangkan secara permanen tanpa melakukan eksekusi backup manual.

## Uji Coba Pemulihan (Restore Test)

Memiliki backup saja tidak cukup tanpa jaminan file tersebut bisa digunakan:
- Administator wajib melakukan **Uji Restore** secara berkala di environment staging.
- Uji restore ini dilakukan dengan frekuensi **minimum setiap 3 bulan**.
- Semua hasil uji coba (sukses/gagal, metrik waktu) wajib dilaporkan dan dicatat dalam dokumentasi log audit/maintenance.

## Keamanan File Backup

Semua arsip file backup, baik yang otomatis maupun manual, harus memenuhi standar pengamanan berikut:
- **Versioning**: Dikelola menggunakan mekanisme object storage versioning atau sistem replikasi lintas region (jika menggunakan cloud storage).
- **Encryption at rest**: File backup tidak boleh disimpan dalam format plain text (harus dienkripsi secara default oleh sistem storage target).
