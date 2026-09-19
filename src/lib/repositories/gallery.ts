import { mockGalleryAlbums } from '@/lib/data/mock-data';
import type { GalleryAlbum } from '@/types';

const byNewestFirst = (a: GalleryAlbum, b: GalleryAlbum) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

export async function getGalleryAlbums(limit?: number): Promise<GalleryAlbum[]> {
  const items = [...mockGalleryAlbums].sort(byNewestFirst);
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}

export async function getGalleryAlbumBySlug(slug: string): Promise<GalleryAlbum | null> {
  return mockGalleryAlbums.find((a) => a.slug === slug) ?? null;
}

export async function getGalleryAlbumSlugs(): Promise<string[]> {
  return mockGalleryAlbums.map((a) => a.slug);
}
