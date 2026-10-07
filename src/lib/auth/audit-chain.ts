/**
 * SERVER-ONLY. Rantai HMAC untuk log audit tahan-ubah (1.6).
 *
 * Setiap entri menyimpan `prev_hash` (hash entri sebelumnya) dan
 * `hash = HMAC-SHA256(kunci, [versi, id, waktu, pelaku, aksi, entitas, ringkasan, ip, prev_hash])`.
 * Mengubah, menghapus, menyisipkan, atau menukar urutan entri memutus rantai.
 * HMAC (bukan SHA polos) supaya pihak yang hanya punya akses tulis ke basis data
 * tidak bisa menghitung ulang rantai — kuncinya ada di env aplikasi, bukan di DB.
 *
 * Kunci diturunkan (HKDF) dari BLIND_INDEX_KEY dengan konteks terpisah. Merotasi
 * BLIND_INDEX_KEY berarti entri lama tidak bisa diverifikasi lagi — catat kepala rantai
 * (ditampilkan di halaman integritas) sebelum rotasi.
 */
import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';
import { asc, desc, gt, isNotNull, sql } from 'drizzle-orm';
import { schema, type Database } from '@/db';
import { envKeyring } from '@/lib/security/crypto';

export const AUDIT_GENESIS = 'GENESIS';
const HASH_VERSION = 1;
/** Kunci advisory lock untuk menyerialkan penulisan rantai (angka bebas, unik di aplikasi ini). */
const CHAIN_LOCK = 7_204_2026;

export interface ChainFields {
  id: number;
  at: Date;
  userId: string | null;
  actorName: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  ip: string | null;
  prevHash: string;
}

export function auditChainKey(blindKey: Buffer = envKeyring().blindKey): Buffer {
  return Buffer.from(hkdfSync('sha256', blindKey, Buffer.alloc(0), 'rumah-pramuka:audit-chain:v1', 32));
}

export function computeAuditHash(e: ChainFields, key: Buffer = auditChainKey()): string {
  const canonical = JSON.stringify([
    HASH_VERSION,
    e.id,
    e.at.toISOString(),
    e.userId,
    e.actorName,
    e.action,
    e.entityType,
    e.entityId,
    e.summary,
    e.ip,
    e.prevHash,
  ]);
  return createHmac('sha256', key).update(canonical).digest('hex');
}

const sameHash = (a: string | null, b: string) => {
  if (!a || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

export type AuditInput = Omit<ChainFields, 'id' | 'at' | 'prevHash'>;

/**
 * Tambah satu entri ke rantai. Advisory lock + `nextval` di dalam transaksi menjamin
 * entri bersamaan tidak membentuk cabang (dua entri dengan `prev_hash` sama).
 */
export async function appendAuditEntry(db: Database, input: AuditInput, key: Buffer = auditChainKey()): Promise<void> {
  const t = schema.auditLogs;
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${CHAIN_LOCK})`);
    const [last] = await tx.select({ hash: t.hash }).from(t).where(isNotNull(t.hash)).orderBy(desc(t.id)).limit(1);
    const next = (await tx.execute(sql`SELECT nextval(pg_get_serial_sequence('audit_logs', 'id'))::text AS id`)) as unknown as {
      rows: { id: string }[];
    };
    const entry: ChainFields = { ...input, id: Number(next.rows[0].id), at: new Date(), prevHash: last?.hash ?? AUDIT_GENESIS };
    await tx.insert(t).values({ ...entry, hash: computeAuditHash(entry, key) });
  });
}

export interface ChainReport {
  ok: boolean;
  /** Entri berantai yang diperiksa. */
  checked: number;
  /** Entri lama sebelum rantai diaktifkan (tidak terlindungi). */
  legacy: number;
  /** Hash entri terakhir — catat di luar sistem sebagai pembanding. */
  headHash: string | null;
  headId: number | null;
  broken?: { id: number; reason: 'isi-berubah' | 'rantai-terputus' | 'awal-tidak-dikenal' };
}

type ChainRow = typeof schema.auditLogs.$inferSelect;

/** Verifikasi murni atas baris berurutan id. `anchors` = prev_hash sah untuk entri pertama. */
export function verifyChainRows(rows: ChainRow[], anchors: ReadonlySet<string>, key: Buffer, start?: { prevHash: string | null }) {
  let prev = start?.prevHash ?? null;
  for (const row of rows) {
    if (!row.hash || !row.prevHash) return { brokenAt: row.id, reason: 'rantai-terputus' as const, prev };
    const expectedPrev = prev ?? (row.prevHash === AUDIT_GENESIS || anchors.has(row.prevHash) ? row.prevHash : null);
    if (expectedPrev === null) return { brokenAt: row.id, reason: 'awal-tidak-dikenal' as const, prev };
    if (row.prevHash !== expectedPrev) return { brokenAt: row.id, reason: 'rantai-terputus' as const, prev };
    const recomputed = computeAuditHash(
      {
        id: row.id,
        at: row.at,
        userId: row.userId,
        actorName: row.actorName,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        summary: row.summary,
        ip: row.ip,
        prevHash: row.prevHash,
      },
      key,
    );
    if (!sameHash(row.hash, recomputed)) return { brokenAt: row.id, reason: 'isi-berubah' as const, prev };
    prev = row.hash;
  }
  return { brokenAt: null, reason: null, prev };
}

/** Verifikasi seluruh rantai di basis data, per batch (memori tetap kecil). */
export async function verifyAuditChain(db: Database, key: Buffer = auditChainKey(), batchSize = 1000): Promise<ChainReport> {
  const t = schema.auditLogs;
  const anchors = new Set((await db.select({ h: schema.auditChainAnchors.prevHash }).from(schema.auditChainAnchors)).map((a) => a.h));
  const [{ legacy }] = await db
    .select({ legacy: sql<number>`count(*)::int` })
    .from(t)
    .where(sql`${t.hash} IS NULL`);

  // Entri berantai pertama: setelah itu semua entri wajib punya hash (tidak boleh ada lubang).
  const [first] = await db.select({ id: t.id }).from(t).where(isNotNull(t.hash)).orderBy(asc(t.id)).limit(1);
  if (!first) return { ok: true, checked: 0, legacy, headHash: null, headId: null };

  let checked = 0;
  let lastId = first.id - 1;
  let prev: string | null = null;
  let headId: number | null = null;
  for (;;) {
    const rows = await db.select().from(t).where(gt(t.id, lastId)).orderBy(asc(t.id)).limit(batchSize);
    if (rows.length === 0) break;
    const r = verifyChainRows(rows, anchors, key, { prevHash: prev });
    if (r.brokenAt !== null) {
      return {
        ok: false,
        checked: checked + rows.findIndex((x) => x.id === r.brokenAt),
        legacy,
        headHash: prev,
        headId,
        broken: { id: r.brokenAt, reason: r.reason! },
      };
    }
    checked += rows.length;
    prev = r.prev;
    lastId = rows[rows.length - 1].id;
    headId = lastId;
  }
  return { ok: true, checked, legacy, headHash: prev, headId };
}
