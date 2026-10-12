/**
 * Skema Zod masa jabatan (2.4). Dipakai Server Action DAN tes, jadi berada di modul biasa
 * (berkas 'use server' hanya boleh mengekspor fungsi async).
 */
import { z } from 'zod';
import { roleEnum, type Role } from '@/db/schema';
import { checkbox, requiredText } from '@/lib/forms';

/** Benar-benar tanggal kalender (JS menggulirkan 2026-02-31 menjadi 3 Maret; PostgreSQL menolaknya). */
const isCalendarDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  const year = Number(s.slice(0, 4));
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s && year >= 1961 && year <= 2100;
};

const trimmedInput = z.union([z.string(), z.undefined()]).transform((s) => (s ?? '').trim());

/** Tanggal opsional (kosong → null). */
export const termDate = trimmedInput
  .refine((s) => s === '' || isCalendarDate(s), 'Tanggal tidak valid.')
  .transform((s) => (s === '' ? null : s));

/** Tanggal wajib. */
export const requiredTermDate = (label: string) =>
  trimmedInput.refine((s) => s !== '', `${label} wajib diisi.`).refine((s) => s === '' || isCalendarDate(s), 'Tanggal tidak valid.');

/** Aturan bersama: tanggal berakhir tidak boleh sebelum tanggal mulai (boleh sama: jabatan satu hari). */
function endNotBeforeStart(v: { termStart: string | null; termEnd: string | null }, ctx: z.RefinementCtx) {
  if (v.termStart && v.termEnd && v.termEnd < v.termStart) {
    ctx.addIssue({ code: 'custom', path: ['termEnd'], message: 'Tanggal berakhir tidak boleh sebelum tanggal mulai.' });
  }
}

/** Id baris dari URL/argumen Server Action (bisa dimanipulasi klien). */
export const RowId = z.string().uuid();
export const isRowId = (v: unknown): v is string => RowId.safeParse(v).success;

/* ---------------- Pengurus Kwarcab ---------------- */

export const BoardMemberSchema = z
  .object({
    name: requiredText('Nama', 150),
    position: requiredText('Jabatan', 150),
    department: requiredText('Bidang', 100),
    period: requiredText('Masa bakti', 30),
    sortOrder: z.coerce.number({ invalid_type_error: 'Urutan harus angka.' }).int().min(0).max(999),
    termStart: termDate,
    termEnd: termDate,
    isActive: checkbox,
  })
  .superRefine(endNotBeforeStart);

export type BoardMemberInput = z.infer<typeof BoardMemberSchema>;

/* ---------------- Penugasan staf ---------------- */

/** Peran yang bisa dicatat sebagai penugasan (penugasan = riwayat staf, bukan akun peserta). */
export const ASSIGNMENT_ROLES = roleEnum.enumValues.filter((r): r is Exclude<Role, 'PESERTA'> => r !== 'PESERTA');

const optionalId = trimmedInput
  .refine((s) => s === '' || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s), 'Pilihan tidak valid.')
  .transform((s) => (s === '' ? null : s));

/**
 * Nama kolom formulir penugasan. Halaman /dashboard/pengguna/[id] juga memuat formulir akun
 * (`role`, `kwarranId`, `gudepId`), dan id elemen formulir diturunkan dari nama kolom, jadi
 * kolom penugasan diberi awalan agar id tidak ganda (WCAG 4.1.1/label).
 */
export const ASSIGNMENT_FIELDS = {
  position: 'assignmentPosition',
  role: 'assignmentRole',
  kwarranId: 'assignmentKwarranId',
  gudepId: 'assignmentGudepId',
  termStart: 'assignmentStart',
  termEnd: 'assignmentEnd',
} as const;

const F = ASSIGNMENT_FIELDS;

export const AssignmentSchema = z
  .object({
    [F.position]: requiredText('Jabatan', 150),
    [F.role]: z.enum(ASSIGNMENT_ROLES as [Exclude<Role, 'PESERTA'>, ...Exclude<Role, 'PESERTA'>[]], {
      errorMap: () => ({ message: 'Peran wajib dipilih.' }),
    }),
    [F.kwarranId]: optionalId,
    [F.gudepId]: optionalId,
    [F.termStart]: requiredTermDate('Tanggal mulai'),
    [F.termEnd]: termDate,
  })
  .transform((v) => ({
    position: v[F.position],
    role: v[F.role],
    kwarranId: v[F.kwarranId],
    gudepId: v[F.gudepId],
    termStart: v[F.termStart],
    termEnd: v[F.termEnd],
  }))
  .superRefine((v, ctx) => {
    if (v.termEnd && v.termEnd < v.termStart) {
      ctx.addIssue({ code: 'custom', path: [F.termEnd], message: 'Tanggal berakhir tidak boleh sebelum tanggal mulai.' });
    }
    if (v.role === 'STAFF_KWARRAN' && !v.kwarranId)
      ctx.addIssue({ code: 'custom', path: [F.kwarranId], message: 'Pilih kwarran penugasan.' });
    if (v.role === 'STAFF_GUDEP' && !v.gudepId) ctx.addIssue({ code: 'custom', path: [F.gudepId], message: 'Pilih gudep penugasan.' });
  });

export type AssignmentInput = z.infer<typeof AssignmentSchema>;
