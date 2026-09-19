import { mockNews } from '@/lib/data/mock-data';
import type { NewsItem } from '@/types';

const byNewestFirst = (a: NewsItem, b: NewsItem) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

const published = () => mockNews.filter((n) => n.status === 'PUBLISHED').sort(byNewestFirst);

export interface NewsQuery {
  /** Slug kategori tersanitasi, mis. "organisasi". `undefined` = semua. */
  category?: string;
  limit?: number;
}

/** Slug kategori dipakai di URL supaya tautan hasil filter aman & rapi. */
export const categorySlug = (category: string) =>
  category
    .toLowerCase()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export async function getNews({ category, limit }: NewsQuery = {}): Promise<NewsItem[]> {
  let items = published();
  if (category) items = items.filter((n) => categorySlug(n.category) === category);
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  return published().find((n) => n.slug === slug) ?? null;
}

export async function getNewsCategories(): Promise<{ value: string; label: string }[]> {
  const seen = new Map<string, string>();
  for (const n of published()) seen.set(categorySlug(n.category), n.category);
  return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
    a.label.localeCompare(b.label, 'id'),
  );
}

export async function getNewsSlugs(): Promise<string[]> {
  return published().map((n) => n.slug);
}
