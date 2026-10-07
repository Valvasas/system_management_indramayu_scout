/**
 * SERVER-ONLY. Pelaporan galat opsional ke Sentry — aktif HANYA bila `SENTRY_DSN` diisi.
 *
 * Sengaja tanpa SDK resmi (@sentry/nextjs / @sentry/node): SDK itu menambah skrip klien
 * (CSP + data peramban anak ikut terkirim) dan instrumentasi otomatis yang merekam URL,
 * header, dan cookie. Di sini hanya galat server yang dikirim, lewat API envelope Sentry,
 * setelah DISAMARKAN: pos-el, nomor telepon, NIK/angka panjang, IP, kode akses, token,
 * dan query string dibuang. Tidak ada data pengguna, request, cookie, atau header.
 * Lihat docs/operations/monitoring.md.
 */
import { serverEnv } from './env';

const PATTERNS: [RegExp, string][] = [
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[pos-el]'],
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]'],
  [/\b(?:[0-9a-f]{1,4}:){3,7}[0-9a-f]{1,4}\b/gi, '[ip]'],
  [/(?:\+62|\b0)8[\d\s-]{7,14}\d/g, '[telepon]'],
  [/\b\d{10,}\b/g, '[angka]'],
  [/\b[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}\b/g, '[kode]'],
  [/\b(?:bearer|token|secret|password|sandi|kata sandi)\b\s*[:=]?\s*\S+/gi, '[rahasia]'],
  [/(postgres(?:ql)?:\/\/)[^\s'"]+/gi, '$1[disamarkan]'],
  [/(https?:\/\/[^\s?#'"]+)[?#][^\s'"]*/gi, '$1'],
];

/** Samarkan data pribadi & rahasia dari teks bebas (pesan galat, stack trace). */
export function scrub(text: string): string {
  return PATTERNS.reduce((t, [re, replacement]) => t.replace(re, replacement), text).slice(0, 4000);
}

interface Dsn {
  endpoint: string;
  publicKey: string;
  raw: string;
}

export function parseDsn(dsn: string): Dsn | null {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\/+/, '');
    if (u.protocol !== 'https:' || !u.username || !/^\d+$/.test(projectId)) return null;
    return { endpoint: `https://${u.host}/api/${projectId}/envelope/`, publicKey: u.username, raw: dsn };
  } catch {
    return null;
  }
}

/** Event Sentry minimal: jenis galat, pesan & stack tersamar, tag rute/aksi. Tanpa user/request. */
export function buildEvent(err: unknown, context: { area?: string } = {}, environment = 'production') {
  const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Galat tanpa pesan');
  const frames = (e.stack ?? '')
    .split('\n')
    .slice(1, 30)
    .map((line) => ({ function: scrub(line.trim()) }))
    .reverse();
  return {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: Date.now() / 1000,
    platform: 'node',
    level: 'error',
    environment,
    exception: { values: [{ type: e.name, value: scrub(e.message), stacktrace: { frames } }] },
    tags: context.area ? { area: context.area.slice(0, 64) } : {},
  };
}

let dsnCache: Dsn | null | undefined;

/** Catat galat ke log server, dan ke Sentry bila dikonfigurasi. Tidak pernah melempar. */
export async function reportError(err: unknown, context: { area?: string } = {}): Promise<void> {
  try {
    const env = serverEnv();
    dsnCache ??= env.SENTRY_DSN ? parseDsn(env.SENTRY_DSN) : null;
    if (!dsnCache) return;
    const event = buildEvent(err, context, env.SENTRY_ENVIRONMENT ?? (env.isProduction ? 'production' : 'development'));
    const body = `${JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString() })}\n${JSON.stringify({ type: 'event' })}\n${JSON.stringify(event)}`;
    await fetch(dsnCache.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsnCache.publicKey}, sentry_client=rumah-pramuka/1.0`,
      },
      body,
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
  } catch {
    // Pelaporan galat tidak boleh menimbulkan galat baru.
  }
}

/**
 * Dipanggil dari instrumentation.ts: galat yang dicetak Next (render, Server Action,
 * route handler) lewat console.error + galat tak tertangkap ikut dilaporkan.
 */
export function installErrorForwarding(): void {
  if (!serverEnv().SENTRY_DSN) return;
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    original(...args);
    const err = args.find((a): a is Error => a instanceof Error);
    if (err) void reportError(err, { area: 'server' });
  };
  process.on('unhandledRejection', (reason) => void reportError(reason, { area: 'unhandledRejection' }));
}
