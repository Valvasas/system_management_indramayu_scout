import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schema } from '@/db';
import { assertSafeBackupDir, pgConnArgs, runBackup, verifyBackup } from '@/features/backup/backup';
import { createTestDb, type TestDb } from '../helpers/test-db';

let t: TestDb;
let dir: string;
const who = { id: null, name: 'Penguji' };

beforeEach(async () => {
  t = await createTestDb();
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rp-backup-'));
  const [k] = await t.db.insert(schema.kwarran).values({ name: 'Kwarran Uji' }).returning();
  const [g] = await t.db.insert(schema.gudep).values({ kwarranId: k.id, name: 'Gudep Uji' }).returning();
  await t.db
    .insert(schema.members)
    .values({ fullName: 'Anggota Fiktif', gender: 'P', birthDate: '2012-02-02', golongan: 'PENGGALANG', gudepId: g.id });
});
afterEach(async () => {
  await t.close();
  await fs.rm(dir, { recursive: true, force: true });
});

describe('backup & uji pulih (1.7)', () => {
  it('backup PGlite berhasil, berkas + checksum ditulis, uji pulih memuat datanya', async () => {
    const run = await runBackup(who, { db: t.db, dir, databaseUrl: '' });
    expect(run).toMatchObject({ status: 'SUCCESS', kind: 'pglite' });
    const files = await fs.readdir(dir);
    expect(files).toEqual(expect.arrayContaining([run.fileName, `${run.fileName}.sha256`]));
    expect(await fs.readFile(path.join(dir, `${run.fileName}.sha256`), 'utf8')).toBe(`${run.sha256}  ${run.fileName}\n`);
    const v = await verifyBackup(run.id, { db: t.db, dir });
    expect(v.ok).toBe(true);
    expect(v.note).toMatch(/1 anggota/);
  });

  it('berkas yang diubah setelah dibuat ditolak saat uji pulih', async () => {
    const run = await runBackup(who, { db: t.db, dir, databaseUrl: '' });
    await fs.appendFile(path.join(dir, run.fileName!), 'x');
    const v = await verifyBackup(run.id, { db: t.db, dir });
    expect(v).toEqual({ ok: false, note: expect.stringMatching(/Checksum berbeda/) });
    const [row] = await t.db.select().from(schema.backupRuns);
    expect(row.verifyNote).toMatch(/^GAGAL/);
  });

  it('hanya menyimpan N berkas terbaru', async () => {
    let n = Date.parse('2026-10-06T00:00:00Z');
    for (let i = 0; i < 4; i++) {
      n += 60_000;
      const at = new Date(n);
      await runBackup(who, { db: t.db, dir, databaseUrl: '', keep: 2, now: () => at });
    }
    const dumps = (await fs.readdir(dir)).filter((f) => !f.endsWith('.sha256'));
    expect(dumps).toHaveLength(2);
    expect(dumps.sort()[1]).toContain('20261006-0004');
  });

  it('pg_dump gagal (server tak terjangkau) tercatat FAILED tanpa membocorkan sandi', async () => {
    const run = await runBackup(who, { db: t.db, dir, databaseUrl: 'postgresql://app:sandi-rahasia@127.0.0.1:1/tidak_ada' });
    expect(run.status).toBe('FAILED');
    expect(run.error ?? '').not.toContain('sandi-rahasia');
    expect(await fs.readdir(dir)).toEqual([]); // berkas setengah jadi dihapus
  });

  it('berkas backup 0600 sejak dibuat, juga bila folder sudah ada dengan mode longgar', async () => {
    await fs.chmod(dir, 0o755);
    const run = await runBackup(who, { db: t.db, dir, databaseUrl: '' });
    expect(run.status).toBe('SUCCESS');
    expect((await fs.stat(path.join(dir, run.fileName!))).mode & 0o777).toBe(0o600);
    expect((await fs.stat(dir)).mode & 0o777).toBe(0o700);
  });

  it('di produksi, folder backup di dalam direktori aplikasi ditolak', async () => {
    const app = path.join(dir, 'app');
    expect(() => assertSafeBackupDir(path.join(app, 'backups'), true, app)).toThrow(/di luar direktori aplikasi/);
    expect(() => assertSafeBackupDir(app, true, app)).toThrow(/di luar direktori aplikasi/);
    expect(() => assertSafeBackupDir(path.join(dir, 'backups'), true, app)).not.toThrow();
    expect(() => assertSafeBackupDir(path.join(app, 'backups'), false, app)).not.toThrow();
    const run = await runBackup(who, { db: t.db, dir: path.join(process.cwd(), 'backups-uji'), databaseUrl: '', production: true });
    expect(run).toMatchObject({ status: 'FAILED', error: expect.stringMatching(/BACKUP_DIR/) });
  });

  it('koneksi pg_dump mempertahankan sslmode dkk., tanpa sandi, dalam satu argumen --dbname=', () => {
    const { args, password } = pgConnArgs(
      'postgresql://app:p%40ss@db.internal:6543/-rumah?sslmode=verify-full&sslrootcert=/etc/ssl/db-ca.pem',
    );
    expect(password).toBe('p@ss');
    expect(args).toEqual(['--dbname=postgresql://app@db.internal:6543/-rumah?sslmode=verify-full&sslrootcert=/etc/ssl/db-ca.pem']);
    expect(args.join(' ')).not.toContain('p%40ss');
  });
});
