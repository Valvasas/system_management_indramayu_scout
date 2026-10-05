import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { GolonganArt } from '@/components/illustrations/Scenes';
import { PageHero } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { golongan } from '@/lib/golongan';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Golongan',
  description: 'Siaga, Penggalang, Penegak, Pandega, dan Pembina: jalur pendidikan kepramukaan menurut usia di Kwarcab Indramayu.',
  alternates: { canonical: '/golongan' },
};

export default function GolonganIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="Jalur petualangan"
        title="Golongan dalam Gerakan Pramuka"
        description="Pendidikan kepramukaan disusun berjenjang menurut usia. Setiap golongan punya satuan, kegiatan, dan tantangannya sendiri."
        scene="meadow"
        top={<Breadcrumbs items={[{ label: 'Golongan' }]} />}
      />
      <div className="civic-container pb-16 pt-6 sm:pb-24">
        <ol className="space-y-16 sm:space-y-24">
          {golongan.map((g, i) => (
            <Reveal as="li" key={g.id} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div className={cn('overflow-hidden rounded-3xl shadow-md', i % 2 === 1 && 'lg:order-2')}>
                <div className="aspect-[5/4]">
                  <GolonganArt id={g.id} />
                </div>
              </div>
              <div>
                <p className="eyebrow">
                  <span className="tabular-nums">0{i + 1}</span> · {g.age}
                </p>
                <h2 className="mt-3 font-display text-display-lg font-semibold text-text-primary">{g.name}</h2>
                <p className="mt-4 max-w-prose text-lg leading-relaxed text-text-secondary">{g.tagline}</p>
                <dl className="mt-6 grid max-w-md grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-surface-base p-4 shadow-sm">
                    <dt className="text-xs font-semibold text-text-secondary">Satuan</dt>
                    <dd className="mt-1 font-semibold text-text-primary">{g.units.map((u) => u.name).join(' · ')}</dd>
                  </div>
                  <div className="rounded-2xl bg-surface-base p-4 shadow-sm">
                    <dt className="text-xs font-semibold text-text-secondary">{g.levels.label}</dt>
                    <dd className="mt-1 font-semibold text-text-primary">{g.levels.items.length} jenjang</dd>
                  </div>
                </dl>
                <Link
                  href={`/golongan/${g.id}`}
                  className="group mt-7 inline-flex min-h-touch items-center gap-2 rounded-pill font-semibold text-text-accent hover:underline"
                >
                  Kenali golongan {g.name}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </>
  );
}
