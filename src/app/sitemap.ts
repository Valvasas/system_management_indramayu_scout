import type { MetadataRoute } from 'next';
import { getAgenda, getGalleryAlbums, getNews } from '@/lib/repositories';
import { absoluteUrl } from '@/lib/site';

const staticRoutes: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/tentang', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/struktur-organisasi', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/berita', priority: 0.9, changeFrequency: 'daily' },
  { path: '/agenda', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/galeri', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/prestasi', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/dokumen', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/kontak', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/kebijakan-privasi', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/aksesibilitas', priority: 0.3, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, agendas, albums] = await Promise.all([
    getNews(),
    getAgenda(),
    getGalleryAlbums(),
  ]);

  const now = new Date();

  return [
    ...staticRoutes.map((r) => ({
      url: absoluteUrl(r.path),
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...news.map((n) => ({
      url: absoluteUrl(`/berita/${n.slug}`),
      lastModified: new Date(n.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...agendas.map((a) => ({
      url: absoluteUrl(`/agenda/${a.slug}`),
      lastModified: new Date(a.dateStart),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...albums.map((g) => ({
      url: absoluteUrl(`/galeri/${g.slug}`),
      lastModified: new Date(g.date),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}
