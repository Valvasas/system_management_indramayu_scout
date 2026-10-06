import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import {
  confirmEnrollment,
  getMfaRecord,
  guardedSecondFactor,
  MFA_LIMITS,
  recoveryCodesLeft,
  regenerateRecoveryCodes,
  removeMfa,
  startEnrollment,
  verifySecondFactor,
} from '@/features/auth/mfa';
import { base32Decode, hotp, totpStep } from '@/lib/auth/totp';
import { createRateLimiter, dbRateLimitStore } from '@/lib/security/rate-limit';
import { createTestDb, type TestDb } from '../helpers/test-db';

let t: TestDb;
let userId: string;
const NOW = Date.parse('2026-10-06T08:00:00Z');
const codeFor = async (ms: number) => hotp(base32Decode((await getMfaRecord(userId, t.db))!.secret), totpStep(ms));

beforeEach(async () => {
  t = await createTestDb();
  const [u] = await t.db
    .insert(schema.users)
    .values({ username: 'admin.uji', name: 'Admin Uji', passwordHash: 'x', role: 'SUPER_ADMIN' })
    .returning();
  userId = u.id;
});
afterEach(async () => {
  await t.close();
});

async function enroll() {
  await startEnrollment(userId, t.db);
  const codes = await confirmEnrollment(userId, await codeFor(NOW), NOW, t.db);
  expect(codes).toHaveLength(10);
  return codes!;
}

describe('MFA TOTP tersimpan di basis data (1.2)', () => {
  it('rahasia TOTP terenkripsi di DB; belum aktif sampai kode pertama benar', async () => {
    await startEnrollment(userId, t.db);
    const raw = (await t.db.execute(sql`SELECT secret FROM user_mfa`)) as unknown as { rows: { secret: string }[] };
    expect(raw.rows[0].secret).toMatch(/^enc:v1:/);
    expect(await confirmEnrollment(userId, '000000', NOW, t.db)).toBeNull();
    expect((await getMfaRecord(userId, t.db))!.confirmedAt).toBeNull();
    // Sebelum aktif, verifikasi masuk selalu gagal (tidak bisa dipakai sebagai faktor).
    expect(await verifySecondFactor(userId, await codeFor(NOW), NOW, t.db)).toBeNull();
  });

  it('kode yang sudah dipakai ditolak (replay), kode langkah berikutnya diterima', async () => {
    await enroll(); // kode langkah NOW terpakai saat konfirmasi
    expect(await verifySecondFactor(userId, await codeFor(NOW), NOW, t.db)).toBeNull();
    const later = NOW + 30_000;
    expect(await verifySecondFactor(userId, await codeFor(later), later, t.db)).toBe('totp');
    expect(await verifySecondFactor(userId, await codeFor(later), later, t.db)).toBeNull();
  });

  it('kode yang sama dikirim serentak hanya lolos sekali', async () => {
    await enroll();
    const later = NOW + 60_000;
    const code = await codeFor(later);
    const results = await Promise.all(Array.from({ length: 5 }, () => verifySecondFactor(userId, code, later, t.db)));
    expect(results.filter((r) => r === 'totp')).toHaveLength(1);
  });

  it('kode pemulihan sekali pakai; dibuat ulang → yang lama hangus', async () => {
    const codes = await enroll();
    const raw = (await t.db.execute(sql`SELECT code_hash FROM mfa_recovery_codes`)) as unknown as { rows: { code_hash: string }[] };
    expect(raw.rows.every((r) => !codes.some((c) => r.code_hash.includes(c.replace('-', ''))))).toBe(true);
    expect(await verifySecondFactor(userId, codes[0].toLowerCase(), NOW, t.db)).toBe('recovery');
    expect(await verifySecondFactor(userId, codes[0], NOW, t.db)).toBeNull();
    expect(await recoveryCodesLeft(userId, t.db)).toBe(9);
    const fresh = await regenerateRecoveryCodes(userId, t.db);
    expect(await verifySecondFactor(userId, codes[1], NOW, t.db)).toBeNull();
    expect(await verifySecondFactor(userId, fresh[0], NOW, t.db)).toBe('recovery');
  });

  it('brute-force: setelah batas per akun, kode yang BENAR pun ditolak', async () => {
    await enroll();
    const limiter = createRateLimiter(MFA_LIMITS.perAccount.max, MFA_LIMITS.perAccount.windowMs, {
      scope: 'mfa-akun',
      failClosed: true,
      store: dbRateLimitStore(async () => t.db),
    });
    const isLimited = () => limiter.limited(userId);
    for (let i = 0; i < MFA_LIMITS.perAccount.max; i++)
      expect(await guardedSecondFactor(userId, '000000', isLimited, NOW, t.db)).toBeNull();
    const later = NOW + 30_000;
    expect(await guardedSecondFactor(userId, await codeFor(later), isLimited, later, t.db)).toBe('limited');
  });

  it('reset menghapus rahasia & kode pemulihan; akun lain tidak terpengaruh', async () => {
    const codes = await enroll();
    const [other] = await t.db
      .insert(schema.users)
      .values({ username: 'lain', name: 'Lain', passwordHash: 'x', role: 'ADMIN_WEBSITE' })
      .returning();
    await startEnrollment(other.id, t.db);
    await removeMfa(userId, t.db);
    expect(await getMfaRecord(userId, t.db)).toBeNull();
    expect(await verifySecondFactor(userId, codes[2], NOW, t.db)).toBeNull();
    expect(await getMfaRecord(other.id, t.db)).not.toBeNull();
    // Mendaftar ulang menghasilkan rahasia baru.
    await startEnrollment(userId, t.db);
    expect((await startEnrollment(userId, t.db)).ok).toBe(true);
  });
});
