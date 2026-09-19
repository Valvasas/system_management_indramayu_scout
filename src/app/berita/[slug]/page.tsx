import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CategoryBadge } from '@/components/ui/Badge';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { ShareLink } from './ShareLink';
import { getNews, getNewsBySlug, getNewsSlugs } from '@/lib/repositories';
import { formatDate } from '@/lib/format';
import { absoluteUrl, site } from '@/lib/site';

interface Params {
  params: { slug: string };
}

/**
 * Hanya slug hasil generateStaticParams yang dilayani. Tanpa ini, slug asing
 * dirender on-demand dan menghasilkan "soft 404" (halaman 404 dengan status 200)
 * yang membuat mesin pencari mengindeks halaman galat.
 */
export const dynamicParams = false;

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

  const related = (await getNews({ category: undefined, limit: 4 })).filter(
    (n) => n.slug !== news.slug,
  );

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

  return (
    <div className="civic-container py-12">
      <nav aria-label="Remah roti" className="mb-6">
        <Link
          href="/berita"
          className="inline-flex min-h-touch items-center gap-2 rounded-md text-sm font-medium text-text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar berita
        </Link>
      </nav>

      <article className="max-w-3xl">
        <header>
          <CategoryBadge>{news.category}</CategoryBadge>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-text-primary">
            {news.title}
          </h1>
          <p className="mt-4 border-b border-border-subtle pb-6 text-sm text-text-secondary">
            <time dateTime={news.publishedAt}>{formatDate(news.publishedAt)}</time>
            {' · '}
            Oleh {news.author}
          </p>
        </header>

        <MediaFrame
          src={news.coverImage}
          alt={`Dokumentasi kegiatan: ${news.title}`}
          aspect="video"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
          className="mt-8 rounded-lg border border-border-subtle"
          fallbackLabel="Foto dokumentasi kegiatan ini belum diunggah"
        />

        <div className="mt-8 space-y-5 text-base leading-relaxed text-text-primary">
          <p className="text-lg font-medium">{news.excerpt}</p>
          <p>{news.content}</p>
        </div>

        {news.tags.length > 0 && (
          <div className="mt-8 border-t border-border-subtle pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Topik terkait
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {news.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-pill border border-border-subtle bg-surface-subtle px-3 py-1 text-xs font-medium text-text-secondary"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="mt-8 flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-text-primary">Bagikan warta ini</p>
          <ShareLink title={news.title} />
        </footer>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="terkait-title" className="mt-12 max-w-3xl">
          <h2 id="terkait-title" className="font-display text-xl font-bold text-text-primary">
            Warta lainnya
          </h2>
          <ul className="mt-4 divide-y divide-border-subtle border-t border-border-subtle">
            {related.slice(0, 3).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/berita/${item.slug}`}
                  className="flex min-h-touch flex-col justify-center rounded-md py-4 hover:text-text-accent"
                >
                  <span className="font-medium">{item.title}</span>
                  <time className="text-xs text-text-secondary" dateTime={item.publishedAt}>
                    {formatDate(item.publishedAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
