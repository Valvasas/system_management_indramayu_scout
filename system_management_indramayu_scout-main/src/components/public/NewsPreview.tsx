import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import Link from 'next/link';

export const NewsPreview: React.FC = () => {
  const news = [
    {
      id: 1,
      title: 'Kwarcab Indramayu Berhasil Raih Predikat Tergiat',
      summary: 'Kwartir Cabang Gerakan Pramuka Indramayu kembali menorehkan prestasi sebagai Kwarcab Tergiat di tingkat daerah Jawa Barat.',
      date: '12 Agustus 2026',
      category: 'Prestasi',
    },
    {
      id: 2,
      title: 'Pelepasan Kontingen Jambore Nasional',
      summary: 'Bupati Indramayu selaku Kamabicab secara resmi melepas kontingen Pramuka Penggalang menuju Jambore Nasional.',
      date: '5 Agustus 2026',
      category: 'Kegiatan',
    },
    {
      id: 3,
      title: 'Aksi Pramuka Peduli Lingkungan di Pantai Karangsong',
      summary: 'Ratusan anggota Penegak dan Pandega berpartisipasi dalam penanaman mangrove di pesisir Karangsong.',
      date: '28 Juli 2026',
      category: 'Abdimas',
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Warta Pramuka</h2>
            <p className="mt-1 text-sm text-gray-600">Berita dan informasi terbaru seputar kegiatan.</p>
          </div>
          <div className="hidden sm:block">
            <Link href="/berita" tabIndex={-1}>
              <Button variant="outline">Lihat Semua Berita</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item) => (
            <Card key={item.id} hoverable className="flex flex-col h-full">
              <div className="h-48 bg-gray-200 w-full relative">
                 <div className="absolute top-4 left-4">
                   <Badge variant="brand">{item.category}</Badge>
                 </div>
              </div>
              <CardContent className="flex flex-col flex-grow">
                <p className="text-xs text-gray-500 mb-2">{item.date}</p>
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                  <Link href={`/berita/${item.id}`} className="hover:text-green-700 focus:outline-none focus:underline rounded">
                    {item.title}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">{item.summary}</p>
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <Link href={`/berita/${item.id}`} className="text-sm font-medium text-green-700 hover:text-green-800 focus:outline-none focus:underline">
                    Baca selengkapnya &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 sm:hidden">
          <Link href="/berita" tabIndex={-1}>
            <Button variant="outline" className="w-full">Lihat Semua Berita</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
