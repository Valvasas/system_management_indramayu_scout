import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, CalendarDays, FileText, Images, Newspaper, Users, type LucideIcon } from 'lucide-react';
import { PortalHeader } from '@/components/dashboard/ui';
import { contentCounts } from '@/features/content/queries';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Konten situs' };

export default async function KontenPage() {
  await requirePermission('content.manage');
  const c = await contentCounts();

  const sections: { href: string; title: string; description: string; count: string; icon: LucideIcon }[] = [
    { href: '/dashboard/konten/berita', title: 'Berita', description: 'Tulis, simpan sebagai draf, lalu tayangkan.', count: `${c.news} berita${c.inReview ? ` · ${c.inReview} menunggu review` : ''}${c.draftNews ? ` · ${c.draftNews} draf` : ''}`, icon: Newspaper },
    { href: '/dashboard/konten/agenda', title: 'Agenda', description: 'Jadwal kegiatan dan pembukaan pendaftaran.', count: `${c.events} kegiatan`, icon: CalendarDays },
    { href: '/dashboard/konten/galeri', title: 'Galeri', description: 'Album dan foto dokumentasi.', count: `${c.albums} album`, icon: Images },
    { href: '/dashboard/konten/dokumen', title: 'Dokumen', description: 'Surat keputusan, formulir, dan panduan.', count: `${c.documents} dokumen`, icon: FileText },
    { href: '/dashboard/konten/pengurus', title: 'Pengurus', description: 'Susunan pengurus di halaman Struktur Organisasi.', count: `${c.board} orang`, icon: Users },
    { href: '/dashboard/konten/prestasi', title: 'Prestasi', description: 'Capaian gudep dan peserta.', count: `${c.achievements} prestasi`, icon: Award },
  ];

  return (
    <>
      <PortalHeader title="Konten situs" description="Kelola apa yang tampil di situs publik. Perubahan langsung tercatat di log aktivitas." />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(({ href, title, description, count, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full min-h-touch flex-col gap-3 rounded-lg border border-border-subtle bg-surface-base p-5 shadow-sm transition-colors hover:border-border-strong hover:bg-surface-subtle"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tag-surface text-tag-text">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-bold text-text-primary">{title}</span>
              <span className="text-text-secondary">{description}</span>
              <span className="mt-auto text-sm font-medium text-text-secondary">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
