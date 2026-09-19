import type { Metadata } from 'next';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/Section';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Pernyataan Aksesibilitas',
  description:
    'Status aksesibilitas situs Kwartir Cabang Gerakan Pramuka Indramayu terhadap WCAG 2.2 Level AA, termasuk keterbatasan yang masih ada.',
  alternates: { canonical: '/aksesibilitas' },
};

/** Hanya klaim yang benar-benar terpasang di kode. */
const implemented = [
  {
    title: 'Navigasi keyboard penuh',
    detail:
      'Seluruh tautan, tombol, chip filter, dan formulir dapat dijangkau dengan Tab. Menu ponsel dan lightbox galeri memerangkap fokus selagi terbuka, ditutup dengan Escape, lalu mengembalikan fokus ke tombol pemicunya.',
  },
  {
    title: 'Indikator fokus terlihat',
    detail:
      'Setiap elemen interaktif menampilkan garis fokus hijau tua dua piksel dengan jarak dua piksel dari elemennya (kontras 7,1:1 terhadap latar putih).',
  },
  {
    title: 'Tautan lompat ke konten',
    detail:
      'Menekan Tab di awal halaman memunculkan tautan "Lanjut ke konten utama" yang mengarah ke landmark <main>.',
  },
  {
    title: 'Target sentuh minimal 44 piksel',
    detail:
      'Tombol, tautan navigasi, chip filter, dan kontrol formulir memakai tinggi minimum 44 piksel.',
  },
  {
    title: 'Status tidak hanya dibedakan warna',
    detail:
      'Label status agenda, kategori berita, dan jenis berkas selalu memuat ikon dan teks, bukan sekadar warna.',
  },
  {
    title: 'Gerak berkurang dihormati',
    detail:
      'Bila sistem operasi mengaktifkan "reduce motion", animasi dan transisi dinonaktifkan melalui prefers-reduced-motion.',
  },
  {
    title: 'Kontras warna terukur',
    detail:
      'Seluruh pasangan warna teks dan latar diambil dari design token yang rasionya diukur: minimum 4,5:1 untuk teks normal dan 3:1 untuk komponen antarmuka.',
  },
];

/** Keterbatasan yang diketahui — disebut terbuka, bukan disembunyikan. */
const knownLimitations = [
  {
    title: 'Audit otomatis dan uji pembaca layar belum berjalan di CI',
    detail:
      'Pemeriksaan axe-core dan pengujian end-to-end aksesibilitas belum menjadi gerbang rilis. Pernyataan di halaman ini berdasarkan pemeriksaan manual terhadap kode.',
  },
  {
    title: 'Peta interaktif',
    detail:
      'Peta lokasi pada beranda berbasis Leaflet dan belum menyediakan padanan non-visual yang setara. Alamat lengkap dan narahubung selalu tersedia dalam bentuk teks di sampingnya dan di halaman kontak.',
  },
  {
    title: 'Sebagian dokumentasi foto belum diunggah',
    detail:
      'Pada bagian yang berkasnya belum tersedia, situs menampilkan keterangan teks, bukan gambar kosong tanpa penjelasan.',
  },
  {
    title: 'Belum ada pintasan papan ketik kustom',
    detail:
      'Situs sengaja tidak memasang pintasan satu tombol seperti Alt+1 agar tidak bentrok dengan pintasan pembaca layar. Navigasi memakai mekanisme standar peramban.',
  },
];

export default function AksesibilitasPage() {
  return (
    <div className="civic-container py-12">
      <PageHeader
        title="Pernyataan aksesibilitas"
        description="Standar acuan: Web Content Accessibility Guidelines (WCAG) 2.2 Level AA. Halaman ini hanya memuat hal yang benar-benar sudah berlaku di situs, beserta keterbatasan yang masih ada."
      />

      <div className="max-w-3xl space-y-10">
        <section aria-labelledby="sudah-title">
          <h2 id="sudah-title" className="font-display text-2xl font-bold text-text-primary">
            Yang sudah berlaku
          </h2>
          <ul className="mt-4 space-y-4">
            {implemented.map((item) => (
              <li key={item.title} className="flex gap-3">
                <CheckCircle2
                  className="h-5 w-5 shrink-0 text-status-success-text mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-semibold text-text-primary">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="belum-title">
          <h2 id="belum-title" className="font-display text-2xl font-bold text-text-primary">
            Keterbatasan yang diketahui
          </h2>
          <ul className="mt-4 space-y-4">
            {knownLimitations.map((item) => (
              <li key={item.title} className="flex gap-3">
                <CircleDashed className="h-5 w-5 shrink-0 text-text-muted mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-text-primary">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pintasan-title">
          <h2 id="pintasan-title" className="font-display text-2xl font-bold text-text-primary">
            Pintasan papan ketik standar
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ['Pindah ke elemen berikutnya', 'Tab'],
              ['Pindah ke elemen sebelumnya', 'Shift + Tab'],
              ['Aktifkan tautan atau tombol', 'Enter / Space'],
              ['Tutup menu atau lightbox', 'Esc'],
              ['Foto sebelumnya / berikutnya di lightbox', '← / →'],
            ].map(([label, keys]) => (
              <Card key={label}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <span className="text-sm text-text-secondary">{label}</span>
                  <kbd className="rounded border border-border-strong bg-surface-subtle px-2.5 py-1 font-mono text-xs text-text-primary">
                    {keys}
                  </kbd>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="umpan-title"
          className="rounded-lg border border-border-subtle bg-surface-subtle p-6"
        >
          <h2 id="umpan-title" className="font-display text-xl font-bold text-text-primary">
            Umpan balik aksesibilitas
          </h2>
          <p className="mt-2 text-text-secondary">
            Bila Anda menemukan kendala mengakses bagian mana pun dari situs ini, sampaikan kepada
            kami. Kami menanggapi pada hari kerja.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <a
                href={`mailto:${site.contact.accessibilityEmail}`}
                className="inline-flex min-h-touch items-center rounded-md text-text-accent hover:underline"
              >
                {site.contact.accessibilityEmail}
              </a>
            </li>
            <li className="text-text-secondary">Telepon: {site.contact.phone}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
