/**
 * Skema Zod & label SKU/SKK (2.3). Dipakai Server Action (validasi server) dan tes.
 * Teks syarat resmi diketik apa adanya dari dokumen Kwarnas oleh pengelola; aplikasi tidak
 * pernah mengarang atau memparafrasekan isi SKU/SKK, Tri Satya, maupun Dasa Darma.
 */
import { z } from 'zod';
import { competencyKindEnum, golonganEnum, type CompetencyKind } from '@/db/schema';
import { optionalText, requiredText } from '@/lib/forms';

export const COMPETENCY_KINDS = competencyKindEnum.enumValues;

export const KIND_LABELS: Record<CompetencyKind, string> = {
  SKU: 'SKU',
  SKK: 'SKK',
};

export const KIND_LONG_LABELS: Record<CompetencyKind, string> = {
  SKU: 'Syarat Kecakapan Umum (SKU)',
  SKK: 'Syarat Kecakapan Khusus (SKK)',
};

export const REQUIREMENT_STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
  { value: 'semua', label: 'Semua status' },
] as const;
export type RequirementStatusFilter = (typeof REQUIREMENT_STATUS_OPTIONS)[number]['value'];

/** Kode syarat: huruf besar, angka, titik, tanda hubung. Disimpan huruf besar agar unik tanpa beda kapital. */
const code = z
  .union([z.string(), z.undefined()])
  .transform((s) => (s ?? '').trim().toUpperCase())
  .pipe(
    z
      .string()
      .min(2, 'Kode wajib diisi (minimal 2 karakter).')
      .max(40, 'Kode maksimal 40 karakter.')
      .regex(/^[A-Z0-9][A-Z0-9.-]*$/, 'Kode hanya boleh huruf, angka, titik, dan tanda hubung (tanpa spasi).'),
  );

export const RequirementSchema = z.object({
  kind: z.enum(COMPETENCY_KINDS, { errorMap: () => ({ message: 'Pilih jenis syarat.' }) }),
  golongan: z.enum(golonganEnum.enumValues, { errorMap: () => ({ message: 'Pilih golongan.' }) }),
  level: requiredText('Tingkatan', 60),
  code,
  title: requiredText('Judul syarat', 300),
  description: optionalText(2000),
  sortOrder: z.coerce
    .number({ invalid_type_error: 'Urutan harus angka.' })
    .int('Urutan harus bilangan bulat.')
    .min(0, 'Urutan minimal 0.')
    .max(9999, 'Urutan maksimal 9999.'),
});
export type RequirementInput = z.infer<typeof RequirementSchema>;

/** Catatan verifikasi/pembatalan: opsional, pendek, tanpa data pribadi (dijelaskan di formulir). */
export const NoteSchema = z.object({ note: optionalText(300) });

export const isUuid = (v: string | null | undefined): v is string =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
