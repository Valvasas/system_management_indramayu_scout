import React from 'react';
import { Medal, Trophy } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { getAchievements } from '@/lib/repositories';

/** Tiga capaian terbaru, ditulis seperti piagam: tingkat, tahun, nama prestasi, penerima. */
export async function AchievementStrip() {
  const items = await getAchievements({ limit: 3 });

  return (
    <Section id="prestasi-terbaru" eyebrow="Prestasi" title="Kebanggaan bersama" action={{ label: 'Semua prestasi', href: '/prestasi' }}>
      {items.length === 0 ? (
        <EmptyState icon={Trophy} title="Belum ada prestasi tercatat" description="Capaian gudep dan peserta akan ditampilkan di sini." />
      ) : (
        <ul className="grid gap-5 md:grid-cols-3">
          {items.map((a, i) => (
            <Reveal as="li" key={a.id} delay={i * 90} className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-base p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-surface-ember text-text-warm">
                <Medal className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-text-warm">
                Tingkat {a.level} · {a.year}
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-text-primary">{a.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{a.recipient}</p>
            </Reveal>
          ))}
        </ul>
      )}
    </Section>
  );
}
