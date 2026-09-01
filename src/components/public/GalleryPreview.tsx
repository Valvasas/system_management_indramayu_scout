import React from 'react';
import { Button } from '../ui/Button';
import Link from 'next/link';

export const GalleryPreview: React.FC = () => {
  const galleries = [
    { id: 1, title: 'HUT Pramuka ke-65', image: '/placeholder-gallery-1.jpg' },
    { id: 2, title: 'Lomba Tingkat III', image: '/placeholder-gallery-2.jpg' },
    { id: 3, title: 'Karya Bakti Lebaran', image: '/placeholder-gallery-3.jpg' },
    { id: 4, title: 'Pelantikan Garuda', image: '/placeholder-gallery-4.jpg' },
  ];

  return (
    <section className="py-12 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Galeri Kegiatan</h2>
            <p className="mt-1 text-sm text-gray-600">Dokumentasi momen berharga Pramuka Indramayu.</p>
          </div>
          <div className="hidden sm:block">
            <Link href="/galeri" tabIndex={-1}>
              <Button variant="outline">Lihat Semua Galeri</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galleries.map((item) => (
            <Link key={item.id} href={`/galeri/${item.id}`} className="group relative rounded-lg overflow-hidden bg-gray-200 aspect-square focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 block">
              <div className="absolute inset-0 bg-gray-300"></div> 
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-medium text-sm sm:text-base leading-tight">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-8 sm:hidden">
          <Link href="/galeri" tabIndex={-1}>
            <Button variant="outline" className="w-full">Lihat Semua Galeri</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
