import React from 'react';
import { Button } from '../ui/Button';
import Link from 'next/link';

export const AboutPreview: React.FC = () => {
  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          <div className="mb-10 lg:mb-0">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              Membangun Karakter Generasi Muda Indramayu
            </h2>
            <div className="prose prose-green prose-lg text-gray-600 mb-6">
              <p className="mb-4">
                Kwartir Cabang Gerakan Pramuka Indramayu memiliki komitmen kuat dalam menyelenggarakan pendidikan kepramukaan yang berkualitas, inklusif, dan adaptif terhadap perkembangan zaman.
              </p>
              <p>
                Kami berperan aktif dalam membina mental, spiritual, dan fisik kaum muda Indramayu agar menjadi warga negara yang bertanggung jawab, mandiri, dan berkarakter mulia.
              </p>
            </div>
            <Link href="/tentang" tabIndex={-1}>
              <Button variant="outline" size="lg">Pelajari Lebih Lanjut</Button>
            </Link>
          </div>
          
          <div className="relative">
            <div className="aspect-w-4 aspect-h-3 rounded-lg bg-gray-100 overflow-hidden shadow-sm relative min-h-[300px]">
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Ilustrasi / Foto Kegiatan Pramuka</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
