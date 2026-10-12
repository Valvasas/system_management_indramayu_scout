/**
 * Kembaran SQL dari `isCurrentTerm()` (dates.ts) untuk tabel bermasa jabatan
 * (`board_members`, `staff_assignments`). Satu definisi "sedang menjabat" untuk situs publik,
 * CMS, dan pengingat.
 */
import { and, eq, gte, isNull, lte, or, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

export interface TermColumns {
  isActive: PgColumn;
  termStart: PgColumn;
  termEnd: PgColumn;
}

/** Aktif DAN (berakhir kosong ATAU ≥ hari ini) DAN (mulai kosong ATAU ≤ hari ini). `today` = tanggal WIB. */
export function currentTermWhere(t: TermColumns, today: string): SQL {
  return and(eq(t.isActive, true), or(isNull(t.termEnd), gte(t.termEnd, today)), or(isNull(t.termStart), lte(t.termStart, today)))!;
}

/** Masih aktif dan berakhir dalam rentang [today, until] (untuk pengingat). */
export function endingBetweenWhere(t: TermColumns, today: string, until: string): SQL {
  return and(eq(t.isActive, true), gte(t.termEnd, today), lte(t.termEnd, until))!;
}
