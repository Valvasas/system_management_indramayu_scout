import React from 'react';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { CategoryBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { formatDate } from '@/lib/format';
import { getNews } from '@/lib/repositories';
import { readingMinutes } from '@/lib/reading';

/** Berita: satu sorotan besar + dua berita ringkas (grid asimetris, tidak kaku). */
export async function NewsFeature() {
  const news = await getNews({ limit: 3 });
  const [lead, ...rest] = news;

  return (
    <Section id="berita-terbaru" eyebrow="Kabar terbaru" title="Cerita dari lapangan" action={{ label: 'Semua berita', href: '/berita' }} emphasis="primary">
      {!lead ? (
        <EmptyState icon={Newspaper} title="Belum ada berita terbit" description="Berita kegiatan akan tayang di sini setelah dipublikasikan humas kwarcab." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <Reveal as="article" className="lift group relative overflow-hidden rounded-3xl border border-border-subtle bg-surface-base lg:col-span-7">
            <MediaFrame src={lead.coverImage} alt="" aspect="video" keepAspect priority sizes="(max-width: 1024px) 100vw, 58vw" fallbackLabel="Foto menyusul" />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                <CategoryBadge>{lead.category}</CategoryBadge>
                <time dateTime={lead.publishedAt}>{formatDate(lead.publishedAt)}</time>
                <span aria-hidden="true">·</span>
                <span>{readingMinutes(lead.content)} menit baca</span>
              </div>
              <h3 className="mt-4 font-display text-display-md font-semibold text-text-primary">
                <Link href={`/berita/${lead.slug}`} className="stretched-link rounded-md group-hover:text-text-accent">
                  {lead.title}
                </Link>
              </h3>
              <p className="mt-3 max-w-prose text-text-secondary">{lead.excerpt}</p>
            </div>
          </Reveal>

          <ul className="grid gap-6 lg:col-span-5">
            {rest.map((n, i) => (
              <Reveal as="li" key={n.id} delay={(i + 1) * 100}>
                <article className="lift group relative grid h-full grid-cols-[7.5rem_1fr] overflow-hidden rounded-3xl border border-border-subtle bg-surface-base sm:grid-cols-[11rem_1fr]">
                  {/* Kolom gambar lebar tetap: teks tidak pernah terdorong keluar kartu. */}
                  <div className="relative min-h-[8rem]">
                    <MediaFrame src={n.coverImage} alt="" aspect="square" keepAspect className="!absolute inset-0 !aspect-auto" sizes="11rem" fallbackLabel="" />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                      <CategoryBadge>{n.category}</CategoryBadge>
                      <time dateTime={n.publishedAt}>{formatDate(n.publishedAt)}</time>
                    </div>
                    <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-text-primary">
                      <Link href={`/berita/${n.slug}`} className="stretched-link rounded-md group-hover:text-text-accent">
                        {n.title}
                      </Link>
                    </h3>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
