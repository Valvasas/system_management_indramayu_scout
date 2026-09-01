# Visual Principles

Dokumen ini memuat detail referensi token desain, aturan penggunaan komponen UI, serta pedoman implementasi visual.

## Design Tokens Reference
Seluruh desain wajib menggunakan variabel token dari `tokens.css`.

### Primitive Palette:
- `green-50` hingga `green-700` (5 warna)
- `neutral-50` hingga `neutral-900` (5 warna)
- `amber-100`, `amber-700`
- `red-100`, `red-700`
- `blue-100`, `blue-700`

### Semantic Colors:
- **Surface**: `base`, `raised`, `subtle`
- **Text**: `primary`, `secondary`, `muted`, `on-action`
- **Action**: `primary`, `primary-hover`, `secondary`
- **Border**: `subtle`, `strong`
- **Focus**: `ring`
- **Status**: `success`, `warning`, `danger`, `info`

### Typography:
- `font-sans`: Inter, Noto Sans, system-ui
- `font-display`: DM Sans, Inter, system-ui
- **Sizes**: `xs` (0.75rem), `sm` (0.875rem), `base` (1rem), `lg` (1.125rem), `xl` (1.25rem), `2xl` (1.5rem), `3xl` (2rem), `4xl` (2.5rem)
- **Weights**: `regular` (400), `medium` (500), `semibold` (600), `bold` (700)
- **Leading**: `tight` (1.2), `normal` (1.5), `relaxed` (1.7)

### Spacing:
- `space-1` (0.25rem) hingga `space-20` (5rem)

### Shape:
- `radius-sm` (0.375rem), `radius-md` (0.625rem), `radius-lg` (0.875rem), `radius-xl` (1.25rem), `radius-pill` (999px)
- **Semantic**: `control` (md), `card` (lg), `dialog` (xl)

### Shadow:
- `sm`, `md`, `dialog`

### Motion:
- **duration**: `fast` (120ms), `normal` (200ms), `slow` (320ms)
- **ease**: `standard`, `emphasized`

## Skala Typography

| Peran | Ukuran | Weight | Penggunaan |
|---|---|---|---|
| Display | 40-48px | 600-700 | Hero atau pesan utama |
| H1 | 30-36px | 600-700 | Judul halaman |
| H2 | 24-28px | 600 | Judul section |
| H3 | 18-20px | 600 | Judul card atau kelompok |
| Body | 16px | 400 | Isi utama |
| Small body | 14px | 400 | Metadata, deskripsi singkat |
| Label | 12-14px | 500-600 | Form, status, tag |

## Aturan Penggunaan Token
- TIDAK ada hardcoded hex pada komponen.
- TIDAK ada hardcoded spacing pada komponen.
- TIDAK ada hardcoded radius pada komponen.
- TIDAK ada hardcoded shadow pada komponen.
- TIDAK ada hardcoded motion duration pada komponen.
- Nama token harus menjelaskan FUNGSI (semantic), bukan nama warna literal.
- Token baru WAJIB memiliki alasan yang kuat dan didokumentasikan.

## Panduan shadcn/ui & Radix UI
Ekosistem UI dibangun menggunakan stack modern dengan prinsip kepemilikan komponen secara penuh (own your components).
- **Radix UI**: Digunakan untuk behavior dan accessibility primitive.
- **shadcn/ui**: Bertindak sebagai source code komponen awal yang di-copy ke dalam project untuk dimodifikasi secara spesifik, BUKAN sebagai dependency node_modules.
- **Tailwind CSS**: Implementasi layout dan styling.
- **CSS variables/tokens**: Sumber kebenaran (source of truth) semua keputusan desain.

### Aturan Ekosistem UI:
- Tidak menginstal semua komponen shadcn/ui sekaligus (hanya yang diperlukan).
- Tidak memakai theme default mentah dari shadcn/ui; sesuaikan dengan tokens.css.
- Tidak memakai warna default; gunakan warna semantic yang sudah didefinisikan.
- Tidak memakai dashboard template yang sudah jadi.
- Tidak membuat card di setiap section tanpa alasan yang kuat.
- Tidak menambah komponen tanpa kebutuhan produk nyata.
