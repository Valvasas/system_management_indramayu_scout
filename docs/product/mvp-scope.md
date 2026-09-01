# Scope MVP: Fase 1 (Website Publik)

## Scope Fase 1
Fokus utama pada Fase 1 adalah membangun website publik yang matang dan representatif, bukan dashboard keanggotaan penuh.

## Fitur Fase 1
- Landing page / Beranda
- Profil Kwarcab
- Visi, misi, dan sejarah
- Struktur organisasi
- Berita dan pengumuman
- Agenda kegiatan
- Galeri dan album kegiatan
- Prestasi
- Dokumentasi / publikasi
- Kontak dan lokasi kantor
- Halaman kebijakan privasi
- Halaman aksesibilitas
- Halaman login (UI saja)
- PWA dasar
- Multibahasa: Indonesia (utama), Inggris, Basa Sunda
- SEO dan metadata
- Sitemap
- Favicon dan web manifest
- Panel admin konten terbatas
- Workflow draft → review → publish

## Sitemap Fase 1
```text
/
├── / (Beranda)
├── /tentang
│   ├── /tentang/profil
│   ├── /tentang/visi-misi
│   └── /tentang/sejarah
├── /struktur-organisasi
├── /berita
│   └── /berita/[slug]
├── /agenda
│   └── /agenda/[slug]
├── /galeri
│   └── /galeri/[album-slug]
├── /prestasi
├── /dokumen
├── /kontak
├── /kebijakan-privasi
├── /aksesibilitas
└── /masuk
```

*Catatan: Tersedia juga versi URL untuk masing-masing bahasa, contoh: `/id/...`, `/en/...`, `/su/...`*

## Yang TIDAK Termasuk di Fase 1
- Dashboard keanggotaan
- Data anggota internal
- Chat
- Peta internal
- Sistem verifikasi data
- Import/export data
- Notifikasi push
- Multi-factor authentication
- Offline mode lengkap

## Tujuan Fase 1
Membangun wajah resmi Kwarcab yang profesional, mudah digunakan, cepat diakses, dan siap berkembang untuk fase-fase berikutnya.

## Struktur Beranda
1. Header
2. Hero
3. Tentang singkat
4. Agenda terdekat
5. Berita terbaru
6. Galeri pilihan
7. Prestasi
8. Statistik agregat
9. Peta lokasi
10. Footer

## Workflow Konten
Alur pembuatan dan publikasi konten:
`DRAFT` → `SUBMITTED_FOR_REVIEW` → `IN_REVIEW` → `REVISION_REQUIRED` → `APPROVED` → `SCHEDULED` → `PUBLISHED` → `ARCHIVED`
