import React from 'react';
import { Card, CardContent } from '../ui/Card';

export const StatsSection: React.FC = () => {
  const stats = [
    { label: 'Anggota Aktif', value: '45.000+' },
    { label: 'Gugus Depan', value: '1.200+' },
    { label: 'Kwartir Ranting', value: '31' },
    { label: 'Kegiatan Tahunan', value: '150+' },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="sr-only">Statistik Organisasi</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <p className="text-3xl sm:text-4xl font-extrabold text-green-700">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
