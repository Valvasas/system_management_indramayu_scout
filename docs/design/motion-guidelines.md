# Motion Guidelines

Panduan ini mengatur penggunaan animasi dan transisi di dalam aplikasi untuk menjaga profesionalitas dan aksesibilitas.

## Prinsip Motion
Animasi digunakan **HANYA** untuk 4 fungsi berikut:
1. **Orientation**: Membantu pengguna memahami struktur spasial dan navigasi.
2. **Feedback**: Memberikan konfirmasi bahwa sebuah aksi telah diterima.
3. **Causality**: Menunjukkan hubungan sebab-akibat (contoh: klik tombol memicu perubahan status).
4. **Focus**: Mengarahkan perhatian pengguna ke elemen kritis.

## Motion Patterns

| Komponen | Pattern | Durasi | Fungsi |
|---|---|---|---|
| Tombol | Background/border berubah, press kecil | 120ms | Feedback |
| Navigasi | Underline atau surface subtle | 120-160ms | Orientasi |
| Dropdown | Fade + translate 4-8px | 160-200ms | Menjelaskan kemunculan |
| Dialog | Fade backdrop + scale kecil | 220-280ms | Fokus |
| Toast | Slide pendek + fade | 180-240ms | Feedback |
| Accordion | Height transition sederhana | 180-240ms | Menjelaskan relasi |
| Galeri | Crossfade ringan | 180-240ms | Transisi konten |
| Skeleton loading| Static atau shimmer lembut | Tidak dominan | Indikasi proses |
| Status berubah | Highlight sementara | 180-240ms | Kausalitas |

## Aturan Motion (DILARANG)
Demi menjaga estetika _calm and reliable_, berikut adalah implementasi yang harus dihindari:
- Tidak ada parallax besar saat melakukan scrolling.
- Tidak ada animasi angka berputar (number counter) tanpa alasan yang sangat kuat.
- Tidak ada card yang masuk (staggered animation) satu per satu secara berlebihan saat scrolling.
- Tidak ada hover effect yang menggeser (layout shift) elemen di sekitarnya.
- Tidak ada animate-on-scroll yang berlebihan pada teks paragraf biasa.
- Tidak ada carousel otomatis untuk informasi penting (slider harus diatur secara manual oleh pengguna).
- Tidak ada video autoplay dengan audio yang menyala.
- Tidak ada animasi yang memakan waktu lebih dari 500ms untuk interaksi biasa.

## Reduced Motion
Desain wajib mendukung preferensi sistem `prefers-reduced-motion` untuk aksesibilitas. Sertakan snippet CSS berikut secara global:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 1ms !important;
  }
}
```

## Implementasi
- Selalu gunakan native **CSS transitions/animations**, hindari penggunaan library JavaScript animation yang berat jika memungkinkan.
- Gunakan variabel design tokens untuk nilai durasi transisi (`var(--motion-duration-fast)`, dll).
- Gunakan easing functions yang telah didefinisikan: `ease-standard` dan `ease-emphasized`.
