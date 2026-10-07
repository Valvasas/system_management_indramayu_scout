/** Utilitas Server Action + formulir: satu bentuk state untuk semua formulir portal. */
import { z } from 'zod';

export type FormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  errors?: Record<string, string>;
};

export const idle: FormState = { status: 'idle' };

export const fail = (message: string, errors?: Record<string, string>): FormState => ({
  status: 'error',
  message,
  errors,
});

export const ok = (message: string): FormState => ({ status: 'success', message });

/** FormData → objek polos (field berulang jadi array). Berkas dibiarkan sebagai File. */
export function formToObject(formData: FormData): Record<string, FormDataEntryValue | FormDataEntryValue[]> {
  const out: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('$ACTION')) continue;
    const prev = out[key];
    out[key] = prev === undefined ? value : Array.isArray(prev) ? [...prev, value] : [prev, value];
  }
  return out;
}

/** Validasi FormData dengan skema Zod. Mengembalikan data atau FormState galat per kolom. */
export function parseForm<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData,
): { data: z.infer<T>; error?: undefined } | { data?: undefined; error: FormState } {
  const result = schema.safeParse(formToObject(formData));
  if (result.success) return { data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '_');
    errors[key] ??= issue.message;
  }
  return { error: fail('Periksa kembali isian yang ditandai.', errors) };
}

/* ---------- Potongan skema yang sering dipakai ---------- */

const trimmed = z.string().transform((s) => s.trim());

/** Teks wajib dengan batas panjang dan pesan berbahasa Indonesia. */
export const requiredText = (label: string, max = 200) =>
  trimmed.pipe(z.string().min(1, `${label} wajib diisi.`).max(max, `${label} maksimal ${max} karakter.`));

/** Teks opsional: string kosong → null. */
export const optionalText = (max = 500) =>
  z
    .union([z.string(), z.undefined()])
    .transform((s) => (s ?? '').trim())
    .pipe(z.string().max(max, `Maksimal ${max} karakter.`))
    .transform((s) => (s === '' ? null : s));

export const checkbox = z
  .union([z.literal('on'), z.literal('true'), z.undefined(), z.string()])
  .transform((v) => v === 'on' || v === 'true');

export const isoDate = (label: string) => trimmed.pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} wajib diisi (tanggal).`));

export const optionalIsoDate = z
  .union([z.string(), z.undefined()])
  .transform((s) => (s ?? '').trim())
  .pipe(z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid.')]))
  .transform((s) => (s === '' ? null : s));

export const phone = z
  .union([z.string(), z.undefined()])
  .transform((s) => (s ?? '').trim())
  .pipe(z.union([z.literal(''), z.string().regex(/^[0-9+()\s.-]{6,20}$/, 'Nomor telepon tidak valid.')]))
  .transform((s) => (s === '' ? null : s));

export const uuid = (label: string) => z.string().uuid(`${label} wajib dipilih.`);

export const optionalCoordinate = z
  .union([z.string(), z.undefined()])
  .transform((s) => (s ?? '').trim().replace(',', '.'))
  .pipe(z.union([z.literal(''), z.string().regex(/^-?\d{1,3}(\.\d+)?$/, 'Koordinat tidak valid.')]))
  .transform((s) => (s === '' ? null : Number(s)));
