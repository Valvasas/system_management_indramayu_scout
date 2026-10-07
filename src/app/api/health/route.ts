import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { reportError } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';

/**
 * Pemeriksaan kesehatan untuk pemantau uptime / load balancer.
 * 200 = aplikasi & basis data sehat, 503 = basis data tidak terjangkau.
 * Tidak membocorkan versi, konfigurasi, atau pesan galat.
 */
export async function GET() {
  const started = Date.now();
  let database: 'ok' | 'error' = 'ok';
  try {
    const db = await getDb();
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Pemeriksaan basis data melewati 3 detik')), 3000)),
    ]);
  } catch (err) {
    database = 'error';
    await reportError(err, { area: 'health' });
  }
  const ok = database === 'ok';
  return Response.json(
    { status: ok ? 'ok' : 'error', checks: { database }, durationMs: Date.now() - started },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
