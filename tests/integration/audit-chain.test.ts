import { randomBytes } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import {
  appendAuditEntry,
  AUDIT_GENESIS,
  auditChainKey,
  computeAnchorMac,
  computeAuditHash,
  truncateStorable,
  verifyAuditChain,
} from '@/lib/auth/audit-chain';
import { createTestDb, type TestDb } from '../helpers/test-db';

/** Karakter di luar BMP (pasangan surrogate), dibangun dari kode titik agar sumber bebas emoji. */
const ASTRAL = String.fromCodePoint(0x1f3d5);
const VS16 = String.fromCodePoint(0xfe0f);

let t: TestDb;
const key = auditChainKey(randomBytes(32));
const entry = (n: number) => ({
  userId: null,
  actorName: 'Penguji',
  action: 'uji.aksi',
  summary: `Entri ke-${n}`,
  entityType: 'uji',
  entityId: String(n),
  ip: '127.0.0.1',
});
const append = async (n: number) => {
  for (let i = 1; i <= n; i++) await appendAuditEntry(t.db, entry(i), key);
};
/** Penyerang dengan hak pemilik skema: matikan trigger, lakukan perubahan, nyalakan lagi. */
const asOwnerBypassingTrigger = async (statement: ReturnType<typeof sql>) => {
  await t.db.execute(sql`ALTER TABLE audit_logs DISABLE TRIGGER audit_logs_no_update_delete`);
  await t.db.execute(statement);
  await t.db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER audit_logs_no_update_delete`);
};

/** Drizzle membungkus galat Postgres; pesan asli ada di `cause`. */
const rejection = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    const err = e as Error & { cause?: Error };
    return `${err.message} ${err.cause?.message ?? ''}`;
  }
  throw new Error('diharapkan ditolak');
};

beforeEach(async () => {
  t = await createTestDb();
});
afterEach(async () => {
  await t.close();
});

describe('log audit tahan-ubah (1.6)', () => {
  it('rantai utuh terverifikasi; entri pertama berangkat dari GENESIS', async () => {
    await append(5);
    const rows = await t.db.select().from(schema.auditLogs).orderBy(schema.auditLogs.id);
    expect(rows[0].prevHash).toBe(AUDIT_GENESIS);
    expect(rows[1].prevHash).toBe(rows[0].hash);
    const report = await verifyAuditChain(t.db, key, 2); // batch kecil: uji lintas batch
    expect(report).toMatchObject({ ok: true, checked: 5, legacy: 0, headHash: rows[4].hash, headId: rows[4].id });
  });

  it('UPDATE, DELETE, dan TRUNCATE ditolak basis data', async () => {
    await append(2);
    expect(await rejection(t.db.execute(sql`UPDATE audit_logs SET summary = 'diubah'`))).toMatch(/hanya boleh ditambah/);
    expect(await rejection(t.db.execute(sql`DELETE FROM audit_logs`))).toMatch(/hanya boleh ditambah/);
    expect(await rejection(t.db.execute(sql`TRUNCATE audit_logs`))).toMatch(/hanya boleh ditambah/);
    expect((await verifyAuditChain(t.db, key)).checked).toBe(2);
  });

  it('isi entri yang diubah terdeteksi tepat di entri itu', async () => {
    await append(5);
    const [third] = await t.db.select().from(schema.auditLogs).orderBy(schema.auditLogs.id).offset(2).limit(1);
    await asOwnerBypassingTrigger(sql`UPDATE audit_logs SET summary = 'Tidak pernah terjadi' WHERE id = ${third.id}`);
    const report = await verifyAuditChain(t.db, key);
    expect(report.ok).toBe(false);
    expect(report.broken).toEqual({ id: third.id, reason: 'isi-berubah' });
  });

  it('entri yang dihapus di tengah memutus rantai', async () => {
    await append(5);
    const rows = await t.db.select().from(schema.auditLogs).orderBy(schema.auditLogs.id);
    await asOwnerBypassingTrigger(sql`DELETE FROM audit_logs WHERE id = ${rows[2].id}`);
    const report = await verifyAuditChain(t.db, key);
    expect(report.broken).toEqual({ id: rows[3].id, reason: 'rantai-terputus' });
  });

  it('entri palsu tanpa kunci HMAC terdeteksi, walau prev_hash disalin benar', async () => {
    await append(3);
    const [last] = await t.db
      .select()
      .from(schema.auditLogs)
      .orderBy(sql`id desc`)
      .limit(1);
    const forged = { ...entry(99), id: last.id + 1, at: new Date(), prevHash: last.hash! };
    await t.db.insert(schema.auditLogs).values({ ...forged, hash: computeAuditHash(forged, auditChainKey(randomBytes(32))) });
    const report = await verifyAuditChain(t.db, key);
    expect(report.broken).toEqual({ id: forged.id, reason: 'isi-berubah' });
  });

  it('memotong awal rantai terdeteksi, kecuali tercatat jangkar retensi', async () => {
    await append(4);
    const rows = await t.db.select().from(schema.auditLogs).orderBy(schema.auditLogs.id);
    await t.db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL rumah_pramuka.audit_retention = 'on'`);
      await tx.execute(sql`DELETE FROM audit_logs WHERE id <= ${rows[1].id}`);
    });
    expect((await verifyAuditChain(t.db, key)).broken).toEqual({ id: rows[2].id, reason: 'awal-tidak-dikenal' });
    const anchor = { firstLogId: rows[2].id, prevHash: rows[2].prevHash!, deletedCount: 2 };
    await t.db.insert(schema.auditChainAnchors).values({ ...anchor, mac: computeAnchorMac(anchor, key) });
    expect(await verifyAuditChain(t.db, key)).toMatchObject({ ok: true, checked: 2 });
  });

  it('jangkar palsu (tanpa MAC, MAC kunci lain, atau entri pertama berbeda) tidak menyembunyikan penghapusan', async () => {
    await append(5);
    const rows = await t.db.select().from(schema.auditLogs).orderBy(schema.auditLogs.id);
    // Pemilik skema tanpa kunci HMAC menghapus awal rantai (termasuk entri baru) lalu menambah jangkar.
    await t.db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL rumah_pramuka.audit_retention = 'on'`);
      await tx.execute(sql`DELETE FROM audit_logs WHERE id <= ${rows[2].id}`);
    });
    const anchor = { firstLogId: rows[3].id, prevHash: rows[3].prevHash!, deletedCount: 3 };
    const unknownStart = { ok: false, broken: { id: rows[3].id, reason: 'awal-tidak-dikenal' } };
    await t.db.insert(schema.auditChainAnchors).values(anchor);
    expect(await verifyAuditChain(t.db, key)).toMatchObject(unknownStart);
    await t.db.insert(schema.auditChainAnchors).values({ ...anchor, mac: computeAnchorMac(anchor, auditChainKey(randomBytes(32))) });
    expect(await verifyAuditChain(t.db, key)).toMatchObject(unknownStart);
    const shifted = { ...anchor, firstLogId: rows[1].id };
    await t.db.insert(schema.auditChainAnchors).values({ ...shifted, mac: computeAnchorMac(shifted, key) });
    expect(await verifyAuditChain(t.db, key)).toMatchObject(unknownStart);
  });

  it('basis data menolak entri baru tanpa hash rantai (tidak bisa menyamar sebagai entri lama)', async () => {
    await append(2);
    const msg = await rejection(
      t.db.execute(
        sql`INSERT INTO audit_logs (id, at, actor_name, action, summary) VALUES (-1, now(), 'Admin Kwarcab', 'member.export', 'Mengekspor 1200 data anggota')`,
      ),
    );
    expect(msg).toMatch(/audit_logs_chained/);
    expect(await verifyAuditChain(t.db, key)).toMatchObject({ ok: true, checked: 2, legacy: 0 });
  });

  it('ringkasan yang terpotong di tengah emoji tetap terverifikasi (hash = isi tersimpan)', async () => {
    const summary = truncateStorable(`${'a'.repeat(499)}${ASTRAL}${VS16} sisa`, 500);
    expect(summary.endsWith(ASTRAL)).toBe(true);
    const lone = `${'b'.repeat(10)}\uD83C`; // surrogate tunggal dari pemanggil lain
    await appendAuditEntry(t.db, { ...entry(1), summary }, key);
    await appendAuditEntry(t.db, { ...entry(2), summary: lone, actorName: 'Nama\u0000Palsu' }, key);
    await appendAuditEntry(t.db, entry(3), key);
    expect(await verifyAuditChain(t.db, key)).toMatchObject({ ok: true, checked: 3 });
    const stored = await t.db.select().from(schema.auditLogs).orderBy(schema.auditLogs.id);
    expect(stored[1].summary).toBe(`${'b'.repeat(10)}\uFFFD`);
    expect(stored[1].actorName).toBe('Nama\uFFFDPalsu');
  });

  it('penulisan bersamaan tidak membentuk cabang', async () => {
    await Promise.all(Array.from({ length: 12 }, (_, i) => appendAuditEntry(t.db, entry(i), key)));
    const rows = await t.db.select().from(schema.auditLogs);
    expect(new Set(rows.map((r) => r.prevHash)).size).toBe(12);
    expect(await verifyAuditChain(t.db, key)).toMatchObject({ ok: true, checked: 12 });
  });

  it('entri lama sebelum rantai dihitung terpisah dan tidak menggagalkan verifikasi', async () => {
    // Simulasi instalasi lama: baris ditulis sebelum constraint rantai (migrasi 0015) ada.
    await t.db.execute(sql`ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_chained`);
    await t.db.execute(sql`INSERT INTO audit_logs (actor_name, action, summary) VALUES ('Lama', 'lama', 'sebelum rantai')`);
    await t.db.execute(
      sql`ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_chained CHECK (hash IS NOT NULL AND prev_hash IS NOT NULL) NOT VALID`,
    );
    await append(2);
    expect(await verifyAuditChain(t.db, key)).toMatchObject({ ok: true, checked: 2, legacy: 1 });
  });
});
