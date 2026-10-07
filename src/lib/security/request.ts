import { headers } from 'next/headers';

/** IP klien dari header proxy. Di produksi pastikan reverse proxy menimpa X-Forwarded-For. */
export function clientIp(): string {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export function userAgent(): string {
  return (headers().get('user-agent') ?? '').slice(0, 300);
}

// Rate limit: src/lib/security/rate-limit.ts (bersama antar-instance, berbasis PostgreSQL).
