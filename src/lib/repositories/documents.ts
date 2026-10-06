import { desc, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { DocumentItem } from '@/types';
import { formatBytes } from '@/lib/storage';

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

export const documentCategorySlug = (category: string) =>
  category
    .toLowerCase()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function publishedDocuments(): Promise<DocumentEntry[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.documents).where(eq(schema.documents.published, true)).orderBy(desc(schema.documents.date));
  return rows.map((d) => {
    const url = d.fileUrl ?? '';
    return {
      id: d.id,
      title: d.title,
      category: d.category,
      type: d.fileType,
      size: formatBytes(d.fileSize),
      date: d.date,
      url,
      description: d.description ?? undefined,
      available: isSafeDocumentUrl(url),
      isExternal: /^https?:\/\//i.test(url),
    };
  });
}

export interface DocumentQuery {
  category?: string;
  search?: string;
  limit?: number;
}

export async function getDocuments({ category, search, limit }: DocumentQuery = {}): Promise<DocumentEntry[]> {
  let items = await publishedDocuments();
  if (category) items = items.filter((d) => documentCategorySlug(d.category) === category);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter((d) => d.title.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q));
  }
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}

export async function getDocumentCategories(): Promise<{ value: string; label: string }[]> {
  const seen = new Map<string, string>();
  for (const d of await publishedDocuments()) seen.set(documentCategorySlug(d.category), d.category);
  return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'id'));
}
