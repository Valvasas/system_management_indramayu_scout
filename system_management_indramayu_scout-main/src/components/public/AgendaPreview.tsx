import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import Link from 'next/link';

export const AgendaPreview: React.FC = () => {
  const agendas = [
    {
      id: 1,
      title: 'Perkemahan Wirakarya Cabang',
      date: '15 - 18 Agustus 2026',
      location: 'Bumi Perkemahan Indramayu',
      status: 'Akan Datang',
      variant: 'brand' as const,
    },
    {
      id: 2,
      title: 'Kursus Mahir Dasar (KMD)',
      date: '20 - 25 September 2026',
      location: 'Gedung PGRI Indramayu',
      status: 'Pendaftaran Buka',
      variant: 'info' as const,
    },
    {
      id: 3,
      title: 'Rapat Kerja Cabang',
      date: '10 Oktober 2026',
      location: 'Sekretariat Kwarcab Indramayu',
      status: 'Akan Datang',
      variant: 'default' as const,
    }
  ];

  return (
    <section className="py-12 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Agenda Kegiatan</h2>
            <p className="mt-1 text-sm text-gray-600">Informasi kegiatan kepramukaan terdekat.</p>
          </div>
          <div className="hidden sm:block">
            <Link href="/agenda" tabIndex={-1}>
              <Button variant="outline">Lihat Semua Agenda</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agendas.map((agenda) => (
            <Card key={agenda.id} hoverable>
              <CardContent>
                <Badge variant={agenda.variant} className="mb-4">{agenda.status}</Badge>
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{agenda.title}</h3>
                <div className="text-sm text-gray-600 space-y-2 mt-4">
                  <p className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {agenda.date}
                  </p>
                  <p className="flex items-center">
                    <svg className="mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {agenda.location}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 sm:hidden">
          <Link href="/agenda" tabIndex={-1}>
            <Button variant="outline" className="w-full">Lihat Semua Agenda</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
