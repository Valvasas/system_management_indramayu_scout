import { mockDocuments } from '@/lib/data/mock-data';
import type { DocumentItem } from '@/types';

/** Host luar yang boleh menyajikan dokumen resmi. Kosong = hanya berkas sendiri. */
const ALLOWED_DOCUMENT_HOSTS = ['pramukaindramayu.or.id', 'www.pramukaindramayu.or.id'];

/**
 * Tautan unduhan hanya diterima bila mengarah ke berkas milik sendiri
 * (path absolut `/...`) atau ke host dalam allowlist (P1-7).
 * Menolak `#`, `javascript:`, `data:`, dan redirect ke host asing.
 */
export function isSafeDocumentUrl(url: string): boolean {
  if (!url || url === '#') return false;
  if (url.startsWith('//')) return false;
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_DOCUMENT_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export type DocumentEntry = DocumentItem & {
  /** Berkas siap diunduh (URL lolos validasi). */
  available: boolean;
  isExternal: boolean;
};

const decorate = (doc: DocumentItem): DocumentEntry => ({
  ...doc,
  available: isSafeDocumentUrl(doc.url),
  isExternal: /^https?:\/\//i.test(doc.url),
});

export const documentCategorySlug = (category: string) =>
  category
    .toLowerCase()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export interface DocumentQuery {
  category?: string;
  search?: string;
}

export async function getDocuments({ category, search }: DocumentQuery = {}): Promise<
  DocumentEntry[]
> {
  let items = [...mockDocuments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  if (category) items = items.filter((d) => documentCategorySlug(d.category) === category);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (d) =>
        d.title.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q),
    );
  }
  return items.map(decorate);
}

export async function getDocumentCategories(): Promise<{ value: string; label: string }[]> {
  const seen = new Map<string, string>();
  for (const d of mockDocuments) seen.set(documentCategorySlug(d.category), d.category);
  return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
    a.label.localeCompare(b.label, 'id'),
  );
}
