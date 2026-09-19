import fs from 'node:fs';
import path from 'node:path';

/**
 * SERVER-ONLY. Jangan impor dari komponen `'use client'`.
 *
 * Data konten menyebut berkas gambar yang sebagian belum diunggah. Daripada
 * merender <img> rusak (404) atau kotak abu bisu, komponen media menanyakan
 * dulu apakah asetnya benar-benar ada, lalu memilih gambar nyata atau
 * empty state yang menjelaskan (TASKS.md P2-5).
 *
 * Begitu tim mengunggah foto ke `public/`, gambar muncul tanpa perubahan kode.
 */
const cache = new Map<string, boolean>();

export function assetExists(src?: string | null): boolean {
  if (!src || !src.startsWith('/')) return false;
  const cached = cache.get(src);
  if (cached !== undefined) return cached;

  const clean = src.split('?')[0];
  // Tolak traversal: berkas harus berada di dalam public/.
  const publicDir = path.join(process.cwd(), 'public');
  const target = path.join(publicDir, clean);
  const exists = target.startsWith(publicDir) && fs.existsSync(target);

  cache.set(src, exists);
  return exists;
}
