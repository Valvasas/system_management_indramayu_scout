import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { GolonganArt } from '@/components/illustrations/Scenes';
import { golongan } from '@/lib/golongan';

/**
 * Lima jalur sesuai usia. Di ponsel berupa karusel geser (tetap bisa dijangkau keyboard
 * karena tiap kartu adalah tautan); di desktop menjadi lima kolom.
 */
export const GolonganPaths: React.FC = () => (
  <Section
    id="golongan"
    eyebrow="Jalur petualangan"
    title="Setiap usia punya jalurnya"
    description="Dari Siaga yang belajar sambil bermain hingga Pembina yang mendampingi, temukan golongan yang sesuai untuk Anda atau anak Anda."
    action={{ label: 'Tentang golongan', href: '/golongan' }}
    topo
    emphasis="primary"
  >
    <ul className="scroll-snap-x -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
      {golongan.map((g, i) => (
        <Reveal as="li" key={g.id} delay={i * 80} className="w-[78%] shrink-0 sm:w-[44%] lg:w-auto">
          <article className="lift group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-base">
            <div className="aspect-[5/4] overflow-hidden">
              <GolonganArt id={g.id} className="transition-transform duration-500 ease-out group-hover:scale-105" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-warm">{g.age}</p>
              <h3 className="mt-1.5 font-display text-2xl font-semibold text-text-primary">
                <Link href={`/golongan/${g.id}`} className="stretched-link rounded-md">
                  {g.name}
                </Link>
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">{g.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-text-accent" aria-hidden="true">
                Selengkapnya
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </div>
          </article>
        </Reveal>
      ))}
    </ul>
  </Section>
);
