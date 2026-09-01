import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import Link from 'next/link';

export const AchievementPreview: React.FC = () => {
  const achievements = [
    {
      id: 1,
      title: 'Kwarcab Tergiat II Tingkat Jawa Barat',
      year: '2025',
      description: 'Penghargaan atas dedikasi dan keaktifan Kwarcab Indramayu dalam membina generasi muda di tingkat daerah.',
    },
    {
      id: 2,
      title: 'Juara Umum Lomba Tingkat IV (LT-IV) Jabar',
      year: '2024',
      description: 'Regu putra utusan Kwarcab Indramayu berhasil meraih predikat regu berprestasi tinggi tingkat daerah.',
    },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Prestasi</h2>
            <p className="mt-1 text-sm text-gray-600">Capaian membanggakan Pramuka Indramayu.</p>
          </div>
          <div className="hidden sm:block">
            <Link href="/prestasi" tabIndex={-1}>
              <Button variant="outline">Lihat Semua Prestasi</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {achievements.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-green-600">
              <CardContent>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight pr-4">{item.title}</h3>
                  <Badge variant="brand">{item.year}</Badge>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 sm:hidden">
          <Link href="/prestasi" tabIndex={-1}>
            <Button variant="outline" className="w-full">Lihat Semua Prestasi</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
