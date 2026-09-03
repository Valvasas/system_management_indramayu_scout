import React from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import Link from 'next/link';

export const Hero: React.FC = () => {
  return (
    <section className="relative bg-gray-50 pt-16 pb-20 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8 border-b border-gray-200">
      <div className="max-w-7xl mx-auto text-center">
        <div className="mb-6 flex justify-center">
          <Badge variant="success">Portal Resmi Kwarcab Indramayu</Badge>
        </div>
        
        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-6">
          Rumah Digital <br className="hidden sm:inline" />
          <span className="text-green-700">Gerakan Pramuka Indramayu</span>
        </h1>
        
        <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-600 sm:text-xl md:mt-5 md:max-w-3xl mb-10">
          Pusat informasi resmi kegiatan, publikasi, dan layanan Kwartir Cabang Gerakan Pramuka Indramayu.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/agenda" tabIndex={-1}>
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Lihat Agenda Kegiatan
            </Button>
          </Link>
          <Link href="/berita" tabIndex={-1}>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Baca Warta Terbaru
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
