import type { Metadata } from 'next';
import { Award, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { PageHeader } from '@/components/ui/Section';
import { getAchievementLevels, getAchievements, levelFromSlug, levelSlug } from '@/lib/repositories';

export const metadata: Metadata = {
  title: 'Prestasi & Penghargaan',
  description:
    'Rekam jejak capaian, penghargaan kwartir, dan prestasi anggota Pramuka se-Kabupaten Indramayu.',
  alternates: { canonical: '/prestasi' },
};

const ALL = 'semua';

export default async function PrestasiPage({
  searchParams,
}: {
  searchParams?: { tingkat?: string };
}) {
  const levels = await getAchievementLevels();
  const level = levelFromSlug(searchParams?.tingkat ?? '');
  const active = level ? levelSlug(level) : ALL;
  const achievements = await getAchievements({ level });

  return (
    <div className="civic-container py-12">
      <PageHeader
        title="Prestasi & penghargaan"
        description="Rekam jejak capaian, penghargaan kwartir, dan prestasi anggota Pramuka se-Kabupaten Indramayu."
      />

      <div className="mb-8">
        <FilterChips
          label="Filter tingkat prestasi"
          param="tingkat"
          active={active}
          options={[
            { value: ALL, label: 'Semua' },
            ...levels.map((l) => ({ value: levelSlug(l), label: l })),
          ]}
        />
      </div>

      <p className="mb-4 text-sm text-text-secondary" aria-live="polite">
        {achievements.length} prestasi ditampilkan
        {level ? ` pada tingkat ${level.toLowerCase()}` : ''}.
      </p>

      {achievements.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Belum ada prestasi pada tingkat ini"
          description="Pilih tingkat lain atau tampilkan seluruh capaian yang sudah terverifikasi."
          action={{ label: 'Tampilkan semua prestasi', href: '/prestasi' }}
        />
      ) : (
        <>
          {/* Tabel untuk layar lebar. Wrapper bisa digulir dan fokusabel supaya
              pengguna keyboard tetap bisa menjangkaunya (WCAG 2.1.1). */}
          {/* WCAG 2.1.1: wadah yang bisa digulir harus dapat difokuskan agar
              pengguna keyboard bisa menggulirnya. role="region" + aria-label
              membuatnya tetap bermakna di pohon aksesibilitas. */}
          <div
            className="hidden overflow-x-auto rounded-lg border border-border-subtle md:block"
            tabIndex={0}
            role="region"
            aria-label="Tabel prestasi dan penghargaan"
          >
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Daftar prestasi Pramuka Indramayu beserta tahun, tingkat, dan penerima
              </caption>
              <thead>
                <tr className="border-b border-border-subtle bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <th scope="col" className="px-6 py-3.5">
                    Tahun
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Prestasi
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Tingkat
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Penerima
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {achievements.map((item) => (
                  <tr key={item.id}>
                    <th scope="row" className="whitespace-nowrap px-6 py-4 font-semibold text-text-primary">
                      {item.year}
                    </th>
                    <td className="px-6 py-4 font-medium text-text-primary">{item.title}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge tone="warning" icon={Award}>
                        {item.level}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{item.recipient}</td>
                    <td className="max-w-xs px-6 py-4 text-text-secondary">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Di bawah md tabel berubah jadi kartu, bukan tabel yang terpotong. */}
          <ul className="space-y-4 md:hidden">
            {achievements.map((item) => (
              <li key={item.id}>
                <Card as="article">
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-text-primary">{item.year}</span>
                      <Badge tone="warning" icon={Award}>
                        {item.level}
                      </Badge>
                    </div>
                    <h2 className="font-display text-lg font-bold leading-snug text-text-primary">
                      {item.title}
                    </h2>
                    <p className="text-sm text-text-secondary">
                      <span className="block text-xs text-text-muted">Penerima</span>
                      {item.recipient}
                    </p>
                    <p className="text-sm text-text-secondary">{item.description}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
