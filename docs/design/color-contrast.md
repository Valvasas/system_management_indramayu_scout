# Tabel Rasio Kontras Warna

> Diukur 19 September 2026 terhadap `src/styles/tokens.css`.
> Ambang WCAG 2.2 AA: **4.5:1** teks normal, **3:1** teks besar (≥ 24px, atau ≥ 18.66px bold) dan komponen antarmuka.

## Pasangan yang dipakai di produk

| Foreground | Background | Rasio | Status |
|---|---|---|---|
| `text-primary` (neutral-900) | `surface-base` (putih) | 17.85:1 | AAA |
| `text-secondary` (neutral-600) | `surface-base` | 7.58:1 | AAA |
| `text-muted` (neutral-500) | `surface-base` | 4.76:1 | AA |
| `text-secondary` (neutral-600) | `surface-subtle` (neutral-50) | 7.24:1 | AAA |
| `text-muted` (neutral-500) | `surface-subtle` | 4.55:1 | AA (batas bawah) |
| `accent-text` (green-800) | `surface-base` | 7.13:1 | AAA |
| `text-on-brand` (putih) | `action-primary` (green-700) | 5.02:1 | AA |
| `text-on-brand` (putih) | `action-primary-hover` (green-800) | 7.13:1 | AAA |
| `text-on-brand` (putih) | `action-danger` (red-700) | 6.47:1 | AAA |
| `action-secondary-text` (green-800) | `action-secondary` (green-50) | 6.81:1 | AAA |
| `status-info-text` | `status-info-surface` | 8.01:1 | AAA |
| `status-success-text` | `status-success-surface` | 6.81:1 | AAA |
| `status-warning-text` | `status-warning-surface` | 6.84:1 | AAA |
| `status-danger-text` | `status-danger-surface` | 7.60:1 | AAA |
| `status-neutral-text` | `status-neutral-surface` | 9.45:1 | AAA |
| `focus-ring` (green-800) | `surface-base` | 7.13:1 | AAA |
| Tautan footer (neutral-300) | `surface-inverse` (neutral-900) | 12.02:1 | AAA |
| Teks footer (putih) | `surface-inverse` | 17.85:1 | AAA |

## Keputusan yang mengubah desain

1. **Aksi utama memakai green-700, bukan green-600.**
   Putih di atas `green-600` (#16A34A) hanya **3.30:1** — gagal AA untuk teks normal.
   Seluruh tombol primer, chip filter aktif, dan cincin fokus karena itu memakai
   `green-700` (5.02:1) dengan hover `green-800` (7.13:1).

2. **neutral-400 tidak pernah menjadi token teks.**
   #94A3B8 di atas putih hanya **2.85:1**. Teks paling redup di situs adalah
   `text-muted` = neutral-500 (4.76:1) dan hanya dipakai untuk metadata ≥ 12px.

3. **Badge status memakai trio surface/text/border, bukan warna solid.**
   Putih di atas `blue-500` hanya 3.68:1. Semua badge kini memakai latar tint
   + teks gelap sehingga rasio terendahnya 6.81:1. Warna juga tidak pernah
   menjadi satu-satunya pembeda: setiap badge membawa ikon + teks (WCAG 1.4.1).

4. **Kontrol Leaflet ditimpa.**
   Tautan atribusi bawaan Leaflet (#0078A8 di atas #DDD) hanya 3.64:1 dan
   tombol zoom-nya 30×30px. Keduanya ditimpa di `globals.css` agar memakai
   token dan target 44px.

## Cara memverifikasi ulang

Rasio dihitung dengan rumus relative luminance WCAG. Pemeriksaan otomatis
terhadap halaman yang sudah dirender dilakukan dengan menelusuri setiap simpul
teks, mengambil `color` komputasi dan latar efektif pertama yang opak, lalu
membandingkannya dengan ambang sesuai ukuran & tebal font. Saat pemeriksaan
terakhir dijalankan terhadap seluruh 15 rute pada lebar 390px: **nol pelanggaran**.
