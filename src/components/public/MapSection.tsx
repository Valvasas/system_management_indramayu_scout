import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

export const MapSection: React.FC = () => {
  return (
    <section className="py-12 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Lokasi Sekretariat</h2>
          <p className="mt-1 text-sm text-gray-600">Kunjungi pusat layanan dan informasi kami.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-lg overflow-hidden border border-gray-200 bg-gray-200 min-h-[300px] relative">
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 flex-col">
              <svg className="h-12 w-12 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Peta Interaktif Dimuat di Sini</span>
            </div>
          </div>
          
          <div>
            <Card className="h-full">
              <CardContent className="flex flex-col h-full">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Kontak</h3>
                
                <div className="space-y-4 text-sm text-gray-700 flex-grow">
                  <div>
                    <strong className="block text-gray-900 mb-1">Alamat:</strong>
                    <p>Jl. Pramuka / Simpang Lima<br />Kabupaten Indramayu<br />Jawa Barat 45211</p>
                  </div>
                  <div>
                    <strong className="block text-gray-900 mb-1">Telepon:</strong>
                    <p>(0234) 123456</p>
                  </div>
                  <div>
                    <strong className="block text-gray-900 mb-1">Email:</strong>
                    <p>info@pramukaindramayu.or.id</p>
                  </div>
                  <div>
                    <strong className="block text-gray-900 mb-1">Jam Operasional:</strong>
                    <p>Senin - Jumat: 08:00 - 16:00 WIB<br />Sabtu - Minggu: Tutup</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <a href="https://maps.google.com/?q=Kwarcab+Indramayu" target="_blank" rel="noopener noreferrer" tabIndex={-1}>
                    <Button variant="primary" className="w-full">
                      Dapatkan Petunjuk Arah
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
