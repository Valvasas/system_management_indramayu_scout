import fs from 'node:fs/promises';
import { resolveStoragePath } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = {
  webp: 'image/webp',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/**
 * Menyajikan berkas unggahan publik (foto galeri/berita, dokumen resmi).
 * Hanya ekstensi yang dikenal; nama berkas acak (UUID) sehingga aman di-cache lama.
 */
export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const relative = params.path.join('/');
  const ext = relative.split('.').pop()?.toLowerCase() ?? '';
  const type = TYPES[ext];
  const target = type ? resolveStoragePath(relative) : null;
  if (!target) return new Response('Tidak ditemukan', { status: 404 });

  try {
    const data = await fs.readFile(target);
    const isDocument = !type.startsWith('image/');
    return new Response(data, {
      headers: {
        'Content-Type': type,
        'Content-Length': String(data.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        ...(isDocument && ext !== 'pdf' ? { 'Content-Disposition': 'attachment' } : {}),
      },
    });
  } catch {
    return new Response('Tidak ditemukan', { status: 404 });
  }
}
