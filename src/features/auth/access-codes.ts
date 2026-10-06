/**
 * SERVER-ONLY helper kode akses & permintaan reset. Sengaja BUKAN file 'use server':
 * fungsi di sini dipanggil oleh Server Action lain yang sudah memeriksa izin, dan tidak
 * boleh terekspos sebagai endpoint yang bisa dipanggil langsung dari browser.
 */
import { randomBytes } from 'node:crypto';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { UserRow } from '@/db/schema';
import { ACCESS_CODE_TTL_HOURS, generateAccessCode, hashAccessCode } from '@/lib/auth/access-code';
import { audit } from '@/lib/auth/audit';
import { hashPassword } from '@/lib/auth/password';
import { canAccessGudep } from '@/lib/auth/scope';
import { can, type SessionUser } from '@/lib/auth/session';

export type AccessPurpose = keyof typeof ACCESS_CODE_TTL_HOURS;

/** Hash sandi acak yang tidak diketahui siapa pun: akun baru tidak bisa dimasuki sebelum diaktivasi. */
export async function unusablePasswordHash(): Promise<string> {
  return hashPassword(randomBytes(32).toString('base64url'));
}

/**
 * Apakah `actor` berwenang mengelola akses akun `target`:
 * - akun PESERTA → staf dengan izin akun peserta, dan anggota berada dalam cakupannya;
 * - akun staf/admin → `users.manage`; akun Super Admin hanya oleh Super Admin.
 */
export async function canManageAccess(actor: SessionUser, target: Pick<UserRow, 'id' | 'role' | 'memberId' | 'gudepId'>): Promise<boolean> {
  if (target.id === actor.id) return false;
  if (target.role === 'PESERTA') {
    if (!can(actor, 'users.create_peserta') && !can(actor, 'users.manage')) return false;
    let gudepId = target.gudepId;
    if (target.memberId) {
      const db = await getDb();
      const [m] = await db
        .select({ gudepId: schema.members.gudepId })
        .from(schema.members)
        .where(eq(schema.members.id, target.memberId))
        .limit(1);
      gudepId = m?.gudepId ?? gudepId;
    }
    return gudepId ? canAccessGudep(actor, gudepId) : can(actor, 'users.manage');
  }
  if (!can(actor, 'users.manage')) return false;
  return target.role !== 'SUPER_ADMIN' || actor.role === 'SUPER_ADMIN';
}

/**
 * Terbitkan kode baru untuk satu akun. Kode lama yang belum terpakai langsung dibatalkan
 * (hanya satu kode berlaku), permintaan reset yang terbuka ditandai selesai, dan tercatat di log.
 * PEMANGGIL WAJIB sudah memeriksa `canManageAccess`.
 */
export async function issueAccessCode(actor: SessionUser, target: Pick<UserRow, 'id' | 'username'>, purpose: AccessPurpose) {
  const db = await getDb();
  const code = generateAccessCode();
  const expiresAt = new Date(Date.now() + ACCESS_CODE_TTL_HOURS[purpose] * 3600_000);
  await db
    .update(schema.accessCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.accessCodes.userId, target.id), isNull(schema.accessCodes.usedAt)));
  await db
    .insert(schema.accessCodes)
    .values({ userId: target.id, codeHash: hashAccessCode(code), purpose, expiresAt, createdById: actor.id });
  await db
    .update(schema.passwordResetRequests)
    .set({ status: 'RESOLVED', resolvedAt: new Date(), resolvedById: actor.id })
    .where(and(eq(schema.passwordResetRequests.userId, target.id), eq(schema.passwordResetRequests.status, 'OPEN')));
  await audit(actor, {
    action: purpose === 'ACTIVATION' ? 'user.activation_code' : 'user.reset_code',
    summary: `Menerbitkan kode ${purpose === 'ACTIVATION' ? 'aktivasi' : 'reset sandi'} untuk akun ${target.username}`,
    entityType: 'user',
    entityId: target.id,
  });
  return { code, expiresAt };
}

/** Pesan seragam untuk staf: kode tampil sekali, dengan petunjuk penyerahan yang aman. */
export function accessCodeMessage(username: string, code: string, expiresAt: Date, purpose: AccessPurpose): string {
  const until = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(expiresAt);
  return [
    purpose === 'ACTIVATION' ? 'Akun siap diaktifkan.' : 'Kode reset dibuat.',
    'Serahkan langsung kepada pemilik akun (atau orang tua/wali). Kode hanya tampil sekali ini.',
    `Nama pengguna: ${username}`,
    `Kode akses: ${code}`,
    `Berlaku sampai: ${until} WIB`,
    'Pemilik akun membuka halaman Masuk → "Punya kode akses?" lalu membuat kata sandinya sendiri.',
  ].join('\n');
}

export interface ResetRequestRow {
  id: string;
  createdAt: Date;
  note: string | null;
  userId: string;
  username: string;
  name: string;
  role: UserRow['role'];
  gudepName: string | null;
}

/** Permintaan reset terbuka yang boleh ditangani `actor` (difilter per cakupan). */
export async function openResetRequestsFor(actor: SessionUser): Promise<ResetRequestRow[]> {
  if (!can(actor, 'users.create_peserta') && !can(actor, 'users.manage')) return [];
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.passwordResetRequests.id,
      createdAt: schema.passwordResetRequests.createdAt,
      note: schema.passwordResetRequests.note,
      user: schema.users,
      gudepName: schema.gudep.name,
    })
    .from(schema.passwordResetRequests)
    .innerJoin(schema.users, eq(schema.users.id, schema.passwordResetRequests.userId))
    .leftJoin(schema.gudep, eq(schema.gudep.id, schema.users.gudepId))
    .where(eq(schema.passwordResetRequests.status, 'OPEN'))
    .orderBy(desc(schema.passwordResetRequests.createdAt))
    .limit(200);
  const out: ResetRequestRow[] = [];
  for (const r of rows) {
    if (await canManageAccess(actor, r.user)) {
      out.push({
        id: r.id,
        createdAt: r.createdAt,
        note: r.note,
        userId: r.user.id,
        username: r.user.username,
        name: r.user.name,
        role: r.user.role,
        gudepName: r.gudepName,
      });
    }
  }
  return out;
}

export async function countOpenResetRequests(actor: SessionUser): Promise<number> {
  return (await openResetRequestsFor(actor)).length;
}

/** Status kode akses terakhir sebuah akun (untuk ditampilkan ke staf, tanpa kodenya). */
export async function latestAccessCode(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, { purpose: AccessPurpose; expiresAt: Date; usedAt: Date | null }>();
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.accessCodes)
    .where(inArray(schema.accessCodes.userId, userIds))
    .orderBy(desc(schema.accessCodes.createdAt));
  const map = new Map<string, { purpose: AccessPurpose; expiresAt: Date; usedAt: Date | null }>();
  for (const r of rows) if (!map.has(r.userId)) map.set(r.userId, { purpose: r.purpose, expiresAt: r.expiresAt, usedAt: r.usedAt });
  return map;
}
