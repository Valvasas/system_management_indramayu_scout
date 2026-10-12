/** Label & konstanta SKU/SKK (2.3). Murni — aman diimpor komponen klien (tanpa impor nilai dari skema DB). */
import type { CompetencyKind } from '@/db/schema';

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

export const VERIFICATION_NOTE_MAX = 300;
export const REQUIREMENT_CODE_MAX = 40;
export const REQUIREMENT_TITLE_MAX = 300;
export const REQUIREMENT_DESCRIPTION_MAX = 2000;
export const REQUIREMENT_LEVEL_MAX = 60;
