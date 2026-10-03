import { headers } from 'next/headers';

/** IP klien dari header proxy. Di produksi pastikan reverse proxy menimpa X-Forwarded-For. */
export function clientIp(): string {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export function userAgent(): string {
  return (headers().get('user-agent') ?? '').slice(0, 300);
}

/**
 * Pembatas laju in-memory (jendela geser). Cukup untuk satu instance;
 * ganti ke store bersama (Redis/database) bila aplikasi dijalankan lebih dari satu instance.
 */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return {
    /** true = permintaan ditolak. */
    limited(key: string): boolean {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      const blocked = recent.length >= max;
      if (!blocked) recent.push(now);
      hits.set(key, recent);
      return blocked;
    },
    reset(key: string) {
      hits.delete(key);
    },
  };
}
