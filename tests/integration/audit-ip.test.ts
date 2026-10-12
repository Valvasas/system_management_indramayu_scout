import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { schema } from '@/db';
import { audit, auditIpFingerprint, IP_FINGERPRINT_PREFIX } from '@/lib/auth/audit';
import { verifyAuditChain } from '@/lib/auth/audit-chain';
import { createTestDb, useAsAppDb, type TestDb } from '../helpers/test-db';

/** Karakter di luar BMP (pasangan surrogate), dibangun dari kode titik agar sumber bebas emoji. */
const ASTRAL = String.fromCodePoint(0x1f3d5);

vi.mock('@/lib/security/request', () => ({ clientIp: () => '203.0.113.77', userAgent: () => 'uji' }));

let t: TestDb;
beforeEach(async () => {
  t = await createTestDb();
  useAsAppDb(t.db);
});
afterEach(async () => {
  await t.close();
});

describe('alamat IP di log audit', () => {
  it('formulir publik tanpa akun (mis. keputusan wali) hanya menyimpan sidik HMAC, bukan IP', async () => {
    await audit(null, { action: 'consent.decided', summary: 'Wali mencatat keputusan persetujuan', entityType: 'member', entityId: 'x' });
    const [row] = await t.db.select().from(schema.auditLogs);
    expect(row.ip).toBe(auditIpFingerprint('203.0.113.77'));
    expect(row.ip?.startsWith(IP_FINGERPRINT_PREFIX)).toBe(true);
    expect(JSON.stringify(row)).not.toContain('203.0.113.77');
  });

  it('aksi pengurus tetap mencatat IP pelaku (akuntabilitas), dan rantai tetap utuh', async () => {
    await audit({ id: '00000000-0000-4000-8000-000000000001', name: 'Pembina Uji' }, { action: 'member.update', summary: 'Mengubah data' });
    await audit(null, { action: 'auth.login_failed', summary: 'Gagal masuk' });
    const rows = await t.db.select().from(schema.auditLogs).orderBy(schema.auditLogs.id);
    expect(rows.map((r) => r.ip)).toEqual(['203.0.113.77', auditIpFingerprint('203.0.113.77')]);
    expect(auditIpFingerprint('203.0.113.77')).not.toBe(auditIpFingerprint('203.0.113.78'));
    expect(await verifyAuditChain(t.db)).toMatchObject({ ok: true, checked: 2 });
  });

  it('ringkasan panjang dipotong per karakter (emoji utuh), bukan per code unit', async () => {
    await audit(null, { action: 'uji', summary: `${'x'.repeat(499)}${ASTRAL}${'y'.repeat(10)}` });
    const [row] = await t.db.select().from(schema.auditLogs);
    expect(Array.from(row.summary)).toHaveLength(500);
    expect(row.summary.endsWith(ASTRAL)).toBe(true);
    expect(await verifyAuditChain(t.db)).toMatchObject({ ok: true });
  });
});
