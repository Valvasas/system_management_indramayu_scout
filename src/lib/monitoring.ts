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
import { isIP } from 'node:net';
import { serverEnv } from './env';

const PATTERNS: [RegExp, string][] = [
  // Kredensial di URL apa pun (redis://u:p@…, https://u:p@…) sebelum pola lain memotong URL-nya.
  [/\b([a-z][a-z0-9+.-]*:\/\/)[^\s:@/]+:[^\s@/]+@/gi, '$1[kredensial]@'],
  [/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[token]'],
  [/\bauthorization\s*[:=]\s*(?:[a-z]+\s+)?\S+/gi, '[rahasia]'],
  [/\b\w*(?:token|secret|passw(?:or)?d|api[_-]?key|sandi)\w*\s*[:=]\s*\S+/gi, '[rahasia]'],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[pos-el]'],
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]'],
  // Telepon Indonesia dalam berbagai penulisan: 0812…, +62 812-…, (0812) 3456-7890, 62 812 3456 7890.
  // Per kelompok digit (3–4) agar tidak "menelan" awal nomor berikutnya yang berdekatan.
  [/(?:\+62|\b62|\(?\b0)[\s.-]?8\d{1,3}\)?(?:[\s.-]?\d{3,4}){1,2}/g, '[telepon]'],
  [/\b\d{10,}\b/g, '[angka]'],
  [/\b[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}\b/g, '[kode]'],
  [/\b(?:bearer|token|secret|password|sandi|kata sandi)\b\s*[:=]?\s*\S+/gi, '[rahasia]'],
  [/(postgres(?:ql)?:\/\/)[^\s'"]+/gi, '$1[disamarkan]'],
  [/(https?:\/\/[^\s?#'"]+)[?#][^\s'"]*/gi, '$1'],
];

/** IPv6 (termasuk bentuk ringkas `2001:db8::1`) — kandidat divalidasi node:net agar jam/baris stack tidak ikut. */
const IPV6_CANDIDATE = /(?<![\w:])(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}(?:%\w+)?(?![\w:])/gi;

/** Samarkan data pribadi & rahasia dari teks bebas (pesan galat, stack trace). */
export function scrub(text: string): string {
  const ipv6 = text.replace(IPV6_CANDIDATE, (m) => (isIP(m.split('%')[0]) === 6 ? '[ip]' : m));
  return PATTERNS.reduce((t, [re, replacement]) => t.replace(re, replacement), ipv6).slice(0, 4000);
}

/**
 * Pesan yang aman dikirim. DrizzleQueryError membawa SEMUA nilai parameter kueri di pesannya
 * (`Failed query: …\nparams: Dimas Pratama,2012-05-04,…`) — nama & tanggal lahir anak tidak
 * tertangkap pola apa pun. Untuk galat kueri hanya teks SQL (berparameter) + kode galat PostgreSQL.
 */
function safeMessage(e: Error): string {
  const q = e as Error & { query?: unknown; params?: unknown; cause?: { code?: unknown; constraint?: unknown } };
  if (typeof q.query === 'string' && 'params' in q) {
    const code = typeof q.cause?.code === 'string' ? q.cause.code : null;
    const constraint = typeof q.cause?.constraint === 'string' ? q.cause.constraint : null;
    return `Failed query: ${q.query}${code ? ` [pg ${code}${constraint ? ` ${constraint}` : ''}]` : ''}`;
  }
  if (/^Failed query:/.test(e.message)) return e.message.split('\nparams:')[0];
  return e.message;
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
  // Hanya baris "at …": baris lanjutan pesan multi-baris (mis. "params: …") ikut tercetak di stack.
  const frames = (e.stack ?? '')
    .split('\n')
    .filter((line) => /^\s*at /.test(line))
    .slice(0, 30)
    .map((line) => ({ function: scrub(line.trim()) }))
    .reverse();
  return {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: Date.now() / 1000,
    platform: 'node',
    level: 'error',
    environment,
    exception: { values: [{ type: e.name, value: scrub(safeMessage(e)), stacktrace: { frames } }] },
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
