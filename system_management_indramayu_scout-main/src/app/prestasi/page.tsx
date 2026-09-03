'use client';

import React, { useState } from 'react';
import { mockAchievements } from '@/lib/data/mock-data';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

export default function PrestasiPage() {
  const { t } = useLanguage();
  const [levelFilter, setLevelFilter] = useState<string>('Semua');

  const levels = ['Semua', 'Nasional', 'Provinsi', 'Kabupaten'];

  const filteredAchievements = levelFilter === 'Semua'
    ? mockAchievements
    : mockAchievements.filter((a) => a.level === levelFilter);

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'Nasional':
        return 'warning';
      case 'Provinsi':
        return 'brand';
      case 'Kabupaten':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className="civic-container py-12">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          {t('nav.achievement') || 'Prestasi & Penghargaan'}
        </h1>
        <p className="text-neutral-600 max-w-2xl text-base sm:text-lg">
          Rekam jejak capaian, penghargaan kwartir, dan prestasi membanggakan anggota Pramuka se-Kabupaten Indramayu.
        </p>
      </header>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter tingkat prestasi">
        {levels.map((lvl) => {
          const isActive = levelFilter === lvl;
          return (
            <button
              key={lvl}
              role="tab"
              aria-selected={isActive}
              onClick={() => setLevelFilter(lvl)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-600 ${
                isActive
                  ? 'bg-green-700 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {lvl}
            </button>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-6">Tahun</th>
              <th scope="col" className="py-3.5 px-6">Nama Prestasi / Kejuaraan</th>
              <th scope="col" className="py-3.5 px-6">Tingkat</th>
              <th scope="col" className="py-3.5 px-6">Penerima / Kontingen</th>
              <th scope="col" className="py-3.5 px-6">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {filteredAchievements.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                <td className="py-4 px-6 font-semibold text-neutral-800 whitespace-nowrap">
                  {item.year}
                </td>
                <td className="py-4 px-6 font-bold text-neutral-900">
                  {item.title}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <Badge variant={getLevelBadgeVariant(item.level)}>
                    {item.level}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-neutral-700">
                  {item.recipient}
                </td>
                <td className="py-4 px-6 text-neutral-500 text-xs max-w-xs">
                  {item.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredAchievements.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-green-800 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  Tahun {item.year}
                </span>
                <Badge variant={getLevelBadgeVariant(item.level)}>
                  {item.level}
                </Badge>
              </div>
              <h2 className="font-bold text-lg text-neutral-900 leading-snug">
                {item.title}
              </h2>
              <div className="text-sm text-neutral-700">
                <span className="text-xs text-neutral-500 block">Penerima:</span>
                <strong>{item.recipient}</strong>
              </div>
              <p className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded border border-neutral-100">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
