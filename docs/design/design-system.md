# Design System "Hutan & Lapangan"

> Berlaku sejak 5 Oktober 2026. Menggantikan palet "Scout Earth Tones".
> Sumber kebenaran: `src/styles/tokens.css` → `tailwind.config.ts` → komponen. Rasio kontras: `color-contrast.md`.

## 1. Karakter

Rumah digital organisasi kepramukaan: **resmi tetapi hangat, seperti papan informasi di bumi perkemahan.**
Kaya secara visual lewat ilustrasi lanskap dan kontur peta, tetapi tenang dalam tata letak: whitespace lega,
satu aksi utama per konteks, dan teks yang selalu mudah dibaca.

| Kami ingin terasa | Kami hindari |
|---|---|
| Hutan pagi, lapangan latihan, peta jalur, api unggun | Template SaaS, dasbor penuh angka dekoratif |
| Ilustrasi datar berlapis (bukan foto stok) | Gradien dekoratif, glassmorphism, efek neon |
| Judul serif yang hangat, teks isi yang jernih | Emoji sebagai ikon, warna literal di kode |
| Gerak halus yang menjelaskan (muncul, mengangkat) | Animasi yang mengganggu atau tidak bisa dimatikan |

## 2. Warna

| Primitive | Peran | Contoh pakai |
|---|---|---|
| **forest** (`#1F5C3E` …) | Warna merek & aksi utama | Tombol utama, tautan, sidebar portal, pita statistik |
| **moss** | Rumput & lumut | Ilustrasi lapangan |
| **bark** (`#6B4E31`) | Warisan cokelat Pramuka | Teks tag kategori |
| **sand** (`#FAF7F0` …) | Kanvas tenda | Latar halaman, pita galeri |
| **sky** | Langit pagi | Kepala halaman, status info |
| **ember** (`#A2441A`, `#C2541B`) | Api unggun — **hemat** | Eyebrow, tombol ajakan khusus, cincin fokus |
| **stone** | Netral hangat | Semua teks & garis |

Komponen hanya memakai token **semantic**: `surface-*` (canvas, base, subtle, meadow, sand, sky, forest, inverse, ember),
`text-*` (primary, secondary, muted, accent, warm, inverse…), `action-*`, `border-*`, `status-*`, `tag-*`.
Palet `ill-*` **khusus** untuk `fill`/`stroke` SVG ilustrasi. ESLint menolak warna literal Tailwind.

## 3. Tipografi

| Peran | Font | Kelas |
|---|---|---|
| Judul (h1–h3, angka besar) | **Fraunces** (serif bervariabel, sumbu SOFT 60) | `font-display` + `text-display-xl/lg/md` (fluid, `clamp`) |
| UI & teks isi | **Plus Jakarta Sans** (dirancang desainer Indonesia) | bawaan `font-sans` |
| Label kecil di atas judul | Jakarta, huruf kapital, tracking lebar | `.eyebrow` |

- Judul `font-semibold`, bukan `bold`: Fraunces tebal terasa berat di layar kecil.
- Teks isi artikel: 17px, `leading-[1.8]`, lebar ≤ 65 karakter (`max-w-prose`).
- `text-wrap: balance` untuk judul, `pretty` untuk paragraf pembuka.
- `cn()` sudah diajari ukuran `text-display-*`; jangan memakai `twMerge` mentah.

## 4. Bentuk, ruang, bayangan

- Radius: input `lg` (10px), kartu `xl`/`2xl` (16–24px), blok fitur & media `3xl` (32px), **tombol & chip `pill`**.
- Ritme section: `civic-section` (64→112px) untuk utama, `civic-section-sm` untuk pendukung. Pemisah antar-section =
  pergantian `surface` atau siluet lanskap (`TreeLine`, `Hills`), **bukan** garis border berulang.
- Bayangan hangat (`shadow-sm/md/lg`), dipakai untuk mengangkat, bukan menghias. Kartu interaktif memakai `.lift`.
- Target sentuh minimum 44px (`min-h-touch`) untuk semua kontrol.

## 5. Ilustrasi (`src/components/illustrations`)

| Komponen | Pakai untuk |
|---|---|
| `HeroLandscape` | Hero beranda: langit, pegunungan, hutan berlapis, lapangan, tenda, api unggun, bendera |
| `SceneStrip variant=forest/mountain/camp/meadow/lake/dusk` | Pita bawah `PageHero`, `PortalWelcome`, panel halaman masuk, ajakan bergabung |
| `TreeLine`, `Hills` | Tepi section (warna = `currentColor`; beri `text-surface-…` sama dengan latar berikutnya) |
| `GolonganArt id=…` | Kartu & halaman golongan |
| `EmptyCamp` | `EmptyState variant="scene"` |
| `CompassRose`, `PineMark` | Aksen kecil (404, wilayah, eyebrow) |
| `.topo` / `.topo-inverse` | Pola kontur topografi tipis di latar terang / gelap |

Aturan: semua ilustrasi `aria-hidden`, deterministik (generator ber-seed di `geometry.ts`), tanpa bitmap, tanpa
manusia/wajah (privasi anak). Teks tidak pernah diletakkan langsung di atas hutan/gunung, hanya di area langit
atau di dalam pil/kartu putih.

## 6. Gerak

- `Reveal`: muncul saat digulir. Konten **selalu terlihat tanpa JS**; elemen yang sudah di layar saat dimuat tidak disembunyikan.
- `animate-rise` untuk kepala halaman; `animate-sway/drift/flicker` untuk bendera, awan, api di ilustrasi.
- `prefers-reduced-motion: reduce` mematikan semuanya (`globals.css`).

## 7. Pola halaman

| Pola | Komponen |
|---|---|
| Kepala halaman dalam | `PageHero` (eyebrow, h1, deskripsi, breadcrumb, `scene`) |
| Section beranda | `Section` (`eyebrow`, `surface`, `topo`, `action`) |
| Kepala beranda portal | `PortalWelcome` |
| Daftar kosong | `EmptyState` (`scene` di publik, `icon` di panel portal) |
| Navigasi ponsel publik | Drawer layar penuh: pencarian, menu berikon per kelompok, ajakan |
| Navigasi ponsel portal | Bilah bawah (3 menu utama + Akun + Menu) dan *bottom sheet* |
| Pintasan tugas | Chip "Saya ingin…" di hero beranda |

## 8. Prinsip UX yang dipegang

1. **Tugas lebih dulu, struktur kemudian.** Pengunjung datang untuk mendaftarkan anak atau mengunduh formulir, bukan untuk memahami bagan organisasi.
2. **Tidak ada jalan buntu.** 404, hasil pencarian kosong, dan daftar kosong selalu memberi jalan lanjut.
3. **Jujur.** Data agregat dihitung dari DB; foto yang belum ada diberi keterangan, bukan kotak abu.
4. **Privasi anak adalah syarat.** Tanpa wajah di ilustrasi, peta publik tanpa alamat anggota, pembina tidak pernah tahu sandi anggota.
