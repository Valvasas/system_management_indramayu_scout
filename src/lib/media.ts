import fs from 'node:fs';
import path from 'node:path';
import { MEDIA_PREFIX, resolveStoragePath } from './storage';

/**
 * SERVER-ONLY. Jangan impor dari komponen `'use client'`.
 *
 * Komponen media menanyakan dulu apakah asetnya benar-benar ada, lalu memilih
 * gambar nyata atau empty state yang menjelaskan (TASKS.md P2-5).
 * - `/media/...`  → berkas unggahan di STORAGE_DIR (tidak di-cache negatif: bisa diunggah kapan saja)
 * - path lain     → berkas statis di `public/`
 */
const cache = new Map<string, boolean>();

export function assetExists(src?: string | null): boolean {
  if (!src || !src.startsWith('/')) return false;
  const clean = src.split('?')[0];

  if (clean.startsWith(MEDIA_PREFIX)) {
    const target = resolveStoragePath(clean.slice(MEDIA_PREFIX.length));
    return target !== null && fs.existsSync(target);
  }

  const cached = cache.get(clean);
  if (cached !== undefined) return cached;
  // Tolak traversal: berkas harus berada di dalam public/.
  const publicDir = path.join(process.cwd(), 'public');
  const target = path.join(publicDir, clean);
  const exists = target.startsWith(publicDir) && fs.existsSync(target);
  cache.set(clean, exists);
  return exists;
}
