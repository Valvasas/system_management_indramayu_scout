/**
 * SERVER-ONLY. Penyimpanan berkas unggahan (foto & dokumen) di `STORAGE_DIR`.
 * Berkas disajikan lewat rute `/media/...` (src/app/media/[...path]/route.ts).
 *
 * Produksi: arahkan STORAGE_DIR ke volume persisten dan sertakan dalam backup.
 */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { serverEnv } from '@/lib/env';

export const STORAGE_DIR = path.resolve(serverEnv().STORAGE_DIR ?? path.join(process.cwd(), 'storage'));
export const MEDIA_PREFIX = '/media/';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2000;

export class UploadError extends Error {}

type Folder = 'foto' | 'berita' | 'situs' | 'dokumen';

const startsWith = (buf: Buffer, bytes: number[], offset = 0) => bytes.every((b, i) => buf[offset + i] === b);

function sniffImage(buf: Buffer): boolean {
  return (
    startsWith(buf, [0xff, 0xd8, 0xff]) || // JPEG
    startsWith(buf, [0x89, 0x50, 0x4e, 0x47]) || // PNG
    (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) // WEBP
  );
}

/** Path aman di dalam STORAGE_DIR, atau null bila mencoba keluar folder. */
export function resolveStoragePath(relative: string): string | null {
  const target = path.resolve(STORAGE_DIR, relative);
  return target.startsWith(STORAGE_DIR + path.sep) ? target : null;
}

export function isFile(value: FormDataEntryValue | null): value is File {
  return typeof value === 'object' && value !== null && 'arrayBuffer' in value && value.size > 0;
}

/**
 * Simpan foto: validasi isi berkas, putar sesuai EXIF, kecilkan ke ≤2000px,
 * konversi ke WebP. Konversi ini sekaligus MEMBUANG seluruh metadata EXIF
 * termasuk koordinat GPS — penting untuk foto kegiatan anak.
 */
export async function saveImage(file: File, folder: Exclude<Folder, 'dokumen'>) {
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError('Ukuran foto maksimal 10 MB.');
  const input = Buffer.from(await file.arrayBuffer());
  if (!sniffImage(input)) throw new UploadError('Format foto harus JPG, PNG, atau WEBP.');

  const sharp = (await import('sharp')).default;
  const { data, info } = await sharp(input, { failOn: 'error' })
    .rotate()
    .resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const name = `${randomUUID()}.webp`;
  await fs.mkdir(path.join(STORAGE_DIR, folder), { recursive: true });
  await fs.writeFile(path.join(STORAGE_DIR, folder, name), data);
  return { url: `${MEDIA_PREFIX}${folder}/${name}`, width: info.width, height: info.height };
}

const DOCUMENT_TYPES: Record<string, { label: string; magic: number[] }> = {
  pdf: { label: 'PDF', magic: [0x25, 0x50, 0x44, 0x46] },
  docx: { label: 'DOCX', magic: [0x50, 0x4b, 0x03, 0x04] },
  xlsx: { label: 'XLSX', magic: [0x50, 0x4b, 0x03, 0x04] },
  pptx: { label: 'PPTX', magic: [0x50, 0x4b, 0x03, 0x04] },
};

export async function saveDocument(file: File) {
  if (file.size > MAX_DOCUMENT_BYTES) throw new UploadError('Ukuran dokumen maksimal 15 MB.');
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const kind = DOCUMENT_TYPES[ext];
  if (!kind) throw new UploadError('Format dokumen harus PDF, DOCX, XLSX, atau PPTX.');
  const buf = Buffer.from(await file.arrayBuffer());
  if (!startsWith(buf, kind.magic)) throw new UploadError('Isi berkas tidak sesuai dengan formatnya.');

  const name = `${randomUUID()}.${ext}`;
  await fs.mkdir(path.join(STORAGE_DIR, 'dokumen'), { recursive: true });
  await fs.writeFile(path.join(STORAGE_DIR, 'dokumen', name), buf);
  return { url: `${MEDIA_PREFIX}dokumen/${name}`, size: buf.length, type: kind.label };
}

/** Hapus berkas unggahan. Diam bila bukan berkas /media atau sudah tidak ada. */
export async function deleteMedia(url: string | null | undefined): Promise<void> {
  if (!url?.startsWith(MEDIA_PREFIX)) return;
  const target = resolveStoragePath(url.slice(MEDIA_PREFIX.length));
  if (target) await fs.rm(target, { force: true });
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
