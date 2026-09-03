'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function KontakPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', organization: '', message: '' });
    }, 800);
  };

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
                    <span aria-hidden="true">📞</span>
                    <span>Telepon Kantor: (0234) 123456</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span aria-hidden="true">💬</span>
                    <span>Hotline WhatsApp: +62 812-3456-7890</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span aria-hidden="true">✉️</span>
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
                <span className="text-3xl block mb-2" aria-hidden="true">🗺️</span>
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

            {status === 'success' && (
              <div className="p-4 mb-6 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-start gap-2">
                <span className="font-bold" aria-hidden="true">✓</span>
                <div>
                  <strong>Pesan Berhasil Terkirim!</strong>
                  <p className="text-xs text-green-700 mt-0.5">
                    Terima kasih atas pesan Kakak. Sekretariat Kwarcab akan merespons secepatnya melalui pos-el.
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                Harap lengkapi semua kolom bertanda bintang (*) sebelum mengirim pesan.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kak Ahmad Fauzi"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm bg-white"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-neutral-700 mb-1">
                  Alamat Pos-el (Email) <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contoh@pramuka.or.id"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm bg-white"
                />
              </div>

              <div>
                <label htmlFor="organization" className="block text-xs font-semibold text-neutral-700 mb-1">
                  Pangkalan Gugus Depan / Kwartir Ranting
                </label>
                <input
                  id="organization"
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="Contoh: Kwarran Sindang / Gudep SMAN 1"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm bg-white"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-neutral-700 mb-1">
                  Isi Pesan / Pertanyaan <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tuliskan pesan, permohonan informasi, atau usulan Kakak..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm bg-white resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={status === 'submitting'}
              >
                Kirim Pesan
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
