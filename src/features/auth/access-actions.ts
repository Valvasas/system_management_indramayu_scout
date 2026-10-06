'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { accessCodeMatches, isValidAccessCodeShape } from '@/lib/auth/access-code';
import { audit } from '@/lib/auth/audit';
import { burnPasswordCheck, hashPassword, passwordProblem } from '@/lib/auth/password';
import { createSession, destroyUserSessions, requireUser } from '@/lib/auth/session';
import { fail, ok, optionalText, parseForm, type FormState } from '@/lib/forms';
import { clientIp } from '@/lib/security/request';
import { createRateLimiter } from '@/lib/security/rate-limit';
import { accessCodeMessage, canManageAccess, issueAccessCode } from './access-codes';

/* ------------------------------------------------------------------ */
/* Publik: lupa kata sandi                                              */
/* ------------------------------------------------------------------ */

const requestPerIp = createRateLimiter(5, 60 * 60_000, { scope: 'reset-minta-ip', failClosed: true });

const RequestSchema = z.object({
  username: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().min(1, 'Nama pengguna wajib diisi.').max(80)),
  note: optionalText(200),
});

const GENERIC_REQUEST =
  'Permintaan diterima. Bila nama pengguna terdaftar, pembina atau pengurus Anda akan melihat permintaan ini dan memberikan kode akses. Hubungi mereka langsung agar lebih cepat.';

/**
 * Permintaan reset diteruskan ke pembina/pengurus — tidak lewat email (banyak peserta anak
 * tidak punya email, V5 §10). Jawaban selalu sama agar tidak membocorkan akun mana yang ada.
 */
export async function requestPasswordResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(RequestSchema, formData);
  if (parsed.error) return parsed.error;
  if (await requestPerIp.limited(clientIp()))
    return fail('Terlalu banyak permintaan. Coba lagi dalam satu jam, atau hubungi pembina Anda langsung.');

  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.username, parsed.data.username)).limit(1);
  if (user && user.active) {
    // Satu permintaan terbuka per akun cukup; jangan banjiri antrean pembina.
    const [open] = await db
      .select({ id: schema.passwordResetRequests.id })
      .from(schema.passwordResetRequests)
      .where(and(eq(schema.passwordResetRequests.userId, user.id), eq(schema.passwordResetRequests.status, 'OPEN')))
      .limit(1);
    if (!open) {
      await db.insert(schema.passwordResetRequests).values({ userId: user.id, note: parsed.data.note });
      await audit(null, {
        action: 'auth.reset_requested',
        summary: `Permintaan reset sandi untuk "${user.username}"`,
        entityType: 'user',
        entityId: user.id,
      });
    }
  }
  return ok(GENERIC_REQUEST);
}

/* ------------------------------------------------------------------ */
/* Publik: tukar kode akses → buat kata sandi sendiri                   */
/* ------------------------------------------------------------------ */

const redeemPerIp = createRateLimiter(20, 15 * 60_000, { scope: 'kode-ip', failClosed: true });
const redeemPerAccount = createRateLimiter(6, 15 * 60_000, { scope: 'kode-akun', failClosed: true });

const RedeemSchema = z
  .object({
    username: z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .pipe(z.string().min(1, 'Nama pengguna wajib diisi.').max(80)),
    code: z.string().trim().min(1, 'Kode akses wajib diisi.').max(20),
    next: z.string().max(128),
    confirm: z.string(),
  })
  .superRefine((v, ctx) => {
    const problem = passwordProblem(v.next);
    if (problem) ctx.addIssue({ code: 'custom', path: ['next'], message: problem });
    if (v.next !== v.confirm) ctx.addIssue({ code: 'custom', path: ['confirm'], message: 'Konfirmasi tidak sama.' });
  });

const GENERIC_REDEEM = 'Nama pengguna atau kode akses tidak cocok, atau kode sudah kedaluwarsa. Minta kode baru kepada pembina/pengurus.';

export async function redeemAccessCodeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(RedeemSchema, formData);
  if (parsed.error) return parsed.error;
  const { username, code, next } = parsed.data;

  if ((await redeemPerIp.limited(clientIp())) || (await redeemPerAccount.limited(username))) {
    return fail('Terlalu banyak percobaan. Tunggu 15 menit, lalu coba lagi.');
  }
  if (!isValidAccessCodeShape(code)) return fail(GENERIC_REDEEM, { code: 'Kode terdiri dari 8 huruf/angka, mis. ABCD-2345.' });

  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
  if (!user || !user.active) {
    await burnPasswordCheck(next); // samakan waktu respons
    return fail(GENERIC_REDEEM);
  }
  const [valid] = await db
    .select()
    .from(schema.accessCodes)
    .where(and(eq(schema.accessCodes.userId, user.id), isNull(schema.accessCodes.usedAt), gt(schema.accessCodes.expiresAt, new Date())))
    .orderBy(desc(schema.accessCodes.createdAt))
    .limit(1);
  if (!valid || !accessCodeMatches(code, valid.codeHash)) {
    await audit(null, {
      action: 'auth.code_failed',
      summary: `Kode akses salah untuk "${username}"`,
      entityType: 'user',
      entityId: user.id,
    });
    return fail(GENERIC_REDEEM);
  }

  // Tandai terpakai lebih dulu (sekali pakai), baru ganti sandi.
  const consumed = await db
    .update(schema.accessCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.accessCodes.id, valid.id), isNull(schema.accessCodes.usedAt)))
    .returning({ id: schema.accessCodes.id });
  if (consumed.length === 0) return fail(GENERIC_REDEEM);

  await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(next), mustChangePassword: false, lastLoginAt: new Date() })
    .where(eq(schema.users.id, user.id));
  await destroyUserSessions(user.id);
  await redeemPerAccount.reset(username);
  await createSession(user.id);
  await audit(user, {
    action: valid.purpose === 'ACTIVATION' ? 'auth.activated' : 'auth.password_reset',
    summary: valid.purpose === 'ACTIVATION' ? 'Mengaktifkan akun dengan kode akses' : 'Membuat kata sandi baru dengan kode reset',
    entityType: 'user',
    entityId: user.id,
  });
  redirect('/dashboard?sambutan=1');
}

/* ------------------------------------------------------------------ */
/* Staf: menangani permintaan                                           */
/* ------------------------------------------------------------------ */

/** Terbitkan kode reset untuk akun tertentu (dari antrean permintaan atau halaman akun/anggota). */
export async function issueResetCodeAction(userId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const actor = await requireUser();
  const db = await getDb();
  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!target || !(await canManageAccess(actor, target))) return fail('Akun tidak ditemukan atau di luar kewenangan Anda.');
  if (!target.active) return fail('Akun ini nonaktif. Aktifkan dulu sebelum menerbitkan kode.');
  const { code, expiresAt } = await issueAccessCode(actor, target, 'RESET');
  // Sengaja TANPA revalidatePath: render ulang akan melepas permintaan yang baru selesai dari
  // daftar, dan pesan berisi kode (yang hanya tampil sekali) ikut hilang sebelum sempat dibaca.
  return ok(accessCodeMessage(target.username, code, expiresAt, 'RESET'));
}

export async function dismissResetRequestAction(requestId: string): Promise<void> {
  const actor = await requireUser();
  const db = await getDb();
  const [row] = await db
    .select({ req: schema.passwordResetRequests, user: schema.users })
    .from(schema.passwordResetRequests)
    .innerJoin(schema.users, eq(schema.users.id, schema.passwordResetRequests.userId))
    .where(eq(schema.passwordResetRequests.id, requestId))
    .limit(1);
  if (row && row.req.status === 'OPEN' && (await canManageAccess(actor, row.user))) {
    await db
      .update(schema.passwordResetRequests)
      .set({ status: 'DISMISSED', resolvedAt: new Date(), resolvedById: actor.id })
      .where(eq(schema.passwordResetRequests.id, requestId));
    await audit(actor, {
      action: 'user.reset_dismissed',
      summary: `Mengabaikan permintaan reset akun ${row.user.username}`,
      entityType: 'user',
      entityId: row.user.id,
    });
  }
  revalidatePath('/dashboard/akses');
  redirect('/dashboard/akses?diabaikan=1');
}
