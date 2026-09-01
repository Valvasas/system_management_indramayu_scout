# Accessibility Checklist

Dokumen ini memuat daftar periksa untuk memastikan semua komponen aplikasi dapat diakses oleh semua kalangan (inklusif).

## Target: WCAG 2.2 Level AA

## Checklist Umum
- [ ] Teks normal minimum contrast 4.5:1.
- [ ] Teks besar minimum contrast 3:1.
- [ ] Komponen UI penting minimum contrast 3:1.
- [ ] Semua input memiliki label yang terhubung (menggunakan `for` atau `aria-labelledby`).
- [ ] Semua tombol icon-only memiliki accessible label (`aria-label` atau `.sr-only`).
- [ ] Semua fungsi inti dapat digunakan hanya dengan keyboard (tab, enter, space).
- [ ] Focus-visible harus terlihat dengan jelas (menggunakan ring/outline, bukan dihapus/`outline-none`).
- [ ] Status tidak dibedakan hanya berdasarkan warna (tambahkan ikon atau teks pendukung).
- [ ] Layout dapat direflow pada layar kecil (zoom 200% sampai 400% tanpa tumpang tindih berlebihan).
- [ ] Tidak ada keyboard trap (pengguna selalu bisa menekan `Tab` atau `Shift+Tab` keluar dari komponen manapun).

## Checklist per Komponen

### Header & Navigation
- [ ] Memiliki struktur `nav` yang jelas dengan `aria-label`.
- [ ] Navigasi utama dapat diakses berurutan via keyboard.
- [ ] Link yang menunjukkan halaman aktif menggunakan `aria-current="page"`.

### Hero & Typography
- [ ] Heading tidak di-skip tingkatannya (H1 -> H2 -> H3).
- [ ] Hanya ada satu H1 di setiap halaman.
- [ ] Teks yang berjalan/bergerak (jika ada) dapat dihentikan (pause).

### Button & Link
- [ ] Link yang membuka tab baru memiliki pemberitahuan (`aria-label` atau ikon visual yang jelas).
- [ ] Button `type="button"`, `type="submit"`, `type="reset"` dispesifikasikan dengan jelas.
- [ ] Hit area/target sentuh minimum 44x44px di mobile.

### Form Input
- [ ] Error message dideskripsikan dengan `aria-describedby` ke input yang bermasalah.
- [ ] Focus masuk ke input pertama yang mengalami error saat disubmit.
- [ ] Validasi form bersifat preventif, serta menyediakan instruksi perbaikan yang jelas.

### Card
- [ ] Jika card tersebut link secara keseluruhan, usahakan tidak ada nested link kompleks di dalamnya.
- [ ] `alt` attribute tidak mengulang teks yang sudah ada di sekitar card.

### Dialog / Modal
- [ ] Saat dialog terbuka, fokus keyboard berpindah otomatis ke dalam dialog.
- [ ] Terdapat mekanisme Focus Trap saat dialog terbuka.
- [ ] Bisa ditutup dengan tombol "Esc".
- [ ] Fokus kembali ke elemen pemicu saat dialog ditutup.

### Toast / Notifikasi
- [ ] Menggunakan `role="status"` atau `role="alert"` sesuai tingkat kritikalitasnya.
- [ ] Toast peringatan yang penting tidak hilang otomatis sebelum dibaca.

### Table
- [ ] Struktur tabel menggunakan `th` untuk header.
- [ ] `th` memiliki `scope="col"` atau `scope="row"`.

### Gallery & Map
- [ ] Gambar bermakna memiliki teks alternatif (`alt`) yang deskriptif.
- [ ] Gambar dekoratif memiliki `alt=""`.
- [ ] Peta/map interaktif memiliki alternatif berbasis teks jika menyimpan fungsi kritikal.

### Footer
- [ ] Landmark footer dengan elemen semantik `<footer>`.
- [ ] Kontras warna memadai pada secondary links.

## Checklist Responsive
Pastikan seluruh layout teruji di breakpoint berikut tanpa horizontal scroll yang tidak disengaja:
- [ ] 360px (mobile)
- [ ] 768px (tablet)
- [ ] 1024px (laptop)
- [ ] 1440px (desktop)

## Checklist Bahasa
- [ ] HTML root tag memiliki attribute `lang` sesuai bahasa yang aktif (contoh: `lang="id"`, `lang="en"`, atau `lang="su"`).
- [ ] Teks `alt` menggunakan bahasa yang sama dengan bahasa pengantar halaman.
- [ ] Heading hierarchy digunakan dengan benar (struktur dokumen berurutan).
- [ ] Menggunakan semantic HTML/landmark regions (`<header>`, `<main>`, `<nav>`, `<footer>`, `<aside>`, `<section>`).

## Tools yang Direkomendasikan
Gunakan perkakas berikut selama proses development:
- **axe-core / axe DevTools**: Audit elemen DOM.
- **Lighthouse accessibility audit**: Pemeriksaan rutin aksesibilitas.
- **WAVE (Web Accessibility Evaluation Tool)**: Visualisasi struktur heading dan kontras.
- **Keyboard testing manual**: Biasakan mengarungi web tanpa mouse.
