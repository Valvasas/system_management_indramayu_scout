'use server';

import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { audit } from '@/lib/auth/audit';
import { canResetMfa, requiresMfa } from '@/lib/auth/mfa-policy';
import {
  createSession,
  destroySession,
  destroyUserSessions,
  getPendingMfaUser,
  MFA_SETUP_PATH,
  requirePermission,
  requireUser,
} from '@/lib/auth/session';
import { fail, parseForm, type FormState } from '@/lib/forms';
import { clientIp } from '@/lib/security/request';
import { createRateLimiter } from '@/lib/security/rate-limit';
import {
  confirmEnrollment,
  guardedSecondFactor,
  MFA_LIMITS,
  regenerateRecoveryCodes,
  removeMfa,
  startEnrollment,
  verifySecondFactor,
} from './mfa';

/** State formulir yang membawa kode pemulihan untuk ditampilkan SEKALI (tidak lewat URL/log). */
export type MfaCodesState = FormState & { codes?: string[] };

// Ruang kode TOTP hanya 10^6: batasi ketat per akun + per IP, fail-closed bila DB gagal.
const verifyPerAccount = createRateLimiter(MFA_LIMITS.perAccount.max, MFA_LIMITS.perAccount.windowMs, {
  scope: 'mfa-akun',
  failClosed: true,
});
const verifyPerIp = createRateLimiter(MFA_LIMITS.perIp.max, MFA_LIMITS.perIp.windowMs, { scope: 'mfa-ip', failClosed: true });

const CodeSchema = z.object({ code: z.string().trim().min(1, 'Masukkan kode.').max(20, 'Kode terlalu panjang.') });
const TOO_MANY = 'Terlalu banyak percobaan kode. Tunggu 15 menit, lalu coba lagi.';
const WRONG = 'Kode tidak cocok atau sudah pernah dipakai. Periksa jam ponsel Anda dan masukkan kode terbaru.';

async function limited(userId: string): Promise<boolean> {
  return (await verifyPerIp.limited(clientIp())) || (await verifyPerAccount.limited(userId));
}

/* ------------------------------------------------------------------ */
/* Masuk: faktor kedua                                                  */
/* ------------------------------------------------------------------ */

export async function verifyMfaLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const pending = await getPendingMfaUser();
  if (!pending) redirect('/masuk');
  const parsed = parseForm(CodeSchema, formData);
  if (parsed.error) return parsed.error;
  const factor = await guardedSecondFactor(pending.id, parsed.data.code, () => limited(pending.id));
  if (factor === 'limited') return fail(TOO_MANY);
  if (!factor) {
    await audit(null, {
      action: 'auth.mfa_failed',
      summary: `Kode MFA salah untuk "${pending.username}"`,
      entityType: 'user',
      entityId: pending.id,
    });
    return fail(WRONG, { code: 'Kode tidak cocok.' });
  }

  await verifyPerAccount.reset(pending.id);
  // Rotasi token: sesi tertunda dibuang, sesi penuh dibuat baru.
  await destroySession();
  await createSession(pending.id);
  const db = await getDb();
  const [u] = await db
    .update(schema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.users.id, pending.id))
    .returning({ mustChangePassword: schema.users.mustChangePassword });
  await audit(pending, {
    action: factor === 'recovery' ? 'auth.login_recovery_code' : 'auth.login',
    summary: factor === 'recovery' ? 'Masuk ke portal dengan kode pemulihan MFA' : 'Masuk ke portal (sandi + kode MFA)',
    entityType: 'user',
    entityId: pending.id,
  });
  redirect(u?.mustChangePassword ? '/dashboard/akun' : factor === 'recovery' ? `${MFA_SETUP_PATH}?pemulihan=1` : '/dashboard');
}

export async function cancelMfaLoginAction(): Promise<void> {
  await destroySession();
  redirect('/masuk');
}

/* ------------------------------------------------------------------ */
/* Pendaftaran & pengelolaan oleh pemilik akun                          */
/* ------------------------------------------------------------------ */

export async function startMfaEnrollmentAction(): Promise<void> {
  const user = await requireUser({ allowMfaSetup: true });
  const result = await startEnrollment(user.id);
  if (result.ok)
    await audit(user, { action: 'auth.mfa_enroll_started', summary: 'Memulai pendaftaran MFA', entityType: 'user', entityId: user.id });
  redirect(MFA_SETUP_PATH);
}

export async function confirmMfaEnrollmentAction(_prev: MfaCodesState, formData: FormData): Promise<MfaCodesState> {
  const user = await requireUser({ allowMfaSetup: true });
  const parsed = parseForm(CodeSchema, formData);
  if (parsed.error) return parsed.error;
  if (await limited(user.id)) return fail(TOO_MANY);
  const codes = await confirmEnrollment(user.id, parsed.data.code);
  if (!codes) return fail(WRONG, { code: 'Kode tidak cocok.' });
  await verifyPerAccount.reset(user.id);
  await audit(user, { action: 'auth.mfa_enabled', summary: 'Mengaktifkan MFA (TOTP)', entityType: 'user', entityId: user.id });
  revalidatePath(MFA_SETUP_PATH);
  return { status: 'success', message: 'MFA aktif. Simpan kode pemulihan di bawah ini sekarang.', codes };
}

export async function regenerateRecoveryCodesAction(_prev: MfaCodesState, formData: FormData): Promise<MfaCodesState> {
  const user = await requireUser({ allowMfaSetup: true });
  const parsed = parseForm(CodeSchema, formData);
  if (parsed.error) return parsed.error;
  if (await limited(user.id)) return fail(TOO_MANY);
  // Butuh kode TOTP saat ini: sesi yang dibajak saja tidak cukup untuk mengambil kode pemulihan.
  if (!/^\d{6}$/.test(parsed.data.code.replace(/\s/g, '')) || (await verifySecondFactor(user.id, parsed.data.code)) !== 'totp') {
    return fail(WRONG, { code: 'Masukkan kode 6 digit dari aplikasi autentikator.' });
  }
  const codes = await regenerateRecoveryCodes(user.id);
  await audit(user, {
    action: 'auth.mfa_recovery_regenerated',
    summary: 'Membuat ulang kode pemulihan MFA',
    entityType: 'user',
    entityId: user.id,
  });
  return { status: 'success', message: 'Kode pemulihan baru dibuat. Kode lama tidak berlaku lagi.', codes };
}

export async function disableMfaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser({ allowMfaSetup: true });
  if (requiresMfa(user.role)) return fail('Peran Anda wajib memakai MFA. Bila perangkat hilang, minta Super Admin mereset MFA Anda.');
  const parsed = parseForm(CodeSchema, formData);
  if (parsed.error) return parsed.error;
  if (await limited(user.id)) return fail(TOO_MANY);
  if (!(await verifySecondFactor(user.id, parsed.data.code))) return fail(WRONG, { code: 'Kode tidak cocok.' });
  await removeMfa(user.id);
  await audit(user, { action: 'auth.mfa_disabled', summary: 'Menonaktifkan MFA', entityType: 'user', entityId: user.id });
  redirect(`${MFA_SETUP_PATH}?nonaktif=1`);
}

/* ------------------------------------------------------------------ */
/* Super Admin: reset MFA akun lain                                     */
/* ------------------------------------------------------------------ */

export async function resetUserMfaAction(targetId: string): Promise<void> {
  const actor = await requirePermission('users.reset_mfa');
  const id = z.string().uuid().safeParse(targetId);
  if (!id.success) notFound();
  const db = await getDb();
  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, id.data)).limit(1);
  // Akun sendiri / akun tak dikenal → 404 (tidak membocorkan apa pun).
  if (!target || !canResetMfa(actor, target)) notFound();

  await removeMfa(target.id);
  // Masa tenggang baru dimulai sekarang; semua sesi akun itu diputus.
  await db.update(schema.users).set({ mfaGraceStartedAt: new Date() }).where(eq(schema.users.id, target.id));
  await destroyUserSessions(target.id);
  await audit(actor, {
    action: 'auth.mfa_reset',
    summary: `Mereset MFA akun "${target.username}" (semua sesinya diputus)`,
    entityType: 'user',
    entityId: target.id,
  });
  revalidatePath(`/dashboard/pengguna/${target.id}`);
  redirect(`/dashboard/pengguna/${target.id}?mfa=direset`);
}
