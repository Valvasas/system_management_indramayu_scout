'use client';

import React from 'react';
import { Phone, MessageCircle, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/Card';
import { ContactForm } from './ContactForm';

export default function KontakPage() {
  const { t } = useLanguage();
  return (
    <div className="civic-container py-12">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          {t('nav.contact') || 'Hubungi Kami'}
        </h1>
        <p className="text-neutral-600 max-w-2xl text-base sm:text-lg">
          Layanan aspirasi masyarakat, konfirmasi kegiatan, dan sekretariat Kwartir Cabang Gerakan Pramuka Indramayu.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Contact Info & Office Details */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Sekretariat Kwarcab</h2>
                <address className="not-italic text-neutral-700 text-sm leading-relaxed space-y-1">
                  <p className="font-semibold text-neutral-900">Gedung Kwarcab Gerakan Pramuka Indramayu</p>
                  <p>Jl. Pramuka / Kawasan Simpang Lima</p>
                  <p>Kabupaten Indramayu, Jawa Barat 45211</p>
                </address>
              </div>

              <div className="border-t border-neutral-100 pt-5">
                <h3 className="text-sm font-bold text-neutral-900 mb-2">Jam Layanan Kantor:</h3>
                <ul className="text-xs sm:text-sm text-neutral-600 space-y-1">
                  <li>Senin – Kamis: 08.00 – 16.00 WIB</li>
                  <li>Jumat: 08.00 – 16.30 WIB (Istirahat Shalat Jumat 11.30 – 13.00)</li>
                  <li>Sabtu & Minggu: Tutup (Kecuali ada kegiatan dinas khusus)</li>
                </ul>
              </div>

              <div className="border-t border-neutral-100 pt-5">
                <h3 className="text-sm font-bold text-neutral-900 mb-2">Saluran Komunikasi Resmi:</h3>
                <ul className="text-xs sm:text-sm text-neutral-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Telepon Kantor: (0234) 123456</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Hotline WhatsApp: +62 812-3456-7890</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Pos-el: info@pramukaindramayu.or.id</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Map Location Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-neutral-900 mb-2 text-sm">Peta Lokasi Kantor</h3>
              <div className="bg-neutral-100 rounded-lg p-6 text-center border border-neutral-200">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-neutral-500" aria-hidden="true" />
                <p className="text-xs text-neutral-600 mb-3">
                  Peta koordinat sekretariat Simpang Lima Indramayu.
                </p>
                <a
                  href="https://maps.google.com/?q=Kwarcab+Pramuka+Indramayu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-800 bg-white border border-neutral-300 rounded px-3 py-2 hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 min-h-[44px]"
                >
                  Buka di Google Maps <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message / Feedback Form */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Kirim Pesan / Aspirasi</h2>
            <p className="text-xs text-neutral-500 mb-6">
              Sampaikan pertanyaan, usulan kegiatan, atau koordinasi kwartir ranting dan gugus depan.
            </p>

            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}