import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CategoryBadge } from '@/components/ui/Badge';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { ReadingProgress } from '@/components/public/ReadingProgress';
import { Hills } from '@/components/illustrations/Scenes';
import { paragraphs, readingMinutes } from '@/lib/reading';
import { ShareLink } from './ShareLink';
import { getNews, getNewsBySlug, getNewsSlugs } from '@/lib/repositories';
import { formatDate } from '@/lib/format';
import { absoluteUrl, site } from '@/lib/site';

interface Params {
  params: { slug: string };
}

/**
 * Slug yang belum ada saat build (konten baru dari CMS) dirender saat diminta, lalu di-cache.
 * Slug yang tidak ada di basis data memanggil notFound() di bawah → 404.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getNewsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const news = await getNewsBySlug(params.slug);
  if (!news) return { title: 'Berita tidak ditemukan', robots: { index: false } };

  const url = `/berita/${news.slug}`;
  return {
    title: news.title,
    description: news.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: news.title,
      description: news.excerpt,
      url: absoluteUrl(url),
      publishedTime: news.publishedAt,
      authors: [news.author],
      tags: news.tags,
    },
  };
}

export default async function DetailBeritaPage({ params }: Params) {
  const news = await getNewsBySlug(params.slug);
  if (!news) notFound();

  const related = (await getNews({ category: undefined, limit: 4 })).filter((n) => n.slug !== news.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: news.title,
    description: news.excerpt,
    datePublished: news.publishedAt,
    author: { '@type': 'Organization', name: news.author },
    publisher: {
      '@type': 'Organization',
      name: site.organization,
      logo: { '@type': 'ImageObject', url: absoluteUrl(site.logo) },
    },
    mainEntityOfPage: absoluteUrl(`/berita/${news.slug}`),
  };

  const url = absoluteUrl(`/berita/${news.slug}`);
  const body = paragraphs(news.content);

  return (
    <div>
      <ReadingProgress targetId="isi-berita" />
      <header className="relative overflow-hidden bg-surface-sky">
        <div className="topo absolute inset-0" aria-hidden="true" />
        <div className="civic-container relative pb-28 pt-6 sm:pb-36 sm:pt-10">
          <Breadcrumbs items={[{ label: 'Berita', href: '/berita' }, { label: news.category }]} />
          <div className="mx-auto mt-8 max-w-3xl text-center animate-rise">
            <CategoryBadge>{news.category}</CategoryBadge>
            <h1 className="mt-5 font-display text-display-lg font-semibold text-text-primary">{news.title}</h1>
            <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-text-secondary">
              <time dateTime={news.publishedAt}>{formatDate(news.publishedAt)}</time>
              <span aria-hidden="true">·</span>
              <span>Oleh {news.author}</span>
              <span aria-hidden="true">·</span>
              <span>{readingMinutes(news.content)} menit baca</span>
            </p>
          </div>
        </div>
        <Hills className="absolute inset-x-0 -bottom-px text-surface-canvas" phase={2.4} />
      </header>

      <div className="civic-container -mt-20 pb-16 sm:-mt-28 sm:pb-24">
        <MediaFrame
          src={news.coverImage}
          alt={`Dokumentasi kegiatan: ${news.title}`}
          aspect="video"
          sizes="(max-width: 1024px) 100vw, 1024px"
          priority
          className="relative mx-auto max-w-5xl rounded-3xl shadow-lg"
          fallbackLabel="Foto dokumentasi kegiatan ini belum diunggah"
        />

        <div className="mx-auto mt-12 grid max-w-5xl gap-12 lg:grid-cols-[1fr_15rem]">
          <article id="isi-berita" aria-labelledby="judul-berita" className="min-w-0">
            <h2 id="judul-berita" className="sr-only">
              Isi berita
            </h2>
            <p className="font-display text-2xl leading-snug text-text-primary text-pretty">{news.excerpt}</p>
            <div className="mt-8 space-y-6 text-[1.075rem] leading-[1.8] text-text-primary">
              {body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </article>

          <aside aria-label="Bagikan dan topik" className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-border-subtle bg-surface-base p-5">
              <h2 className="text-sm font-bold text-text-primary">Bagikan berita ini</h2>
              <div className="mt-3">
                <ShareLink title={news.title} url={url} />
              </div>
              {news.tags.length > 0 && (
                <>
                  <h2 className="mt-6 text-sm font-bold text-text-primary">Topik</h2>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {news.tags.map((tag) => (
                      <li key={tag}>
                        <Link
                          href={`/cari?q=${encodeURIComponent(tag)}`}
                          className="inline-flex min-h-touch items-center rounded-pill bg-surface-meadow px-3 text-sm font-medium text-action-secondary-text hover:bg-action-secondary-hover"
                        >
                          #{tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <Link
              href="/berita"
              className="mt-4 inline-flex min-h-touch items-center gap-2 rounded-md text-sm font-semibold text-text-accent hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Semua berita
            </Link>
          </aside>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="terkait-title" className="mx-auto mt-20 max-w-5xl">
            <p className="eyebrow">Baca juga</p>
            <h2 id="terkait-title" className="mt-2 font-display text-display-md font-semibold text-text-primary">
              Cerita lainnya
            </h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {related.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <article className="lift group relative h-full overflow-hidden rounded-2xl border border-border-subtle bg-surface-base">
                    <MediaFrame
                      src={item.coverImage}
                      alt=""
                      aspect="video"
                      keepAspect
                      sizes="(max-width: 768px) 100vw, 33vw"
                      fallbackLabel="Foto menyusul"
                    />
                    <div className="p-5">
                      <time className="text-xs text-text-secondary" dateTime={item.publishedAt}>
                        {formatDate(item.publishedAt)}
                      </time>
                      <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-text-primary">
                        <Link href={`/berita/${item.slug}`} className="stretched-link rounded-md group-hover:text-text-accent">
                          {item.title}
                        </Link>
                      </h3>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
