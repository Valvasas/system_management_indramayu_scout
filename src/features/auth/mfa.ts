/**
 * SERVER-ONLY. Penyimpanan & verifikasi MFA (TOTP + kode pemulihan). Tanpa cek izin:
 * pemanggil (mfa-actions.ts) yang menegakkan siapa boleh melakukan apa.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { and, count, eq, isNull, lt, or } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import { generateAccessCode, isValidAccessCodeShape, normalizeAccessCode } from '@/lib/auth/access-code';
import { RECOVERY_CODE_COUNT } from '@/lib/auth/mfa-policy';
import { generateTotpSecret, verifyTotp } from '@/lib/auth/totp';

export const hashRecoveryCode = (code: string) =>
  createHash('sha256')
    .update(`rp-recovery:${normalizeAccessCode(code)}`)
    .digest('hex');

const sameHex = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));

export async function getMfaRecord(userId: string, db?: Database) {
  const d = db ?? (await getDb());
  const [row] = await d.select().from(schema.userMfa).where(eq(schema.userMfa.userId, userId)).limit(1);
  return row ?? null;
}

/** Mulai (atau ulang) pendaftaran: rahasia baru, belum aktif sampai dikonfirmasi. */
export async function startEnrollment(userId: string, db?: Database): Promise<{ ok: true } | { ok: false; reason: 'sudah-aktif' }> {
  const d = db ?? (await getDb());
  const existing = await getMfaRecord(userId, d);
  if (existing?.confirmedAt) return { ok: false, reason: 'sudah-aktif' };
  const secret = generateTotpSecret();
  if (existing)
    await d.update(schema.userMfa).set({ secret, lastUsedStep: null, createdAt: new Date() }).where(eq(schema.userMfa.id, existing.id));
  else await d.insert(schema.userMfa).values({ userId, secret });
  return { ok: true };
}

async function issueRecoveryCodes(d: Database, userId: string): Promise<string[]> {
  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, generateAccessCode);
  await d.delete(schema.mfaRecoveryCodes).where(eq(schema.mfaRecoveryCodes.userId, userId));
  await d.insert(schema.mfaRecoveryCodes).values(codes.map((c) => ({ userId, codeHash: hashRecoveryCode(c) })));
  return codes;
}

/**
 * Terima langkah TOTP secara atomik: hanya berhasil bila langkah ini lebih baru dari yang
 * terakhir dipakai. Dua permintaan bersamaan dengan kode sama → hanya satu yang lolos.
 */
async function claimStep(d: Database, userId: string, step: number, confirm: boolean): Promise<boolean> {
  const t = schema.userMfa;
  const updated = await d
    .update(t)
    .set(confirm ? { lastUsedStep: step, confirmedAt: new Date() } : { lastUsedStep: step })
    .where(and(eq(t.userId, userId), or(isNull(t.lastUsedStep), lt(t.lastUsedStep, step))))
    .returning({ id: t.id });
  return updated.length === 1;
}

/** Konfirmasi pendaftaran dengan kode pertama. Mengembalikan kode pemulihan (tampil sekali). */
export async function confirmEnrollment(userId: string, code: string, now = Date.now(), db?: Database): Promise<string[] | null> {
  const d = db ?? (await getDb());
  const rec = await getMfaRecord(userId, d);
  if (!rec || rec.confirmedAt) return null;
  const step = verifyTotp(rec.secret, code, now, rec.lastUsedStep);
  if (step === null || !(await claimStep(d, userId, step, true))) return null;
  return issueRecoveryCodes(d, userId);
}

export type SecondFactor = 'totp' | 'recovery';

/** Verifikasi faktor kedua saat masuk: kode TOTP 6 digit atau kode pemulihan XXXX-XXXX. */
export async function verifySecondFactor(userId: string, input: string, now = Date.now(), db?: Database): Promise<SecondFactor | null> {
  const d = db ?? (await getDb());
  const rec = await getMfaRecord(userId, d);
  if (!rec?.confirmedAt) return null;
  const digits = input.replace(/\s/g, '');
  if (/^\d{6}$/.test(digits)) {
    const step = verifyTotp(rec.secret, digits, now, rec.lastUsedStep);
    return step !== null && (await claimStep(d, userId, step, false)) ? 'totp' : null;
  }
  if (!isValidAccessCodeShape(input)) return null;
  const hash = hashRecoveryCode(input);
  const unused = await d
    .select()
    .from(schema.mfaRecoveryCodes)
    .where(and(eq(schema.mfaRecoveryCodes.userId, userId), isNull(schema.mfaRecoveryCodes.usedAt)));
  const match = unused.find((r) => sameHex(r.codeHash, hash));
  if (!match) return null;
  // Tandai terpakai secara bersyarat: kode yang sama tidak bisa dipakai dua kali walau serentak.
  const consumed = await d
    .update(schema.mfaRecoveryCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.mfaRecoveryCodes.id, match.id), isNull(schema.mfaRecoveryCodes.usedAt)))
    .returning({ id: schema.mfaRecoveryCodes.id });
  return consumed.length === 1 ? 'recovery' : null;
}

/** Batas percobaan kode MFA. Ruang TOTP hanya 10^6 → batas per akun harus ketat. */
export const MFA_LIMITS = {
  perAccount: { max: 5, windowMs: 15 * 60_000 },
  perIp: { max: 30, windowMs: 15 * 60_000 },
} as const;

/**
 * Pembatas dicek SEBELUM kode diperiksa: setelah batas tercapai, kode yang benar pun ditolak
 * sampai jendela berakhir (penyerang tidak mendapat sinyal benar/salah).
 */
export async function guardedSecondFactor(
  userId: string,
  input: string,
  isLimited: () => Promise<boolean>,
  now = Date.now(),
  db?: Database,
): Promise<SecondFactor | 'limited' | null> {
  if (await isLimited()) return 'limited';
  return verifySecondFactor(userId, input, now, db);
}

/** Kode pemulihan baru (yang lama hangus). Wajib didahului verifySecondFactor oleh pemanggil. */
export async function regenerateRecoveryCodes(userId: string, db?: Database): Promise<string[]> {
  return issueRecoveryCodes(db ?? (await getDb()), userId);
}

export async function recoveryCodesLeft(userId: string, db?: Database): Promise<number> {
  const d = db ?? (await getDb());
  const [r] = await d
    .select({ n: count() })
    .from(schema.mfaRecoveryCodes)
    .where(and(eq(schema.mfaRecoveryCodes.userId, userId), isNull(schema.mfaRecoveryCodes.usedAt)));
  return r.n;
}

/** Hapus MFA (reset oleh Super Admin, atau dinonaktifkan pemilik akun yang tidak wajib MFA). */
export async function removeMfa(userId: string, db?: Database): Promise<void> {
  const d = db ?? (await getDb());
  await d.delete(schema.mfaRecoveryCodes).where(eq(schema.mfaRecoveryCodes.userId, userId));
  await d.delete(schema.userMfa).where(eq(schema.userMfa.userId, userId));
}
