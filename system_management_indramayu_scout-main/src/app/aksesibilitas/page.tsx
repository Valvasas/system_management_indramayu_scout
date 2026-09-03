import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata = {
  title: 'Pernyataan Aksesibilitas | Rumah Pramuka Indramayu',
  description: 'Komitmen aksesibilitas web Kwartir Cabang Gerakan Pramuka Indramayu terhadap standar WCAG 2.2 Level AA.',
};

export default function AksesibilitasPage() {
  return (
    <div className="civic-container py-12 max-w-4xl">
      <header className="mb-8 border-b border-neutral-200 pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-2">
          Pernyataan Aksesibilitas Web
        </h1>
        <p className="text-sm text-neutral-500">
          Standar Target: Web Content Accessibility Guidelines (WCAG) 2.2 Level AA
        </p>
      </header>

      <div className="space-y-8 text-neutral-800 text-sm sm:text-base leading-relaxed">
        <div className="p-5 bg-green-50 border-l-4 border-green-700 rounded-r-lg text-green-950">
          <p className="font-medium">
            Gerakan Pramuka adalah wadah pendidikan inklusif untuk semua kalangan. Kwartir Cabang Gerakan Pramuka Indramayu berkomitmen menghadirkan layanan digital yang ramah dan mudah diakses oleh seluruh lapisan masyarakat, termasuk penyandang disabilitas dan pengguna dengan perangkat berlayar terbatas.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-3">Langkah & Fitur Aksesibilitas</h2>
          <ul className="list-disc pl-5 space-y-2 text-neutral-700">
            <li>
              <strong>Navigasi Keyboard Penuh:</strong> Seluruh tautan, formulir, dan tombol dapat dijangkau dan dioperasikan menggunakan papan ketik tanpa memerlukan mouse.
            </li>
            <li>
              <strong>Indikator Fokus Terlihat (Focus Visible):</strong> Setiap elemen interaktif memiliki garis tepi fokus hijau yang kontras saat pengguna menekan tombol Tab.
            </li>
            <li>
              <strong>Tautan Pintas (Skip to Content):</strong> Pengguna keyboard dapat melompati navigasi utama langsung ke area konten utama halaman dengan menekan tombol Tab di awal halaman.
            </li>
            <li>
              <strong>Dukungan Gerak Berkurang (Reduced Motion):</strong> Situs secara otomatis mematikan animasi transisi jika sistem operasi perangkat Anda mengaktifkan preferensi *prefers-reduced-motion*.
            </li>
            <li>
              <strong>Target Sentuh Memadai:</strong> Seluruh tombol dan kontrol pada perangkat seluler didesain dengan tinggi minimal 44 piksel untuk kemudahan sentuhan jari.
            </li>
            <li>
              <strong>Rasio Kontras Warna:</strong> Teks normal memiliki rasio kontras terhadap latar belakang minimal 4.5:1 untuk keterbacaan yang optimal.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-3">Panduan Pintasan Papan Ketik (Keyboard Shortcuts)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Pindah ke Elemen Berikutnya</span>
                <kbd className="px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs font-mono text-neutral-800">
                  Tab
                </kbd>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Pindah ke Elemen Sebelumnya</span>
                <kbd className="px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs font-mono text-neutral-800">
                  Shift + Tab
                </kbd>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Aktifkan Tautan atau Tombol</span>
                <kbd className="px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs font-mono text-neutral-800">
                  Enter / Space
                </kbd>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Tutup Modal / Menu Bergerak</span>
                <kbd className="px-2.5 py-1 bg-neutral-100 border border-neutral-300 rounded text-xs font-mono text-neutral-800">
                  Esc
                </kbd>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pt-6 border-t border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900 mb-3">Umpan Balik & Bantuan Aksesibilitas</h2>
          <p className="text-neutral-700">
            Apabila Kakak menemukan kendala dalam mengakses bagian mana pun dari situs Rumah Pramuka Indramayu, mohon sampaikan kepada kami:
          </p>
          <div className="mt-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-sm">
            <p className="font-semibold text-neutral-900">Narahubung Aksesibilitas Kwarcab Indramayu:</p>
            <p>Pos-el: aksesibilitas@pramukaindramayu.or.id</p>
            <p>WhatsApp Hotline: +62 812-3456-7890</p>
          </div>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-neutral-200">
        <Link href="/" className="text-green-700 hover:underline font-medium text-sm">
          &larr; Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
