/**
 * Cakupan organisasi: membatasi BARIS data yang boleh dilihat/diubah, di atas izin peran.
 *   Kwarcab (SUPER_ADMIN, ADMIN_KWARCAB) → seluruh kabupaten
 *   STAFF_KWARRAN → gudep & anggota dalam satu kwarran
 *   STAFF_GUDEP   → satu gudep
 *   lainnya       → tidak ada data organisasi
 * Akun staf tanpa penugasan wilayah/gudep sengaja tidak melihat apa pun (gagal tertutup).
 */
import { eq, sql, type SQL } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { SessionUser } from './session';

const NONE = sql`false`;

export type ScopeLevel = 'KABUPATEN' | 'KWARRAN' | 'GUDEP' | 'NONE';

export function scopeLevel(user: SessionUser): ScopeLevel {
  switch (user.role) {
    case 'SUPER_ADMIN':
    case 'ADMIN_KWARCAB':
      return 'KABUPATEN';
    case 'STAFF_KWARRAN':
      return user.kwarranId ? 'KWARRAN' : 'NONE';
    case 'STAFF_GUDEP':
      return user.gudepId ? 'GUDEP' : 'NONE';
    default:
      return 'NONE';
  }
}

/** Kondisi WHERE untuk tabel `gudep`. `undefined` = tanpa batas. */
export function gudepScope(user: SessionUser): SQL | undefined {
  switch (scopeLevel(user)) {
    case 'KABUPATEN':
      return undefined;
    case 'KWARRAN':
      return eq(schema.gudep.kwarranId, user.kwarranId!);
    case 'GUDEP':
      return eq(schema.gudep.id, user.gudepId!);
    default:
      return NONE;
  }
}

/** Kondisi WHERE untuk `members` yang di-JOIN dengan `gudep`. */
export function memberScope(user: SessionUser): SQL | undefined {
  switch (scopeLevel(user)) {
    case 'KABUPATEN':
      return undefined;
    case 'KWARRAN':
      return eq(schema.gudep.kwarranId, user.kwarranId!);
    case 'GUDEP':
      return eq(schema.members.gudepId, user.gudepId!);
    default:
      return NONE;
  }
}

/** Apakah gudep tertentu berada dalam cakupan pengguna. Wajib dicek sebelum menulis data. */
export async function canAccessGudep(user: SessionUser, gudepId: string): Promise<boolean> {
  const level = scopeLevel(user);
  if (level === 'KABUPATEN') return true;
  if (level === 'GUDEP') return user.gudepId === gudepId;
  if (level === 'KWARRAN') {
    const db = await getDb();
    const [row] = await db
      .select({ kwarranId: schema.gudep.kwarranId })
      .from(schema.gudep)
      .where(eq(schema.gudep.id, gudepId))
      .limit(1);
    return row?.kwarranId === user.kwarranId;
  }
  return false;
}

/** Apakah kwarran tertentu berada dalam cakupan (untuk membuat gudep baru). */
export function canAccessKwarran(user: SessionUser, kwarranId: string): boolean {
  const level = scopeLevel(user);
  return level === 'KABUPATEN' || (level === 'KWARRAN' && user.kwarranId === kwarranId);
}
