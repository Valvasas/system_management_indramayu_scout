import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { getDb } from '@/db';
import { slugify } from '@/lib/domain';
import { UploadError, deleteMedia, isFile, saveImage } from '@/lib/storage';

/** Slug unik di tabel tertentu: "judul", "judul-2", "judul-3", … */
export async function uniqueSlug(table: PgTable, slugColumn: PgColumn, idColumn: PgColumn, title: string, excludeId?: string | null) {
  const db = await getDb();
  const base = slugify(title) || 'konten';
  for (let i = 1; i < 500; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const [row] = (await db.select({ id: idColumn }).from(table).where(eq(slugColumn, candidate)).limit(1)) as { id: string }[];
    if (!row || row.id === excludeId) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** "2026-10-17T08:00" (input datetime-local, WIB) → Date. */
export function parseLocalDateTime(value: string): Date | null {
  const m = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
  if (!m) return null;
  const d = new Date(`${m[1]}T${m[2]}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → nilai input datetime-local dalam WIB. */
export function toLocalDateTime(d: Date | null | undefined): string {
  if (!d) return '';
  const wib = new Date(d.getTime() + 7 * 3600_000);
  return wib.toISOString().slice(0, 16);
}

/**
 * Konten publik (berita, agenda, galeri, dokumen, pengurus, prestasi) dibaca dari basis data,
 * tetapi sebagian halamannya dibuat statis saat build. Setiap perubahan lewat CMS harus
 * membuang cache itu, kalau tidak pengunjung masih melihat versi lama (atau 404 untuk
 * konten yang baru terbit) sampai situs di-build ulang.
 */
export function revalidatePublicSite(): void {
  revalidatePath('/', 'layout');
}

/**
 * Proses sampul berita dari formulir: unggah baru, hapus, atau pertahankan yang lama.
 * Mengembalikan URL sampul akhir, atau pesan galat unggah untuk ditampilkan di kolom `cover`.
 */
export async function resolveCover(formData: FormData, current: string | null, remove: boolean): Promise<{ url: string | null } | { error: string }> {
  const file = formData.get('cover');
  try {
    if (isFile(file)) {
      const saved = await saveImage(file, 'berita');
      await deleteMedia(current);
      return { url: saved.url };
    }
    if (remove) {
      await deleteMedia(current);
      return { url: null };
    }
    return { url: current };
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
}
