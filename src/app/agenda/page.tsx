'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { mockAgendas } from '@/lib/data/mock-data';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

export default function AgendaPage() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED'>('ALL');

  const filterOptions = [
    { key: 'ALL', label: t('filter.all') || 'Semua' },
    { key: 'UPCOMING', label: t('filter.upcoming') || 'Akan Datang' },
    { key: 'ONGOING', label: t('filter.ongoing') || 'Sedang Berlangsung' },
    { key: 'COMPLETED', label: t('filter.completed') || 'Selesai' },
  ] as const;

  const filteredAgendas = filter === 'ALL'
    ? mockAgendas
    : mockAgendas.filter((agenda) => agenda.status === filter);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'info';
      case 'ONGOING':
        return 'success';
      case 'COMPLETED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'Akan Datang';
      case 'ONGOING':
        return 'Sedang Berlangsung';
      case 'COMPLETED':
        return 'Selesai';
      default:
        return status;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="civic-container py-12">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          {t('nav.agenda') || 'Agenda Kegiatan'}
        </h1>
        <p className="text-neutral-600 max-w-2xl text-base sm:text-lg">
          Jadwal resmi program kegiatan, perlombaan, pelatihan, dan upacara kepramukaan Kwartir Cabang Indramayu.
        </p>
      </header>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter status agenda">
        {filterOptions.map((opt) => {
          const isActive = filter === opt.key;
          return (
            <button
              key={opt.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilter(opt.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-600 ${
                isActive
                  ? 'bg-green-700 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Agenda Items */}
      {filteredAgendas.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-neutral-500">Tidak ada agenda kegiatan pada kategori ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAgendas.map((agenda) => (
            <Link
              key={agenda.id}
              href={`/agenda/${agenda.slug}`}
              className="block group focus:outline-none focus:ring-2 focus:ring-green-600 rounded-lg"
            >
              <Card hoverable className="transition-all duration-200 group-hover:border-green-300">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(agenda.status)}>
                          {getStatusLabel(agenda.status)}
                        </Badge>
                        <span className="text-xs text-neutral-500 font-medium">
                          Oleh: {agenda.organizer}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-neutral-900 group-hover:text-green-700 transition-colors">
                        {agenda.title}
                      </h2>
                      <p className="text-neutral-600 text-sm line-clamp-2">
                        {agenda.description}
                      </p>
                      <div className="flex flex-wrap gap-y-1 gap-x-6 text-xs sm:text-sm text-neutral-500 pt-1">
                        <span className="flex items-center gap-1.5">
                          <span aria-hidden="true">📅</span>
                          <span>
                            {formatDate(agenda.dateStart)}
                            {agenda.dateEnd && agenda.dateEnd !== agenda.dateStart
                              ? ` - ${formatDate(agenda.dateEnd)}`
                              : ''}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span aria-hidden="true">📍</span>
                          <span>{agenda.location}</span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center self-start md:self-center">
                      <span className="text-sm font-semibold text-green-700 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Lihat Detail <span aria-hidden="true">&rarr;</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
