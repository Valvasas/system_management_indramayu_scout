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
import { MFA_PENDING_MINUTES, mfaState, type MfaState } from './mfa-policy';
import { clientIp, userAgent } from '@/lib/security/request';
import { serverEnv } from '@/lib/env';

const isProd = serverEnv().secureCookies;
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
  /** Status MFA akun (lihat mfa-policy.ts). */
  mfa: MfaState;
}

/** Halaman pendaftaran MFA — satu-satunya halaman portal yang terbuka saat tenggang MFA habis. */
export const MFA_SETUP_PATH = '/dashboard/akun/mfa';

/**
 * Buat sesi baru (token dirotasi setiap kali). `mfaPending` = sandi benar tetapi faktor kedua
 * belum diverifikasi: sesi itu tidak memberi akses portal dan kedaluwarsa dalam 10 menit.
 */
export async function createSession(userId: string, opts: { mfaPending?: boolean } = {}): Promise<void> {
  const db = await getDb();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + (opts.mfaPending ? MFA_PENDING_MINUTES * 60_000 : SESSION_HOURS * 3600_000));
  await db.insert(schema.sessions).values({
    id: hashToken(token),
    userId,
    expiresAt,
    ip: clientIp(),
    userAgent: userAgent(),
    mfaPending: opts.mfaPending ?? false,
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

async function sessionRow(pending: boolean) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      sessionId: schema.sessions.id,
      id: schema.users.id,
      username: schema.users.username,
      name: schema.users.name,
      role: schema.users.role,
      kwarranId: schema.users.kwarranId,
      gudepId: schema.users.gudepId,
      memberId: schema.users.memberId,
      mustChangePassword: schema.users.mustChangePassword,
      active: schema.users.active,
      mfaGraceStartedAt: schema.users.mfaGraceStartedAt,
      mfaConfirmedAt: schema.userMfa.confirmedAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .leftJoin(schema.userMfa, eq(schema.userMfa.userId, schema.users.id))
    .where(
      and(eq(schema.sessions.id, hashToken(token)), gt(schema.sessions.expiresAt, new Date()), eq(schema.sessions.mfaPending, pending)),
    )
    .limit(1);
  if (!row || !row.active) return null;
  return row;
}

/** Pengguna yang sedang masuk (sesi penuh), atau null. Di-cache per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const row = await sessionRow(false);
  if (!row) return null;
  const { sessionId: _s, active: _a, mfaGraceStartedAt, mfaConfirmedAt, ...user } = row;
  const mfa = mfaState({
    role: user.role,
    enrolled: mfaConfirmedAt !== null,
    graceStartedAt: mfaGraceStartedAt,
    graceDays: serverEnv().MFA_GRACE_DAYS,
    now: new Date(),
  });
  return { ...user, mfa };
});

/** Akun yang sandinya benar tetapi belum memasukkan kode MFA (halaman /masuk/verifikasi). */
export const getPendingMfaUser = cache(async () => {
  const row = await sessionRow(true);
  return row ? { id: row.id, username: row.username, name: row.name, role: row.role } : null;
});

/**
 * Wajib masuk. Tanpa sesi → halaman masuk.
 * Peran yang wajib MFA dan masa tenggangnya habis SELALU dialihkan ke halaman pendaftaran MFA,
 * kecuali pemanggil yang memang bagian dari pendaftaran/keluar (`allowMfaSetup`).
 * Keputusan ini sengaja TIDAK memakai header permintaan (mis. x-pathname): header bisa dikirim
 * klien sendiri pada rute yang tidak dilewati middleware.
 */
export async function requireUser(opts: { allowMfaSetup?: boolean } = {}): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/masuk');
  if (user.mfa.kind === 'expired' && !opts.allowMfaSetup) redirect(`${MFA_SETUP_PATH}?wajib=1`);
  return user;
}

/**
 * Untuk route handler (ekspor/unduhan) yang menjawab dengan status HTTP, bukan redirect:
 * null bila tidak masuk, masa tenggang MFA habis, atau tidak punya izin.
 */
export async function authorizedUser(permission?: Permission): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.mfa.kind === 'expired') return null;
  if (permission && !roleCan(user.role, permission)) return null;
  return user;
}

export const can = (user: SessionUser, permission: Permission) => roleCan(user.role, permission);

/** Wajib punya izin. Tanpa izin → 404 (tidak membocorkan keberadaan halaman). */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, permission)) notFound();
  return user;
}
