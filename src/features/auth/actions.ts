'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { burnPasswordCheck, hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession, destroyUserSessions, requireUser } from '@/lib/auth/session';
import { fail, parseForm, type FormState } from '@/lib/forms';
import { requiresMfa } from '@/lib/auth/mfa-policy';
import { getMfaRecord } from './mfa';
import { clientIp } from '@/lib/security/request';
import { createRateLimiter } from '@/lib/security/rate-limit';

// Bersama antar-instance (tabel rate_limits). Fail-closed: DB bermasalah → tolak percobaan masuk.
const perIp = createRateLimiter(30, 15 * 60_000, { scope: 'login-ip', failClosed: true });
const perAccount = createRateLimiter(6, 15 * 60_000, { scope: 'login-akun', failClosed: true });

const LoginSchema = z.object({
  username: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().min(1, 'Nama pengguna wajib diisi.').max(80)),
  password: z.string().min(1, 'Kata sandi wajib diisi.').max(128),
});

const GENERIC = 'Nama pengguna atau kata sandi salah.';

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(LoginSchema, formData);
  if (parsed.error) return parsed.error;
  const { username, password } = parsed.data;

  const ip = clientIp();
  if ((await perIp.limited(ip)) || (await perAccount.limited(username))) {
    return fail('Terlalu banyak percobaan masuk. Tunggu 15 menit, lalu coba lagi.');
  }

  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);

  if (!user || !user.active) {
    await burnPasswordCheck(password);
    await audit(null, { action: 'auth.login_failed', summary: `Gagal masuk sebagai "${username}"` });
    return fail(user && !user.active ? 'Akun ini dinonaktifkan. Hubungi pengurus Kwarcab.' : GENERIC);
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    await audit(null, { action: 'auth.login_failed', summary: `Sandi salah untuk "${username}"`, entityType: 'user', entityId: user.id });
    return fail(GENERIC);
  }

  await perAccount.reset(username);

  // Faktor kedua: sandi benar saja belum memberi akses portal.
  const mfa = await getMfaRecord(user.id, db);
  if (mfa?.confirmedAt) {
    await createSession(user.id, { mfaPending: true });
    await audit(user, { action: 'auth.password_ok', summary: 'Sandi benar, menunggu kode MFA', entityType: 'user', entityId: user.id });
    redirect('/masuk/verifikasi');
  }

  await createSession(user.id);
  await db
    .update(schema.users)
    .set({
      lastLoginAt: new Date(),
      // Masa tenggang MFA dimulai saat pertama kali masuk sejak MFA diwajibkan untuk perannya.
      ...(requiresMfa(user.role) && !user.mfaGraceStartedAt ? { mfaGraceStartedAt: new Date() } : {}),
    })
    .where(eq(schema.users.id, user.id));
  await audit(user, { action: 'auth.login', summary: 'Masuk ke portal', entityType: 'user', entityId: user.id });

  redirect(user.mustChangePassword ? '/dashboard/akun' : '/dashboard');
}

export async function logoutAction(): Promise<void> {
  const user = await requireUser({ allowMfaSetup: true });
  await audit(user, { action: 'auth.logout', summary: 'Keluar dari portal', entityType: 'user', entityId: user.id });
  await destroySession();
  redirect('/masuk');
}

const ChangePasswordSchema = z
  .object({
    current: z.string().min(1, 'Kata sandi saat ini wajib diisi.'),
    next: z.string().max(128),
    confirm: z.string(),
  })
  .superRefine((v, ctx) => {
    const problem = passwordProblem(v.next);
    if (problem) ctx.addIssue({ code: 'custom', path: ['next'], message: problem });
    if (v.next !== v.confirm) ctx.addIssue({ code: 'custom', path: ['confirm'], message: 'Konfirmasi tidak sama.' });
    if (v.next === v.current) ctx.addIssue({ code: 'custom', path: ['next'], message: 'Gunakan sandi yang berbeda dari sandi lama.' });
  });

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseForm(ChangePasswordSchema, formData);
  if (parsed.error) return parsed.error;

  const db = await getDb();
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(parsed.data.current, row.passwordHash))) {
    return fail('Periksa kembali isian yang ditandai.', { current: 'Kata sandi saat ini salah.' });
  }

  await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(parsed.data.next), mustChangePassword: false })
    .where(eq(schema.users.id, user.id));
  // Keluarkan semua perangkat lain, lalu buat sesi baru untuk perangkat ini.
  await destroyUserSessions(user.id);
  await createSession(user.id);
  await audit(user, { action: 'auth.password_changed', summary: 'Mengganti kata sandi', entityType: 'user', entityId: user.id });
  redirect('/dashboard?sandi=diganti');
}
