/**
 * Sesi berbasis cookie httpOnly + tabel `sessions`.
 * Cookie menyimpan token acak; database hanya menyimpan SHA-256-nya.
 * SEMUA pemeriksaan akses terjadi di server lewat `requireUser`/`requirePermission`.
 */
import { createHash, randomBytes } from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { and, eq, gt, lt } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { Role } from '@/db/schema';
import { roleCan, type Permission } from './permissions';
import { clientIp, userAgent } from '@/lib/security/request';

const isProd = process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1';
/** Prefix __Host- mengikat cookie ke host ini saja (wajib HTTPS). */
export const SESSION_COOKIE = isProd ? '__Host-rp_session' : 'rp_session';
const SESSION_HOURS = 12;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: Role;
  kwarranId: string | null;
  gudepId: string | null;
  memberId: string | null;
  mustChangePassword: boolean;
}

export async function createSession(userId: string): Promise<void> {
  const db = await getDb();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000);
  await db.insert(schema.sessions).values({
    id: hashToken(token),
    userId,
    expiresAt,
    ip: clientIp(),
    userAgent: userAgent(),
  });
  // Bersihkan sesi kedaluwarsa secara oportunistik.
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)));
  }
  cookies().delete(SESSION_COOKIE);
}

/** Hapus semua sesi milik akun (dipakai saat reset sandi / nonaktifkan akun). */
export async function destroyUserSessions(userId: string): Promise<void> {
  const db = await getDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

/** Pengguna yang sedang masuk, atau null. Di-cache per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      name: schema.users.name,
      role: schema.users.role,
      kwarranId: schema.users.kwarranId,
      gudepId: schema.users.gudepId,
      memberId: schema.users.memberId,
      mustChangePassword: schema.users.mustChangePassword,
      active: schema.users.active,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, hashToken(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.active) return null;
  const { active: _active, ...user } = row;
  return user;
});

/** Wajib masuk. Tanpa sesi → halaman masuk. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/masuk');
  return user;
}

export const can = (user: SessionUser, permission: Permission) => roleCan(user.role, permission);

/** Wajib punya izin. Tanpa izin → 404 (tidak membocorkan keberadaan halaman). */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, permission)) notFound();
  return user;
}
