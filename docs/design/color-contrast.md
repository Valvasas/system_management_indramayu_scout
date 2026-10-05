# Tabel Rasio Kontras Warna

> Diukur ulang 5 Oktober 2026 terhadap `src/styles/tokens.css` (palet "Hutan & Lapangan").
> Ambang WCAG 2.2 AA: **4.5:1** teks normal, **3:1** teks besar (≥ 24px, atau ≥ 18.66px tebal) dan komponen/indikator non-teks.
> Cara mengukur ulang: rumus luminans relatif WCAG; skrip satu berkas cukup (lihat riwayat commit). Verifikasi otomatis di halaman nyata: `npm run a11y` (axe-core).

## Pasangan yang dipakai di produk

| Pasangan | Teks / depan | Latar | Rasio | Lolos |
|---|---|---|---|---|
| Teks utama | `text-primary` #262420 | Kanvas #FAF7F0 | 14.48:1 | AA |
| Teks utama | `text-primary` #262420 | Putih #FFFFFF | 15.49:1 | AA |
| Teks sekunder | `text-secondary` #55504A | Kanvas #FAF7F0 | 7.46:1 | AA |
| Teks sekunder | `text-secondary` #55504A | Langit ilustrasi #DCEBEF | 6.52:1 | AA |
| Teks redup | `text-muted` #6E675D | Putih #FFFFFF | 5.58:1 | AA |
| Teks redup | `text-muted` #6E675D | Kanvas #FAF7F0 | 5.22:1 | AA |
| Teks redup | `text-muted` #6E675D | surface-subtle #F2EEE4 | 4.82:1 | AA |
| Tautan / aksen | `accent-text` #184A32 | Kanvas #FAF7F0 | 9.51:1 | AA |
| Eyebrow hangat | `accent-warm` #A2441A | Putih #FFFFFF | 6.22:1 | AA |
| Eyebrow hangat | `accent-warm` #A2441A | Langit ilustrasi #DCEBEF | 5.08:1 | AA |
| Tombol utama | `putih` #FFFFFF | action-primary #1F5C3E | 7.90:1 | AA |
| Tombol utama (hover) | `putih` #FFFFFF | action-primary-hover #184A32 | 10.17:1 | AA |
| Tombol aksen (ember) | `putih` #FFFFFF | action-accent #A2441A | 6.22:1 | AA |
| Tombol sekunder | `action-secondary-text` #123927 | action-secondary #EDF5EF | 11.53:1 | AA |
| Tag kategori | `tag-text` #3F2D1C | tag-surface #F4EAD8 | 10.98:1 | AA |
| Teks di hutan gelap | `text-inverse` #FFFFFF | surface-forest #123927 | 12.80:1 | AA |
| Teks redup di hutan | `text-inverse-muted` #C9D6CD | surface-forest #123927 | 8.53:1 | AA |
| Teks redup di footer | `text-inverse-muted` #C9D6CD | surface-inverse #0E2A1E | 10.22:1 | AA |
| Status info | `status-info-text` #21536A | status-info-surface #E2EEF3 | 7.07:1 | AA |
| Status sukses | `status-success-text` #1D5B33 | status-success-surface #EFF7F1 | 7.41:1 | AA |
| Status peringatan | `status-warning-text` #7A4A0B | status-warning-surface #FEF8E7 | 7.04:1 | AA |
| Status bahaya | `status-danger-text` #85211A | status-danger-surface #FDF1EF | 8.52:1 | AA |
| Cincin fokus (non-teks, ≥3:1) | `focus-ring` #C2541B | Kanvas #FAF7F0 | 4.29:1 | AA |
| Cincin fokus di samping tombol hijau | `focus-ring` #C2541B | action-primary #1F5C3E | 1.72:1 | Tidak relevan* |

\* Cincin fokus digambar dengan `outline-offset: 2px`, jadi selalu dikelilingi latar halaman (kanvas, putih, meadow, atau langit: semuanya ≥ 3.9:1 terhadap ember), bukan menempel di tombol. Di dalam area gelap (`.on-inverse`: pita hutan, sidebar portal, footer) cincin otomatis berganti **putih** (≥ 12:1).

## Aturan pakai

- `text-muted` hanya untuk teks ≥ 12px dan bukan informasi tunggal (mis. metadata di samping judul).
- Di atas **ilustrasi**, teks hanya boleh berada di area langit (`--ill-sky`) atau di dalam pil/kartu putih padat. Jangan menaruh teks langsung di atas hutan/gunung.
- `.eyebrow` memakai ember (`accent-warm`) di latar terang dan otomatis `text-inverse-muted` di dalam `.on-inverse`. Ember di atas hutan gelap hanya ±2:1, jangan dipaksa.
- Tautan di dalam kalimat wajib bergaris bawah (kontras tautan vs teks sekitar < 3:1). Leaflet ditimpa di `globals.css`.

## Keputusan yang mengubah desain

| Masalah | Keputusan |
|---|---|
| Ember (#C2541B) untuk tombol hanya 4.59:1 dengan teks putih (batas) | Tombol aksen memakai ember-700 (#A2441A, 6.2:1); ember-600 hanya untuk cincin fokus |
| Label oranye di pita hutan ±2:1 (tertangkap saat review screenshot) | Aturan `.on-inverse .eyebrow` di `globals.css` |
| Tautan atribusi Leaflet tanpa garis bawah gagal `link-in-text-block` setelah palet hijau | `text-decoration: underline !important` |
