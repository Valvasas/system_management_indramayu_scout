import { randomBytes } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import { backfillEncryptedColumns } from '@/db/encrypt-backfill';
import { createFieldCipher, DEV_KEYRING, encryptedKeyId, envKeyring, type Keyring } from '@/lib/security/crypto';
import { createTestDb, type TestDb } from '../helpers/test-db';

let t: TestDb;
let gudepId: string;
const raw = async (id: string) =>
  (
    (await t.db.execute(sql`SELECT phone, address, guardian_name, guardian_phone FROM members WHERE id = ${id}::uuid`)) as unknown as {
      rows: Record<string, string | null>[];
    }
  ).rows[0];

beforeAll(async () => {
  t = await createTestDb();
  const [k] = await t.db.insert(schema.kwarran).values({ name: 'Uji Kwarran' }).returning();
  const [g] = await t.db.insert(schema.gudep).values({ kwarranId: k.id, name: 'Gudep Uji' }).returning();
  gudepId = g.id;
});
afterAll(async () => {
  await t.close();
});

const member = (over: Partial<typeof schema.members.$inferInsert> = {}) => ({
  fullName: 'Anggota Fiktif',
  gender: 'L' as const,
  birthDate: '2012-05-01',
  golongan: 'PENGGALANG' as const,
  gudepId,
  ...over,
});

describe('kolom sensitif anggota terenkripsi di basis data (1.3)', () => {
  it('ditulis sebagai ciphertext, dibaca kembali sebagai teks lewat Drizzle; null tetap null', async () => {
    const [m] = await t.db
      .insert(schema.members)
      .values(member({ phone: '081234567890', address: 'Jl. Uji 1', guardianName: 'Ibu Uji', guardianPhone: null }))
      .returning();
    const stored = await raw(m.id);
    expect(stored.phone).toMatch(/^enc:v1:dev:/);
    expect(stored.address).not.toContain('Jl. Uji');
    expect(stored.guardian_name).not.toContain('Ibu');
    expect(stored.guardian_phone).toBeNull();
    const [back] = await t.db
      .select()
      .from(schema.members)
      .where(sql`${schema.members.id} = ${m.id}`);
    expect(back).toMatchObject({ phone: '081234567890', address: 'Jl. Uji 1', guardianName: 'Ibu Uji', guardianPhone: null });
  });

  it('backfill mengenkripsi data lama, idempoten, dan merotasi kunci', async () => {
    // Baris lama (teks biasa) disisipkan langsung lewat SQL, seperti data sebelum fitur ini.
    const [m] = await t.db
      .insert(schema.members)
      .values(member({ fullName: 'Data Lama' }))
      .returning();
    await t.db.execute(sql`UPDATE members SET phone = '0899 lama', address = 'Alamat lama' WHERE id = ${m.id}::uuid`);
    expect((await raw(m.id)).phone).toBe('0899 lama');

    const first = await backfillEncryptedColumns(t.db, envKeyring());
    expect(first.find((r) => r.column === 'phone')!.updated).toBe(1); // hanya baris lama
    expect((await raw(m.id)).phone).toMatch(/^enc:v1:dev:/);

    const again = await backfillEncryptedColumns(t.db, envKeyring());
    expect(again.every((r) => r.updated === 0)).toBe(true);

    const rotated: Keyring = { ...DEV_KEYRING, activeId: 'k2', keys: new Map([...DEV_KEYRING.keys, ['k2', randomBytes(32)]]) };
    const dry = await backfillEncryptedColumns(t.db, rotated, { dryRun: true });
    expect(dry.find((r) => r.column === 'phone')!.updated).toBe(2);
    expect(encryptedKeyId((await raw(m.id)).phone!)).toBe('dev'); // dry run tidak mengubah
    await backfillEncryptedColumns(t.db, rotated);
    const after = await raw(m.id);
    expect(encryptedKeyId(after.phone!)).toBe('k2');
    expect(createFieldCipher(rotated).decrypt(after.phone!, 'members.phone')).toBe('0899 lama');
  });
});
