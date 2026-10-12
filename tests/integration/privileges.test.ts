import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyAppRolePrivileges } from '@/db/privileges';
import { createTestDb, type TestDb } from '../helpers/test-db';

let t: TestDb;
beforeEach(async () => {
  t = await createTestDb();
});
afterEach(async () => {
  await t.close();
});

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

describe('hak user aplikasi diterapkan ulang setiap migrasi (setelah restore backup)', () => {
  it('peran tidak ada → tidak melakukan apa pun', async () => {
    expect(await applyAppRolePrivileges(t.db, 'peran_tidak_ada')).toBe(false);
  });

  it('nama peran yang bisa menyisipkan SQL ditolak', async () => {
    await expect(applyAppRolePrivileges(t.db, 'app"; DROP TABLE users; --')).rejects.toThrow(/tidak valid/);
  });

  it('hasil restore dengan hak bawaan penuh → DELETE log audit & tulis jangkar kembali ditolak', async () => {
    // Keadaan setelah pg_restore ke volume baru: ALTER DEFAULT PRIVILEGES memberi semua hak tabel.
    await t.db.execute(sql`CREATE ROLE uji_app_restore NOLOGIN`);
    await t.db.execute(sql`GRANT USAGE ON SCHEMA public TO uji_app_restore`);
    await t.db.execute(sql`GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public TO uji_app_restore`);
    await t.db.execute(sql`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO uji_app_restore`);

    expect(await applyAppRolePrivileges(t.db, 'uji_app_restore')).toBe(true);
    expect(await applyAppRolePrivileges(t.db, 'uji_app_restore')).toBe(true); // idempoten

    await t.db.execute(sql`SET ROLE uji_app_restore`);
    try {
      const del = await rejection(
        t.db.transaction(async (tx) => {
          await tx.execute(sql`SET LOCAL rumah_pramuka.audit_retention = 'on'`);
          await tx.execute(sql`DELETE FROM audit_logs`);
        }),
      );
      expect(del).toMatch(/permission denied/i);
      expect(
        await rejection(t.db.execute(sql`INSERT INTO audit_chain_anchors (first_log_id, prev_hash, deleted_count) VALUES (1, 'x', 0)`)),
      ).toMatch(/permission denied/i);
      // Jurnal migrasi tetap terbaca (dibutuhkan pg_dump dari tombol backup portal).
      const journal = (await t.db.execute(sql`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`)) as unknown as {
        rows: { n: number }[];
      };
      expect(journal.rows[0].n).toBeGreaterThan(0);
    } finally {
      await t.db.execute(sql`RESET ROLE`);
    }
  });
});

describe('deteksi hak berbahaya atas log audit (halaman integritas)', () => {
  it('melaporkan DELETE/INSERT jangkar setelah restore, bersih setelah db:migrate', async () => {
    const { auditPrivileges } = await import('@/lib/auth/audit-chain');
    await t.db.execute(sql`CREATE ROLE uji_app_cek NOLOGIN`);
    await t.db.execute(sql`GRANT USAGE ON SCHEMA public TO uji_app_cek`);
    await t.db.execute(sql`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO uji_app_cek`);
    const check = async () => {
      await t.db.execute(sql`SET ROLE uji_app_cek`);
      try {
        return await auditPrivileges(t.db);
      } finally {
        await t.db.execute(sql`RESET ROLE`);
      }
    };
    expect(await check()).toMatchObject({
      role: 'uji_app_cek',
      superuser: false,
      owner: false,
      risky: ['UPDATE log audit', 'DELETE log audit', 'INSERT jangkar retensi', 'UPDATE jangkar retensi', 'DELETE jangkar retensi'],
    });
    await applyAppRolePrivileges(t.db, 'uji_app_cek');
    expect(await check()).toMatchObject({ risky: [] });
    expect(await auditPrivileges(t.db)).toMatchObject({ superuser: true }); // koneksi pengembangan (PGlite)
  });
});
