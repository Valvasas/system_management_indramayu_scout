import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import { runRetention, type RetentionPolicy } from '@/features/retention/retention';
import { AUDIT_GENESIS, auditChainKey, computeAuditHash, verifyAuditChain } from '@/lib/auth/audit-chain';
import { createTestDb, type TestDb } from '../helpers/test-db';

let t: TestDb;
let userId: string;
const NOW = new Date('2026-10-06T08:00:00Z');
const day = 86_400_000;
const ago = (days: number) => new Date(NOW.getTime() - days * day);
const POLICY: RetentionPolicy = { accessCodesDays: 30, resetRequestsDays: 90, contactMessagesDays: 365, auditLogMonths: 24 };

/** Sisipkan entri berantai dengan waktu tertentu (INSERT diizinkan; UPDATE/DELETE tidak). */
async function chained(at: Date, summary: string) {
  const [last] = await t.db
    .select()
    .from(schema.auditLogs)
    .orderBy(sql`id desc`)
    .limit(1);
  // id dari sequence yang sama dengan aplikasi (appendAuditEntry), bukan angka karangan.
  const next = (await t.db.execute(sql`SELECT nextval(pg_get_serial_sequence('audit_logs', 'id'))::int AS id`)) as unknown as {
    rows: { id: number }[];
  };
  const id = Number(next.rows[0].id);
  const e = {
    id,
    at,
    userId: null,
    actorName: 'Uji',
    action: 'uji',
    entityType: null,
    entityId: null,
    summary,
    ip: null,
    prevHash: last?.hash ?? AUDIT_GENESIS,
  };
  await t.db.insert(schema.auditLogs).values({ ...e, hash: computeAuditHash(e, auditChainKey()) });
}

beforeEach(async () => {
  t = await createTestDb();
  const [u] = await t.db.insert(schema.users).values({ username: 'u', name: 'U', passwordHash: 'x', role: 'PESERTA' }).returning();
  userId = u.id;
  await t.db.insert(schema.sessions).values([
    { id: 'kedaluwarsa', userId, expiresAt: ago(1) },
    { id: 'aktif', userId, expiresAt: new Date(NOW.getTime() + day) },
  ]);
  await t.db.insert(schema.accessCodes).values([
    { userId, codeHash: 'lama', purpose: 'RESET', expiresAt: ago(40), usedAt: ago(41) },
    { userId, codeHash: 'baru', purpose: 'RESET', expiresAt: new Date(NOW.getTime() + day) },
  ]);
  await t.db.insert(schema.passwordResetRequests).values([
    { userId, status: 'RESOLVED', createdAt: ago(100) },
    { userId, status: 'OPEN', createdAt: ago(100) }, // yang masih terbuka tidak dihapus
  ]);
  await t.db.insert(schema.contactMessages).values([
    { name: 'Lama', email: 'a@b.id', message: 'pesan lama sekali', createdAt: ago(400) },
    { name: 'Baru', email: 'c@d.id', message: 'pesan masih baru', createdAt: ago(10) },
  ]);
  await t.db.insert(schema.rateLimits).values([
    { key: 'lewat', count: 3, windowEndsAt: ago(1) },
    { key: 'jalan', count: 1, windowEndsAt: new Date(NOW.getTime() + 60_000) },
  ]);
  await chained(ago(900), 'sangat lama 1');
  await chained(ago(800), 'sangat lama 2');
  await chained(ago(30), 'baru 1');
  await chained(ago(5), 'baru 2');
});
afterEach(async () => {
  await t.close();
});

describe('retensi data (1.4)', () => {
  it('dry run hanya menghitung', async () => {
    const r = await runRetention(t.db, POLICY, { now: NOW, dryRun: true });
    expect(r).toEqual({
      sessions: 1,
      accessCodes: 1,
      resetRequests: 1,
      consentRequests: 0,
      rateLimits: 1,
      contactMessages: 1,
      auditLogs: 2,
    });
    expect((await t.db.select().from(schema.auditLogs)).length).toBe(4);
    expect((await t.db.select().from(schema.contactMessages)).length).toBe(2);
  });

  it('menghapus yang lewat masa simpan, menyisakan yang masih berlaku, dan rantai log tetap terverifikasi', async () => {
    const r = await runRetention(t.db, POLICY, { now: NOW });
    expect(r).toMatchObject({ sessions: 1, accessCodes: 1, resetRequests: 1, rateLimits: 1, contactMessages: 1, auditLogs: 2 });
    expect((await t.db.select().from(schema.sessions)).map((s) => s.id)).toEqual(['aktif']);
    expect((await t.db.select().from(schema.passwordResetRequests)).map((x) => x.status)).toEqual(['OPEN']);
    expect((await t.db.select().from(schema.contactMessages)).map((x) => x.name)).toEqual(['Baru']);
    const logs = await t.db.select().from(schema.auditLogs).orderBy(schema.auditLogs.id);
    expect(logs.map((l) => l.summary)).toEqual(['baru 1', 'baru 2', expect.stringMatching(/^Retensi:/)]);
    expect((await t.db.select().from(schema.auditChainAnchors))[0]).toMatchObject({ firstLogId: logs[0].id, deletedCount: 2 });
    expect(await verifyAuditChain(t.db)).toMatchObject({ ok: true, checked: 3 });
  });

  it('dengan peran aplikasi tanpa hak DELETE: log audit dilewati, data lain tetap dibersihkan', async () => {
    await t.db.execute(sql`CREATE ROLE uji_app NOLOGIN`);
    await t.db.execute(sql`GRANT USAGE ON SCHEMA public TO uji_app`);
    await t.db.execute(sql`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO uji_app`);
    await t.db.execute(sql`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO uji_app`);
    await t.db.execute(sql`REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM uji_app`);
    await t.db.execute(sql`REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON audit_chain_anchors FROM uji_app`);
    await t.db.execute(sql`SET ROLE uji_app`);
    try {
      const r = await runRetention(t.db, POLICY, { now: NOW });
      expect(r.auditLogs).toBe('tidak-diizinkan');
      expect(r.contactMessages).toBe(1);
      expect((await t.db.select().from(schema.auditLogs)).length).toBe(5); // 4 lama + catatan retensi
    } finally {
      await t.db.execute(sql`RESET ROLE`);
    }
  });
});
