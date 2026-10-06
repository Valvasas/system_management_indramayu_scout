import fs from 'node:fs';
import path from 'node:path';
import { eq, sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import {
  issueConsentRequest,
  lookupConsentCode,
  memberConsentSummary,
  recordStaffRevocation,
  submitGuardianDecision,
} from '@/features/consent/consent';
import { createTestDb, type TestDb } from '../helpers/test-db';
import { actor } from '../helpers/actors';

let t: TestDb;
let gudepA: string;
let gudepB: string;
let childId: string;
let adultId: string;
const NOW = new Date('2026-10-06T08:00:00Z');
const yes = { DATA: true, PHOTO: false, ACTIVITY: true };

beforeEach(async () => {
  t = await createTestDb();
  const [k] = await t.db.insert(schema.kwarran).values({ name: 'Kwarran Uji' }).returning();
  const [a, b] = await t.db
    .insert(schema.gudep)
    .values([
      { kwarranId: k.id, name: 'Gudep A' },
      { kwarranId: k.id, name: 'Gudep B' },
    ])
    .returning();
  gudepA = a.id;
  gudepB = b.id;
  const [child, adult] = await t.db
    .insert(schema.members)
    .values([
      {
        fullName: 'Rara Anindita Putri',
        gender: 'P',
        birthDate: '2013-04-02',
        golongan: 'PENGGALANG',
        gudepId: gudepA,
        guardianName: 'Ibu Rara',
      },
      { fullName: 'Pak Dewasa', gender: 'L', birthDate: '1990-01-01', golongan: 'DEWASA', gudepId: gudepA },
    ])
    .returning();
  childId = child.id;
  adultId = adult.id;
});
afterEach(async () => {
  await t.close();
});

const staffA = () => actor('STAFF_GUDEP', { gudepId: gudepA });
const staffB = () => actor('STAFF_GUDEP', { gudepId: gudepB });

describe('persetujuan wali terverifikasi (1.5)', () => {
  it('pembina hanya bisa meminta untuk anak di gudepnya sendiri (IDOR antar-gudep ditolak)', async () => {
    expect(await issueConsentRequest(staffB(), childId, NOW, t.db)).toEqual({ ok: false, reason: 'tidak-ditemukan' });
    expect(await issueConsentRequest(staffA(), adultId, NOW, t.db)).toEqual({ ok: false, reason: 'dewasa' });
    const r = await issueConsentRequest(staffA(), childId, NOW, t.db);
    expect(r.ok).toBe(true);
    const raw = await t.db.select().from(schema.guardianConsentRequests);
    expect(raw[0].codeHash).not.toContain(r.ok ? r.code.replace('-', '') : 'x');
  });

  it('pemegang kode hanya melihat nama depan anak + gudep', async () => {
    const r = await issueConsentRequest(staffA(), childId, NOW, t.db);
    if (!r.ok) throw new Error('harus ok');
    expect(await lookupConsentCode(r.code.toLowerCase(), NOW, t.db)).toEqual({ childFirstName: 'Rara', gudepName: 'Gudep A' });
    expect(await lookupConsentCode('ABCD-EFGH', NOW, t.db)).toBeNull();
  });

  it('keputusan wali tercatat per cakupan + versi teks; nama wali terenkripsi; kode sekali pakai', async () => {
    const r = await issueConsentRequest(staffA(), childId, NOW, t.db);
    if (!r.ok) throw new Error('harus ok');
    const saved = await submitGuardianDecision({ code: r.code, guardianName: 'Siti Aminah', decisions: yes, ipHash: 'h' }, NOW, t.db);
    expect(saved).toEqual({ memberId: childId, childFirstName: 'Rara' });
    const { statuses, history } = await memberConsentSummary(childId, NOW, t.db);
    expect([statuses.DATA.kind, statuses.PHOTO.kind, statuses.ACTIVITY.kind]).toEqual(['GRANTED', 'DECLINED', 'GRANTED']);
    expect(history.every((h) => h.method === 'GUARDIAN_CODE' && h.textVersion === '2026-10-v1' && h.guardianName === 'Siti Aminah')).toBe(
      true,
    );
    const raw = (await t.db.execute(sql`SELECT guardian_name FROM guardian_consents`)) as unknown as { rows: { guardian_name: string }[] };
    expect(raw.rows.every((x) => x.guardian_name.startsWith('enc:v1:'))).toBe(true);
    expect(await submitGuardianDecision({ code: r.code, guardianName: 'Siti', decisions: yes, ipHash: null }, NOW, t.db)).toBeNull();
  });

  it('kode dipakai serentak dua kali → hanya satu keputusan yang tercatat', async () => {
    const r = await issueConsentRequest(staffA(), childId, NOW, t.db);
    if (!r.ok) throw new Error('harus ok');
    const sub = () => submitGuardianDecision({ code: r.code, guardianName: 'Siti', decisions: yes, ipHash: null }, NOW, t.db);
    const results = await Promise.all([sub(), sub(), sub()]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await t.db.select().from(schema.guardianConsents)).length).toBe(3);
  });

  it('kode kedaluwarsa dan kode lama setelah kode baru dibuat tidak berlaku', async () => {
    const first = await issueConsentRequest(staffA(), childId, NOW, t.db);
    const second = await issueConsentRequest(staffA(), childId, NOW, t.db);
    if (!first.ok || !second.ok) throw new Error('harus ok');
    expect(await lookupConsentCode(first.code, NOW, t.db)).toBeNull();
    const later = new Date(NOW.getTime() + 15 * 86_400_000);
    expect(await submitGuardianDecision({ code: second.code, guardianName: 'Siti', decisions: yes, ipHash: null }, later, t.db)).toBeNull();
  });

  it('staf hanya bisa mencatat pencabutan, dalam cakupannya sendiri', async () => {
    const r = await issueConsentRequest(staffA(), childId, NOW, t.db);
    if (!r.ok) throw new Error('harus ok');
    await submitGuardianDecision({ code: r.code, guardianName: 'Siti', decisions: yes, ipHash: null }, NOW, t.db);
    expect(await recordStaffRevocation(staffB(), childId, 'DATA', 'Diminta lewat telepon', NOW, t.db)).toBeNull();
    const later = new Date(NOW.getTime() + 60_000);
    expect(await recordStaffRevocation(staffA(), childId, 'DATA', 'Wali datang ke sanggar', later, t.db)).not.toBeNull();
    const { statuses, history } = await memberConsentSummary(childId, later, t.db);
    expect(statuses.DATA.kind).toBe('REVOKED');
    const staffRows = history.filter((h) => h.method === 'STAFF_REVOCATION');
    expect(staffRows).toHaveLength(1);
    expect(staffRows[0].granted).toBe(false);
    // Riwayat tidak ditimpa: keputusan wali sebelumnya tetap ada.
    expect(history.filter((h) => h.scope === 'DATA')).toHaveLength(2);
  });

  it('migrasi data lama: tanggal manual → LEGACY_MANUAL, idempoten', async () => {
    await t.db.update(schema.members).set({ guardianConsentAt: '2026-08-01' }).where(eq(schema.members.id, childId));
    const migration = fs.readFileSync(path.join(process.cwd(), 'drizzle/0007_guardian_consent_legacy.sql'), 'utf8');
    await t.db.execute(sql.raw(migration));
    await t.db.execute(sql.raw(migration));
    const { statuses, history } = await memberConsentSummary(childId, NOW, t.db);
    expect(history).toHaveLength(1);
    expect(statuses.DATA.kind).toBe('LEGACY');
  });
});
