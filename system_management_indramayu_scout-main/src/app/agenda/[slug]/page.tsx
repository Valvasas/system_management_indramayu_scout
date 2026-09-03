'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { mockAgendas } from '@/lib/data/mock-data';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AgendaDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const agenda = mockAgendas.find((a) => a.slug === slug);

  if (!agenda) {
    return (
      <div className="civic-container py-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-800 mb-4">Agenda Tidak Ditemukan</h1>
        <p className="text-neutral-600 mb-6">
          Kegiatan dengan alamat tautan tersebut tidak terdaftar atau telah diarsipkan.
        </p>
        <Link href="/agenda">
          <Button variant="primary">Kembali ke Daftar Agenda</Button>
        </Link>
      </div>
    );
  }

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

  return (
    <div className="civic-container py-12 max-w-4xl">
      <nav className="mb-6" aria-label="Breadcrumb">
        <Link
          href="/agenda"
          className="text-green-700 font-medium inline-flex items-center gap-1.5 hover:underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded"
        >
          <span aria-hidden="true">&larr;</span> Kembali ke Daftar Agenda
        </Link>
      </nav>

      <Card>
        <CardContent className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant={getStatusBadgeVariant(agenda.status)}>
              {getStatusLabel(agenda.status)}
            </Badge>
            <span className="text-sm text-neutral-500 font-medium">
              Penyelenggara: {agenda.organizer}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight mb-6">
            {agenda.title}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-neutral-50 rounded-lg border border-neutral-200 mb-8">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-neutral-500 block">Jadwal Pelaksanaan</span>
                <strong className="text-neutral-800">
                  {formatDate(agenda.dateStart)}
                  {agenda.dateEnd && agenda.dateEnd !== agenda.dateStart
                    ? ` s.d. ${formatDate(agenda.dateEnd)}`
                    : ''}
                </strong>
              </div>
              <div>
                <span className="text-neutral-500 block">Lokasi Kegiatan</span>
                <strong className="text-neutral-800">{agenda.location}</strong>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-neutral-500 block">Narahubung / Kontak</span>
                <strong className="text-neutral-800">{agenda.contactPerson}</strong>
              </div>
              <div>
                <span className="text-neutral-500 block">Status Pelaksanaan</span>
                <strong className="text-neutral-800">{getStatusLabel(agenda.status)}</strong>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-3">Deskripsi Kegiatan</h2>
            <div className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed space-y-4">
              <p>{agenda.description}</p>
              <p>
                Kegiatan ini dirancang untuk menumbuhkan kedisiplinan, mempererat persaudaraan antaranggota
                Gerakan Pramuka se-Kwartir Cabang Indramayu, serta mengasah keterampilan hidup dan kepemimpinan.
              </p>
            </div>
          </section>

          <section className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-neutral-900">Petunjuk Pelaksanaan & Teknis</h3>
              <p className="text-xs text-neutral-500">Unduh dokumen edaran dan panduan resmi panitia.</p>
            </div>
            <Link href="/dokumen">
              <Button variant="outline">
                Lihat di Pusat Dokumen &rarr;
              </Button>
            </Link>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
