# Strategi Testing Rumah Pramuka Indramayu

Dokumen ini mendefinisikan strategi pengujian untuk portal digital Kwartir Cabang Gerakan Pramuka Indramayu, untuk memastikan kualitas produk, keamanan data, dan aksesibilitas sesuai dengan standar proyek.

## Jenis Testing

| Jenis | Tool | Contoh |
|---|---|---|
| Unit test | Vitest | Permission helper, validasi KTA, status anggota |
| Integration test | Vitest + Testing Library | Staff Gudep hanya melihat anggota Gudep sendiri |
| Component test | React Testing Library | Render komponen, interaksi, state |
| End-to-end test | Playwright | Login → cari anggota → ubah data → audit log muncul |
| Accessibility test | axe-core + manual | Keyboard, focus, label input, contrast |
| Responsive test | Playwright + manual | 360px, 768px, 1024px, 1440px |
| Visual regression | Playwright screenshot | Button, form, dialog, halaman berita, galeri |
| Security test | Manual + automated | Akses URL langsung tanpa permission |
| Performance test | Lighthouse + manual | Upload, import Excel, filter anggota, peta |
| Backup restore test | Manual | Restore database dan file |

## Skenario Keamanan Wajib

Setiap skenario keamanan berikut wajib terpenuhi dan diuji secara berkala:

1. **Akses data lintas Gudep**
   - Staff Gudep A mencoba membuka data Gudep B dari URL langsung
   - → Sistem HARUS menolak
   - → Data TIDAK boleh dikirim ke browser
   - → Percobaan dapat dicatat

2. **Export tanpa permission**
   - User mencoba export seluruh data anggota tanpa permission
   - → Sistem HARUS menolak
   - → Export tidak dibuat
   - → Aktivitas dicatat

3. **Perubahan data anggota**
   - User mengubah data anggota
   - → Sistem menyimpan perubahan
   - → Sistem menyimpan siapa yang mengubah
   - → Sistem menyimpan waktu perubahan
   - → Sistem menyimpan data lama dan baru bila field sensitif

## Skenario E2E Fase 1

Fokus awal fase 1 adalah pada website publik. Berikut skenario end-to-end wajib:

1. Navigasi beranda → semua section muncul
2. Klik berita → halaman detail muncul
3. Klik agenda → halaman detail muncul
4. Buka galeri → album tampil, foto tampil
5. Ganti bahasa → konten berubah sesuai bahasa
6. Navigasi mobile → hamburger menu bekerja
7. Keyboard navigation → semua link terjangkau
8. PWA install prompt → manifest valid

## Responsive Breakpoints

Sistem menggunakan breakpoint berikut untuk pengujian antarmuka:

| Breakpoint | Viewport | Target Device |
|---|---|---|
| Mobile | 360px | Smartphone |
| Tablet | 768px | Tablet |
| Laptop | 1024px | Laptop |
| Desktop | 1440px | Desktop |

## Struktur File Test

```
src/
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── components/
│   └── ui/
│       └── Button.test.tsx
```

## Perintah Test

Berikut adalah daftar perintah yang digunakan untuk menjalankan test:

```bash
pnpm test          # unit + integration
pnpm test:watch    # watch mode
pnpm test:e2e      # Playwright E2E
pnpm test:coverage # coverage report
```

## Coverage Target

- **Unit:** >= 80%
- **Integration:** fokus pada permission dan data access
- **E2E:** semua happy path halaman publik
