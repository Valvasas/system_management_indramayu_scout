/**
 * SERVER-ONLY. Backup basis data + uji pulih (V5 §20). Prosedur lengkap: docs/operations/monitoring.md.
 *
 * - PostgreSQL (DATABASE_URL): `pg_dump --format=custom` (butuh pg_dump di server aplikasi).
 * - PGlite (pengembangan/demo): `dumpDataDir()` dari instance yang SEDANG dipakai proses ini.
 * Setiap berkas disertai `<berkas>.sha256` (format sha256sum) dan dicatat di `backup_runs`.
 * Uji pulih memuat berkas ke basis data sementara lalu menghitung baris tabel utama.
 *
 * Berkas backup memuat kolom sensitif dalam bentuk TERENKRIPSI; kunci (DATA_ENCRYPTION_KEYS)
 * WAJIB dibackup terpisah — tanpa kunci, data itu tidak bisa dipulihkan.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { and, desc, eq, gt } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import { childProcessEnv, serverEnv } from '@/lib/env';
import { scrub } from '@/lib/monitoring';

export type BackupRun = typeof schema.backupRuns.$inferSelect;
const PREFIX = 'rumah-pramuka-';

export interface BackupOptions {
  db?: Database;
  dir?: string;
  databaseUrl?: string;
  keep?: number;
  now?: () => Date;
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

function run(
  cmd: string,
  args: string[],
  extraEnv: Record<string, string> = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    // Next mempersempit NodeJS.ProcessEnv (NODE_ENV wajib); proses anak tidak membutuhkannya.
    const env = childProcessEnv(extraEnv) as unknown as NodeJS.ProcessEnv;
    const child = spawn(cmd, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b) => (stdout += b));
    child.stderr.on('data', (b) => (stderr += b));
    child.on('error', (err) => resolve({ code: -1, stdout, stderr: String(err.message) }));
    child.on('close', (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

/** Argumen libpq tanpa sandi (sandi lewat PGPASSWORD). */
function pgArgs(databaseUrl: string): { args: string[]; password: string } {
  const u = new URL(databaseUrl);
  const args = [
    '--host',
    u.hostname,
    '--port',
    u.port || '5432',
    '--username',
    decodeURIComponent(u.username),
    '--dbname',
    u.pathname.slice(1),
  ];
  return { args, password: decodeURIComponent(u.password) };
}

const sha256File = async (file: string) =>
  createHash('sha256')
    .update(await fs.readFile(file))
    .digest('hex');

async function prune(dir: string, keep: number) {
  const files = (await fs.readdir(dir)).filter((f) => f.startsWith(PREFIX) && !f.endsWith('.sha256')).sort();
  for (const f of files.slice(0, Math.max(0, files.length - keep))) {
    await fs.rm(path.join(dir, f), { force: true });
    await fs.rm(path.join(dir, `${f}.sha256`), { force: true });
  }
}

export function backupDir(dir?: string) {
  return path.resolve(dir ?? serverEnv().BACKUP_DIR ?? path.join(process.cwd(), 'backups'));
}

/** Jalankan backup sekarang. Satu backup dalam satu waktu (yang lain ditolak). */
export async function runBackup(trigger: { id: string | null; name: string }, opts: BackupOptions = {}): Promise<BackupRun> {
  const db = opts.db ?? (await getDb());
  const now = opts.now ?? (() => new Date());
  const env = opts.databaseUrl !== undefined || opts.dir ? null : serverEnv();
  const databaseUrl = opts.databaseUrl ?? env?.DATABASE_URL;
  const dir = backupDir(opts.dir);
  const keep = opts.keep ?? env?.BACKUP_KEEP ?? 14;
  const t = schema.backupRuns;

  const [busy] = await db
    .select({ id: t.id })
    .from(t)
    .where(and(eq(t.status, 'RUNNING'), gt(t.startedAt, new Date(now().getTime() - 30 * 60_000))))
    .limit(1);
  if (busy) throw new Error('Backup lain sedang berjalan. Tunggu sampai selesai.');

  const kind = databaseUrl ? 'postgres' : 'pglite';
  const [row] = await db.insert(t).values({ kind, triggeredById: trigger.id, triggeredByName: trigger.name, startedAt: now() }).returning();
  try {
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    const fileName = `${PREFIX}${stamp(now())}.${kind === 'postgres' ? 'dump' : 'pglite.tar.gz'}`;
    const file = path.join(dir, fileName);
    if (databaseUrl) {
      const { args, password } = pgArgs(databaseUrl);
      const r = await run('pg_dump', ['--format=custom', '--no-owner', '--no-privileges', '--file', file, ...args], {
        PGPASSWORD: password,
      });
      if (r.code !== 0) {
        await fs.rm(file, { force: true }); // jangan tinggalkan berkas setengah jadi
        throw new Error(r.code === -1 ? 'pg_dump tidak ditemukan di server aplikasi.' : `pg_dump gagal: ${r.stderr.slice(0, 300)}`);
      }
      await fs.chmod(file, 0o600);
    } else {
      const client = (db as unknown as { $client?: { dumpDataDir?: (c: 'gzip') => Promise<Blob> } }).$client;
      if (!client?.dumpDataDir) throw new Error('Instance PGlite tidak tersedia untuk backup.');
      const blob = await client.dumpDataDir('gzip');
      await fs.writeFile(file, Buffer.from(await blob.arrayBuffer()), { mode: 0o600 });
    }
    const [{ size }, hash] = await Promise.all([fs.stat(file), sha256File(file)]);
    await fs.writeFile(`${file}.sha256`, `${hash}  ${fileName}\n`, { mode: 0o600 });
    await prune(dir, keep);
    const [done] = await db
      .update(t)
      .set({ status: 'SUCCESS', fileName, sizeBytes: size, sha256: hash, finishedAt: now() })
      .where(eq(t.id, row.id))
      .returning();
    return done;
  } catch (err) {
    const [failed] = await db
      .update(t)
      .set({ status: 'FAILED', error: scrub(err instanceof Error ? err.message : String(err)).slice(0, 500), finishedAt: now() })
      .where(eq(t.id, row.id))
      .returning();
    return failed;
  }
}

/**
 * Uji pulih: berkas dicek checksum-nya, lalu dipulihkan ke basis data sementara
 * (PGlite in-memory) atau divalidasi `pg_restore --list` (PostgreSQL).
 */
export async function verifyBackup(runId: string, opts: BackupOptions = {}): Promise<{ ok: boolean; note: string }> {
  const db = opts.db ?? (await getDb());
  const t = schema.backupRuns;
  const [r] = await db.select().from(t).where(eq(t.id, runId)).limit(1);
  if (!r || r.status !== 'SUCCESS' || !r.fileName) return { ok: false, note: 'Backup tidak ditemukan atau gagal.' };
  const file = path.join(backupDir(opts.dir), r.fileName);
  let result: { ok: boolean; note: string };
  try {
    const hash = await sha256File(file);
    if (hash !== r.sha256) {
      result = { ok: false, note: 'Checksum berbeda: berkas rusak atau diubah sejak dibuat.' };
    } else if (r.kind === 'pglite') {
      const { PGlite } = await import('@electric-sql/pglite');
      const restored = new PGlite({ loadDataDir: new Blob([await fs.readFile(file)]) });
      const q = await restored.query<{ members: number; users: number; logs: number }>(
        'SELECT (SELECT count(*) FROM members)::int AS members, (SELECT count(*) FROM users)::int AS users, (SELECT count(*) FROM audit_logs)::int AS logs',
      );
      await restored.close();
      const c = q.rows[0];
      result = { ok: true, note: `Pulih ke basis data sementara: ${c.members} anggota, ${c.users} akun, ${c.logs} entri log.` };
    } else {
      const out = await run('pg_restore', ['--list', file]);
      const tables = out.stdout.split('\n').filter((l) => / TABLE DATA /.test(l)).length;
      result =
        out.code === 0 && tables > 0
          ? {
              ok: true,
              note: `Arsip valid (pg_restore --list): data ${tables} tabel. Uji pulih penuh: lihat docs/operations/monitoring.md.`,
            }
          : { ok: false, note: out.code === -1 ? 'pg_restore tidak ditemukan.' : 'Arsip tidak bisa dibaca pg_restore.' };
    }
  } catch (err) {
    result = { ok: false, note: `Gagal memulihkan: ${scrub(err instanceof Error ? err.message : String(err)).slice(0, 200)}` };
  }
  await db
    .update(t)
    .set({ verifiedAt: new Date(), verifyNote: `${result.ok ? 'LULUS' : 'GAGAL'}: ${result.note}` })
    .where(eq(t.id, r.id));
  return result;
}

export async function recentBackups(limit = 10, db?: Database): Promise<BackupRun[]> {
  const d = db ?? (await getDb());
  return d.select().from(schema.backupRuns).orderBy(desc(schema.backupRuns.startedAt)).limit(limit);
}

export async function lastSuccessfulBackup(db?: Database): Promise<BackupRun | null> {
  const d = db ?? (await getDb());
  const [r] = await d
    .select()
    .from(schema.backupRuns)
    .where(eq(schema.backupRuns.status, 'SUCCESS'))
    .orderBy(desc(schema.backupRuns.startedAt))
    .limit(1);
  return r ?? null;
}
