---
name: frontend-craft
description: Menjaga kualitas UI Rumah Pramuka Indramayu agar konsisten dengan design system, prinsip visual, dan standar aksesibilitas produk.
---

# Frontend Craft Rules

## Sebelum mengubah UI

1. Baca docs/product/product-vision.md.
2. Baca docs/design/design-brief.md.
3. Baca docs/design/visual-principles.md.
4. Baca docs/design/motion-guidelines.md.
5. Baca docs/security/data-classification.md.
6. Baca docs/security/authorization-model.md.
7. Baca src/styles/tokens.css.
8. Periksa komponen yang sudah tersedia sebelum membuat yang baru.

## Larangan

- Tidak ada gradient dekoratif tanpa fungsi.
- Tidak ada emoji sebagai dekorasi.
- Tidak ada glassmorphism berlebihan.
- Tidak ada card untuk semua blok.
- Tidak ada hardcoded warna.
- Tidak ada hardcoded spacing.
- Tidak ada hardcoded radius.
- Tidak ada hardcoded shadow.
- Tidak ada hardcoded duration.
- Tidak ada lebih dari satu CTA primary dalam satu konteks.
- Tidak ada icon-only button tanpa accessible label.
- Tidak ada status yang dibedakan hanya dengan warna.
- Tidak ada data anggota anak pada halaman publik.
- Tidak ada permission yang hanya diperiksa di frontend.

## Verifikasi sebelum selesai

- Cek loading state.
- Cek empty state.
- Cek error state.
- Cek success state.
- Cek focus state.
- Cek keyboard navigation.
- Cek mobile pada 360px.
- Cek tablet pada 768px.
- Cek desktop pada 1440px.
- Cek prefers-reduced-motion.
- Cek contrast WCAG AA.
- Cek apakah token baru benar-benar diperlukan.
- Laporkan perubahan yang menyentuh data sensitif.
