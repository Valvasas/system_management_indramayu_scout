import { and, desc, eq, isNotNull, lte } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { NewsItem } from '@/types';

/** Slug kategori dipakai di URL supaya tautan hasil filter aman & rapi. */
export const categorySlug = (category: string) =>
  category
    .toLowerCase()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const toItem = (n: typeof schema.news.$inferSelect): NewsItem => ({
  id: n.id,
  slug: n.slug,
  title: n.title,
  category: n.category,
  excerpt: n.excerpt,
  content: n.content,
  coverImage: n.coverImage ?? '',
  author: n.author,
  publishedAt: (n.publishedAt ?? n.createdAt).toISOString(),
  tags: n.tags,
  status: n.status,
});

/** Hanya berita terbit yang tanggal terbitnya sudah lewat. */
async function published() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.news)
    .where(
      and(
        eq(schema.news.status, 'PUBLISHED'),
        isNotNull(schema.news.publishedAt),
        lte(schema.news.publishedAt, new Date()),
      ),
    )
    .orderBy(desc(schema.news.publishedAt));
  return rows.map(toItem);
}

export interface NewsQuery {
  /** Slug kategori tersanitasi, mis. "organisasi". `undefined` = semua. */
  category?: string;
  limit?: number;
}

export async function getNews({ category, limit }: NewsQuery = {}): Promise<NewsItem[]> {
  let items = await published();
  if (category) items = items.filter((n) => categorySlug(n.category) === category);
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  return (await published()).find((n) => n.slug === slug) ?? null;
}

export async function getNewsCategories(): Promise<{ value: string; label: string }[]> {
  const seen = new Map<string, string>();
  for (const n of await published()) seen.set(categorySlug(n.category), n.category);
  return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
    a.label.localeCompare(b.label, 'id'),
  );
}

export async function getNewsSlugs(): Promise<string[]> {
  return (await published()).map((n) => n.slug);
}
